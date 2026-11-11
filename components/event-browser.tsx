"use client";
import { useState } from "react";
import { Event } from "@/lib/types";
import { EventWall } from "./events";
import { Empty } from "./ui";
export function EventBrowser({ events }: { events: Event[] }) {
  const [tab, setTab] = useState("Upcoming");
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("All categories");
  const categories = Array.from(
    new Set(events.map((e) => e.category).filter(Boolean)),
  );
  const filtered = events.filter((e) => {
    const past = new Date(e.end) < new Date();
    return (
      (tab === "Past" ? past : !past) &&
      (tab !== "Featured" || e.featured) &&
      `${e.title} ${e.performers || ""}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (!date ||
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Indiana/Indianapolis",
        }).format(new Date(e.start)) === date) &&
      (category === "All categories" || e.category === category)
    );
  });
  return (
    <>
      <div className="filter-bar">
        <div className="filter-tabs" aria-label="Event period">
          {["Upcoming", "Featured", "Past"].map((t) => (
            <button aria-pressed={tab === t} key={t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <input
          aria-label="Search events or artists"
          placeholder="Search events or artists"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          aria-label="Filter by date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {categories.length > 0 && (
          <select
            aria-label="Event category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        )}
      </div>
      {filtered.length ? (
        <EventWall events={filtered} />
      ) : !q && !date && tab === "Upcoming" ? (
        <EventWall events={[]} />
      ) : (
        <Empty title="No matching dates.">
          Change the filters to explore another part of the calendar.
        </Empty>
      )}
    </>
  );
}
