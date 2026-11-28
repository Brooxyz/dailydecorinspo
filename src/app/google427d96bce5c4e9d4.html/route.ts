// Google Search Console HTML-file verification (served as a static route; keep it).
export const dynamic = "force-static";

export function GET() {
  return new Response("google-site-verification: google427d96bce5c4e9d4.html", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
