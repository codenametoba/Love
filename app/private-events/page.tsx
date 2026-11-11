import { pageMetadata } from "@/lib/metadata";
import { CMSIntro as PageIntro } from "@/components/cms-intro";
import { InquiryForm } from "@/components/inquiry-form";
import { Action } from "@/components/ui";
export async function generateMetadata() {
  return pageMetadata(
    "/private-events",
    "Private gatherings",
    "Ask LOVE about the possibilities for a private celebration or group occasion in Indianapolis.",
  );
}
export default function PrivateEvents() {
  return (
    <>
      <PageIntro kicker="PRIVATE GATHERINGS" title="Give the night a reason.">
        <p>
          Birthdays, reunions and milestone nights in Fountain Square. Bring us
          the occasion; we’ll help you shape the gathering.
        </p>
      </PageIntro>
      <div className="page-content inquiry-layout">
        <aside className="inquiry-guidance">
          <h2>Tell us who’s coming.</h2>
          <p>
            Share a date and a little context. The team will review your inquiry
            and discuss what’s possible before any arrangements are confirmed.
          </p>
          <p style={{ marginTop: 18 }}>
            For a section on an available night, use the reservation selector
            instead.
          </p>
          <Action href="/reserve" secondary>
            Section reservations
          </Action>
        </aside>
        <InquiryForm />
      </div>
    </>
  );
}
