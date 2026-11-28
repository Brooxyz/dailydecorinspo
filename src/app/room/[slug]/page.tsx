import { RoomHotspots } from "@/components/RoomHotspots";
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
    // dailydecorcart-20 = separate Associates tracking ID so cart-button sales show up on their own
    "https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=dailydecorcart-20&tag=dailydecorcart-20&" +
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
        <a href="/#rooms" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All rooms
        </a>
      </div>

      {/* Room Hero */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Room Image with shoppable hotspots */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl lg:sticky lg:top-24">
            <img src={room.roomImage} alt={room.title} className="w-full aspect-[2/3] object-cover" loading="eager" />

            <RoomHotspots products={room.products as Product[]} />
          </div>

          {/* Room Info */}
          <div className="space-y-6 lg:pt-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-surface-2 text-ink-2 text-xs font-semibold mb-4">
                {categoryLabel(room.category)}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-ink leading-[1.05] tracking-tight">
                {room.title}
              </h1>
              <p className="text-ink-2 mt-3 text-lg leading-relaxed">{room.subtitle}</p>
            </div>

            <dl className="grid grid-cols-3 rounded-2xl border border-line bg-surface divide-x divide-line">
              <div className="p-4 text-center">
                <dt className="text-xs text-muted">Pieces</dt>
                <dd className="font-display text-2xl text-ink mt-1">{room.products.length}</dd>
              </div>
              <div className="p-4 text-center">
                <dt className="text-xs text-muted">Whole look</dt>
                <dd className="font-display text-2xl text-ink mt-1">{room.totalPrice}</dd>
              </div>
              <div className="p-4 text-center">
                <dt className="text-xs text-muted">Avg rating</dt>
                <dd className="font-display text-2xl text-sage mt-1">★ {avgRating(room.products as Product[])}</dd>
              </div>
            </dl>

            <div className="rounded-2xl bg-surface-2 p-5">
              <p className="font-display text-xl text-ink">Love this room?</p>
              <p className="text-ink-2 text-sm mt-1 leading-relaxed">
                Tap a number on the photo or scroll down: every item is linked to{" "}
                {hasEtsy ? "Amazon or our Etsy shop" : "Amazon"}.
              </p>
              {cartAsins.length >= 2 && (
                <a
                  href={cartUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="mt-4 block w-full text-center py-3 px-4 rounded-full bg-accent text-accent-ink font-semibold text-sm hover:bg-accent-hover transition-colors"
                >
                  {hasEtsy ? "Add all Amazon items to your cart" : "Add all items to your Amazon cart"}
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {room.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full border border-line text-muted text-xs">
                  #{tag.replace(/\s+/g, "")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="font-display text-3xl font-medium text-ink tracking-tight mb-6">Shop every item</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {room.products.map((product) => (
            <ProductCard key={product.number} product={product as Product} />
          ))}
        </div>

        {/* Disclosure */}
        <div className="mt-10 rounded-2xl border border-line p-5">
          <p className="text-xs text-muted leading-relaxed">
            <strong className="text-ink-2">#ad</strong> — As an Amazon Associate, I earn from
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
