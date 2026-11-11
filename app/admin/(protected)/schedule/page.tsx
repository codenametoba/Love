import { eventOverrideAction } from "../../content-actions";
import { db, pageStaff as staff } from "@/lib/supabase";
import { AdminForm } from "@/components/admin-form";
import { Field } from "@/components/ui";
import { scheduleAction, blackoutAction, eventAction } from "../../actions";
import { venueDate } from "@/lib/types";
export default async function Schedule() {
  await staff(["owner", "manager"]);
  const [
    { data: sections },
    { data: windows },
    { data: events },
    { data: blackouts },
  ] = await Promise.all([
    db().from("sections").select("id,name").order("name"),
    db()
      .from("booking_windows")
      .select("*")
      .gt("ends_at", new Date().toISOString())
      .order("starts_at"),
    db()
      .from("events")
      .select("*")
      .eq("cancelled", false)
      .gt("ends_at", new Date().toISOString()),
    db().from("blackouts").select("*"),
  ]);
  return (
    <>
      <span className="eyebrow">AVAILABILITY</span>
      <h1>Open the right nights.</h1>
      <p className="notice-strip">
        Use ISO timestamps including a timezone offset, for example
        2026-12-12T21:00:00-05:00. Indianapolis changes offset with daylight
        saving time. Nights are closed unless explicitly published.
      </p>
      <div className="list-rows">
        {windows?.map((w) => (
          <div key={w.id}>
            <span>
              {w.title}
              <br />
              <small>
                {venueDate(w.starts_at, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </small>
            </span>
            <span>{w.published ? "Published" : "Draft"}</span>
          </div>
        ))}
      </div>
      <details className="admin-section">
        <summary>Add a booking night</summary>
        <AdminForm action={scheduleAction} label="CREATE BOOKING NIGHT">
          <div className="form-grid" style={{ marginTop: 25 }}>
            <Field label="Night title">
              <input name="title" required />
            </Field>
            <Field label="Operational event (optional)">
              <select name="event_id">
                <option value="">No event</option>
                {events?.map((e) => (
                  <option value={e.id} key={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </Field>
            {[
              "starts_at",
              "ends_at",
              "arrival_start",
              "arrival_end",
              "booking_deadline",
            ].map((key) => (
              <Field key={key} label={key.replaceAll("_", " ")}>
                <input
                  name={key}
                  placeholder="2026-12-12T21:00:00-05:00"
                  required
                />
              </Field>
            ))}
            <Field label="Minimum lead time (minutes)">
              <input
                name="lead_minutes"
                type="number"
                min="0"
                defaultValue="120"
              />
            </Field>
            <div className="full">
              <span className="eyebrow">ELIGIBLE SECTIONS</span>
              {sections?.map((s) => (
                <label
                  className="checkbox-row"
                  key={s.id}
                  style={{ marginTop: 10 }}
                >
                  <input name="sections" type="checkbox" value={s.id} />
                  {s.name}
                </label>
              ))}
            </div>
            <label className="checkbox-row">
              <input name="published" type="checkbox" />
              Publish this night
            </label>
          </div>
        </AdminForm>
      </details>
      <details className="admin-section">
        <summary>Block a date or section</summary>
        <AdminForm action={blackoutAction} label="BLOCK INVENTORY">
          <div className="form-grid" style={{ marginTop: 25 }}>
            <Field label="Section">
              <select name="section_id">
                <option value="">Entire venue</option>
                {sections?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reason">
              <input name="reason" required minLength={3} />
            </Field>
            <Field label="Start (ISO with timezone)">
              <input name="start" required />
            </Field>
            <Field label="End (ISO with timezone)">
              <input name="end" required />
            </Field>
          </div>
        </AdminForm>
      </details>
      {!!blackouts?.length && (
        <p className="notice-strip">
          {blackouts.length} blackout interval(s) configured. Existing live
          allocations cannot be blocked without resolving the booking first.
        </p>
      )}
      <section className="admin-section">
        <h2>Event operations.</h2>
        <p className="small-note">
          Scheduling data is synchronized explicitly from Sanity through Content
          studio. Event-section price and policy overrides live here in the
          operational database.
        </p>
        {events?.map((e) => (
          <details className="admin-section" key={e.id}>
            <summary>{e.title}</summary>
            <AdminForm
              action={eventOverrideAction}
              label="SAVE EVENT SECTION TERMS"
            >
              <input type="hidden" name="event" value={e.id} />
              <div className="form-grid" style={{ marginTop: 25 }}>
                <Field label="Section">
                  <select name="section" required>
                    {sections?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Deposit (cents)">
                  <input type="number" name="deposit" min="1" required />
                </Field>
                <Field label="Minimum spend (cents)">
                  <input type="number" name="minimum" min="1" required />
                </Field>
                <Field label="Event booking conditions">
                  <textarea name="policy" minLength={21} required />
                </Field>
                <label className="checkbox-row">
                  <input type="checkbox" name="eligible" defaultChecked />
                  Section eligible for event
                </label>
              </div>
            </AdminForm>
            <AdminForm
              action={eventAction}
              label="CANCEL EVENT & AFFECTED BOOKINGS"
            >
              <input type="hidden" name="id" value={e.id} />
              <p className="small-note">
                This releases sections, notifies guests, and flags paid bookings
                for refund review. It does not issue refunds automatically.
              </p>
            </AdminForm>
          </details>
        ))}
      </section>
    </>
  );
}
