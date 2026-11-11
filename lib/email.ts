import "server-only";
import { Resend } from "resend";
import { db, rpc } from "./supabase";
import { money, venueDate } from "./types";
export const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
type Notification = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
};
export function notificationEmail(kind: string, p: Record<string, unknown>) {
  const ref = p.reference ? ` · ${p.reference}` : "";
  const copy: Record<string, [string, string]> = {
    request: [
      `Your request is in${ref}`,
      "Our team will review the details and contact you with the next step. This is a request, not a confirmed reservation. No payment is due yet.",
    ],
    approved: [
      `Your section request is approved${ref}`,
      "Your section is temporarily held. Pay the deposit before the deadline below to confirm.",
    ],
    confirmed: [
      `We’ll see you there${ref}`,
      "Your deposit has been verified and your section is confirmed.",
    ],
    expired: [
      `Your payment window has closed${ref}`,
      "The temporary hold has expired and the section has been released. Contact management to explore current availability.",
    ],
    payment_exception: [
      `Your payment needs attention${ref}`,
      "Management needs to review your payment. This payment has not confirmed a new booking. The team will contact you about a refund or resolution.",
    ],
    decline: [
      `An update on your request${ref}`,
      "The team could not approve this request. No reservation has been confirmed.",
    ],
    cancel: [
      `Your booking was cancelled${ref}`,
      "Your reservation has been cancelled. Refund eligibility is subject to the agreed policy and management review.",
    ],
    rescheduled: [
      `Your plans have changed${ref}`,
      "Management updated your reservation. Review your updated details using your secure reservation link, or request a fresh access link from the website.",
    ],
    inquiry: [
      "Your idea is in good company",
      "Your private gathering inquiry is in. Our team will explore the possibilities and get in touch. This is not a confirmed booking.",
    ],
    access: [
      `Your secure reservation link${ref}`,
      "Use the link below to view your reservation. This link expires in 30 days. Keep it private.",
    ],
    management: [
      `LOVE operations${ref}`,
      String(p.message || "A request requires your attention."),
    ],
  };
  const [subject, body] = copy[kind] || [
    "An update from LOVE",
    "Check your reservation for the latest details.",
  ];
  const facts = [
    ["Reference", p.reference],
    ["Guest", p.name],
    [
      "Arrival",
      p.arrival
        ? venueDate(String(p.arrival), {
            dateStyle: "full",
            timeStyle: "short",
          })
        : null,
    ],
    ["Section", p.section],
    ["Guests", p.guests],
    ["Deposit", typeof p.deposit === "number" ? money(p.deposit) : null],
    ["Minimum spend", typeof p.minimum === "number" ? money(p.minimum) : null],
    [
      "Payment deadline",
      p.expires
        ? venueDate(String(p.expires), {
            dateStyle: "full",
            timeStyle: "short",
          })
        : null,
    ],
  ].filter((f) => f[1] != null);
  const text = [
    subject,
    body,
    ...facts.map(([k, v]) => `${k}: ${v}`),
    p.policy ? `Booking conditions: ${p.policy}` : "",
    p.url ? `View your reservation: ${p.url}` : "",
    p.message && kind !== "management" ? String(p.message) : "",
    "All times are local to Indianapolis.",
  ]
    .filter(Boolean)
    .join("\n\n");
  const html = `<!doctype html><html><body style="margin:0;background:#170f20;color:#f0e9de;font-family:Arial,sans-serif;padding:40px 20px"><div style="max-width:560px;margin:auto"><div style="font-size:42px;font-weight:900;letter-spacing:-4px;color:#d9f36a">LOVE.</div><h1 style="font-size:28px;line-height:1.1;margin-top:40px">${escapeHtml(subject)}</h1><p style="line-height:1.8">${escapeHtml(body)}</p>${facts.map(([k, v]) => `<p><span style="color:#b9afc0">${escapeHtml(k)}</span><br/>${escapeHtml(v)}</p>`).join("")}${p.policy ? `<p style="line-height:1.8"><strong>Booking conditions</strong><br/>${escapeHtml(p.policy)}</p>` : ""}${p.url ? `<p><a style="display:inline-block;background:#d9f36a;color:#170f20;padding:18px 24px;text-decoration:none" href="${escapeHtml(p.url)}">VIEW YOUR RESERVATION ↗</a></p>` : ""}<p style="font-size:11px;color:#b9afc0;margin-top:35px">Indianapolis, Indiana. All times are local to the venue.<br/>Keep your secure reservation link private.</p></div></body></html>`;
  return { subject, text, html };
}
export async function deliverNotifications() {
  if (
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM ||
    !process.env.MANAGEMENT_EMAIL
  )
    throw new Error("Email delivery is not configured.");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const jobs = await rpc<Notification[]>("claim_notifications");
  let sent = 0,
    failed = 0;
  for (const job of jobs) {
    try {
      const to =
        job.kind === "management"
          ? process.env.MANAGEMENT_EMAIL
          : String(job.payload.email || "");
      if (!to) throw new Error("Missing recipient");
      const message = notificationEmail(job.kind, job.payload);
      const result = await resend.emails.send(
        {
          from: process.env.EMAIL_FROM,
          to,
          replyTo: process.env.MANAGEMENT_EMAIL,
          ...message,
        },
        { idempotencyKey: `love-notification-${job.id}` },
      );
      if (result.error) throw new Error(result.error.message);
      const { error } = await db()
        .from("notifications")
        .update({ delivered_at: new Date().toISOString(), last_error: null })
        .eq("id", job.id);
      if (error) throw error;
      sent++;
    } catch {
      failed++;
      await db()
        .from("notifications")
        .update({
          last_error: "Delivery failed. Check Resend and sender configuration.",
          lease_until: new Date(Date.now() + 15 * 60000).toISOString(),
        })
        .eq("id", job.id);
    }
  }
  return { sent, failed };
}
