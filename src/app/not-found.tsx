export default function NotFound() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-24 text-center">
      <p className="text-6xl mb-6">🏠</p>
      <h2 className="font-display text-3xl font-bold text-warm-900 mb-4">
        Room Not Found
      </h2>
      <p className="text-warm-600 mb-8">
        This room doesn&apos;t exist yet. Check out our other styled rooms!
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-warm-800 text-white rounded-xl font-semibold hover:bg-warm-900 transition-colors"
      >
        Browse All Rooms
      </a>
    </section>
  );
}
