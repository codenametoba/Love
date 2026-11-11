import { sameOrigin, hash, apiError } from "@/lib/security";
import { accessibleReservation } from "@/lib/reservation";
import { stripe } from "@/lib/stripe";
import { db, rpc } from "@/lib/supabase";
import { siteUrl } from "@/lib/security";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    sameOrigin(req);
    const { token } = await params;
    const r = await accessibleReservation(token);
    if (!r)
      return Response.json(
        { error: "This secure link is invalid or expired." },
        { status: 404 },
      );
    if (
      !(await rpc("consume_rate_limit", {
        p_key: hash(`checkout:${r.id}`),
        p_limit: 20,
      }))
    )
      throw new Error("Too many attempts. Please try again later.");
    if (r.status !== "AWAITING_PAYMENT" || !r.hold_expires_at)
      throw new Error("This request is not awaiting payment.");
    const expiry = Math.floor(new Date(r.hold_expires_at).getTime() / 1000);
    if (expiry <= Math.floor(Date.now() / 1000) + 30 * 60)
      throw new Error(
        "This payment window is closing. Please contact management for the next step.",
      );
    const { data: hold } = await db()
      .from("inventory_holds")
      .select("id")
      .eq("reservation_id", r.id)
      .eq("active", true)
      .gt("expires_at", new Date().toISOString())
      .single();
    if (!hold)
      throw new Error("This section hold has expired. Contact management.");
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: r.email,
        client_reference_id: r.id,
        metadata: { reservation_id: r.id },
        payment_intent_data: { metadata: { reservation_id: r.id } },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: r.deposit_cents,
              product_data: {
                name: `LOVE — section deposit · ${r.reference}`,
                description:
                  `${r.sections?.name || "Section"} · ${r.guests} guests. ${r.policy}`.slice(
                    0,
                    490,
                  ),
              },
            },
          },
        ],
        expires_at: expiry,
        success_url: `${siteUrl()}/reservation/${token}?payment=processing`,
        cancel_url: `${siteUrl()}/reservation/${token}`,
      },
      { idempotencyKey: `checkout:${r.id}:${expiry}` },
    );
    const { error } = await db().from("checkout_sessions").upsert(
      {
        id: session.id,
        reservation_id: r.id,
        amount_cents: r.deposit_cents,
        expires_at: r.hold_expires_at,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
    return Response.json(
      { url: session.url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
