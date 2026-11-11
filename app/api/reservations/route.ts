import { reservationSchema } from "@/lib/validation";
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
    const parsed = reservationSchema.safeParse(await jsonBody(req));
    if (!parsed.success)
      return Response.json(
        { error: "Please check the contact details and booking fields." },
        { status: 400 },
      );
    const data = parsed.data;
    await protect(req, data.bot, "reservation", data.email);
    const access = newAccess();
    const result = await rpc("create_request", {
      p_data: data,
      p_token_hash: access.tokenHash,
      p_access_url: access.url,
    });
    return Response.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
