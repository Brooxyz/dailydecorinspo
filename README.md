# Daily Decor Inspo — Shop the Room

A curated storefront for room designs with budget-friendly Amazon products.

## Features
- Mobile-first, Pinterest-optimized design
- Room-based product grouping with direct Amazon affiliate links
- Static site generation for fast loading
- Pinterest domain verification meta tag
- Amazon Associates disclosure on every page

## Development

```bash
pnpm install
pnpm dev
```

## Deployment

Push to GitHub → Vercel auto-deploys.

## Adding a New Room

Edit `src/data/rooms.json` and add a new room object following the existing schema.
Add product images to `public/images/products/room-XX/` and room image to `public/images/rooms/`.
