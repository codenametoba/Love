import { notFound } from "next/navigation";
import Image from "next/image";
import { content } from "@/lib/content";
import { venueDate } from "@/lib/types";
import { Action, PageIntro } from "@/components/ui";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { events } = await content();
  const event = events.find((e) => e.slug === slug);
  return {
    title: event?.title || "Event not found",
    description: event?.description.slice(0, 160),
    ...(event && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
      ? { alternates: { canonical: `/events/${event.slug}` } }
      : {}),
  };
}
export default async function EventDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { events } = await content();
  const e = events.find((e) => e.slug === slug);
  if (!e) notFound();
  return (
    <>
      <PageIntro index="02" kicker="ON THE CALENDAR" title={e.title}>
        <p>{venueDate(e.start, { dateStyle: "full" })}</p>
      </PageIntro>
      <div className="page-content event-detail">
        <div className="event-detail-art">
          {e.image ? (
            <Image
              src={e.image}
              alt={e.title}
              fill
              sizes="(max-width:600px) 100vw, 50vw"
            />
          ) : (
            e.title
          )}
        </div>
        <div>
          <dl className="detail-list">
            {[
              [
                "WHEN",
                `${venueDate(e.start, { timeStyle: "short" })} — ${venueDate(e.end, { timeStyle: "short" })}`,
              ],
              ["FEATURING", e.performers],
              ["AGE POLICY", e.ageRestriction],
              ["DRESS", e.dressCode],
              ["ENTRY", e.entry],
            ]
              .filter((x) => x[1])
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <p className="rich-text">{e.description}</p>
          {e.ticketUrl && (
            <a
              className="button"
              href={e.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              TICKETS / RSVP ↗
            </a>
          )}
          {e.bookingEnabled && e.operationalId && (
            <div style={{ marginTop: 20 }}>
              <Action href={`/reserve?event=${e.operationalId}`}>
                BOOK A SECTION
              </Action>
            </div>
          )}
          <p className="small-note">
            An RSVP or reservation request does not guarantee admission. Review
            the published entry and booking policies before making plans.
          </p>
        </div>
      </div>
    </>
  );
}
