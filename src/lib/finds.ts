import roomsData from "@/data/rooms.json";
import type { Product } from "@/components/ProductCard";

// Roundup pages ("Best Amazon Rugs for Cozy Rooms") built from every room's products.
// A product goes to the first type whose pattern matches its name. Etsy items are left out.
export const FIND_TYPES = [
  { slug: "curtains", label: "Curtains", title: "Best Amazon Curtains for Cozy, Light-Filled Rooms", re: /curtain/i },
  { slug: "rugs", label: "Rugs", title: "Best Amazon Rugs & Runners Under $300", re: /\brug|runner/i },
  { slug: "mirrors", label: "Mirrors", title: "Best Amazon Wall Mirrors for Small Spaces", re: /mirror/i },
  { slug: "wall-art", label: "Wall Art", title: "Best Amazon Wall Art Sets for a Styled Look", re: /wall art|\bart\b|print|canvas|painting|poster|still life/i },
  { slug: "lighting", label: "Lighting", title: "Best Amazon Lamps, Pendants & Cozy Lighting", re: /lamp|light|sconce|pendant|lantern|candle/i },
  { slug: "furniture", label: "Furniture", title: "Best Budget Amazon Furniture for Small Rooms", re: /desk(?! pad)|chair|table|bench|nightstand|crib|headboard|sofa|rocker|bean bag|stool|cabinet|ladder|rack|luggage/i },
  { slug: "bedding-throws", label: "Bedding & Throws", title: "Best Amazon Bedding, Throws & Pillows", re: /comforter|duvet|sheet|blanket|throw|pillow|quilt|bedding/i },
  { slug: "storage", label: "Shelves & Storage", title: "Best Amazon Shelves, Baskets & Storage", re: /shel|basket|hamper|ledge|organizer|canister|jar|holder|tree holder|caddy/i },
  { slug: "plants-vases", label: "Plants & Vases", title: "Best Amazon Faux Plants & Vases", re: /plant|tree|eucalyptus|vase|branch|pampas|olive|pothos/i },
] as const;

export type FindItem = Product & { roomTitle: string; roomSlug: string };

export function typeOf(name: string): string | null {
  for (const t of FIND_TYPES) if (t.re.test(name)) return t.slug;
  return null;
}

export function findsBySlug(): Record<string, FindItem[]> {
  const out: Record<string, FindItem[]> = {};
  for (const room of roomsData.rooms) {
    for (const p of room.products as Product[]) {
      if (p.store === "etsy" || !p.amazonUrl) continue;
      const t = typeOf(p.name);
      if (!t) continue;
      (out[t] ||= []).push({ ...p, roomTitle: room.title, roomSlug: room.slug });
    }
  }
  // best rated first
  for (const k of Object.keys(out)) out[k].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return out;
}

export function liveFindTypes() {
  const by = findsBySlug();
  return FIND_TYPES.filter((t) => (by[t.slug] || []).length >= 3);
}
