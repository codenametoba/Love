"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Section, Window, money, venueDate } from "@/lib/types";
import { Field, Action } from "./ui";
import { BotCheck } from "./turnstile";
export function ReservationFlow({
  initialDate = "",
  initialGuests = 4,
  eventId = "",
}: {
  initialDate?: string;
  initialGuests?: number;
  eventId?: string;
}) {
  const requestId = useRef<string | undefined>(undefined);
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(initialDate);
  const [guests, setGuests] = useState(initialGuests);
  const [windows, setWindows] = useState<Window[]>([]);
  const [window, setWindow] = useState<Window | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selected, setSelected] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(true);
  const [view, setView] = useState("list");
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    arrival: "",
    occasion: "Group Night Out",
    requests: "",
  });
  const [accepted, setAccepted] = useState(false);
  const [bot, setBot] = useState("");
  const [sent, setSent] = useState<{ reference: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setWindow(null);
    setSelected(null);
    setSections([]);
    fetch(`/api/availability?date=${date}&guests=${guests}&event=${eventId}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setConfigured(d.configured);
        setWindows(d.windows);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, guests, eventId]);
  useEffect(() => {
    if (!window) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setSelected(null);
    setSections([]);
    setDetails((d) => ({ ...d, arrival: window.arrival_start }));
    fetch(`/api/availability?window=${window.id}&guests=${guests}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setSections(d.sections);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [window, guests]);
  const slots: string[] = [];
  if (window) {
    for (
      let t = new Date(window.arrival_start).getTime();
      t <= new Date(window.arrival_end).getTime();
      t += 15 * 60000
    )
      slots.push(new Date(t).toISOString());
  }
  const hasPlan =
    sections.length > 0 &&
    sections.every((s) => s.layout && s.layout_id === sections[0].layout_id);
  const canSelect = window && selected?.available;
  async function submit() {
    if (!window || !selected || !accepted) return;
    setSubmitting(true);
    setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const r = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          requestId: requestId.current,
          sectionId: selected.id,
          windowId: window.id,
          guests,
          accepted,
          bot,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSent(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  if (sent)
    return (
      <div className="form-message success" role="status">
        <span className="eyebrow">PENDING MANAGEMENT APPROVAL</span>
        <h2 style={{ fontSize: 36, margin: "22px 0" }}>Your request is in.</h2>
        <p>
          Our team will review the details and contact you with the next step.
          Your reservation is not confirmed, and no payment is due yet.
        </p>
        <p style={{ marginTop: 20 }}>
          Reference:{" "}
          <strong style={{ color: "var(--accent)" }}>{sent.reference}</strong>
        </p>
        <p className="small-note">
          We’ll email you a secure link to follow your request. If approved,
          you’ll receive a deposit payment link and deadline.
        </p>
        <Action href="/events" secondary>
          KEEP EXPLORING
        </Action>
      </div>
    );
  return (
    <>
      <ol className="reservation-steps" aria-label="Booking progress">
        {["THE NIGHT", "YOUR SECTION", "THE DETAILS", "REVIEW"].map((s, i) => (
          <li
            className={i === step ? "active" : ""}
            aria-current={i === step ? "step" : undefined}
            key={s}
          >
            {s}
          </li>
        ))}
      </ol>
      <div className="reservation-grid">
        <div>
          {error && (
            <div className="form-message error" role="alert">
              {error}
            </div>
          )}
          {step === 0 && (
            <>
              <h2 className="form-heading">First, find your night.</h2>
              <div className="form-grid">
                <Field label="Preferred date">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toLocaleDateString("en-CA", {
                      timeZone: "America/Indiana/Indianapolis",
                    })}
                  />
                </Field>
                <Field label="Number of guests">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={guests}
                    onChange={(e) =>
                      setGuests(
                        Math.max(
                          1,
                          Math.min(1000, Number(e.target.value) || 1),
                        ),
                      )
                    }
                  />
                </Field>
              </div>
              {loading ? (
                <div className="form-message" role="status">
                  Finding your night…
                </div>
              ) : !windows.length ? (
                <div className="form-message">
                  <h3 style={{ fontSize: 22, marginBottom: 12 }}>
                    {configured
                      ? "No nights available for this selection."
                      : "Reservations are getting ready."}
                  </h3>
                  <p>
                    {configured
                      ? "Try another date to find an available evening."
                      : "Our team is preparing the sections and booking schedule. Availability will appear here once reservations open."}
                  </p>
                  <Action href="/private-events" secondary>
                    ASK ABOUT A GATHERING
                  </Action>
                </div>
              ) : (
                <div
                  className="booking-section-list"
                  aria-label="Bookable nights"
                >
                  {windows.map((w) => (
                    <button
                      className="section-option"
                      type="button"
                      aria-pressed={window?.id === w.id}
                      key={w.id}
                      onClick={() => setWindow(w)}
                    >
                      <span className="eyebrow">
                        {venueDate(w.starts_at, { dateStyle: "full" })}
                      </span>
                      <h3>{w.title}</h3>
                      <span className="section-meta">
                        Arrival:{" "}
                        {venueDate(w.arrival_start, { timeStyle: "short" })}–
                        {venueDate(w.arrival_end, { timeStyle: "short" })} ·
                        Indianapolis time
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="step-actions">
                <span />
                <button
                  className="button"
                  disabled={!window || loading}
                  onClick={() => setStep(1)}
                >
                  EXPLORE SECTIONS <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="form-heading">Find your corner.</h2>
              <p>
                Choose a section that fits your group. Availability is checked
                again when you request and when management approves.
              </p>
              {hasPlan && (
                <div className="filter-tabs" style={{ marginTop: 20 }}>
                  {["list", "map"].map((v) => (
                    <button
                      key={v}
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                    >
                      {v === "map" ? "Floor plan" : "Section list"}
                    </button>
                  ))}
                </div>
              )}
              {loading ? (
                <p role="status">Checking sections…</p>
              ) : !sections.length ? (
                <div className="form-message">
                  No sections fit this group on this night. Try another date or
                  party size.
                </div>
              ) : view === "map" && hasPlan ? (
                <div
                  className="floor-plan"
                  aria-label="Verified venue floor plan"
                >
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      disabled={!s.available}
                      aria-pressed={selected?.id === s.id}
                      onClick={() => setSelected(s)}
                      style={{
                        left: `${s.layout!.x}%`,
                        top: `${s.layout!.y}%`,
                        width: `${s.layout!.width}%`,
                        height: `${s.layout!.height}%`,
                      }}
                    >
                      {s.name}
                      <br />
                      {s.available
                        ? selected?.id === s.id
                          ? "SELECTED"
                          : "AVAILABLE"
                        : "UNAVAILABLE"}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="booking-section-list">
                  {sections.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className="section-option"
                      aria-pressed={selected?.id === s.id}
                      disabled={!s.available}
                      onClick={() => setSelected(s)}
                    >
                      {s.image_url && (
                        <div className="section-option-image">
                          <Image
                            src={s.image_url}
                            alt={s.name}
                            fill
                            sizes="60vw"
                          />
                        </div>
                      )}
                      <span className="section-option-top">
                        <span className="eyebrow">
                          UP TO {s.capacity} GUESTS
                        </span>
                        <strong>
                          {s.available
                            ? selected?.id === s.id
                              ? "SELECTED"
                              : "AVAILABLE"
                            : "UNAVAILABLE"}
                        </strong>
                      </span>
                      <h3>{s.name}</h3>
                      <p>{s.description}</p>
                      <div className="section-meta">
                        <span>
                          {money(s.deposit_cents)} deposit after approval
                        </span>
                        <span>
                          {money(s.minimum_spend_cents)} minimum spend
                        </span>
                      </div>
                      <p>{s.amenities.join(" · ")}</p>
                    </button>
                  ))}
                </div>
              )}
              {selected && (
                <div className="review-policy">
                  <strong>Booking conditions</strong>
                  <p>{selected.policy}</p>
                </div>
              )}
              <div className="step-actions">
                <button
                  className="button button-outline"
                  onClick={() => setStep(0)}
                >
                  BACK
                </button>
                <button
                  className="button"
                  disabled={!canSelect}
                  onClick={() => setStep(2)}
                >
                  YOUR DETAILS <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(3);
              }}
            >
              <h2 className="form-heading">Make it yours.</h2>
              <div className="form-grid">
                <Field label="Full name">
                  <input
                    autoComplete="name"
                    value={details.name}
                    required
                    minLength={2}
                    maxLength={120}
                    onChange={(e) =>
                      setDetails({ ...details, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Email address">
                  <input
                    type="email"
                    autoComplete="email"
                    value={details.email}
                    required
                    maxLength={254}
                    onChange={(e) =>
                      setDetails({ ...details, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={details.phone}
                    required
                    minLength={7}
                    maxLength={30}
                    pattern="[+0-9\s().\-]+"
                    onChange={(e) =>
                      setDetails({ ...details, phone: e.target.value })
                    }
                  />
                </Field>
                <Field label="Arrival time (Indianapolis)">
                  <select
                    value={details.arrival}
                    required
                    onChange={(e) =>
                      setDetails({ ...details, arrival: e.target.value })
                    }
                  >
                    {slots.map((t) => (
                      <option value={t} key={t}>
                        {venueDate(t, { timeStyle: "short" })}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Occasion">
                  <select
                    value={details.occasion}
                    onChange={(e) =>
                      setDetails({ ...details, occasion: e.target.value })
                    }
                  >
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
                  <Field label="Anything else? (optional)">
                    <textarea
                      maxLength={2000}
                      value={details.requests}
                      onChange={(e) =>
                        setDetails({ ...details, requests: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
              <div className="step-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setStep(1)}
                >
                  BACK
                </button>
                <button className="button">
                  REVIEW REQUEST <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}
          {step === 3 && (
            <>
              <h2 className="form-heading">One last look.</h2>
              <p>
                This is a reservation request. Management reviews it first;
                you’ll only be asked to pay a deposit after approval.
              </p>
              <dl className="detail-list" style={{ marginTop: 20 }}>
                {[
                  ["GUEST", details.name],
                  ["EMAIL", details.email],
                  [
                    "ARRIVAL",
                    venueDate(details.arrival, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  ],
                  ["OCCASION", details.occasion],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="review-policy">
                <strong>Booking conditions</strong>
                <p>{selected?.policy}</p>
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  I’ve reviewed the deposit, minimum spend, and booking
                  conditions, and agree to the{" "}
                  <a href="/privacy" style={{ textDecoration: "underline" }}>
                    privacy notice
                  </a>
                  . I understand this request is subject to management approval.
                </span>
              </label>
              <div style={{ marginTop: 20 }}>
                <BotCheck onToken={setBot} />
              </div>
              <div className="step-actions">
                <button
                  className="button button-outline"
                  disabled={submitting}
                  onClick={() => setStep(2)}
                >
                  EDIT DETAILS
                </button>
                <button
                  className="button"
                  disabled={!accepted || submitting}
                  onClick={submit}
                >
                  {submitting ? "SENDING…" : "SEND REQUEST"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
        <aside className="booking-summary" aria-label="Your night summary">
          <span className="eyebrow">YOUR NIGHT, AT A GLANCE</span>
          <h2>{window?.title || "The plans start here."}</h2>
          <dl className="detail-list">
            <div>
              <dt>NIGHT</dt>
              <dd>
                {window ? venueDate(window.starts_at) : date || "Choose a date"}
              </dd>
            </div>
            <div>
              <dt>PEOPLE</dt>
              <dd>{guests} guests</dd>
            </div>
            <div>
              <dt>SECTION</dt>
              <dd>{selected?.name || "Your choice"}</dd>
            </div>
            {selected && (
              <>
                <div>
                  <dt>DEPOSIT</dt>
                  <dd>{money(selected.deposit_cents)}</dd>
                </div>
                <div>
                  <dt>MIN. SPEND</dt>
                  <dd>{money(selected.minimum_spend_cents)}</dd>
                </div>
              </>
            )}
          </dl>
          <p>
            No payment today. Approval comes first, then a secure deposit link.
            A booking is confirmed only after verified payment.
          </p>
          <p className="small-note">All times are local to Indianapolis.</p>
        </aside>
      </div>
    </>
  );
}
