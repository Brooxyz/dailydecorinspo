import categories from "@/data/categories.json";

// Single source of truth for room categories: src/data/categories.json
// (labels, Explore tabs, Pinterest boards, feed tags, pin hashtags).
export type CategoryMeta = (typeof categories)[keyof typeof categories];
export const CATEGORIES: Record<string, CategoryMeta> = categories;

// Human-readable labels for room.category slugs (shown on cards, badges and meta text)
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORIES).map(([id, c]) => [id, c.label])
);

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug.replace(/-/g, " ");
}
