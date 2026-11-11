import { db, pageStaff as staff } from "@/lib/supabase";
import { AdminForm } from "@/components/admin-form";
import { Field } from "@/components/ui";
import { sectionAction, layoutAction } from "../../actions";
export default async function Sections() {
  await staff(["owner", "manager"]);
  const [{ data: sections }, { data: layouts }] = await Promise.all([
    db().from("sections").select("*").order("name"),
    db().from("section_layouts").select("*"),
  ]);
  function editor(s: Record<string, any> = {}) {
    return (
      <AdminForm
        action={sectionAction}
        label={s.id ? "SAVE SECTION" : "CREATE SECTION"}
      >
        <input type="hidden" name="id" value={s.id || ""} />
        <div className="form-grid">
          <Field label="Section name">
            <input name="name" defaultValue={s.name} required maxLength={80} />
          </Field>
          <Field label="Capacity">
            <input
              type="number"
              min="1"
              max="1000"
              name="capacity"
              defaultValue={s.capacity}
              required
            />
          </Field>
          <Field label="Deposit (USD cents)">
            <input
              type="number"
              min="1"
              name="deposit_cents"
              defaultValue={s.deposit_cents}
              required
            />
          </Field>
          <Field label="Minimum spend (USD cents)">
            <input
              type="number"
              min="1"
              name="minimum_spend_cents"
              defaultValue={s.minimum_spend_cents}
              required
            />
          </Field>
          <Field label="Description">
            <textarea
              name="description"
              defaultValue={s.description}
              maxLength={1000}
            />
          </Field>
          <Field label="Amenities (one per line)">
            <textarea name="amenities" defaultValue={s.amenities?.join("\n")} />
          </Field>
          <div className="full">
            <Field
              label="Booking conditions (required)"
              hint="State refundability, how the deposit applies to the minimum spend, deadlines, and arrival rules."
            >
              <textarea
                name="policy"
                defaultValue={s.policy}
                required
                minLength={21}
                maxLength={3000}
              />
            </Field>
          </div>
          <Field label="Photograph URL (Sanity CDN or venue storage)">
            <input name="image" defaultValue={s.image_url} />
          </Field>
          <Field
            label="Or upload a section photograph"
            hint="JPEG, PNG, or WebP. Maximum 10 MB. Authorized venue imagery only."
          >
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
          </Field>
          <Field label="Verified layout">
            <select name="layout_id" defaultValue={s.layout_id || ""}>
              <option value="">Photograph selector only</option>
              {layouts
                ?.filter((l) => l.verified)
                .map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </Field>
          <div className="form-grid">
            {["x", "y", "width", "height"].map((key) => (
              <Field key={key} label={`${key} (%)`}>
                <input
                  name={key}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue={s.layout?.[key] || 0}
                />
              </Field>
            ))}
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="published"
              defaultChecked={s.published}
            />
            Publish section for eligible booking nights
          </label>
        </div>
      </AdminForm>
    );
  }
  return (
    <>
      <span className="eyebrow">INVENTORY</span>
      <h1>Every corner, considered.</h1>
      <p>
        Use actual capacities, photographs, and management-approved terms.
        Sections also need an eligible published booking night.
      </p>
      {sections?.map((s) => (
        <details className="admin-section" key={s.id}>
          <summary>
            {s.name} · {s.capacity} guests ·{" "}
            {s.published ? "Published" : "Draft"}
          </summary>
          <div className="section-form">{editor(s)}</div>
        </details>
      ))}
      <details className="admin-section">
        <summary>Add a section</summary>
        <div className="section-form">{editor()}</div>
      </details>
      <details className="admin-section">
        <summary>Register an accurate floor plan</summary>
        <p className="small-note">
          Only mark a layout verified after comparing every coordinate to the
          real venue geometry. Without verification, customers see the section
          list.
        </p>
        <AdminForm action={layoutAction} label="REGISTER LAYOUT">
          <Field label="Layout name">
            <input name="name" required minLength={2} />
          </Field>
          <label className="checkbox-row" style={{ marginTop: 15 }}>
            <input name="verified" type="checkbox" />I have an accurate,
            management-approved venue floor plan.
          </label>
        </AdminForm>
      </details>
    </>
  );
}
