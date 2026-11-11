import "server-only";
import { db, rpc } from "./supabase";
import { stripe } from "./stripe";
export async function reconcileRefunds() {
  if (!process.env.STRIPE_SECRET_KEY) return;
  const { data, error } = await db()
    .from("refunds")
    .select("stripe_refund_id")
    .in("status", ["pending", "requires_action"])
    .limit(25);
  if (error) throw error;
  for (const row of data || []) {
    if (!row.stripe_refund_id) continue;
    const refund = await stripe().refunds.retrieve(row.stripe_refund_id);
    await rpc("apply_refund_status", {
      p_refund: refund.id,
      p_status: refund.status || "pending",
    });
  }
}
