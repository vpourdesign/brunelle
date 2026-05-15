// Télécharge le zip Centris du jour depuis DriveHQ (WebDAV) + extrait dans _centris/
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const USER = process.env.DRIVEHQ_USER;
const PASS = process.env.DRIVEHQ_PASS;
const BASE = process.env.DRIVEHQ_WEBDAV_URL;
if (!USER || !PASS || !BASE) {
  console.error('Missing DRIVEHQ_USER / DRIVEHQ_PASS / DRIVEHQ_WEBDAV_URL');
  process.exit(1);
}

// Nom du zip du jour (America/Toronto → YYYYMMDD)
const now = new Date();
const tz = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
const yyyymmdd = `${tz.getFullYear()}${String(tz.getMonth()+1).padStart(2,'0')}${String(tz.getDate()).padStart(2,'0')}`;
const fileName = `VPOURDESIGN${yyyymmdd}.zip`;
const url = BASE.replace(/\/$/, '') + '/' + fileName;
const tmp = path.join(process.cwd(), '_tmp.zip');

console.log(`Fetching ${url} …`);
try {
  execSync(`curl -fsSL --user "${USER}:${PASS}" -o "${tmp}" "${url}"`, { stdio: 'inherit' });
} catch (e) {
  // Fallback : zip de la veille (si le dépôt DriveHQ a du retard)
  const y = new Date(tz); y.setDate(y.getDate()-1);
  const yyyymmdd2 = `${y.getFullYear()}${String(y.getMonth()+1).padStart(2,'0')}${String(y.getDate()).padStart(2,'0')}`;
  const fallback = BASE.replace(/\/$/, '') + '/' + `VPOURDESIGN${yyyymmdd2}.zip`;
  console.log(`Today's zip missing, trying ${fallback} …`);
  execSync(`curl -fsSL --user "${USER}:${PASS}" -o "${tmp}" "${fallback}"`, { stdio: 'inherit' });
}

// Extract
fs.rmSync('_centris', { recursive: true, force: true });
fs.mkdirSync('_centris', { recursive: true });
execSync(`unzip -q -o "${tmp}" -d _centris`, { stdio: 'inherit' });
fs.unlinkSync(tmp);

console.log('Centris zip extracted into _centris/');
