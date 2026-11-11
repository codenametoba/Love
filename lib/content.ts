import "server-only";
import { cache } from "react";
import { createClient } from "@sanity/client";
import type { Venue, Event, MenuItem, Media } from "./types";
import { venueContent, menuContent, venueMedia } from "./venue-content";
const configured = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_DATASET,
);
export const sanity = configured
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: "2025-10-01",
      useCdn: true,
    })
  : null;
export const content = cache(async function content() {
  if (!sanity)
    return {
      venue: venueContent,
      events: [] as Event[],
      menu: menuContent,
      media: venueMedia,
    };
  // No fabricated fallback when a configured CMS fails. Errors reach the route error boundary.
  return sanity
    .fetch<{ venue: Venue; events: Event[]; menu: MenuItem[]; media: Media[] }>(
      `{
    "venue": *[_type == "venue"][0],
    "events": *[_type == "event" && published == true] | order(start asc) {...,"slug":slug.current,"image":image.asset->url},
    "menu": *[_type == "menuItem" && published == true] | order(order asc) {...,"image":image.asset->url},
    "media": *[_type == "media" && published == true && authorized == true && ((kind == "video" && defined(video.asset)) || (kind != "video" && defined(image.asset)) || (!defined(kind) && defined(image.asset)))] | order(order asc) {...,"kind":coalesce(kind,"image"),"url":select(kind=="video"=>video.asset->url,image.asset->url),"poster":image.asset->url}
  }`,
      {},
      { next: { revalidate: 60 } },
    )
    .then((data) => ({ ...data, venue: data.venue || { verified: false } }));
});
