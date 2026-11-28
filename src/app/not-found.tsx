export default function NotFound() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-24 text-center">
      <h2 className="font-display text-3xl font-medium text-ink mb-4">
        Room Not Found
      </h2>
      <p className="text-ink-2 mb-8">
        This room doesn&apos;t exist yet. Check out our other styled rooms!
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-accent text-accent-ink rounded-2xl font-semibold hover:bg-accent-hover transition-colors"
      >
        Browse All Rooms
      </a>
    </section>
  );
}
