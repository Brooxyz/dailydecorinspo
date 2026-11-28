import roomsData from "@/data/rooms.json";
import { RoomsExplorer } from "@/components/RoomsExplorer";
import { findsBySlug, liveFindTypes } from "@/lib/finds";
import type { Product } from "@/components/ProductCard";

export default function HomePage() {
  const rooms = roomsData.rooms;
  const productCount = rooms.reduce((acc, r) => acc + r.products.length, 0);
  // Newest rooms lead the hero collage; the big one carries a live product tag (the site's signature)
  const [lead, second, third] = [...rooms].reverse();
  const tagged = (lead.products as Product[]).find((p) => p.hotspot && p.hotspot.y > 45 && p.hotspot.y < 80) ?? (lead.products[0] as Product);
  const finds = findsBySlug();

  return (
    <>
      {/* Hero: a real room with a real, shoppable tag */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-14 sm:pt-16 sm:pb-20 grid gap-10 lg:grid-cols-[1fr_1.05fr] items-center">
        <div className="max-w-xl">
          <h1 className="font-display text-[2.6rem] leading-[1.05] sm:text-6xl font-medium text-ink tracking-tight">
            Rooms you can buy, piece by piece.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-2 max-w-[34rem]">
            {rooms.length} styled corners and {productCount} well-reviewed Amazon finds. Open a room
            to see every item in the photo with its price and a direct link.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#rooms"
              className="px-6 py-3 rounded-full bg-accent text-accent-ink font-semibold text-sm hover:bg-accent-hover transition-colors"
            >
              Browse the rooms
            </a>
            <a
              href="#shop-by-piece"
              className="px-6 py-3 rounded-full border border-line text-ink font-semibold text-sm hover:border-muted transition-colors"
            >
              Shop by piece
            </a>
          </div>
        </div>

        <div className="relative h-[440px] sm:h-[540px]">
          <a
            href={`/room/${second.slug}/`}
            className="absolute left-0 top-10 w-[38%] aspect-[2/3] rounded-2xl overflow-hidden shadow-lg rotate-[-3deg] hidden sm:block"
            aria-label={second.title}
          >
            <img src={second.roomImage} alt={second.title} className="w-full h-full object-cover" />
          </a>
          <a
            href={`/room/${third.slug}/`}
            className="absolute right-0 bottom-0 w-[34%] aspect-[2/3] rounded-2xl overflow-hidden shadow-lg rotate-[3deg] hidden sm:block"
            aria-label={third.title}
          >
            <img src={third.roomImage} alt={third.title} className="w-full h-full object-cover" />
          </a>
          <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full aspect-[2/3] max-w-[72%] sm:max-w-none">
            <a
              href={`/room/${lead.slug}/`}
              className="block w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-4 ring-canvas"
              aria-label={lead.title}
            >
              <img src={lead.roomImage} alt={lead.title} className="w-full h-full object-cover" loading="eager" />
            </a>
            {tagged.hotspot && (
              <a
                href={`/room/${lead.slug}/#product-${tagged.number}`}
                className="absolute z-10 flex items-center gap-2 -translate-x-3 -translate-y-1/2"
                style={{ left: `${Math.min(tagged.hotspot.x, 55)}%`, top: `${tagged.hotspot.y}%` }}
              >
                <span className="w-6 h-6 rounded-full bg-accent ring-[3px] ring-white shadow-md shrink-0" />
                <span className="rounded-lg bg-surface/95 backdrop-blur px-3 py-1.5 shadow-lg text-xs leading-tight text-ink max-w-[11rem]">
                  <span className="block font-semibold truncate">{tagged.name}</span>
                  <span className="text-muted">{tagged.priceRange} on Amazon</span>
                </span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Rooms */}
      <div id="rooms" className="scroll-mt-20">
        <RoomsExplorer initialRooms={rooms} />
      </div>

      {/* Shop by piece: roundup pages built from every room */}
      <section id="shop-by-piece" className="max-w-6xl mx-auto px-4 pb-8 scroll-mt-20">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-ink tracking-tight">Shop by piece</h2>
            <p className="mt-2 text-ink-2">Every rug, lamp and shelf from our rooms, grouped and sorted by rating.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {liveFindTypes().map((t) => {
            const items = finds[t.slug] || [];
            const cover = items[0];
            return (
              <a
                key={t.slug}
                href={`/finds/${t.slug}/`}
                className="group rounded-2xl border border-line bg-surface p-3 hover:border-muted transition-colors"
              >
                <div className="aspect-square rounded-xl bg-well overflow-hidden flex items-center justify-center">
                  {cover && (
                    <img
                      src={cover.image}
                      alt=""
                      loading="lazy"
                      className="w-[82%] h-[82%] object-contain mix-blend-multiply group-hover:scale-[1.04] transition-transform duration-300"
                    />
                  )}
                </div>
                <p className="mt-3 font-semibold text-ink text-sm">{t.label}</p>
                <p className="text-xs text-muted">{items.length} picks</p>
              </a>
            );
          })}
        </div>
      </section>
    </>
  );
}
