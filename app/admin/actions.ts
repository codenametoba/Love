"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, staff, rpc, Role } from "@/lib/supabase";
import { newAccess } from "@/lib/security";
import { stripe } from "@/lib/stripe";
import { allowedImage } from "@/lib/media";
import { randomUUID } from "node:crypto";
import type { ActionResult } from "@/components/admin-form";
const ops: Role[] = ["owner", "manager", "reservations"];
const finance: Role[] = ["owner", "manager"];
const id = (form: FormData, key = "id") => z.uuid().parse(form.get(key));
const text = (f: FormData, k: string, max = 2000) =>
  z
    .string()
    .max(max)
    .parse(f.get(k) || "");
function result(error: unknown): ActionResult {
  return {
    error:
      error instanceof Error ? error.message : "Could not complete the action.",
  };
}
async function audit(
  actor: string,
  action: string,
  entity_id: string,
  details: Record<string, unknown> = {},
) {
  const { error } = await db()
    .from("audit_logs")
    .insert({ actor_id: actor, action, entity_id, details });
  if (error) throw error;
}
export async function bookingAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(ops);
    const booking = id(form);
    const action = z
      .enum(["approve", "decline", "cancel", "check-in", "no-show", "note"])
      .parse(form.get("action"));
    if (action === "approve") {
      if (
        !process.env.STRIPE_SECRET_KEY ||
        !process.env.STRIPE_WEBHOOK_SECRET ||
        !process.env.RESEND_API_KEY ||
        !process.env.EMAIL_FROM ||
        !process.env.MANAGEMENT_EMAIL ||
        !process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
      )
        throw new Error(
          "Payments and email must be configured before approval.",
        );
      const a = newAccess();
      await rpc("approve_request", {
        p_id: booking,
        p_actor: user.id,
        p_token_hash: a.tokenHash,
        p_access_url: a.url,
      });
    } else
      await rpc("manage_reservation", {
        p_id: booking,
        p_actor: user.id,
        p_action: action,
        p_note: text(form, "note"),
      });
    revalidatePath("/admin");
    revalidatePath(`/admin/reservations/${booking}`);
    return {
      success: `${action === "approve" ? "Approved. The deposit email is queued." : "Update saved."}`,
    };
  } catch (e) {
    return result(e);
  }
}
export async function rescheduleAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(ops);
    const booking = id(form);
    await rpc("reschedule_reservation", {
      p_id: booking,
      p_actor: user.id,
      p_section: id(form, "section"),
      p_window: id(form, "window"),
      p_arrival: z.iso.datetime({ offset: true }).parse(form.get("arrival")),
    });
    revalidatePath("/admin");
    return { success: "Rescheduled. Customer notification queued." };
  } catch (e) {
    return result(e);
  }
}
export async function sectionAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(finance);
    const sectionId = String(form.get("id") || "");
    let image = text(form, "image", 1000);
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) {
      if (photo.size > 10 * 1024 * 1024)
        throw new Error("Photograph exceeds 10 MB.");
      const bytes = Buffer.from(await photo.arrayBuffer());
      const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const png = bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const webp =
        bytes.subarray(0, 4).toString() === "RIFF" &&
        bytes.subarray(8, 12).toString() === "WEBP";
      if (!jpeg && !png && !webp)
        throw new Error("Use a valid JPEG, PNG, or WebP photograph.");
      const ext = jpeg ? "jpg" : png ? "png" : "webp";
      const path = `sections/${randomUUID()}.${ext}`;
      const { error } = await db()
        .storage.from("venue-media")
        .upload(path, bytes, {
          contentType: jpeg ? "image/jpeg" : png ? "image/png" : "image/webp",
          upsert: false,
        });
      if (error) throw error;
      image = `storage:${path}`;
    }
    if (image && !allowedImage(image))
      throw new Error("Use a Sanity or venue-storage image URL.");
    const parsed = z
      .object({
        name: z.string().min(2).max(80),
        description: z.string().max(1000),
        capacity: z.coerce.number().int().min(1).max(1000),
        deposit_cents: z.coerce.number().int().positive(),
        minimum_spend_cents: z.coerce.number().int().nonnegative(),
        policy: z.string().min(21).max(3000),
      })
      .parse(Object.fromEntries(form));
    if (parsed.minimum_spend_cents < parsed.deposit_cents)
      throw new Error("Minimum spend must cover the deposit.");
    const layoutId = String(form.get("layout_id") || "");
    const coordinates = ["x", "y", "width", "height"].map((k) =>
      Number(form.get(k) || 0),
    );
    let layout = null;
    if (layoutId) {
      z.uuid().parse(layoutId);
      if (
        coordinates.some((n) => !Number.isFinite(n) || n < 0 || n > 100) ||
        coordinates[2] <= 0 ||
        coordinates[3] <= 0 ||
        coordinates[0] + coordinates[2] > 100 ||
        coordinates[1] + coordinates[3] > 100
      )
        throw new Error("Layout coordinates must fit within 0–100%.");
      layout = {
        x: coordinates[0],
        y: coordinates[1],
        width: coordinates[2],
        height: coordinates[3],
      };
    }
    const payload = {
      ...parsed,
      image_url: image || null,
      amenities: text(form, "amenities")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      published: form.get("published") === "on",
      layout_id: layoutId || null,
      layout,
    };
    await rpc("save_section", {
      p_actor: user.id,
      p_id: sectionId ? z.uuid().parse(sectionId) : null,
      p_data: payload,
    });
    revalidatePath("/admin/sections");
    return { success: "Section saved." };
  } catch (e) {
    return result(e);
  }
}
export async function layoutAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(finance);
    await rpc("save_layout", {
      p_actor: user.id,
      p_name: z.string().min(2).max(100).parse(form.get("name")),
      p_verified: form.get("verified") === "on",
    });
    revalidatePath("/admin/sections");
    return { success: "Layout created. Assign section coordinates below." };
  } catch (e) {
    return result(e);
  }
}
export async function scheduleAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(finance);
    const start = z.iso.datetime({ offset: true }).parse(form.get("starts_at"));
    const end = z.iso.datetime({ offset: true }).parse(form.get("ends_at"));
    const deadline = z.iso
      .datetime({ offset: true })
      .parse(form.get("booking_deadline"));
    const astart = z.iso
      .datetime({ offset: true })
      .parse(form.get("arrival_start"));
    const aend = z.iso
      .datetime({ offset: true })
      .parse(form.get("arrival_end"));
    const event = String(form.get("event_id") || "");
    if (event) z.uuid().parse(event);
    const sections = form.getAll("sections").map((v) => z.uuid().parse(v));
    if (!sections.length)
      throw new Error("Select at least one eligible section.");
    await rpc("create_booking_window", {
      p_actor: user.id,
      p_window: {
        title: z.string().min(2).max(100).parse(form.get("title")),
        starts_at: start,
        ends_at: end,
        booking_deadline: deadline,
        arrival_start: astart,
        arrival_end: aend,
        event_id: event || null,
        published: form.get("published") === "on",
        lead_minutes: z.coerce
          .number()
          .int()
          .min(0)
          .max(10080)
          .parse(form.get("lead_minutes") || 120),
      },
      p_sections: sections,
    });
    revalidatePath("/admin/schedule");
    return { success: "Booking night saved." };
  } catch (e) {
    return result(e);
  }
}
export async function blackoutAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(finance);
    const start = z.iso.datetime({ offset: true }).parse(form.get("start"));
    const end = z.iso.datetime({ offset: true }).parse(form.get("end"));
    if (new Date(end) <= new Date(start))
      throw new Error("End must follow start.");
    await rpc("create_blackout", {
      p_actor: user.id,
      p_section: form.get("section_id") ? id(form, "section_id") : null,
      p_start: start,
      p_end: end,
      p_reason: z.string().min(3).max(500).parse(form.get("reason")),
    });
    revalidatePath("/admin/schedule");
    return { success: "Blocked. Existing allocations were checked." };
  } catch (e) {
    return result(e);
  }
}
export async function inquiryAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(ops);
    const inquiry = id(form);
    const status = z
      .enum(["new", "contacted", "planning", "closed"])
      .parse(form.get("status"));
    await rpc("update_inquiry", {
      p_actor: user.id,
      p_id: inquiry,
      p_status: status,
      p_notes: text(form, "notes", 5000),
    });
    revalidatePath("/admin/inquiries");
    return { success: "Inquiry updated." };
  } catch (e) {
    return result(e);
  }
}
export async function roleAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(["owner"]);
    const target = id(form, "user_id");
    if (target === user.id)
      throw new Error("Ask another owner to change your own role.");
    const role = z
      .enum(["owner", "manager", "reservations", "editor"])
      .parse(form.get("role"));
    await rpc("assign_staff_role", {
      p_actor: user.id,
      p_user: target,
      p_role: role,
    });
    revalidatePath("/admin/settings");
    return { success: "Role updated." };
  } catch (e) {
    return result(e);
  }
}
export async function refundAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(finance);
    const paymentId = id(form, "payment_id");
    const reason = z.string().min(5).max(500).parse(form.get("reason"));
    const { data: payment } = await db()
      .from("payments")
      .select("*,reservations(status)")
      .eq("id", paymentId)
      .single();
    if (!payment || payment.status === "refunded" || !payment.payment_intent_id)
      throw new Error("No refundable payment found.");
    if (
      payment.reservations?.status !== "CANCELLED" &&
      payment.status !== "exception"
    )
      throw new Error("Cancel the booking before refunding.");
    const refund = await stripe().refunds.create(
      {
        payment_intent: payment.payment_intent_id,
        amount: payment.amount_cents,
        metadata: { payment_id: paymentId, actor_id: user.id },
      },
      { idempotencyKey: `refund-full:${paymentId}` },
    );
    await rpc("record_refund", {
      p_actor: user.id,
      p_payment: paymentId,
      p_refund: refund.id,
      p_status: refund.status || "pending",
      p_reason: reason,
    });
    revalidatePath("/admin/payments");
    return { success: "Refund submitted. Provider status recorded." };
  } catch (e) {
    return result(e);
  }
}
export async function manualAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(ops);
    const { reservationSchema } = await import("@/lib/validation");
    const d = reservationSchema.parse({
      ...Object.fromEntries(form),
      guests: Number(form.get("guests")),
      accepted: form.get("accepted") === "on",
    });
    const a = newAccess();
    const created = await rpc<{ reference: string }>("create_request", {
      p_data: d,
      p_token_hash: a.tokenHash,
      p_access_url: a.url,
    });
    await audit(user.id, "manual_request", created.reference);
    revalidatePath("/admin");
    return {
      success: `Request ${created.reference} created. Approve it through Reservations. Payment verification is still required.`,
    };
  } catch (e) {
    return result(e);
  }
}
export async function eventAction(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(finance);
    const eventId = id(form);
    await rpc("cancel_event", { p_actor: user.id, p_event: eventId });
    revalidatePath("/admin/schedule");
    return {
      success:
        "Event cancelled operationally. Affected bookings were cancelled and paid bookings flagged for refund review. Unpublish editorial content in Sanity.",
    };
  } catch (e) {
    return result(e);
  }
}
