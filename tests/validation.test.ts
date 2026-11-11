import { describe, it, expect } from "vitest";
import {
  reservationSchema,
  inquirySchema,
  changeSchema,
} from "../lib/validation";
import { money, venueDate } from "../lib/types";
const booking = {
  name: "Test Guest",
  email: "guest@example.test",
  phone: "+1 317 555 0100",
  sectionId: "10000000-0000-4000-8000-000000000001",
  windowId: "20000000-0000-4000-8000-000000000001",
  guests: 6,
  arrival: "2027-01-10T21:00:00-05:00",
  occasion: "Birthday",
  accepted: true,
};
describe("request validation", () => {
  it("accepts contact details without an account", () =>
    expect(reservationSchema.safeParse(booking).success).toBe(true));
  it.each([
    { guests: 0 },
    { guests: 2.5 },
    { email: "invalid" },
    { phone: "bad<script>" },
    { arrival: "21:00" },
    { accepted: false },
    { occasion: "invalid" },
    { website: "https://spam.test" },
    { requests: "x".repeat(2001) },
    { sectionId: "guessed" },
  ])("rejects invalid or bot-filled fields %j", (patch) =>
    expect(reservationSchema.safeParse({ ...booking, ...patch }).success).toBe(
      false,
    ),
  );
  it("requires a real inquiry message", () =>
    expect(
      inquirySchema.safeParse({
        name: "Guest",
        email: "a@example.test",
        phone: "3175550100",
        date: "2027-01-01",
        eventType: "Birthday",
        guests: 10,
        message: "hi",
      }).success,
    ).toBe(false));
  it("does not accept direct customer cancellation instructions", () =>
    expect(
      changeSchema.safeParse({
        kind: "cancel-now",
        message: "Cancel my booking",
      }).success,
    ).toBe(false));
});
describe("venue display", () => {
  it("formats money as whole USD", () => expect(money(25000)).toBe("$250"));
  it("uses Indianapolis local time across midnight UTC", () =>
    expect(
      venueDate("2027-01-02T02:00:00Z", { hour: "numeric", hour12: false }),
    ).toBe("21"));
  it("observes daylight saving time", () =>
    expect(
      venueDate("2027-07-02T02:00:00Z", { hour: "numeric", hour12: false }),
    ).toBe("22"));
});
