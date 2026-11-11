import Link from "next/link";
import { redirect } from "next/navigation";
import { staff } from "@/lib/supabase";
import { signOut } from "../login/actions";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Management",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role;
  try {
    role = (await staff()).role;
  } catch {
    redirect("/admin/login");
  }
  const ops = role !== "editor";
  const finance = ["owner", "manager"].includes(role);
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <span
          className="eyebrow"
          style={{ padding: 12, color: "var(--accent)" }}
        >
          LOVE / {role.toUpperCase()}
        </span>
        {ops && (
          <>
            <Link href="/admin">Overview</Link>
            <Link href="/admin/reservations">Reservations</Link>
            <Link href="/admin/calendar">Calendar</Link>
            <Link href="/admin/manual">Manual request</Link>
            <Link href="/admin/inquiries">Inquiries</Link>
          </>
        )}
        {finance && (
          <>
            <Link href="/admin/sections">Sections & layout</Link>
            <Link href="/admin/schedule">Booking schedule</Link>
            <Link href="/admin/payments">Payments & exceptions</Link>
          </>
        )}
        <Link href="/admin/content">Content studio</Link>
        {role === "owner" && <Link href="/admin/settings">Staff & audit</Link>}
        <form action={signOut}>
          <button>Sign out ↗</button>
        </form>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
