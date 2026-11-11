import { pageStaff as staff, db } from "@/lib/supabase";
import { AdminForm } from "@/components/admin-form";
import { Field } from "@/components/ui";
import { manualAction } from "../../actions";
import { venueDate } from "@/lib/types";
export default async function Manual() {
  await staff(["owner", "manager", "reservations"]);
  const [{ data: sections }, { data: windows }] = await Promise.all([
    db().from("sections").select("id,name").eq("published", true),
    db()
      .from("booking_windows")
      .select("id,title,starts_at")
      .eq("published", true)
      .gt("booking_deadline", new Date().toISOString()),
  ]);
  return (
    <>
      <span className="eyebrow">MANUAL RESERVATION REQUEST</span>
      <h1>Make plans for a guest.</h1>
      <p className="notice-strip">
        Obtain the guest’s consent and share the section’s terms before
        submitting. Manual requests use the same validation, approval,
        allocation, and payment verification as online requests.
      </p>
      <AdminForm action={manualAction} label="CREATE REQUEST">
        <div className="form-grid">
          <Field label="Section">
            <select name="sectionId" required>
              <option value="">Select section</option>
              {sections?.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Booking night">
            <select name="windowId" required>
              <option value="">Select night</option>
              {windows?.map((w) => (
                <option value={w.id} key={w.id}>
                  {w.title} · {venueDate(w.starts_at)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Full name">
            <input name="name" required />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required />
          </Field>
          <Field label="Phone">
            <input name="phone" type="tel" required />
          </Field>
          <Field label="Guests">
            <input name="guests" type="number" min="1" max="1000" required />
          </Field>
          <Field label="Arrival (ISO timestamp with timezone)">
            <input
              name="arrival"
              placeholder="2026-12-12T21:00:00-05:00"
              required
            />
          </Field>
          <Field label="Occasion">
            <select name="occasion">
              {[
                "Birthday",
                "Celebration",
                "Group Night Out",
                "Anniversary",
                "Other",
              ].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <div className="full">
            <Field label="Special requests">
              <textarea name="requests" maxLength={2000} />
            </Field>
          </div>
          <label className="checkbox-row full">
            <input name="accepted" type="checkbox" required />
            Guest has reviewed and accepted the deposit, minimum spend,
            conditions, and privacy notice.
          </label>
        </div>
      </AdminForm>
    </>
  );
}
