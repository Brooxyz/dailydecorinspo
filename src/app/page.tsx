import roomsData from "@/data/rooms.json";
import { RoomsExplorer } from "@/components/RoomsExplorer";

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

      {/* Interactive Category Filter & Room Grid */}
      <RoomsExplorer initialRooms={roomsData.rooms} />
    </>
  );
}
