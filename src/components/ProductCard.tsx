import roomsData from "@/data/rooms.json";

type Product = (typeof roomsData.rooms)[number]["products"][number];

export function ProductCard({ product }: { product: Product }) {
  return (
    <div
      id={`product-${product.number}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-warm-100"
    >
      {/* Product Image */}
      <div className="relative overflow-hidden aspect-square bg-warm-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Number badge */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-warm-800 flex items-center justify-center text-white text-sm font-bold shadow-md">
          {product.number}
        </div>

        {/* Rating badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
          <span className="text-xs font-semibold text-warm-700">
            ★ {product.rating}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-warm-900 text-base leading-snug">
            {product.name}
          </h3>
          <p className="text-sm text-warm-500 mt-1 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold text-warm-800">
            {product.priceRange}
          </span>
        </div>

        {/* Amazon CTA Button */}
        <a
          href={product.amazonUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="block w-full text-center py-3 px-4 rounded-xl bg-gradient-to-r from-warm-700 to-warm-800 text-white font-semibold text-sm hover:from-warm-800 hover:to-warm-900 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          Shop on Amazon →
        </a>
      </div>
    </div>
  );
}
