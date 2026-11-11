import { db, pageStaff as staff } from "@/lib/supabase";
import { money, venueDate } from "@/lib/types";
import { Field } from "@/components/ui";
import { AdminForm } from "@/components/admin-form";
import { refundAction } from "../../actions";
export default async function Payments() {
  await staff(["owner", "manager"]);
  const [
    { data: payments },
    { data: exceptions },
    { data: refunds },
    { data: notifications },
  ] = await Promise.all([
    db()
      .from("payments")
      .select("*,reservations(reference,status)")
      .order("created_at", { ascending: false })
      .limit(100),
    db()
      .from("payment_exceptions")
      .select("*,reservations(reference)")
      .is("resolved_at", null)
      .order("created_at", { ascending: false }),
    db()
      .from("refunds")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    db()
      .from("notifications")
      .select("id,kind,attempts,last_error,created_at")
      .is("delivered_at", null)
      .order("created_at")
      .limit(100),
  ]);
  return (
    <>
      <span className="eyebrow">PAYMENTS & EXCEPTIONS</span>
      <h1>Keep the details in order.</h1>
      {exceptions?.map((e) => (
        <div className="form-message error" key={e.id}>
          <strong>{e.reservations?.reference}</strong>
          <p>{e.reason}</p>
        </div>
      ))}
      <table className="admin-table">
        <thead>
          <tr>
            <th>REFERENCE</th>
            <th>AMOUNT</th>
            <th>STATUS</th>
            <th>PAID</th>
          </tr>
        </thead>
        <tbody>
          {payments?.map((p) => (
            <tr key={p.id}>
              <td>{p.reservations?.reference}</td>
              <td>{money(p.amount_cents)}</td>
              <td>{p.status}</td>
              <td>{venueDate(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <details className="admin-section">
        <summary>Issue a full deposit refund</summary>
        <p className="small-note">
          Review the agreed policy first. Cancel the booking before refunding a
          confirmed payment. Repeated submissions use the same provider
          idempotency key.
        </p>
        <AdminForm action={refundAction} label="SUBMIT FULL REFUND">
          <div className="form-grid">
            <Field label="Payment">
              <select name="payment_id" required>
                <option value="">Choose payment</option>
                {payments
                  ?.filter(
                    (p) =>
                      p.status !== "refunded" &&
                      (p.status === "exception" ||
                        p.reservations?.status === "CANCELLED"),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reservations?.reference} · {money(p.amount_cents)}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Reason">
              <input name="reason" minLength={5} maxLength={500} required />
            </Field>
          </div>
        </AdminForm>
      </details>
      <section className="admin-section">
        <h2>Refund history.</h2>
        {refunds?.map((r) => (
          <p className="notice-strip" key={r.id}>
            {r.stripe_refund_id} · {r.status} · {r.reason}
          </p>
        ))}
      </section>
      <section className="admin-section">
        <h2>Notification queue.</h2>
        {notifications?.map((n) => (
          <p className="notice-strip" key={n.id}>
            {n.kind} · {n.attempts} attempts · {n.last_error || "Queued"} ·{" "}
            {venueDate(n.created_at)}
          </p>
        ))}
        {!notifications?.length && <p>All caught up.</p>}
      </section>
    </>
  );
}
