import fs from 'fs';
import path from 'path';
import { getBoards, createBoard, createPin } from './pinterest-api.mjs';

// Parse CLI args
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [k, v] = arg.slice(2).split('=');
    acc[k] = v || true;
  }
  return acc;
}, {});

const roomArg = args.room || '01'; // '01', '02', etc.
const typeArg = (args.type || 'A').toUpperCase(); // 'A' or 'B'
const isProd = args.env === 'production';

async function main() {
  const root = process.cwd();
  const roomsPath = path.join(root, 'src/data/rooms.json');
  const data = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));

  const roomIndex = parseInt(roomArg, 10) - 1;
  const room = data.rooms[roomIndex];
  if (!room) {
    console.error(`Room #${roomArg} not found in rooms.json!`);
    process.exit(1);
  }

  const roomNum = String(roomIndex + 1).padStart(2, '0');
  const envLabel = isProd ? 'PRODUCTION' : 'SANDBOX';
  console.log(`\n🚀 Publishing Room #${roomNum} (${typeArg}) to Pinterest [${envLabel}]...`);

  // Target board name based on category
  const boardName = room.category === 'bedroom' ? 'Cozy Bedroom Inspo' : 'Home Decor Ideas';

  console.log(`Checking boards for: "${boardName}"...`);
  let boards = await getBoards(isProd);
  let board = boards.find(b => b.name.toLowerCase() === boardName.toLowerCase());

  if (!board) {
    console.log(`Board "${boardName}" not found. Creating it now...`);
    board = await createBoard(
      {
        name: boardName,
        description: 'Curated aesthetic home decor concepts and budget Amazon finds.',
        privacy: 'PUBLIC',
      },
      isProd
    );
    console.log(`✓ Board created with ID: ${board.id}`);
  } else {
    console.log(`✓ Using existing board: ${board.name} (${board.id})`);
  }

  // Format destination link
  const link = `https://dailydecorinspo.vercel.app/room/${room.slug}/`;

  // Select image & metadata based on Pin A or Pin B
  let imageFile = '';
  let title = '';
  let description = '';

  if (typeArg === 'A') {
    imageFile = path.join(root, `public/images/pins/room-${roomNum}-aesthetic.jpg`);
    title = `${room.title} Ideas on a Budget (Amazon Finds)`;
    description = `Curated Room #${roomNum}: ${room.title} styled with budget-friendly Amazon finds. ${room.subtitle}.\n\n✨ Tap to explore the shoppable room and see exact product links!\n\n#amazonfinds #bedroomdecor #cozyroom #budgetdecor #homedecorideas #aesthetic #interiordesign\n\n#ad As an Amazon Associate, I earn from qualifying purchases.`;
  } else {
    imageFile = path.join(root, `public/images/pins/room-${roomNum}-catalog.jpg`);
    title = `Shop the Look: ${room.products.length} Amazon Finds for a ${room.title} (${room.totalPrice})`;
    const productList = room.products
      .slice(0, 5)
      .map(p => `${p.number}. ${p.name}`)
      .join('\n');
    description = `Shop the Look Room #${roomNum}! Every numbered item is curated from Amazon with 4.3+ star ratings:\n\n${productList}\n\n👉 Tap the pin to get direct Amazon links & real-time prices!\n\n#shopthelook #amazonhome #bedroommakeover #affiliate #budgetfinds #roomdecor\n\n#ad As an Amazon Associate, I earn from qualifying purchases.`;
  }

  if (!fs.existsSync(imageFile)) {
    console.error(`Pin image does not exist: ${imageFile}`);
    console.log(`Run 'node scripts/generate-pins.mjs' first to generate graphics.`);
    process.exit(1);
  }

  console.log(`Uploading pin image: ${path.basename(imageFile)}...`);
  const pinResult = await createPin(
    {
      boardId: board.id,
      title,
      description,
      link,
      imageFilePath: imageFile,
    },
    isProd
  );

  console.log(`\n🎉 Pin successfully published to Pinterest!`);
  console.log(`- Pin ID: ${pinResult.id}`);
  console.log(`- Title: ${pinResult.title}`);
  console.log(`- Link: ${pinResult.link}`);
  if (pinResult.media && pinResult.media.images) {
    console.log(`- Pinterest CDN Image: ${pinResult.media.images['1200x']?.url || pinResult.media.images['600x']?.url}`);
  }
}

main().catch(err => {
  console.error('Failed to publish pin:', err.message);
  process.exit(1);
});
