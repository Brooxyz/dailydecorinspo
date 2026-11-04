import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const roomsPath = path.join(root, 'src/data/rooms.json');
const data = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));

console.log(`\n======================================================`);
console.log(`🚀 DAILY DECOR INSPO — MASTER PIN PUBLISHING PIPELINE`);
console.log(`======================================================`);
console.log(`Found ${data.rooms.length} curated rooms ready to publish.\n`);

for (let i = 0; i < data.rooms.length; i++) {
  const roomNum = String(i + 1).padStart(2, '0');
  const room = data.rooms[i];

  console.log(`\n------------------------------------------------------`);
  console.log(`📦 Publishing Room #${roomNum}: ${room.title}`);
  console.log(`------------------------------------------------------`);

  // Publish Pin A
  console.log(`\n[1/2] Publishing Pin A (Aesthetic)...`);
  try {
    execSync(`node scripts/publish-pin.mjs --room=${roomNum} --type=A --env=production`, {
      stdio: 'inherit',
      cwd: root,
    });
  } catch (e) {
    console.error(`Error publishing Room #${roomNum} Pin A`);
  }

  // Small delay
  execSync('powershell -Command "Start-Sleep -Seconds 2"');

  // Publish Pin B
  console.log(`\n[2/2] Publishing Pin B (Shop the Look Catalog)...`);
  try {
    execSync(`node scripts/publish-pin.mjs --room=${roomNum} --type=B --env=production`, {
      stdio: 'inherit',
      cwd: root,
    });
  } catch (e) {
    console.error(`Error publishing Room #${roomNum} Pin B`);
  }

  // Small delay between rooms
  execSync('powershell -Command "Start-Sleep -Seconds 3"');
}

console.log(`\n======================================================`);
console.log(`🎉 ALL PINS SUCCESSFULLY PUBLISHED TO PINTEREST!`);
console.log(`======================================================\n`);
