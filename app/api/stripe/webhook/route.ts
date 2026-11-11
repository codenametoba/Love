import { limitedBody } from "@/lib/security";
import { stripe } from "@/lib/stripe";
import { rpc } from "@/lib/supabase";
export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    return Response.json({ error: "Webhook unavailable" }, { status: 503 });
  let event;
  try {
    const body = await limitedBody(req, 256000);
    event = stripe().webhooks.constructEvent(
      body,
      req.headers.get("stripe-signature") || "",
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        if (
          session.mode !== "payment" ||
          !session.metadata?.reservation_id ||
          !session.payment_intent
        )
          return Response.json(
            { error: "Missing payment metadata" },
            { status: 400 },
          );
        await rpc("settle_payment", {
          p_event: event.id,
          p_session: session.id,
          p_reservation: session.metadata.reservation_id,
          p_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent.id,
          p_amount: session.amount_total,
          p_currency: session.currency,
        });
      }
    } else if (
      event.type === "refund.updated" ||
      event.type === "refund.created"
    ) {
      const refund = event.data.object;
      await rpc("apply_refund_status", {
        p_refund: refund.id,
        p_status: refund.status || "pending",
      });
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error(
      "Webhook processing failed",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Processing failed; retry required" },
      { status: 500 },
    );
  }
}
