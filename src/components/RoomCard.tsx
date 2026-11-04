import roomsData from "@/data/rooms.json";

type Room = (typeof roomsData.rooms)[number];

export function RoomCard({ room }: { room: Room }) {
  return (
    <a
      href={`/room/${room.slug}/`}
      className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4]">
        <img
          src={room.roomImage}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-block px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-warm-800 uppercase tracking-wide shadow-sm">
            {room.category}
          </span>
        </div>

        {/* Product count */}
        <div className="absolute top-3 right-3">
          <span className="inline-block px-3 py-1 rounded-full bg-warm-800/80 backdrop-blur-sm text-xs font-semibold text-white">
            {room.products.length} items
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-xl font-bold text-white leading-tight drop-shadow-md">
            {room.title}
          </h3>
          <p className="text-white/80 text-sm mt-1 drop-shadow-sm">
            {room.subtitle}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {room.products.slice(0, 3).map((product) => (
              <div
                key={product.number}
                className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {room.products.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-warm-200 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-warm-700">
                  +{room.products.length - 3}
                </span>
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-warm-800">
            {room.totalPrice}
          </span>
        </div>

        <div className="flex items-center gap-1 text-warm-500 group-hover:text-warm-800 transition-colors">
          <span className="text-sm font-medium">Shop</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="group-hover:translate-x-1 transition-transform"
          >
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </a>
  );
}
