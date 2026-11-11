import type { MetadataRoute } from "next";
import { content } from "@/lib/content";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SITE_URL) return [];
  const { events } = await content();
  return [
    "",
    "/the-space",
    "/events",
    "/menu",
    "/moments",
    "/private-events",
    "/reserve",
    "/visit",
    "/privacy",
    "/terms",
    "/accessibility",
    "/booking-policy",
    ...events.map((e) => `/events/${e.slug}`),
  ].map((path) => ({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path ? 0.7 : 1,
  }));
}
