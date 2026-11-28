// Extra fresh Pinterest pins per room (beyond Pin A / Pin B), so one room yields many original pins.
//   collage : every product packshot with number + price, links to the room page
//   zoom    : a closer crop of the room photo around most hotspots, links to the room page
//   product : one pin per Amazon product (packshot + name + price), links straight to Amazon (tagged)
// Writes images to public/images/pins/extra/ and a manifest (public/images/pins/extra/manifest.json)
// that tools/schedule.py turns into Bulk Create CSV rows. 0 API cost (sharp only).
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { text, wrap } from './pin-text.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/images/pins/extra');
const DOMAIN = 'https://dailydecorinspo.vercel.app';
const W = 1000, H = 1500;
const DISCLOSURE = '#ad As an Amazon Associate, I earn from qualifying purchases.';

const esc = s => String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 3).trimEnd() + '...');
const low = p => parseInt((p.priceRange.match(/\d+/) || ['0'])[0], 10);

// Same palette and type as the website (see scripts/generate-pins.mjs)
const C = { linen: '#faf6f0', oat: '#f3ebe0', ink: '#2b1d14', ink2: '#5e4636', muted: '#8a7261', line: '#e6d8c6', walnut: '#7a4a2b', amber: '#e2aa6c', sage: '#5f7357', night: '#1d1612' };

async function packshot(file, size) {
  return sharp(file).resize(size, size, { fit: 'contain', background: '#ffffff' }).toBuffer();
}

async function collagePin(room, num, products, out) {
  const n = products.length;
  const cols = 2, rows = Math.ceil(n / cols);
  const top = 250, bottom = 150, gap = 18;
  const cellH = Math.floor((H - top - bottom - (rows - 1) * gap) / rows);
  const cellW = Math.floor((W - 80 - gap) / cols);
  const img = Math.min(cellH - 66, cellW - 30);
  const comps = [];
  let cards = '';
  for (let i = 0; i < n; i++) {
    const p = products[i];
    const x = 40 + (i % cols) * (cellW + gap), y = top + Math.floor(i / cols) * (cellH + gap);
    cards += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="20" fill="#ffffff" stroke="${C.line}" stroke-width="1.5"/>
      <circle cx="${x + 30}" cy="${y + 30}" r="18" fill="${C.walnut}"/>
      ${text(String(p.number), { font: 'sansBold', size: 19, x: x + 30, y: y + 37, anchor: 'middle', fill: '#ffffff' })}
      <rect x="${x + cellW - 134}" y="${y + 13}" width="120" height="34" rx="17" fill="${C.oat}"/>
      ${text(p.priceRange, { font: 'sansBold', size: 18, x: x + cellW - 74, y: y + 36, anchor: 'middle', fill: C.ink, maxWidth: 108 })}`;
    comps.push({ input: await packshot(path.join(ROOT, 'public', p.image), img), left: Math.round(x + (cellW - img) / 2), top: Math.round(y + 52) });
  }
  const titleLines = wrap(room.title, { font: 'display', size: 50, maxWidth: 880, maxLines: 2 });
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${C.linen}"/>
    ${text(`Get the look with ${n} Amazon finds`, { font: 'sans', size: 24, x: W / 2, y: 78, anchor: 'middle', fill: C.walnut })}
    ${titleLines.map((l, i) => text(l, { font: 'display', size: 50, x: W / 2, y: 142 + i * 56, anchor: 'middle', fill: C.ink })).join('')}
    ${cards}
    <rect x="70" y="${H - 120}" width="${W - 140}" height="84" rx="42" fill="${C.walnut}"/>
    ${text(`Whole look ${room.totalPrice}. Tap for every link`, { font: 'sansBold', size: 27, x: W / 2, y: H - 68, anchor: 'middle', fill: '#fff8f0', maxWidth: W - 200 })}
  </svg>`;
  await sharp({ create: { width: W, height: H, channels: 3, background: C.linen } })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }, ...comps]).jpeg({ quality: 90 }).toFile(out);
}

