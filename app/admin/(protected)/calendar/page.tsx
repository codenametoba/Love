import Link from "next/link";
import { db, pageStaff as staff } from "@/lib/supabase";
import { venueDate } from "@/lib/types";
export default async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  await staff(["owner", "manager", "reservations"]);
  const p = await searchParams;
  const date =
    p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date)
      ? p.date
      : new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Indiana/Indianapolis",
        });
  const count = p.view === "week" ? 7 : 1;
  const days = Array.from({ length: count }, (_, i) => {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const [{ data: sections }, { data: bookings }] = await Promise.all([
    db().from("sections").select("id,name").order("name"),
    db()
      .from("reservations")
      .select("id,name,section_id,arrival,status")
      .gte("arrival", `${date}T00:00:00-04:00`)
      .lte("arrival", `${days.at(-1)}T23:59:59-05:00`)
      .in("status", ["AWAITING_PAYMENT", "CONFIRMED"]),
  ]);
  return (
    <>
      <span className="eyebrow">RESERVATION CALENDAR</span>
      <h1>The room, mapped out.</h1>
      <form className="filter-bar">
        <input
          name="date"
          type="date"
          aria-label="Calendar start date"
          defaultValue={date}
        />
        <select
          aria-label="Calendar view"
          name="view"
          defaultValue={p.view || "day"}
        >
          <option value="day">Daily view</option>
          <option value="week">Weekly view</option>
        </select>
        <button className="button">VIEW</button>
      </form>
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table calendar-table">
          <thead>
            <tr>
              <th>SECTION</th>
              {days.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections?.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                {days.map((day) => (
                  <td key={day}>
                    {bookings
                      ?.filter(
                        (b) =>
                          b.section_id === s.id &&
                          new Date(b.arrival).toLocaleDateString("en-CA", {
                            timeZone: "America/Indiana/Indianapolis",
                          }) === day,
                      )
                      .map((b) => (
                        <div className="calendar-booking" key={b.id}>
                          <Link href={`/admin/reservations/${b.id}`}>
                            {b.name}
                          </Link>
                          <span>
                            {venueDate(b.arrival, { timeStyle: "short" })}
                          </span>
                          <br />
                          <small>{b.status.replaceAll("_", " ")}</small>
                        </div>
                      ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small-note">
        All times: America/Indiana/Indianapolis. Pending requests do not
        allocate a section.
      </p>
    </>
  );
}
