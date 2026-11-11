import { z } from "zod";
import {
  sameOrigin,
  jsonBody,
  protect,
  newAccess,
  apiError,
} from "@/lib/security";
import { rpc } from "@/lib/supabase";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const d = z
      .object({
        email: z.email(),
        reference: z.string().regex(/^[a-fA-F0-9]{12}$/),
        bot: z.string().optional(),
      })
      .parse(await jsonBody(req));
    await protect(req, d.bot, "access", d.email);
    const a = newAccess();
    await rpc("renew_access", {
      p_email: d.email.toLowerCase(),
      p_reference: d.reference.toUpperCase(),
      p_hash: a.tokenHash,
      p_url: a.url,
    });
    return Response.json({ received: true });
  } catch (e) {
    return apiError(e);
  }
}
