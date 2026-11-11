import { describe, it, expect, vi, beforeEach } from "vitest";
import Stripe from "stripe";
const { settle } = vi.hoisted(() => ({
  settle: vi.fn().mockResolvedValue("confirmed"),
}));
vi.mock("../lib/supabase", () => ({ rpc: settle, db: vi.fn() }));
import { POST } from "../app/api/stripe/webhook/route";
const secret = "whsec_test_only_signature_secret";
beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit_tests");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
  settle.mockClear();
});
function signed(paid: boolean) {
  const payload = JSON.stringify({
    id: "evt_test",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test",
        mode: "payment",
        payment_status: paid ? "paid" : "unpaid",
        metadata: { reservation_id: "10000000-0000-4000-8000-000000000001" },
        payment_intent: "pi_test",
        amount_total: 10000,
        currency: "usd",
      },
    },
  });
  return new Request("https://love.example/api/stripe/webhook", {
    method: "POST",
    headers: {
      "stripe-signature": Stripe.webhooks.generateTestHeaderString({
        payload,
        secret,
      }),
    },
    body: payload,
  });
}
describe("Stripe webhook boundary (SDK signature verification, mocked persistence)", () => {
  it("rejects unsigned payloads without touching inventory", async () => {
    const r = await POST(
      new Request("https://love.example/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(r.status).toBe(400);
    expect(settle).not.toHaveBeenCalled();
  });
  it("ignores unpaid checkout completions", async () => {
    expect((await POST(signed(false))).status).toBe(200);
    expect(settle).not.toHaveBeenCalled();
  });
  it("passes verified payment facts to the transaction", async () => {
    expect((await POST(signed(true))).status).toBe(200);
    expect(settle).toHaveBeenCalledWith("settle_payment", {
      p_event: "evt_test",
      p_session: "cs_test",
      p_reservation: "10000000-0000-4000-8000-000000000001",
      p_intent: "pi_test",
      p_amount: 10000,
      p_currency: "usd",
    });
  });
  it("returns a retryable error when settlement fails", async () => {
    settle.mockRejectedValueOnce(new Error("database interruption"));
    expect((await POST(signed(true))).status).toBe(500);
  });
});
