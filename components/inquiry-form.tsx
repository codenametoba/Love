"use client";
import { useState } from "react";
import { Field } from "./ui";
import { BotCheck } from "./turnstile";
export function InquiryForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [bot, setBot] = useState("");
  return state === "sent" ? (
    <div className="form-message success" role="status">
      <h2 style={{ fontSize: 26, marginBottom: 15 }}>
        Your inquiry has reached the team.
      </h2>
      <p>
        We’ve received your inquiry. Our team will review it and get in touch.
        This is an inquiry, not a confirmed booking.
      </p>
    </div>
  ) : (
    <form
      className="form-shell"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setError("");
        const d = Object.fromEntries(new FormData(e.currentTarget));
        try {
          const r = await fetch("/api/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...d, guests: Number(d.guests), bot }),
          });
          const result = await r.json();
          if (!r.ok) throw new Error(result.error);
          setState("sent");
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not send. Please try again.",
          );
          setState("idle");
        }
      }}
    >
      <div className="form-grid">
        <Field label="Your name">
          <input name="name" autoComplete="name" required maxLength={120} />
        </Field>
        <Field label="Email address">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </Field>
        <Field label="Phone number">
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            maxLength={30}
          />
        </Field>
        <Field label="Preferred date">
          <input
            name="date"
            type="date"
            required
            min={new Date().toLocaleDateString("en-CA", {
              timeZone: "America/Indiana/Indianapolis",
            })}
          />
        </Field>
        <Field label="What are we celebrating?">
          <select name="eventType">
            {[
              "Birthday",
              "Private Celebration",
              "Corporate Event",
              "Group Gathering",
              "Other Occasion",
            ].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Estimated guests">
          <input name="guests" type="number" required min="2" max="1000" />
        </Field>
        <Field label="Budget (optional)">
          <input
            name="budget"
            maxLength={100}
            placeholder="A rough idea is fine"
          />
        </Field>
        <div className="full">
          <Field label="Tell us what you have in mind">
            <textarea name="message" required maxLength={3000} />
          </Field>
        </div>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="checkbox-row full">
          <input type="checkbox" required />{" "}
          <span>
            I’ve read the{" "}
            <a href="/privacy" style={{ textDecoration: "underline" }}>
              privacy notice
            </a>{" "}
            and agree to be contacted about this inquiry.
          </span>
        </label>
        <BotCheck onToken={setBot} />
      </div>
      {error && (
        <div role="alert" className="form-message error">
          {error}
        </div>
      )}
      <button
        className="button"
        style={{ marginTop: 25 }}
        disabled={state === "sending"}
      >
        {state === "sending" ? "SENDING…" : "SEND YOUR INQUIRY ↗"}
      </button>
      <p className="small-note">
        Our team will explore what’s possible. Submitting this form does not
        reserve the venue or guarantee a service.
      </p>
    </form>
  );
}
