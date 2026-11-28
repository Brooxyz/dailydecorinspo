import roomsData from "@/data/rooms.json";
import { ProductCard, type Product } from "@/components/ProductCard";
import { notFound } from "next/navigation";
import { categoryLabel } from "@/lib/categories";

type Room = (typeof roomsData.rooms)[number];

// Average over rated (Amazon) items only; handmade Etsy items carry no star rating
function avgRating(products: Product[]): string {
  const rated = products.filter((p) => typeof p.rating === "number");
  if (!rated.length) return "—";
  return (rated.reduce((a, p) => a + (p.rating ?? 0), 0) / rated.length).toFixed(1);
}

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
    description: `Shop ${room.products.length} ${(room.products as Product[]).some((p) => p.store === "etsy") ? "curated" : "budget-friendly Amazon"} finds from this ${categoryLabel(room.category).toLowerCase()} design. ${room.subtitle}. Total: ${room.totalPrice}`,
    openGraph: {
      title: `${room.title} — Shop the Look`,
      description: `${room.products.length} curated finds • ${room.totalPrice}`,
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
  const hasEtsy = (room.products as Product[]).some((p) => p.store === "etsy");
  // Amazon "Add to Cart" form (documented for Associates): puts every Amazon item of the room
  // into the shopper's cart in one tap, attributed to our tag.
  const cartAsins = (room.products as Product[])
    .map((p) => (p.amazonUrl || "").match(/\/dp\/([A-Z0-9]{10})/)?.[1])
    .filter((a): a is string => Boolean(a));
  const cartUrl =
    "https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=dailydecorins-20&tag=dailydecorins-20&" +
    cartAsins.map((a, i) => `ASIN.${i + 1}=${a}&Quantity.${i + 1}=1`).join("&");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${room.title}: shop the look`,
    image: `https://dailydecorinspo.vercel.app${room.roomImage}`,
    itemListElement: (room.products as Product[]).map((p) => ({
      "@type": "ListItem",
      position: p.number,
      name: p.name,
      image: `https://dailydecorinspo.vercel.app${p.image}`,
      url: `https://dailydecorinspo.vercel.app/room/${room.slug}/#product-${p.number}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
              className="w-full aspect-[2/3] object-cover"
              loading="eager"
            />

            {/* Product count badge */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
              <p className="text-sm font-semibold text-warm-800">
                {room.products.length} Items • {room.totalPrice}
              </p>
            </div>

            {/* Shoppable hotspots placed on each product in the photo */}
            {(room.products as Product[]).map((product) =>
              product.hotspot ? (
                <a
                  key={product.number}
                  href={`#product-${product.number}`}
                  aria-label={`${product.number}. ${product.name} — ${product.priceRange}`}
                  title={`${product.name} • ${product.priceRange}`}
                  style={{ left: `${product.hotspot.x}%`, top: `${product.hotspot.y}%` }}
                  className="group/hs absolute -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  <span className="absolute inset-0 rounded-full bg-white/70 animate-ping opacity-60" />
                  <span className="relative w-9 h-9 rounded-full bg-warm-700 ring-[3px] ring-white flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover/hs:scale-110 group-hover/hs:bg-warm-800 transition-transform">
                    {product.number}
                  </span>
                  <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-warm-900/90 px-2 py-1 text-xs font-medium text-white opacity-0 group-hover/hs:opacity-100 transition-opacity hidden sm:block">
                    {product.name} • {product.priceRange}
                  </span>
                </a>
              ) : null
            )}
          </div>

          {/* Room Info */}
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-warm-200 text-warm-700 text-xs font-semibold uppercase tracking-wide mb-3">
                {categoryLabel(room.category)}
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
                  #{tag.replace(/\s+/g, "")}
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
                    {avgRating(room.products as Product[])}
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
                Every item is linked below. Click any product card to shop it on{" "}
                {hasEtsy ? "Amazon or our Etsy shop" : "Amazon"}.
              </p>
              {cartAsins.length >= 2 && (
                <a
                  href={cartUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="mt-4 block w-full text-center py-3 px-4 rounded-xl bg-white text-warm-900 font-semibold text-sm hover:bg-warm-100 transition-colors shadow-md"
                >
                  🛒 Add all {cartAsins.length} Amazon items to your cart →
                </a>
              )}
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
            <ProductCard key={product.number} product={product as Product} />
          ))}
        </div>

        {/* Disclosure */}
        <div className="mt-10 bg-warm-100 rounded-xl p-5">
          <p className="text-xs text-warm-600 leading-relaxed">
            <strong>#ad</strong> — As an Amazon Associate, I earn from
            qualifying purchases. Prices may vary. Product images are
            illustrative; check each listing for exact details.
            {hasEtsy &&
              " Items marked \"Handmade\" are sold by our own Etsy shop, so we earn from those sales."}{" "}
            All recommendations are based on personal curation and aesthetic
            fit. Last updated: {room.createdAt}.
          </p>
        </div>
      </section>
    </>
  );
}
