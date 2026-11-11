import { pageMetadata } from "@/lib/metadata";
import { CMSIntro as PageIntro } from "@/components/cms-intro";
import { Action } from "@/components/ui";
import { content } from "@/lib/content";
export async function generateMetadata() {
  return pageMetadata(
    "/visit",
    "Find us",
    "Confirmed location, contact details, opening hours and directions for LOVE in Indianapolis.",
  );
}
export default async function Visit() {
  const { venue } = await content();
  return (
    <>
      <PageIntro kicker="FIND US" title="Your way to LOVE.">
        <p>
          Find us on Virginia Avenue in Fountain Square, just southeast of
          downtown Indianapolis.
        </p>
      </PageIntro>
      <div className="page-content visit-layout">
        <section className="visit-details">
          <p className="context-label">Location & contact</p>
          {venue.verified ? (
            <>
              <h2 style={{ fontSize: 30, margin: "25px 0" }}>
                {venue.address || "Location details are being confirmed."}
              </h2>
              {venue.directionsUrl && (
                <a
                  href={venue.directionsUrl}
                  className="button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions
                </a>
              )}
              <dl className="detail-list" style={{ marginTop: 25 }}>
                {venue.phone && (
                  <div>
                    <dt>Telephone</dt>
                    <dd>
                      <a href={`tel:${venue.phone.replace(/[^+\d]/g, "")}`}>
                        {venue.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {venue.email && (
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${venue.email}`}>{venue.email}</a>
                    </dd>
                  </div>
                )}
                {venue.hours && (
                  <div>
                    <dt>Opening hours</dt>
                    <dd style={{ whiteSpace: "pre-line" }}>{venue.hours}</dd>
                  </div>
                )}
                {venue.instagram && (
                  <div>
                    <dt>Social</dt>
                    <dd>
                      <a
                        href={venue.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Instagram
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              {venue.parking && <p className="rich-text">{venue.parking}</p>}
              {venue.entryPolicy && (
                <p className="rich-text">{venue.entryPolicy}</p>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h2>The particulars are on their way.</h2>
              <p>
                Our current address, contact details and opening hours will
                appear here after confirmation. Please wait for those details
                before planning a visit.
              </p>
            </div>
          )}
        </section>
        <aside className="visit-aside">
          <h2>Start in Fountain Square.</h2>
          <p>
            Meet your group at 1059 Virginia Avenue. Make LOVE your dinner
            destination, your cocktail stop or the place everyone comes together
            for the night.
          </p>
          <div className="inline-links">
            <Action href="/events" secondary>
              Event calendar
            </Action>
            <Action href="/booking-policy" secondary>
              Reservation guidance
            </Action>
          </div>
          <Action href="/private-events" secondary>
            Ask about a private occasion
          </Action>
        </aside>
      </div>
    </>
  );
}
