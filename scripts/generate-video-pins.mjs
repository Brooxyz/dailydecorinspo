// Video pins: an ~8.5 s silent 1000x1500 MP4 per room. Slow push-in on the room photo, a title card,
// numbered product tags popping in one by one, then an end card with the item count and the total price.
// Same palette and type as the image pins (scripts/pin-text.mjs). Encoded with ffmpeg-static (H.264, yuv420p).
//
// usage: node scripts/generate-video-pins.mjs [roomNumber ...] [--out dir]
//   default out dir: public/videos/pins   (file: room-NN.mp4 + room-NN-cover.jpg)
//   existing videos are skipped unless --force (re-render after changing a room's photo or products)
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';
import { text, wrap, measure } from './pin-text.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1000, H = 1500, FPS = 30, DUR = 8.5;
const C = { linen: '#faf6f0', ink: '#2b1d14', ink2: '#5e4636', muted: '#8a7261', walnut: '#7a4a2b', amber: '#e2aa6c', night: '#1d1612' };

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : path.join(ROOT, 'public', 'videos', 'pins');
const wanted = args.filter((a, i) => /^\d+$/.test(a) && args[i - 1] !== '--out').map(Number);
const FORCE = args.includes('--force');

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
const fade = (t, start, len) => ease((t - start) / len);

const FS = 25, FS2 = 22, LH = 29, PAD = 18;

function labelLines(name) {
  const base = name.replace(/\s*\(.*?\)\s*/g, ' ').split(/,| with | for /)[0].trim();
  return wrap(base, { font: 'sansBold', size: FS, maxWidth: 300, maxLines: 2 });
}

function labelBox(p) {
  const lines = labelLines(p.name);
  const w = Math.max(...lines.map((l) => measure(l, 'sansBold', FS)), measure(p.priceRange, 'sans', FS2)) + PAD * 2;
  const h = PAD + lines.length * LH + 30;
  return { lines, w, h };
}

// Greedy label placement (computed once) so labels never cover each other or leave the frame
function placeLabels(points) {
  // every numbered dot is an obstacle too, so no label hides another product's number
  const placed = points.map(({ x, y }) => ({ x: x - 30, y: y - 30, w: 60, h: 60, dot: true }));
  const overlap = (a, b) => a.x < b.x + b.w + 8 && b.x < a.x + a.w + 8 && a.y < b.y + b.h + 8 && b.y < a.y + a.h + 8;
  return points.map(({ x, y, box }) => {
    const sides = x > W * 0.55 ? ['left', 'right'] : ['right', 'left'];
    let best = null;
    for (const dy of [0, -1, 1, -2, 2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7]) {
      for (const side of sides) {
        const r = { x: side === 'right' ? x + 32 : x - 32 - box.w, y: y - box.h / 2 + dy * (box.h * 0.6), w: box.w, h: box.h };
        if (r.x < 16 || r.x + r.w > W - 16 || r.y < 16 || r.y + r.h > H - 16) continue;
        if (placed.some((q) => !(q.dot && Math.abs(q.x + 30 - x) < 1 && Math.abs(q.y + 30 - y) < 1) && overlap(r, q))) continue;
        best = r; break;
      }
      if (best) break;
    }
    if (!best) {
      // nothing is free: take the spot that covers the least
      let min = Infinity;
      for (let dy = -8; dy <= 8; dy++) for (const side of sides) {
        const r = { x: Math.min(W - 16 - box.w, Math.max(16, side === 'right' ? x + 32 : x - 32 - box.w)), y: Math.min(H - 16 - box.h, Math.max(16, y - box.h / 2 + dy * box.h * 0.4)), w: box.w, h: box.h };
        const area = placed.reduce((a, q) => a + Math.max(0, Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x)) * Math.max(0, Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y)), 0);
        if (area < min) { min = area; best = r; }
      }
      console.log('  label overlap fallback for tag at', Math.round(x), Math.round(y));
    }
    placed.push(best);
    return { dx: best.x - x, dy: best.y - y };
  });
}

