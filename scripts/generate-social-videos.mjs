// Short-form social videos (TikTok, Instagram Reels, YouTube Shorts): 1080x1920, 30 fps, ~13 s, silent
// (add a trending sound inside each app). Built to loop: starts and ends on the room photo.
//   0.0-1.8 s  hook card over the room ("This whole makeup vanity / from $266 on Amazon")
//   1.8-6.0 s  push-in, numbered product tags pop in (labels kept inside the platforms' UI safe zone)
//   6.0-11.6 s quick cuts: each product's packshot, name and price
//   11.6-13 s  end card: total price + "Every link in bio"
// Same palette and type as the site and pins (scripts/pin-text.mjs). H.264 via ffmpeg-static.
//
// usage: node scripts/generate-social-videos.mjs [roomNumber ...] [--out dir] [--force]
//   default out dir: social/videos  (gitignored working folder; upload these by hand or via each app's scheduler)
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';
import { text, wrap, measure } from './pin-text.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1080, H = 1920, FPS = 30;
// UI safe zone: top bar, right-side buttons, bottom caption/buttons area on TikTok/Reels/Shorts
const SAFE = { x0: 50, x1: W - 170, y0: 260, y1: H - 470 };
const CX = (SAFE.x0 + SAFE.x1) / 2;
const C = { linen: '#faf6f0', oat: '#f3ebe0', ink: '#2b1d14', ink2: '#5e4636', muted: '#8a7261', line: '#e6d8c6', walnut: '#7a4a2b', amber: '#e2aa6c', night: '#1d1612' };

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : path.join(ROOT, 'social', 'videos');
const FORCE = args.includes('--force');
const wanted = args.filter((a, i) => /^\d+$/.test(a) && args[i - 1] !== '--out').map(Number);

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
const fade = (t, start, len) => ease((t - start) / len);
const cats = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'categories.json'), 'utf8'));

// ---- tag labels (same look as the video pins, bigger for phones) ----
const FS = 30, FS2 = 27, LH = 35, PAD = 20;
function labelBox(p) {
  // Room tags show the price only; the product cuts that follow carry the names
  return { lines: [], w: measure(p.priceRange, 'sansBold', FS) + PAD * 2, h: 58 };
}
function placeLabels(points) {
  const placed = points.map(({ x, y }) => ({ x: x - 34, y: y - 34, w: 68, h: 68, dot: true }));
  const overlap = (a, b) => a.x < b.x + b.w + 8 && b.x < a.x + a.w + 8 && a.y < b.y + b.h + 8 && b.y < a.y + a.h + 8;
  const inSafe = (r) => r.x >= SAFE.x0 && r.x + r.w <= SAFE.x1 && r.y >= SAFE.y0 && r.y + r.h <= SAFE.y1;
  return points.map(({ x, y, box }) => {
    const sides = x > (SAFE.x0 + SAFE.x1) / 2 ? ['left', 'right'] : ['right', 'left'];
    let best = null;
    for (let k = 0; k <= 16 && !best; k++) {
      const dy = (k % 2 ? 1 : -1) * Math.ceil(k / 2);
      for (const side of sides) {
        const r = { x: side === 'right' ? x + 36 : x - 36 - box.w, y: y - box.h / 2 + dy * box.h * 0.6, w: box.w, h: box.h };
        if (!inSafe(r)) continue;
        if (placed.some((q) => !(q.dot && Math.abs(q.x + 34 - x) < 1 && Math.abs(q.y + 34 - y) < 1) && overlap(r, q))) continue;
        best = r; break;
      }
    }
    if (!best) {
      let min = Infinity;
      for (let dy = -10; dy <= 10; dy++) for (const side of sides) {
        const r = { x: Math.min(SAFE.x1 - box.w, Math.max(SAFE.x0, side === 'right' ? x + 36 : x - 36 - box.w)), y: Math.min(SAFE.y1 - box.h, Math.max(SAFE.y0, y - box.h / 2 + dy * box.h * 0.4)), w: box.w, h: box.h };
        const area = placed.reduce((a, q) => a + Math.max(0, Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x)) * Math.max(0, Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y)), 0);
        if (area < min) { min = area; best = r; }
      }
    }
    placed.push(best);
    return { dx: best.x - x, dy: best.y - y };
  });
}
function tagSvg(p, x, y, a, box, off) {
  if (a <= 0) return '';
  const s = 0.6 + 0.4 * a, bx = x + off.dx, by = y + off.dy;
  const lx = Math.min(Math.max(x, bx), bx + box.w), ly = Math.min(Math.max(y, by), by + box.h);
  const far = Math.hypot(lx - x, ly - y) > 46;
  return `<g opacity="${a.toFixed(3)}">
    ${far ? `<line x1="${x}" y1="${y}" x2="${lx}" y2="${ly}" stroke="${C.walnut}" stroke-width="3.5" stroke-opacity="0.85"/>` : ''}
    <g transform="translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})">
      <circle cx="${x}" cy="${y}" r="31" fill="#ffffff" fill-opacity="0.6"/>
      <circle cx="${x}" cy="${y}" r="25" fill="${C.walnut}" stroke="#ffffff" stroke-width="4"/>
      ${text(String(p.number), { font: 'sansBold', size: 25, x, y: y + 9, anchor: 'middle', fill: '#ffffff' })}
    </g>
    <rect x="${bx}" y="${by}" width="${box.w}" height="${box.h}" rx="18" fill="${C.linen}" fill-opacity="0.97"/>
    ${text(p.priceRange, { font: 'sansBold', size: FS, x: bx + PAD, y: by + 40, fill: C.ink })}
  </g>`;
}

