import roomsData from "@/data/rooms.json";
import { categoryLabel } from "@/lib/categories";
import { SaveButton } from "@/components/SaveButton";

type Room = (typeof roomsData.rooms)[number];

export function RoomCard({ room, isNew = false }: { room: Room; isNew?: boolean }) {
  return (
    // The heart sits beside the link, not inside it (a button inside a link is invalid HTML)
    <div className="relative">
      <a
        href={`/room/${room.slug}/`}
        className="group block rounded-2xl overflow-hidden bg-surface border border-line hover:border-muted transition-colors"
      >
        <div className="relative overflow-hidden aspect-[3/4]">
          <img
            src={room.roomImage}
            alt={room.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />

          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-[#2b1d14]">
              {categoryLabel(room.category)}
            </span>
            {isNew && (
              <span className="px-3 py-1 rounded-full bg-accent text-accent-ink text-xs font-semibold">New</span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-2xl font-medium text-white leading-tight">
              {room.title}
            </h3>
            <p className="text-white/85 text-sm mt-1 line-clamp-2">{room.subtitle}</p>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex -space-x-2 shrink-0">
              {room.products.slice(0, 3).map((product) => (
                <div
                  key={product.number}
                  className="w-8 h-8 rounded-full border-2 border-surface overflow-hidden bg-well"
                >
                  <img src={product.image} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
              ))}
            </div>
            <span className="text-sm text-ink-2 truncate">
              {room.products.length} items · <span className="font-semibold text-ink">{room.totalPrice}</span>
            </span>
          </div>
          <span className="text-sm font-medium text-ink-2 group-hover:text-ink transition-colors shrink-0">
            Shop the room
          </span>
        </div>
      </a>
      <SaveButton kind="rooms" id={room.slug} label={room.title} className="absolute top-3 right-3" />
    </div>
  );
}
