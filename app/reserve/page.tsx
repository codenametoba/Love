import { pageMetadata } from "@/lib/metadata";
import { CMSIntro as PageIntro } from "@/components/cms-intro";
import { ReservationFlow } from "@/components/reservation-flow";
export async function generateMetadata() {
  return pageMetadata(
    "/reserve",
    "Reserve a section",
    "Request a section at LOVE, Indianapolis. Approval comes before your deposit.",
  );
}
export default async function Reserve({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; guests?: string; event?: string }>;
}) {
  const p = await searchParams;
  return (
    <>
      <PageIntro kicker="RESERVE A SECTION" title="Make space for your people.">
        <p>
          Select an evening and a section for your group. Management reviews the
          request before a deposit is due.
        </p>
      </PageIntro>
      <div className="page-content">
        <ReservationFlow
          initialDate={
            p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : ""
          }
          initialGuests={Math.min(1000, Math.max(1, Number(p.guests) || 4))}
          eventId={p.event && /^[\da-f-]{36}$/i.test(p.event) ? p.event : ""}
        />
      </div>
    </>
  );
}