async function renderRoom(room, num) {
  const prods = room.products.filter((p) => p.hotspot);
  const isEtsy = room.products.some((p) => p.store === 'etsy');
  const label = (cats[room.category]?.label || 'room').toLowerCase();
  const low = (room.totalPrice.match(/\$\d[\d,]*/) || [room.totalPrice])[0];

  // 9:16 crop of the 2:3 room photo, centred on the products
  const SW = Math.round(H * 2 / 3);
  const fx = prods.reduce((s, p) => s + p.hotspot.x, 0) / prods.length / 100;
  const offX = Math.round(Math.min(SW - W, Math.max(0, fx * SW - W / 2)));
  const base = await sharp(path.join(ROOT, 'public', room.roomImage)).resize(SW, H).extract({ left: offX, top: 0, width: W, height: H }).toBuffer();
  const fy = prods.reduce((s, p) => s + p.hotspot.y, 0) / prods.length / 100;
  const fxc = (fx * SW - offX) / W;

  const cutLen = prods.length > 8 ? 0.6 : 0.8;
  const T_TAGS = 1.8, T_CUTS = 6.0, T_END = T_CUTS + prods.length * cutLen, DUR = T_END + 1.5;
  const tagGap = Math.min(0.5, 3.6 / prods.length);
  const camera = (t) => {
    const z = 1 + 0.12 * ease(Math.min(t, T_CUTS) / T_CUTS);
    const cw = W / z, ch = H / z;
    const cx = Math.min(W - cw, Math.max(0, (0.5 + (fxc - 0.5) * 0.6) * W - cw / 2));
    const cy = Math.min(H - ch, Math.max(0, (0.5 + (fy - 0.5) * 0.6) * H - ch / 2));
    return { z, cw, ch, cx, cy };
  };
  const boxes = prods.map(labelBox);
  const ref = camera(5.4);
  const toScreen = (p, c) => [((p.hotspot.x / 100) * SW - offX - c.cx) * c.z, ((p.hotspot.y / 100) * H - c.cy) * c.z];
  const offs = placeLabels(prods.map((p, i) => { const [x, y] = toScreen(p, ref); return { x, y, box: boxes[i] }; }));

  async function roomFrame(t, overlaySvg) {
    const c = camera(t);
    const ix = Math.floor(c.cx), iy = Math.floor(c.cy), ox = c.cx - ix, oy = c.cy - iy;
    const ew = Math.min(W - ix, Math.ceil(c.cw + ox) + 1), eh = Math.min(H - iy, Math.ceil(c.ch + oy) + 1);
    const moved = await sharp(base).extract({ left: ix, top: iy, width: ew, height: eh })
      .affine([c.z, 0, 0, c.z], { odx: -ox * c.z, ody: -oy * c.z, interpolator: sharp.interpolators.bicubic }).toBuffer();
    return sharp(moved).extract({ left: 0, top: 0, width: W, height: H })
      .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }]).removeAlpha().raw().toBuffer();
  }

  // Product cut cards, rendered once each
  const cards = [];
  for (const p of prods) {
    const S = 640, bx = Math.round(CX - S / 2 - 20), by = 400;
    const shot = await sharp(path.join(ROOT, 'public', p.image)).resize(S, S, { fit: 'contain', background: '#ffffff' }).toBuffer();
    const lines = wrap(p.name.replace(/\s*\(.*?\)\s*/g, ' ').trim(), { font: 'display', size: 54, maxWidth: SAFE.x1 - SAFE.x0 - 20, maxLines: 2 });
    const yName = by + S + 40 + 80;
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="${C.linen}"/>
      <rect x="${bx}" y="${by}" width="${S + 40}" height="${S + 40}" rx="40" fill="#ffffff" stroke="${C.line}" stroke-width="2"/>
      <circle cx="${CX}" cy="${by - 60}" r="42" fill="${C.walnut}"/>
      ${text(String(p.number), { font: 'sansBold', size: 42, x: CX, y: by - 45, anchor: 'middle', fill: '#ffffff' })}
      ${lines.map((l, i) => text(l, { font: 'display', size: 54, x: CX, y: yName + i * 62, anchor: 'middle', fill: C.ink })).join('')}
      <rect x="${CX - 150}" y="${yName + lines.length * 62 - 20}" width="300" height="80" rx="40" fill="${C.walnut}"/>
      ${text(p.priceRange, { font: 'sansBold', size: 38, x: CX, y: yName + lines.length * 62 + 33, anchor: 'middle', fill: '#fff8f0' })}
    </svg>`;
    cards.push(await sharp(Buffer.from(svg)).composite([{ input: shot, left: bx + 20, top: by + 20 }]).removeAlpha().raw().toBuffer());
  }

  const hook1 = `This whole ${label}`;
  const hook2 = isEtsy ? 'every piece linked' : `from ${low} on Amazon`;
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `room-${String(num).padStart(2, '0')}-social.mp4`);
  const ff = spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file]);
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once('drain', res)));

  const total = Math.round(DUR * FPS);
  for (let f = 0; f < total; f++) {
    const t = f / FPS;
    if (t >= T_CUTS && t < T_END) { await write(cards[Math.floor((t - T_CUTS) / cutLen)]); continue; }
    const hookA = t < T_CUTS ? 1 - fade(t, T_TAGS - 0.2, 0.35) : 0;
    const endA = t >= T_END ? fade(t, T_END, 0.3) : 0;
    const c = camera(t);
    const tags = t < T_CUTS ? prods.map((p, i) => { const [x, y] = toScreen(p, c); return tagSvg(p, x, y, fade(t, T_TAGS + i * tagGap, 0.25), boxes[i], offs[i]); }).join('') : '';
    const h1 = wrap(hook1, { font: 'display', size: 84, maxWidth: SAFE.x1 - SAFE.x0 - 60, maxLines: 2 });
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${tags}
      <g opacity="${hookA.toFixed(3)}">
        <rect x="${SAFE.x0}" y="${SAFE.y0}" width="${SAFE.x1 - SAFE.x0}" height="${120 + h1.length * 92}" rx="34" fill="${C.linen}" fill-opacity="0.97"/>
        ${h1.map((l, i) => text(l, { font: 'display', size: 84, x: CX, y: SAFE.y0 + 104 + i * 92, anchor: 'middle', fill: C.ink })).join('')}
        ${text(hook2, { font: 'sansBold', size: 46, x: CX, y: SAFE.y0 + 96 + h1.length * 92, anchor: 'middle', fill: C.walnut })}
      </g>
      <g opacity="${endA.toFixed(3)}">
        <rect width="${W}" height="${H}" fill="${C.night}" fill-opacity="0.55"/>
        ${text(`${room.products.length} ${isEtsy ? 'pieces' : 'Amazon finds'}`, { font: 'sans', size: 46, x: CX, y: 720, anchor: 'middle', fill: C.amber })}
        ${text(room.totalPrice, { font: 'display', size: 110, x: CX, y: 850, anchor: 'middle', fill: '#f6eee3', maxWidth: SAFE.x1 - SAFE.x0 })}
        <rect x="${CX - 300}" y="920" width="600" height="110" rx="55" fill="${C.linen}"/>
        ${text('Every link in bio', { font: 'sansBold', size: 46, x: CX, y: 992, anchor: 'middle', fill: C.walnut })}
      </g>
    </svg>`;
    await write(await roomFrame(t, svg));
  }
  ff.stdin.end();
  await done;
  return [file, DUR.toFixed(1) + ' s', (fs.statSync(file).size / 1e6).toFixed(1) + ' MB'];
}

const rooms = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'rooms.json'), 'utf8')).rooms;
for (const n of (wanted.length ? wanted : rooms.map((_, i) => i + 1))) {
  const r = rooms[n - 1];
  if (!r) { console.log(`room ${n} not found`); continue; }
  if (!FORCE && fs.existsSync(path.join(OUT, `room-${String(n).padStart(2, '0')}-social.mp4`))) continue;
  console.log('social', ...(await renderRoom(r, n)));
}
