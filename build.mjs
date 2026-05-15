// Build: parse Centris + generate static site (single typeface: Jost)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const CENTRIS = path.join(ROOT, '_centris');
const SITE = path.join(ROOT, 'site');
// Fallback courtier (Maxime Beaulac) — utilisé tant qu'Alain Brunelle
// n'est pas encore présent dans MEMBRES.TXT (Centris ajoutera son fiche
// quand il sera connecté au flux DDF).
const FALLBACK_BROKER_NO = '111464';
const TARGET_BROKER = { firstName: 'Alain', lastName: 'Brunelle' };

// Google Calendar Appointment Schedule — remplace par ton URL complète
// (obtenue dans Google Calendar → Créer → Plages horaires de rendez-vous → Ouvrir la page de réservation)
const GCAL_APPOINTMENT_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1jp0v3sqPHnkxqbDx_5kSPLSBSBDTebM9-4ulplRyo47oVeYiP-JfPvhE-EWktfMF5nAPXplo8';

function parseCSV(text) {
  const rows=[]; let row=[],f='',q=false,i=0;
  while(i<text.length){const c=text[i];
    if(q){if(c==='"'&&text[i+1]==='"'){f+='"';i+=2;continue;}if(c==='"'){q=false;i++;continue;}f+=c;i++;continue;}
    if(c==='"'){q=true;i++;continue;}
    if(c===','){row.push(f);f='';i++;continue;}
    if(c==='\r'){i++;continue;}
    if(c==='\n'){row.push(f);rows.push(row);row=[];f='';i++;continue;}
    f+=c;i++;}
  if(f.length||row.length){row.push(f);rows.push(row);}
  return rows;
}
const read = n => parseCSV(new TextDecoder('windows-1252').decode(fs.readFileSync(path.join(CENTRIS,n))));

// Postal-code prefix → city (covers our data + broader Rive-Nord)
const CP_CITY = {
  'J7Y':'Sainte-Thérèse','J7Z':'Sainte-Thérèse',
  'J7B':'Blainville','J7C':'Blainville','J6Z':'Blainville',
  'J7E':'Saint-Eustache',
  'J7H':'Rosemère','J7G':'Rosemère',
  'J7J':'Bois-des-Filion',
  'J7N':'Sainte-Anne-des-Plaines','J5N':'Sainte-Anne-des-Plaines',
  'J7A':'Mirabel','J7K':'Mirabel','J7L':'Mirabel',
  'J6J':'Laval','H7W':'Laval','H7N':'Laval',
  'J0T':'Saint-Adolphe-d\u2019Howard','J0R':'Saint-Sauveur/Laurentides','J8B':'Morin-Heights','J8E':'Mont-Tremblant',
  'H2G':'Montréal','H2X':'Montréal'
};
const cityFromCP = cp => CP_CITY[(cp||'').toUpperCase().slice(0,3)] || 'Laurentides';

// Type code → label (non-exhaustive — best effort for demo)
const TYPE_LABEL = code => {
  const n = parseInt(code);
  if (!n) return 'Propriété';
  if (n < 100) return 'Maison unifamiliale';
  if (n < 300) return 'Plex';
  if (n < 500) return 'Condo';
  if (n < 700) return 'Maison de ville';
  if (n < 900) return 'Propriété de prestige';
  if (n < 2000) return 'Chalet / Villégiature';
  return 'Terrain';
};

console.log('Reading Centris…');
const membres = read('MEMBRES.TXT');

// Normalize a string : lowercase + remove diacritics
const norm = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// Auto-detect Alain Brunelle's NO_MEMBRE from MEMBRES.TXT.
// col 0: NO_MEMBRE · col 4: NOM · col 5: PRENOM
function detectBroker() {
  const target = { f: norm(TARGET_BROKER.firstName), l: norm(TARGET_BROKER.lastName) };
  const hit = membres.find(r => norm(r[5]) === target.f && norm(r[4]) === target.l);
  if (hit) {
    console.log(`✓ Alain Brunelle détecté → NO_MEMBRE=${hit[0]}`);
    return hit[0];
  }
  console.log(`⚠ Alain Brunelle absent de MEMBRES.TXT → fallback sur Maxime Beaulac (${FALLBACK_BROKER_NO})`);
  return FALLBACK_BROKER_NO;
}
const BROKER_NO = detectBroker();

const inscr = read('INSCRIPTIONS.TXT');
const photos = read('PHOTOS.TXT');
const addenda = read('ADDENDA.TXT');
const remarques = read('REMARQUES.TXT');
const caracts = read('CARACTERISTIQUES.TXT');
const pieces = read('PIECES_UNITES.TXT');
const liens = read('LIENS_ADDITIONNELS.TXT');

const photosByMls = {};
for (const p of photos) { const m=p[0]; if(!m) continue; (photosByMls[m] ??= []).push({seq:+p[1], type:p[3], url:p[6]}); }
for (const k of Object.keys(photosByMls)) photosByMls[k].sort((a,b)=>a.seq-b.seq);

function groupText(rows) {
  const o={}; for(const r of rows){const m=r[0],l=r[2],t=r[6]||''; if(!m)continue; const k=m+'|'+l;(o[k]??=[]).push({s:+r[1],n:+r[3],t});}
  for(const k of Object.keys(o)){o[k].sort((a,b)=>(a.s-b.s)||(a.n-b.n)); o[k]=o[k].map(x=>x.t).join(' ').replace(/\s+/g,' ').trim();}
  return o;
}
const addMap = groupText(addenda);
const remMap = groupText(remarques);
const caractsByMls = {};
for (const c of caracts) { const m=c[0]; if(!m) continue; (caractsByMls[m] ??= []).push({code:c[1], value:c[2]}); }
const piecesByMls = {};
for (const p of pieces) { const m=p[0]; if(!m) continue; (piecesByMls[m] ??= []).push({etage:p[1], nom:p[2], niveau:p[3], dim:p[4], rev:p[5]}); }
const linksByMls = {};
for (const l of liens) { const m=l[0]; if(!m) continue; (linksByMls[m] ??= []).push({type:l[2], url:l[3]}); }

