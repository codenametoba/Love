import "server-only";
import { sectionImage } from "./media";
import { db, operationsConfigured } from "./supabase";
import type { Section, Window } from "./types";
export async function availability(
  date: string,
  guests: number,
  eventId?: string,
) {
  if (!operationsConfigured())
    return {
      windows: [] as Window[],
      sections: [] as Section[],
      configured: false,
    };
  const client = db();
  const now = new Date().toISOString();
  const { data: windows, error } = await client
    .from("booking_windows")
    .select(
      "id,title,starts_at,ends_at,arrival_start,arrival_end,event_id,lead_minutes,booking_deadline",
    )
    .eq("published", true)
    .gt("booking_deadline", now)
    .gt("starts_at", now)
    .order("starts_at")
    .limit(120);
  if (error) throw error;
  const filtered = (windows || []).filter(
    (w) =>
      (!eventId || w.event_id === eventId) &&
      (!date ||
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Indiana/Indianapolis",
        }).format(new Date(w.starts_at)) === date) &&
      new Date(w.starts_at).getTime() - w.lead_minutes * 60000 > Date.now(),
  );
  return { windows: filtered, sections: [] as Section[], configured: true };
}
export async function sectionsForWindow(
  windowId: string,
  guests: number,
): Promise<Section[]> {
  const client = db();
  const { data: w } = await client
    .from("booking_windows")
    .select("*")
    .eq("id", windowId)
    .eq("published", true)
    .single();
  if (
    !w ||
    new Date(w.booking_deadline) < new Date() ||
    new Date(w.starts_at).getTime() - w.lead_minutes * 60000 <= Date.now()
  )
    return [];
  if (w.event_id) {
    const { data: e } = await client
      .from("events")
      .select("cancelled")
      .eq("id", w.event_id)
      .single();
    if (!e || e.cancelled) return [];
  }
  const [
    { data: sections, error },
    { data: rules, error: rulesError },
    { data: holds, error: holdsError },
    { data: blackouts, error: blackoutsError },
    { data: overrides, error: overridesError },
    { data: layouts, error: layoutsError },
  ] = await Promise.all([
    client
      .from("sections")
      .select("*")
      .eq("published", true)
      .gte("capacity", guests),
    client
      .from("availability_rules")
      .select("section_id")
      .eq("window_id", windowId)
      .eq("enabled", true),
    client
      .from("inventory_holds")
      .select("section_id,period,expires_at")
      .eq("active", true)
      .overlaps("period", `[${w.starts_at},${w.ends_at})`),
    client
      .from("blackouts")
      .select("section_id")
      .overlaps("period", `[${w.starts_at},${w.ends_at})`),
    w.event_id
      ? client
          .from("event_section_rules")
          .select("*")
          .eq("event_id", w.event_id)
      : Promise.resolve({ data: [], error: null }),
    client.from("section_layouts").select("id").eq("verified", true),
  ]);
  const failure =
    error ||
    rulesError ||
    holdsError ||
    blackoutsError ||
    overridesError ||
    layoutsError;
  if (failure) throw failure;
  if (blackouts?.some((b) => !b.section_id)) return [];
  return Promise.all(
    (sections || [])
      .filter(
        (s) =>
          rules?.some((r) => r.section_id === s.id) &&
          (!w.event_id ||
            overrides?.some((o) => o.section_id === s.id && o.eligible)),
      )
      .map(async (s) => {
        const o = overrides?.find((o) => o.section_id === s.id);
        return {
          ...s,
          image_url: await sectionImage(s.image_url),
          deposit_cents: o?.deposit_cents ?? s.deposit_cents,
          minimum_spend_cents: o?.minimum_spend_cents ?? s.minimum_spend_cents,
          policy: o?.policy || s.policy,
          layout: layouts?.some((l) => l.id === s.layout_id)
            ? s.layout
            : undefined,
          available:
            !blackouts?.some((b) => b.section_id === s.id) &&
            !holds?.some(
              (h) =>
                h.section_id === s.id &&
                (!h.expires_at || new Date(h.expires_at) > new Date()),
            ),
        };
      }),
  );
}
