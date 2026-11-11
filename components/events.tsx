import Image from "next/image";
import Link from "next/link";
import { Event, venueDate } from "@/lib/types";
export function EventWall({ events }: { events: Event[] }) {
  if (!events.length)
    return (
      <div className="calendar-unpublished">
        <p className="calendar-note">Make LOVE the occasion.</p>
        <p>
          Dinner that turns into drinks. A birthday with your whole circle.
          Explore the lounge, plan a gathering, or choose a section for your
          next night in Fountain Square.
        </p>
        <Link href="/private-events" className="text-link">
          Discuss an occasion
        </Link>
      </div>
    );
  return (
    <div className="event-wall">
      {events.map((event, i) => (
        <article
          className={`event-poster ${i % 2 ? "event-poster-tall" : "event-poster-wide"}`}
          key={event._id}
        >
          <Link
            href={`/events/${event.slug}`}
            className="event-artwork"
            aria-label={`View ${event.title}`}
          >
            {event.image ? (
              <Image
                src={event.image}
                alt={event.title}
                fill
                sizes="(max-width:760px) 100vw, 45vw"
              />
            ) : (
              <span className="event-art-title">{event.title}</span>
            )}
          </Link>
          <div className="event-caption">
            <time dateTime={event.start}>
              <strong>{venueDate(event.start, { day: "numeric" })}</strong>
              <span>{venueDate(event.start, { month: "long" })}</span>
            </time>
            <div>
              <h3>
                <Link href={`/events/${event.slug}`}>{event.title}</Link>
              </h3>
              <p>
                {venueDate(event.start, {
                  weekday: "long",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {event.performers && ` · ${event.performers}`}
              </p>
              <Link href={`/events/${event.slug}`} className="text-link">
                Event information
              </Link>
              {event.bookingEnabled && event.operationalId && (
                <Link
                  href={`/reserve?event=${event.operationalId}`}
                  className="event-booking-link text-link"
                >
                  Reserve a section
                </Link>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
