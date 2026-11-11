import { notFound } from "next/navigation";
import { PageIntro } from "@/components/ui";
import { sanity } from "@/lib/content";
const policies: Record<
  string,
  { title: string; kicker: string; sections: [string, string][] }
> = {
  privacy: {
    title: "YOUR DETAILS MATTER.",
    kicker: "PRIVACY",
    sections: [
      [
        "What we collect",
        "When you request a section or make an inquiry, we collect the details you provide: your name, email, phone number, proposed visit, guest count, and message. Please avoid including sensitive information in free-text fields.",
      ],
      [
        "How your information is used",
        "We use your information to review requests, manage bookings, contact you about your plans, handle deposits, and maintain operational records. A booking inquiry does not subscribe you to marketing.",
      ],
      [
        "Payments and service providers",
        "Stripe processes card payments. We do not store raw card details. Supabase provides operational data storage and staff authentication; Resend delivers transactional email; Sanity manages editorial content; Vercel hosts the application.",
      ],
      [
        "Secure links and cookies",
        "A reservation link grants private access to your details. Keep it private. Links expire after 30 days; a replacement can be requested using the original email and reference. Staff authentication uses essential session cookies. No advertising or analytics cookies are configured in this build.",
      ],
      [
        "Before public launch",
        "Management must approve this notice, identify the responsible business and privacy contact, and confirm retention periods, rights procedures, subprocessors, and any jurisdiction-specific requirements. This page is a draft until that review is complete.",
      ],
    ],
  },
  "booking-policy": {
    title: "GOOD PLANS. CLEAR TERMS.",
    kicker: "BOOKING POLICY",
    sections: [
      [
        "A request comes first",
        "Submitting a section request does not confirm a reservation or guarantee admission. Management reviews the request and availability before approval. You do not pay a deposit at the initial request stage.",
      ],
      [
        "Approval and payment",
        "An approved request receives a temporary exclusive section hold and a secure Stripe deposit link. The payment deadline appears in the approval email and secure reservation page. If the deadline passes, the section can be released. Payment completion is verified on the server before a booking is confirmed.",
      ],
      [
        "Deposits and minimum spend",
        "The selected section’s management-approved conditions specify the deposit, minimum spend, refundability, whether the deposit counts toward that spend, and arrival rules. Review those conditions before submitting. No default refund policy is assumed.",
      ],
      [
        "Changes and cancellations",
        "Use your secure reservation page to ask management about a cancellation or date change. Requests do not automatically cancel or reschedule a booking. Changes depend on availability and approval. Refunds require review under the applicable terms.",
      ],
      [
        "Late or exceptional payments",
        "A payment that arrives after its section hold expires does not create a new reservation. Management reviews these payments for a refund or another agreed resolution.",
      ],
      [
        "Policy approval",
        "Management must approve the venue’s final terms and entry requirements before opening reservations. The terms displayed for a particular section and event are saved with your request.",
      ],
    ],
  },
  accessibility: {
    title: "A PLACE FOR EVERYONE.",
    kicker: "ACCESSIBILITY",
    sections: [
      [
        "Our approach",
        "This website is designed toward WCAG 2.2 AA, with keyboard navigation, readable form labels, visible focus states, text-based availability labels, and reduced-motion support. A section list is available alongside any verified floor plan.",
      ],
      [
        "Using the website",
        "Use the skip link to move to the main content. The mobile menu and gallery can be closed with Escape. All booking information is available without sound or animation.",
      ],
      [
        "Venue access",
        "Physical accessibility details must be verified by management. We do not make assumptions about step-free entry, accessible restrooms, or parking. Confirm any access needs with the team before visiting.",
      ],
      [
        "Feedback",
        "Once the venue’s verified contact details are published on Find us, please use them to report an accessibility issue or request assistance. This statement and the site require ongoing accessibility review.",
      ],
    ],
  },
  terms: {
    title: "THE DETAILS, IN WRITING.",
    kicker: "WEBSITE TERMS",
    sections: [
      [
        "Website information",
        "Published event, menu, and venue information may change. Check current details and event-specific entry conditions before visiting. A private event inquiry does not guarantee availability or a particular service.",
      ],
      [
        "Reservations and payments",
        "Section requests are subject to management approval. Confirmation requires verified deposit payment and a valid inventory allocation. Specific booking terms are shown before submission and saved with the reservation.",
      ],
      [
        "Content and responsible use",
        "Photography and other website content may be protected by copyright. Do not misuse the site, attempt unauthorized access, or submit another person’s details without consent.",
      ],
      [
        "Management review required",
        "Final legal entity details, contact information, applicable law, liability terms, and jurisdiction-specific rights must be reviewed by management and legal counsel before public launch. This is draft operational copy.",
      ],
    ],
  },
};
export function generateStaticParams() {
  return Object.keys(policies).map((legal) => ({ legal }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const { legal } = await params;
  return {
    title: policies[legal]?.kicker || "Not found",
    description: `Read the ${policies[legal]?.kicker.toLowerCase() || "website"} information for LOVE.`,
    ...(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
      ? { alternates: { canonical: `/${legal}` } }
      : {}),
  };
}
export default async function Legal({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const { legal } = await params;
  const p = policies[legal];
  if (!p) notFound();
  const custom = sanity
    ? await sanity.fetch<{
        title?: string;
        intro?: string;
        body?: string;
      } | null>(
        '*[_type=="page" && path==$path && published==true][0]',
        { path: `/${legal}` },
        { next: { revalidate: 60 } },
      )
    : null;
  return (
    <>
      <PageIntro index="↗" kicker={p.kicker} title={custom?.title || p.title}>
        {custom?.intro && <p>{custom.intro}</p>}
      </PageIntro>
      <div className="page-content legal-content">
        {custom?.body
          ? custom.body.split("\n\n").map((text, i) => (
              <p style={{ marginBottom: 22, whiteSpace: "pre-line" }} key={i}>
                {text}
              </p>
            ))
          : p.sections.map(([title, body]) => (
              <section key={title}>
                <h2>{title}</h2>
                <p>{body}</p>
              </section>
            ))}
      </div>
    </>
  );
}
