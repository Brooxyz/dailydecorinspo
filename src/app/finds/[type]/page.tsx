import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { findsBySlug, liveFindTypes } from "@/lib/finds";

export function generateStaticParams() {
  return liveFindTypes().map((t) => ({ type: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const t = liveFindTypes().find((x) => x.slug === type);
  if (!t) return {};
  const items = findsBySlug()[t.slug] || [];
  return {
    title: `${t.title} (${items.length} Picks) — Daily Decor Inspo`,
    description: `${items.length} hand-picked, well-reviewed Amazon ${t.label.toLowerCase()} we used in real styled rooms, with prices and direct links.`,
    alternates: { canonical: `/finds/${t.slug}/` },
  };
}

export default async function FindsPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const t = liveFindTypes().find((x) => x.slug === type);
  if (!t) notFound();
  const items = findsBySlug()[t.slug] || [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t.title,
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `https://dailydecorinspo.vercel.app/room/${p.roomSlug}/`,
      image: `https://dailydecorinspo.vercel.app${p.image}`,
    })),
  };
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a href="/" className="text-sm text-warm-500 hover:text-warm-800">← All Rooms</a>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-warm-900 mt-4">{t.title}</h1>
      <p className="text-warm-600 mt-3 max-w-2xl">
        {items.length} {t.label.toLowerCase()} we picked for our styled rooms: all well-reviewed on Amazon, sorted by rating.
        Each card shows the room it was styled in, so you can see it in a real space before you buy.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {items.map((p) => (
          <div key={p.roomSlug + p.number} className="flex flex-col gap-2">
            <ProductCard product={{ ...p, number: items.indexOf(p) + 1 }} />
            <a href={`/room/${p.roomSlug}/`} className="text-xs text-warm-600 hover:text-warm-900 underline underline-offset-2 px-1">
              See it styled in: {p.roomTitle}
            </a>
          </div>
        ))}
      </div>
      <div className="mt-10 bg-warm-100 rounded-xl p-5">
        <p className="text-xs text-warm-600 leading-relaxed">
          <strong>#ad</strong> — As an Amazon Associate, I earn from qualifying purchases. Prices may vary;
          check each listing for current details.
        </p>
      </div>
      <nav className="mt-8 flex flex-wrap gap-2">
        {liveFindTypes().filter((x) => x.slug !== t.slug).map((x) => (
          <a key={x.slug} href={`/finds/${x.slug}/`} className="px-3 py-1 rounded-full bg-warm-200 text-warm-700 text-xs font-semibold hover:bg-warm-300">
            {x.label}
          </a>
        ))}
      </nav>
    </section>
  );
}
