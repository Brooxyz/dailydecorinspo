// Human-readable labels for room.category slugs (shown on cards, badges and meta text)
export const CATEGORY_LABELS: Record<string, string> = {
  bedroom: "Bedroom",
  "reading-nook": "Reading Nook",
  "desktop-setup": "Desk Setup",
  "living-room": "Living Room",
  bathroom: "Bathroom",
  entryway: "Entryway",
  "coffee-bar": "Coffee Bar",
};

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug.replace(/-/g, " ");
}
