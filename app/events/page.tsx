import { pageMetadata } from "@/lib/metadata";
import { CMSIntro as PageIntro } from "@/components/cms-intro";
import { content } from "@/lib/content";
import { EventBrowser } from "@/components/event-browser";
export async function generateMetadata() {
  return pageMetadata(
    "/events",
    "What’s on",
    "Discover published events, performers, and nights at LOVE, Indianapolis.",
  );
}
export default async function Events() {
  const { events } = await content();
  return (
    <>
      <PageIntro kicker="WHAT’S ON" title="Find your frequency.">
        <p>
          Music, people, a reason to go. Explore announced dates, entry details
          and section booking options.
        </p>
      </PageIntro>
      <div className="page-content">
        <EventBrowser events={events} />
      </div>
    </>
  );
}
