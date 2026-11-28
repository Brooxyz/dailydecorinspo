"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/components/ProductCard";

/** Numbered dots on the room photo. Clicking one opens a small card beside it with the product's
 *  name, note, price, rating and the shop button (same link and rel as the product list below).
 *  On phones the card docks to the bottom of the photo so it always fits. */
export function RoomHotspots({ products }: { products: Product[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);

  const active = products.find((p) => p.number === open && p.hotspot);

  return (
    <div ref={root} className="absolute inset-0 z-10" style={{ pointerEvents: "none" }}>
      {products.map((p) =>
        p.hotspot ? (
          <a
            key={p.number}
            href={`#product-${p.number}`}
            onClick={(e) => { e.preventDefault(); setOpen((o) => (o === p.number ? null : p.number)); }}
            aria-label={`${p.number}. ${p.name}, ${p.priceRange}`}
            aria-expanded={open === p.number}
            aria-controls="hotspot-card"
            style={{ left: `${p.hotspot.x}%`, top: `${p.hotspot.y}%`, pointerEvents: "auto" }}
            className="group/hs absolute -translate-x-1/2 -translate-y-1/2"
          >
            {open === null && <span className="absolute inset-0 rounded-full bg-white/70 animate-ping opacity-50 motion-reduce:hidden" />}
            <span
              className={`relative w-9 h-9 rounded-full ring-[3px] ring-white flex items-center justify-center text-sm font-semibold shadow-lg group-hover/hs:scale-110 transition-transform ${
                open === p.number ? "bg-white text-[#7a4a2b] scale-110" : "bg-[#7a4a2b] text-white"
              }`}
            >
              {p.number}
            </span>
          </a>
        ) : null
      )}

      {active && active.hotspot && <HotspotCard key={active.number} p={active} onClose={() => setOpen(null)} />}
    </div>
  );
}

function HotspotCard({ p, onClose }: { p: Product; onClose: () => void }) {
  const isEtsy = p.store === "etsy";
  const href = isEtsy ? p.shopUrl : p.amazonUrl;
  const { x, y } = p.hotspot!;
  // Phones: dock to the bottom of the photo. Larger screens: beside the dot, on the side with more
  // room, vertically centred on it but kept inside the photo.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 640px)");
    const set = () => setWide(m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);
  const pos: React.CSSProperties = !wide
    ? { left: 12, right: 12, bottom: 12 }
    : {
        width: "17rem",
        ...(x < 55 ? { left: `calc(${x}% + 28px)` } : { right: `calc(${100 - x}% + 28px)` }),
        ...(y < 25 ? { top: 16 } : y > 75 ? { bottom: 16 } : { top: `${y}%`, translate: "0 -50%" }),
      };

  return (
    <div
      id="hotspot-card"
      role="dialog"
      aria-label={p.name}
      style={{ ...pos, pointerEvents: "auto" }}
      className="hero-tag absolute rounded-2xl bg-surface border border-line shadow-2xl p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 shrink-0 rounded-full bg-[#7a4a2b] text-white text-xs font-semibold flex items-center justify-center">
          {p.number}
        </span>
        <h3 className="flex-1 font-semibold text-ink text-sm leading-snug">{p.name}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 w-7 h-7 shrink-0 rounded-full text-muted hover:text-ink hover:bg-surface-2 flex items-center justify-center transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-2">{p.description}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-2">
        {isEtsy ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-semibold">Handmade, our Etsy shop</span>
        ) : p.rating ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-semibold">★ {p.rating} on Amazon</span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-display text-xl font-medium text-ink">{p.priceRange}</span>
        <a
          href={href}
          target="_blank"
          rel={isEtsy ? "noopener noreferrer" : "noopener noreferrer nofollow sponsored"}
          className="py-2 px-4 rounded-full bg-accent text-accent-ink font-semibold text-sm hover:bg-accent-hover transition-colors"
        >
          {isEtsy ? "Shop on Etsy" : "Shop on Amazon"}
        </a>
      </div>
      <a href={`#product-${p.number}`} onClick={onClose} className="mt-2 inline-block text-xs text-muted hover:text-ink underline-offset-4 hover:underline">
        See it in the list
      </a>
    </div>
  );
}
