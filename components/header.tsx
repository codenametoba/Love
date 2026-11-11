"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
const links = [
  ["HOME", "/"],
  ["THE SPACE", "/the-space"],
  ["WHAT’S ON", "/events"],
  ["MENU", "/menu"],
  ["MOMENTS", "/moments"],
  ["FIND US", "/visit"],
];
export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);
  return (
    <header className="site-header">
      <Link href="/" aria-label="LOVE home" className="wordmark">
        LOVE<span>.</span>
      </Link>
      <nav aria-label="Main navigation" className="desktop-nav">
        {links.map(([name, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={
              path === href || path.startsWith(`${href}/`) ? "page" : undefined
            }
          >
            {name}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link className="header-book" href="/reserve">
          BOOK A SECTION
        </Link>
        <button
          ref={toggle}
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="menu-toggle"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="mobile-nav"
        >
          <p>Explore LOVE</p>
          {links.map(([name, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
            >
              {name}
            </Link>
          ))}
          <Link href="/private-events">PRIVATE GATHERINGS</Link>
          <span>Indianapolis, Indiana</span>
        </nav>
      )}
    </header>
  );
}
