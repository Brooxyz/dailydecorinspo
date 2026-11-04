import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const WIDTH = 1000;
const HEIGHT = 1500;

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

  const svgOverlay = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#140f0c" stop-opacity="0.8" />
        <stop offset="60%" stop-color="#140f0c" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#140f0c" stop-opacity="0" />
      </linearGradient>

      <linearGradient id="bottomShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#140f0c" stop-opacity="0" />
        <stop offset="40%" stop-color="#140f0c" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#140f0c" stop-opacity="0.95" />
      </linearGradient>

      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.45"/>
      </filter>
    </defs>

    <rect x="0" y="0" width="${WIDTH}" height="320" fill="url(#topShadow)" />
    <rect x="0" y="${HEIGHT - 380}" width="${WIDTH}" height="380" fill="url(#bottomShadow)" />

    <!-- Top Badge Header Card -->
    <g transform="translate(60, 48)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="880" height="155" rx="22" fill="#fffaf5" fill-opacity="0.96" stroke="#e8c49e" stroke-width="2" />
      
      <rect x="32" y="24" width="130" height="32" rx="16" fill="#a35e30" />
      <text x="97" y="45" font-family="'Inter', sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">ROOM #${roomNumber}</text>

      <text x="180" y="46" font-family="'Inter', sans-serif" font-size="14" font-weight="700" fill="#834c2d" letter-spacing="2.5">DAILY DECOR INSPO</text>

      <text x="32" y="104" font-family="'Playfair Display', Georgia, serif" font-size="36" font-weight="bold" fill="#24170e">${escapeXml(title)}</text>
      <text x="32" y="134" font-family="'Inter', sans-serif" font-size="17" fill="#6b3f28">${escapeXml(subtitle)}</text>
    </g>

    <!-- Bottom CTA Card -->
    <g transform="translate(70, ${HEIGHT - 210})" filter="url(#cardShadow)">
      <rect x="0" y="0" width="860" height="145" rx="26" fill="#1c1612" fill-opacity="0.95" stroke="#dca672" stroke-width="2" />
      
      <circle cx="70" cy="72" r="38" fill="#d18b4e" />
      <text x="70" y="83" font-size="30" text-anchor="middle">🛍️</text>

      <text x="135" y="62" font-family="'Playfair Display', Georgia, serif" font-size="27" font-weight="bold" fill="#ffffff">Shop Every Item From This Room</text>
      <text x="135" y="95" font-family="'Inter', sans-serif" font-size="18" font-weight="500" fill="#f2dcc5">Tap pin to visit dailydecorinspo.vercel.app</text>
      <text x="135" y="120" font-family="'Inter', sans-serif" font-size="13" fill="#a3a3a3">Curated Amazon Finds • Direct Links &amp; Real Prices</text>
    </g>
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
      <circle cx="0" cy="0" r="30" fill="#ffffff" fill-opacity="0.5" />
      <circle cx="0" cy="0" r="23" fill="#c37539" stroke="#ffffff" stroke-width="3.5" />
      <text x="0" y="8" font-family="'Inter', sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${b.number}</text>
    </g>
  `).join('\n');

  const cardWidth = Math.floor((WIDTH - 64 - (maxProducts - 1) * 12) / maxProducts);
  const cardGap = 12;

  const stripBgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="badgeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000" flood-opacity="0.6"/>
      </filter>
      <filter id="headerShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="0.45"/>
      </filter>
    </defs>

    <g transform="translate(50, 36)" filter="url(#headerShadow)">
      <rect x="0" y="0" width="900" height="115" rx="20" fill="#18120e" fill-opacity="0.95" stroke="#dca672" stroke-width="2" />
      <text x="450" y="44" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" fill="#dca672" text-anchor="middle" letter-spacing="3.5">SHOP THE LOOK • ROOM #${roomNumber}</text>
      <text x="450" y="86" font-family="'Playfair Display', Georgia, serif" font-size="30" font-weight="bold" fill="#ffffff" text-anchor="middle">${escapeXml(title)} • ${escapeXml(totalPrice)}</text>
    </g>

    ${badgesSvg}

    <rect x="0" y="${PHOTO_HEIGHT}" width="${WIDTH}" height="${STRIP_HEIGHT}" fill="#fffaf5" />
    <line x1="0" y1="${PHOTO_HEIGHT}" x2="${WIDTH}" y2="${PHOTO_HEIGHT}" stroke="#e8c49e" stroke-width="2" />

    <text x="32" y="${PHOTO_HEIGHT + 38}" font-family="'Inter', sans-serif" font-size="15" font-weight="bold" fill="#6b3f28" letter-spacing="1">EXACT AMAZON FINDS IN THIS ROOM</text>
    <text x="${WIDTH - 32}" y="${PHOTO_HEIGHT + 38}" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#a35e30" text-anchor="end">🔗 Tap Pin for Direct Links</text>

    ${products.slice(0, maxProducts).map((p, i) => {
      const x = 32 + i * (cardWidth + cardGap);
      return `
        <g transform="translate(${x}, ${PHOTO_HEIGHT + 52})">
          <rect x="0" y="0" width="${cardWidth}" height="235" rx="14" fill="#ffffff" stroke="#e8c49e" stroke-width="1.2" />
        </g>
      `;
    }).join('\n')}
  </svg>
  `;

  const stripFgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${products.slice(0, maxProducts).map((p, i) => {
      const x = 32 + i * (cardWidth + cardGap);
      return `
        <g transform="translate(${x}, ${PHOTO_HEIGHT + 52})">
          <circle cx="24" cy="24" r="14" fill="#c37539" />
          <text x="24" y="29" font-family="'Inter', sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">${p.number}</text>

          <rect x="${cardWidth - 82}" y="12" width="72" height="24" rx="12" fill="#fdf8f3" stroke="#e8c49e" stroke-width="1" />
          <text x="${cardWidth - 46}" y="28" font-family="'Inter', sans-serif" font-size="12" font-weight="bold" fill="#834c2d" text-anchor="middle">${escapeXml(p.priceRange)}</text>

          <text x="12" y="195" font-family="'Inter', sans-serif" font-size="13" font-weight="bold" fill="#24170e">${escapeXml(p.name.slice(0, 18))}</text>
          <text x="12" y="216" font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="#c37539">Amazon Prime ★ ${p.rating}</text>
        </g>
      `;
    }).join('\n')}
  </svg>
  `;

  const productThumbOverlays = [];
  const thumbWidth = cardWidth - 36;
  for (let i = 0; i < maxProducts; i++) {
    const p = products[i];
    const cardX = 32 + i * (cardWidth + cardGap);
    const thumbX = cardX + 18;
    const thumbY = PHOTO_HEIGHT + 52 + 42;

    if (fs.existsSync(p.image)) {
      const thumbBuf = await sharp(p.image)
        .resize(thumbWidth, 130, { fit: 'contain', background: '#ffffff' })
        .toBuffer();
      productThumbOverlays.push({ input: thumbBuf, top: thumbY, left: thumbX });
    }
  }

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: '#fffaf5',
    },
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

  // Calibrated badge positions per room
  const badgeMap = {
    '01': [
      { number: 1, x: 410, y: 350 },
      { number: 2, x: 190, y: 340 },
      { number: 3, x: 620, y: 680 },
      { number: 4, x: 740, y: 730 },
      { number: 5, x: 880, y: 440 },
    ],
    '02': [
      { number: 1, x: 500, y: 620 }, // Navy Duvet
      { number: 2, x: 940, y: 480 }, // Black Lamp
      { number: 3, x: 180, y: 190 }, // Curtain Rod
      { number: 4, x: 280, y: 780 }, // Wool Rug
      { number: 5, x: 260, y: 380 }, // Linen Blackout Curtains
    ],
    '03': [
      { number: 1, x: 420, y: 740 }, // Boucle Chair
      { number: 2, x: 350, y: 280 }, // Arched Lamp
      { number: 3, x: 680, y: 680 }, // C-Table
      { number: 4, x: 230, y: 640 }, // Terracotta Blanket
      { number: 5, x: 580, y: 320 }, // Picture Ledges
    ],
    '04': [
      { number: 1, x: 480, y: 880 }, // Criss Cross Chair
      { number: 2, x: 500, y: 640 }, // Walnut Monitor Riser
      { number: 3, x: 800, y: 520 }, // Architect Lamp
      { number: 4, x: 480, y: 760 }, // Leather Desk Pad
      { number: 5, x: 220, y: 320 }, // Wire Wall Grid
    ],
    '05': [
      { number: 1, x: 590, y: 920 }, // Amber Soy Candle
      { number: 2, x: 300, y: 670 }, // Burnt Orange Throw
      { number: 3, x: 500, y: 1020 }, // Round Wood Coffee Table
      { number: 4, x: 470, y: 850 }, // LED Pillar Candles
      { number: 5, x: 340, y: 800 }, // Donut Vases
      { number: 6, x: 320, y: 620 }, // Pampas Grass
    ],
  };

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
      badges: badgeMap[roomNum] || [],
      outputPath: pinBDir,
    });
  }

  console.log('\nAll room pins generated successfully!');
}

main().catch(console.error);