function tagSvg(p, x, y, a, box, off) {
  // a: 0..1 appear progress (scale + opacity)
  if (a <= 0) return '';
  const s = 0.6 + 0.4 * a;
  const bx = x + off.dx, by = y + off.dy;
  // leader line from the dot to the nearest point of its label (only when the label sits away from the dot)
  const lx = Math.min(Math.max(x, bx), bx + box.w), ly = Math.min(Math.max(y, by), by + box.h);
  const far = Math.hypot(lx - x, ly - y) > 40;
  return `<g opacity="${a.toFixed(3)}">
    ${far ? `<line x1="${x}" y1="${y}" x2="${lx}" y2="${ly}" stroke="${C.linen}" stroke-width="3" stroke-opacity="0.95"/>` : ''}
    <g transform="translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})">
      <circle cx="${x}" cy="${y}" r="27" fill="#ffffff" fill-opacity="0.6"/>
      <circle cx="${x}" cy="${y}" r="22" fill="${C.walnut}" stroke="#ffffff" stroke-width="3.5"/>
      ${text(String(p.number), { font: 'sansBold', size: 22, x, y: y + 8, anchor: 'middle', fill: '#ffffff' })}
    </g>
    <rect x="${bx}" y="${by}" width="${box.w}" height="${box.h}" rx="16" fill="${C.linen}" fill-opacity="0.97"/>
    ${box.lines.map((l, i) => text(l, { font: 'sansBold', size: FS, x: bx + PAD, y: by + PAD + 20 + i * LH, fill: C.ink })).join('')}
    ${text(p.priceRange, { font: 'sans', size: FS2, x: bx + PAD, y: by + PAD + 20 + box.lines.length * LH + 2, fill: C.walnut })}
  </g>`;
}

