"use client";

import { useEffect, useState } from "react";

// Per-visitor memory kept in this browser only (no accounts, nothing sent anywhere):
//   saved rooms (by slug) and saved products (by packshot path, unique per product),
//   and which rooms this visitor has already seen (for "new since your last visit").
const SAVED_KEY = "ddi-saved";
const SEEN_KEY = "ddi-seen";
const EVENT = "ddi-saved-change";

export type Saved = { rooms: string[]; products: string[] };
const EMPTY: Saved = { rooms: [], products: [] };

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or storage blocked: the page still works, it just will not remember */
  }
}

export function getSaved(): Saved {
  const s = read<Saved>(SAVED_KEY, EMPTY);
  return { rooms: Array.isArray(s.rooms) ? s.rooms : [], products: Array.isArray(s.products) ? s.products : [] };
}

export function toggleSaved(kind: keyof Saved, id: string): boolean {
  const s = getSaved();
  const has = s[kind].includes(id);
  s[kind] = has ? s[kind].filter((x) => x !== id) : [id, ...s[kind]];
  write(SAVED_KEY, s);
  window.dispatchEvent(new Event(EVENT));
  return !has;
}

/** Live view of the saved lists; null until mounted (avoids a hydration mismatch). */
export function useSaved(): Saved | null {
  const [saved, setSaved] = useState<Saved | null>(null);
  useEffect(() => {
    const sync = () => setSaved(getSaved());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync); // other tabs
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return saved;
}

/** Rooms this visitor has not seen before. First visit: none (everything is new, so nothing is "new"). */
export function takeNewRooms(allSlugs: string[]): string[] {
  const seen = read<string[] | null>(SEEN_KEY, null);
  write(SEEN_KEY, allSlugs);
  if (!seen) return [];
  return allSlugs.filter((s) => !seen.includes(s));
}
