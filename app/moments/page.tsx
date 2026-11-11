import { pageMetadata } from "@/lib/metadata";
import { CMSIntro as PageIntro } from "@/components/cms-intro";
import { Gallery } from "@/components/gallery";
import { content } from "@/lib/content";
export async function generateMetadata() {
  return pageMetadata(
    "/moments",
    "Moments",
    "The photo journal of LOVE. People, music, and moments in Indianapolis.",
  );
}
export default async function Moments() {
  const { media } = await content();
  return (
    <>
      <PageIntro kicker="MOMENTS" title="Caught in the moment.">
        <p>
          A photographic record of the room, the company and everything between.
        </p>
      </PageIntro>
      <div className="page-content">
        <Gallery media={media} />
      </div>
    </>
  );
}
