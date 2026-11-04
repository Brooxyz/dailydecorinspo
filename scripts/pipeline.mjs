import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getBoards, createPin } from './pinterest-api.mjs';

const command = process.argv[2] || 'help';

const args = process.argv.slice(3).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [k, v] = arg.slice(2).split('=');
    acc[k] = v || true;
  }
  return acc;
}, {});

const root = process.cwd();
const roomsPath = path.join(root, 'src/data/rooms.json');

function getRoomsData() {
  return JSON.parse(fs.readFileSync(roomsPath, 'utf8'));
}

async function listRooms() {
  const data = getRoomsData();
  console.log('\n🏠 Daily Decor Inspo — Master Rooms Catalog');
  console.log('='.repeat(55));

  data.rooms.forEach((room, i) => {
    const num = String(i + 1).padStart(2, '0');
    const pinAExists = fs.existsSync(path.join(root, `public/images/pins/room-${num}-aesthetic.jpg`));
    const pinBExists = fs.existsSync(path.join(root, `public/images/pins/room-${num}-catalog.jpg`));
    console.log(`\n[Room #${num}] ${room.title}`);
    console.log(`  - Category:    ${room.category}`);
    console.log(`  - Total Price: ${room.totalPrice}`);
    console.log(`  - Products:    ${room.products.length} items`);
    console.log(`  - Live URL:    https://dailydecorinspo.vercel.app/room/${room.slug}/`);
    console.log(`  - Pin A:       ${pinAExists ? '✓ Ready' : '✗ Missing'}`);
    console.log(`  - Pin B:       ${pinBExists ? '✓ Ready' : '✗ Missing'}`);
  });
  console.log('\n');
}

async function buildAll() {
  console.log('\n1. Generating Pin graphics with sharp...');
  execSync('node scripts/generate-pins.mjs', { stdio: 'inherit' });

  console.log('\n2. Building static Next.js export...');
  execSync('cmd /c "npx next build"', { stdio: 'inherit' });

  console.log('\n✓ Build and Pin generation complete!');
}

async function postPin() {
  const roomNum = args.room || '01';
  const type = (args.type || 'A').toUpperCase();
  const env = args.env || 'sandbox';

  console.log(`\nPosting Room #${roomNum} (${type}) to Pinterest [${env}]...`);
  execSync(`node scripts/publish-pin.mjs --room=${roomNum} --type=${type} --env=${env}`, {
    stdio: 'inherit',
  });
}

async function main() {
  switch (command) {
    case 'list':
      await listRooms();
      break;
    case 'build':
      await buildAll();
      break;
    case 'post':
      await postPin();
      break;
    default:
      console.log(`
Daily Decor Inspo — Automation Pipeline CLI

Usage:
  node scripts/pipeline.mjs list                       List all rooms and pin asset status
  node scripts/pipeline.mjs build                      Regenerate pins & rebuild static storefront
  node scripts/pipeline.mjs post --room=01 --type=A    Post Pin A for Room 01 (sandbox)
  node scripts/pipeline.mjs post --room=02 --type=B --env=production  Post Pin B (production)
      `);
      break;
  }
}

main().catch(console.error);
