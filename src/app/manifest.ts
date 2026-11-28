import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Lets visitors add the site to their home screen like an app (Chrome/Edge/Android prompt; iPhone share sheet)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Decor Inspo",
    short_name: "Decor Inspo",
    description: "Styled rooms you can shop piece by piece. A new room every few days.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf6f0",
    theme_color: "#7a4a2b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
