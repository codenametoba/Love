import Link from "next/link";
import { redirect } from "next/navigation";
import { db, pageStaff as staff } from "@/lib/supabase";
import { venueDate } from "@/lib/types";
export default async function Overview() {
  const { role } = await staff();
  if (role === "editor") redirect("/admin/content");
  const client = db();
  const [
    { data: requests, error },
    { count: inquiries },
    { count: exceptions },
    { count: sections },
    { count: events },
    { count: deliveryFailures },
  ] = await Promise.all([
    client
      .from("reservations")
      .select("id,reference,name,arrival,guests,status,sections(name)")
      .order("arrival")
      .limit(500),
    client
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    client
      .from("payment_exceptions")
      .select("*", { count: "exact", head: true })
      .is("resolved_at", null),
    client
      .from("sections")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
    client
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("cancelled", false)
      .gt("ends_at", new Date().toISOString()),
    client
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .is("delivered_at", null)
      .gte("attempts", 3),
  ]);
  if (error) throw error;
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Indiana/Indianapolis",
  });
  const list = requests || [];
  const counts = [
    [
      "Pending approval",
      list.filter((r) => r.status === "PENDING_APPROVAL").length,
    ],
    [
      "Awaiting deposit",
      list.filter((r) => r.status === "AWAITING_PAYMENT").length,
    ],
    ["Confirmed", list.filter((r) => r.status === "CONFIRMED").length],
    [
      "Today’s arrivals",
      list.filter(
        (r) =>
          r.status === "CONFIRMED" &&
          new Date(r.arrival).toLocaleDateString("en-CA", {
            timeZone: "America/Indiana/Indianapolis",
          }) === today,
      ).length,
    ],
    ["New inquiries", inquiries || 0],
    ["Payment exceptions", exceptions || 0],
    ["Published sections", sections || 0],
    ["Upcoming events", events || 0],
  ];
  return (
    <>
      <span className="eyebrow">THE NIGHT, AT A GLANCE</span>
      <h1>Good to see you.</h1>
      {!!deliveryFailures && (
        <div className="form-message error">
          {deliveryFailures} notification(s) need attention. Check the
          notification log and Resend configuration before approving more
          requests.
        </div>
      )}
      <div className="stat-grid">
        {counts.map(([label, n]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{n}</strong>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <h2 style={{ fontSize: 26 }}>Coming through the door.</h2>
        <Link className="text-link" href="/admin/reservations">
          ALL RESERVATIONS ↗
        </Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>GUEST</th>
            <th>ARRIVAL</th>
            <th>PEOPLE</th>
            <th>STATUS</th>
            <th>REFERENCE</th>
          </tr>
        </thead>
        <tbody>
          {list
            .filter(
              (r) =>
                new Date(r.arrival) > new Date() &&
                ["PENDING_APPROVAL", "AWAITING_PAYMENT", "CONFIRMED"].includes(
                  r.status,
                ),
            )
            .slice(0, 15)
            .map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/reservations/${r.id}`}>{r.name}</Link>
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
                <td>{r.reference}</td>
              </tr>
            ))}
        </tbody>
      </table>
      {!list.length && (
        <p className="notice-strip">
          No reservations yet. Configure sections and publish booking windows to
          open availability.
        </p>
      )}
    </>
  );
}
