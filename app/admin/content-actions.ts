"use server";
import { staff, rpc } from "@/lib/supabase";
import { content } from "@/lib/content";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/components/admin-form";
export async function syncEventAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(["owner", "manager"]);
    const id = z.string().min(1).max(200).parse(form.get("sanity_id"));
    const { events } = await content();
    const e = events.find((e) => e._id === id);
    if (!e) throw new Error("Published event not found.");
    z.iso.datetime({ offset: true }).parse(e.start);
    z.iso.datetime({ offset: true }).parse(e.end);
    if (new Date(e.end) <= new Date(e.start))
      throw new Error("Event end must follow start.");
    const eventId = await rpc<string>("sync_event", {
      p_actor: user.id,
      p_sanity_id: id,
      p_title: e.title,
      p_start: e.start,
      p_end: e.end,
    });
    revalidatePath("/admin/schedule");
    return {
      success: `Synchronized. Operational event UUID: ${eventId}. Copy this into Sanity and republish.`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not synchronize." };
  }
}
export async function eventOverrideAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(["owner", "manager"]);
    const deposit = z.coerce
      .number()
      .int()
      .positive()
      .parse(form.get("deposit"));
    const minimum = z.coerce
      .number()
      .int()
      .min(deposit)
      .parse(form.get("minimum"));
    await rpc("event_section_override", {
      p_actor: user.id,
      p_event: z.uuid().parse(form.get("event")),
      p_section: z.uuid().parse(form.get("section")),
      p_deposit: deposit,
      p_minimum: minimum,
      p_policy: z.string().min(21).max(3000).parse(form.get("policy")),
      p_eligible: form.get("eligible") === "on",
    });
    revalidatePath("/admin/schedule");
    return {
      success:
        "Event override saved. Existing reservation terms remain unchanged.",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
}
