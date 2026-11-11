import Link from "next/link";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-identity">
        <Link href="/" className="wordmark" aria-label="LOVE home">
          LOVE.
        </Link>
        <p>
          Nightlife & hospitality
          <br />
          Indianapolis, Indiana
        </p>
      </div>
      <nav aria-label="More from LOVE" className="footer-discover">
        <Link href="/reserve">Reservations</Link>
        <Link href="/private-events">Private gatherings</Link>
        <Link href="/events">Event calendar</Link>
        <Link href="/visit">Visit information</Link>
      </nav>
      <div className="footer-legal">
        <span>© {new Date().getFullYear()} LOVE</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/booking-policy">Booking policy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/accessibility">Accessibility</Link>
        <Link href="/admin">Staff access</Link>
      </div>
    </footer>
  );
}
