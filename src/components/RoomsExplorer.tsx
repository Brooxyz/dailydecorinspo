"use client";

import { useState } from "react";
import roomsData from "@/data/rooms.json";
import { RoomCard } from "@/components/RoomCard";
import categoryData from "@/data/categories.json";
import { KeepHandy } from "@/components/KeepHandy";

type Room = (typeof roomsData.rooms)[number];

export function RoomsExplorer({ initialRooms }: { initialRooms: Room[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Tabs come from src/data/categories.json; only categories that have rooms are shown, with counts
  const counts = initialRooms.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});
  const tabs = [
    { id: "all", label: "All rooms", count: initialRooms.length },
    ...Object.entries(categoryData)
      .filter(([id]) => counts[id])
      .map(([id, c]) => ({ id, label: c.tab, count: counts[id] })),
  ];

  // "New": the three newest rooms, if they were added within a week of the latest one
  const latest = Math.max(...initialRooms.map((r) => Date.parse(r.createdAt)));
  const newSlugs = new Set(
    [...initialRooms]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 3)
      .filter((r) => latest - Date.parse(r.createdAt) <= 7 * 864e5)
      .map((r) => r.slug)
  );

  const filteredRooms = initialRooms.filter(
    (room) => selectedCategory === "all" || room.category === selectedCategory
  );

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pt-4 pb-6">
        <div className="flex items-end justify-between gap-4 mb-5">
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-ink tracking-tight">The rooms</h2>
        </div>
        {/* Wraps onto several lines, so every category stays visible on every screen width */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter rooms by type">
          {tabs.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border ${
                  isActive
                    ? "bg-accent text-accent-ink border-accent"
                    : "bg-surface text-ink-2 border-line hover:text-ink hover:border-muted"
                }`}
              >
                {cat.label}
                <span className={`ml-1.5 text-xs ${isActive ? "opacity-80" : "text-muted"}`}>{cat.count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} isNew={newSlugs.has(room.slug)} />
          ))}

          <div className="rounded-2xl border border-dashed border-line flex items-center justify-center min-h-[320px] bg-surface-2 p-8">
            <div className="text-center max-w-xs flex flex-col items-center">
              <p className="font-display text-2xl text-ink">A new room every few days</p>
              <p className="text-sm text-ink-2 mt-3 leading-relaxed">
                Keep the site handy to see each new room first, or follow{" "}
                <a href="https://pinterest.com/dailydecorinspo_" target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
                  @dailydecorinspo_
                </a>{" "}
                on Pinterest.
              </p>
              <KeepHandy className="mt-5 items-center" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
