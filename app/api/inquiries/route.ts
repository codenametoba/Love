import { inquirySchema } from "@/lib/validation";
import { sameOrigin, jsonBody, protect, apiError } from "@/lib/security";
import { db } from "@/lib/supabase";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const parsed = inquirySchema.safeParse(await jsonBody(req));
    if (!parsed.success)
      return Response.json(
        {
          error:
            "Please check the form. Your message needs at least 10 characters.",
        },
        { status: 400 },
      );
    const d = parsed.data;
    if (
      d.date <
      new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Indiana/Indianapolis",
      })
    )
      throw new Error("Choose a future date.");
    await protect(req, d.bot, "inquiry", d.email);
    const { error } = await db().rpc("create_inquiry", { p_data: d });
    if (error) throw error;
    return Response.json({ received: true }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
