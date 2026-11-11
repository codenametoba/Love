"use client";
import { useState } from "react";
import { Field } from "./ui";
export function CustomerActions({
  token,
  canPay,
}: {
  token: string;
  canPay: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <div aria-live="polite">
        {message && <div className="form-message success">{message}</div>}
        {error && (
          <div className="form-message error" role="alert">
            {error}
          </div>
        )}
      </div>
      {canPay && (
        <button
          disabled={busy}
          className="button"
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const r = await fetch(`/api/reservation/${token}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{}",
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              const url = new URL(d.url);
              if (
                url.hostname !== "checkout.stripe.com" ||
                url.protocol !== "https:"
              )
                throw new Error("Invalid secure payment link.");
              window.location.assign(d.url);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Please try again.");
              setBusy(false);
            }
          }}
        >
          {busy ? "OPENING SECURE CHECKOUT…" : "PAY DEPOSIT SECURELY ↗"}
        </button>
      )}
      <details className="admin-section">
        <summary>Change of plans? Contact the team.</summary>
        <form
          style={{ marginTop: 25 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            setBusy(true);
            setError("");
            try {
              const r = await fetch(`/api/reservation/${token}/change`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              setMessage(
                "Your request has been sent to management. Your current booking remains unchanged until the team responds.",
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : "Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-grid">
            <Field label="How can we help?">
              <select name="kind">
                <option value="contact">Contact management</option>
                <option value="date-change">Request a date change</option>
                <option value="cancellation">Request cancellation</option>
              </select>
            </Field>
            <div className="full">
              <Field label="Your message">
                <textarea
                  name="message"
                  required
                  minLength={5}
                  maxLength={2000}
                />
              </Field>
            </div>
          </div>
          <button disabled={busy} className="button" style={{ marginTop: 20 }}>
            SEND REQUEST ↗
          </button>
          <p className="small-note">
            Changes require management approval and availability. A cancellation
            request does not automatically cancel your reservation or issue a
            refund.
          </p>
        </form>
      </details>
    </>
  );
}
