import { notFound } from "next/navigation";
import { db, pageStaff as staff } from "@/lib/supabase";
import { Reservation, money, venueDate } from "@/lib/types";
import { Field } from "@/components/ui";
import { AdminForm } from "@/components/admin-form";
import { bookingAction, rescheduleAction } from "../../../actions";
export default async function Booking({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await staff(["owner", "manager", "reservations"]);
  const { id } = await params;
  const { data } = await db()
    .from("reservations")
    .select("*,sections(name),booking_windows(*)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const r = data as Reservation;
  const [
    { data: activity },
    { data: changes },
    { data: sections },
    { data: windows },
  ] = await Promise.all([
    db()
      .from("reservation_activity")
      .select("*")
      .eq("reservation_id", id)
      .order("created_at", { ascending: false }),
    db()
      .from("customer_changes")
      .select("*")
      .eq("reservation_id", id)
      .order("created_at", { ascending: false }),
    db().from("sections").select("id,name").eq("published", true),
    db()
      .from("booking_windows")
      .select("id,title,starts_at")
      .eq("published", true)
      .gt("starts_at", new Date().toISOString()),
  ]);
  return (
    <>
      <span className="eyebrow">RESERVATION / {r.reference}</span>
      <h1>{r.name}</h1>
      <span className={`status-badge status-${r.status}`}>
        {r.status.replaceAll("_", " ")}
      </span>
      <dl className="detail-list" style={{ marginTop: 25, maxWidth: 800 }}>
        {[
          ["EMAIL", r.email],
          ["PHONE", r.phone],
          ["SECTION", r.sections?.name],
          ["PARTY", r.guests],
          [
            "ARRIVAL",
            venueDate(r.arrival, { dateStyle: "full", timeStyle: "short" }),
          ],
          ["DEPOSIT", money(r.deposit_cents)],
          ["MINIMUM SPEND", money(r.minimum_spend_cents)],
          [
            "HOLD EXPIRES",
            r.hold_expires_at
              ? venueDate(r.hold_expires_at, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—",
          ],
          ["OCCASION", r.occasion],
          ["REQUESTS", r.requests || "—"],
          [
            "CHECK-IN",
            r.checked_in_at
              ? venueDate(r.checked_in_at, { timeStyle: "short" })
              : "—",
          ],
          ["NO-SHOW", r.no_show ? "Yes" : "No"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="review-policy">{r.policy}</div>
      <div className="admin-section">
        <h2>Manage this reservation.</h2>
        <AdminForm action={bookingAction} label="APPLY ACTION">
          <input type="hidden" name="id" value={id} />
          <div className="form-grid">
            <Field label="Action">
              <select name="action">
                {r.status === "PENDING_APPROVAL" && (
                  <>
                    <option value="approve">Approve & send deposit link</option>
                    <option value="decline">Decline request</option>
                  </>
                )}
                {r.status === "CONFIRMED" && (
                  <>
                    <option value="check-in">Record check-in</option>
                    <option value="no-show">Mark no-show</option>
                  </>
                )}
                <option value="note">Add internal note</option>
                {!["CANCELLED", "DECLINED"].includes(r.status) && (
                  <option value="cancel">Cancel booking / request</option>
                )}
              </select>
            </Field>
            <Field label="Note (shown to guest when declining or cancelling)">
              <textarea name="note" maxLength={2000} />
            </Field>
          </div>
        </AdminForm>
      </div>
      {["PENDING_APPROVAL", "CONFIRMED"].includes(r.status) && (
        <details className="admin-section">
          <summary>Change section or date</summary>
          <p className="small-note">
            Get the guest’s agreement first. The new section is checked
            transactionally. Different deposit, minimum spend, or terms require
            a new request.
          </p>
          <AdminForm
            action={rescheduleAction}
            label="CHECK INVENTORY & RESCHEDULE"
          >
            <input type="hidden" name="id" value={id} />
            <div className="form-grid">
              <Field label="Section">
                <select name="section" defaultValue={r.section_id}>
                  {sections?.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Booking night">
                <select name="window" defaultValue={r.window_id}>
                  {windows?.map((w) => (
                    <option value={w.id} key={w.id}>
                      {w.title} · {venueDate(w.starts_at)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Arrival (ISO 8601 with timezone)">
                <input name="arrival" defaultValue={r.arrival} required />
              </Field>
            </div>
          </AdminForm>
        </details>
      )}
      <section className="admin-section">
        <h2>Guest requests.</h2>
        {changes?.map((c) => (
          <div className="form-message" key={c.id}>
            <strong>
              {c.kind} · {venueDate(c.created_at)}
            </strong>
            <p>{c.message}</p>
          </div>
        ))}
        {!changes?.length && <p>No change requests.</p>}
      </section>
      <section className="admin-section">
        <h2>Activity.</h2>
        <div className="list-rows">
          {activity?.map((a) => (
            <div key={a.id}>
              <span>
                {a.action}
                <br />
                <small className="muted">{a.note}</small>
              </span>
              <span className="muted">
                {venueDate(a.created_at, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
