import roomsData from "@/data/rooms.json";
import { RoomsExplorer } from "@/components/RoomsExplorer";
import { HeroCarousel, type HeroRoom } from "@/components/HeroCarousel";
import { NewSinceVisit } from "@/components/NewSinceVisit";
import { findsBySlug, liveFindTypes } from "@/lib/finds";
import type { Product } from "@/components/ProductCard";

export default function HomePage() {
  const rooms = roomsData.rooms;
  // Hero collage pages through every room, newest first; each room offers the products whose tag
  // sits in the readable middle of its photo, and the tagged one changes on every step
  const heroRooms: HeroRoom[] = [...rooms].reverse().map((r) => {
    const tags = (r.products as Product[])
      .filter((p) => p.hotspot && p.hotspot.y > 30 && p.hotspot.y < 80)
      .map((p) => ({ number: p.number, name: p.name, priceRange: p.priceRange, x: p.hotspot!.x, y: p.hotspot!.y, store: p.store }));
    return { slug: r.slug, title: r.title, roomImage: r.roomImage, tags };
  });
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
            Cozy, livable corners styled with well-reviewed Amazon finds. Open one to see every piece in the photo,
            what it costs and where to get it, one item at a time.
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

        <HeroCarousel rooms={heroRooms} />
      </section>

      {/* Returning visitors: what was added since they last came */}
      <NewSinceVisit rooms={heroRooms.map(({ slug, title, roomImage }) => ({ slug, title, roomImage }))} />

      {/* Rooms */}
      <div id="rooms" className="scroll-mt-20">
        <RoomsExplorer initialRooms={[...rooms].reverse()} />
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
