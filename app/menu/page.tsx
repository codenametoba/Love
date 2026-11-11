import Image from "next/image";
import { pageMetadata } from "@/lib/metadata";
import { CMSIntro as PageIntro } from "@/components/cms-intro";
import { Empty } from "@/components/ui";
import { content } from "@/lib/content";
import { money } from "@/lib/types";
export async function generateMetadata() {
  return pageMetadata(
    "/menu",
    "Food & drinks",
    "The current food and drinks selection, prices and dietary information from LOVE.",
  );
}
export default async function Menu() {
  const { menu } = await content();
  const categories = Array.from(new Set(menu.map((item) => item.category)));
  return (
    <>
      <PageIntro kicker="FOOD & DRINKS" title="Pour. Pass. Repeat.">
        <p>
          Craft cocktails, wings, street tacos and flatbreads. Choose a
          favorite, or order a little of everything for the table.
        </p>
      </PageIntro>
      <div className="page-content menu-page">
        {!menu.length ? (
          <Empty title="Next on the menu.">
            The current food and drinks menu will be published with prices when
            it’s approved. Please check here again before your visit.
          </Empty>
        ) : (
          <>
            <nav aria-label="Menu categories" className="menu-category-nav">
              {categories.map((category, i) => (
                <a key={category} href={`#category-${i}`}>
                  {category}
                </a>
              ))}
            </nav>
            {categories.map((category, i) => (
              <section
                key={category}
                id={`category-${i}`}
                className="menu-category"
              >
                <h2>{category}</h2>
                {menu
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <article key={item._id} className="menu-item">
                      <div className="menu-item-info">
                        <div>
                          <h3>{item.name}</h3>
                          <span>
                            {item.available
                              ? item.price != null
                                ? money(Math.round(item.price * 100))
                                : "Ask the team"
                              : "Currently unavailable"}
                          </span>
                        </div>
                        {item.description && <p>{item.description}</p>}
                        {(item.dietary || item.allergens) && (
                          <small>
                            {item.dietary}
                            {item.allergens && ` · Contains: ${item.allergens}`}
                          </small>
                        )}
                      </div>
                      {item.image && (
                        <div className="menu-item-photo">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="100px"
                          />
                        </div>
                      )}
                    </article>
                  ))}
              </section>
            ))}
            <p className="small-note">
              Please speak with the team about allergies before ordering.
            </p>
          </>
        )}
      </div>
    </>
  );
}
