import "server-only";
import type { Metadata } from "next";
import { sanity } from "./content";
export async function pageMetadata(
  path: string,
  title: string,
  description: string,
): Promise<Metadata> {
  const copy = sanity
    ? await sanity.fetch<{ seoTitle?: string; seoDescription?: string } | null>(
        '*[_type=="page" && path==$path && published==true][0]{seoTitle,seoDescription}',
        { path },
        { next: { revalidate: 60 } },
      )
    : null;
  return {
    title: copy?.seoTitle || title,
    description: copy?.seoDescription || description,
    ...(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
      ? { alternates: { canonical: path } }
      : {}),
  };
}
