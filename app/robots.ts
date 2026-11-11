import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const ready = process.env.NEXT_PUBLIC_LAUNCH_READY === "true";
  return {
    rules: {
      userAgent: "*",
      allow: ready ? "/" : undefined,
      disallow: ready ? ["/admin", "/api", "/reservation"] : ["/"],
    },
    ...(process.env.NEXT_PUBLIC_SITE_URL
      ? { sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml` }
      : {}),
  };
}
