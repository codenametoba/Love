import { Action, PageIntro } from "@/components/ui";
export default function NotFound() {
  return (
    <>
      <PageIntro kicker="Page not found" title="This address leads elsewhere.">
        <p>
          The requested page could not be found. Use the navigation to continue
          exploring LOVE.
        </p>
      </PageIntro>
      <div className="page-content">
        <Action href="/">BACK TO LOVE</Action>
      </div>
    </>
  );
}
