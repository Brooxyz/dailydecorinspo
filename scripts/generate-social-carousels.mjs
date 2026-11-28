// Photo carousels for TikTok Photo Mode (1080x1920) and Instagram (1080x1350), in the "native" look of
// those apps: full-bleed images and bold white captions with a dark outline, not branded cards.
//   01 hook: the room, "This whole makeup vanity / from $266 on Amazon / swipe for every piece"
//   02 the room with numbered price tags
//   03.. one slide per product: big packshot, number, name, price
//   last: the full list with prices, total, "All links in bio" and the AI note
// Music is added inside each app. Every caption also needs the #ad line and the AI-generated label.
//
// usage: node scripts/generate-social-carousels.mjs [roomNumber ...] [--force]
//   out: social/carousels/room-NN/{tiktok,instagram}/NN.jpg   (gitignored)
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { text, wrap, measure } from './pin-text.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'social', 'carousels');
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const wanted = args.filter((a) => /^\d+$/.test(a)).map(Number);
const C = { linen: '#faf6f0', ink: '#2b1d14', muted: '#8a7261', walnut: '#7a4a2b', night: '#1d1612' };
const cats = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'categories.json'), 'utf8'));

// TikTok/Instagram-style caption: white bold text with a dark outline (stroke painted under the fill)
// (glyphs are scaled paths, so a stroke would shrink with them: use a soft dark shadow instead)
const SHADOW = `<filter id="tx" x="-20%" y="-50%" width="140%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="${C.night}" flood-opacity="0.9"/></filter>`;
const bold = (str, o) => `<g filter="url(#tx)">${text(str, { font: 'sansBold', fill: '#ffffff', anchor: 'middle', ...o })}</g>`;
const lines = (str, size, maxWidth, maxLines) => wrap(str, { font: 'sansBold', size, maxWidth, maxLines });
const short = (name) => name.replace(/\s*\(.*?\)\s*/g, ' ').split(/,| with | for /)[0].trim();

const FORMATS = {
  // safe zone keeps captions clear of each app's buttons and caption overlay
  tiktok: { W: 1080, H: 1920, safe: { x0: 60, x1: 920, y0: 230, y1: 1420 } },
  instagram: { W: 1080, H: 1350, safe: { x0: 60, x1: 1020, y0: 60, y1: 1290 } },
};

async function roomBase(room, W, H, fx) {
  // cover-crop the 2:3 photo to the slide, centred on the products
  const src = path.join(ROOT, 'public', room.roomImage);
  const r = W / H;
  if (r < 2 / 3) {
    const SW = Math.round(H * 2 / 3), off = Math.round(Math.min(SW - W, Math.max(0, fx * SW - W / 2)));
    return { buf: await sharp(src).resize(SW, H).extract({ left: off, top: 0, width: W, height: H }).toBuffer(), map: (x, y) => [x / 100 * SW - off, y / 100 * H] };
  }
  const SH = Math.round(W * 3 / 2), off = Math.round((SH - H) * 0.45);
  return { buf: await sharp(src).resize(W, SH).extract({ left: 0, top: off, width: W, height: H }).toBuffer(), map: (x, y) => [x / 100 * W, y / 100 * SH - off] };
}

