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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/images/pins/extra');
const DOMAIN = 'https://dailydecorinspo.vercel.app';
const W = 1000, H = 1500;
const DISCLOSURE = '#ad As an Amazon Associate, I earn from qualifying purchases.';

const esc = s => String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 3).trimEnd() + '...');
const low = p => parseInt((p.priceRange.match(/\d+/) || ['0'])[0], 10);

// wrap a title into lines of at most `max` chars
function wrap(text, max) {
  const words = text.split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

async function packshot(file, size) {
  return sharp(file).resize(size, size, { fit: 'contain', background: '#ffffff' }).toBuffer();
}

async function collagePin(room, num, products, out) {
  const n = products.length;
  const cols = 2, rows = Math.ceil(n / cols);
  const top = 230, bottom = 150, gap = 18;
  const cellH = Math.floor((H - top - bottom - (rows - 1) * gap) / rows);
  const cellW = Math.floor((W - 80 - gap) / cols);
  const img = Math.min(cellH - 66, cellW - 30);
  const comps = [];
  let cards = '';
  for (let i = 0; i < n; i++) {
    const p = products[i];
    const x = 40 + (i % cols) * (cellW + gap), y = top + Math.floor(i / cols) * (cellH + gap);
    cards += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="18" fill="#ffffff" stroke="#e8c49e" stroke-width="1.5"/>
      <circle cx="${x + 30}" cy="${y + 30}" r="19" fill="#c37539"/><text x="${x + 30}" y="${y + 37}" font-family="Inter, sans-serif" font-size="19" font-weight="bold" fill="#fff" text-anchor="middle">${p.number}</text>
      <rect x="${x + cellW - 128}" y="${y + 13}" width="114" height="34" rx="17" fill="#fbf3ea" stroke="#e8c49e"/><text x="${x + cellW - 71}" y="${y + 36}" font-family="Inter, sans-serif" font-size="18" font-weight="bold" fill="#6b3f28" text-anchor="middle">${esc(p.priceRange)}</text>
`;
    comps.push({ input: await packshot(path.join(ROOT, 'public', p.image), img), left: Math.round(x + (cellW - img) / 2), top: Math.round(y + 52) });
  }
  const titleLines = wrap(room.title, 30).slice(0, 2);
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#f7efe6"/>
    <text x="${W / 2}" y="70" font-family="Inter, sans-serif" font-size="20" font-weight="bold" fill="#a35e30" text-anchor="middle" letter-spacing="4">GET THE LOOK • ${n} AMAZON FINDS</text>
    ${titleLines.map((l, i) => `<text x="${W / 2}" y="${128 + i * 50}" font-family="'Playfair Display', Georgia, serif" font-size="44" font-weight="bold" fill="#24170e" text-anchor="middle">${esc(l)}</text>`).join('')}
    ${cards}
    <rect x="70" y="${H - 120}" width="${W - 140}" height="84" rx="42" fill="#1c1612"/>
    <text x="${W / 2}" y="${H - 68}" font-family="Inter, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">Total ${esc(room.totalPrice)} • Tap for every link</text>
  </svg>`;
  await sharp({ create: { width: W, height: H, channels: 3, background: '#f7efe6' } })
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
  const lines = wrap(room.title, 26).slice(0, 2);
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140f0c" stop-opacity="0"/><stop offset="1" stop-color="#140f0c" stop-opacity="0.85"/></linearGradient></defs>
    <rect x="0" y="${H - 470}" width="${W}" height="470" fill="url(#g)"/>
    <text x="60" y="${H - 290}" font-family="Inter, sans-serif" font-size="22" font-weight="bold" fill="#f2c79b" letter-spacing="3">SAVE THIS IDEA</text>
    ${lines.map((l, i) => `<text x="60" y="${H - 225 + i * 62}" font-family="'Playfair Display', Georgia, serif" font-size="56" font-weight="bold" fill="#ffffff">${esc(l)}</text>`).join('')}
    <text x="60" y="${H - 70}" font-family="Inter, sans-serif" font-size="24" fill="#f2dcc5">${room.products.length} ${room.products.some(p => p.store === 'etsy') ? 'curated' : 'Amazon'} finds • ${esc(room.totalPrice)} • dailydecorinspo</text>
  </svg>`;
  await sharp(base).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 90 }).toFile(out);
}

async function productPin(room, p, out) {
  const img = await packshot(path.join(ROOT, 'public', p.image), 820);
  const lines = wrap(p.name, 30).slice(0, 3);
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#f7efe6"/>
    <rect x="70" y="150" width="860" height="860" rx="30" fill="#ffffff" stroke="#e8c49e" stroke-width="2"/>
    <text x="${W / 2}" y="95" font-family="Inter, sans-serif" font-size="22" font-weight="bold" fill="#a35e30" text-anchor="middle" letter-spacing="4">AMAZON FIND${p.rating ? ' • ★ ' + p.rating : ''}</text>
    ${lines.map((l, i) => `<text x="${W / 2}" y="${1095 + i * 54}" font-family="'Playfair Display', Georgia, serif" font-size="46" font-weight="bold" fill="#24170e" text-anchor="middle">${esc(l)}</text>`).join('')}
    <rect x="${W / 2 - 150}" y="${1110 + lines.length * 54}" width="300" height="72" rx="36" fill="#1c1612"/>
    <text x="${W / 2}" y="${1158 + lines.length * 54}" font-family="Inter, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle">${esc(p.priceRange)}</text>
    <text x="${W / 2}" y="${H - 40}" font-family="Inter, sans-serif" font-size="22" fill="#6b3f28" text-anchor="middle">As seen in: ${esc(clip(room.title, 44))}</text>
  </svg>`;
  await sharp({ create: { width: W, height: H, channels: 3, background: '#f7efe6' } })
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
        title: clip(`${amazon.length} Amazon Finds to Get This ${room.title} Look (${room.totalPrice})`, 100),
        description: `Get the look for less: every piece in our ${room.title}, from ${room.products.map(low).sort((a, b) => a - b)[0] ? '$' + Math.min(...room.products.map(low)) : 'budget prices'}. Tap for direct links to all ${room.products.length} items.\n\n${tags}\n\n${DISCLOSURE}` });
    }
    const zf = `room-${num}-zoom.jpg`;
    await zoomPin(room, num, path.join(OUT, zf));
    manifest.push({ ...base, id: `r${num}-zoom`, type: 'zoom', image: `/images/pins/extra/${zf}`, link: roomLink('zoom'),
      title: clip(`${room.title} Ideas (Shop the Amazon Finds)`, 100),
      description: `${room.subtitle}. Save this ${(cat.label || 'room').toLowerCase()} idea and tap to shop all ${room.products.length} pieces (${room.totalPrice}).\n\n${tags}\n\n${DISCLOSURE}` });

    for (const p of amazon) {
      const f = `room-${num}-p${p.number}.jpg`;
      await productPin(room, p, path.join(OUT, f));
      manifest.push({ ...base, id: `r${num}-p${p.number}`, type: 'product', image: `/images/pins/extra/${f}`,
        link: p.amazonUrl, // tagged amazon.com/dp/ASIN?tag=dailydecorins-20 (clear Amazon URL, allowed on Pinterest)
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
