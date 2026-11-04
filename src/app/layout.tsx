import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Decor Inspo — Shop the Room",
  description:
    "Curated room designs with budget-friendly Amazon finds. Shop the exact items from our styled rooms.",
  keywords: [
    "room decor",
    "amazon finds",
    "budget decor",
    "bedroom ideas",
    "desk setup",
    "interior design",
    "shop the look",
  ],
  openGraph: {
    title: "Daily Decor Inspo — Shop the Room",
    description:
      "Curated room designs with budget-friendly Amazon finds. Shop the exact items from our styled rooms.",
    type: "website",
    siteName: "Daily Decor Inspo",
  },
  other: {
    // Pinterest domain verification
    "p:domain_verify": "63275721639a1ac70a4eedda202d5668",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-warm-50 text-gray-900 font-body antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

/* ─── Header ─── */
function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-warm-50/90 border-b border-warm-200/50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-warm-700 flex items-center justify-center text-white font-display text-lg font-bold group-hover:bg-warm-800 transition-colors">
            D
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-warm-900 leading-tight">
              Daily Decor Inspo
            </h1>
            <p className="text-xs text-warm-500 font-medium tracking-wide uppercase">
              Shop the Room
            </p>
          </div>
        </a>

        <nav className="hidden sm:flex items-center gap-6">
          <a
            href="/"
            className="text-sm font-medium text-warm-700 hover:text-warm-900 transition-colors"
          >
            All Rooms
          </a>
          <a
            href="https://pinterest.com/dailydecorinspo_"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-warm-700 hover:text-warm-900 transition-colors flex items-center gap-1"
          >
            <PinterestIcon />
            Pinterest
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="bg-warm-100 border-t border-warm-200 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center space-y-4">
          <p className="font-display text-lg text-warm-800">
            Daily Decor Inspo
          </p>
          <p className="text-sm text-warm-600 max-w-lg mx-auto">
            Curated room designs with budget-friendly Amazon finds. Every room
            is styled with products you can actually buy.
          </p>

          {/* Amazon Associates Disclosure — REQUIRED */}
          <div className="bg-warm-200/50 rounded-lg p-4 max-w-xl mx-auto">
            <p className="text-xs text-warm-700 leading-relaxed">
              <strong>Affiliate Disclosure:</strong> As an Amazon Associate, I
              earn from qualifying purchases. This means if you click on a link
              and make a purchase, I may receive a small commission at no extra
              cost to you. All product recommendations are based on personal
              curation and aesthetic fit.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 text-xs text-warm-600">
            <a href="/privacy/" className="hover:text-warm-900 underline underline-offset-2 transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <a
              href="https://pinterest.com/dailydecorinspo_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-600 hover:text-warm-900 transition-colors flex items-center gap-1"
            >
              <PinterestIcon />
              Pinterest
            </a>
          </div>

          <p className="text-xs text-warm-400 pt-4">
            © {new Date().getFullYear()} Daily Decor Inspo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function PinterestIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}
