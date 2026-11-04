"use client";

import { useState } from "react";
import roomsData from "@/data/rooms.json";
import { RoomCard } from "@/components/RoomCard";

type Room = (typeof roomsData.rooms)[number];

const CATEGORIES = [
  { id: "all", label: "All Rooms" },
  { id: "bedroom", label: "Bedrooms" },
  { id: "reading-nook", label: "Reading Nooks" },
  { id: "desktop-setup", label: "Desk Setups" },
  { id: "living-room", label: "Living Rooms" },
  { id: "bathroom", label: "Bathrooms" },
];

export function RoomsExplorer({ initialRooms }: { initialRooms: Room[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredRooms = initialRooms.filter((room) => {
    if (selectedCategory === "all") return true;
    return room.category === selectedCategory;
  });

  return (
    <>
      {/* Category Pills */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-warm-800 text-white shadow-md shadow-warm-800/20 scale-105"
                    : "bg-white text-warm-700 hover:bg-warm-100 hover:text-warm-900 border border-warm-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Room Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}

          {/* Coming Soon Placeholder */}
          <div className="rounded-2xl border-2 border-dashed border-warm-300 flex items-center justify-center min-h-[360px] bg-warm-100/50 p-6">
            <div className="text-center">
              <p className="text-4xl mb-3">✨</p>
              <p className="font-display text-lg text-warm-700 font-semibold">
                More Styled Rooms Coming Soon
              </p>
              <p className="text-sm text-warm-500 mt-2 max-w-xs mx-auto">
                Discover fresh curated Amazon finds weekly on Pinterest @dailydecorinspo_
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
