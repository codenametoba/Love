"use client";
import { useState } from "react";
import { Field } from "./ui";
import { BotCheck } from "./turnstile";
export function AccessRenewal() {
  const [bot, setBot] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="form-shell"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const data = Object.fromEntries(new FormData(e.currentTarget));
        try {
          const r = await fetch("/api/access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, bot }),
          });
          const d = await r.json();
          setMsg(
            r.ok
              ? "If those details match a reservation, a new secure link will arrive by email."
              : d.error,
          );
        } catch {
          setMsg("Please try again later.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        <Field label="Reservation reference">
          <input name="reference" required maxLength={12} minLength={12} />
        </Field>
        <Field label="Email used to book">
          <input name="email" required type="email" />
        </Field>
      </div>
      <BotCheck onToken={setBot} />
      <button className="button" disabled={busy} style={{ marginTop: 20 }}>
        EMAIL A NEW LINK ↗
      </button>
      {msg && (
        <p className="form-message" role="status">
          {msg}
        </p>
      )}
    </form>
  );
}