async function zoomPin(room, num, out) {
  const hero = path.join(ROOT, 'public', room.roomImage);
  const meta = await sharp(hero).metadata();
  const pts = room.products.filter(p => p.hotspot).map(p => p.hotspot);
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length / 100 * meta.width;
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length / 100 * meta.height;
  const cw = Math.round(meta.width * 0.78), ch = Math.round(cw * 1.5);
  const left = Math.max(0, Math.min(meta.width - cw, Math.round(cx - cw / 2)));
  const topY = Math.max(0, Math.min(meta.height - ch, Math.round(cy - ch / 2)));
  const base = await sharp(hero).extract({ left, top: topY, width: cw, height: ch }).resize(W, H).sharpen().toBuffer();
  const lines = wrap(room.title, { font: 'display', size: 62, maxWidth: 880, maxLines: 2 });
  const kind = room.products.some(p => p.store === 'etsy') ? 'curated' : 'Amazon';
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}" stop-opacity="0"/><stop offset="0.32" stop-color="${C.night}" stop-opacity="0.62"/><stop offset="1" stop-color="${C.night}" stop-opacity="0.92"/></linearGradient></defs>
    <rect x="0" y="${H - 560}" width="${W}" height="560" fill="url(#g)"/>
    ${text('Save this idea', { font: 'sans', size: 26, x: 60, y: H - 300, fill: C.amber })}
    ${lines.map((l, i) => text(l, { font: 'display', size: 62, x: 58, y: H - 228 + i * 68, fill: '#f6eee3' })).join('')}
    ${text(`${room.products.length} ${kind} finds, ${room.totalPrice} for the whole look`, { font: 'sans', size: 25, x: 60, y: H - 66, fill: '#e2d3c1', maxWidth: 880 })}
  </svg>`;
  await sharp(base).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 90 }).toFile(out);
}

async function productPin(room, p, out) {
  const img = await packshot(path.join(ROOT, 'public', p.image), 820);
  const lines = wrap(p.name, { font: 'display', size: 50, maxWidth: 860, maxLines: 3 });
  const pillY = 1112 + lines.length * 58;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${C.linen}"/>
    <rect x="70" y="150" width="860" height="860" rx="32" fill="#ffffff" stroke="${C.line}" stroke-width="2"/>
    ${text(p.rating ? `Amazon find, rated ${p.rating}` : 'Amazon find', { font: 'sans', size: 26, x: W / 2, y: 104, anchor: 'middle', fill: C.walnut })}
    ${lines.map((l, i) => text(l, { font: 'display', size: 50, x: W / 2, y: 1098 + i * 58, anchor: 'middle', fill: C.ink })).join('')}
    <rect x="${W / 2 - 150}" y="${pillY}" width="300" height="74" rx="37" fill="${C.walnut}"/>
    ${text(p.priceRange, { font: 'sansBold', size: 34, x: W / 2, y: pillY + 49, anchor: 'middle', fill: '#fff8f0' })}
    ${text(`As seen in our ${room.title}`, { font: 'sans', size: 23, x: W / 2, y: H - 44, anchor: 'middle', fill: C.muted, maxWidth: 880 })}
  </svg>`;
  await sharp({ create: { width: W, height: H, channels: 3, background: C.linen } })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }, { input: img, left: 90, top: 170 }]).jpeg({ quality: 90 }).toFile(out);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const rooms = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/rooms.json'), 'utf8')).rooms;
  const cats = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/categories.json'), 'utf8'));
  const manifest = [];
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i], num = String(i + 1).padStart(2, '0');
    const cat = cats[room.category] || {};
    const amazon = room.products.filter(p => p.store !== 'etsy' && p.amazonUrl);
    const roomUrl = `${DOMAIN}/room/${room.slug}/`;
    const tags = cat.tags || '#amazonfinds #homedecorideas';
    const base = { room: i + 1, board: cat.board, keywords: cat.keywords || '' };
    const roomLink = c => `${roomUrl}?utm_source=pinterest&utm_medium=social&utm_campaign=room-${num}&utm_content=${c}`;

    if (amazon.length >= 4) {
      const f = `room-${num}-collage.jpg`;
      await collagePin(room, num, amazon, path.join(OUT, f));
      manifest.push({ ...base, id: `r${num}-collage`, type: 'collage', image: `/images/pins/extra/${f}`, link: roomLink('collage'),
        title: clip(`The Exact ${amazon.length} Amazon Finds in This ${room.title} (${room.totalPrice})`, 100),
        description: `Not look-alikes: the exact pieces in our ${room.title}, from ${room.products.map(low).sort((a, b) => a - b)[0] ? '$' + Math.min(...room.products.map(low)) : 'budget prices'}. Tap for the exact links to all ${room.products.length} items.\n\n${tags}\n\n${DISCLOSURE}` });
    }
    const zf = `room-${num}-zoom.jpg`;
    await zoomPin(room, num, path.join(OUT, zf));
    manifest.push({ ...base, id: `r${num}-zoom`, type: 'zoom', image: `/images/pins/extra/${zf}`, link: roomLink('zoom'),
      title: clip(`${room.title} Ideas (Shop the Exact Items)`, 100),
      description: `${room.subtitle}. Save this ${(cat.label || 'room').toLowerCase()} idea and tap for the exact links to all ${room.products.length} pieces (${room.totalPrice}).\n\n${tags}\n\n${DISCLOSURE}` });

    for (const p of amazon) {
      const f = `room-${num}-p${p.number}.jpg`;
      await productPin(room, p, path.join(OUT, f));
      manifest.push({ ...base, id: `r${num}-p${p.number}`, type: 'product', image: `/images/pins/extra/${f}`,
        // clear amazon.com/dp/ASIN URL (allowed on Pinterest) with the separate pin tracking ID
        link: p.amazonUrl.replace('tag=dailydecorins-20', 'tag=dailydecorpin-20'),
        title: clip(`${p.name} | ${p.priceRange} Amazon Find`, 100),
        description: clip(`${p.description}. As seen in our ${room.title}: ${roomUrl}`, 330) + `\n\n${tags}\n\n${DISCLOSURE}` });
    }
    console.log(`room ${num}: ${2 + amazon.length - (amazon.length >= 4 ? 0 : 1)} extra pins`);
  }
  for (const m of manifest) {
    if (!m.description.includes(DISCLOSURE) || m.description.length > 500) throw new Error(`bad description ${m.id} (${m.description.length})`);
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`${manifest.length} extra pins -> public/images/pins/extra/manifest.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
