#!/usr/bin/env node
/**
 * seo-snapshot.mjs — Tire les données réelles Google (Search Console + Analytics 4)
 * et les injecte dans 06_livrables/seo-dashboard.html (bloc JSON #seo-data).
 *
 * 100 % gratuit : API officielles Google via un compte de service (aucun abonnement).
 * Aucune dépendance npm — Node 18+ seulement.
 *
 * Usage :   node scripts/seo-snapshot.mjs
 * Config :  .env.local (voir scripts/README-seo-snapshot.md pour la mise en place)
 *   GOOGLE_SA_KEY=.secrets/google-service-account.json   (chemin de la clé JSON)
 *   GSC_SITE_URL=sc-domain:alainbrunelle.com             (ou https://alainbrunelle.com/)
 *   GA_PROPERTY_ID=123456789                             (optionnel — GA4, ID numérique)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DASHBOARD = path.join(ROOT, '06_livrables', 'seo-dashboard.html');
const PULLS_DIR = path.join(ROOT, 'data', 'seo-pulls');

// ---------- config (.env.local) ----------
const env = {};
const envFile = path.join(ROOT, '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2];
  }
}
const SA_KEY_PATH = path.resolve(ROOT, env.GOOGLE_SA_KEY || '.secrets/google-service-account.json');
const GSC_SITE = env.GSC_SITE_URL || 'sc-domain:alainbrunelle.com';
const GA_PROPERTY = env.GA_PROPERTY_ID || null;

if (!fs.existsSync(SA_KEY_PATH)) {
  console.error(`✗ Clé de compte de service introuvable : ${SA_KEY_PATH}
  → Suis les étapes de scripts/README-seo-snapshot.md (10 min, une seule fois),
    dépose la clé JSON à cet endroit, puis relance :  node scripts/seo-snapshot.mjs`);
  process.exit(1);
}
const SA = JSON.parse(fs.readFileSync(SA_KEY_PATH, 'utf8'));

// ---------- auth : JWT signé → access token ----------
async function accessToken(scopes) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: SA.client_email, scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
  })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(SA.private_key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${sig}`
    })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Auth Google refusée : ' + JSON.stringify(data));
  return data.access_token;
}

async function api(url, token, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.error) throw new Error(`${url}\n  → ${data.error.code} ${data.error.message}`);
  return data;
}

// ---------- dates : 28 jours, finissant il y a 3 jours (délai GSC) ----------
const d = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
const START = d(-31), END = d(-3), TODAY = d(0);

// ---------- main ----------
const token = await accessToken([
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly'
]);
const gscUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`;

console.log(`Recherche Search Console : ${GSC_SITE} · ${START} → ${END}`);

// 1. totaux
const totals = await api(gscUrl, token, { startDate: START, endDate: END, dimensions: [] });
const tot = totals.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };

// 2. top requêtes
const topQ = await api(gscUrl, token, { startDate: START, endDate: END, dimensions: ['query'], rowLimit: 25 });

// 3. position réelle sur les requêtes suivies du dashboard
const html = fs.readFileSync(DASHBOARD, 'utf8');
const jsonMatch = html.match(/<script type="application\/json" id="seo-data">([\s\S]*?)<\/script>/);
if (!jsonMatch) { console.error('✗ Bloc #seo-data introuvable dans le dashboard'); process.exit(1); }
const DATA = JSON.parse(jsonMatch[1]);
const tracked = {};
for (const q of DATA.queries.filter(q => !q.excluded)) {
  const r = await api(gscUrl, token, {
    startDate: START, endDate: END, dimensions: ['query'],
    dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'equals', expression: q.q.toLowerCase() }] }]
  });
  const row = r.rows?.[0];
  tracked[q.id] = row
    ? { clicks: row.clicks, impressions: row.impressions, position: Math.round(row.position * 10) / 10 }
    : null;
}

// 4. GA4 (optionnel)
let ga = null;
if (GA_PROPERTY) {
  const rep = await api(`https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY}:runReport`, token, {
    dateRanges: [{ startDate: START, endDate: END }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }]
  });
  const v = rep.rows?.[0]?.metricValues?.map(m => Number(m.value)) ?? [0, 0, 0];
  ga = { sessions: v[0], users: v[1], pageviews: v[2] };
}

// ---------- injection dans le dashboard ----------
const gsc = {
  period: `${START} → ${END}`,
  clicks: tot.clicks, impressions: tot.impressions,
  ctr: Math.round(tot.ctr * 1000) / 10, position: Math.round(tot.position * 10) / 10,
  top_queries: (topQ.rows ?? []).map(r => ({
    q: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: Math.round(r.position * 10) / 10
  })),
  tracked, ga
};

const prev = DATA.snapshots[DATA.snapshots.length - 1];
if (prev.date === TODAY) {
  prev.gsc = gsc; // même jour : on met à jour
} else {
  DATA.snapshots.push({
    date: TODAY, label: 'Pull GSC automatique',
    serp: prev.serp, scores: prev.scores, serp_carried: true, // SERP re-vérifié manuellement via Claude
    gsc
  });
}
DATA.meta.gsc_connected = true;
DATA.meta.ga_connected = !!ga;

fs.writeFileSync(DASHBOARD, html.replace(jsonMatch[0],
  `<script type="application/json" id="seo-data">\n${JSON.stringify(DATA, null, 2)}\n</script>`));

fs.mkdirSync(PULLS_DIR, { recursive: true });
fs.writeFileSync(path.join(PULLS_DIR, `${TODAY}.json`), JSON.stringify(gsc, null, 2));

console.log(`✓ ${tot.clicks} clics · ${tot.impressions} impressions · position moyenne ${gsc.position}`);
console.log(`✓ Top requêtes : ${gsc.top_queries.slice(0, 5).map(r => r.q).join(' · ') || '(aucune encore — site neuf, ça vient)'}`);
if (ga) console.log(`✓ GA4 : ${ga.sessions} sessions · ${ga.users} utilisateurs`);
console.log(`✓ Dashboard mis à jour : 06_livrables/seo-dashboard.html · brut : data/seo-pulls/${TODAY}.json`);
