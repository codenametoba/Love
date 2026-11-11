"use client";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
export function AvailabilitySearch() {
  const router = useRouter();
  return (
    <form
      className="availability-search"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        router.push(`/reserve?date=${d.get("date")}&guests=${d.get("guests")}`);
      }}
    >
      <label>
        Date
        <input
          name="date"
          type="date"
          aria-label="Preferred date"
          required
          min={new Date().toLocaleDateString("en-CA", {
            timeZone: "America/Indiana/Indianapolis",
          })}
        />
      </label>
      <label>
        Party size
        <select name="guests" aria-label="Number of guests" defaultValue="4">
          {[2, 4, 6, 8, 10, 12, 16, 20].map((n) => (
            <option key={n} value={n}>
              {n} guests
            </option>
          ))}
        </select>
      </label>
      <button className="button" type="submit">
        FIND A SECTION
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
