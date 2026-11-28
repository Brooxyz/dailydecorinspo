import type { Metadata, Viewport } from "next";
import "./globals.css";
import { liveFindTypes } from "@/lib/finds";
import { Analytics } from "@vercel/analytics/next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SavedLink } from "@/components/SaveButton";
import { KeepHandy } from "@/components/KeepHandy";

export const metadata: Metadata = {
  metadataBase: new URL("https://dailydecorinspo.vercel.app"),
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
  // Google Search Console ownership (keep it, Google re-checks)
  verification: { google: "LT8aprsiHA1NiYDKkI2QVjEA0LpztWQO4D-IMMGCFkc" },
  other: {
    // Pinterest domain verification
    "p:domain_verify": "63275721639a1ac70a4eedda202d5668",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#17120f" },
  ],
};

// Runs before paint: saved choice wins, otherwise follow the system setting (no light flash at night).
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <meta
          name="p:domain_verify"
          content="63275721639a1ac70a4eedda202d5668"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Daily Decor Inspo RSS Feed"
          href="https://dailydecorinspo.vercel.app/feed.xml"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas text-ink-2 font-body antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        {/* Vercel Web Analytics (free Hobby tier: collection pauses at the limit, never billed) */}
        <Analytics />
      </body>
    </html>
  );
}

/* ─── Header ─── */
function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-canvas/85 border-b border-line">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <a href="/" className="flex items-baseline gap-2 group" aria-label="Daily Decor Inspo home">
          <span className="font-display text-xl sm:text-2xl font-semibold text-ink tracking-tight">
            Daily Decor Inspo
          </span>
          <span className="hidden sm:inline text-sm text-muted">shop the room</span>
        </a>

        <nav className="flex items-center gap-3 sm:gap-5">
          <a href="/#rooms" className="hidden sm:inline text-sm font-medium text-ink-2 hover:text-ink transition-colors">
            Rooms
          </a>
          <a href="/#shop-by-piece" className="hidden sm:inline text-sm font-medium text-ink-2 hover:text-ink transition-colors">
            Shop by piece
          </a>
          <SavedLink />
          <a
            href="https://pinterest.com/dailydecorinspo_"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-ink-2 hover:text-ink transition-colors flex items-center gap-1.5"
          >
            <PinterestIcon />
            <span className="hidden sm:inline">Pinterest</span>
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="bg-surface-2 border-t border-line mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <p className="font-display text-2xl text-ink">Daily Decor Inspo</p>
          <p className="text-sm text-ink-2 max-w-md leading-relaxed">
            Styled rooms built only from things you can buy today, each piece linked so you can
            copy the whole look or just the part you love.
          </p>
          {/* Amazon Associates Disclosure — REQUIRED */}
          <p className="text-xs text-muted leading-relaxed max-w-md border-l-2 border-line pl-3">
            <strong className="text-ink-2">#ad</strong> As an Amazon Associate, I earn from
            qualifying purchases. This means if you click on a link and make a purchase, I may
            receive a small commission at no extra cost to you. All product recommendations are
            based on personal curation and aesthetic fit.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-ink">Shop by piece</p>
          <nav className="flex flex-wrap gap-2" aria-label="Shop by product">
            {liveFindTypes().map((t) => (
              <a
                key={t.slug}
                href={`/finds/${t.slug}/`}
                className="px-3 py-1.5 rounded-full bg-surface border border-line text-ink-2 text-xs font-medium hover:text-ink hover:border-muted transition-colors"
              >
                {t.label}
              </a>
            ))}
          </nav>
          <KeepHandy />
          <div className="flex items-center gap-5 pt-2 text-xs text-muted">
            <a href="/privacy/" className="hover:text-ink underline underline-offset-2 transition-colors">
              Privacy Policy
            </a>
            <a
              href="https://pinterest.com/dailydecorinspo_"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors flex items-center gap-1"
            >
              <PinterestIcon />
              Pinterest
            </a>
            <span>© {new Date().getFullYear()} Daily Decor Inspo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PinterestIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}
