import Link from "next/link";
export function Action({
  href,
  children,
  secondary = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${secondary ? "text-link" : "button"} ${className}`}
    >
      {children}
    </Link>
  );
}
export function Label({ children }: { children: React.ReactNode }) {
  return <div className="context-label">{children}</div>;
}
const treatments: Record<string, string> = {
  "THE SPACE": "space",
  "WHAT’S ON": "events",
  "FOOD & DRINKS": "menu",
  MOMENTS: "moments",
  "PRIVATE GATHERINGS": "private",
  "FIND US": "visit",
  "RESERVE A SECTION": "reserve",
  "ON THE CALENDAR": "event",
};
export function PageIntro({
  kicker,
  title,
  children,
  variant,
}: {
  index?: string;
  kicker: string;
  title: string;
  children?: React.ReactNode;
  variant?: string;
}) {
  return (
    <header
      className={`page-intro intro-${variant || treatments[kicker] || "utility"}`}
    >
      <Label>{kicker.toLocaleLowerCase("en-US")}</Label>
      <h1>{title}</h1>
      {children && <div className="intro-body">{children}</div>}
    </header>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
