import { accessibleReservation } from "@/lib/reservation";
import { PageIntro, Action } from "@/components/ui";
import { money, venueDate } from "@/lib/types";
import { CustomerActions } from "@/components/customer-actions";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your reservation",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
const messages = {
  PENDING_APPROVAL:
    "Your request is in. Our team will review the details and contact you with the next step.",
  AWAITING_PAYMENT:
    "Your request is approved. Complete your deposit before the deadline to confirm your section.",
  CONFIRMED:
    "Your deposit is verified and your section is confirmed. We’ll see you there.",
  EXPIRED:
    "The payment window has closed and the section hold has been released. Contact the team to explore availability.",
  DECLINED:
    "The team could not approve this request. No reservation has been confirmed.",
  CANCELLED:
    "This reservation has been cancelled. Any refund is subject to the applicable booking policy and management review.",
  PAYMENT_EXCEPTION:
    "Your payment needs a review by management. Your reservation is not confirmed. The team will contact you about a resolution.",
};
export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { token } = await params;
  const q = await searchParams;
  const r = await accessibleReservation(token);
  if (!r)
    return (
      <>
        <PageIntro
          index="↗"
          kicker="SECURE RESERVATION ACCESS"
          title="Access your reservation."
        >
          <p>
            This secure link is invalid or has expired. Use the latest link in
            your email, or request a fresh one below.
          </p>
        </PageIntro>
        <div className="page-content">
          <AccessRenewal />
          <div style={{ marginTop: 35 }}>
            <Action href="/visit" secondary>
              CONTACT THE TEAM
            </Action>
          </div>
        </div>
      </>
    );
  const expired =
    r.status === "AWAITING_PAYMENT" &&
    new Date(r.hold_expires_at || 0) <= new Date();
  const status = expired ? "EXPIRED" : r.status;
  return (
    <>
      <PageIntro
        index="↗"
        kicker={`RESERVATION / ${r.reference}`}
        title={
          status === "CONFIRMED"
            ? "Your section is confirmed."
            : "Your reservation details."
        }
      >
        <span className={`status-badge status-${status}`}>
          {status.replaceAll("_", " ")}
        </span>
        <p style={{ marginTop: 20 }}>{messages[status]}</p>
      </PageIntro>
      <div className="page-content">
        <div className="form-shell">
          {q.payment && status !== "CONFIRMED" && (
            <div className="form-message" role="status">
              Payment verification is handled securely by our payment provider.
              This page is not proof of payment. Refresh to see the latest
              verified status.
            </div>
          )}
          <dl className="detail-list">
            {[
              ["GUEST", r.name],
              [
                "NIGHT",
                r.booking_windows
                  ? venueDate(r.booking_windows.starts_at, {
                      dateStyle: "full",
                    })
                  : "Contact team",
              ],
              ["SECTION", r.sections?.name || "Section"],
              ["GUESTS", String(r.guests)],
              ["ARRIVAL", venueDate(r.arrival, { timeStyle: "short" })],
              [
                "DEPOSIT",
                `${money(r.deposit_cents)}${status === "CONFIRMED" ? " · verified paid" : ""}`,
              ],
              ["MINIMUM SPEND", money(r.minimum_spend_cents)],
              [
                "PAYMENT DEADLINE",
                r.hold_expires_at
                  ? venueDate(r.hold_expires_at, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "After approval",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="review-policy">
            <strong>Your booking conditions</strong>
            <p>{r.policy}</p>
          </div>
          <CustomerActions
            token={token}
            canPay={status === "AWAITING_PAYMENT"}
          />
        </div>
      </div>
    </>
  );
}
import { AccessRenewal } from "@/components/access-renewal";
