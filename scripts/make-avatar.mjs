// Pinterest profile picture in the site's palette and type (Fraunces), safe inside the circle crop.
// usage: node scripts/make-avatar.mjs <out.png> [--icons]   (--icons also writes the site/app icons)
import sharp from 'sharp';
import { text } from './pin-text.mjs';

const out = process.argv[2] || 'avatar.png';
const ICONS = process.argv.includes('--icons');
const S = 800;
const svg = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${S}" height="${S}" fill="#faf6f0"/>
  <circle cx="${S / 2}" cy="${S / 2}" r="${S / 2 - 46}" fill="none" stroke="#7a4a2b" stroke-width="10"/>
  <path d="M ${S / 2 - 175} ${S / 2 + 230} L ${S / 2 - 175} ${S / 2 - 55} A 175 175 0 0 1 ${S / 2 + 175} ${S / 2 - 55} L ${S / 2 + 175} ${S / 2 + 230} Z" fill="#7a4a2b"/>
  ${text('DDI', { font: 'display', size: 170, x: S / 2, y: S / 2 + 120, anchor: 'middle', fill: '#faf6f0' })}
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('wrote', out);

if (ICONS) {
  // App / favicon icons: same arch + DDI on linen, without the ring (the OS adds its own shape)
  const plain = Buffer.from(svg.replace(/<circle[^>]*\/>/, ''));
  const targets = [['src/app/icon.png', 512], ['src/app/apple-icon.png', 180], ['public/icons/icon-192.png', 192], ['public/icons/icon-512.png', 512]];
  const fs = await import('fs');
  fs.mkdirSync('public/icons', { recursive: true });
  for (const [file, size] of targets) {
    await sharp(plain).resize(size, size).png().toFile(file);
    console.log('wrote', file);
  }
}
