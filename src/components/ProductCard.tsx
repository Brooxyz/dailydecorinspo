export type Product = {
  number: number;
  name: string;
  description: string;
  image: string;
  priceRange: string;
  rating?: number;
  amazonUrl?: string;
  /** Set for amzn.to short links, whose URL hides the ASIN (used by the add-all-to-cart button) */
  asin?: string;
  // "etsy" marks a handmade piece from our own Etsy shop (BestMarble)
  store?: "amazon" | "etsy";
  shopUrl?: string;
  /** Position of the product in the room hero image, in % of width/height */
  hotspot?: { x: number; y: number };
};

export function ProductCard({ product }: { product: Product }) {
  const isEtsy = product.store === "etsy";
  const href = isEtsy ? product.shopUrl : product.amazonUrl;
  return (
    <div
      id={`product-${product.number}`}
      className="group bg-surface rounded-2xl overflow-hidden border border-line hover:border-muted transition-colors flex flex-col h-full scroll-mt-24"
    >
      {/* Product photo well: packshots are pure white, the well stays light in dark mode too */}
      <div className="relative overflow-hidden aspect-square bg-well">
        <img
          src={product.image}
          alt={product.name}
          decoding="async"
          className="w-full h-full object-contain p-5 mix-blend-multiply group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#2b1d14] flex items-center justify-center text-white text-sm font-semibold">
          {product.number}
        </div>
        {isEtsy ? (
          <span className="absolute top-3 right-3 rounded-full px-2.5 py-1 bg-white/90 text-xs font-semibold text-[#2b1d14]">
            Handmade
          </span>
        ) : product.rating ? (
          <span className="absolute top-3 right-3 rounded-full px-2.5 py-1 bg-white/90 text-xs font-semibold text-[#2b1d14]">
            ★ {product.rating}
          </span>
        ) : null}
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between gap-4">
        <div>
          <h3 className="font-semibold text-ink text-base leading-snug">{product.name}</h3>
          <p className="text-sm text-muted mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
          {isEtsy && <p className="text-xs text-ink-2 mt-2 italic">From our own handmade Etsy shop</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-xl font-medium text-ink">{product.priceRange}</span>
          <a
            href={href}
            target="_blank"
            rel={isEtsy ? "noopener noreferrer" : "noopener noreferrer nofollow sponsored"}
            className="py-2.5 px-4 rounded-full bg-accent text-accent-ink font-semibold text-sm hover:bg-accent-hover transition-colors"
          >
            {isEtsy ? "Shop on Etsy" : "Shop on Amazon"}
          </a>
        </div>
      </div>
    </div>
  );
}
