import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Daily Decor Inspo",
  description: "Privacy Policy and Affiliate Disclosure for Daily Decor Inspo.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Back button */}
      <div className="mb-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-warm-800 transition-colors"
        >
          ← Back to Rooms
        </a>
      </div>

      <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-warm-200/60 space-y-8">
        <div className="border-b border-warm-200 pb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-warm-600">
            Legal &amp; Compliance
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-warm-900 mt-2">
            Privacy Policy for Daily Decor Inspo
          </h1>
          <p className="text-sm text-warm-500 mt-2">
            Effective Date: November 4, 2026
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-warm-900">
            1. Information We Collect
          </h2>
          <p className="text-warm-700 leading-relaxed text-sm sm:text-base">
            Daily Decor Inspo (
            <a
              href="https://dailydecorinspo.vercel.app"
              className="text-warm-800 underline underline-offset-4"
            >
              https://dailydecorinspo.vercel.app
            </a>
            ) is an interior design inspiration and curated home decor catalog.
            We do not require user registration or collect personal identity
            data from visitors. Standard anonymized analytics and cookies may be
            used to improve site performance and user experience.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-warm-900">
            2. Pinterest API Usage
          </h2>
          <p className="text-warm-700 leading-relaxed text-sm sm:text-base">
            Our internal publishing application connects to the official
            Pinterest API v5 solely to manage our own account (
            <a
              href="https://pinterest.com/dailydecorinspo_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-800 underline underline-offset-4"
            >
              @dailydecorinspo_
            </a>
            ), create boards, and publish original home decor inspiration Pins.
            We do not access, store, or share private data of other Pinterest
            users.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-warm-900">
            3. Affiliate Disclosure &amp; Third-Party Links
          </h2>
          <div className="bg-warm-50 border-l-4 border-warm-600 p-4 rounded-r-lg">
            <p className="text-warm-800 font-medium text-sm leading-relaxed">
              This website contains curated product links to Amazon.com. As an
              Amazon Associate, we earn from qualifying purchases.
            </p>
          </div>
          <p className="text-warm-700 leading-relaxed text-sm sm:text-base">
            When you click on an external merchant link or purchase products
            through our curated links, Amazon&apos;s own Privacy Policy, terms of
            service, and cookie rules apply. We do not process payments, store
            credit card details, or manage product shipping and fulfillment.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-warm-900">
            4. Contact Us
          </h2>
          <p className="text-warm-700 leading-relaxed text-sm sm:text-base">
            For any privacy-related questions, requests, or inquiries regarding
            our content, please contact us at:{" "}
            <a
              href="mailto:dailydecorinspo@gmail.com"
              className="text-warm-800 font-semibold underline underline-offset-4"
            >
              dailydecorinspo@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
