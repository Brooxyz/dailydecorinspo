import fs from 'fs';
import path from 'path';

// Load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

export function getPinterestConfig(useProduction = false) {
  const token = useProduction
    ? process.env.PINTEREST_ACCESS_TOKEN
    : (process.env.PINTEREST_SANDBOX_TOKEN || process.env.PINTEREST_ACCESS_TOKEN);

  const baseUrl = useProduction
    ? 'https://api.pinterest.com/v5'
    : 'https://api-sandbox.pinterest.com/v5';

  return { token, baseUrl };
}

export async function fetchUserAccount(useProduction = false) {
  const { token, baseUrl } = getPinterestConfig(useProduction);
  const res = await fetch(`${baseUrl}/user_account`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Pinterest Error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getBoards(useProduction = false) {
  const { token, baseUrl } = getPinterestConfig(useProduction);
  const res = await fetch(`${baseUrl}/boards`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Pinterest Error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.items || [];
}

export async function createBoard({ name, description, privacy = 'PUBLIC' }, useProduction = false) {
  const { token, baseUrl } = getPinterestConfig(useProduction);
  const res = await fetch(`${baseUrl}/boards`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description, privacy }),
  });
  if (!res.ok) throw new Error(`Pinterest Error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function createPin({
  boardId,
  title,
  description,
  link,
  imageFilePath,
}, useProduction = false) {
  const { token, baseUrl } = getPinterestConfig(useProduction);

  if (!fs.existsSync(imageFilePath)) {
    throw new Error(`Image file not found at: ${imageFilePath}`);
  }

  const imageBuffer = fs.readFileSync(imageFilePath);
  const base64Data = imageBuffer.toString('base64');
  const ext = path.extname(imageFilePath).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const body = {
    board_id: boardId,
    title,
    description,
    link,
    media_source: {
      source_type: 'image_base64',
      content_type: contentType,
      data: base64Data,
    },
  };

  const res = await fetch(`${baseUrl}/pins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Pinterest API Pin Error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}
