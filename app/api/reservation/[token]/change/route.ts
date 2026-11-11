import { sameOrigin, jsonBody, apiError, hash } from "@/lib/security";
import { accessibleReservation } from "@/lib/reservation";
import { changeSchema } from "@/lib/validation";
import { rpc } from "@/lib/supabase";
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
        { error: "This link has expired or is invalid." },
        { status: 404 },
      );
    const parsed = changeSchema.safeParse(await jsonBody(req));
    if (!parsed.success)
      return Response.json(
        { error: "Please include a message of 5–2000 characters." },
        { status: 400 },
      );
    if (
      !(await rpc("consume_rate_limit", {
        p_key: hash(`change:${r.id}`),
        p_limit: 6,
      }))
    )
      throw new Error("Too many requests. Try again later.");
    await rpc("customer_change", {
      p_id: r.id,
      p_kind: parsed.data.kind,
      p_message: parsed.data.message,
    });
    return Response.json({ received: true });
  } catch (e) {
    return apiError(e);
  }
}
