import roomsData from "@/data/rooms.json";
import { ProductCard } from "@/components/ProductCard";
import { notFound } from "next/navigation";

type Room = (typeof roomsData.rooms)[number];

export function generateStaticParams() {
  return roomsData.rooms.map((room) => ({
    slug: room.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = roomsData.rooms.find((r) => r.slug === slug);
  if (!room) return {};

  return {
    title: `${room.title} — Daily Decor Inspo`,
    description: `Shop ${room.products.length} budget-friendly Amazon finds from this ${room.category} design. ${room.subtitle}. Total: ${room.totalPrice}`,
    openGraph: {
      title: `${room.title} — Shop the Look`,
      description: `${room.products.length} curated Amazon finds • ${room.totalPrice}`,
      images: [{ url: room.roomImage }],
    },
  };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = roomsData.rooms.find((r) => r.slug === slug);
  if (!room) notFound();

  return (
    <>
      {/* Back Navigation */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-warm-800 transition-colors group"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="group-hover:-translate-x-1 transition-transform"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All Rooms
        </a>
      </div>

      {/* Room Hero */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Room Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl pin-hover group">
            <img
              src={room.roomImage}
              alt={room.title}
              className="w-full aspect-[3/4] object-cover"
              loading="eager"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Product count badge */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
              <p className="text-sm font-semibold text-warm-800">
                {room.products.length} Items • {room.totalPrice}
              </p>
            </div>

            {/* Number indicators on image */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex flex-wrap gap-2">
                {room.products.map((product) => (
                  <a
                    key={product.number}
                    href={`#product-${product.number}`}
                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-sm font-bold text-warm-800 shadow-md hover:bg-white hover:scale-110 transition-all"
                  >
                    {product.number}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Room Info */}
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-warm-200 text-warm-700 text-xs font-semibold uppercase tracking-wide mb-3">
                {room.category}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-warm-900 leading-tight">
                {room.title}
              </h1>
              <p className="text-warm-600 mt-2 text-lg">{room.subtitle}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {room.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-warm-100 text-warm-500 text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="bg-warm-100 rounded-xl p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-display text-2xl font-bold text-warm-800">
                    {room.products.length}
                  </p>
                  <p className="text-xs text-warm-500 mt-1">Products</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-warm-800">
                    {room.totalPrice}
                  </p>
                  <p className="text-xs text-warm-500 mt-1">Total Cost</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-sage-600">
                    ★{" "}
                    {(
                      room.products.reduce((a, p) => a + p.rating, 0) /
                      room.products.length
                    ).toFixed(1)}
                  </p>
                  <p className="text-xs text-warm-500 mt-1">Avg Rating</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-warm-700 to-warm-800 rounded-xl p-5 text-white">
              <p className="font-display text-lg font-semibold">
                Love this room?
              </p>
              <p className="text-warm-200 text-sm mt-1">
                Every item is linked below. Click any product card to shop it on
                Amazon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-warm-800 flex items-center justify-center text-white text-sm font-bold">
            🛒
          </div>
          <h2 className="font-display text-2xl font-bold text-warm-900">
            Shop Every Item
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {room.products.map((product) => (
            <ProductCard key={product.number} product={product} />
          ))}
        </div>

        {/* Disclosure */}
        <div className="mt-10 bg-warm-100 rounded-xl p-5">
          <p className="text-xs text-warm-600 leading-relaxed">
            <strong>#ad</strong> — As an Amazon Associate, I earn from
            qualifying purchases. Prices may vary. Product images are from
            Amazon.com. All recommendations are based on personal curation and
            aesthetic fit. Last updated: {room.createdAt}.
          </p>
        </div>
      </section>
    </>
  );
}
