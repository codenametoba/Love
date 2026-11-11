import Image from "next/image";
import type { Media } from "@/lib/types";
export function EditorialImage({
  media,
  fallback,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 760px) 100vw, 65vw",
}: {
  media?: Media;
  fallback: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <figure className={`editorial-image ${className}`}>
      <div className="image-window">
        <Image
          src={media?.url || fallback}
          alt={media?.caption || alt}
          fill
          sizes={sizes}
          priority={priority}
        />
      </div>
      <figcaption>{media?.caption || "Inside LOVE."}</figcaption>
    </figure>
  );
}
