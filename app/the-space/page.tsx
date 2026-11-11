import { pageMetadata } from "@/lib/metadata";
import { CMSIntro as PageIntro } from "@/components/cms-intro";
import { Action } from "@/components/ui";
import { EditorialImage } from "@/components/editorial-image";
import { content } from "@/lib/content";
export async function generateMetadata() {
  return pageMetadata(
    "/the-space",
    "The space",
    "A photographic introduction to LOVE and its surroundings in Indianapolis.",
  );
}
export default async function Space() {
  const { media } = await content();
  const photos = media.filter((m) => m.kind !== "video");
  return (
    <>
      <PageIntro kicker="THE SPACE" title="A change of scene.">
        <p>
          A closer look at the atmosphere, from a quiet drink to a room in
          motion.
        </p>
      </PageIntro>
      <div className="space-essay">
        <EditorialImage
          media={photos[0]}
          fallback="/images/venue/lounge-overview.png"
          alt="The main lounge with red seating and a central chandelier"
          className="space-establishing"
          priority
          sizes="100vw"
        />
        <div className="space-text">
          <h2>Intimate details. A different kind of energy.</h2>
          <div>
            <p>
              {photos.length
                ? "Red banquettes, low tables and a chandelier above it all. LOVE brings a sense of occasion to a drink, a dinner or a night with your favorite people."
                : "Settle into the lounge, make your way to the bar and let the evening find its pace."}
            </p>
            <p>
              Make the room your meeting point. Start with craft cocktails and
              food for the table, then stay close to the music as the evening
              picks up.
            </p>
            <div className="inline-links">
              <Action href="/reserve" secondary>
                Explore section availability
              </Action>
              <Action href="/events" secondary>
                View upcoming dates
              </Action>
            </div>
          </div>
        </div>
        <div className="space-details">
          <EditorialImage
            media={photos[1]}
            fallback="/images/venue/cocktails.png"
            alt="Two cocktails served at the bar"
            sizes="(max-width:600px) 45vw, 35vw"
          />
          <EditorialImage
            media={photos[2]}
            fallback="/images/venue/blue-room.png"
            alt="The lounge beneath blue lighting and a chandelier"
            sizes="(max-width:600px) 45vw, 50vw"
          />
        </div>
        {!photos.length && (
          <p className="space-note">
            Explore the room, then choose how you want to spend your evening.
          </p>
        )}
      </div>
    </>
  );
}
