import { db, pageStaff as staff } from "@/lib/supabase";
import { AdminForm } from "@/components/admin-form";
import { Field } from "@/components/ui";
import { roleAction } from "../../actions";
import { venueDate } from "@/lib/types";
export default async function Settings() {
  await staff(["owner"]);
  const [{ data: roles }, { data: logs }] = await Promise.all([
    db().from("staff_roles").select("*"),
    db()
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  return (
    <>
      <span className="eyebrow">OWNER SETTINGS</span>
      <h1>The people behind the night.</h1>
      <p className="notice-strip">
        Invite staff in Supabase Auth, then assign the user ID a role here.
        Editors have no access to reservations or payments.
      </p>
      <div className="list-rows">
        {roles?.map((r) => (
          <div key={r.user_id}>
            <code>{r.user_id}</code>
            <span>{r.role}</span>
          </div>
        ))}
      </div>
      <section className="admin-section">
        <h2>Assign a role.</h2>
        <AdminForm action={roleAction} label="ASSIGN ROLE">
          <div className="form-grid">
            <Field label="Supabase Auth user ID">
              <input name="user_id" required />
            </Field>
            <Field label="Role">
              <select name="role">
                {["owner", "manager", "reservations", "editor"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>
        </AdminForm>
      </section>
      <section className="admin-section">
        <h2>Audit log.</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>WHEN</th>
              <th>ACTION</th>
              <th>ENTITY</th>
              <th>ACTOR</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((l) => (
              <tr key={l.id}>
                <td>
                  {venueDate(l.created_at, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td>{l.action}</td>
                <td>{l.entity_id}</td>
                <td>{l.actor_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