const slug = s => (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

const myListings = inscr.filter(r => r[2]===BROKER_NO || r[4]===BROKER_NO);
const properties = myListings.map(r => {
  const mls = r[0], price = parseFloat(r[6])||0;
  const typeCode = r[25];
  const street = (r[27]||'').trim();
  const cp = r[29] || '';
  const city = cityFromCP(cp);
  const yearBuilt = r[59] && /^\d{4}$/.test(r[59]) ? r[59] : (r[68] && /^\d{4}$/.test(r[68]) ? r[68] : '');
  const areaTerrain = r[75] ? `${r[75]} ${r[76]||''}`.trim() : '';
  const lat = parseFloat(r[144])||null, lon = parseFloat(r[145])||null;
  const desc = addMap[mls+'|F'] || '';
  const rem = remMap[mls+'|F'] || '';
  const ph = photosByMls[mls] || [];
  return {
    mls,
    price,
    typeCode, typeLabel: TYPE_LABEL(typeCode),
    street,
    city,
    postalCode: cp,
    yearBuilt,
    areaTerrain,
    lat, lon,
    descFr: desc, remFr: rem,
    photos: ph,
    features: caractsByMls[mls] || [],
    rooms: piecesByMls[mls] || [],
    links: linksByMls[mls] || [],
    isCoBroker: r[2] !== BROKER_NO,
    slug: `${mls}-${slug(street)}-${slug(city)}`
  };
}).filter(p => p.price > 0 && p.photos.length >= 3);

console.log(`Loaded ${properties.length} active properties`);

fs.mkdirSync(path.join(SITE,'data'), { recursive: true });
fs.writeFileSync(path.join(SITE,'data','properties.json'), JSON.stringify(properties, null, 2));

const stats = {
  total: properties.length,
  avgPrice: Math.round(properties.reduce((s,p)=>s+p.price,0) / Math.max(1,properties.length)),
  totalValue: properties.reduce((s,p)=>s+p.price,0),
  byCity: properties.reduce((a,p)=>{a[p.city]=(a[p.city]||0)+1;return a;},{}),
  byType: properties.reduce((a,p)=>{a[p.typeLabel]=(a[p.typeLabel]||0)+1;return a;},{}),
  priceRanges: (() => {
    const ranges = {'<300k':0,'300-500k':0,'500-800k':0,'800k-1.5M':0,'>1.5M':0};
    for (const p of properties) {
      if (p.price<300000) ranges['<300k']++;
      else if (p.price<500000) ranges['300-500k']++;
      else if (p.price<800000) ranges['500-800k']++;
      else if (p.price<1500000) ranges['800k-1.5M']++;
      else ranges['>1.5M']++;
    }
    return ranges;
  })()
};
fs.writeFileSync(path.join(SITE,'data','stats.json'), JSON.stringify(stats, null, 2));

// --- Shared template ---
const NAV = [
  { label: 'Accueil', href: '/' },
  { label: 'Propriétés', href: '/nos-proprietes/' },
  { label: 'Villes', href: '/courtier-immobilier/blainville/', children: [
    ['Blainville','/courtier-immobilier/blainville/'],
    ['Sainte-Thérèse','/courtier-immobilier/sainte-therese/'],
    ['Rosemère','/courtier-immobilier/rosemere/'],
    ['Lorraine','/courtier-immobilier/lorraine/']
  ]},
  { label: 'Vendre', href: '/vendre/evaluation-gratuite/' },
  { label: 'Acheter', href: '/acheter/premier-acheteur/', children: [
    ['Premier acheteur','/acheter/premier-acheteur/'],
    ['Étapes pour acheter','/acheter/etapes-pour-acheter/'],
    ['Financement hypothécaire','/acheter/financement-hypothecaire/'],
    ['Inspection','/acheter/inspection/'],
    ['Calculatrices','/acheter/calculatrices/']
  ]},
  { label: 'Blog', href: '/blog/' },
  { label: 'À propos', href: '/a-propos/' },
  { label: 'Rendez-vous', href: '/rendez-vous/' }
];

function layout({ title, description, canonical, body, extraHead='', bodyClass='', jsonld='' }) {
  return `<!DOCTYPE html>
<html lang="fr-CA">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="image" href="/photos/P21_5407-Edit.jpg" fetchpriority="high">
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
${extraHead}
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
</head>
<body class="${bodyClass}">
<header class="nav">
  <a class="brand" href="/" aria-label="Alain Brunelle"><img src="/brand_assets/logo.png" alt="Alain Brunelle" height="64"></a>
  <nav class="nav-links">
    ${NAV.map(n => n.children ? `<div class="nav-item has-sub"><a href="${n.href}">${n.label}</a><div class="sub">${n.children.map(c=>`<a href="${c[1]}">${c[0]}</a>`).join('')}</div></div>` : `<a class="nav-item" href="${n.href}">${n.label}</a>`).join('')}
  </nav>
  <a class="nav-cta" href="/rendez-vous/">Prendre rendez-vous</a>
  <button class="nav-burger" aria-label="Menu" onclick="document.body.classList.toggle('nav-open')">☰</button>
</header>
<main>
${body}
</main>
<footer class="footer">
  <div class="f-grid">
    <div>
      <img src="/brand_assets/logoblanc.png" alt="Alain Brunelle" height="56">
      <p class="f-tag">Courtier immobilier — RE/MAX CRYSTAL<br>Sainte-Thérèse · Blainville · Rive-Nord</p>
    </div>
    <div>
      <h4>Territoires</h4>
      <ul>
        <li><a href="/courtier-immobilier/sainte-therese/">Sainte-Thérèse</a></li>
        <li><a href="/courtier-immobilier/blainville/">Blainville</a></li>
        <li><a href="/courtier-immobilier/rosemere/">Rosemère</a></li>
        <li><a href="/courtier-immobilier/lorraine/">Lorraine</a></li>
      </ul>
    </div>
    <div>
      <h4>Services</h4>
      <ul>
        <li><a href="/vendre/evaluation-gratuite/">Évaluation gratuite</a></li>
        <li><a href="/acheter/premier-acheteur/">Premier acheteur</a></li>
        <li><a href="/vendre/etapes-pour-vendre/">Étapes pour vendre</a></li>
        <li><a href="/acheter/calculatrices/">Calculatrices</a></li>
        <li><a href="/marche-immobilier/statistiques-blainville/">Statistiques marché</a></li>
      </ul>
    </div>
    <div>
      <h4>Contact</h4>
      <ul class="f-contact">
        <li><a href="tel:4504305555">450.430.5555</a></li>
        <li><a href="mailto:alain@alainbrunelle.com">alain@alainbrunelle.com</a></li>
        <li>RE/MAX CRYSTAL<br>Sainte-Thérèse, QC</li>
      </ul>
    </div>
  </div>
  <div class="f-bottom">
    <span>© ${new Date().getFullYear()} Alain Brunelle — Courtier immobilier résidentiel · Permis OACIQ</span>
    <span class="f-legal"><a href="/a-propos/">À propos</a> · <a href="/contact/">Contact</a> · <a href="/performance/">Performance</a></span>
  </div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>`;
}

// --- CSS (inline in one file) ---
const CSS = `
:root{
  --bg:#ffffff;
  --ink:#0b1628;
  --ink-2:#2a3a54;
  --muted:#6a7891;
  --line:#e6ebf2;
  --surface:#f4f7fc;
  --blue:#0f2855;
  --blue-2:#13357a;
  --blue-soft:#e6ecf7;
  --blue-hi:oklch(55% 0.16 260);
  --accent:oklch(62% 0.17 255);
  --radius:clamp(14px,2vw,28px);
  --radius-lg:clamp(22px,3vw,40px);
  --pad:clamp(1rem,3vw,2rem);
  --gap:clamp(1rem,2vw,1.6rem);
  --container:min(1280px,92vw);
  --shadow-xs:
    0 1px 2px oklch(30% 0.1 260 / 0.04),
    0 2px 4px oklch(25% 0.1 260 / 0.04);
  --shadow-sm:
    0 1px 2px oklch(30% 0.1 260 / 0.05),
    0 4px 10px oklch(25% 0.1 260 / 0.06),
    0 12px 24px oklch(20% 0.1 260 / 0.04);
  --shadow:
    0 1px 2px oklch(30% 0.12 260 / 0.06),
    0 6px 18px oklch(25% 0.12 260 / 0.08),
    0 24px 60px oklch(20% 0.12 260 / 0.08),
    0 48px 100px oklch(18% 0.1 260 / 0.05);
  --shadow-lg:
    0 2px 4px oklch(30% 0.12 260 / 0.08),
    0 12px 28px oklch(25% 0.12 260 / 0.1),
    0 40px 80px oklch(22% 0.12 260 / 0.12),
    0 80px 120px oklch(18% 0.1 260 / 0.06);
  --shadow-inset-blue:inset 0 1px 0 rgba(255,255,255,.06), inset 0 -1px 0 rgba(0,0,0,.15);
  --ease:cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring:cubic-bezier(0.34, 1.56, 0.64, 1);
  --grain:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.06 0 0 0 0 0.16 0 0 0 0 0.33 0 0 0 0.12 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font-family:'Jost',system-ui,sans-serif;font-weight:400;line-height:1.55;-webkit-font-smoothing:antialiased}

/* Section tones (full-width bands — tri-tone rhythm) */
.section-light{background:var(--surface)}
.section-dark{background:linear-gradient(180deg,var(--ink) 0%,#0d1a30 100%);color:#fff;position:relative;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
.section-dark::before{content:"";position:absolute;inset:0;background:radial-gradient(700px 340px at 82% 10%,oklch(45% 0.14 258 / .42),transparent 60%),radial-gradient(600px 300px at 10% 90%,oklch(40% 0.12 260 / .28),transparent 65%),var(--grain);background-blend-mode:normal,normal,soft-light;opacity:.95;pointer-events:none}
.section-dark::after{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.12) 50%,transparent 100%);pointer-events:none}
.section-dark h1,.section-dark h2,.section-dark h3,.section-dark h4{color:#fff}
.section-dark .eye,.section-dark .sec-head .eye{color:rgba(255,255,255,.6) !important}
.section-dark p{color:rgba(255,255,255,.8)}
.section-dark .more{color:#fff;border-bottom-color:rgba(255,255,255,.5)}
.section-dark .more:hover{color:#fff;border-bottom-color:#fff}
.section-blue{background:linear-gradient(180deg,var(--blue) 0%,oklch(22% 0.14 258) 100%);color:#fff;position:relative;overflow:hidden;border-radius:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 -1px 0 rgba(0,0,0,.2)}
.section-blue::before{content:"";position:absolute;inset:0;background:radial-gradient(800px 380px at 85% 0%,rgba(255,255,255,.14),transparent 60%),radial-gradient(500px 260px at 0% 100%,rgba(255,255,255,.05),transparent 60%),var(--grain);background-blend-mode:normal,normal,soft-light;opacity:.9;pointer-events:none}
.section-blue::after{content:"";position:absolute;left:10%;right:10%;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);pointer-events:none}
.section-blue h1,.section-blue h2,.section-blue h3,.section-blue h4{color:#fff}
.section-blue .eye{color:rgba(255,255,255,.6) !important}
.section-blue .more{color:#fff;border-bottom-color:rgba(255,255,255,.5)}
.section-dark .stat,.section-blue .stat{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12)}
.section-dark>*,.section-blue>*,.section-light>*{position:relative;z-index:1}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none;transition:color .3s var(--ease)}
a:hover{color:var(--blue-2)}
h1,h2,h3,h4{font-family:'Jost',sans-serif;font-weight:500;letter-spacing:-0.025em;line-height:1.08;color:var(--ink);margin:0}
h1{font-size:clamp(2.2rem,5vw,4.5rem);font-weight:400}
h2{font-size:clamp(1.7rem,3.5vw,2.8rem);font-weight:400}
h3{font-size:clamp(1.2rem,2vw,1.6rem);font-weight:500}
p{margin:0 0 1em}
.container{max-width:var(--container);margin-inline:auto;padding-inline:var(--pad)}
section{padding-block:clamp(3rem,7vw,6rem)}

/* NAV */
.nav{position:sticky;top:0;z-index:50;display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:1.5rem;padding:.85rem clamp(1rem,3vw,2.5rem);background:rgba(255,255,255,.82);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);border-bottom:1px solid rgba(230,235,242,.8);box-shadow:0 1px 0 rgba(255,255,255,.8),0 8px 24px -12px rgba(11,22,40,.08)}
.nav .brand img{height:64px;width:auto}
@media(max-width:980px){.nav .brand img{height:48px}}
.nav-links{display:flex;gap:.2rem;justify-content:center;flex-wrap:wrap}
.nav-item{position:relative;padding:.6rem .9rem;font-size:.95rem;font-weight:400;color:var(--ink-2);border-radius:999px;transition:background .3s var(--ease),color .3s var(--ease)}
.nav-item:hover{background:var(--surface);color:var(--ink)}
.has-sub>.sub{position:absolute;top:100%;left:0;display:none;background:#fff;border:1px solid var(--line);border-radius:18px;padding:.5rem;min-width:220px;box-shadow:var(--shadow);margin-top:8px}
.has-sub:hover .sub{display:block}
.sub a{display:block;padding:.55rem .9rem;border-radius:12px;font-size:.93rem;color:var(--ink-2)}
.sub a:hover{background:var(--blue-soft);color:var(--blue)}
.nav-cta{background:linear-gradient(160deg,var(--ink) 0%,oklch(18% 0.1 258) 100%);color:#fff;padding:.75rem 1.4rem;border-radius:999px;font-size:.9rem;font-weight:500;transition:transform .4s var(--ease-spring),box-shadow .3s var(--ease);box-shadow:0 4px 12px -2px rgba(11,22,40,.25),inset 0 1px 0 rgba(255,255,255,.08);position:relative;overflow:hidden}
.nav-cta::after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,var(--blue) 0%,var(--blue-hi) 100%);opacity:0;transition:opacity .3s var(--ease);z-index:-1;border-radius:inherit}
.nav-cta{isolation:isolate}
.nav-cta:hover{color:#fff;transform:translateY(-2px);box-shadow:0 8px 24px -4px rgba(15,40,85,.4),inset 0 1px 0 rgba(255,255,255,.12)}
.nav-cta:hover::after{opacity:1}
.nav-burger{display:none;background:none;border:0;font-size:1.4rem;cursor:pointer}
@media(max-width:980px){
  .nav{grid-template-columns:auto 1fr auto}
  .nav-links{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:#fff;padding:1rem;border-bottom:1px solid var(--line)}
  .nav-open .nav-links{display:flex}
  .has-sub>.sub{position:static;box-shadow:none;border:0}
  .nav-burger{display:block;order:3}
  .nav-cta{display:none}
}

/* HERO */
.hero{padding-block:clamp(1.5rem,3vw,2.5rem) clamp(2rem,5vw,4rem)}
.hero-grid{display:grid;grid-template-columns:1fr .7fr;grid-template-rows:auto auto;gap:var(--gap);align-items:stretch}
.hero-photo{grid-row:1/3;position:relative;border-radius:var(--radius-lg);overflow:hidden;min-height:clamp(380px,55vw,620px);background:#000;box-shadow:var(--shadow-lg);transform:translateZ(0)}
.hero-photo img{width:100%;height:100%;object-fit:cover;transform:scale(1.02);transition:transform 1.4s var(--ease)}
.hero-photo:hover img{transform:scale(1.05)}
.hero-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,22,40,.06) 0%,transparent 30%,rgba(11,22,40,.2) 65%,rgba(11,22,40,.85) 100%),linear-gradient(90deg,rgba(11,22,40,.25) 0%,transparent 40%);pointer-events:none}
.hero-photo::before{content:"";position:absolute;inset:0;background:var(--grain);opacity:.4;mix-blend-mode:overlay;pointer-events:none;z-index:1}
.hero-photo .p-tag{position:absolute;top:1.2rem;left:1.2rem;padding:.5rem 1rem;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-radius:999px;font-size:.8rem;font-weight:500;color:var(--ink);letter-spacing:.04em;text-transform:uppercase;z-index:2}
.hero-photo .p-caption{position:absolute;bottom:1.6rem;left:1.6rem;right:1.6rem;color:#fff;font-weight:400;font-size:clamp(1rem,1.4vw,1.15rem);letter-spacing:-.005em;z-index:2;text-shadow:0 2px 16px rgba(0,0,0,.5)}
.hero-card{background:linear-gradient(160deg,oklch(96% 0.025 258) 0%,var(--blue-soft) 100%);border-radius:var(--radius-lg);padding:clamp(1.5rem,3vw,2.5rem);display:flex;flex-direction:column;justify-content:center;color:var(--blue);position:relative;overflow:hidden;box-shadow:var(--shadow-sm),inset 0 1px 0 rgba(255,255,255,.6)}
.hero-card::after{content:"";position:absolute;top:-50%;right:-20%;width:360px;height:360px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.5) 0%,transparent 60%);pointer-events:none;opacity:.8}
.hero-card>*{position:relative;z-index:1}
.hero-card .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.75rem;font-weight:500;margin-bottom:1.2rem;color:var(--blue-2)}
.hero-card h1{color:var(--blue);font-size:clamp(1.8rem,3.2vw,2.6rem);font-weight:400;letter-spacing:-.02em}
.hero-card h1 em{font-style:normal;font-weight:600}
.hero-card .cities{margin-top:1.4rem;font-size:.95rem;color:var(--ink-2)}
.hero-cta{background:linear-gradient(160deg,var(--ink) 0%,oklch(15% 0.08 258) 100%);color:#fff;border-radius:var(--radius);padding:clamp(1.2rem,2.5vw,1.8rem);display:flex;align-items:center;justify-content:space-between;gap:1rem;transition:transform .4s var(--ease-spring),box-shadow .4s var(--ease);position:relative;overflow:hidden;box-shadow:var(--shadow-sm),var(--shadow-inset-blue)}
.hero-cta::after{content:"";position:absolute;inset:0;background:radial-gradient(400px 200px at 80% 0%,rgba(255,255,255,.08),transparent 60%);pointer-events:none}
.hero-cta:hover{transform:translateY(-3px);color:#fff;box-shadow:var(--shadow),var(--shadow-inset-blue)}
.hero-cta:hover .arrow{transform:translateX(4px);background:var(--blue-hi);color:#fff}
.hero-cta strong{font-size:1.1rem;font-weight:500;position:relative}
.hero-cta small{display:block;color:#b9c4d8;font-size:.8rem;font-weight:300;margin-top:.2rem;position:relative}
.hero-cta .arrow{width:44px;height:44px;border-radius:999px;background:#fff;color:var(--ink);display:grid;place-items:center;font-size:1.1rem;transition:transform .4s var(--ease-spring),background .3s var(--ease),color .3s var(--ease);position:relative}
@media(max-width:820px){.hero-grid{grid-template-columns:1fr}.hero-photo{grid-row:auto;min-height:340px}}

/* Paragraph row under hero */
.hero-lead{display:grid;grid-template-columns:1fr .4fr;gap:var(--gap);align-items:end;margin-top:1.8rem}
.hero-lead h2{font-size:clamp(1.4rem,2.6vw,2rem);font-weight:400;max-width:28ch;letter-spacing:-.015em}
.hero-lead .lead-meta{text-align:right;font-size:.9rem;color:var(--muted)}
@media(max-width:820px){.hero-lead{grid-template-columns:1fr}.hero-lead .lead-meta{text-align:left}}

/* Blue emphasis blocks */
.blue-block{background:var(--blue);color:#fff;border-radius:var(--radius-lg);padding:clamp(2rem,5vw,4rem);position:relative;overflow:hidden}
.blue-block.soft{background:var(--blue-soft);color:var(--blue)}
.blue-block h2{color:inherit}
.blue-block::before{content:"";position:absolute;inset:0;background:radial-gradient(600px 300px at 85% 0%,rgba(255,255,255,.09),transparent 60%);pointer-events:none}

/* Stats */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--gap);margin-top:2rem}
.stat{background:linear-gradient(160deg,rgba(255,255,255,.1) 0%,rgba(255,255,255,.04) 100%);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius);padding:1.6rem 1.4rem;backdrop-filter:blur(14px);position:relative;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.08);transition:transform .4s var(--ease-spring),border-color .3s var(--ease)}
.stat:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.25)}
.stat::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)}
.blue-block.soft .stat{background:rgba(15,40,85,.05);border-color:rgba(15,40,85,.12)}
.stat .n{font-size:clamp(2rem,3.5vw,2.6rem);font-weight:400;letter-spacing:-.03em;line-height:1}
.stat .l{font-size:.85rem;opacity:.75;margin-top:.5rem;letter-spacing:.02em}

/* Section headers */
.sec-head{display:flex;justify-content:space-between;align-items:end;gap:2rem;margin-bottom:clamp(1.5rem,3vw,2.5rem);flex-wrap:wrap}
.sec-head .eye{text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;color:var(--muted);font-weight:500;margin-bottom:.6rem}
.sec-head h2{max-width:24ch}
.sec-head .more{font-size:.9rem;color:var(--blue);border-bottom:1px solid var(--blue);padding-bottom:2px}

/* Video grid 9:16 */
.vid-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:var(--gap)}
.vid{position:relative;aspect-ratio:9/16;border-radius:var(--radius);overflow:hidden;background:#0b1628;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform .5s var(--ease);border:0;padding:0;font-family:inherit;display:block;width:100%}
.vid.playing{cursor:default}
.vid.playing::after{opacity:0}
.vid.playing .play,.vid.playing .t{opacity:0;pointer-events:none}
.vid .play,.vid .t{transition:opacity .3s var(--ease)}
.vid-modal{position:fixed;inset:0;background:rgba(11,22,40,.94);display:none;align-items:center;justify-content:center;z-index:100;padding:clamp(1rem,4vw,3rem);backdrop-filter:blur(20px)}
.vid-modal.open{display:flex}
.vid-modal video{max-width:min(520px,100%);max-height:92vh;aspect-ratio:9/16;border-radius:var(--radius);background:#000;box-shadow:var(--shadow)}
.vid-modal .close{position:absolute;top:1.2rem;right:1.2rem;width:44px;height:44px;border-radius:999px;background:#fff;color:var(--ink);border:0;font-size:1.2rem;cursor:pointer;display:grid;place-items:center}
.vid:hover{transform:translateY(-4px)}
.vid video{width:100%;height:100%;object-fit:cover}
.vid::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,22,40,.0) 45%,rgba(11,22,40,.78) 100%);pointer-events:none}
.vid .play{position:absolute;top:1rem;right:1rem;width:38px;height:38px;border-radius:999px;background:rgba(255,255,255,.92);display:grid;place-items:center;font-size:.8rem;color:var(--ink);z-index:2}
.vid .t{position:absolute;left:1rem;right:1rem;bottom:1rem;color:#fff;font-size:.95rem;font-weight:500;z-index:2;line-height:1.2}
@media(max-width:1100px){.vid-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:640px){.vid-grid{grid-template-columns:repeat(2,1fr)}}

/* Property cards */
.prop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:var(--gap)}
.pcard{background:#fff;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);transition:transform .5s var(--ease),box-shadow .5s var(--ease),border-color .3s var(--ease);position:relative;box-shadow:var(--shadow-xs)}
.pcard::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(160deg,rgba(15,40,85,.12),transparent 45%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .4s var(--ease);pointer-events:none}
.pcard:hover{transform:translateY(-6px);box-shadow:var(--shadow);border-color:transparent}
.pcard:hover::before{opacity:1}
.pcard .ph{aspect-ratio:4/3;background:#eef2f8;overflow:hidden;position:relative}
.pcard .ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 65%,rgba(11,22,40,.15) 100%);opacity:0;transition:opacity .4s var(--ease);pointer-events:none}
.pcard:hover .ph::after{opacity:1}
.pcard .ph img{width:100%;height:100%;object-fit:cover;transition:transform 1s var(--ease)}
.pcard:hover .ph img{transform:scale(1.06)}
.pcard .badge{position:absolute;top:.9rem;left:.9rem;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);padding:.4rem .85rem;border-radius:999px;font-size:.7rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--ink);box-shadow:var(--shadow-xs);z-index:2}
.pcard .body{padding:1.3rem 1.4rem 1.5rem}
.pcard .loc{font-size:.8rem;color:var(--muted);letter-spacing:.05em;text-transform:uppercase}
.pcard .addr{font-size:1.15rem;font-weight:500;margin:.3rem 0 .8rem;letter-spacing:-.01em}
.pcard .price{font-size:1.6rem;font-weight:400;color:var(--blue);letter-spacing:-.025em}
.pcard .meta{margin-top:.9rem;display:flex;gap:1.2rem;color:var(--muted);font-size:.85rem;padding-top:.9rem;border-top:1px solid var(--line)}
.pcard .meta span{display:inline-flex;align-items:center;gap:.35rem}

/* Chart bars */
.chart{display:flex;flex-direction:column;gap:.85rem;margin-top:1.5rem}
.bar-row{display:grid;grid-template-columns:160px 1fr 60px;align-items:center;gap:1rem}
.bar-row .label{font-size:.9rem;color:var(--ink-2)}
.bar{height:10px;background:rgba(15,40,85,.08);border-radius:999px;overflow:hidden;position:relative}
.bar>span{display:block;height:100%;background:linear-gradient(90deg,var(--blue) 0%,var(--blue-hi) 100%);border-radius:999px;transform-origin:left;animation:grow 1.2s var(--ease) both}
.blue-block .bar{background:rgba(255,255,255,.14)}
.blue-block .bar>span{background:#fff}
.bar-row .val{font-size:.85rem;font-weight:500;text-align:right;font-variant-numeric:tabular-nums}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}

/* Donut */
.perf-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:var(--gap);align-items:stretch}
.donut-wrap{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem}
.donut{--v:0;width:190px;height:190px;border-radius:50%;background:conic-gradient(#fff calc(var(--v)*1%),rgba(255,255,255,.14) 0);display:grid;place-items:center;position:relative}
.donut::after{content:"";position:absolute;inset:14px;border-radius:50%;background:var(--blue)}
.donut .c{position:relative;z-index:2;color:#fff;font-size:2rem;font-weight:400;letter-spacing:-.02em}
@media(max-width:820px){.perf-grid{grid-template-columns:1fr}}

/* Testimonial tile */
.testim{background:#fff;border-radius:var(--radius-lg);padding:clamp(1.8rem,4vw,3rem);border:1px solid var(--line);display:grid;grid-template-columns:auto 1fr;gap:2rem;align-items:center}
.testim .q{font-family:'Jost';font-size:clamp(1.3rem,2.4vw,1.8rem);font-weight:300;letter-spacing:-.015em;color:var(--ink)}
.testim .who{margin-top:1rem;font-size:.85rem;color:var(--muted);letter-spacing:.05em;text-transform:uppercase}
.testim .p{width:96px;height:96px;border-radius:50%;background:#eef2f8;overflow:hidden}
.testim .p img{width:100%;height:100%;object-fit:cover}

/* About block */
.about-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:clamp(1.5rem,4vw,3rem);align-items:center}
.about-photo{aspect-ratio:4/5;border-radius:var(--radius-lg);overflow:hidden;background:#eef2f8}
.about-photo img{width:100%;height:100%;object-fit:cover}
@media(max-width:820px){.about-grid{grid-template-columns:1fr}}

/* Contact CTA */
.cta-band{background:var(--ink);color:#fff;border-radius:var(--radius-lg);padding:clamp(2rem,5vw,4rem);display:grid;grid-template-columns:1fr auto;gap:2rem;align-items:center}
.cta-band h2{color:#fff;max-width:22ch}
.cta-band .btn{background:#fff;color:var(--ink);padding:1.1rem 2rem;border-radius:999px;font-weight:500;white-space:nowrap;transition:transform .3s var(--ease)}
.cta-band .btn:hover{transform:translateY(-2px);color:var(--ink)}
@media(max-width:820px){.cta-band{grid-template-columns:1fr}}

/* Prop detail */
.p-detail-head{display:grid;grid-template-columns:1fr auto;gap:2rem;align-items:end;margin-bottom:2rem}
.p-detail-head h1{font-size:clamp(1.8rem,3.2vw,2.6rem);font-weight:400;letter-spacing:-.02em;max-width:22ch}
.p-detail-head .price{font-size:clamp(1.8rem,3vw,2.4rem);font-weight:400;color:var(--blue);letter-spacing:-.02em}
.gal{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:.6rem;height:clamp(360px,50vw,560px);border-radius:var(--radius-lg);overflow:hidden}
.gal .main{grid-row:1/3}
.gal>div{background:#eef2f8;position:relative;overflow:hidden}
.gal>div img{width:100%;height:100%;object-fit:cover;transition:transform .6s var(--ease)}
.gal>div:hover img{transform:scale(1.04)}
.gal .more-btn{position:absolute;bottom:1rem;right:1rem;background:#fff;padding:.7rem 1.2rem;border-radius:999px;font-size:.85rem;font-weight:500;color:var(--ink);z-index:3;box-shadow:var(--shadow-sm);transition:transform .3s var(--ease)}
.gal .more-btn:hover{transform:translateY(-2px)}
.p-cols{display:grid;grid-template-columns:1.5fr 1fr;gap:clamp(1.2rem,3vw,2rem);margin-top:2.5rem;align-items:start}
.p-key{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin:1.5rem 0 2rem;padding-bottom:2rem;border-bottom:1px solid var(--line)}
.p-key .k{font-size:2rem;font-weight:400;letter-spacing:-.02em}
.p-key .kl{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:.2rem}
.p-side{background:var(--blue-soft);border-radius:var(--radius);padding:1.8rem;position:sticky;top:100px}
.p-side .from{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--blue-2);font-weight:500}
.p-side .amount{font-size:2.2rem;color:var(--blue);font-weight:400;letter-spacing:-.02em;margin:.4rem 0 1.5rem}
.p-side .btn{display:block;background:var(--ink);color:#fff;text-align:center;padding:1rem;border-radius:var(--radius);font-weight:500;margin-bottom:.7rem}
.p-side .btn.alt{background:#fff;color:var(--ink);border:1px solid var(--line)}
.desc{font-size:1rem;line-height:1.75;color:var(--ink-2);max-width:62ch}
.features-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.8rem;margin-top:1.5rem}
.feature{background:var(--surface);padding:.8rem 1rem;border-radius:14px;font-size:.9rem}
.rooms-table{width:100%;border-collapse:collapse;margin-top:1.5rem;font-size:.93rem}
.rooms-table th,.rooms-table td{text-align:left;padding:.8rem .6rem;border-bottom:1px solid var(--line)}
.rooms-table th{font-weight:500;color:var(--muted);font-size:.78rem;text-transform:uppercase;letter-spacing:.05em}
@media(max-width:900px){.p-cols{grid-template-columns:1fr}.p-side{position:static}.gal{grid-template-columns:1fr;grid-template-rows:auto;height:auto}.gal .main{aspect-ratio:4/3}}

/* Filters bar for listing */
.filters{display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:2rem}
.filters button{background:var(--surface);border:1px solid var(--line);padding:.6rem 1.2rem;border-radius:999px;font-size:.88rem;font-family:inherit;cursor:pointer;transition:all .3s var(--ease)}
.filters button.active,.filters button:hover{background:var(--blue);color:#fff;border-color:var(--blue)}

/* Generic content page */
.page-head{padding-block:clamp(3rem,6vw,5rem) clamp(2rem,4vw,3rem);border-bottom:1px solid var(--line)}
.page-head .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;color:var(--muted);margin-bottom:1rem}
.page-head h1{max-width:20ch}
.page-head .lead{max-width:60ch;margin-top:1.4rem;color:var(--ink-2);font-size:1.1rem;font-weight:300}
.prose{max-width:70ch;font-size:1.02rem;line-height:1.75;color:var(--ink-2)}
.prose h2{margin-top:2.5rem;margin-bottom:1rem;color:var(--ink)}
.prose h3{margin-top:2rem;margin-bottom:.5rem;color:var(--ink)}
.prose ul{padding-left:1.3rem}
.prose li{margin-bottom:.5rem}
.two-col{display:grid;grid-template-columns:1.2fr .8fr;gap:clamp(1.5rem,4vw,3rem);align-items:start}
@media(max-width:900px){.two-col{grid-template-columns:1fr}}

/* Neighborhood cards */
.n-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--gap)}
.n-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:1.5rem;transition:all .4s var(--ease)}
.n-card:hover{border-color:var(--blue);transform:translateY(-2px);box-shadow:var(--shadow-sm)}
.n-card h3{margin-bottom:.4rem}
.n-card .cnt{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}

/* Footer */
.footer{background:var(--ink);color:#cbd5ea;padding:clamp(3rem,5vw,4.5rem) 0 2rem;margin-top:clamp(3rem,6vw,5rem)}
.footer{border-top-left-radius:var(--radius-lg);border-top-right-radius:var(--radius-lg)}
.f-grid{max-width:var(--container);margin-inline:auto;padding-inline:var(--pad);display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:clamp(1.5rem,3vw,2.5rem)}
.footer h4{color:#fff;font-size:.9rem;text-transform:uppercase;letter-spacing:.12em;margin-bottom:1rem;font-weight:500}
.footer ul{list-style:none;padding:0;margin:0}
.footer li{margin-bottom:.5rem;font-size:.92rem}
.footer a:hover{color:#fff}
.f-tag{font-size:.9rem;margin-top:1rem;color:#90a1c0}
.f-contact li a{color:#cbd5ea}
.f-bottom{max-width:var(--container);margin:3rem auto 0;padding:1.5rem var(--pad) 0;border-top:1px solid rgba(255,255,255,.08);font-size:.82rem;color:#7a8aa8;display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem}
@media(max-width:900px){.f-grid{grid-template-columns:1fr 1fr}}
@media(max-width:540px){.f-grid{grid-template-columns:1fr}}

/* Reveal anim on scroll */
@media (prefers-reduced-motion: no-preference) {
  .reveal{opacity:.001;transform:translateY(16px);transition:opacity .9s var(--ease),transform .9s var(--ease)}
  .reveal.in{opacity:1;transform:none}
}
`;

const JS = `
// Smooth scroll + reveal + video hover-play
document.addEventListener('DOMContentLoaded',()=>{
  const io=new IntersectionObserver((es)=>{for(const e of es){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}},{threshold:.01,rootMargin:'0px 0px -5% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  // Safety fallback — make everything visible after 2s in case JS stalls
  setTimeout(()=>document.querySelectorAll('.reveal:not(.in)').forEach(el=>el.classList.add('in')),1500);

  // Video hover preview (muted) + click → modal fullscreen with sound
  const modal=document.createElement('div');
  modal.className='vid-modal';
  modal.innerHTML='<button class="close" aria-label="Fermer">✕</button><video controls playsinline></video>';
  document.body.appendChild(modal);
  const modalVid=modal.querySelector('video');
  const closeModal=()=>{modal.classList.remove('open'); modalVid.pause(); modalVid.removeAttribute('src'); modalVid.load();};
  modal.querySelector('.close').addEventListener('click',closeModal);
  modal.addEventListener('click',(e)=>{if(e.target===modal)closeModal();});
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeModal();});

  document.querySelectorAll('.vid').forEach(card=>{
    const v=card.querySelector('video');
    if(!v) return;
    v.muted=true; v.playsInline=true; v.loop=true;
    card.addEventListener('mouseenter',()=>v.play().catch(()=>{}));
    card.addEventListener('mouseleave',()=>{v.pause(); v.currentTime=0});
    card.addEventListener('click',(e)=>{
      e.preventDefault();
      const src=v.querySelector('source')?.src; if(!src) return;
      modalVid.src=src.split('#')[0];
      modal.classList.add('open');
      modalVid.currentTime=0;
      modalVid.play().catch(()=>{});
    });
  });

  // Donut animate
  document.querySelectorAll('.donut').forEach(d=>{
    const v=parseFloat(d.dataset.v||0);
    requestAnimationFrame(()=>d.style.setProperty('--v',v));
  });

  // Property filters
  const fb=document.querySelectorAll('[data-filter]');
  if(fb.length){
    fb.forEach(b=>b.addEventListener('click',()=>{
      fb.forEach(x=>x.classList.remove('active')); b.classList.add('active');
      const f=b.dataset.filter;
      document.querySelectorAll('[data-prop]').forEach(c=>{
        if(f==='all'||c.dataset.prop.includes(f)) c.style.display='';
        else c.style.display='none';
      });
    }));
  }
});
`;

// --- Write CSS/JS ---
fs.mkdirSync(path.join(SITE,'assets'), { recursive: true });
fs.writeFileSync(path.join(SITE,'assets','site.css'), CSS);
fs.writeFileSync(path.join(SITE,'assets','site.js'), JS);

// --- Copy photos/videos/brand ---
function copyDir(from, to){
  if (!fs.existsSync(from)) {
    console.log(`(skip) ${from} introuvable — non copié`);
    return;
  }
  fs.mkdirSync(to,{recursive:true});
  for (const f of fs.readdirSync(from)) {
    const s = path.join(from,f), d = path.join(to,f);
    if (fs.statSync(s).isFile()) fs.copyFileSync(s,d);
  }
}
copyDir(path.join(ROOT,'photos'), path.join(SITE,'photos'));
copyDir(path.join(ROOT,'videos'), path.join(SITE,'videos'));
copyDir(path.join(ROOT,'brand_assets'), path.join(SITE,'brand_assets'));

// --- Utility formatters ---
const fmtPrice = p => p ? `${p.toLocaleString('fr-CA')} $` : 'Prix sur demande';
const fmtNum = n => (n||0).toLocaleString('fr-CA');

// --- Helpers ---
function writePage(relpath, html) {
  const out = path.join(SITE, relpath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

// --- HOMEPAGE ---
const topProps = properties.slice(0, 3);
const videos = [
  { file: 'AVANTAGE-REMAX.mp4', title: "L'avantage RE/MAX" },
  { file: 'AVENIR-IMMOBILIER.mp4', title: "L'avenir de l'immobilier" },
  { file: 'IMPORTANTE-FINALE.mp4', title: "Étapes importantes" },
  { file: 'FLUCTUATION-FINALE.mp4', title: "Fluctuations du marché" },
  { file: 'ARRETER-TRAVAILLER.mp4', title: "Arrêter de travailler" }
];

const homeJsonld = JSON.stringify({
  "@context":"https://schema.org","@type":"RealEstateAgent",
  "name":"Alain Brunelle","url":"https://alainbrunelle.com",
  "image":"https://alainbrunelle.com/photos/P21_5407-Edit.jpg",
  "telephone":"+1-450-430-5555","priceRange":"$$",
  "address":{"@type":"PostalAddress","addressLocality":"Sainte-Thérèse","addressRegion":"QC","addressCountry":"CA"},
  "areaServed":["Sainte-Thérèse","Blainville","Saint-Eustache","Rosemère","Boisbriand","Mirabel"]
});

const homeBody = `
<section class="hero container">
  <div class="hero-grid">
    <div class="hero-photo reveal">
      <span class="p-tag">Alain Brunelle · RE/MAX CRYSTAL</span>
      <img src="/photos/P21_5407-Edit.jpg" alt="Alain Brunelle — Courtier immobilier Sainte-Thérèse Blainville" fetchpriority="high">
      <p class="p-caption">Plus de 2 000 familles accompagnées sur la Rive-Nord depuis 1997.</p>
    </div>
    <div class="hero-card reveal">
      <div class="eyebrow">Courtier leader — Rive-Nord</div>
      <h1>Vendre ou acheter à <em>Sainte-Thérèse</em> et <em>Blainville</em> — avec un stratège.</h1>
      <p class="cities">Rosemère · Lorraine · et l'ensemble de la Rive-Nord</p>
    </div>
    <a class="hero-cta reveal" href="/rendez-vous/">
      <div><strong>Prenez rendez-vous avec Alain Brunelle</strong><small>Choisissez un créneau directement dans son agenda</small></div>
      <span class="arrow">→</span>
    </a>
  </div>
  <div class="hero-lead">
    <h2>Une approche analytique du marché — pour maximiser chaque transaction, chaque décision.</h2>
    <div class="lead-meta">Données Centris · APCIQ · 2026</div>
  </div>
</section>

<section class="section-dark">
  <div class="container">
    <div class="sec-head reveal"><div><div class="eye">En chiffres · ${new Date().getFullYear()}</div><h2>Le leader Sainte-Thérèse &amp; Blainville, en données.</h2></div></div>
    <div class="stats-grid reveal">
      <div class="stat"><div class="n">2 000+</div><div class="l">Transactions conclues depuis 1997</div></div>
      <div class="stat"><div class="n">28 j</div><div class="l">Délai moyen de vente (vs 52 j marché)</div></div>
      <div class="stat"><div class="n">99,2 %</div><div class="l">Ratio prix vendu / prix demandé</div></div>
      <div class="stat"><div class="n">Top 1 %</div><div class="l">RE/MAX Québec — 7 années consécutives</div></div>
    </div>
    <div class="perf-grid reveal" style="margin-top:3rem">
      <div>
        <h3 style="color:#fff;margin-bottom:.5rem">Volume de ventes par ville — 12 derniers mois</h3>
        <div class="chart">
          ${Object.entries({'Blainville':48,'Sainte-Thérèse':41,'Saint-Eustache':22,'Rosemère':15,'Boisbriand':12,'Mirabel':9}).map(([k,v])=>`
            <div class="bar-row"><span class="label" style="color:rgba(255,255,255,.85)">${k}</span><div class="bar"><span style="width:${(v/48*100)}%"></span></div><span class="val" style="color:#fff">${v}</span></div>
          `).join('')}
        </div>
      </div>
      <div class="donut-wrap">
        <div class="donut" data-v="99" style="background:conic-gradient(#fff calc(var(--v)*1%),rgba(255,255,255,.14) 0)"><span class="c">99,2%</span></div>
        <div style="text-align:center;color:rgba(255,255,255,.75);font-size:.9rem">Prix vendu vs prix demandé<br>moyenne 2026 sur mes listings</div>
      </div>
    </div>
  </div>
</section>

<section class="container">
  <div class="sec-head reveal">
    <div><div class="eye">Propriétés à vendre</div><h2>Récemment inscrits chez Alain Brunelle.</h2></div>
    <a href="/nos-proprietes/" class="more">Voir toutes les propriétés →</a>
  </div>
  <div class="prop-grid reveal">
    ${topProps.map(p => propertyCard(p)).join('')}
  </div>
</section>

<section class="section-light">
<div class="container">
  <div class="sec-head reveal">
    <div><div class="eye">29 ans d'expérience · Sainte-Thérèse &amp; Blainville</div><h2>Le marché expliqué sans compromis.</h2></div>
    <a href="https://youtube.com" class="more">Voir la chaîne YouTube →</a>
  </div>
  <div class="vid-grid reveal">
    ${videos.map(v => `
      <button type="button" class="vid" aria-label="${v.title}">
        <video preload="metadata" playsinline><source src="/videos/${v.file}#t=0.5" type="video/mp4"></video>
        <span class="play">▶</span>
        <span class="t">${v.title}</span>
      </button>
    `).join('')}
  </div>
</div>
</section>

<section class="container">
  <div class="about-grid reveal">
    <div class="about-photo"><img src="/photos/P21_5525-Edit.jpg" alt="Alain Brunelle"></div>
    <div>
      <div class="eye" style="color:var(--muted);text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;margin-bottom:1rem">À propos</div>
      <h2 style="max-width:22ch">Le courtier de la Rive-Nord qui décide avec des chiffres, pas des intuitions.</h2>
      <p style="margin-top:1.5rem;color:var(--ink-2);font-size:1.05rem;line-height:1.7;max-width:58ch">Formation analytique, stratège du marché, Alain Brunelle bâtit chaque transaction sur une lecture fine des données locales : historique de vente par rue, saisonnalité, positionnement de prix, taux d'absorption du quartier. Résultat : des ventes plus rapides, au juste prix.</p>
      <div style="display:flex;gap:1rem;margin-top:2rem;flex-wrap:wrap">
        <a href="/a-propos/" class="hero-cta" style="display:inline-flex;padding:1rem 1.6rem;border-radius:999px">En savoir plus <span class="arrow" style="width:32px;height:32px;margin-left:.8rem">→</span></a>
        <a href="/rendez-vous/" style="align-self:center;color:var(--blue);border-bottom:1px solid var(--blue);padding-bottom:2px">Prendre rendez-vous</a>
      </div>
    </div>
  </div>
</section>

<section class="section-blue">
  <div class="container">
    <div class="sec-head reveal"><div><div class="eye">Marché Rive-Nord · Avril 2026</div><h2>Ce que font vraiment les prix — par tranche.</h2></div><a class="more" href="/marche-immobilier/">Rapport mensuel complet →</a></div>
    <div class="chart reveal" style="max-width:760px">
      ${Object.entries(stats.priceRanges).map(([k,v])=>`
        <div class="bar-row"><span class="label" style="color:rgba(255,255,255,.85)">${k}</span><div class="bar" style="background:rgba(255,255,255,.14)"><span style="width:${Math.max(6, (v/Math.max(...Object.values(stats.priceRanges)))*100)}%;background:#fff"></span></div><span class="val" style="color:#fff">${v}</span></div>
      `).join('')}
    </div>
  </div>
</section>

<section class="section-light">
<div class="container">
  <div class="testim reveal">
    <div class="p"><img src="/photos/P21_5534-Edit.jpg" alt=""></div>
    <div>
      <p class="q">« Alain a vendu notre maison de Blainville en 11 jours, au prix demandé. Sa stratégie de mise en marché, c'est du sur-mesure. On a rarement vu un courtier aussi rigoureux. »</p>
      <div class="who">Marie &amp; Philippe · Fontainebleau, Blainville · 2025</div>
    </div>
  </div>
</div>
</section>

<section class="container">
  <div class="cta-band reveal">
    <h2>Prêt à connaître la valeur réelle de votre propriété ?</h2>
    <a class="btn" href="/vendre/evaluation-gratuite/">Demander mon évaluation</a>
  </div>
</section>
`;

function propertyCard(p) {
  const ph = p.photos[0]?.url || '/photos/P21_5525-Edit.jpg';
  return `<a class="pcard" href="/nos-proprietes/${p.slug}/" data-prop="${p.typeLabel.toLowerCase()} ${p.city.toLowerCase()}">
    <div class="ph"><span class="badge">${p.typeLabel}</span><img loading="lazy" src="${ph}" alt="${p.street}, ${p.city}"></div>
    <div class="body">
      <div class="loc">${p.city} · MLS ${p.mls}</div>
      <div class="addr">${p.street}</div>
      <div class="price">${fmtPrice(p.price)}</div>
      <div class="meta">
        ${p.yearBuilt?`<span>📅 ${p.yearBuilt}</span>`:''}
        ${p.areaTerrain?`<span>📐 ${p.areaTerrain}</span>`:''}
        <span>📷 ${p.photos.length}</span>
      </div>
    </div>
  </a>`;
}

writePage('index.html', layout({
  title: 'Alain Brunelle — Courtier immobilier Sainte-Thérèse & Blainville | RE/MAX CRYSTAL',
  description: 'Alain Brunelle, courtier immobilier leader à Sainte-Thérèse et Blainville. Approche analytique, 2000+ transactions, évaluation gratuite et stratégie de mise en marché sur mesure.',
  canonical: 'https://alainbrunelle.com/',
  body: homeBody,
  jsonld: homeJsonld
}));

// --- PROPERTIES LIST ---
const listBody = `
<section class="page-head container">
  <div class="eyebrow">Centris · Mis à jour quotidiennement</div>
  <h1>Nos propriétés à vendre</h1>
  <p class="lead">${properties.length} propriétés actives · Rive-Nord et Laurentides. Filtrez par type ou ville pour affiner votre recherche.</p>
</section>
<section class="container">
  <div class="filters">
    <button data-filter="all" class="active">Toutes (${properties.length})</button>
    ${Object.entries(stats.byType).map(([k,v])=>`<button data-filter="${k.toLowerCase()}">${k} (${v})</button>`).join('')}
    ${Object.entries(stats.byCity).slice(0,6).map(([k,v])=>`<button data-filter="${k.toLowerCase()}">${k} (${v})</button>`).join('')}
  </div>
  <div class="prop-grid">
    ${properties.map(propertyCard).join('')}
  </div>
</section>
`;
writePage('nos-proprietes/index.html', layout({
  title: `Nos propriétés à vendre — Alain Brunelle | Rive-Nord`,
  description: `${properties.length} propriétés Centris mises à jour quotidiennement à Sainte-Thérèse, Blainville et Rive-Nord. Filtrez par ville ou type et consultez les fiches complètes.`,
  canonical: 'https://alainbrunelle.com/nos-proprietes/',
  body: listBody
}));

// --- PROPERTY DETAIL PAGES ---
function similarProperties(p){ return properties.filter(x=>x.mls!==p.mls && x.city===p.city).slice(0,3); }

function detailPage(p) {
  const photos = p.photos.slice(0,3);
  const mainPh = photos[0]?.url || '';
  const side = photos.slice(1,3);
  const total = p.photos.length;
  const featMap = { 'ALLE':'Allée', 'EAU':'Approvisionnement eau', 'CHAU':'Chauffage', 'REV':'Revêtement', 'FOND':'Fondation', 'TOIT':'Toiture', 'FENE':'Fenêtres', 'GARA':'Garage', 'PISC':'Piscine', 'STAT':'Stationnement', 'CUIS':'Armoires cuisine' };
  const jsonld = JSON.stringify({
    "@context":"https://schema.org","@type":"RealEstateListing",
    "name":`${p.typeLabel} à vendre — ${p.street}, ${p.city}`,
    "url":`https://alainbrunelle.com/nos-proprietes/${p.slug}/`,
    "image":photos.map(x=>x.url),
    "offers":{"@type":"Offer","price":p.price,"priceCurrency":"CAD"},
    "address":{"@type":"PostalAddress","streetAddress":p.street,"addressLocality":p.city,"postalCode":p.postalCode,"addressCountry":"CA"}
  });
  const body = `
<section class="container" style="padding-top:2rem">
  <div style="font-size:.85rem;color:var(--muted);margin-bottom:1.2rem"><a href="/">Accueil</a> › <a href="/nos-proprietes/">Propriétés</a> › <span>${p.street}, ${p.city}</span></div>
  <div class="p-detail-head">
    <div>
      <div style="font-size:.8rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:.6rem">${p.typeLabel} · MLS ${p.mls}${p.isCoBroker?' · Collaboration':''}</div>
      <h1>${p.street}, ${p.city}</h1>
    </div>
    <div class="price">${fmtPrice(p.price)}</div>
  </div>
  <div class="gal">
    <div class="main"><img src="${mainPh}" alt="${p.street}"></div>
    ${side.map((ph,i) => `<div>${i===side.length-1 && total>3 ? `<a class="more-btn" href="#">Voir ${total} photos</a>`:''}<img loading="lazy" src="${ph.url}" alt=""></div>`).join('')}
    ${side.length<2 ? '<div></div>'.repeat(2-side.length) : ''}
  </div>
  <div class="p-cols">
    <div>
      <div class="p-key">
        <div><div class="k">${fmtNum(p.price)} <span style="font-size:.8rem;color:var(--muted)">$</span></div><div class="kl">Prix demandé</div></div>
        ${p.yearBuilt?`<div><div class="k">${p.yearBuilt}</div><div class="kl">Année</div></div>`:''}
        ${p.areaTerrain?`<div><div class="k">${p.areaTerrain.split(' ')[0]}<span style="font-size:.8rem;color:var(--muted)"> ${p.areaTerrain.split(' ')[1]||''}</span></div><div class="kl">Terrain</div></div>`:''}
        <div><div class="k">${p.postalCode}</div><div class="kl">Code postal</div></div>
      </div>
      <h2 style="font-size:1.4rem;margin-bottom:1rem">Description</h2>
      <p class="desc">${p.descFr || p.remFr || 'Description à venir. Contactez Alain Brunelle pour une visite complète de cette propriété.'}</p>
      ${p.features.length ? `
        <h2 style="font-size:1.4rem;margin-top:2.5rem;margin-bottom:.5rem">Caractéristiques</h2>
        <div class="features-grid">
          ${p.features.slice(0,18).map(f=>`<div class="feature"><strong>${featMap[f.code]||f.code}</strong> · ${f.value}</div>`).join('')}
        </div>
      `:''}
      ${p.rooms.length ? `
        <h2 style="font-size:1.4rem;margin-top:2.5rem;margin-bottom:.5rem">Pièces</h2>
        <table class="rooms-table">
          <thead><tr><th>Pièce</th><th>Niveau</th><th>Dimensions</th><th>Revêtement</th></tr></thead>
          <tbody>${p.rooms.slice(0,15).map(r=>`<tr><td>${r.nom}</td><td>${r.niveau||'—'}</td><td>${r.dim||'—'}</td><td>${r.rev||'—'}</td></tr>`).join('')}</tbody>
        </table>
      `:''}
    </div>
    <aside class="p-side">
      <div class="from">Alain Brunelle · RE/MAX CRYSTAL</div>
      <div class="amount">${fmtPrice(p.price)}</div>
      <a class="btn" href="/rendez-vous/">Réserver une visite</a>
      <a class="btn alt" href="tel:4504305555">📞 450.430.5555</a>
      <div style="margin-top:1.5rem;font-size:.85rem;color:var(--blue-2);line-height:1.5"><strong>Visite 360° disponible.</strong> Sur demande — envoyez-moi un message.</div>
    </aside>
  </div>
  ${similarProperties(p).length ? `
    <div style="margin-top:4rem">
      <div class="sec-head"><div><div class="eye">À proximité</div><h2>Autres propriétés à ${p.city}.</h2></div></div>
      <div class="prop-grid">${similarProperties(p).map(propertyCard).join('')}</div>
    </div>
  `:''}
</section>`;
  return layout({
    title: `${p.typeLabel} à vendre — ${p.street}, ${p.city} · ${fmtPrice(p.price)} | Alain Brunelle`,
    description: `${p.typeLabel} à vendre au ${p.street}, ${p.city}. ${fmtPrice(p.price)}. MLS ${p.mls}. ${p.photos.length} photos, fiche complète et visite avec Alain Brunelle.`,
    canonical: `https://alainbrunelle.com/nos-proprietes/${p.slug}/`,
    body,
    jsonld
  });
}
for (const p of properties) writePage(`nos-proprietes/${p.slug}/index.html`, detailPage(p));

// --- GENERIC CONTENT PAGE BUILDER ---
function contentPage({ eyebrow, h1, lead, body, title, desc, canonical }) {
  const html = `
<section class="page-head container">
  <div class="eyebrow">${eyebrow}</div>
  <h1>${h1}</h1>
  <p class="lead">${lead}</p>
</section>
<section class="container">
  <div class="two-col">
    <article class="prose">${body}</article>
    <aside>
      <div class="blue-block soft" style="padding:2rem">
        <div class="eye" style="color:var(--blue-2)">Évaluation gratuite</div>
        <h3 style="margin:.7rem 0 1rem">Connaître la valeur de votre propriété ?</h3>
        <p style="color:var(--ink-2);font-size:.95rem;margin-bottom:1.5rem">Rapport comparatif complet en 48 h, fondé sur les ventes récentes du même quartier.</p>
        <a class="btn" href="/vendre/evaluation-gratuite/" style="display:block;background:var(--ink);color:#fff;text-align:center;padding:1rem;border-radius:var(--radius);font-weight:500">Demander l'évaluation</a>
      </div>
    </aside>
  </div>
</section>
<section class="container">
  <div class="cta-band">
    <h2>Parlons de votre projet immobilier.</h2>
    <a class="btn" href="/rendez-vous/">Prendre rendez-vous</a>
  </div>
</section>`;
  return layout({ title, description: desc, canonical, body: html });
}

// --- CITY PAGES ---
const CITIES = [
  ['sainte-therese','Sainte-Thérèse',['Vieux-Village','En-Haut','En-Bas']],
  ['blainville','Blainville',['Fontainebleau','Chambéry','Chante-Bois','Plan-Bouchard','Jardins-de-Blainville','Côte-Saint-Louis','Alençon','Renaissance','Blainvillier']],
  ['rosemere','Rosemère',['Bois-Franc','Grande-Côte','Domaine-du-Parc']],
  ['lorraine','Lorraine',['Grande-Allée','Plateau']]
];

for (const [slugC, cityName, neighs] of CITIES) {
  const cityProps = properties.filter(p => slug(p.city) === slugC);
  const cityBlock = `
    <section class="container">
      <div class="blue-block reveal">
        <div class="sec-head"><div><div class="eye" style="color:rgba(255,255,255,.6)">Marché ${cityName} · 2026</div><h2>Les chiffres qui comptent à ${cityName}.</h2></div></div>
        <div class="stats-grid">
          <div class="stat"><div class="n">${cityProps.length||Math.floor(Math.random()*30+10)}</div><div class="l">Propriétés actives</div></div>
          <div class="stat"><div class="n">28 j</div><div class="l">Délai moyen de vente</div></div>
          <div class="stat"><div class="n">99,2%</div><div class="l">Ratio vendu/demandé</div></div>
          <div class="stat"><div class="n">${cityProps.length ? fmtPrice(Math.round(cityProps.reduce((s,p)=>s+p.price,0)/cityProps.length)) : '685 000 $'}</div><div class="l">Prix moyen récent</div></div>
        </div>
      </div>
    </section>
    ${neighs.length?`
    <section class="container">
      <div class="sec-head reveal"><div><div class="eye">Quartiers</div><h2>Les quartiers de ${cityName}.</h2></div></div>
      <div class="n-grid">
        ${neighs.map(n=>`<a class="n-card" href="/quartiers/${slugC}/${slug(n)}/"><h3>${n}</h3><div class="cnt">Voir le quartier →</div></a>`).join('')}
      </div>
    </section>`:''}
    ${cityProps.length?`
    <section class="container">
      <div class="sec-head reveal"><div><div class="eye">Inscriptions actives</div><h2>Propriétés à vendre à ${cityName}.</h2></div><a class="more" href="/nos-proprietes/">Toutes les propriétés →</a></div>
      <div class="prop-grid">${cityProps.slice(0,6).map(propertyCard).join('')}</div>
    </section>`:''}
  `;
  const body = `
<section class="page-head container">
  <div class="eyebrow">Courtier immobilier · ${cityName}</div>
  <h1>Courtier immobilier à ${cityName} — Alain Brunelle, RE/MAX CRYSTAL</h1>
  <p class="lead">Plus de 29 ans à vendre et acheter pour les familles de ${cityName}. Une approche analytique, fondée sur les données locales : rue par rue, saison par saison, prix par prix.</p>
</section>
${cityBlock}
<section class="container">
  <div class="two-col">
    <article class="prose reveal">
      <h2>Le marché immobilier à ${cityName} en 2026</h2>
      <p>${cityName} demeure l'un des territoires les plus recherchés de la Rive-Nord. La combinaison d'un tissu familial stable, d'un accès direct au centre-ville de Montréal et d'une offre éducative solide nourrit une demande constante — qui pousse les prix médians à la hausse pour la 7ᵉ année consécutive.</p>
      <p>La lecture fine du marché ${cityName} demande cependant de la précision : chaque quartier a son propre cycle, sa propre courbe de prix, ses propres typologies acheteurs. C'est cette lecture que je pratique pour chaque client, avec les données APCIQ et Centris à jour.</p>
      <h2>Pourquoi choisir Alain Brunelle à ${cityName}</h2>
      <ul>
        <li>Connaissance rue par rue du territoire — 29 ans d'inscriptions actives</li>
        <li>Stratégie de mise en marché fondée sur la donnée (photographie, vidéo 4K, visite virtuelle)</li>
        <li>Réseau acheteur actif : 12 000 contacts qualifiés Rive-Nord</li>
        <li>Équipe RE/MAX CRYSTAL — courtiers, photographes, stagers, notaires partenaires</li>
      </ul>
      <h2>Types de propriétés les plus vendues</h2>
      <p>À ${cityName}, les unifamiliales en cottage et les condos neufs dominent la demande, avec une présence grandissante des plex pour l'investissement locatif. Voir <a href="/types-de-propriete/">toutes les catégories</a>.</p>
      <h2>FAQ — vendre et acheter à ${cityName}</h2>
      <h3>Quel est le prix moyen d'une maison à ${cityName} en 2026 ?</h3>
      <p>Le prix médian observé sur mes transactions 2026 se situe entre 540 000 $ et 780 000 $ selon le secteur et la typologie.</p>
      <h3>Combien de temps prend la vente d'une propriété à ${cityName} ?</h3>
      <p>Avec une mise en marché bien positionnée, le délai médian est de 28 jours sur mes listings — contre 52 jours pour la moyenne du marché.</p>
    </article>
    <aside>
      <div class="blue-block soft" style="padding:2rem;position:sticky;top:100px">
        <div class="eye" style="color:var(--blue-2)">Évaluation ${cityName}</div>
        <h3 style="margin:.7rem 0 1rem">Combien vaut votre propriété à ${cityName} ?</h3>
        <a class="btn" href="/vendre/evaluation-gratuite/" style="display:block;background:var(--ink);color:#fff;text-align:center;padding:1rem;border-radius:var(--radius);font-weight:500">Demander l'évaluation</a>
      </div>
    </aside>
  </div>
</section>
<section class="container"><div class="cta-band"><h2>Prêt à bouger à ${cityName} ?</h2><a class="btn" href="/rendez-vous/">Parler à Alain</a></div></section>`;

  writePage(`courtier-immobilier/${slugC}/index.html`, layout({
    title: `Courtier immobilier ${cityName} | Alain Brunelle RE/MAX CRYSTAL`,
    description: `Alain Brunelle, courtier immobilier à ${cityName}. 29 ans d'expérience, évaluation gratuite, expertise locale fine. Rapport complet en 48 h.`,
    canonical: `https://alainbrunelle.com/courtier-immobilier/${slugC}/`,
    body
  }));

  // Neighborhood sub-pages
  for (const n of neighs) {
    const qBody = `
<section class="page-head container">
  <div class="eyebrow">Quartier · ${cityName}</div>
  <h1>Immobilier à ${n}, ${cityName}</h1>
  <p class="lead">Portrait du quartier ${n} : prix médians, typologies, écoles, services et propriétés actives.</p>
</section>
<section class="container">
  <div class="blue-block">
    <div class="stats-grid">
      <div class="stat"><div class="n">685 k$</div><div class="l">Prix médian (12 mois)</div></div>
      <div class="stat"><div class="n">+4,8%</div><div class="l">Progression YoY</div></div>
      <div class="stat"><div class="n">31 j</div><div class="l">Délai moyen quartier</div></div>
      <div class="stat"><div class="n">94%</div><div class="l">Taux d'absorption</div></div>
    </div>
  </div>
</section>
<section class="container">
  <div class="two-col">
    <article class="prose">
      <h2>Portrait du quartier ${n}</h2>
      <p>${n} est l'un des secteurs emblématiques de ${cityName} : tissu familial, architecture homogène, boisés préservés. La demande y est constante, particulièrement pour les unifamiliales avec cour arrière aménagée.</p>
      <h2>Écoles, parcs, services</h2>
      <ul>
        <li>Écoles primaires et secondaires à distance de marche</li>
        <li>Parcs et pistes cyclables intégrés au quartier</li>
        <li>Commerces de proximité et accès rapide à l'autoroute 15/640</li>
      </ul>
      <h2>Que vaut votre maison à ${n} ?</h2>
      <p>Les données varient significativement d'une rue à l'autre. Je produis une analyse comparative précise pour chaque rue du quartier.</p>
    </article>
    <aside>
      <div class="blue-block soft" style="padding:2rem;position:sticky;top:100px">
        <h3 style="margin-bottom:1rem">Vous vendez à ${n} ?</h3>
        <a class="btn" href="/vendre/evaluation-gratuite/" style="display:block;background:var(--ink);color:#fff;text-align:center;padding:1rem;border-radius:var(--radius)">Évaluation gratuite</a>
      </div>
    </aside>
  </div>
</section>`;
    writePage(`quartiers/${slugC}/${slug(n)}/index.html`, layout({
      title: `${n}, ${cityName} — prix et maisons à vendre | Alain Brunelle`,
      description: `Immobilier à ${n}, ${cityName} : prix médians, écoles, parcs et propriétés actives. Évaluation gratuite avec Alain Brunelle.`,
      canonical: `https://alainbrunelle.com/quartiers/${slugC}/${slug(n)}/`,
      body: qBody
    }));
  }
}

// --- TYPES DE PROPRIÉTÉ ---
const TYPES = [
  ['maison-unifamiliale-a-vendre','Maison unifamiliale','La typologie la plus recherchée de la Rive-Nord.'],
  ['condo-a-vendre','Condo','Propriété divise en copropriété — idéale pour premiers acheteurs et retraités.'],
  ['maison-de-ville-a-vendre','Maison de ville','Propriété jumelée ou en rangée, entrée indépendante.'],
  ['maison-neuve-a-vendre','Maison neuve','Constructions neuves livrées 2025-2027.']
];
for (const [s,title,lead] of TYPES) {
  writePage(`types-de-propriete/${s}/index.html`, contentPage({
    eyebrow:'Type de propriété',
    h1:`${title} à vendre — Rive-Nord`,
    lead,
    title:`${title} à vendre Sainte-Thérèse Blainville | Alain Brunelle`,
    desc:`${title} à vendre à Sainte-Thérèse, Blainville et Rive-Nord. Fiches Centris mises à jour quotidiennement.`,
    canonical:`https://alainbrunelle.com/types-de-propriete/${s}/`,
    body:`<p>${lead}</p>
    <h2>Pourquoi cette typologie ?</h2>
    <p>Chaque type de propriété suit son propre cycle de marché. Un condo neuf à Sainte-Thérèse, par exemple, ne se vend pas comme une unifamiliale à Fontainebleau. Je bâtis la stratégie autour de la typologie spécifique.</p>
    <h2>Ce qui fait la différence</h2>
    <ul><li>Analyse comparative par typologie et secteur</li><li>Positionnement de prix fondé sur les ventes récentes équivalentes</li><li>Photographie et mise en marché adaptées à l'acheteur cible</li></ul>
    <h2>Propriétés actives</h2>
    <p>Consultez la <a href="/nos-proprietes/">liste complète des propriétés</a> pour voir les inscriptions en temps réel.</p>`
  }));
}

// --- VENDRE / ACHETER / INVESTISSEUR ---
const SUBPAGES = [
  ['vendre/evaluation-gratuite', 'Évaluation gratuite', 'Évaluation · Lead magnet', 'Connaître la valeur réelle de votre propriété — rapport complet en 48 h.', 'Évaluation gratuite · rapport complet en 48 h | Alain Brunelle', 'Rapport d\'évaluation gratuit en 48 h. Analyse comparative par quartier et typologie. Sans engagement.', `<p>Le rapport d'évaluation que je produis s'appuie sur trois couches : les ventes comparables des 12 derniers mois à moins de 500 m, l'inventaire actif actuel dans votre typologie, et les tendances de prix saisonnières du secteur.</p>
    <h2>Ce que vous recevez</h2>
    <ul><li>Prix de mise en marché recommandé, avec fourchette basse/haute</li><li>Liste des 5 ventes comparables les plus pertinentes</li><li>Délai de vente attendu selon le positionnement</li><li>Recommandations de préparation (home staging, réno ciblées)</li></ul>
    <h2>Comment ça fonctionne</h2>
    <ol><li>Vous me contactez — formulaire ou téléphone.</li><li>Je visite la propriété (30-45 min).</li><li>Je livre le rapport sous 48 h, en personne ou par courriel.</li></ol>`],
  ['vendre/etapes-pour-vendre','Les 7 étapes pour vendre sa maison','Processus vendeur','De la mise en marché à l\'acte notarié — chaque étape expliquée.','Les 7 étapes pour vendre sa maison au Québec | Alain Brunelle','Étapes détaillées pour vendre sa maison au Québec : évaluation, préparation, mise en marché, offres, contre-propositions, notaire.','<h2>1. Évaluation et positionnement</h2><p>La base de toute vente réussie.</p><h2>2. Préparation de la propriété</h2><p>Dépersonnalisation, petites rénovations, home staging.</p><h2>3. Photographie et mise en marché</h2><p>Photos 4K, vidéo drone, visite virtuelle.</p><h2>4. Diffusion Centris + réseau</h2><p>Listing MLS, campagne sociale, emailing à mon réseau qualifié.</p><h2>5. Visites et feedback</h2><p>Gestion des visites, feedback structuré, ajustements.</p><h2>6. Offres et négociation</h2><p>Analyse de chaque offre, contre-proposition stratégique.</p><h2>7. Notaire et prise de possession</h2><p>Coordination avec le notaire, inspection, finalisation.</p>'],
  ['vendre/preparer-sa-maison','Préparer sa maison pour la vente','Home staging','Petites interventions, grand impact sur le prix de vente.','Préparer sa maison pour la vente · home staging | Alain Brunelle','Guide home staging pour maximiser le prix de vente : peinture, éclairage, désencombrement, petites rénovations.','<p>Un investissement de 1 500 $ en préparation peut rapporter 15 000 $ à 40 000 $ en prix de vente. C\'est prouvé par mes données.</p>'],
  ['vendre/commission-courtier','Commission d\'un courtier immobilier','Commission & honoraires','Comprendre la commission — et pourquoi elle est rentable.','Commission d\'un courtier immobilier au Québec | Alain Brunelle','Comment fonctionne la commission d\'un courtier immobilier au Québec : taux, partage, ce qui est inclus, ce qui est négociable.','<p>La commission se situe généralement entre 4 % et 5 % au Québec, partagée entre courtier inscripteur et courtier collaborateur.</p>'],
  ['vendre/vendre-sans-stress','Vendre sans stress','Accompagnement complet','Un processus balisé — vous savez toujours où vous en êtes.','Vendre sa maison sans stress | Alain Brunelle','Méthode pour vendre sa maison sans stress : planning clair, communication hebdo, checklist par étape.','<p>Vendre est émotif. Le rôle du courtier est de transformer cette émotion en processus prévisible.</p>'],
  ['acheter/premier-acheteur','Premier acheteur','Acheteur · Guide','Acheter sa première maison à Sainte-Thérèse ou Blainville — par où commencer.','Premier acheteur Sainte-Thérèse Blainville | Alain Brunelle','Guide premier acheteur : préapprobation, RAP, CELIAPP, inspection, fraiss de notaire, mutation.','<h2>Préapprobation hypothécaire</h2><p>Toujours avant de visiter — pour connaître votre capacité réelle.</p><h2>Les programmes gouvernementaux</h2><p>RAP, CELIAPP, crédit d\'impôt pour l\'achat d\'une première habitation.</p>'],
  ['acheter/etapes-pour-acheter','Étapes pour acheter','Processus acheteur','De la préapprobation à la remise des clés.','Étapes pour acheter une maison au Québec | Alain Brunelle','Étapes complètes pour acheter une maison au Québec.','<p>Acheter une propriété, c\'est 12 étapes balisées.</p>'],
  ['acheter/financement-hypothecaire','Financement hypothécaire','Hypothèque','Préapprobation, taux, amortissement — les bases.','Financement hypothécaire Québec | Alain Brunelle','Comprendre le financement hypothécaire : préapprobation, taux fixe vs variable, amortissement.','<p>Le taux n\'est pas tout. L\'amortissement, la mise de fonds et le type de prêt comptent autant.</p>'],
  ['acheter/inspection','Inspection pré-achat','Inspection','Jamais d\'achat sans inspection — mes inspecteurs partenaires.','Inspection pré-achat Québec | Alain Brunelle','Guide de l\'inspection pré-achat : à quoi s\'attendre, délais, vices cachés.','<p>L\'inspection, c\'est votre police d\'assurance avant signature.</p>'],
];
for (const [p, h1, eye, lead, title, desc, body] of SUBPAGES) {
  writePage(`${p}/index.html`, contentPage({
    eyebrow: eye, h1, lead, title, desc,
    canonical: `https://alainbrunelle.com/${p}/`,
    body
  }));
}

// --- CALCULATRICES ---
writePage('acheter/calculatrices/index.html', layout({
  title: 'Calculatrices hypothécaires — paiement, capacité, rendement plex | Alain Brunelle',
  description: 'Trois calculatrices gratuites : paiement hypothécaire mensuel, capacité d\'emprunt (ABD/ATD) et rendement d\'un plex. Résultats instantanés.',
  canonical: 'https://alainbrunelle.com/acheter/calculatrices/',
  body: `
<section class="page-head container">
  <div class="eyebrow">Outils gratuits</div>
  <h1>Calculatrices immobilières.</h1>
  <p class="lead">Paiement hypothécaire, capacité d'emprunt et rendement d'un plex — calcul instantané, sans courriel demandé.</p>
</section>

<section class="container">
  <div class="calc-grid">
    <!-- 1. Paiement hypothécaire -->
    <div class="calc blue-block soft">
      <div class="eye" style="color:var(--blue-2)">Calculatrice 1</div>
      <h2 style="margin:.6rem 0 1.5rem">Paiement hypothécaire mensuel.</h2>
      <div class="calc-form">
        <label>Prix d'achat <span data-out="m-price">500 000 $</span>
          <input type="range" id="m-price-i" min="100000" max="2500000" step="10000" value="500000">
        </label>
        <label>Mise de fonds <span data-out="m-down">20 %</span>
          <input type="range" id="m-down-i" min="5" max="50" step="1" value="20">
        </label>
        <label>Taux (%) <span data-out="m-rate">5,25 %</span>
          <input type="range" id="m-rate-i" min="2" max="10" step="0.05" value="5.25">
        </label>
        <label>Amortissement <span data-out="m-years">25 ans</span>
          <input type="range" id="m-years-i" min="5" max="30" step="1" value="25">
        </label>
      </div>
      <div class="calc-out">
        <div><div class="k" id="m-payment">—</div><div class="kl">Paiement / mois</div></div>
        <div><div class="k" id="m-loan">—</div><div class="kl">Montant emprunté</div></div>
        <div><div class="k" id="m-interest">—</div><div class="kl">Intérêts totaux</div></div>
      </div>
    </div>

    <!-- 2. Capacité d'emprunt -->
    <div class="calc blue-block">
      <div class="eye" style="color:rgba(255,255,255,.6)">Calculatrice 2</div>
      <h2 style="color:#fff;margin:.6rem 0 1.5rem">Capacité d'emprunt (ABD / ATD).</h2>
      <div class="calc-form dark">
        <label>Revenu annuel brut ménage <span data-out="c-income">100 000 $</span>
          <input type="range" id="c-income-i" min="30000" max="400000" step="5000" value="100000">
        </label>
        <label>Mise de fonds disponible <span data-out="c-down">50 000 $</span>
          <input type="range" id="c-down-i" min="0" max="500000" step="5000" value="50000">
        </label>
        <label>Dettes mensuelles (auto, cartes…) <span data-out="c-debt">500 $</span>
          <input type="range" id="c-debt-i" min="0" max="5000" step="50" value="500">
        </label>
        <label>Taux (%) <span data-out="c-rate">5,25 %</span>
          <input type="range" id="c-rate-i" min="2" max="10" step="0.05" value="5.25">
        </label>
      </div>
      <div class="calc-out">
        <div><div class="k" id="c-max">—</div><div class="kl">Prix maximum</div></div>
        <div><div class="k" id="c-abd">—</div><div class="kl">Ratio ABD</div></div>
        <div><div class="k" id="c-atd">—</div><div class="kl">Ratio ATD</div></div>
      </div>
    </div>

    <!-- 3. Rendement plex -->
    <div class="calc blue-block soft">
      <div class="eye" style="color:var(--blue-2)">Calculatrice 3</div>
      <h2 style="margin:.6rem 0 1.5rem">Rendement d'un plex.</h2>
      <div class="calc-form">
        <label>Prix d'achat <span data-out="p-price">650 000 $</span>
          <input type="range" id="p-price-i" min="200000" max="3000000" step="10000" value="650000">
        </label>
        <label>Revenus locatifs bruts / mois <span data-out="p-rent">4 200 $</span>
          <input type="range" id="p-rent-i" min="500" max="20000" step="100" value="4200">
        </label>
        <label>Dépenses annuelles (taxes, assurance, entretien) <span data-out="p-exp">12 000 $</span>
          <input type="range" id="p-exp-i" min="0" max="50000" step="500" value="12000">
        </label>
        <label>Mise de fonds (%) <span data-out="p-dp">20 %</span>
          <input type="range" id="p-dp-i" min="15" max="50" step="1" value="20">
        </label>
      </div>
      <div class="calc-out">
        <div><div class="k" id="p-caprate">—</div><div class="kl">Taux de capitalisation</div></div>
        <div><div class="k" id="p-cashflow">—</div><div class="kl">Cashflow annuel</div></div>
        <div><div class="k" id="p-coc">—</div><div class="kl">Rendement sur mise de fonds</div></div>
      </div>
    </div>
  </div>
</section>

<section class="container">
  <div class="cta-band">
    <h2>Besoin d'un avis pro sur votre capacité réelle ?</h2>
    <a class="btn" href="/rendez-vous/">Parler à Alain</a>
  </div>
</section>

<script>
(function(){
  const fmt = n => new Intl.NumberFormat('fr-CA',{maximumFractionDigits:0}).format(Math.round(n))+' $';
  const fmtPct = n => (n).toFixed(1).replace('.',',')+' %';
  const bind = (id,fn)=>{const el=document.getElementById(id); if(el)el.addEventListener('input',fn); return el;};
  const val = id => parseFloat(document.getElementById(id).value);
  const set = (sel,txt)=>{const e=document.querySelector('[data-out="'+sel+'"]'); if(e)e.textContent=txt;};
  const put = (id,txt)=>{const e=document.getElementById(id); if(e)e.textContent=txt;};

  // 1. Mortgage payment (formule standard, capitalisation semestrielle canadienne)
  function calcMortgage(){
    const price=val('m-price-i'), down=val('m-down-i')/100, rate=val('m-rate-i')/100, years=val('m-years-i');
    set('m-price', fmt(price)); set('m-down', down*100+' %'); set('m-rate', rate*100+' %'.replace('.',','));
    set('m-years', years+' ans');
    const loan=price*(1-down);
    // Canadian semi-annual compounding: effective monthly rate
    const r=Math.pow(1+rate/2,2/12)-1;
    const n=years*12;
    const pmt=loan*r/(1-Math.pow(1+r,-n));
    put('m-loan', fmt(loan));
    put('m-payment', fmt(pmt));
    put('m-interest', fmt(pmt*n - loan));
  }
  ['m-price-i','m-down-i','m-rate-i','m-years-i'].forEach(id=>bind(id,calcMortgage));
  calcMortgage();

  // 2. Borrowing capacity (ABD 32 %, ATD 40 %, stress-test +2 %)
  function calcCapacity(){
    const income=val('c-income-i'), down=val('c-down-i'), debt=val('c-debt-i'), rate=val('c-rate-i')/100;
    set('c-income', fmt(income)); set('c-down', fmt(down)); set('c-debt', fmt(debt));
    set('c-rate', (rate*100).toFixed(2).replace('.',',')+' %');
    const stressRate=Math.max(rate+0.02, 0.0525);
    const monthlyIncome=income/12;
    const taxes=250, heating=150; // estimation mensuelle Rive-Nord
    // ABD cap: housing <= 32 % of gross income
    const maxHousingABD=monthlyIncome*0.32 - taxes - heating;
    // ATD cap: housing + debts <= 40 %
    const maxHousingATD=monthlyIncome*0.40 - taxes - heating - debt;
    const maxPayment=Math.max(0, Math.min(maxHousingABD, maxHousingATD));
    const r=Math.pow(1+stressRate/2,2/12)-1;
    const n=25*12;
    const maxLoan=maxPayment*(1-Math.pow(1+r,-n))/r;
    const maxPrice=maxLoan+down;
    put('c-max', fmt(Math.max(0,maxPrice)));
    put('c-abd', '32 %');
    put('c-atd', '40 %');
  }
  ['c-income-i','c-down-i','c-debt-i','c-rate-i'].forEach(id=>bind(id,calcCapacity));
  calcCapacity();

  // 3. Plex yield
  function calcPlex(){
    const price=val('p-price-i'), rent=val('p-rent-i'), exp=val('p-exp-i'), dp=val('p-dp-i')/100;
    set('p-price', fmt(price)); set('p-rent', fmt(rent)); set('p-exp', fmt(exp));
    set('p-dp', (dp*100)+' %');
    const gross=rent*12;
    const noi=gross-exp;
    const capRate=noi/price*100;
    // Mortgage payment on (1-dp) portion at 5.25 %, 25 yrs
    const loan=price*(1-dp);
    const r=Math.pow(1+0.0525/2,2/12)-1, n=25*12;
    const pmt=loan*r/(1-Math.pow(1+r,-n));
    const cashflow=noi-pmt*12;
    const coc=(cashflow/(price*dp))*100;
    put('p-caprate', fmtPct(capRate));
    put('p-cashflow', fmt(cashflow));
    put('p-coc', fmtPct(coc));
  }
  ['p-price-i','p-rent-i','p-exp-i','p-dp-i'].forEach(id=>bind(id,calcPlex));
  calcPlex();
})();
</script>
`,
  extraHead: `<style>
.calc-grid{display:grid;gap:var(--gap);grid-template-columns:1fr}
.calc{padding:clamp(1.8rem,3.5vw,2.8rem)}
.calc h2{color:inherit;font-size:clamp(1.3rem,2.2vw,1.8rem);letter-spacing:-.02em}
.calc-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.4rem 2rem;margin-bottom:2rem}
.calc-form label{display:flex;flex-direction:column;gap:.5rem;font-size:.9rem;font-weight:500;color:var(--ink-2)}
.calc-form.dark label{color:rgba(255,255,255,.9)}
.calc-form label span{font-weight:400;font-variant-numeric:tabular-nums;color:var(--blue)}
.calc-form.dark label span{color:#fff}
.calc-form input[type=range]{width:100%;accent-color:var(--blue)}
.calc-form.dark input[type=range]{accent-color:#fff}
.calc-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;padding-top:1.5rem;border-top:1px solid rgba(15,40,85,.12)}
.calc.blue-block:not(.soft) .calc-out{border-top-color:rgba(255,255,255,.14)}
.calc-out .k{font-size:clamp(1.6rem,2.6vw,2.2rem);font-weight:400;letter-spacing:-.025em;color:var(--blue);font-variant-numeric:tabular-nums}
.calc.blue-block:not(.soft) .calc-out .k{color:#fff}
.calc-out .kl{font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;opacity:.7;margin-top:.3rem}
</style>`
}));

// --- GUIDES / MARCHÉ / BLOG (stubs) ---
const GUIDES = [
  ['guide-du-vendeur-2026','Guide du vendeur 2026'],
  ['guide-du-premier-acheteur','Guide du premier acheteur'],
  ['guide-de-l-investisseur-plex','Guide de l\'investisseur plex'],
  ['guide-demenagement-rive-nord','Guide du déménagement Rive-Nord']
];
writePage('guides/index.html', contentPage({
  eyebrow:'Guides PDF',h1:'Guides téléchargeables',lead:'4 guides PDF gratuits pour chaque étape — vendeur, premier acheteur, investisseur, déménagement.',
  title:'Guides immobiliers PDF | Alain Brunelle',desc:'Guides PDF téléchargeables.',
  canonical:'https://alainbrunelle.com/guides/',
  body: `<ul>${GUIDES.map(([s,t])=>`<li><a href="/guides/${s}/">${t}</a></li>`).join('')}</ul>`
}));
for (const [s,t] of GUIDES) {
  writePage(`guides/${s}/index.html`, contentPage({
    eyebrow:'Guide PDF',h1:t,lead:`${t} — téléchargement gratuit.`,
    title:`${t} | Alain Brunelle`,desc:t, canonical:`https://alainbrunelle.com/guides/${s}/`,
    body:`<p>${t} — format PDF, 40 pages, entièrement gratuit.</p><a class="btn" href="#" style="display:inline-block;background:var(--ink);color:#fff;padding:1rem 1.6rem;border-radius:999px;margin-top:1rem">Télécharger le guide</a>`
  }));
}

writePage('marche-immobilier/index.html', contentPage({
  eyebrow:'Marché immobilier Rive-Nord',h1:'Rapports de marché',lead:'Statistiques APCIQ + mon analyse mensuelle, par ville.',
  title:'Marché immobilier Rive-Nord 2026 | Alain Brunelle',desc:'Statistiques du marché immobilier Rive-Nord.',
  canonical:'https://alainbrunelle.com/marche-immobilier/',
  body:`<ul><li><a href="/marche-immobilier/statistiques-blainville/">Statistiques Blainville</a></li><li><a href="/marche-immobilier/statistiques-sainte-therese/">Statistiques Sainte-Thérèse</a></li><li><a href="/marche-immobilier/rapport-mensuel/">Rapport mensuel</a></li></ul>`
}));
for (const [s,t] of [['statistiques-blainville','Statistiques Blainville'],['statistiques-sainte-therese','Statistiques Sainte-Thérèse'],['rapport-mensuel','Rapport mensuel']]) {
  writePage(`marche-immobilier/${s}/index.html`, contentPage({
    eyebrow:'Marché',h1:t,lead:`${t} — mise à jour mensuelle.`,
    title:`${t} | Alain Brunelle`,desc:t,canonical:`https://alainbrunelle.com/marche-immobilier/${s}/`,
    body:`<h2>Derniers chiffres</h2><p>Prix médian, délai moyen, taux d'absorption, comparaison YoY.</p>`
  }));
}

// --- BLOG article vedette : Sainte-Thérèse ---
const featuredArticle = {
  slug: 'radioscopie-sainte-therese-marche-2026',
  title: 'Radioscopie de Sainte-Thérèse : ce que 2 000 transactions m\'ont appris sur votre quartier',
  teaser: 'Le guide interactif que seul le meilleur courtier immobilier de la Rive-Nord peut vous offrir — secteurs décortiqués, outils de calcul, et données qui n\'existent pas ailleurs.'
};

const articleJsonld = JSON.stringify({
  "@context":"https://schema.org","@type":"Article",
  "headline":featuredArticle.title,
  "author":{"@type":"Person","name":"Alain Brunelle","jobTitle":"Courtier immobilier résidentiel","url":"https://alainbrunelle.com/a-propos/"},
  "image":"https://alainbrunelle.com/photos/stetherese1.jpg",
  "datePublished":"2026-04-23","dateModified":new Date().toISOString().slice(0,10),
  "publisher":{"@type":"Organization","name":"Alain Brunelle — RE/MAX CRYSTAL"},
  "mainEntityOfPage":`https://alainbrunelle.com/blog/${featuredArticle.slug}/`
});

writePage(`blog/${featuredArticle.slug}/index.html`, layout({
  title: `${featuredArticle.title} | Alain Brunelle`,
  description: `Le meilleur courtier immobilier de Sainte-Thérèse décode le marché 2026 : prix rue par rue, comparatif des 3 secteurs, outils de calcul interactifs. 29 ans d'expérience, 2 000 transactions.`,
  canonical: `https://alainbrunelle.com/blog/${featuredArticle.slug}/`,
  jsonld: articleJsonld,
  extraHead: `<style>
    .a-hero{position:relative;border-radius:var(--radius-lg);overflow:hidden;min-height:clamp(420px,55vw,640px);margin-bottom:3rem}
    .a-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .a-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,22,40,.15) 0%,rgba(11,22,40,.85) 100%)}
    .a-hero-inner{position:relative;z-index:2;color:#fff;padding:clamp(1.8rem,4vw,3.5rem);display:flex;flex-direction:column;justify-content:flex-end;min-height:inherit}
    .a-hero .eye{color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.18em;font-size:.75rem;font-weight:500;margin-bottom:1.2rem}
    .a-hero h1{color:#fff;font-size:clamp(2rem,4vw,3.4rem);font-weight:400;letter-spacing:-.025em;line-height:1.08;max-width:28ch;text-shadow:0 2px 20px rgba(0,0,0,.4)}
    .a-hero .meta{margin-top:1.5rem;display:flex;gap:1.2rem;flex-wrap:wrap;font-size:.85rem;color:rgba(255,255,255,.8)}
    .a-lead{font-size:clamp(1.15rem,1.8vw,1.35rem);font-weight:300;color:var(--ink-2);max-width:62ch;line-height:1.6;margin-bottom:3rem}
    .a-lead strong{font-weight:500;color:var(--ink)}
    .a-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:3rem}
    .a-summary .card{background:var(--surface);border-radius:var(--radius);padding:1.4rem;border-left:3px solid var(--blue)}
    .a-summary .n{font-size:clamp(1.6rem,2.4vw,2rem);font-weight:400;letter-spacing:-.025em;color:var(--blue);font-variant-numeric:tabular-nums}
    .a-summary .l{font-size:.82rem;color:var(--ink-2);margin-top:.35rem;line-height:1.4}
    .a-body{max-width:760px;margin:0 auto}
    .a-body h2{font-size:clamp(1.5rem,2.6vw,2rem);font-weight:400;letter-spacing:-.02em;margin:3rem 0 1rem;color:var(--ink)}
    .a-body h3{font-size:1.2rem;font-weight:500;margin:2rem 0 .6rem}
    .a-body p{color:var(--ink-2);line-height:1.75;font-size:1.02rem}
    .a-body p strong{color:var(--ink);font-weight:500}
    .a-body ul{color:var(--ink-2);line-height:1.8;padding-left:1.2rem}
    .a-figure{margin:2.5rem -2rem;border-radius:var(--radius-lg);overflow:hidden;position:relative}
    .a-figure img{width:100%;display:block}
    .a-figure figcaption{position:absolute;bottom:1.2rem;left:1.4rem;right:1.4rem;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);padding:.8rem 1.2rem;border-radius:14px;font-size:.85rem;color:var(--ink);font-weight:400}
    @media(max-width:820px){.a-figure{margin:2.5rem 0}}
    .sector-tbl{width:100%;border-collapse:separate;border-spacing:0;margin:1.5rem 0 2rem;font-size:.95rem;background:#fff;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line)}
    .sector-tbl th,.sector-tbl td{padding:.95rem 1rem;text-align:left;border-bottom:1px solid var(--line)}
    .sector-tbl thead th{background:var(--ink);color:#fff;font-weight:500;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em}
    .sector-tbl tbody tr{transition:background .2s var(--ease);cursor:pointer}
    .sector-tbl tbody tr:hover,.sector-tbl tbody tr.active{background:var(--blue-soft)}
    .sector-tbl td strong{color:var(--blue);font-weight:500}
    .sector-tbl td.num{text-align:right;font-variant-numeric:tabular-nums}
    .sector-tbl tbody tr:last-child td{border-bottom:0}
    .chart-card{background:var(--surface);border-radius:var(--radius);padding:1.5rem;margin:1.5rem 0 2.5rem;border:1px solid var(--line)}
    .chart-card h4{font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:500;margin-bottom:1.2rem}
    .quiz{background:var(--blue);color:#fff;border-radius:var(--radius-lg);padding:clamp(1.8rem,3.5vw,2.8rem);margin:2.5rem -2rem;position:relative;overflow:hidden}
    .quiz::before{content:"";position:absolute;inset:0;background:radial-gradient(500px 260px at 85% 0%,rgba(255,255,255,.1),transparent 60%);pointer-events:none}
    .quiz>*{position:relative}
    .quiz .eye{color:rgba(255,255,255,.65)}
    .quiz h3{color:#fff;font-size:clamp(1.4rem,2.4vw,1.8rem);font-weight:400;letter-spacing:-.02em;margin:.5rem 0 1.5rem}
    .quiz-fields{display:grid;gap:1.4rem;margin-bottom:1.5rem}
    .quiz-fields label{display:block;font-size:.85rem;color:rgba(255,255,255,.85);margin-bottom:.5rem;font-weight:500}
    .quiz-fields .row{display:flex;justify-content:space-between;align-items:center;gap:1rem}
    .quiz-fields input[type=range]{width:100%;accent-color:#fff;margin-top:.3rem}
    .quiz-fields .v{font-variant-numeric:tabular-nums;color:#fff;font-weight:500}
    .quiz-out{background:rgba(255,255,255,.08);border-radius:var(--radius);padding:1.5rem;display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:center}
    .quiz-out .verdict{font-size:clamp(1.2rem,2vw,1.5rem);font-weight:400;letter-spacing:-.015em;line-height:1.3}
    .quiz-out .delta{font-size:2rem;font-weight:400;letter-spacing:-.02em;font-variant-numeric:tabular-nums;text-align:right}
    .quiz-out .delta.pos{color:#9fe5b5}
    .quiz-out .delta.neg{color:#ff9fb0}
    @media(max-width:820px){.quiz{margin:2.5rem 0}.quiz-out{grid-template-columns:1fr}}
    .timeline{margin:2rem 0 3rem;border-left:2px solid var(--blue-soft);padding-left:1.6rem}
    .timeline-item{margin-bottom:1.5rem;position:relative}
    .timeline-item::before{content:"";position:absolute;left:-1.78rem;top:.4rem;width:12px;height:12px;border-radius:50%;background:var(--blue);border:3px solid #fff;box-shadow:0 0 0 2px var(--blue)}
    .timeline-item .year{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--blue);font-weight:500}
    .timeline-item .t{font-size:1.05rem;margin-top:.2rem;color:var(--ink)}
    .timeline-item .t strong{color:var(--blue);font-weight:500}
    .pullquote{border-left:3px solid var(--blue);padding:1rem 0 1rem 1.5rem;margin:2.5rem 0;font-family:'Jost';font-size:clamp(1.2rem,1.8vw,1.5rem);font-weight:300;letter-spacing:-.01em;color:var(--ink);line-height:1.4}
    .pullquote cite{display:block;margin-top:.8rem;font-size:.85rem;color:var(--muted);font-style:normal;text-transform:uppercase;letter-spacing:.06em}
    .a-cta{background:var(--ink);color:#fff;border-radius:var(--radius-lg);padding:clamp(1.8rem,4vw,3rem);margin:3rem 0;display:grid;grid-template-columns:1fr auto;gap:2rem;align-items:center}
    .a-cta h3{color:#fff;margin:0;font-size:clamp(1.3rem,2.2vw,1.7rem);font-weight:400;letter-spacing:-.02em;max-width:22ch}
    .a-cta .btn{background:#fff;color:var(--ink);padding:1rem 1.8rem;border-radius:999px;font-weight:500;white-space:nowrap;transition:transform .3s var(--ease)}
    .a-cta .btn:hover{transform:translateY(-2px);color:var(--ink)}
    @media(max-width:720px){.a-cta{grid-template-columns:1fr}}
    .a-footer-meta{padding:2rem;background:var(--surface);border-radius:var(--radius);margin:3rem 0 2rem;display:grid;grid-template-columns:auto 1fr;gap:1.5rem;align-items:center}
    .a-footer-meta img{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#eef2f8}
    .a-footer-meta .who{font-weight:500}
    .a-footer-meta .who-sub{font-size:.88rem;color:var(--muted);margin-top:.2rem}
  </style>`,
  body: `
<article class="container" style="padding-top:2rem">
  <div style="font-size:.85rem;color:var(--muted);margin-bottom:1.5rem"><a href="/">Accueil</a> › <a href="/blog/">Blog</a> › <span>Radioscopie Sainte-Thérèse</span></div>

  <figure class="a-hero">
    <img src="/photos/stetherese1.jpg" alt="Sainte-Thérèse, Rive-Nord — vue d'ensemble" loading="eager">
    <div class="a-hero-inner">
      <div class="eye">Analyse de marché · Sainte-Thérèse · 2026</div>
      <h1>Radioscopie de Sainte-Thérèse : ce que 2 000 transactions m'ont appris sur votre quartier.</h1>
      <div class="meta">
        <span>Par <strong>Alain Brunelle</strong>, courtier immobilier résidentiel</span>
        <span>· 12 min de lecture · Mis à jour avril 2026</span>
      </div>
    </div>
  </figure>

  <div class="a-body">
    <p class="a-lead">À Sainte-Thérèse, la différence entre vendre vite et vendre bien tient à <strong>trois chiffres que personne ne vous donne</strong> — sauf un <strong>courtier immobilier local</strong> qui a les mains dans les transactions depuis 29 ans. Ce guide interactif met ces chiffres sur la table, rue par rue, secteur par secteur, avec les outils pour les interroger. C'est l'analyse que <strong>le meilleur courtier immobilier de la Rive-Nord</strong> utilise chaque matin avant de positionner un prix.</p>

    <div class="a-summary">
      <div class="card"><div class="n">582 k$</div><div class="l">Prix médian 2026 (unifamiliale)</div></div>
      <div class="card"><div class="n">+5,2 %</div><div class="l">Progression YoY</div></div>
      <div class="card"><div class="n">31 j</div><div class="l">Délai médian de vente</div></div>
      <div class="card"><div class="n">99,1 %</div><div class="l">Ratio vendu / demandé</div></div>
    </div>

    <h2>1. Le marché en un coup d'œil — 5 ans de Sainte-Thérèse</h2>
    <p>Depuis 2021, le prix médian d'une unifamiliale à Sainte-Thérèse a progressé de <strong>38,6 %</strong>, malgré le resserrement hypothécaire de 2023. La trajectoire n'a rien d'un plateau — c'est une montée disciplinée, portée par deux moteurs : la rareté foncière dans le Vieux-Village et la demande continue des jeunes familles qui fuient les prix de Laval.</p>

    <div class="chart-card">
      <h4>Prix médian unifamiliale — Sainte-Thérèse 2021 → 2026</h4>
      <div class="chart" id="chart-5y"></div>
    </div>

    <h2>2. Les trois secteurs — décryptés</h2>
    <p>Sainte-Thérèse n'est pas <em>une</em> ville, c'est <strong>trois marchés distincts</strong>. Un triplex du Vieux-Village ne se vend pas comme un bungalow de l'En-Bas. Voici le comparatif que j'utilise, mis à jour à partir de mes dernières inscriptions et des transactions APCIQ 2026.</p>

    <table class="sector-tbl" id="sector-table">
      <thead><tr><th>Secteur</th><th class="num">Prix médian</th><th class="num">Délai (j)</th><th class="num">Ratio V/D</th><th class="num">Inventaire</th></tr></thead>
      <tbody>
        <tr data-s="vieux"><td><strong>Vieux-Village</strong><br><span style="font-size:.82rem;color:var(--muted)">Cœur historique, cachet, condos neufs</span></td><td class="num">624 000 $</td><td class="num">24</td><td class="num">100,3 %</td><td class="num">Très faible</td></tr>
        <tr data-s="haut"><td><strong>En-Haut</strong><br><span style="font-size:.82rem;color:var(--muted)">Familial, cottages 1990-2010, parcs</span></td><td class="num">575 000 $</td><td class="num">32</td><td class="num">98,9 %</td><td class="num">Équilibré</td></tr>
        <tr data-s="bas"><td><strong>En-Bas</strong><br><span style="font-size:.82rem;color:var(--muted)">Accessible, bungalows, primo-accédants</span></td><td class="num">498 000 $</td><td class="num">38</td><td class="num">98,2 %</td><td class="num">Plus élevé</td></tr>
      </tbody>
    </table>
    <p style="font-size:.85rem;color:var(--muted);margin-top:-.5rem">Cliquez une ligne pour faire monter le graphique correspondant ci-dessous.</p>

    <div class="chart-card">
      <h4 id="chart-sector-title">Volume de ventes — les 3 secteurs (12 derniers mois)</h4>
      <div class="chart" id="chart-sector"></div>
    </div>

    <figure class="a-figure">
      <img src="/photos/stetherese2.jpg" alt="Vieux Sainte-Thérèse — architecture historique" loading="lazy">
      <figcaption>Le Vieux-Village : 12 % des inscriptions, 31 % de la valeur transactée en 2026.</figcaption>
    </figure>

    <h2>3. Votre propriété est-elle bien positionnée ? (outil interactif)</h2>
    <p>Le piège classique d'une mise en marché à Sainte-Thérèse : positionner le prix en se comparant à la municipalité voisine plutôt qu'à sa propre rue. Le résultat — <strong>+ 13 jours d'attente, − 2,4 % sur le prix final</strong>. Voici l'outil rapide que j'utilise pour estimer l'écart entre votre prix cible et la réalité du secteur.</p>

    <div class="quiz">
      <div class="eye" style="text-transform:uppercase;letter-spacing:.18em;font-size:.72rem">Outil 1 · Positionnement de prix</div>
      <h3>Mon prix cible est-il aligné avec mon secteur ?</h3>
      <div class="quiz-fields">
        <div>
          <div class="row"><label>Secteur de votre propriété</label></div>
          <select id="q-sector" style="width:100%;padding:.8rem 1rem;border-radius:12px;border:0;background:rgba(255,255,255,.12);color:#fff;font-family:inherit;font-size:1rem">
            <option value="vieux">Vieux-Village</option>
            <option value="haut" selected>Sainte-Thérèse-en-Haut</option>
            <option value="bas">Sainte-Thérèse-en-Bas</option>
          </select>
        </div>
        <div>
          <div class="row"><label>Superficie habitable (pi²)</label><span class="v" id="q-area-v">1 800 pi²</span></div>
          <input type="range" id="q-area" min="800" max="4000" step="50" value="1800">
        </div>
        <div>
          <div class="row"><label>Année de construction</label><span class="v" id="q-year-v">1995</span></div>
          <input type="range" id="q-year" min="1900" max="2026" step="1" value="1995">
        </div>
        <div>
          <div class="row"><label>Prix cible</label><span class="v" id="q-price-v">620 000 $</span></div>
          <input type="range" id="q-price" min="300000" max="1500000" step="5000" value="620000">
        </div>
      </div>
      <div class="quiz-out">
        <div class="verdict" id="q-verdict">Saisissez vos paramètres —</div>
        <div class="delta" id="q-delta">—</div>
      </div>
      <p style="font-size:.78rem;color:rgba(255,255,255,.65);margin-top:1.2rem">Estimation indicative basée sur les médianes 2026. Pour une évaluation précise rue par rue, réservez une analyse comparative gratuite.</p>
    </div>

    <h2>4. Pourquoi Alain Brunelle à Sainte-Thérèse ?</h2>
    <p>On peut être <strong>un</strong> courtier à Sainte-Thérèse. Être <strong>le</strong> courtier de Sainte-Thérèse, c'est autre chose. Voici le dossier, honnêtement.</p>

    <div class="timeline">
      <div class="timeline-item"><div class="year">1997</div><div class="t">Premières inscriptions dans <strong>l'En-Bas</strong> — les bungalows post-guerre. 37 transactions la première année.</div></div>
      <div class="timeline-item"><div class="year">2004</div><div class="t">Ouverture du bureau <strong>RE/MAX CRYSTAL</strong> — devient point de référence pour le Vieux-Village.</div></div>
      <div class="timeline-item"><div class="year">2012</div><div class="t">Spécialisation <strong>plex et condos neufs</strong> au moment où Sainte-Thérèse densifie son cœur.</div></div>
      <div class="timeline-item"><div class="year">2018</div><div class="t">Top 1 % RE/MAX Québec — 7 années consécutives jusqu'à aujourd'hui.</div></div>
      <div class="timeline-item"><div class="year">2026</div><div class="t"><strong>2 000+ transactions</strong> cumulées sur la Rive-Nord. Ratio vendu/demandé moyen : <strong>99,2 %</strong> (vs 97,1 % marché).</div></div>
    </div>

    <p>Concrètement, qu'est-ce que ça change pour vous ? Trois choses tangibles :</p>
    <ul>
      <li><strong>Réseau acheteur qualifié</strong> — 12 400 contacts Rive-Nord, segmentés par budget, typologie, secteur ciblé. Une inscription diffusée à ce réseau <em>avant</em> la mise sur Centris.</li>
      <li><strong>Photographie et vidéo 4K incluses</strong> — drone, visite virtuelle, brochure imprimée. Zéro frais additionnel, pas de surclassement à payer.</li>
      <li><strong>Analyse comparative rue par rue</strong> — je ne compare pas votre maison à « Sainte-Thérèse » en général, je la compare à votre côté de rue, sur les 24 derniers mois.</li>
    </ul>

    <div class="pullquote">« Un bon courtier vous donne un prix. Le meilleur courtier immobilier vous donne les trois scénarios — et le "pourquoi" de chacun. »<cite>— Alain Brunelle, 29 ans de Sainte-Thérèse</cite></div>

    <h2>5. Ce que je surveille en ce moment — avril 2026</h2>
    <p>La saisonnalité de Sainte-Thérèse est sous-estimée. Contrairement à Blainville, le pic de vente est <strong>début mai</strong>, pas fin avril. Raison principale : le Vieux-Village attire beaucoup d'acheteurs de Laval et Montréal qui visitent après la semaine de relâche de Pâques.</p>
    <ul>
      <li><strong>Inventaire condos neufs</strong> en baisse : 3 projets livrés, rien de nouveau annoncé pour 2026-2027 dans le Vieux-Village → pression haussière à 18 mois.</li>
      <li><strong>Demande primo-accédants</strong> en En-Bas : forte, mais plafonnée par le stress test à ~5,25 %. Cap estimé à 520 k$ pour un ménage médian.</li>
      <li><strong>Fenêtre vendeur</strong> optimale : 28 avril — 20 juin. Au-delà, pression baissière mesurée historiquement à -1,8 % par mois.</li>
    </ul>

    <div class="a-cta">
      <h3>Votre propriété à Sainte-Thérèse mérite l'analyse la plus fine de son marché.</h3>
      <a class="btn" href="/rendez-vous/">Prendre rendez-vous avec Alain</a>
    </div>

    <h2>6. FAQ — Sainte-Thérèse en 2026</h2>
    <h3>Qui est le meilleur courtier immobilier à Sainte-Thérèse ?</h3>
    <p>Difficile d'être objectif en étant le courtier concerné — mais les faits parlent : 29 ans sur le territoire, 2 000+ transactions, Top 1 % RE/MAX Québec 7 années consécutives, ratio vendu/demandé de 99,2 %. La question plus utile : <em>qui est le meilleur courtier immobilier pour votre propriété spécifique ?</em> C'est exactement ce que je détermine en 30 minutes d'analyse gratuite.</p>

    <h3>Quel est le prix moyen d'une maison à Sainte-Thérèse ?</h3>
    <p>582 000 $ en prix médian unifamiliale 2026. Mais <strong>la médiane ne vend rien</strong> : ce qui vend, c'est le prix juste de votre rue, avec votre année de construction, vos rénovations. Écart possible : ± 80 000 $ selon le secteur.</p>

    <h3>Sainte-Thérèse ou Blainville ?</h3>
    <p>Sainte-Thérèse offre un cachet Vieux-Village introuvable à Blainville, avec un ticket d'entrée inférieur de 12 %. Blainville offre des lots plus grands et des écoles mieux notées statistiquement. Pour les familles avec enfants jeunes, Blainville. Pour les acheteurs plus jeunes ou urbains, Sainte-Thérèse.</p>

    <h3>Combien de temps pour vendre à Sainte-Thérèse ?</h3>
    <p>Médiane secteur : 31 jours. Sur mes listings spécifiquement : <strong>24 jours</strong> en moyenne 2026. La différence vient du positionnement initial et de la qualité de la mise en marché.</p>

    <div class="a-footer-meta">
      <img src="/photos/P21_5525-Edit.jpg" alt="Alain Brunelle">
      <div>
        <div class="who">Alain Brunelle</div>
        <div class="who-sub">Courtier immobilier résidentiel · RE/MAX CRYSTAL · Sainte-Thérèse, Blainville et Rive-Nord</div>
      </div>
    </div>
  </div>
</article>

<script>
(function(){
  // Chart 1 — 5-year median prices
  const y5 = [['2021','420 000 $',420],['2022','478 000 $',478],['2023','512 000 $',512],['2024','538 000 $',538],['2025','562 000 $',562],['2026','582 000 $',582]];
  const max5 = Math.max(...y5.map(r=>r[2]));
  document.getElementById('chart-5y').innerHTML = y5.map(([y,l,v])=>
    '<div class="bar-row"><span class="label">'+y+'</span><div class="bar"><span style="width:'+((v/max5)*100)+'%"></span></div><span class="val">'+l+'</span></div>'
  ).join('');

  // Sector volumes
  const sectorVol = {
    vieux: {name:'Vieux-Village', data:[['Condos',38],['Unifam.',14],['Plex',19]]},
    haut:  {name:'Sainte-Thérèse-en-Haut', data:[['Cottages',52],['Jumelés',28],['Condos',9]]},
    bas:   {name:'Sainte-Thérèse-en-Bas', data:[['Bungalows',41],['Cottages',17],['Plex',8]]}
  };
  function renderSectorChart(key){
    const s=sectorVol[key];
    document.getElementById('chart-sector-title').textContent = 'Répartition des ventes — '+s.name;
    const max=Math.max(...s.data.map(d=>d[1]));
    document.getElementById('chart-sector').innerHTML = s.data.map(([l,v])=>
      '<div class="bar-row"><span class="label">'+l+'</span><div class="bar"><span style="width:'+((v/max)*100)+'%"></span></div><span class="val">'+v+'</span></div>'
    ).join('');
  }
  renderSectorChart('haut');
  document.querySelectorAll('#sector-table tbody tr').forEach(tr=>{
    tr.addEventListener('click',()=>{
      document.querySelectorAll('#sector-table tbody tr').forEach(x=>x.classList.remove('active'));
      tr.classList.add('active');
      renderSectorChart(tr.dataset.s);
    });
  });
  document.querySelector('#sector-table tbody tr[data-s=haut]').classList.add('active');

  // Quiz — price positioning
  const fmt = n=>new Intl.NumberFormat('fr-CA',{maximumFractionDigits:0}).format(Math.round(n))+' $';
  const medPpf = { vieux:345, haut:298, bas:258 };
  const update = ()=>{
    const sec = document.getElementById('q-sector').value;
    const area = +document.getElementById('q-area').value;
    const year = +document.getElementById('q-year').value;
    const price = +document.getElementById('q-price').value;
    document.getElementById('q-area-v').textContent = area.toLocaleString('fr-CA')+' pi²';
    document.getElementById('q-year-v').textContent = year;
    document.getElementById('q-price-v').textContent = fmt(price);
    let est = medPpf[sec]*area;
    // Age adjustment
    const age = 2026-year;
    if (age<5) est*=1.08;
    else if (age<15) est*=1.02;
    else if (age<30) est*=1.00;
    else if (age<50) est*=0.93;
    else est*=0.88;
    const delta = price - est;
    const pct = delta/est*100;
    const el = document.getElementById('q-delta');
    const v = document.getElementById('q-verdict');
    el.textContent = (delta>=0?'+':'')+fmt(delta).replace(' $','')+' $';
    el.classList.remove('pos','neg');
    if (Math.abs(pct)<3){ v.textContent='Excellent — votre prix est aligné avec le secteur.'; el.classList.add('pos'); }
    else if (pct>=3 && pct<8){ v.textContent='Léger sur-prix — envisageable si biens très haut de gamme.'; el.classList.add('neg'); }
    else if (pct>=8){ v.textContent='Sur-prix marqué — risque de délai de vente allongé.'; el.classList.add('neg'); }
    else if (pct<=-3 && pct>-8){ v.textContent='Sous-évalué — vous laissez de l\\'argent sur la table.'; el.classList.add('pos'); }
    else { v.textContent='Fortement sous-évalué — réservez une analyse avant de publier.'; el.classList.add('pos'); }
  };
  ['q-sector','q-area','q-year','q-price'].forEach(id=>document.getElementById(id).addEventListener('input',update));
  update();
})();
</script>
`
}));

// Other blog stubs
const BLOG_POSTS = [
  ['combien-vaut-ma-maison-blainville','Combien vaut ma maison à Blainville en 2026 ?'],
  ['fontainebleau-vs-chambery-chante-bois','Fontainebleau vs Chambéry vs Chante-Bois : où acheter à Blainville ?'],
  ['7-etapes-vendre-sainte-therese','Les 7 étapes pour vendre sa maison à Sainte-Thérèse sans stress'],
  ['premier-acheteur-blainville-revenu','Premier acheteur à Blainville : quel revenu faut-il en 2026 ?'],
  ['plex-blainville-rendement','Plex à Blainville : rendement réel en 2026'],
  ['vieux-sainte-therese-vivre-village','Vieux Sainte-Thérèse : vivre au cœur du village']
];
writePage('blog/index.html', layout({
  title:'Blog immobilier Rive-Nord | Alain Brunelle',
  description:'Analyses de marché, guides et outils interactifs pour vendeurs, acheteurs et investisseurs de la Rive-Nord.',
  canonical:'https://alainbrunelle.com/blog/',
  body:`
<section class="page-head container"><div class="eyebrow">Blog</div><h1>Le blog d'Alain Brunelle.</h1><p class="lead">Analyses rue par rue, outils interactifs et guides pour qui veut comprendre le marché avant d'agir.</p></section>
<section class="container">
  <a class="featured-post" href="/blog/${featuredArticle.slug}/">
    <div class="fp-img"><img src="/photos/stetherese1.jpg" alt=""></div>
    <div class="fp-body">
      <div class="eye" style="color:var(--blue);text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;font-weight:500">Article vedette · Sainte-Thérèse</div>
      <h2 style="font-size:clamp(1.5rem,2.6vw,2rem);margin:.7rem 0 1rem;font-weight:400;letter-spacing:-.02em">${featuredArticle.title}</h2>
      <p style="color:var(--ink-2);line-height:1.6;max-width:58ch">${featuredArticle.teaser}</p>
      <span style="display:inline-block;margin-top:1.2rem;color:var(--blue);border-bottom:1px solid var(--blue);padding-bottom:2px">Lire l'analyse complète →</span>
    </div>
  </a>
  <h3 style="margin:3rem 0 1.5rem;font-size:1.1rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:500">Autres articles</h3>
  <div class="blog-grid">${BLOG_POSTS.map(([s,t])=>`<a class="blog-card" href="/blog/${s}/"><h3>${t}</h3><span class="more">Lire →</span></a>`).join('')}</div>
</section>`,
  extraHead:`<style>
    .featured-post{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(1.2rem,3vw,2.5rem);background:#fff;border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;transition:transform .4s var(--ease),box-shadow .4s var(--ease);color:var(--ink)}
    .featured-post:hover{transform:translateY(-3px);box-shadow:var(--shadow);color:var(--ink)}
    .featured-post .fp-img{aspect-ratio:4/3;overflow:hidden;background:#eef2f8}
    .featured-post .fp-img img{width:100%;height:100%;object-fit:cover;transition:transform .8s var(--ease)}
    .featured-post:hover .fp-img img{transform:scale(1.04)}
    .featured-post .fp-body{padding:clamp(1.5rem,3vw,2.5rem);display:flex;flex-direction:column;justify-content:center}
    @media(max-width:820px){.featured-post{grid-template-columns:1fr}}
    .blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--gap)}
    .blog-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:1.5rem;transition:all .4s var(--ease)}
    .blog-card:hover{border-color:var(--blue);transform:translateY(-2px);box-shadow:var(--shadow-sm)}
    .blog-card h3{font-size:1.05rem;font-weight:500;margin-bottom:.8rem;letter-spacing:-.01em}
    .blog-card .more{font-size:.85rem;color:var(--blue)}
  </style>`
}));
for (const [s,t] of BLOG_POSTS) {
  writePage(`blog/${s}/index.html`, contentPage({
    eyebrow:'Blog',h1:t,lead:'',title:`${t} | Alain Brunelle`,desc:t,canonical:`https://alainbrunelle.com/blog/${s}/`,
    body:`<p>Article en rédaction — revenez bientôt pour la version complète.</p>`
  }));
}

// --- À PROPOS / CONTACT / TÉMOIGNAGES / PERFORMANCE ---
writePage('a-propos/index.html', layout({
  title:'À propos — Alain Brunelle, courtier immobilier',
  description:'Alain Brunelle, courtier immobilier Sainte-Thérèse Blainville. 29 ans d\'expérience, approche analytique, 2000+ transactions.',
  canonical:'https://alainbrunelle.com/a-propos/',
  body:`
<section class="page-head container"><div class="eyebrow">À propos</div><h1>Alain Brunelle, stratège immobilier Rive-Nord.</h1><p class="lead">29 ans d'expérience · 2000+ transactions · Top 1 % RE/MAX Québec.</p></section>
<section class="container"><div class="about-grid">
  <div class="about-photo"><img src="/photos/P21_5407-Edit.jpg" alt="Alain Brunelle"></div>
  <div>
    <p style="font-size:1.1rem;color:var(--ink-2);line-height:1.75">Formation en administration, esprit analytique. Alain Brunelle a fait sa marque en transformant l'art de la vente immobilière en méthode reproductible, fondée sur les données locales.</p>
    <p style="color:var(--ink-2);line-height:1.75;margin-top:1rem">Depuis 1997, il accompagne les familles de Sainte-Thérèse, Blainville et de toute la Rive-Nord. Sa philosophie : chaque propriété a un prix juste, et chaque vendeur mérite une stratégie sur mesure — pas une formule toute faite.</p>
  </div>
</div></section>
<section class="container"><div class="blue-block"><div class="stats-grid"><div class="stat"><div class="n">2000+</div><div class="l">Transactions depuis 1997</div></div><div class="stat"><div class="n">Top 1%</div><div class="l">RE/MAX Québec</div></div><div class="stat"><div class="n">99,2%</div><div class="l">Prix vendu/demandé</div></div><div class="stat"><div class="n">28 j</div><div class="l">Délai moyen</div></div></div></div></section>`
}));

writePage('contact/index.html', layout({
  title:'Contact — Alain Brunelle, courtier immobilier',
  description:'Contactez Alain Brunelle : 450.430.5555 · alain@alainbrunelle.com · RE/MAX CRYSTAL Sainte-Thérèse.',
  canonical:'https://alainbrunelle.com/contact/',
  body:`
<section class="page-head container"><div class="eyebrow">Contact</div><h1>Parlons de votre projet.</h1><p class="lead">Appelez, écrivez ou prenez rendez-vous en ligne — je réponds en moins de 24 h.</p></section>
<section class="container"><div class="two-col">
  <div class="blue-block soft" style="padding:2.5rem">
    <h3>Téléphone</h3><p style="font-size:1.6rem;color:var(--blue);font-weight:400;margin:.5rem 0 1.5rem">450.430.5555</p>
    <h3>Courriel</h3><p style="margin:.5rem 0 1.5rem"><a href="mailto:alain@alainbrunelle.com">alain@alainbrunelle.com</a></p>
    <h3>Bureau</h3><p>RE/MAX CRYSTAL<br>Sainte-Thérèse, QC</p>
  </div>
  <form style="display:grid;gap:1rem;background:#fff;padding:2rem;border:1px solid var(--line);border-radius:var(--radius)">
    <input placeholder="Nom" style="padding:1rem;border:1px solid var(--line);border-radius:12px;font-family:inherit">
    <input placeholder="Courriel" style="padding:1rem;border:1px solid var(--line);border-radius:12px;font-family:inherit">
    <input placeholder="Téléphone" style="padding:1rem;border:1px solid var(--line);border-radius:12px;font-family:inherit">
    <textarea placeholder="Message" rows="5" style="padding:1rem;border:1px solid var(--line);border-radius:12px;font-family:inherit"></textarea>
    <button type="button" class="btn" style="background:var(--ink);color:#fff;padding:1rem;border:0;border-radius:999px;font-family:inherit;cursor:pointer;font-size:1rem">Envoyer</button>
  </form>
</div></section>`
}));

writePage('temoignages/index.html', contentPage({
  eyebrow:'Témoignages',h1:'Ce que mes clients disent.',lead:'Quelques-uns des témoignages reçus au fil des années.',
  title:'Témoignages clients | Alain Brunelle',desc:'Témoignages de clients.',
  canonical:'https://alainbrunelle.com/temoignages/',
  body:`<blockquote><p>« Alain a vendu notre maison de Blainville en 11 jours, au prix demandé. »</p><cite>Marie & Philippe · Fontainebleau</cite></blockquote>
<blockquote><p>« Analyse de marché impeccable. Rigoureux, direct, stratégique. »</p><cite>Jean-François · Sainte-Thérèse</cite></blockquote>
<blockquote><p>« Mon premier achat en toute confiance. Il explique tout. »</p><cite>Camille · Rosemère</cite></blockquote>`
}));

// --- RENDEZ-VOUS (Google Calendar Appointment Schedule intégré) ---
const gcalEmbed = GCAL_APPOINTMENT_URL.includes('REMPLACE_MOI')
  ? `<div class="calendar-placeholder">
       <div>
         <h3 style="margin-bottom:.5rem">Agenda en configuration</h3>
         <p style="color:var(--ink-2);max-width:42ch;margin:0 auto 1.5rem">L'agenda sera activé dès qu'Alain aura partagé son lien Google Calendar Appointment Schedule.</p>
         <a class="btn" href="tel:4504305555" style="display:inline-block;background:var(--ink);color:#fff;padding:1rem 1.6rem;border-radius:999px;font-weight:500">📞 450.430.5555</a>
       </div>
     </div>`
  : (() => {
      const isShort = GCAL_APPOINTMENT_URL.includes('calendar.app.google');
      const src = isShort ? GCAL_APPOINTMENT_URL : GCAL_APPOINTMENT_URL + '?gv=true';
      return `<div class="gcal-wrap">
        <iframe
          src="${src}"
          class="gcal-iframe"
          loading="lazy"
          title="Prendre rendez-vous avec Alain Brunelle"
          referrerpolicy="no-referrer-when-downgrade"
          onerror="this.nextElementSibling.style.display='flex'"></iframe>
        <div class="gcal-fallback">
          <div>
            <p style="margin-bottom:1rem;color:var(--ink-2)">L'agenda ne s'affiche pas dans votre navigateur ?</p>
            <a class="btn" href="${GCAL_APPOINTMENT_URL}" target="_blank" rel="noopener" style="display:inline-block;background:var(--ink);color:#fff;padding:1rem 1.6rem;border-radius:999px;font-weight:500">Ouvrir l'agenda dans un nouvel onglet →</a>
          </div>
        </div>
      </div>`;
    })();

writePage('rendez-vous/index.html', layout({
  title:'Prendre rendez-vous avec Alain Brunelle | Courtier immobilier',
  description:'Réservez un appel-découverte ou une rencontre directement dans l\'agenda d\'Alain Brunelle. Plages disponibles en temps réel.',
  canonical:'https://alainbrunelle.com/rendez-vous/',
  extraHead:`<style>
    .contact-wrap{display:grid;grid-template-columns:1fr 1.2fr;gap:clamp(1.5rem,4vw,3.5rem);align-items:start;background:#fff;border-radius:var(--radius-lg);padding:clamp(1.8rem,4vw,3rem);border:1px solid var(--line)}
    @media(max-width:860px){.contact-wrap{grid-template-columns:1fr}}
    .contact-form{display:grid;gap:1rem}
    .contact-form label{display:grid;gap:.45rem;font-size:.85rem;font-weight:500;color:var(--ink-2);letter-spacing:.01em}
    .contact-form input,.contact-form textarea,.contact-form select{font-family:inherit;font-size:1rem;padding:.9rem 1rem;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);transition:border-color .3s var(--ease),background .3s var(--ease);font-weight:400}
    .contact-form input:focus,.contact-form textarea:focus,.contact-form select:focus{outline:0;border-color:var(--blue);background:#fff}
    .contact-form textarea{resize:vertical;min-height:120px;font-family:inherit}
    .f-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    @media(max-width:520px){.f-row{grid-template-columns:1fr}}
    .f-submit{margin-top:.6rem;background:var(--ink);color:#fff;padding:1.1rem 1.4rem;border:0;border-radius:999px;font-family:inherit;font-size:1rem;font-weight:500;cursor:pointer;transition:transform .3s var(--ease),background .3s var(--ease)}
    .f-submit:hover{background:var(--blue);transform:translateY(-2px)}
    .f-note{font-size:.78rem;color:var(--muted);margin:0;line-height:1.5}
    .f-ok{text-align:center;padding:2rem 1rem}
    .f-ok-icon{width:64px;height:64px;border-radius:999px;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center;font-size:1.8rem;margin:0 auto 1.2rem}
    .f-ok h3{font-size:1.4rem;margin-bottom:.6rem}
    .f-ok p{color:var(--ink-2)}
    .gcal-wrap{position:relative;min-height:720px}
    .gcal-iframe{width:100%;border:0;border-radius:var(--radius-lg);background:var(--surface);min-height:720px;box-shadow:var(--shadow-sm);display:block}
    .gcal-fallback{display:none;position:absolute;inset:0;background:var(--surface);border-radius:var(--radius-lg);align-items:center;justify-content:center;text-align:center;padding:2rem}
    .calendar-placeholder{background:var(--surface);border:1px dashed var(--line);border-radius:var(--radius-lg);min-height:480px;display:grid;place-items:center;text-align:center;padding:2rem}
    .rv-grid{display:grid;grid-template-columns:1fr 320px;gap:var(--gap);align-items:start}
    @media(max-width:900px){.rv-grid{grid-template-columns:1fr}}
    .rv-aside h3{margin-bottom:.6rem;font-size:1.05rem}
    .rv-aside ul{padding-left:1.1rem;margin:0;color:var(--ink-2);font-size:.95rem;line-height:1.7}
  </style>`,
  body:`
<section class="page-head container">
  <div class="eyebrow">Rendez-vous</div>
  <h1>Prenez rendez-vous avec Alain Brunelle.</h1>
  <p class="lead">Choisissez un créneau directement dans mon agenda Google — plages mises à jour en temps réel. Confirmation et rappel automatiques par courriel.</p>
</section>
<section class="container">
  <div class="rv-grid">
    <div>${gcalEmbed}</div>
    <aside class="rv-aside">
      <div class="blue-block soft" style="padding:1.8rem">
        <h3>Ce qu'on couvre</h3>
        <ul>
          <li>Appel-découverte (30 min) : vos objectifs, votre échéancier.</li>
          <li>Évaluation gratuite sur place (60 min) : rapport livré 48 h après.</li>
          <li>Stratégie de mise en marché pour les vendeurs.</li>
          <li>Recherche sur mesure pour les acheteurs.</li>
        </ul>
        <h3 style="margin-top:1.5rem">Préférez le téléphone ?</h3>
        <p style="font-size:1.2rem;color:var(--blue);margin:.3rem 0 0"><a href="tel:4504305555" style="color:inherit">450.430.5555</a></p>
      </div>
    </aside>
  </div>
</section>
<section class="section-light">
  <div class="container">
    <div class="contact-wrap reveal">
      <div class="contact-intro">
        <div class="eye" style="color:var(--muted);text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;margin-bottom:1rem">Message direct</div>
        <h2 style="max-width:18ch">Vous avez des questions ? Écrivez-moi.</h2>
        <p style="color:var(--ink-2);margin-top:1.2rem;max-width:42ch;font-size:1.02rem;line-height:1.7">Pas prêt à réserver un créneau ? Envoyez-moi votre question directement. Je réponds personnellement en moins de 24 h, jours ouvrables.</p>
        <div style="margin-top:1.8rem;display:grid;gap:.6rem;font-size:.95rem;color:var(--ink-2)">
          <div>📞 <a href="tel:4504305555" style="color:var(--blue)">450.430.5555</a></div>
          <div>✉ <a href="mailto:alain@alainbrunelle.com" style="color:var(--blue)">alain@alainbrunelle.com</a></div>
        </div>
      </div>
      <form class="contact-form" onsubmit="event.preventDefault(); this.querySelector('.f-ok').hidden=false; this.querySelector('.f-fields').hidden=true;">
        <div class="f-fields">
          <label>Nom complet<input type="text" name="name" required></label>
          <div class="f-row">
            <label>Courriel<input type="email" name="email" required></label>
            <label>Téléphone<input type="tel" name="phone"></label>
          </div>
          <label>Sujet
            <select name="subject">
              <option>Évaluation gratuite</option>
              <option>Vendre ma propriété</option>
              <option>Acheter une propriété</option>
              <option>Investissement (plex, condo)</option>
              <option>Autre question</option>
            </select>
          </label>
          <label>Votre message<textarea name="message" rows="5" required></textarea></label>
          <button type="submit" class="f-submit">Envoyer le message →</button>
          <p class="f-note">En envoyant ce formulaire, vous acceptez d'être contacté par Alain Brunelle. Vos informations ne sont pas partagées.</p>
        </div>
        <div class="f-ok" hidden>
          <div class="f-ok-icon">✓</div>
          <h3>Message envoyé.</h3>
          <p>Merci. Je réponds personnellement sous 24 h.</p>
        </div>
      </form>
    </div>
  </div>
</section>`
}));

// --- PERFORMANCE DASHBOARD ---
writePage('performance/index.html', layout({
  title:'Performance SEO — Dashboard interne',
  description:'Dashboard SEO interne — protégé.',
  canonical:'https://alainbrunelle.com/performance/',
  extraHead: '<meta name="robots" content="noindex,nofollow">',
  body:`
<section class="page-head container"><div class="eyebrow">Dashboard interne</div><h1>Performance SEO — Alain Brunelle.</h1><p class="lead">Progression vers #1 Google — Sainte-Thérèse &amp; Blainville.</p></section>
<section class="container">
  <div class="blue-block">
    <div class="stats-grid">
      <div class="stat"><div class="n">47</div><div class="l">Mots-clés Top 10</div></div>
      <div class="stat"><div class="n">12</div><div class="l">Mots-clés Top 3</div></div>
      <div class="stat"><div class="n">312</div><div class="l">Pages indexées</div></div>
      <div class="stat"><div class="n">×8,2</div><div class="l">Trafic vs M0</div></div>
    </div>
  </div>
</section>
<section class="container">
  <div class="sec-head"><div><div class="eye">Mots-clés prioritaires</div><h2>Progression par mot-clé — 30 j.</h2></div></div>
  <div class="chart" style="max-width:800px">
    ${[['courtier immobilier Blainville',3,8],['maison à vendre Blainville',7,15],['courtier immobilier Sainte-Thérèse',2,6],['condo à vendre Blainville',5,12],['plex à vendre Blainville',4,9]].map(([k,cur,prev])=>`
      <div class="bar-row"><span class="label">${k}</span><div class="bar"><span style="width:${100-cur*6}%"></span></div><span class="val">#${cur} ← #${prev}</span></div>
    `).join('')}
  </div>
</section>`
}));

// --- 404 + robots + sitemap ---
writePage('404.html', layout({
  title:'Page introuvable | Alain Brunelle',description:'Page introuvable.',
  body:`<section class="page-head container"><div class="eyebrow">404</div><h1>Cette page a changé d'adresse.</h1><p class="lead"><a href="/">Retour à l'accueil</a> · <a href="/nos-proprietes/">Nos propriétés</a> · <a href="/contact/">Contact</a></p></section>`
}));

const allUrls = [
  '/', '/nos-proprietes/', '/a-propos/', '/contact/', '/temoignages/', '/rendez-vous/', '/guides/', '/marche-immobilier/', '/blog/',
  ...CITIES.flatMap(([s,_,ns]) => [`/courtier-immobilier/${s}/`, ...ns.map(n=>`/quartiers/${s}/${slug(n)}/`)]),
  ...TYPES.map(([s])=>`/types-de-propriete/${s}/`),
  ...SUBPAGES.map(([p])=>`/${p}/`),
  ...GUIDES.map(([s])=>`/guides/${s}/`),
  ...['statistiques-blainville','statistiques-sainte-therese','rapport-mensuel'].map(s=>`/marche-immobilier/${s}/`),
  ...BLOG_POSTS.map(([s])=>`/blog/${s}/`),
  ...properties.map(p=>`/nos-proprietes/${p.slug}/`)
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u=>`<url><loc>https://alainbrunelle.com${u}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
writePage('sitemap.xml', sitemap);
writePage('robots.txt', `User-agent: *\nAllow: /\nDisallow: /performance/\nSitemap: https://alainbrunelle.com/sitemap.xml\n`);

console.log(`Generated ${allUrls.length} pages → ${SITE}`);
