import roomsData from "@/data/rooms.json";
import { RoomCard } from "@/components/RoomCard";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-warm-100 to-warm-50 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-warm-500 font-medium text-sm tracking-widest uppercase mb-4">
            Curated Amazon Finds
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-warm-900 leading-tight mb-6">
            Shop the Room
          </h2>
          <p className="text-warm-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Every room is designed with{" "}
            <span className="text-warm-800 font-semibold">
              budget-friendly Amazon products
            </span>{" "}
            you can actually buy. Click any room to see every item with direct
            links.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-10">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-warm-800">
                {roomsData.rooms.length}
              </p>
              <p className="text-sm text-warm-500">Styled Rooms</p>
            </div>
            <div className="w-px h-10 bg-warm-300" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-warm-800">
                {roomsData.rooms.reduce(
                  (acc, room) => acc + room.products.length,
                  0
                )}
              </p>
              <p className="text-sm text-warm-500">Products</p>
            </div>
            <div className="w-px h-10 bg-warm-300" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-warm-800">
                100%
              </p>
              <p className="text-sm text-warm-500">Shoppable</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter (future expansion) */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <CategoryPill label="All Rooms" active />
          <CategoryPill label="Bedroom" />
          <CategoryPill label="Desk Setup" />
          <CategoryPill label="Living Room" />
          <CategoryPill label="Bathroom" />
        </div>
      </section>

      {/* Room Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomsData.rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}

          {/* Coming Soon Placeholder */}
          <div className="rounded-2xl border-2 border-dashed border-warm-300 flex items-center justify-center min-h-[360px] bg-warm-100/50">
            <div className="text-center p-6">
              <p className="text-4xl mb-3">✨</p>
              <p className="font-display text-lg text-warm-600 font-medium">
                More Rooms Coming Soon
              </p>
              <p className="text-sm text-warm-400 mt-2">
                Follow on Pinterest for updates
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CategoryPill({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
        active
          ? "bg-warm-800 text-white shadow-md"
          : "bg-warm-100 text-warm-600 hover:bg-warm-200 hover:text-warm-800"
      }`}
    >
      {label}
    </button>
  );
}
