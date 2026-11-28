"use client";

import roomsData from "@/data/rooms.json";
import { RoomCard } from "@/components/RoomCard";
import { ProductCard, type Product } from "@/components/ProductCard";
import { KeepHandy } from "@/components/KeepHandy";
import { useSaved } from "@/lib/visitor";

const rooms = roomsData.rooms;

export function SavedList() {
  const saved = useSaved();
  if (!saved) return <div className="min-h-[40vh]" />;

  const savedRooms = saved.rooms.map((s) => rooms.find((r) => r.slug === s)).filter((r) => r !== undefined);
  const savedProducts = saved.products
    .map((img) => {
      for (const r of rooms) {
        const p = (r.products as Product[]).find((x) => x.image === img);
        if (p) return { p, room: r };
      }
      return undefined;
    })
    .filter((x) => x !== undefined);

  if (!savedRooms.length && !savedProducts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface-2 p-8 sm:p-12 text-center max-w-xl mx-auto">
        <p className="font-display text-2xl text-ink">Nothing saved yet</p>
        <p className="mt-3 text-ink-2 leading-relaxed">
          Tap the heart on any room or product to keep it here, then come back when you are ready to shop.
        </p>
        <a href="/#rooms" className="mt-6 inline-block px-6 py-3 rounded-full bg-accent text-accent-ink font-semibold text-sm hover:bg-accent-hover transition-colors">
          Browse the rooms
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-14">
      {savedRooms.length > 0 && (
        <section>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-ink mb-5">Rooms <span className="text-muted text-lg">{savedRooms.length}</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRooms.map((r) => <RoomCard key={r.slug} room={r} />)}
          </div>
        </section>
      )}
      {savedProducts.length > 0 && (
        <section>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-ink mb-5">Pieces <span className="text-muted text-lg">{savedProducts.length}</span></h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {savedProducts.map(({ p, room }) => (
              <div key={p.image} className="flex flex-col gap-2">
                <ProductCard product={p} />
                <a href={`/room/${room.slug}/#product-${p.number}`} className="text-xs text-muted hover:text-ink underline-offset-4 hover:underline px-1">
                  From {room.title}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="rounded-2xl bg-surface-2 border border-line p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-ink-2 text-sm leading-relaxed max-w-lg">
          Saved items live in this browser. Keep the site one tap away to check back for new rooms.
        </p>
        <KeepHandy />
      </div>
    </div>
  );
}
