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

// Construit YYYYMMDD pour un Date donné dans le fuseau America/Toronto
function ymd(d) {
  const t = new Date(d.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  return `${t.getFullYear()}${String(t.getMonth()+1).padStart(2,'0')}${String(t.getDate()).padStart(2,'0')}`;
}

const baseUrl = BASE.replace(/\/$/, '');
const tmp = path.join(process.cwd(), '_tmp.zip');

// Essaie le zip du jour, puis recule jour par jour jusqu'à 14 jours en arrière.
const MAX_DAYS_BACK = 14;
let fetched = false;
const now = new Date();

for (let offset = 0; offset <= MAX_DAYS_BACK; offset++) {
  const d = new Date(now.getTime() - offset * 86400000);
  const fileName = `VPOURDESIGN${ymd(d)}.zip`;
  const url = `${baseUrl}/${fileName}`;
  process.stdout.write(`Trying ${fileName} … `);
  try {
    execSync(`curl -fsSL --user "${USER}:${PASS}" -o "${tmp}" "${url}"`, { stdio: 'pipe' });
    console.log(`✓ téléchargé (offset J-${offset})`);
    fetched = true;
    break;
  } catch {
    console.log('× non disponible');
  }
}

if (!fetched) {
  console.error(`Aucun zip VPOURDESIGN*.zip trouvé dans les ${MAX_DAYS_BACK} derniers jours.`);
  process.exit(1);
}

// Extract
fs.rmSync('_centris', { recursive: true, force: true });
fs.mkdirSync('_centris', { recursive: true });
execSync(`unzip -q -o "${tmp}" -d _centris`, { stdio: 'inherit' });
fs.unlinkSync(tmp);

console.log('Centris zip extracted into _centris/');
