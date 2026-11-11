"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Media } from "@/lib/types";
import { Empty } from "./ui";
export function Gallery({ media }: { media: Media[] }) {
  const [collection, setCollection] = useState("All moments");
  const [selected, setSelected] = useState<Media | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  if (!media.length)
    return (
      <Empty title="The room, through your lens.">
        Photographs from LOVE will be shared here after publication. There are
        no venue images in this collection yet.
      </Empty>
    );
  return (
    <>
      <div className="filter-bar">
        <div className="filter-tabs" style={{ flexWrap: "wrap" }}>
          {["All moments", ...new Set(media.map((m) => m.collection))].map(
            (c) => (
              <button
                aria-pressed={collection === c}
                key={c}
                onClick={() => setCollection(c)}
              >
                {c}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="gallery-grid">
        {media
          .filter(
            (m) => collection === "All moments" || m.collection === collection,
          )
          .map((m) => (
            <button
              key={m._id}
              className="gallery-item"
              aria-label={m.caption}
              onClick={() => {
                setSelected(m);
                dialog.current?.showModal();
              }}
            >
              <div className="gallery-image">
                {m.kind === "video" && !m.poster ? (
                  <span className="video-cover">PLAY THE MOMENT ↗</span>
                ) : (
                  <Image
                    src={m.kind === "video" ? m.poster! : m.url}
                    alt={m.caption}
                    fill
                    sizes="(max-width:600px) 90vw, 45vw"
                  />
                )}
              </div>
              <span>{m.caption}</span>
            </button>
          ))}
      </div>
      <dialog
        className="lightbox"
        ref={dialog}
        aria-label="Media viewer"
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          aria-label="Close media"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        {selected && (
          <>
            <div className="lightbox-image">
              {selected.kind === "video" ? (
                <video
                  src={selected.url}
                  poster={selected.poster}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={selected.caption}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Image
                  src={selected.url}
                  alt={selected.caption}
                  fill
                  sizes="95vw"
                />
              )}
            </div>
            <p>
              {selected.caption}
              {selected.credit && ` / ${selected.credit}`}
            </p>
            {selected.transcript && <p>{selected.transcript}</p>}
          </>
        )}
      </dialog>
    </>
  );
}
