import { db, pageStaff as staff } from "@/lib/supabase";
import { Field } from "@/components/ui";
import { AdminForm } from "@/components/admin-form";
import { inquiryAction } from "../../actions";
export default async function Inquiries() {
  await staff(["owner", "manager", "reservations"]);
  const { data, error } = await db()
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (
    <>
      <span className="eyebrow">PRIVATE GATHERINGS</span>
      <h1>Good things start with an idea.</h1>
      {!data?.length && <p className="notice-strip">No inquiries yet.</p>}
      {data?.map((i) => (
        <details className="admin-section" key={i.id}>
          <summary>
            {i.name} · {i.preferred_date} · {i.status}
          </summary>
          <p className="rich-text">
            {i.event_type} · {i.guests} guests · Budget:{" "}
            {i.budget || "Not supplied"}
            <br />
            {i.email} · {i.phone}
            <br />
            <br />
            {i.message}
          </p>
          <AdminForm action={inquiryAction} label="UPDATE INQUIRY">
            <input type="hidden" name="id" value={i.id} />
            <div className="form-grid">
              <Field label="Status">
                <select name="status" defaultValue={i.status}>
                  {["new", "contacted", "planning", "closed"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Internal notes">
                <textarea
                  name="notes"
                  defaultValue={i.notes}
                  maxLength={5000}
                />
              </Field>
            </div>
          </AdminForm>
        </details>
      ))}
    </>
  );
}
