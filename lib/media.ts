import "server-only";
import { db } from "./supabase";
export async function sectionImage(url: string | null | undefined) {
  if (!url) return undefined;
  if (!url.startsWith("storage:")) return url;
  const { data, error } = await db()
    .storage.from("venue-media")
    .createSignedUrl(url.slice(8), 3600);
  if (error) throw error;
  return data.signedUrl;
}
export function allowedImage(url: string) {
  if (url.startsWith("storage:"))
    return /^storage:sections\/[\w.-]+$/.test(url);
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      (u.hostname === "cdn.sanity.io" ||
        u.hostname ===
          new URL(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid.local",
          ).hostname)
    );
  } catch {
    return false;
  }
}
