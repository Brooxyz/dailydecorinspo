"use client";

import { useEffect, useState } from "react";
import { takeNewRooms } from "@/lib/visitor";

type R = { slug: string; title: string; roomImage: string };

/** For returning visitors: "2 new rooms since your last visit", with the new rooms one tap away.
 *  First visits show nothing; the list of seen rooms lives in this browser only. */
export function NewSinceVisit({ rooms }: { rooms: R[] }) {
  const [fresh, setFresh] = useState<R[]>([]);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const slugs = takeNewRooms(rooms.map((r) => r.slug));
    setFresh(rooms.filter((r) => slugs.includes(r.slug)));
  }, [rooms]);

  if (!fresh.length || closed) return null;
  return (
    <section className="max-w-6xl mx-auto px-4 pb-8" aria-label="New since your last visit">
      <div className="hero-tag rounded-2xl border border-line bg-surface p-4 sm:p-5 flex items-center gap-4">
        <div className="flex -space-x-3 shrink-0">
          {fresh.slice(0, 3).map((r) => (
            <img key={r.slug} src={r.roomImage} alt="" className="w-12 h-16 rounded-lg object-cover ring-2 ring-surface" />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">
            {fresh.length === 1 ? "1 new room" : `${fresh.length} new rooms`} since your last visit
          </p>
          <p className="text-sm text-ink-2 truncate">
            {fresh.slice(0, 3).map((r, i) => (
              <span key={r.slug}>
                {i > 0 && ", "}
                <a href={`/room/${r.slug}/`} className="hover:text-ink underline underline-offset-4 decoration-line">{r.title}</a>
              </span>
            ))}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label="Dismiss"
          className="w-8 h-8 shrink-0 rounded-full text-muted hover:text-ink hover:bg-surface-2 flex items-center justify-center transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>
    </section>
  );
}
