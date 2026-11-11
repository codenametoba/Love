import { availability, sectionsForWindow } from "@/lib/availability";
import { operationsConfigured } from "@/lib/supabase";
import { apiError, protect } from "@/lib/security";
import { z } from "zod";
export async function GET(req: Request) {
  try {
    if (!operationsConfigured())
      return Response.json(
        { configured: false, windows: [], sections: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    await protect(req, undefined, "availability");
    const url = new URL(req.url);
    const windowId = url.searchParams.get("window");
    const guests = z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .parse(url.searchParams.get("guests") || 4);
    if (windowId) {
      z.uuid().parse(windowId);
      return Response.json(
        { sections: await sectionsForWindow(windowId, guests) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const date = z
      .union([z.iso.date(), z.literal("")])
      .parse(url.searchParams.get("date") || "");
    const event = url.searchParams.get("event") || undefined;
    if (event) z.uuid().parse(event);
    return Response.json(await availability(date, guests, event), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
