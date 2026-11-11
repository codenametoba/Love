import type { Metadata, Viewport } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "LOVE — Nightlife & hospitality in Indianapolis",
    template: "%s — LOVE",
  },
  description:
    "Explore LOVE in Indianapolis: the venue, event calendar, food and drinks, and section reservations.",
  openGraph: {
    type: "website",
    siteName: "LOVE",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  robots:
    process.env.NEXT_PUBLIC_LAUNCH_READY === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#110d0e" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