async function render(room, num, fmtName) {
  const { W, H, safe } = FORMATS[fmtName];
  const cx = (safe.x0 + safe.x1) / 2, sw = safe.x1 - safe.x0;
  const prods = room.products.filter((p) => p.hotspot);
  const isEtsy = room.products.some((p) => p.store === 'etsy');
  const label = (cats[room.category]?.label || 'room').toLowerCase();
  const low = (room.totalPrice.match(/\$\d[\d,]*/) || [room.totalPrice])[0];
  const fx = prods.reduce((s, p) => s + p.hotspot.x, 0) / prods.length / 100;
  const { buf, map } = await roomBase(room, W, H, fx);
  const dir = path.join(OUT, `room-${String(num).padStart(2, '0')}`, fmtName);
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  const save = async (img) => { n++; await img.jpeg({ quality: 90 }).toFile(path.join(dir, `${String(n).padStart(2, '0')}.jpg`)); };
  const shade = (y0, y1, up) => `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}" stop-opacity="${up ? 0.7 : 0}"/><stop offset="1" stop-color="${C.night}" stop-opacity="${up ? 0 : 0.6}"/></linearGradient></defs><rect x="0" y="${y0}" width="${W}" height="${y1 - y0}" fill="url(#s)"/>`;

  // 01 hook
  const h1 = lines(`This whole ${label}`, 92, sw, 2);
  const h2 = isEtsy ? 'every piece linked' : `from ${low} on Amazon`;
  const hy = safe.y0 + 110;
  await save(sharp(buf).composite([{ input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${SHADOW}</defs>
    ${shade(0, hy + h1.length * 104 + 260, true)}
    ${shade(safe.y1 - 160, H, false).replace('id="s"', 'id="s2"').replace('url(#s)', 'url(#s2)')}
    ${h1.map((l, i) => bold(l, { size: 92, x: cx, y: hy + i * 104 })).join('')}
    ${bold(h2, { size: 64, x: cx, y: hy + h1.length * 104 + 10 })}
    ${bold('swipe for every piece  >>', { size: 40, x: cx, y: safe.y1 - 20 })}
  </svg>`) }]));

  // 02 room with numbered price tags (simple top-down placement, nudged to avoid overlaps)
  const used = [];
  let tags = '';
  for (const p of prods) {
    let [x, y] = map(p.hotspot.x, p.hotspot.y);
    x = Math.min(safe.x1 - 40, Math.max(safe.x0 + 40, x));
    y = Math.min(safe.y1 - 40, Math.max(safe.y0 + 40, y));
    const tw = measure(p.priceRange, 'sansBold', 34) + 36;
    let bx = x + 40 + tw > safe.x1 ? x - 40 - tw : x + 40, by = y - 30;
    for (let k = 0; k < 12 && used.some((u) => bx < u.x + u.w + 8 && u.x < bx + tw + 8 && by < u.y + 68 && u.y < by + 68); k++) by += (k % 2 ? -1 : 1) * 70 * Math.ceil((k + 1) / 2);
    used.push({ x: bx, y: by, w: tw });
    tags += `<circle cx="${x}" cy="${y}" r="30" fill="${C.walnut}" stroke="#ffffff" stroke-width="5"/>
      ${text(String(p.number), { font: 'sansBold', size: 30, x, y: y + 11, anchor: 'middle', fill: '#ffffff' })}
      <rect x="${bx}" y="${by}" width="${tw}" height="60" rx="30" fill="#ffffff" fill-opacity="0.95"/>
      ${text(p.priceRange, { font: 'sansBold', size: 34, x: bx + tw / 2, y: by + 42, anchor: 'middle', fill: C.ink })}`;
  }
  await save(sharp(buf).composite([{ input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${tags}</svg>`) }]));

  // 03.. product slides
  for (const p of prods) {
    const S = Math.min(sw + 40, H - 640);
    const shot = await sharp(path.join(ROOT, 'public', p.image)).resize(S, S, { fit: 'contain', background: '#ffffff' }).toBuffer();
    const nl = lines(short(p.name), 66, sw, 2);
    const top = Math.round((H - (S + 160 + nl.length * 76 + 120)) / 2);
    const ty = top + S + 110;
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#ffffff"/>
      <circle cx="${cx}" cy="${top - 10}" r="48" fill="${C.walnut}"/>
      ${text(String(p.number), { font: 'sansBold', size: 50, x: cx, y: top + 8, anchor: 'middle', fill: '#ffffff' })}
      ${nl.map((l, i) => text(l, { font: 'sansBold', size: 66, x: cx, y: ty + i * 76, anchor: 'middle', fill: C.ink })).join('')}
      ${text(p.priceRange, { font: 'sansBold', size: 76, x: cx, y: ty + nl.length * 76 + 70, anchor: 'middle', fill: C.walnut })}
      ${text(p.store === 'etsy' ? 'handmade, our Etsy shop' : (p.rating ? `rated ${p.rating} on Amazon` : 'on Amazon'), { font: 'sans', size: 36, x: cx, y: ty + nl.length * 76 + 130, anchor: 'middle', fill: C.muted })}
    </svg>`;
    await save(sharp(Buffer.from(svg)).composite([{ input: shot, left: Math.round(cx - S / 2), top: top + 60 }]));
  }

  // last: the list
  const rowH = Math.min(84, (safe.y1 - safe.y0 - 420) / prods.length);
  const fs1 = Math.min(40, rowH * 0.5);
  let rows = '';
  prods.forEach((p, i) => {
    const y = safe.y0 + 230 + i * rowH;
    rows += `<circle cx="${safe.x0 + 34}" cy="${y - fs1 * 0.35}" r="${fs1 * 0.72}" fill="${C.walnut}"/>
      ${text(String(p.number), { font: 'sansBold', size: fs1 * 0.8, x: safe.x0 + 34, y: y - fs1 * 0.35 + fs1 * 0.28, anchor: 'middle', fill: '#ffffff' })}
      ${text(lines(short(p.name), fs1, sw - 330, 1)[0], { font: 'sansBold', size: fs1, x: safe.x0 + 80, y, fill: C.ink })}
      ${text(p.priceRange, { font: 'sansBold', size: fs1, x: safe.x1, y, anchor: 'end', fill: C.walnut })}`;
  });
  const yEnd = safe.y0 + 230 + prods.length * rowH + 40;
  await save(sharp(Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${C.linen}"/>
    ${text('Every piece in this room', { font: 'sansBold', size: 60, x: cx, y: safe.y0 + 110, anchor: 'middle', fill: C.ink, maxWidth: sw })}
    ${rows}
    <line x1="${safe.x0}" y1="${yEnd - 20}" x2="${safe.x1}" y2="${yEnd - 20}" stroke="#e6d8c6" stroke-width="3"/>
    ${text('Whole look', { font: 'sansBold', size: 48, x: safe.x0, y: yEnd + 50, fill: C.ink })}
    ${text(room.totalPrice, { font: 'sansBold', size: 56, x: safe.x1, y: yEnd + 52, anchor: 'end', fill: C.walnut })}
    <rect x="${cx - 260}" y="${yEnd + 110}" width="520" height="100" rx="50" fill="${C.walnut}"/>
    ${text('All links in bio', { font: 'sansBold', size: 46, x: cx, y: yEnd + 176, anchor: 'middle', fill: '#fff8f0' })}
    ${text('Room styled with AI. Every product is real and linked.', { font: 'sans', size: 30, x: cx, y: yEnd + 270, anchor: 'middle', fill: C.muted, maxWidth: sw })}
  </svg>`)));
  return [dir, n + ' slides'];
}

const rooms = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'rooms.json'), 'utf8')).rooms;
for (const n of (wanted.length ? wanted : rooms.map((_, i) => i + 1))) {
  const r = rooms[n - 1];
  if (!r) { console.log(`room ${n} not found`); continue; }
  for (const f of Object.keys(FORMATS)) {
    const dir = path.join(OUT, `room-${String(n).padStart(2, '0')}`, f);
    if (!FORCE && fs.existsSync(path.join(dir, '01.jpg'))) continue;
    if (FORCE) fs.rmSync(dir, { recursive: true, force: true });
    console.log('carousel', ...(await render(r, n, f)));
  }
}
