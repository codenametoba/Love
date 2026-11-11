import { sanity } from "@/lib/content";
import { PageIntro } from "./ui";
const paths: Record<string, string> = {
  "THE SPACE": "/the-space",
  "WHAT’S ON": "/events",
  "FOOD & DRINKS": "/menu",
  MOMENTS: "/moments",
  "FIND US": "/visit",
  "PRIVATE GATHERINGS": "/private-events",
  "RESERVE A SECTION": "/reserve",
};
export async function CMSIntro(props: Parameters<typeof PageIntro>[0]) {
  const path = paths[props.kicker];
  const copy =
    path && sanity
      ? await sanity.fetch<{ title?: string; intro?: string } | null>(
          '*[_type=="page" && path==$path && published==true][0]',
          { path },
          { next: { revalidate: 60 } },
        )
      : null;
  return (
    <PageIntro {...props} title={copy?.title || props.title}>
      {copy?.intro ? <p>{copy.intro}</p> : props.children}
    </PageIntro>
  );
}
