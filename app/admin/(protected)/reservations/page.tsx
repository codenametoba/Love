import Link from "next/link";
import { db, pageStaff as staff } from "@/lib/supabase";
import { venueDate } from "@/lib/types";
export default async function Reservations({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await staff(["owner", "manager", "reservations"]);
  const p = await searchParams;
  let query = db()
    .from("reservations")
    .select("id,reference,name,email,guests,arrival,status,sections(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (p.status) query = query.eq("status", p.status);
  if (p.q) {
    const q = p.q.replace(/[^\w\s@.+-]/g, "").slice(0, 80);
    query = query.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,reference.ilike.%${q}%`,
    );
  }
  const { data, error } = await query;
  if (error) throw error;
  return (
    <>
      <span className="eyebrow">RESERVATIONS</span>
      <h1>Your guest list.</h1>
      <form className="filter-bar">
        <input
          name="q"
          aria-label="Search guests, email or reference"
          placeholder="Search guests, email or reference"
          defaultValue={p.q}
        />
        <select
          name="status"
          aria-label="Reservation status"
          defaultValue={p.status || ""}
        >
          <option value="">All statuses</option>
          {[
            "PENDING_APPROVAL",
            "AWAITING_PAYMENT",
            "CONFIRMED",
            "EXPIRED",
            "DECLINED",
            "CANCELLED",
            "PAYMENT_EXCEPTION",
          ].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button className="button">FILTER</button>
      </form>
      <table className="admin-table">
        <thead>
          <tr>
            <th>GUEST</th>
            <th>ARRIVAL</th>
            <th>PEOPLE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/admin/reservations/${r.id}`}>{r.name}</Link>
                <br />
                <small>{r.reference}</small>
              </td>
              <td>
                {venueDate(r.arrival, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td>{r.guests}</td>
              <td>
                <span className={`status-badge status-${r.status}`}>
                  {r.status.replaceAll("_", " ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data?.length && (
        <p className="notice-strip">No matching reservations.</p>
      )}
      <p className="small-note">
        Most recent 200 results. Narrow your search to find older records.
      </p>
    </>
  );
}
