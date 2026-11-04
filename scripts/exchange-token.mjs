import fs from 'fs';
import path from 'path';

// Parse code from arg: node scripts/exchange-token.mjs --code=...
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [k, v] = arg.slice(2).split('=');
    acc[k] = v || true;
  }
  return acc;
}, {});

const authCode = args.code;
if (!authCode) {
  console.error('Usage: node scripts/exchange-token.mjs --code=YOUR_AUTH_CODE');
  process.exit(1);
}

// Clean code if user pasted full URL
let cleanCode = authCode;
if (authCode.includes('code=')) {
  const match = authCode.match(/code=([^&]+)/);
  if (match) cleanCode = decodeURIComponent(match[1]);
}

async function exchange() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const clientId = '1634467';
  const clientSecret = '86dc97ba716361dc16be55e613aff15de85cc604';
  const redirectUri = 'https://dailydecorinspo.vercel.app/';

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', cleanCode);
  params.append('redirect_uri', redirectUri);

  console.log('Exchanging authorization code for full write access token...');

  const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Exchange failed:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('✓ Success! Received Token with Scopes:', data.scope);
  console.log('Access Token:', data.access_token);

  // Update .env.local
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /PINTEREST_ACCESS_TOKEN=.*/,
    `PINTEREST_ACCESS_TOKEN=${data.access_token}`
  );
  if (data.refresh_token) {
    if (envContent.includes('PINTEREST_REFRESH_TOKEN=')) {
      envContent = envContent.replace(
        /PINTEREST_REFRESH_TOKEN=.*/,
        `PINTEREST_REFRESH_TOKEN=${data.refresh_token}`
      );
    } else {
      envContent += `\nPINTEREST_REFRESH_TOKEN=${data.refresh_token}\n`;
    }
  }
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✓ Updated .env.local with permanent write-enabled token!');
}

exchange().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
