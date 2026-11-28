"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HeroRoom = {
  slug: string;
  title: string;
  roomImage: string;
  // products worth tagging in the hero (hotspot in the readable middle of the photo)
  tags: { number: number; name: string; priceRange: string; x: number; y: number; store?: string }[];
};

const wrap = (i: number, n: number) => ((i % n) + n) % n;

/** Hero collage that pages through every room: the current room sits large in the middle with a live
 *  product tag, the previous and next rooms sit small behind it. Arrows, keyboard and swipe all page. */
export function HeroCarousel({ rooms }: { rooms: HeroRoom[] }) {
  const n = rooms.length;
  const [index, setIndex] = useState(0);
  const [visits, setVisits] = useState(0); // changes the tagged product on every step
  const touchX = useRef<number | null>(null);

  const go = useCallback((step: number) => {
    setIndex((i) => wrap(i + step, n));
    setVisits((v) => v + 1);
  }, [n]);

  // Warm the cache for the rooms one more step away, so paging never shows a blank photo
  useEffect(() => {
    for (const d of [-2, 2]) {
      const img = new Image();
      img.src = rooms[wrap(index + d, n)].roomImage;
    }
  }, [index, n, rooms]);

  const current = rooms[index];
  const prev = rooms[wrap(index - 1, n)];
  const next = rooms[wrap(index + 1, n)];
  const tag = current.tags.length ? current.tags[visits % current.tags.length] : null;

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Browse the rooms"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="relative h-[440px] sm:h-[540px]">
        <button
          type="button"
          onClick={() => go(-1)}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute left-0 top-10 w-[38%] aspect-[2/3] rounded-2xl overflow-hidden shadow-lg rotate-[-3deg] hidden sm:block opacity-90 hover:opacity-100 transition-opacity"
        >
          <img key={prev.slug} src={prev.roomImage} alt="" className="hero-in w-full h-full object-cover" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute right-0 bottom-0 w-[34%] aspect-[2/3] rounded-2xl overflow-hidden shadow-lg rotate-[3deg] hidden sm:block opacity-90 hover:opacity-100 transition-opacity"
        >
          <img key={next.slug} src={next.roomImage} alt="" className="hero-in w-full h-full object-cover" />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full aspect-[2/3] max-w-[72%] sm:max-w-none">
          <a
            key={current.slug}
            href={`/room/${current.slug}/`}
            className="hero-in block w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-4 ring-canvas"
            aria-label={`${current.title}, room ${index + 1} of ${n}`}
          >
            <img src={current.roomImage} alt={current.title} className="w-full h-full object-cover" loading="eager" />
          </a>
          {tag && (
            <a
              key={`${current.slug}-${tag.number}`}
              href={`/room/${current.slug}/#product-${tag.number}`}
              // the label opens toward the middle of the photo so it never runs off the edge (or the screen)
              className={`hero-tag absolute z-10 flex items-center gap-2 ${tag.x > 50 ? "flex-row-reverse" : ""}`}
              style={{
                left: `${Math.min(Math.max(tag.x, 12), 88)}%`,
                top: `${tag.y}%`,
                // `translate`, not `transform`: the pop-in animation owns transform
                translate: tag.x > 50 ? "calc(-100% + 12px) -50%" : "-12px -50%",
              }}
            >
              <span className="w-6 h-6 rounded-full bg-accent ring-[3px] ring-white shadow-md shrink-0" />
              <span className="rounded-lg bg-surface/95 backdrop-blur px-3 py-1.5 shadow-lg text-xs leading-tight text-ink max-w-[9.5rem] sm:max-w-[11rem]">
                <span className="block font-semibold truncate">{tag.name}</span>
                <span className="text-muted">{tag.priceRange} {tag.store === "etsy" ? "on Etsy" : "on Amazon"}</span>
              </span>
            </a>
          )}

          {/* Arrows sit on the edges of the main photo */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous room"
            className="absolute z-20 left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface/95 text-ink shadow-lg ring-1 ring-line flex items-center justify-center hover:bg-surface transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next room"
            className="absolute z-20 right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface/95 text-ink shadow-lg ring-1 ring-line flex items-center justify-center hover:bg-surface transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-ink-2" aria-live="polite">
        <a href={`/room/${current.slug}/`} className="font-semibold text-ink hover:underline underline-offset-4">{current.title}</a>
        <span className="text-muted ml-2 tabular-nums">{index + 1} / {n}</span>
      </p>
    </div>
  );
}
