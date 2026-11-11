import { pageStaff as staff } from "@/lib/supabase";
import { content } from "@/lib/content";
import { AdminForm } from "@/components/admin-form";
import { syncEventAction } from "../../content-actions";
import { Field } from "@/components/ui";
export default async function Content() {
  const { role } = await staff();
  const { events } = await content();
  const studio = process.env.SANITY_STUDIO_URL;
  return (
    <>
      <span className="eyebrow">EDITORIAL</span>
      <h1>Keep the story moving.</h1>
      <p>
        Sanity is the source for page copy, menus, photography, event artwork,
        venue details, FAQs, and SEO. PostgreSQL controls scheduling and
        inventory.
      </p>
      <div className="admin-section">
        <h2>Open the content studio.</h2>
        {studio ? (
          <a
            className="button"
            href={studio}
            target="_blank"
            rel="noopener noreferrer"
          >
            OPEN SANITY STUDIO ↗
          </a>
        ) : (
          <p className="notice-strip">
            The studio isn’t connected yet. Set the Sanity project and dataset
            variables, run npm run studio, and configure SANITY_STUDIO_URL after
            deploying your studio.
          </p>
        )}
        <div className="list-rows">
          {[
            "Venue & homepage — verify current business details before publishing",
            "Page copy & SEO — title and introduction for each public page",
            "Menus — categories, prices, dietary notes, availability",
            "Events — flyers, performers, entry details, ticket links",
            "Gallery — authorized media, captions, collections, order",
            "Policies — management-reviewed booking terms and privacy copy",
          ].map((s) => (
            <div key={s}>{s}</div>
          ))}
        </div>
      </div>
      {["owner", "manager"].includes(role) && (
        <section className="admin-section">
          <h2>Synchronize an event schedule.</h2>
          <p className="small-note">
            Explicitly import a published event into operations. Existing
            bookings prevent schedule changes. Copy the returned UUID into the
            event’s Operational event UUID field, then publish it again. Set
            eligible sections and booking nights under Booking schedule.
          </p>
          <AdminForm action={syncEventAction} label="SYNC EVENT TO OPERATIONS">
            <Field label="Published editorial event">
              <select name="sanity_id" required>
                <option value="">Choose event</option>
                {events.map((e) => (
                  <option value={e._id} key={e._id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </Field>
          </AdminForm>
        </section>
      )}
    </>
  );
}