async function renderRoom(room, num) {
  const hero = path.join(ROOT, 'public', room.roomImage);
  const base = await sharp(hero).resize(W, H, { fit: 'cover' }).toBuffer();
  const prods = room.products.filter((p) => p.hotspot);
  // Drift the push-in toward the middle of the products
  const fx = prods.reduce((s, p) => s + p.hotspot.x, 0) / prods.length / 100;
  const fy = prods.reduce((s, p) => s + p.hotspot.y, 0) / prods.length / 100;
  const titleLines = wrap(room.title, { font: 'display', size: 56, maxWidth: 820, maxLines: 2 });
  const isEtsy = room.products.some((p) => p.store === 'etsy');
  const total = Math.round(FPS * DUR);
  const boxes = prods.map(labelBox);
  {
    // layout at the zoom level where all tags are on screen
    const z = 1 + 0.1 * ease(5.6 / DUR), cw = W / z, ch = H / z;
    const cx = Math.min(W - cw, Math.max(0, (0.5 + (fx - 0.5) * 0.6) * W - cw / 2));
    const cy = Math.min(H - ch, Math.max(0, (0.5 + (fy - 0.5) * 0.6) * H - ch / 2));
    var offs = placeLabels(prods.map((p, i) => ({ x: ((p.hotspot.x / 100) * W - cx) * z, y: ((p.hotspot.y / 100) * H - cy) * z, box: boxes[i] })));
  }
  const tagStart = 1.7, tagGap = Math.min(0.6, 4.2 / prods.length), endStart = 6.7;

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `room-${String(num).padStart(2, '0')}.mp4`);
  const ff = spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file]);
  const done = new Promise((res, rej) => { ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))); });
  const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once('drain', res)));

  let cover = null;
  for (let f = 0; f < total; f++) {
    const t = f / FPS;
    const z = 1 + 0.1 * ease(t / DUR);
    const cw = W / z, ch = H / z;
    const cx = Math.min(W - cw, Math.max(0, (0.5 + (fx - 0.5) * 0.6) * W - cw / 2));
    const cy = Math.min(H - ch, Math.max(0, (0.5 + (fy - 0.5) * 0.6) * H - ch / 2));
    const map = (p) => [((p.hotspot.x / 100) * W - cx) * z, ((p.hotspot.y / 100) * H - cy) * z];

    const titleA = 1 - fade(t, 2.3, 0.45);
    const endA = fade(t, endStart, 0.45);
    const tags = prods.map((p, i) => { const [x, y] = map(p); return tagSvg(p, x, y, fade(t, tagStart + i * tagGap, 0.3) * (1 - endA), boxes[i], offs[i]); }).join('');
    const cardH = 70 + titleLines.length * 62;
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}" stop-opacity="0"/><stop offset="0.4" stop-color="${C.night}" stop-opacity="0.78"/><stop offset="1" stop-color="${C.night}" stop-opacity="0.92"/></linearGradient></defs>
      ${tags}
      <g opacity="${titleA.toFixed(3)}">
        <rect x="60" y="60" width="880" height="${cardH}" rx="26" fill="${C.linen}" fill-opacity="0.97"/>
        ${text(`Room ${num} by Daily Decor Inspo`, { font: 'sans', size: 20, x: 98, y: 112, fill: C.muted })}
        ${titleLines.map((l, i) => text(l, { font: 'display', size: 56, x: 96, y: 176 + i * 62, fill: C.ink })).join('')}
      </g>
      <g opacity="${endA.toFixed(3)}">
        <rect x="0" y="${H - 520}" width="${W}" height="520" fill="url(#g)"/>
        ${text(`${room.products.length} ${isEtsy ? 'curated' : 'Amazon'} finds in this room`, { font: 'sans', size: 30, x: W / 2, y: H - 270, anchor: 'middle', fill: C.amber })}
        ${text(`${room.totalPrice} for the whole look`, { font: 'display', size: 64, x: W / 2, y: H - 190, anchor: 'middle', fill: '#f6eee3', maxWidth: 880 })}
        <rect x="${W / 2 - 250}" y="${H - 138}" width="500" height="80" rx="40" fill="${C.linen}"/>
        ${text('Tap for every link', { font: 'sansBold', size: 30, x: W / 2, y: H - 87, anchor: 'middle', fill: C.walnut })}
      </g>
    </svg>`;
    // Sub-pixel camera: crop on whole pixels, then scale + shift the fraction with bicubic interpolation.
    // (Rounding the crop each frame made the slow push-in step by a pixel now and then, which read as jitter.)
    const ix = Math.floor(cx), iy = Math.floor(cy), ox = cx - ix, oy = cy - iy;
    const ew = Math.min(W - ix, Math.ceil(cw + ox) + 1), eh = Math.min(H - iy, Math.ceil(ch + oy) + 1);
    const moved = await sharp(base)
      .extract({ left: ix, top: iy, width: ew, height: eh })
      .affine([z, 0, 0, z], { odx: -ox * z, ody: -oy * z, interpolator: sharp.interpolators.bicubic })
      .toBuffer({ resolveWithObject: true });
    if (f === 0 && (moved.info.width < W || moved.info.height < H)) throw new Error(`affine output ${moved.info.width}x${moved.info.height} < ${W}x${H}`);
    const frame = await sharp(moved.data)
      .extract({ left: 0, top: 0, width: W, height: H })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .removeAlpha()
      .raw()
      .toBuffer();
    await write(frame);
    if (f === Math.round(FPS * 5.6)) cover = frame; // all tags visible, before the end card
  }
  ff.stdin.end();
  await done;
  const coverFile = file.replace(/\.mp4$/, '-cover.jpg');
  await sharp(cover, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 88 }).toFile(coverFile);
  return [file, (fs.statSync(file).size / 1e6).toFixed(1) + ' MB'];
}

const rooms = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'rooms.json'), 'utf8')).rooms;
const list = wanted.length ? wanted : rooms.map((_, i) => i + 1);
for (const n of list) {
  const r = rooms[n - 1];
  if (!r) { console.log(`room ${n} not found`); continue; }
  const target = path.join(OUT, `room-${String(n).padStart(2, '0')}.mp4`);
  if (!FORCE && fs.existsSync(target)) continue;
  console.log('video', ...(await renderRoom(r, n)));
}
