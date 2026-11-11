import Image from "next/image";
import Link from "next/link";
import { content } from "@/lib/content";
import { money, venueDate } from "@/lib/types";
import { Action } from "@/components/ui";
import { EditorialImage } from "@/components/editorial-image";
import { AvailabilitySearch } from "@/components/availability-search";
import { EventWall } from "@/components/events";
export async function generateMetadata() {
  const { venue } = await content();
  return {
    description:
      venue.seoDescription ||
      "LOVE in Indianapolis. Discover music, cocktails, upcoming events and section reservations.",
    ...(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
      ? { alternates: { canonical: "/" } }
      : {}),
  };
}
export default async function Home() {
  const { venue, events, media, menu } = await content();
  const photos = media.filter((m) => m.kind !== "video");
  const menuPreview = [
    ...menu.slice(0, 2),
    menu.find((item) => item.category !== menu[0]?.category) || menu[2],
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const upcoming = events
    .filter((e) => new Date(e.end) > new Date())
    .slice(0, 3);
  return (
    <>
      {venue.verified && process.env.NEXT_PUBLIC_SITE_URL && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NightClub",
              name: "LOVE",
              url: process.env.NEXT_PUBLIC_SITE_URL,
              address: venue.address,
              telephone: venue.phone,
              image: photos[0]?.url,
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <section className="night-entrance">
        <EditorialImage
          media={photos[0]}
          fallback="/images/venue/lounge-overview.png"
          alt="Lounge seating and a chandelier above the main room"
          className="entrance-photograph"
          priority
          sizes="100vw"
        />
        <div className="entrance-location">
          <span>Indianapolis, Indiana</span>
          <span>Music / cocktails / company</span>
        </div>
        <div className="entrance-message">
          <p className="context-label">An invitation to step out</p>
          <h1>
            {venue.heroHeadline || (
              <>
                Stay for
                <br />
                what happens
                <br />
                <span>next.</span>
              </>
            )}
          </h1>
          <p>
            {venue.heroBody ||
              "Start close. Get carried away. Discover a different side of the evening at LOVE."}
          </p>
          <div className="entrance-actions">
            <Action href="/reserve">RESERVE A SECTION</Action>
            <Action href="/events" secondary>
              SEE WHAT’S HAPPENING
            </Action>
          </div>
        </div>
        {upcoming[0] && (
          <Link className="entrance-event" href={`/events/${upcoming[0].slug}`}>
            <span>
              Coming up ·{" "}
              {venueDate(upcoming[0].start, { month: "short", day: "numeric" })}
            </span>
            <strong>{upcoming[0].title}</strong>
            <span>View event</span>
          </Link>
        )}
        <div className="entrance-footnote">
          <span>Lounge into nightlife.</span>
          <a href="#atmosphere">Discover LOVE ↓</a>
        </div>
      </section>
      <section className="atmosphere-edit" id="atmosphere">
        <div className="atmosphere-opening">
          <p className="context-label">The mood changes here</p>
          <h2>
            Close conversation.
            <br />
            <span>Then the room takes over.</span>
          </h2>
        </div>
        <EditorialImage
          media={photos[1]}
          fallback="/images/venue/cocktails.png"
          alt="Two colorful cocktails at the bar"
          className="atmosphere-detail"
          sizes="(max-width:760px) 60vw, 25vw"
        />
        <div className="atmosphere-story">
          <p>
            There’s the catch-up over a drink. The song that changes the mood.
            The people who turn a simple plan into something else.
          </p>
          <Action href="/the-space" secondary>
            GET A FEEL FOR THE SPACE
          </Action>
        </div>
        <EditorialImage
          media={photos[2]}
          fallback="/images/venue/blue-room.png"
          alt="The lounge under blue lighting"
          className="atmosphere-social"
          sizes="(max-width:760px) 90vw, 55vw"
        />
      </section>
      <section className="nightline">
        <div className="nightline-heading">
          <p className="context-label">The nightline</p>
          <h2>
            Put something
            <br />
            in the calendar.
          </h2>
          <Action href="/events" secondary>
            ALL ANNOUNCED EVENTS
          </Action>
        </div>
        <EventWall events={upcoming} />
      </section>
      <section className="section-scene">
        <EditorialImage
          media={photos.find((p) => p._id === "love-vip")}
          fallback="/images/venue/vip-lounge.png"
          alt="Curved lounge seating and low tables"
          className="section-scene-image"
          sizes="100vw"
        />
        <div className="section-scene-heading">
          <p className="context-label">Section reservations</p>
          <h2>
            A place to land.
            <br />
            People to bring.
          </h2>
          <p>
            Find a date, gather your group and explore the sections available
            for your evening.
          </p>
        </div>
        <div className="reservation-desk">
          <h3>Start with your night.</h3>
          <AvailabilitySearch />
          <p>
            Management reviews your request before sending a deposit link.
            Confirmation follows verified payment.
          </p>
          <Link href="/booking-policy" className="text-link">
            Read the booking policy
          </Link>
        </div>
        <p className="section-scene-note">
          From a small circle to a full celebration, start with your date and
          party size.
        </p>
      </section>
      <section className="table-edit">
        <EditorialImage
          media={photos.find((p) => p.collection === "At the Table")}
          fallback="/images/venue/cocktails.png"
          alt="Cocktails garnished with fresh fruit"
          className="table-photograph"
          sizes="(max-width:760px) 90vw, 40vw"
        />
        <div className="table-copy">
          <p className="context-label">Food & cocktails</p>
          <h2>
            Order something.
            <br />
            Lose track of time.
          </h2>
          {menu.length ? (
            <div className="editorial-menu-list">
              {menuPreview.map((item) => (
                <div key={item._id}>
                  <span>{item.name}</span>
                  <span>
                    {item.available && item.price != null
                      ? money(Math.round(item.price * 100))
                      : "See menu details"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>
              A cocktail to start, something to share, and a reason to stay for
              dinner.
            </p>
          )}
          <Action href="/menu" secondary>
            EXPLORE THE MENU
          </Action>
        </div>
      </section>
      <section className="people-edit">
        <div className="people-heading">
          <p className="context-label">The room, up close</p>
          <h2>
            Find your
            <br />
            favorite corner.
          </h2>
          <Action href="/moments" secondary>
            EXPLORE THE MOMENTS
          </Action>
        </div>
        {photos.length ? (
          <div className="people-photographs">
            {photos.slice(0, 3).map((photo) => (
              <Link href="/moments" key={photo._id} className="people-photo">
                <Image
                  src={photo.url}
                  alt={photo.caption}
                  fill
                  sizes="(max-width:760px) 85vw, 30vw"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="people-pending">
            <span>Photographs forthcoming</span>
            <p>
              This space is reserved for real moments at LOVE. Take a closer
              look at the room.
            </p>
          </div>
        )}
      </section>
      <section className="private-note">
        <h2>
          Got a reason
          <br />
          to get everyone together?
        </h2>
        <div>
          <p>
            Tell us about the occasion. We’ll talk through the possibilities for
            your group.
          </p>
          <Action href="/private-events" secondary>
            PLAN A PRIVATE EVENT
          </Action>
        </div>
      </section>
      <section className="last-invitation">
        <p className="context-label">The rest happens here</p>
        <h2>
          Make a plan.
          <br />
          <span>See where it goes.</span>
        </h2>
        <div className="closing-actions">
          <Action href="/reserve">BOOK A SECTION</Action>
          <Action
            href={
              venue.verified && venue.directionsUrl
                ? venue.directionsUrl
                : "/visit"
            }
            secondary
          >
            {venue.verified && venue.directionsUrl
              ? "GET DIRECTIONS"
              : "PLAN YOUR VISIT"}
          </Action>
        </div>
        <div className="closing-details">
          <span>
            {venue.verified && venue.address
              ? venue.address
              : "Indianapolis, Indiana"}
          </span>
          {venue.verified && venue.instagram && (
            <a href={venue.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
        </div>
      </section>
    </>
  );
}
