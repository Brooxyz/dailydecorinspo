import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { text, wrap } from './pin-text.mjs';

const WIDTH = 1000;
const HEIGHT = 1500;

// Palette and type match the website (src/app/globals.css): linen, walnut, amber lamp glow;
// Fraunces for headings, Instrument Sans for labels (vector paths via scripts/pin-text.mjs).
const C = { linen: '#faf6f0', oat: '#f3ebe0', ink: '#2b1d14', ink2: '#5e4636', muted: '#8a7261', line: '#e6d8c6', walnut: '#7a4a2b', amber: '#e2aa6c', sage: '#5f7357', night: '#1d1612' };

async function generatePinA({
  roomImageSrc,
  title,
  subtitle,
  roomNumber,
  outputPath,
}) {
  const roomBg = await sharp(roomImageSrc)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
    .toBuffer();

  const titleLines = wrap(title, { font: 'display', size: 54, maxWidth: 800, maxLines: 2 });
  const subLines = wrap(subtitle, { font: 'sans', size: 22, maxWidth: 800, maxLines: 2 });
  const cardH = 70 + titleLines.length * 60 + subLines.length * 30 + 26;

  const svgOverlay = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bottomShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${C.night}" stop-opacity="0" />
        <stop offset="100%" stop-color="${C.night}" stop-opacity="0.75" />
      </linearGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000" flood-opacity="0.28"/>
      </filter>
    </defs>
    <rect x="0" y="${HEIGHT - 330}" width="${WIDTH}" height="330" fill="url(#bottomShadow)" />

    <g transform="translate(60, 52)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="880" height="${cardH}" rx="26" fill="${C.linen}" fill-opacity="0.97" />
    </g>
    ${text(`Room ${Number(roomNumber)} by Daily Decor Inspo`, { font: 'sans', size: 19, x: 100, y: 108, fill: C.muted })}
    ${titleLines.map((l, i) => text(l, { font: 'display', size: 54, x: 98, y: 172 + i * 60, fill: C.ink })).join('')}
    ${subLines.map((l, i) => text(l, { font: 'sans', size: 22, x: 100, y: 172 + (titleLines.length - 1) * 60 + 44 + i * 30, fill: C.ink2 })).join('')}

    <rect x="${WIDTH / 2 - 300}" y="${HEIGHT - 190}" width="600" height="84" rx="42" fill="${C.linen}" />
    ${text('Shop every item in this room', { font: 'sansBold', size: 28, x: WIDTH / 2, y: HEIGHT - 138, anchor: 'middle', fill: C.walnut })}
    ${text('dailydecorinspo.vercel.app', { font: 'sans', size: 20, x: WIDTH / 2, y: HEIGHT - 66, anchor: 'middle', fill: '#f3e9dc' })}
  </svg>
  `;

  await sharp(roomBg)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .jpeg({ quality: 94 })
    .toFile(outputPath);

  console.log(`✓ Pin A created at: ${outputPath}`);
}

async function generatePinB({
  roomImageSrc,
  title,
  roomNumber,
  totalPrice,
  products,
  badges,
  outputPath,
}) {
  const PHOTO_HEIGHT = 1180;
  const STRIP_HEIGHT = 320;
  const maxProducts = Math.min(5, products.length);

  const roomResized = await sharp(roomImageSrc)
    .resize(WIDTH, PHOTO_HEIGHT, { fit: 'cover', position: 'center' })
    .toBuffer();

  const badgesSvg = (badges || []).map(b => `
    <g transform="translate(${b.x}, ${b.y})" filter="url(#badgeGlow)">
      <circle cx="0" cy="0" r="27" fill="#ffffff" fill-opacity="0.55" />
      <circle cx="0" cy="0" r="22" fill="${C.walnut}" stroke="#ffffff" stroke-width="3.5" />
    </g>
    ${text(String(b.number), { font: 'sansBold', size: 22, x: b.x, y: b.y + 8, anchor: 'middle', fill: '#ffffff' })}
  `).join('\n');

  const cardGap = 12;
  const cardWidth = Math.floor((WIDTH - 64 - (maxProducts - 1) * cardGap) / maxProducts);
  const isEtsy = products.some(p => p.store === 'etsy');

  const stripBgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="badgeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.45"/>
      </filter>
      <filter id="headerShadow" x="-10%" y="-10%" width="120%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>

    <g transform="translate(50, 36)" filter="url(#headerShadow)">
      <rect x="0" y="0" width="900" height="118" rx="24" fill="${C.night}" fill-opacity="0.94" />
    </g>
    ${text(`Shop the look, room ${Number(roomNumber)}`, { font: 'sans', size: 19, x: 500, y: 80, anchor: 'middle', fill: C.amber })}
    ${text(`${title}  ${totalPrice}`, { font: 'display', size: 36, x: 500, y: 128, anchor: 'middle', fill: '#f3e9dc', maxWidth: 840 })}

    ${badgesSvg}

    <rect x="0" y="${PHOTO_HEIGHT}" width="${WIDTH}" height="${STRIP_HEIGHT}" fill="${C.linen}" />
    <line x1="0" y1="${PHOTO_HEIGHT}" x2="${WIDTH}" y2="${PHOTO_HEIGHT}" stroke="${C.line}" stroke-width="2" />
    ${text(isEtsy ? 'Every item in this room' : 'The Amazon finds in this room', { font: 'display', size: 24, x: 32, y: PHOTO_HEIGHT + 40, fill: C.ink })}
    ${text('Tap the pin for every link', { font: 'sans', size: 16, x: WIDTH - 32, y: PHOTO_HEIGHT + 39, anchor: 'end', fill: C.muted })}

    ${products.slice(0, maxProducts).map((p, i) => {
      const x = 32 + i * (cardWidth + cardGap);
      return `<rect x="${x}" y="${PHOTO_HEIGHT + 56}" width="${cardWidth}" height="238" rx="16" fill="#ffffff" stroke="${C.line}" stroke-width="1.2" />`;
    }).join('\n')}
  </svg>
  `;

  const stripFgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${products.slice(0, maxProducts).map((p, i) => {
      const x = 32 + i * (cardWidth + cardGap);
      const y0 = PHOTO_HEIGHT + 56;
      return `
        <circle cx="${x + 24}" cy="${y0 + 24}" r="14" fill="${C.walnut}" />
        ${text(String(p.number), { font: 'sansBold', size: 15, x: x + 24, y: y0 + 29, anchor: 'middle', fill: '#ffffff' })}
        <rect x="${x + cardWidth - 92}" y="${y0 + 11}" width="82" height="26" rx="13" fill="${C.oat}" />
        ${text(p.priceRange, { font: 'sansBold', size: 14, x: x + cardWidth - 51, y: y0 + 29, anchor: 'middle', fill: C.ink, maxWidth: 74 })}
        ${text(wrap(p.name, { font: 'sansBold', size: 14, maxWidth: cardWidth - 24, maxLines: 1 })[0], { font: 'sansBold', size: 14, x: x + 12, y: y0 + 200, fill: C.ink })}
        ${text(p.store === 'etsy' ? 'Handmade, our Etsy shop' : (p.rating ? `Rated ${p.rating} on Amazon` : 'On Amazon'), { font: 'sans', size: 13, x: x + 12, y: y0 + 222, fill: C.sage })}
      `;
    }).join('\n')}
  </svg>
  `;

  const productThumbOverlays = [];
  const thumbWidth = cardWidth - 36;
  for (let i = 0; i < maxProducts; i++) {
    const p = products[i];
    const cardX = 32 + i * (cardWidth + cardGap);
    if (fs.existsSync(p.image)) {
      const thumbBuf = await sharp(p.image)
        .resize(thumbWidth, 130, { fit: 'contain', background: '#ffffff' })
        .toBuffer();
      productThumbOverlays.push({ input: thumbBuf, top: PHOTO_HEIGHT + 56 + 44, left: cardX + 18 });
    }
  }

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: C.linen },
  })
    .composite([
      { input: roomResized, top: 0, left: 0 },
      { input: Buffer.from(stripBgSvg), top: 0, left: 0 },
      ...productThumbOverlays,
      { input: Buffer.from(stripFgSvg), top: 0, left: 0 },
    ])
    .jpeg({ quality: 94 })
    .toFile(outputPath);

  console.log(`✓ Pin B created at: ${outputPath}`);
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

export { generatePinA, generatePinB };

async function main() {
  const root = 'c:/amazon-pinterest/storefront';
  const roomsPath = path.join(root, 'src/data/rooms.json');
  const data = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));

  // Pin B badges come from each product's site hotspot (% of the 1000x1500 hero).
  // Pin B shows a 1000x1180 centre crop (160px cut top & bottom), so convert and
  // drop badges that would fall under the title card or outside the photo.
  const PIN_CROP_TOP = 160;
  const badgesFor = (room) =>
    room.products
      .filter(p => p.hotspot)
      .map(p => ({
        number: p.number,
        x: Math.round(p.hotspot.x * 10),
        y: Math.round(p.hotspot.y * 15 - PIN_CROP_TOP),
      }))
      .filter(b => b.y >= 180 && b.y <= 1150 && b.x >= 30 && b.x <= 970);

  for (let index = 0; index < data.rooms.length; index++) {
    const room = data.rooms[index];
    const roomNum = String(index + 1).padStart(2, '0');
    console.log(`\n=== Processing Room #${roomNum}: ${room.title} ===`);

    const roomImage = path.join(root, 'public', room.roomImage.replace(/^\//, ''));
    const pinADir = path.join(root, `public/images/pins/room-${roomNum}-aesthetic.jpg`);
    const pinBDir = path.join(root, `public/images/pins/room-${roomNum}-catalog.jpg`);

    console.log(`Generating Pin A for Room #${roomNum}...`);
    await generatePinA({
      roomImageSrc: roomImage,
      title: room.title,
      subtitle: room.subtitle,
      roomNumber: roomNum,
      outputPath: pinADir,
    });

    console.log(`Generating Pin B for Room #${roomNum}...`);
    const mappedProducts = room.products.map(p => ({
      ...p,
      image: path.join(root, 'public', p.image.replace(/^\//, '')),
    }));

    await generatePinB({
      roomImageSrc: roomImage,
      title: room.title,
      roomNumber: roomNum,
      totalPrice: room.totalPrice,
      products: mappedProducts,
      badges: badgesFor(room),
      outputPath: pinBDir,
    });
  }

  console.log('\nAll room pins generated successfully!');
}

main().catch(console.error);
