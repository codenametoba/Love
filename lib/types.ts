export type Venue = {
  verified: boolean;
  address?: string;
  phone?: string;
  email?: string;
  directionsUrl?: string;
  hours?: string;
  parking?: string;
  entryPolicy?: string;
  instagram?: string;
  intro?: string;
  heroHeadline?: string;
  heroBody?: string;
  seoDescription?: string;
};
export type Event = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  start: string;
  end: string;
  image?: string;
  performers?: string;
  ageRestriction?: string;
  dressCode?: string;
  entry?: string;
  ticketUrl?: string;
  category?: string;
  featured?: boolean;
  bookingEnabled?: boolean;
  operationalId?: string;
};
export type MenuItem = {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  category: string;
  allergens?: string;
  dietary?: string;
  image?: string;
  available: boolean;
};
export type Media = {
  _id: string;
  url: string;
  kind?: "image" | "video";
  poster?: string;
  transcript?: string;
  caption: string;
  collection: string;
  credit?: string;
};
export type Section = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  deposit_cents: number;
  minimum_spend_cents: number;
  image_url?: string;
  amenities: string[];
  available: boolean;
  layout_id?: string;
  layout?: { x: number; y: number; width: number; height: number };
  policy: string;
};
export type Window = {
  id: string;
  starts_at: string;
  ends_at: string;
  arrival_start: string;
  arrival_end: string;
  event_id?: string;
  title: string;
};
export type ReservationStatus =
  | "PENDING_APPROVAL"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED"
  | "PAYMENT_EXCEPTION";
export type Reservation = {
  id: string;
  reference: string;
  status: ReservationStatus;
  section_id: string;
  window_id: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  arrival: string;
  occasion: string;
  requests?: string;
  deposit_cents: number;
  minimum_spend_cents: number;
  policy: string;
  hold_expires_at?: string;
  checked_in_at?: string;
  no_show?: boolean;
  created_at: string;
  sections?: { name: string };
  booking_windows?: Window;
};
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
export const venueDate = (
  date: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) =>
  new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: "America/Indiana/Indianapolis",
  }).format(new Date(date));
