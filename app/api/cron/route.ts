import { reconcileRefunds } from "@/lib/refunds";
import { validCron } from "@/lib/security";
import { rpc, db } from "@/lib/supabase";
import { deliverNotifications } from "@/lib/email";
export async function GET(req: Request) {
  if (!validCron(req))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await rpc("expire_holds");
    await reconcileRefunds();
    await db()
      .from("rate_limits")
      .delete()
      .lt("reset_at", new Date(Date.now() - 86400000).toISOString());
    await db()
      .from("reservation_access")
      .delete()
      .lt("expires_at", new Date().toISOString());
    return Response.json(await deliverNotifications());
  } catch {
    return Response.json(
      { error: "Operations task failed. Check configuration and logs." },
      { status: 503 },
    );
  }
}
