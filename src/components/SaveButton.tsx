"use client";

import { toggleSaved, useSaved, type Saved } from "@/lib/visitor";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 20.5s-7.5-4.6-7.5-10.4A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.5 2.8c0 5.8-7.5 10.4-7.5 10.4z" />
    </svg>
  );
}

/** Heart that saves a room or a product to this browser's Saved list.
 *  variant "overlay": round icon button for photos; "pill": labelled button for page headers. */
export function SaveButton({
  kind,
  id,
  label,
  variant = "overlay",
  className = "",
}: {
  kind: keyof Saved;
  id: string;
  label: string;
  variant?: "overlay" | "pill";
  className?: string;
}) {
  const saved = useSaved();
  const on = !!saved?.[kind].includes(id);
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(kind, id);
  };
  const aria = on ? `Remove ${label} from saved` : `Save ${label}`;

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        aria-label={aria}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
          on ? "bg-accent text-accent-ink border-accent" : "bg-surface text-ink border-line hover:border-muted"
        } ${className}`}
      >
        <Heart filled={on} />
        {on ? "Saved" : "Save"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={aria}
      title={on ? "Saved" : "Save"}
      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
        on ? "bg-accent text-accent-ink" : "bg-white/90 text-[#2b1d14] hover:bg-white"
      } ${className}`}
    >
      <Heart filled={on} />
    </button>
  );
}

/** Header link to the Saved page with a live count. */
export function SavedLink() {
  const saved = useSaved();
  const n = saved ? saved.rooms.length + saved.products.length : 0;
  return (
    <a href="/saved/" className="relative text-sm font-medium text-ink-2 hover:text-ink transition-colors flex items-center gap-1.5" aria-label={`Saved${n ? `, ${n} items` : ""}`}>
      <Heart filled={n > 0} />
      <span className="hidden sm:inline">Saved</span>
      {n > 0 && (
        <span className="absolute -top-1.5 -right-2 sm:static sm:ml-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-accent text-accent-ink text-[10px] font-bold flex items-center justify-center tabular-nums">
          {n}
        </span>
      )}
    </a>
  );
}
