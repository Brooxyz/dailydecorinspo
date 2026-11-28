import type { MetadataRoute } from "next";
import roomsData from "@/data/rooms.json";
import { liveFindTypes } from "@/lib/finds";

export const dynamic = "force-static";
const BASE = "https://dailydecorinspo.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const rooms = roomsData.rooms.map((r) => ({
    url: `${BASE}/room/${r.slug}/`,
    lastModified: new Date(r.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const finds = liveFindTypes().map((t) => ({
    url: `${BASE}/finds/${t.slug}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  return [{ url: `${BASE}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }, ...rooms, ...finds];
}
