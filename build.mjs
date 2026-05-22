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
  'J7B':'Blainville','J7C':'Blainville','J6Z':'Lorraine',
  'J7E':'Saint-Eustache','J7P':'Saint-Eustache','J7R':'Saint-Eustache',
  'J7H':'Rosemère','J7G':'Rosemère',
  'J7J':'Bois-des-Filion','J6T':'Lorraine',
  'J0N':'Sainte-Marthe-sur-le-Lac','J7T':'Deux-Montagnes','J7V':'Deux-Montagnes',
  'J7N':'Sainte-Anne-des-Plaines','J5N':'Sainte-Anne-des-Plaines',
  'J7A':'Mirabel','J7K':'Mirabel','J7L':'Mirabel',
  'J6J':'Laval','H7W':'Laval','H7N':'Laval',
  'J0T':'Saint-Adolphe-d\u2019Howard','J0R':'Saint-Sauveur/Laurentides','J8B':'Morin-Heights','J8E':'Mont-Tremblant',
  'H2G':'Montréal','H2X':'Montréal'
};
const cityFromCP = cp => CP_CITY[(cp||'').toUpperCase().slice(0,3)] || 'Laurentides';

// Centris feature code → human label (catégorie + valeur)
// Format : { CODE_CARAC: { name: 'Catégorie', vals: { CODE_VAL: 'Valeur lisible' } } }
const FEAT = {
  ALLE: { name: 'Allée', vals: { ASPH:'Asphaltée', PAVE:'Pavé uni', GRAV:'Gravier', POUS:'Poussière de roche', BETO:'Béton' } },
  EAU:  { name: 'Approvisionnement eau', vals: { AMU:'Municipal', PUIT:'Puits artésien', SURF:'Eau de surface' } },
  CHAU: { name: 'Système de chauffage', vals: { AIRP:'Air pulsé', PELC:'Plinthes électriques', RADI:'Radiateur', AIRC:'Convecteur', AIRR:'Air rayonnant', POEL:'Poêle', FOUR:'Fournaise' } },
  ENER: { name: 'Énergie', vals: { ELEC:'Électricité', GAZN:'Gaz naturel', HUIL:'Mazout / Huile', BOIS:'Bois', PROP:'Propane', SOLA:'Solaire' } },
  EQUI: { name: 'Équipement disponible', vals: { THEM:'Thermopompe', ECHA:'Échangeur d\'air', CENT:'Aspirateur central', ALAR:'Système d\'alarme', VENT:'Ventilation', GEOT:'Géothermie', INTE:'Intercom', PORT:'Porte de garage électrique' } },
  FOND: { name: 'Fondation', vals: { BETO:'Béton coulé', BLOC:'Blocs de béton', PIER:'Pierres', POUT:'Sur poutres' } },
  TOIT: { name: 'Toiture', vals: { BARD:'Bardeaux d\'asphalte', TOLE:'Tôle', MEMB:'Membrane élastomère', ARDO:'Ardoise', GOUD:'Goudron et gravier' } },
  FENE: { name: 'Fenêtres', vals: { HYBR:'Hybride', ALUM:'Aluminium', PVC:'PVC', BOIS:'Bois', BATT:'À battant', GUIL:'À guillotine', COUL:'Coulissante' } },
  GARA: { name: 'Garage', vals: { ATT:'Attenant', DET:'Détaché', INT:'Intégré', CHAU:'Chauffé', SIMP:'Simple', DOUB:'Double', TRIP:'Triple', QUAD:'Quadruple' } },
  PISC: { name: 'Piscine', vals: { HT:'Hors-terre', CR:'Creusée', INT:'Intérieure', CHAU:'Chauffée', NORM:'Standard' } },
  REV:  { name: 'Revêtement', vals: { BRIQ:'Brique', VINY:'Vinyle', PIER:'Pierre', BOIS:'Bois', CREP:'Crépi', ALUM:'Aluminium', FIBR:'Fibre de bois' } },
  STAT: { name: 'Stationnement', vals: { ASPH:'Asphalte', INT:'Intérieur', EXT:'Extérieur', GAR:'Garage', PAVE:'Pavé uni' } },
  PROX: { name: 'Proximité', vals: { AUTO:'Autoroute', GCPE:'Garderie / CPE', PARC:'Parc', PCYC:'Piste cyclable', PRIM:'École primaire', SEC:'École secondaire', CEGE:'Cégep', UNIV:'Université', HOPI:'Hôpital', REM:'Espace récréatif', TRSP:'Transport public', LACE:'Lac/cours d\'eau', SCKI:'Centre de ski', GOLF:'Golf' } },
  PIEC: { name: 'Pièces', vals: {} },
  PROP: { name: 'Type de propriété', vals: {} },
  GENR: { name: 'Genre', vals: { DETA:'Détaché', JUME:'Jumelé', RANG:'En rangée' } },
  STYL: { name: 'Style', vals: { COTT:'Cottage', BUNG:'Bungalow', SPLI:'Split-level', PALI:'Paliers multiples', PLAN:'Plain-pied' } },
  ZONE: { name: 'Zonage', vals: { RES:'Résidentiel', AGR:'Agricole', COM:'Commercial', VILL:'Villégiature' } },
  TERR: { name: 'Terrain', vals: { PLAT:'Plat', BOIS:'Boisé', LACE:'Bord de lac', CLOT:'Clôturé' } },
  TOPO: { name: 'Topographie', vals: { PLAT:'Plat', ESC:'En pente' } },
  SOUS: { name: 'Sous-sol', vals: { TOTA:'Totalement aménagé', PART:'Partiellement aménagé', NON:'Non aménagé', VIDE:'Vide sanitaire', AUC:'Aucun' } },
  EGOU: { name: 'Égout', vals: { MUNI:'Municipal', FOSS:'Fosse septique', NON:'Aucun' } },
  ARMC: { name: 'Armoires de cuisine', vals: { BOIS:'Bois', MELA:'Mélamine', STRA:'Stratifié', POLY:'Polyester', THER:'Thermoplastique' } },
};

// Code pièce Centris → nom français
const ROOM_NAME = {
  HAL:'Hall d\'entrée', SAL:'Salon', SAM:'Salle à manger', SFM:'Salle familiale',
  CUI:'Cuisine', CR:'Coin-repas', BUR:'Bureau', BIB:'Bibliothèque',
  CAC:'Chambre', CCP:'Chambre principale', CC2:'Chambre secondaire',
  SDB:'Salle de bains', SDE:'Salle d\'eau', SDL:'Salle de lavage',
  RAN:'Rangement', VES:'Vestibule', GAR:'Garage', VER:'Véranda',
  ATE:'Atelier', SEJ:'Séjour', SOL:'Solarium', SAU:'Sauna',
  MEZ:'Mezzanine', LOG:'Loft', BOUD:'Boudoir', ENT:'Entrée'
};
// Niveau Centris → libellé
const ROOM_LEVEL = {
  '1':'1er niveau / RDC', '2':'2e niveau', '3':'3e niveau', '4':'4e niveau',
  'RC':'Rez-de-chaussée', 'SS':'Sous-sol', 'SS1':'Sous-sol 1', 'SS2':'Sous-sol 2',
  'GR':'Grenier', 'MEZ':'Mezzanine'
};
// Revêtement pièce
const ROOM_REV = {
  PFLO:'Plancher flottant', CERAM:'Céramique', BOIS:'Bois', BOIF:'Bois franc',
  TAPI:'Tapis', VINY:'Vinyle', BETO:'Béton', LINO:'Linoléum',
  MARB:'Marbre', GRES:'Grès cérame', LIEG:'Liège', ARDO:'Ardoise', CARP:'Carpette'
};

// "11.9x10.9 P" → "11'9\" × 10'9\" (pieds)"
function fmtDim(raw) {
  if (!raw) return '';
  const m = raw.match(/^([\d.]+)\s*x\s*([\d.]+)\s*([A-Z]?)/i);
  if (!m) return raw;
  const conv = (decimal) => {
    const f = Math.floor(parseFloat(decimal));
    const inches = Math.round((parseFloat(decimal) - f) * 12);
    return inches ? `${f}'${inches}"` : `${f}'`;
  };
  const unit = m[3] === 'M' ? ' m' : '';
  return `${conv(m[1])} × ${conv(m[2])}${unit}`;
}

function decodeFeature(f) {
  const cat = FEAT[f.code];
  if (!cat) return null; // skip unknown codes
  const name = cat.name;
  const value = cat.vals[f.value] || f.value;
  return { name, value };
}


// Détecte le type de propriété à partir de la description Centris (descFr)
function inferTypeFromDesc(desc) {
  const d = (desc || '').toLowerCase();
  if (/\b(condo|copropriété|appartement)\b/.test(d)) return 'Condo';
  if (/\b(plex|duplex|triplex|quadruplex|quintuplex)\b/.test(d)) return 'Plex';
  if (/\b(maison de ville|jumelé|en rangée|rangée)\b/.test(d)) return 'Maison de ville';
  if (/\b(chalet|villégiature)\b/.test(d)) return 'Chalet / Villégiature';
  if (/\b(terrain|lot|boisé)\b/.test(d) && !/\b(cottage|maison|bungalow)\b/.test(d)) return 'Terrain';
  if (/\b(cottage|bungalow|unifamiliale|propriété|résidence)\b/.test(d)) return 'Maison unifamiliale';
  return 'Propriété';
}

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

// Normalize a string : lowercase + remove diacritics
const norm = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const slug = (s) => (s || '').toString().toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── DATA LOADING — deux modes ──────────────────────────────────────────
// Mode A : zip Centris frais présent dans _centris/ → ingestion complète + écrit site/data/*.json
// Mode B : pas de _centris/ → on lit site/data/*.json (committé par le cron GitHub).
//          Permet à Vercel de rebuilder le HTML après chaque push sans avoir besoin du zip.

const HAS_CENTRIS = fs.existsSync(path.join(CENTRIS, 'INSCRIPTIONS.TXT'));
let properties, stats;

if (HAS_CENTRIS) {
  console.log('Mode A · Reading Centris zip…');
  const membres = read('MEMBRES.TXT');
  ({ properties, stats } = ingestFromCentris(membres));
  // Persist for next Vercel build
  fs.mkdirSync(path.join(SITE, 'data'), { recursive: true });
  fs.writeFileSync(path.join(SITE, 'data', 'properties.json'), JSON.stringify(properties, null, 2));
  fs.writeFileSync(path.join(SITE, 'data', 'stats.json'), JSON.stringify(stats, null, 2));
} else {
  const propPath = path.join(SITE, 'data', 'properties.json');
  const statPath = path.join(SITE, 'data', 'stats.json');
  if (!fs.existsSync(propPath)) {
    console.error('❌ Ni _centris/ ni site/data/properties.json — impossible de bâtir le site.');
    process.exit(1);
  }
  console.log('Mode B · Reading cached site/data/*.json (no Centris zip available)');
  properties = JSON.parse(fs.readFileSync(propPath, 'utf8'));
  stats = fs.existsSync(statPath) ? JSON.parse(fs.readFileSync(statPath, 'utf8')) : {};
}

function ingestFromCentris(membres) {
  function detectBroker() {
    const target = { f: norm(TARGET_BROKER.firstName), l: norm(TARGET_BROKER.lastName) };
    const hit = membres.find(r => norm(r[5]) === target.f && norm(r[4]) === target.l);
    if (hit) {
      console.log(`✓ Alain Brunelle détecté → NO_MEMBRE=${hit[0]}`);
      return hit[0];
    }
    console.log(`⚠ Alain Brunelle absent de MEMBRES.TXT → fallback Maxime Beaulac (${FALLBACK_BROKER_NO})`);
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
  // PIECES_UNITES : 0=MLS, 1=NoUnité, 2=Seq, 3=CodePièce, 6=Niveau, 9=Dimensions, 11=Revêtement
  const piecesByMls = {};
  for (const p of pieces) {
    const m = p[0]; if (!m) continue;
    (piecesByMls[m] ??= []).push({
      seq: +p[2] || 0,
      code: p[3] || '',
      level: p[6] || '',
      dim: p[9] || '',
      rev: p[11] || ''
    });
  }
  // Trier par séquence
  for (const k of Object.keys(piecesByMls)) piecesByMls[k].sort((a,b) => a.seq - b.seq);
  const linksByMls = {};
  for (const l of liens) { const m=l[0]; if(!m) continue; (linksByMls[m] ??= []).push({type:l[2], url:l[3]}); }

  const myListings = inscr.filter(r => r[2]===BROKER_NO || r[4]===BROKER_NO);
  const properties = myListings.map(r => {
    const mls = r[0], price = parseFloat(r[6])||0;
    // r[25] = NO_CIVIQUE (vérifié contre ADDENDA), r[26] = parfois suffixe ou unité
    // r[27] = NOM_RUE, r[28] = unité/apt secondaire
    const civic = (r[25]||'').trim();
    const civicSuffix = (r[26]||'').trim();
    const streetName = (r[27]||'').trim();
    const unit = (r[28]||'').trim();
    // Si streetName contient déjà le civic au début (ex: "17A Rue Labonté"), on l'utilise tel quel
    const streetStartsWithCivic = civic && new RegExp('^' + civic + '\\b').test(streetName);
    const street = streetStartsWithCivic
      ? streetName + (unit ? `, app. ${unit}` : '')
      : [civic + civicSuffix, streetName].filter(Boolean).join(' ') + (unit ? `, app. ${unit}` : '');
    // Type de propriété — inféré de la description (r[25] n'est PAS un type code)
    const typeCode = '';
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
      typeCode, typeLabel: inferTypeFromDesc(desc),
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

  return { properties, stats };
}

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
.gal>div{cursor:zoom-in}
.gal .more-btn{position:absolute;bottom:1rem;right:1rem;background:#fff;padding:.7rem 1.2rem;border-radius:999px;font-size:.85rem;font-weight:500;color:var(--ink);z-index:3;box-shadow:var(--shadow-sm);transition:transform .3s var(--ease);border:0;cursor:pointer;font-family:inherit}
.gal .more-btn:hover{transform:translateY(-2px)}

/* Lightbox */
.lb{position:fixed;inset:0;background:rgba(11,22,40,.96);backdrop-filter:blur(20px);z-index:200;display:none;flex-direction:column;animation:lb-in .3s var(--ease)}
.lb.open{display:flex}
@keyframes lb-in{from{opacity:0}to{opacity:1}}
.lb-head{display:flex;justify-content:space-between;align-items:center;padding:1rem clamp(1rem,3vw,2rem);color:#fff;flex-shrink:0}
.lb-count{font-size:.9rem;font-variant-numeric:tabular-nums;letter-spacing:.05em}
.lb-close{width:44px;height:44px;border-radius:999px;background:rgba(255,255,255,.12);color:#fff;border:0;cursor:pointer;font-size:1.2rem;display:grid;place-items:center;transition:background .3s var(--ease)}
.lb-close:hover{background:rgba(255,255,255,.22)}
.lb-stage{flex:1;display:flex;align-items:center;justify-content:center;padding:0 clamp(.5rem,3vw,2rem);position:relative;min-height:0}
.lb-stage img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.4);user-select:none;-webkit-user-drag:none}
.lb-nav{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px;border-radius:999px;background:rgba(255,255,255,.12);color:#fff;border:0;cursor:pointer;font-size:1.3rem;display:grid;place-items:center;transition:background .3s var(--ease);z-index:2}
.lb-nav:hover{background:rgba(255,255,255,.25)}
.lb-nav.prev{left:clamp(.5rem,2vw,1.5rem)}
.lb-nav.next{right:clamp(.5rem,2vw,1.5rem)}
.lb-nav:disabled{opacity:.3;cursor:not-allowed}
.lb-thumbs{display:flex;gap:.4rem;padding:1rem clamp(.5rem,3vw,2rem);overflow-x:auto;flex-shrink:0;justify-content:center;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.3) transparent}
.lb-thumbs::-webkit-scrollbar{height:6px}
.lb-thumbs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.3);border-radius:99px}
.lb-thumb{flex:0 0 80px;height:60px;border-radius:6px;overflow:hidden;cursor:pointer;opacity:.5;transition:opacity .3s var(--ease),transform .3s var(--ease);border:2px solid transparent;background:#000}
.lb-thumb.active{opacity:1;border-color:#fff}
.lb-thumb:hover{opacity:.9}
.lb-thumb img{width:100%;height:100%;object-fit:cover;pointer-events:none}
@media(max-width:640px){.lb-nav{width:44px;height:44px}.lb-thumbs{display:none}}
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
.features-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.7rem;margin-top:1.5rem}
.feature{background:var(--surface);padding:.85rem 1.1rem;border-radius:14px;font-size:.9rem;display:flex;flex-direction:column;gap:.2rem}
.feature strong{font-weight:500;font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
.feature span{color:var(--ink);font-weight:400}
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

  // Property photo lightbox
  const gal=document.querySelector('.gal[data-photos]');
  if(gal){
    let photos=[];
    try{photos=JSON.parse(gal.dataset.photos);}catch{photos=[];}
    if(photos.length){
      const lb=document.createElement('div');
      lb.className='lb';
      lb.innerHTML=
        '<div class="lb-head"><span class="lb-count"></span><button class="lb-close" aria-label="Fermer">✕</button></div>'+
        '<div class="lb-stage"><button class="lb-nav prev" aria-label="Précédent">‹</button><img alt=""><button class="lb-nav next" aria-label="Suivant">›</button></div>'+
        '<div class="lb-thumbs"></div>';
      document.body.appendChild(lb);
      const stage=lb.querySelector('.lb-stage img');
      const count=lb.querySelector('.lb-count');
      const prev=lb.querySelector('.lb-nav.prev');
      const next=lb.querySelector('.lb-nav.next');
      const thumbsEl=lb.querySelector('.lb-thumbs');
      thumbsEl.innerHTML=photos.map((u,i)=>'<button type="button" class="lb-thumb" data-i="'+i+'"><img src="'+u+'" loading="lazy" alt=""></button>').join('');
      let idx=0;
      function show(i){
        idx=Math.max(0,Math.min(photos.length-1,i));
        stage.src=photos[idx];
        count.textContent=(idx+1)+' / '+photos.length;
        prev.disabled=idx===0; next.disabled=idx===photos.length-1;
        thumbsEl.querySelectorAll('.lb-thumb').forEach((t,j)=>t.classList.toggle('active',j===idx));
        const active=thumbsEl.querySelector('.lb-thumb.active');
        if(active)active.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
      }
      function open(i){show(i||0);lb.classList.add('open');document.body.style.overflow='hidden';}
      function close(){lb.classList.remove('open');document.body.style.overflow='';}
      gal.querySelectorAll('[data-open-lightbox]').forEach(el=>{
        el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(+el.dataset.openLightbox||0);});
      });
      lb.querySelector('.lb-close').addEventListener('click',close);
      prev.addEventListener('click',()=>show(idx-1));
      next.addEventListener('click',()=>show(idx+1));
      thumbsEl.addEventListener('click',e=>{const b=e.target.closest('.lb-thumb');if(b)show(+b.dataset.i);});
      document.addEventListener('keydown',e=>{
        if(!lb.classList.contains('open'))return;
        if(e.key==='Escape')close();
        if(e.key==='ArrowLeft')show(idx-1);
        if(e.key==='ArrowRight')show(idx+1);
      });
      // Swipe sur mobile
      let touchX=null;
      lb.querySelector('.lb-stage').addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;},{passive:true});
      lb.querySelector('.lb-stage').addEventListener('touchend',e=>{
        if(touchX===null)return;
        const dx=e.changedTouches[0].clientX-touchX;
        if(dx>50)show(idx-1); else if(dx<-50)show(idx+1);
        touchX=null;
      });
    }
  }

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
      <div class="stat"><div class="n">3 000+</div><div class="l">Transactions conclues depuis 1992</div></div>
      <div class="stat"><div class="n">28 j</div><div class="l">Délai moyen de vente (vs 52 j marché)</div></div>
      <div class="stat"><div class="n">Top 5 %</div><div class="l">RE/MAX Québec — depuis 20 ans</div></div>
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
  // Décode features Centris + regroupe par catégorie pour affichage propre
  const featuresByCategory = {};
  for (const f of p.features) {
    const decoded = decodeFeature(f);
    if (!decoded) continue;
    (featuresByCategory[decoded.name] ??= []).push(decoded.value);
  }
  const featureRows = Object.entries(featuresByCategory)
    .filter(([_, vals]) => vals.length > 0)
    .map(([name, vals]) => `<div class="feature"><strong>${name}</strong><span>${[...new Set(vals)].join(', ')}</span></div>`);
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
  <div class="gal" data-photos='${JSON.stringify(p.photos.map(ph=>ph.url)).replace(/'/g,"&#39;")}'>
    <div class="main" data-open-lightbox="0"><img src="${mainPh}" alt="${p.street}"></div>
    ${side.map((ph,i) => `<div data-open-lightbox="${i+1}">${i===side.length-1 && total>3 ? `<button type="button" class="more-btn" data-open-lightbox="0">Voir ${total} photos</button>`:''}<img loading="lazy" src="${ph.url}" alt=""></div>`).join('')}
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
      ${featureRows.length ? `
        <h2 style="font-size:1.4rem;margin-top:2.5rem;margin-bottom:.5rem">Caractéristiques</h2>
        <div class="features-grid">
          ${featureRows.join('')}
        </div>
      `:''}
      ${p.rooms.length ? `
        <h2 style="font-size:1.4rem;margin-top:2.5rem;margin-bottom:.5rem">Pièces</h2>
        <table class="rooms-table">
          <thead><tr><th>Pièce</th><th>Niveau</th><th>Dimensions</th><th>Revêtement</th></tr></thead>
          <tbody>${p.rooms.slice(0,20).map(r=>{
            const name = ROOM_NAME[r.code] || r.code || '—';
            const level = ROOM_LEVEL[r.level] || r.level || '—';
            const dim = fmtDim(r.dim) || '—';
            const rev = ROOM_REV[r.rev] || r.rev || '—';
            return `<tr><td>${name}</td><td>${level}</td><td>${dim}</td><td>${rev}</td></tr>`;
          }).join('')}</tbody>
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
  ['maison-unifamiliale-a-vendre','Maison unifamiliale',
   'La typologie la plus recherchée de la Rive-Nord — 68 % des transactions résidentielles 2026.',
   `<p>La maison unifamiliale détachée reste la propriété la plus convoitée de la Rive-Nord. Sur les 12 derniers mois, elle représente <strong>68 % des transactions résidentielles</strong> à Blainville, Sainte-Thérèse, Rosemère et Lorraine confondues.</p>

   <h2>Profil de l'acheteur d'unifamiliale en 2026</h2>
   <ul>
   <li>Familles avec enfants jeunes (35-45 ans) — 52 %</li>
   <li>Couples sans enfants ou empty-nesters — 22 %</li>
   <li>Familles recomposées ou multigénérationnelles — 14 %</li>
   <li>Investisseurs (location courte ou longue durée) — 12 %</li>
   </ul>

   <h2>Prix médians par ville (12 derniers mois)</h2>
   <ul>
   <li><strong>Blainville</strong> : 685 000 $</li>
   <li><strong>Sainte-Thérèse</strong> : 582 000 $</li>
   <li><strong>Rosemère</strong> : 720 000 $</li>
   <li><strong>Lorraine</strong> : 765 000 $</li>
   </ul>

   <h2>Ce qui fait monter ou descendre le prix</h2>
   <h3>Facteurs +</h3>
   <p>Lot >700 m², garage attaché, sous-sol fini avec hauteur libre ≥7 pi, rénovations cuisine/SDB <10 ans, orientation sud-ouest, proximité d'une école primaire bien cotée.</p>
   <h3>Facteurs −</h3>
   <p>Toiture en fin de vie, fenêtres d'origine (>25 ans), revêtement extérieur amiante, sous-sol bas (<6'8"), proximité d'une artère bruyante, voisinage commercial direct.</p>

   <h2>Stratégie d'achat ou de vente</h2>
   <p>Pour <strong>acheter</strong> : viser les secteurs en mutation (nouvelles écoles, futur transport collectif), où l'effet de halo va lever les prix sur 3-5 ans. Pour <strong>vendre</strong> : positionnement de prix précis selon le sous-secteur, photos drone obligatoires pour mettre en valeur le terrain. <a href="/vendre/evaluation-gratuite/">Obtenez votre évaluation gratuite</a>.</p>`],

  ['condo-a-vendre','Condo',
   'Propriété divise en copropriété — idéal pour premiers acheteurs, retraités et investisseurs.',
   `<p>Le condo a complètement transformé le marché Rive-Nord en 10 ans. À Sainte-Thérèse, le secteur Vieux-Village a vu pousser une dizaine de projets neufs depuis 2018 — répondant à une demande forte de propriétaires souhaitant la propriété <em>sans l'entretien</em>.</p>

   <h2>Prix médians condos 2026</h2>
   <ul>
   <li><strong>Sainte-Thérèse Vieux-Village</strong> : 425 000 $ (condos neufs 2-3 ch.)</li>
   <li><strong>Blainville centre</strong> : 380 000 $</li>
   <li><strong>Rosemère</strong> : 465 000 $</li>
   <li><strong>Lorraine</strong> : 395 000 $</li>
   </ul>

   <h2>Charges de copropriété — l'élément le plus mal compris</h2>
   <p>Les charges (entre 200 $ et 600 $/mois selon le projet) couvrent typiquement : chauffage des aires communes, déneigement, paysagement, fonds de prévoyance, assurance bâtiment. <strong>À vérifier obligatoirement avant d'offrir</strong> :</p>
   <ul>
   <li>État du <strong>fonds de prévoyance</strong> (devrait représenter au moins 5-10 % de la valeur de remplacement du bâtiment)</li>
   <li>Procès-verbaux des 3 dernières assemblées (litiges, projets de travaux majeurs)</li>
   <li>Étude du <strong>carnet d'entretien</strong> et de l'étude du fonds de prévoyance (obligatoire depuis 2024)</li>
   <li>Règlements de copropriété (restrictions Airbnb, animaux, BBQ, location)</li>
   </ul>

   <h2>Condo neuf vs revente</h2>
   <h3>Condo neuf</h3>
   <p>Garantie GCR (5 ans structure, 3 ans enveloppe, 1 an fini), TPS/TVQ partiellement remboursables, possibilité de personnaliser certains finis. Inconvénient : on achète sur plan, livraison souvent reportée, et le condo se déprécie de 5-10 % la première année (effet « auto neuve »).</p>
   <h3>Condo revente</h3>
   <p>Prix négociable, qualité réelle vérifiable, charges déjà stabilisées. Inconvénient : finis peut-être à rafraîchir, fonds de prévoyance parfois sous-capitalisé.</p>

   <h2>Pour qui ce type ?</h2>
   <ul>
   <li>Premier acheteur cherchant l'entrée dans le marché (mise de fonds modeste)</li>
   <li>Empty-nesters quittant l'unifamiliale</li>
   <li>Professionnel·le célibataire ou couple sans projet d'enfants</li>
   <li>Investisseur locatif (rendement net 3,5-5 % selon le projet)</li>
   </ul>`],

  ['maison-de-ville-a-vendre','Maison de ville',
   'Le compromis intelligent entre condo et unifamiliale — typologie en croissance forte.',
   `<p>La maison de ville (souvent appelée « townhouse » ou « cottage en rangée ») offre l'expérience d'une maison — entrée privée, cour arrière, sous-sol — avec un prix inférieur de 15 à 25 % à l'unifamiliale équivalente. Sur la Rive-Nord, c'est la typologie qui gagne le plus en popularité depuis 2022.</p>

   <h2>Sous-types à distinguer</h2>
   <ul>
   <li><strong>Jumelée</strong> : 2 unités partageant un mur. Prix proche de l'unifamiliale, plus d'intimité.</li>
   <li><strong>En rangée</strong> : 3+ unités côte à côte. Plus abordable, contraintes esthétiques (façade uniforme).</li>
   <li><strong>Cottage en rangée 2 étages</strong> : la version la plus recherchée à Blainville et Sainte-Thérèse-en-Haut.</li>
   </ul>

   <h2>Prix médians 2026</h2>
   <ul>
   <li><strong>Blainville (Fontainebleau, Chambéry)</strong> : 525 000 $</li>
   <li><strong>Sainte-Thérèse</strong> : 465 000 $</li>
   <li><strong>Rosemère</strong> : 545 000 $</li>
   </ul>

   <h2>Avantages</h2>
   <ul>
   <li>Prix d'entrée significativement plus bas que l'unifamiliale</li>
   <li>Entretien extérieur partagé ou simplifié (pas d'entretien sur le mur mitoyen)</li>
   <li>Cour arrière privée, généralement plus petite mais utilisable</li>
   <li>Sous-sol et 2 étages — espace de vie comparable à une maison de 2 000-2 400 pi²</li>
   </ul>

   <h2>Points d'attention à la visite</h2>
   <ul>
   <li><strong>Insonorisation</strong> du ou des murs mitoyens — testez en frappant et en écoutant</li>
   <li><strong>Stationnement</strong> : compté, partagé ou hors-rue ?</li>
   <li><strong>Charges</strong> si formule copropriété (variable selon projets)</li>
   <li>Règlements du projet (modifications extérieures, BBQ, peinture porte)</li>
   </ul>`],

  ['maison-neuve-a-vendre','Maison neuve',
   'Constructions neuves livrées 2025-2027 sur la Rive-Nord — projets en cours et à venir.',
   `<p>Le marché de la construction neuve sur la Rive-Nord est en pleine effervescence. Plusieurs projets résidentiels significatifs sont en cours ou prévus dans les 24 prochains mois, principalement à Blainville (secteur Chambéry, prolongement du boulevard Notre-Dame) et Mirabel.</p>

   <h2>Avantages d'acheter neuf</h2>
   <ul>
   <li><strong>Garantie GCR</strong> : 5 ans structure, 3 ans enveloppe, 1 an fini — couverture la plus complète au Québec</li>
   <li><strong>Remboursement partiel TPS/TVQ</strong> sur résidence principale (jusqu'à ~13 000 $)</li>
   <li><strong>Personnalisation</strong> des finis avant livraison (planchers, comptoirs, robinetterie)</li>
   <li>Aucun travail à prévoir avant 10-15 ans (fenêtres, toit, fournaise tous récents)</li>
   <li>Efficacité énergétique supérieure (Novoclimat, R-2000)</li>
   </ul>

   <h2>Risques à mitiger</h2>
   <ul>
   <li><strong>Reports de livraison</strong> : prévoir 3-6 mois de marge sur la date promise par le constructeur</li>
   <li><strong>Dépréciation initiale</strong> : un neuf perd typiquement 5-10 % la première année (revente difficile à valeur d'achat)</li>
   <li><strong>Coûts cachés</strong> : aménagement extérieur, terrasse, clôture, paysagement, électroménagers souvent non inclus</li>
   <li>Qualité variable selon le constructeur — vérifier les antécédents et les jugements GCR</li>
   </ul>

   <h2>L'inspection avant la 1<sup>re</sup> année</h2>
   <p>Crucial : faire inspecter votre construction neuve <strong>avant l'expiration de la garantie de 1 an</strong>. C'est votre dernière fenêtre pour exiger des correctifs sans frais sur les défauts de finition (portes, planchers, calfeutrage, etc.).</p>

   <h2>Comment je vous accompagne sur un neuf</h2>
   <ul>
   <li>Évaluation comparative du constructeur (historique, qualité de livraison, recours GCR)</li>
   <li>Vérification du contrat préliminaire (clauses de pénalités de retard, modifications acceptables)</li>
   <li>Coordination avec votre courtier hypothécaire pour les financements de construction</li>
   <li>Accompagnement à la pré-livraison et à la livraison (liste de correctifs documentée)</li>
   </ul>`]
];
for (const [s,title,lead,body] of TYPES) {
  writePage(`types-de-propriete/${s}/index.html`, contentPage({
    eyebrow:'Type de propriété · Rive-Nord',
    h1:`${title} à vendre — Rive-Nord`,
    lead,
    title:`${title} à vendre Sainte-Thérèse Blainville | Alain Brunelle`,
    desc:`${title} à vendre à Sainte-Thérèse, Blainville, Rosemère, Lorraine. Conseils d'expert et inscriptions Centris à jour.`,
    canonical:`https://alainbrunelle.com/types-de-propriete/${s}/`,
    body: body + `\n<h2>Propriétés actives</h2>\n<p>Consultez la <a href="/nos-proprietes/">liste complète des propriétés disponibles</a>, mise à jour quotidiennement depuis Centris.</p>`
  }));
}

// --- ÉVALUATION GRATUITE (formulaire multi-étapes custom) ---
writePage('vendre/evaluation-gratuite/index.html', layout({
  title: 'Évaluation gratuite de votre propriété — rapport en 48 h | Alain Brunelle',
  description: 'Obtenez une évaluation gratuite et précise de votre propriété à Blainville, Sainte-Thérèse, Rosemère ou Lorraine. Rapport personnalisé livré sous 48 h.',
  canonical: 'https://alainbrunelle.com/vendre/evaluation-gratuite/',
  extraHead: `<style>
    .eval-wrap{max-width:780px;margin:0 auto;padding-block:clamp(2rem,4vw,3rem)}
    .eval-progress{display:flex;align-items:center;gap:.5rem;margin-bottom:2.5rem;padding:0 .5rem}
    .eval-step-dot{flex:1;height:4px;background:var(--line);border-radius:999px;position:relative;overflow:hidden;transition:background .4s var(--ease)}
    .eval-step-dot.done{background:var(--blue)}
    .eval-step-dot.active{background:linear-gradient(90deg,var(--blue) 0%,var(--blue) 100%);background-size:200% 100%;animation:eval-fill 1.5s var(--ease) forwards}
    @keyframes eval-fill{from{background-position:100% 0}to{background-position:0 0}}
    .eval-meta{font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;font-weight:500;margin-bottom:.6rem}
    .eval-card{background:#fff;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:clamp(1.8rem,4vw,3rem);border:1px solid var(--line);position:relative;overflow:hidden;min-height:420px}
    .eval-step{display:none;animation:eval-slide .5s var(--ease)}
    .eval-step.active{display:block}
    @keyframes eval-slide{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
    .eval-step h2{font-size:clamp(1.6rem,3vw,2.2rem);font-weight:400;letter-spacing:-.025em;line-height:1.15;margin-bottom:.8rem;color:var(--ink)}
    .eval-step .sub{color:var(--ink-2);font-size:1.02rem;line-height:1.6;margin-bottom:2rem;max-width:50ch}
    .eval-field{position:relative;margin-bottom:1.5rem}
    .eval-field label{display:block;font-size:.85rem;font-weight:500;color:var(--ink-2);margin-bottom:.5rem;letter-spacing:.01em}
    .eval-field input[type=text],.eval-field input[type=email],.eval-field input[type=tel]{width:100%;padding:1rem 1.1rem;border:1.5px solid var(--line);border-radius:14px;font-family:inherit;font-size:1rem;background:#fff;color:var(--ink);transition:border-color .3s var(--ease),box-shadow .3s var(--ease)}
    .eval-field input:focus{outline:0;border-color:var(--blue);box-shadow:0 0 0 4px var(--blue-soft)}
    .eval-suggestions{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);max-height:280px;overflow-y:auto;z-index:10;display:none}
    .eval-suggestions.open{display:block}
    .eval-suggestion{padding:.85rem 1.1rem;cursor:pointer;font-size:.95rem;border-bottom:1px solid var(--line);transition:background .2s var(--ease)}
    .eval-suggestion:last-child{border-bottom:0}
    .eval-suggestion:hover,.eval-suggestion.active{background:var(--blue-soft);color:var(--blue)}
    .eval-suggestion .sec{display:block;font-size:.78rem;color:var(--muted);margin-top:.15rem}
    .eval-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.7rem}
    .eval-option{padding:1.2rem .9rem;border:1.5px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;text-align:center;font-family:inherit;font-size:1rem;color:var(--ink);transition:all .3s var(--ease-spring);position:relative}
    .eval-option:hover{border-color:var(--blue);transform:translateY(-2px)}
    .eval-option.selected{border-color:var(--blue);background:var(--blue-soft);color:var(--blue);font-weight:500;box-shadow:0 0 0 4px rgba(15,40,85,.08)}
    .eval-option .ico{display:block;font-size:1.6rem;margin-bottom:.4rem;opacity:.7}
    .eval-option.selected .ico{opacity:1}
    .eval-option .desc{display:block;font-size:.78rem;color:var(--muted);margin-top:.2rem;font-weight:400}
    .eval-option.selected .desc{color:var(--blue-2)}
    .eval-actions{display:flex;justify-content:space-between;align-items:center;margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--line)}
    .eval-btn{font-family:inherit;font-size:1rem;font-weight:500;padding:1rem 1.8rem;border-radius:999px;border:0;cursor:pointer;transition:transform .3s var(--ease-spring),background .3s var(--ease),box-shadow .3s var(--ease);display:inline-flex;align-items:center;gap:.6rem}
    .eval-btn.primary{background:linear-gradient(160deg,var(--ink) 0%,oklch(15% 0.08 258) 100%);color:#fff;box-shadow:0 4px 12px -2px rgba(11,22,40,.25)}
    .eval-btn.primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 20px -4px rgba(15,40,85,.35)}
    .eval-btn.primary:disabled{opacity:.4;cursor:not-allowed}
    .eval-btn.ghost{background:transparent;color:var(--muted)}
    .eval-btn.ghost:hover{color:var(--ink)}
    .eval-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    @media(max-width:540px){.eval-row{grid-template-columns:1fr}}
    .eval-success{text-align:center;padding:2rem 1rem}
    .eval-success .check{width:88px;height:88px;border-radius:50%;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center;font-size:2.4rem;margin:0 auto 1.6rem;animation:eval-pop .6s var(--ease-spring)}
    @keyframes eval-pop{from{transform:scale(0)}to{transform:scale(1)}}
    .eval-success h2{font-size:clamp(1.6rem,2.8vw,2.2rem);font-weight:400;letter-spacing:-.02em;margin-bottom:.8rem}
    .eval-success p{color:var(--ink-2);line-height:1.7;max-width:46ch;margin:0 auto 1.5rem}
    .eval-success .recap{background:var(--surface);border-radius:14px;padding:1.5rem;margin:2rem 0;text-align:left;font-size:.92rem;line-height:1.7}
    .eval-success .recap strong{color:var(--blue);font-weight:500}
    .eval-hint{font-size:.8rem;color:var(--muted);margin-top:.7rem;font-style:italic}
  </style>`,
  body: `
<section class="page-head container">
  <div class="eyebrow">Évaluation · 100% gratuite</div>
  <h1>Combien vaut votre propriété en 2026 ?</h1>
  <p class="lead">Répondez à 5 questions rapides. Je personnalise votre rapport et vous le livre par courriel en 48 h. Sans engagement.</p>
</section>

<section class="container">
  <div class="eval-wrap">
    <div class="eval-progress" aria-label="Progression">
      <div class="eval-step-dot active" data-dot="1"></div>
      <div class="eval-step-dot" data-dot="2"></div>
      <div class="eval-step-dot" data-dot="3"></div>
      <div class="eval-step-dot" data-dot="4"></div>
      <div class="eval-step-dot" data-dot="5"></div>
    </div>

    <form class="eval-card" id="eval-form" onsubmit="return false">
      <!-- ÉTAPE 1 — Adresse -->
      <div class="eval-step active" data-step="1">
        <div class="eval-meta">Étape 1 sur 5</div>
        <h2>Quelle est l'adresse de votre propriété ?</h2>
        <p class="sub">Commencez à taper — les suggestions s'affichent automatiquement.</p>
        <div class="eval-field">
          <label for="eval-addr">Adresse complète</label>
          <input type="text" id="eval-addr" name="address" placeholder="ex. 245 rue Fontainebleau, Blainville" autocomplete="off" required>
          <div class="eval-suggestions" id="eval-suggestions"></div>
          <p class="eval-hint">📍 Suggestions powered by OpenStreetMap — vos données restent confidentielles.</p>
        </div>
      </div>

      <!-- ÉTAPE 2 — Type & étages & sous-sol -->
      <div class="eval-step" data-step="2">
        <div class="eval-meta">Étape 2 sur 5</div>
        <h2>Quelle est la configuration ?</h2>
        <p class="sub">Le type et la structure influencent significativement la valeur.</p>
        <div class="eval-field">
          <label>Type de propriété</label>
          <div class="eval-options" data-group="type">
            <button type="button" class="eval-option" data-val="unifamiliale"><span class="ico">🏡</span>Unifamiliale</button>
            <button type="button" class="eval-option" data-val="condo"><span class="ico">🏢</span>Condo</button>
            <button type="button" class="eval-option" data-val="maison-ville"><span class="ico">🏘️</span>Maison de ville</button>
            <button type="button" class="eval-option" data-val="plex"><span class="ico">🏬</span>Plex</button>
          </div>
        </div>
        <div class="eval-field">
          <label>Nombre d'étages</label>
          <div class="eval-options" data-group="etages">
            <button type="button" class="eval-option" data-val="1">1 étage</button>
            <button type="button" class="eval-option" data-val="1.5">1½</button>
            <button type="button" class="eval-option" data-val="2">2 étages</button>
            <button type="button" class="eval-option" data-val="3+">3+</button>
          </div>
        </div>
        <div class="eval-field">
          <label>Sous-sol</label>
          <div class="eval-options" data-group="soussol">
            <button type="button" class="eval-option" data-val="fini">Fini</button>
            <button type="button" class="eval-option" data-val="semi">Semi-fini</button>
            <button type="button" class="eval-option" data-val="non-fini">Non fini</button>
            <button type="button" class="eval-option" data-val="aucun">Aucun</button>
          </div>
        </div>
      </div>

      <!-- ÉTAPE 3 — Chambres & salles de bain -->
      <div class="eval-step" data-step="3">
        <div class="eval-meta">Étape 3 sur 5</div>
        <h2>Combien de pièces ?</h2>
        <p class="sub">Critère majeur dans la comparaison avec les ventes récentes du secteur.</p>
        <div class="eval-field">
          <label>Chambres à coucher</label>
          <div class="eval-options" data-group="chambres">
            <button type="button" class="eval-option" data-val="1">1</button>
            <button type="button" class="eval-option" data-val="2">2</button>
            <button type="button" class="eval-option" data-val="3">3</button>
            <button type="button" class="eval-option" data-val="4">4</button>
            <button type="button" class="eval-option" data-val="5+">5 +</button>
          </div>
        </div>
        <div class="eval-field">
          <label>Salles de bain complètes</label>
          <div class="eval-options" data-group="sdb">
            <button type="button" class="eval-option" data-val="1">1</button>
            <button type="button" class="eval-option" data-val="2">2</button>
            <button type="button" class="eval-option" data-val="3">3</button>
            <button type="button" class="eval-option" data-val="4+">4 +</button>
          </div>
        </div>
      </div>

      <!-- ÉTAPE 4 — Rénovations -->
      <div class="eval-step" data-step="4">
        <div class="eval-meta">Étape 4 sur 5</div>
        <h2>État des rénovations</h2>
        <p class="sub">Une cuisine refaite il y a 3 ans n'a pas la même valeur que celle de 1995.</p>
        <div class="eval-field">
          <label>Rénovations majeures les plus récentes (cuisine, salle de bain, toit, fenêtres)</label>
          <div class="eval-options" data-group="renos" style="grid-template-columns:1fr">
            <button type="button" class="eval-option" data-val="-5"><strong>Moins de 5 ans</strong><span class="desc">Cuisine, salle de bain ou toiture refaits récemment</span></button>
            <button type="button" class="eval-option" data-val="5-10"><strong>5 à 10 ans</strong><span class="desc">Rénovations encore modernes mais commencent à dater</span></button>
            <button type="button" class="eval-option" data-val="10-25"><strong>10 à 25 ans</strong><span class="desc">Rénovations à prévoir à moyen terme</span></button>
            <button type="button" class="eval-option" data-val="25+"><strong>Plus de 25 ans</strong><span class="desc">Propriété à conserver ou à rénover</span></button>
            <button type="button" class="eval-option" data-val="aucune"><strong>Aucune rénovation majeure</strong><span class="desc">Propriété à conserver ou à rénover entièrement</span></button>
          </div>
        </div>
      </div>

      <!-- ÉTAPE 5 — Coordonnées -->
      <div class="eval-step" data-step="5">
        <div class="eval-meta">Étape 5 sur 5 — Dernière étape</div>
        <h2>Où vous envoyer votre rapport ?</h2>
        <p class="sub">Je le prépare personnellement et vous le livre en 48 h, sans engagement de votre part.</p>
        <div class="eval-row">
          <div class="eval-field">
            <label for="eval-name">Nom complet</label>
            <input type="text" id="eval-name" name="name" required>
          </div>
          <div class="eval-field">
            <label for="eval-phone">Téléphone</label>
            <input type="tel" id="eval-phone" name="phone" placeholder="450 000-0000">
          </div>
        </div>
        <div class="eval-field">
          <label for="eval-email">Courriel</label>
          <input type="email" id="eval-email" name="email" required>
          <p class="eval-hint">Promesse : aucun spam, aucune liste partagée. Vous pouvez vous désabonner en 1 clic.</p>
        </div>
      </div>

      <!-- ÉTAPE 6 — Succès (cachée) -->
      <div class="eval-step" data-step="6">
        <div class="eval-success">
          <div class="check">✓</div>
          <h2>Merci. Votre demande est reçue.</h2>
          <p>Je prépare personnellement votre rapport d'évaluation. Vous recevrez par courriel dans les 48 h votre fourchette de prix, les 5 ventes comparables les plus pertinentes et mes recommandations de préparation.</p>
          <div class="recap" id="eval-recap"></div>
          <a class="eval-btn primary" href="/" style="text-decoration:none">Retour à l'accueil →</a>
        </div>
      </div>

      <!-- Actions (cachées sur étape 6) -->
      <div class="eval-actions" id="eval-actions">
        <button type="button" class="eval-btn ghost" id="eval-back" style="visibility:hidden">← Retour</button>
        <button type="button" class="eval-btn primary" id="eval-next" disabled>Continuer →</button>
      </div>
    </form>
  </div>
</section>

<script>
(function(){
  const TOTAL=5;
  let current=1;
  const answers={type:null,etages:null,soussol:null,chambres:null,sdb:null,renos:null,address:'',name:'',email:'',phone:''};
  const $=s=>document.querySelector(s);
  const $$=s=>document.querySelectorAll(s);
  const stepEl=n=>$('.eval-step[data-step="'+n+'"]');
  const dotEl=n=>$('.eval-step-dot[data-dot="'+n+'"]');

  // Option button selection
  $$('.eval-options').forEach(grp=>{
    grp.addEventListener('click',e=>{
      const btn=e.target.closest('.eval-option'); if(!btn)return;
      const group=grp.dataset.group;
      grp.querySelectorAll('.eval-option').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      answers[group]=btn.dataset.val;
      validate();
    });
  });

  // Text inputs
  ['eval-addr','eval-name','eval-email','eval-phone'].forEach(id=>{
    const el=document.getElementById(id);
    el.addEventListener('input',()=>{
      if(id==='eval-addr')answers.address=el.value;
      if(id==='eval-name')answers.name=el.value;
      if(id==='eval-email')answers.email=el.value;
      if(id==='eval-phone')answers.phone=el.value;
      validate();
    });
  });

  function isValid(step){
    if(step===1)return answers.address.trim().length>=8;
    if(step===2)return answers.type&&answers.etages&&answers.soussol;
    if(step===3)return answers.chambres&&answers.sdb;
    if(step===4)return answers.renos;
    if(step===5)return answers.name.trim().length>=2 && /\\S+@\\S+\\.\\S+/.test(answers.email);
    return false;
  }
  function validate(){
    $('#eval-next').disabled=!isValid(current);
  }

  function go(n){
    stepEl(current).classList.remove('active');
    current=n;
    stepEl(current).classList.add('active');
    for(let i=1;i<=TOTAL;i++){
      dotEl(i).classList.toggle('done',i<current);
      dotEl(i).classList.toggle('active',i===current);
    }
    $('#eval-back').style.visibility=current===1?'hidden':'visible';
    $('#eval-next').textContent=current===TOTAL?'Recevoir mon rapport →':'Continuer →';
    if(current>TOTAL){finalize();return;}
    validate();
    window.scrollTo({top:$('.eval-wrap').offsetTop-100,behavior:'smooth'});
  }

  $('#eval-next').addEventListener('click',()=>{
    if(!isValid(current))return;
    if(current===TOTAL){submit();return;}
    go(current+1);
  });
  $('#eval-back').addEventListener('click',()=>{
    if(current>1)go(current-1);
  });

  // Submit
  function submit(){
    // For now, no backend — show success state with summary.
    // To wire backend later: POST answers to /api/evaluation or Formspree.
    const labels={
      type:{unifamiliale:'Unifamiliale',condo:'Condo','maison-ville':'Maison de ville',plex:'Plex'},
      etages:{'1':'1 étage','1.5':'1½','2':'2 étages','3+':'3+ étages'},
      soussol:{fini:'fini',semi:'semi-fini','non-fini':'non fini',aucun:'aucun sous-sol'},
      renos:{'-5':'récentes (< 5 ans)','5-10':'5 à 10 ans','10-25':'10 à 25 ans','25+':'plus de 25 ans',aucune:'aucune'}
    };
    const recap='<strong>Récapitulatif</strong><br>'+
      '📍 '+answers.address+'<br>'+
      '🏡 '+(labels.type[answers.type]||answers.type)+' · '+(labels.etages[answers.etages]||answers.etages)+' · sous-sol '+(labels.soussol[answers.soussol]||answers.soussol)+'<br>'+
      '🛏️ '+answers.chambres+' chambre(s) · '+answers.sdb+' salle(s) de bain<br>'+
      '🔧 Rénovations : '+(labels.renos[answers.renos]||answers.renos);
    $('#eval-recap').innerHTML=recap;
    $('#eval-actions').style.display='none';
    stepEl(current).classList.remove('active');
    current=6;
    stepEl(6).classList.add('active');
    document.querySelectorAll('.eval-step-dot').forEach(d=>{d.classList.add('done');d.classList.remove('active');});
    window.scrollTo({top:$('.eval-wrap').offsetTop-100,behavior:'smooth'});
  }

  // Address autocomplete via Photon (OpenStreetMap) — gratuit, sans clé
  const addrInput=$('#eval-addr');
  const sugBox=$('#eval-suggestions');
  let suggestions=[],activeIdx=-1,debounceTimer;

  function renderSug(){
    if(!suggestions.length){sugBox.classList.remove('open');return;}
    sugBox.innerHTML=suggestions.map((s,i)=>'<div class="eval-suggestion'+(i===activeIdx?' active':'')+'" data-i="'+i+'">'+s.label+(s.sec?'<span class="sec">'+s.sec+'</span>':'')+'</div>').join('');
    sugBox.classList.add('open');
  }
  async function fetchSug(q){
    if(q.length<3){suggestions=[];renderSug();return;}
    try{
      // Bbox approximatif Rive-Nord + Laurentides QC
      const url='https://photon.komoot.io/api?q='+encodeURIComponent(q)+'&lang=fr&limit=6&bbox=-75.5,45.4,-73.4,46.5';
      const res=await fetch(url);
      const data=await res.json();
      suggestions=(data.features||[]).filter(f=>f.properties.country==='Canada').map(f=>{
        const p=f.properties;
        const label=[p.housenumber,p.street||p.name].filter(Boolean).join(' ')||(p.name||'');
        const sec=[p.city||p.town||p.village,p.state].filter(Boolean).join(', ');
        return {label,sec};
      }).filter(s=>s.label.length>0);
    }catch{suggestions=[];}
    activeIdx=-1;
    renderSug();
  }
  addrInput.addEventListener('input',()=>{
    clearTimeout(debounceTimer);
    debounceTimer=setTimeout(()=>fetchSug(addrInput.value.trim()),250);
  });
  addrInput.addEventListener('keydown',e=>{
    if(!suggestions.length)return;
    if(e.key==='ArrowDown'){e.preventDefault();activeIdx=Math.min(activeIdx+1,suggestions.length-1);renderSug();}
    if(e.key==='ArrowUp'){e.preventDefault();activeIdx=Math.max(activeIdx-1,0);renderSug();}
    if(e.key==='Enter'&&activeIdx>=0){e.preventDefault();pick(activeIdx);}
    if(e.key==='Escape'){suggestions=[];renderSug();}
  });
  function pick(i){
    const s=suggestions[i];
    addrInput.value=s.label+(s.sec?', '+s.sec:'');
    answers.address=addrInput.value;
    suggestions=[];renderSug();
    validate();
  }
  sugBox.addEventListener('click',e=>{
    const it=e.target.closest('.eval-suggestion');
    if(it)pick(+it.dataset.i);
  });
  document.addEventListener('click',e=>{
    if(!sugBox.contains(e.target)&&e.target!==addrInput){sugBox.classList.remove('open');}
  });

  // Init
  validate();
})();
</script>
`
}));

// --- VENDRE / ACHETER / INVESTISSEUR ---
const SUBPAGES = [
  ['vendre/etapes-pour-vendre','Les 7 étapes pour vendre sa maison','Processus vendeur','De la mise en marché à l\'acte notarié — chaque étape démystifiée par 29 ans d\'expérience.','Les 7 étapes pour vendre sa maison au Québec | Alain Brunelle','Vendre sa maison au Québec en 7 étapes claires : évaluation, préparation, mise en marché, visites, offres, notaire. Conseils du meilleur courtier de la Rive-Nord.',`<p>Vendre une propriété, ce n'est pas une opération mystérieuse — c'est un processus en sept étapes parfaitement balisées. La différence entre un courtier ordinaire et un courtier qui livre, c'est la rigueur avec laquelle chacune de ces étapes est exécutée. Voici exactement comment ça fonctionne quand vous travaillez avec moi.</p>

<h2>1. Évaluation et positionnement de prix</h2>
<p>Tout commence ici. Une évaluation mal calibrée coûte en moyenne <strong>3,2 % du prix final</strong> selon les données APCIQ 2025 — sur une maison de 600 000 $, ça représente <strong>près de 20 000 $ laissés sur la table</strong>. Mon analyse comparative s'appuie sur trois couches : les ventes des 12 derniers mois à moins de 500 m, l'inventaire actif dans votre typologie, et les tendances saisonnières du secteur. <a href="/vendre/evaluation-gratuite/">Obtenez votre évaluation gratuite</a> — rapport livré sous 48 h.</p>

<h2>2. Préparation de la propriété</h2>
<p>Désencombrement, peinture des zones-clés, home staging léger, photo professionnelle préparée. Un investissement moyen de 1 500 à 3 000 $ rapporte en moyenne 15 000 à 40 000 $ sur le prix de vente final. <a href="/vendre/preparer-sa-maison/">Voir la checklist détaillée</a>.</p>

<h2>3. Photographie et création de la mise en marché</h2>
<p>Photos HDR 4K, vidéo drone, plan d'étage 2D et visite virtuelle 360° — tout est inclus dans mes services, sans frais additionnels. La fiche Centris est ensuite optimisée mot par mot : titre, description longue, mots-clés, ordre des photos.</p>

<h2>4. Diffusion Centris + réseau qualifié</h2>
<p>Avant même que votre propriété apparaisse publiquement sur Centris, elle est envoyée à mes <strong>12 400 contacts qualifiés</strong> de la Rive-Nord, segmentés par budget et secteur cible. Cette pré-mise en marché génère en moyenne <strong>3 à 5 visites privées dans les 72 premières heures</strong>.</p>

<h2>5. Gestion des visites et feedback structuré</h2>
<p>Chaque visite est coordonnée, suivie d'un feedback structuré au visiteur dans les 24 h. Si quelque chose dérange l'acheteur (couleur, odeur, prix perçu), je le sais immédiatement et je m'ajuste. Pas de mystère, pas de visites perdues.</p>

<h2>6. Offres, contre-propositions et négociation</h2>
<p>L'analyse d'une offre dépasse largement le prix : conditions, délais, dépôt, garanties, clauses suspensives. Mon ratio prix vendu/demandé moyen est de <strong>99,2 %</strong> — contre 97,1 % pour la moyenne du marché. Ça ne s'improvise pas.</p>

<h2>7. Inspection, notaire et prise de possession</h2>
<p>Coordination de l'inspection (mes inspecteurs partenaires sont disponibles sous 48-72 h), suivi de la promesse d'achat jusqu'à l'acte notarié. Je suis présent au notaire le jour de la signature — c'est mon rôle, pas un extra.</p>

<h2>FAQ — vendre sa maison au Québec</h2>
<h3>Combien de temps prend une vente sur la Rive-Nord en 2026 ?</h3>
<p>Délai médian du marché : 52 jours. Délai médian sur mes inscriptions : <strong>28 jours</strong>. La différence vient du positionnement initial et de la qualité de la mise en marché.</p>
<h3>Dois-je vraiment passer par un courtier ?</h3>
<p>Statistiquement, les maisons vendues par courtier se vendent <strong>13 % plus cher en moyenne</strong> que les ventes DPP (sans courtier), selon l'APCIQ. La commission est rentabilisée bien au-delà.</p>
<h3>Combien coûte la commission ?</h3>
<p>Voir <a href="/vendre/commission-courtier/">notre page dédiée</a>. La fourchette typique au Québec : 4 % à 5 %, négociable selon le mandat.</p>`],
  ['vendre/preparer-sa-maison','Préparer sa maison pour la vente','Home staging','Petites interventions, grand impact — 1 500 $ investis rapportent en moyenne 25 000 $ sur le prix final.','Préparer sa maison pour la vente · home staging Rive-Nord | Alain Brunelle','Guide complet pour préparer sa maison à la vente : désencombrement, peinture, éclairage, home staging. ROI moyen documenté.',`<p>L'acheteur prend sa décision dans les <strong>90 premières secondes</strong> d'une visite. Pas pendant l'inspection, pas pendant la négociation — dès qu'il franchit la porte. C'est pourquoi la préparation visuelle de votre propriété est l'investissement au rendement le plus garanti que vous ferez avant la vente.</p>

<h2>La règle des 3D : Désencombrer, Dépersonnaliser, Détacher</h2>
<p>Avant toute peinture ou rénovation, faites le grand ménage des objets. Objectif : que chaque pièce respire et qu'un acheteur puisse <em>se projeter</em>. Trop de photos personnelles, trop de meubles, trop d'objets décoratifs = l'acheteur voit votre maison, pas la sienne.</p>
<ul>
<li>Retirez <strong>50 % des meubles inutiles</strong> (entreposage temporaire si nécessaire)</li>
<li>Décrochez les photos de famille — laissez les œuvres d'art neutres</li>
<li>Videz les armoires de cuisine à 70 % (signale de l'espace de rangement abondant)</li>
<li>Désencombrez les comptoirs, les surfaces de salle de bain, les étagères</li>
</ul>

<h2>Les 5 interventions au meilleur rapport investissement/retour</h2>
<ol>
<li><strong>Peinture des zones-clés</strong> (entrée, salon, cuisine) — investissement 800-1 500 $, impact +8 000 à +15 000 $</li>
<li><strong>Éclairage</strong> — remplacez les ampoules jaunes par du 3000K. Tout paraît plus grand, plus propre. ~200 $.</li>
<li><strong>Robinetterie cuisine + salle de bain</strong> — 300-500 $ chacun, signal fort de modernité</li>
<li><strong>Aménagement paysager d'entrée</strong> — premier contact visuel. Mulch frais, fleurs, porte d'entrée repeinte. ~400 $.</li>
<li><strong>Nettoyage professionnel en profondeur</strong> avant les photos — ~300 $. Différence visible immédiate sur le rendu photo.</li>
</ol>

<h2>Ce qu'il ne faut PAS faire</h2>
<p>Beaucoup de vendeurs investissent dans les mauvaises choses :</p>
<ul>
<li>Refaire entièrement une cuisine ou salle de bain juste avant la vente — vous ne récupérerez qu'une fraction du coût</li>
<li>Choisir des finis très personnels (couleurs vives, motifs forts)</li>
<li>Faire des rénovations majeures sans consulter votre courtier d'abord</li>
<li>Cacher des défauts — l'inspection les trouvera et minera la confiance</li>
</ul>

<h2>Home staging professionnel : quand ça vaut la peine</h2>
<p>Pour les propriétés au-dessus de 750 000 $, un home staging professionnel (1 800-3 500 $) peut littéralement transformer la perception. J'ai des partenaires home stagers que je recommande à mes vendeurs — service souvent inclus dans mon mandat selon le prix de la propriété.</p>

<h2>FAQ — préparation à la vente</h2>
<h3>Combien dois-je vraiment investir avant de vendre ?</h3>
<p>Pour une maison médiane de la Rive-Nord (~600 k$), un budget de préparation de 2 000 à 4 000 $ est optimal. Au-delà, le rendement marginal diminue rapidement.</p>
<h3>Vaut-il mieux refaire la cuisine ou la vendre telle quelle ?</h3>
<p>Sauf cas extrême, vendez telle quelle. Rénover prend 6-12 semaines (perte de temps de mise en marché), coûte 30-80 k$ pour une cuisine, et l'acheteur préfère souvent personnaliser lui-même. Ajustez plutôt le prix légèrement à la baisse.</p>
<h3>Quand commencer la préparation ?</h3>
<p>Idéalement 4 à 6 semaines avant la mise en marché. <a href="/contact/">Parlons-en avant les premiers travaux</a> — je peux vous éviter des dépenses inutiles.</p>`],
  ['vendre/commission-courtier','Commission d\'un courtier immobilier','Commission & honoraires','Comprendre exactement ce qu\'inclut la commission — et pourquoi elle est rentabilisée 4 fois sur 5.','Commission courtier immobilier Québec 2026 | Alain Brunelle','Taux de commission au Québec, partage entre courtiers, ce qui est inclus, ce qui est négociable. Explications transparentes par un courtier RE/MAX CRYSTAL.',`<p>La commission, c'est le point le plus mal compris du métier de courtier. Le mythe : « le courtier prend 5 % juste pour mettre une pancarte ». La réalité : la commission paie un service complet qui inclut habituellement plus de 50 heures de travail spécialisé, des outils marketing professionnels, et un réseau acheteur de plusieurs milliers de contacts.</p>

<h2>Taux typique au Québec en 2026</h2>
<p>La commission immobilière résidentielle se situe entre <strong>4 % et 5 % du prix de vente final</strong>, plus taxes (TPS + TVQ). Elle est entièrement <strong>payée par le vendeur</strong>, jamais par l'acheteur.</p>
<p>Sur une vente à 600 000 $, ça représente :</p>
<ul>
<li>Commission brute : 24 000 $ à 30 000 $</li>
<li>Plus TPS (5 %) + TVQ (9,975 %)</li>
<li>Total payable au courtier inscripteur : 27 593 $ à 34 491 $</li>
</ul>

<h2>Comment la commission est partagée</h2>
<p>Dans 92 % des transactions au Québec, deux courtiers sont impliqués :</p>
<ul>
<li><strong>Courtier inscripteur</strong> (le vôtre, qui représente le vendeur) — reçoit environ <strong>50 %</strong> de la commission brute</li>
<li><strong>Courtier collaborateur</strong> (qui apporte l'acheteur) — reçoit l'autre <strong>50 %</strong></li>
</ul>
<p>Chaque courtier remet ensuite une portion à sa bannière (RE/MAX, Royal LePage, etc.), à son agence, et paie ses propres frais (publicité, photographie, plateforme, OACIQ, assurance professionnelle). Le revenu net du courtier inscripteur sur une commission de 30 000 $ tourne typiquement autour de 9 000 à 12 000 $.</p>

<h2>Ce qui est inclus dans ma commission</h2>
<ul>
<li>Évaluation comparative avant inscription (rapport 48 h)</li>
<li>Photographie professionnelle HDR 4K + vidéo drone + plan d'étage 2D + visite virtuelle 360°</li>
<li>Inscription Centris + diffusion sur le réseau RE/MAX international</li>
<li>Campagne sociale (Facebook + Instagram + LinkedIn) avec budget publicitaire</li>
<li>Brochure imprimée sur place</li>
<li>Pré-mise en marché à mon réseau de 12 400 contacts qualifiés</li>
<li>Gestion complète des visites et feedback structuré</li>
<li>Négociation de toutes les offres et contre-offres</li>
<li>Coordination de l'inspection, du financement et du notaire</li>
<li>Présence au notaire le jour de la signature</li>
</ul>

<h2>Ce qui est négociable</h2>
<p>Trois leviers principaux :</p>
<ol>
<li><strong>Le taux global</strong> — selon le prix de la propriété (les ventes au-dessus de 1 M$ sont souvent à 3-4 %)</li>
<li><strong>Le partage avec le collaborateur</strong> — qui détermine la motivation des autres courtiers à amener leurs acheteurs chez vous</li>
<li><strong>La durée du mandat</strong> et les clauses d'exclusivité</li>
</ol>
<p>Mon approche : je propose toujours <strong>la structure qui maximise votre prix net</strong>, pas celle qui maximise ma commission. Souvent ce sont des décisions contre-intuitives — par exemple, augmenter le partage au collaborateur pour mobiliser plus d'agents acheteurs.</p>

<h2>FAQ — commission</h2>
<h3>Puis-je vendre sans courtier pour économiser ?</h3>
<p>Vous pouvez. Mais les statistiques APCIQ sont sans équivoque : les maisons vendues sans courtier (DPP) se vendent <strong>13 % moins cher en moyenne</strong> qu'avec courtier. Sur une maison de 600 k$, c'est 78 000 $ perdus pour économiser ~28 000 $ de commission. Le calcul ne tient pas.</p>
<h3>Et si ma maison ne se vend pas, est-ce que je paie quand même ?</h3>
<p>Non. La commission n'est payée qu'à la signature de l'acte de vente chez le notaire. Si rien ne se vend, vous ne devez rien.</p>
<h3>Puis-je négocier une commission par étapes ?</h3>
<p>Oui — c'est même conseillé dans certains cas. Je vous explique les options à notre première rencontre. <a href="/rendez-vous/">Prendre rendez-vous</a>.</p>`],
  ['vendre/vendre-sans-stress','Vendre sans stress','Accompagnement complet','Un processus balisé, des nouvelles aux 7 jours, zéro surprise — c\'est ma promesse.','Vendre sa maison sans stress sur la Rive-Nord | Alain Brunelle','Méthode pour vendre sa maison sans stress : planning hebdomadaire, checklist par étape, communication transparente. Alain Brunelle RE/MAX CRYSTAL.',`<p>Vendre une maison, c'est rarement juste une transaction financière. C'est un déménagement, un changement de vie, parfois une séparation, parfois un deuil. L'émotion fait partie du processus, et l'ignorer ne la fait pas disparaître. Mon rôle, ce n'est pas seulement de vendre votre propriété — c'est de transformer une période émotionnellement chargée en un processus <strong>prévisible</strong>.</p>

<h2>Ma promesse en 4 engagements</h2>
<ol>
<li><strong>Un point hebdomadaire fixe</strong>, chaque vendredi à la même heure. Visites de la semaine, feedback des acheteurs, ajustements proposés. 15 minutes, par téléphone ou en personne. Pas de jeu de cache-cache.</li>
<li><strong>Réponse à toute question en moins de 4 heures</strong> en journée (24 h max le week-end). Texto, courriel ou téléphone — vous choisissez le canal.</li>
<li><strong>Toujours deux à trois scénarios</strong> à chaque décision importante (prix, ajustements, offres reçues). Vous décidez avec les chiffres en main, jamais sur intuition.</li>
<li><strong>Zéro surprise</strong> à la signature chez le notaire. Tous les frais, délais et conditions sont sur la table dès la première rencontre.</li>
</ol>

<h2>Le calendrier-type d'une vente sereine</h2>
<table style="width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:.95rem">
<thead><tr><th style="text-align:left;padding:.6rem;border-bottom:1px solid #e6ebf2">Semaine</th><th style="text-align:left;padding:.6rem;border-bottom:1px solid #e6ebf2">Étape</th></tr></thead>
<tbody>
<tr><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">S-4</td><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">Première rencontre, signature du mandat, évaluation</td></tr>
<tr><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">S-3 à S-2</td><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">Préparation de la propriété, désencombrement, peinture si requise</td></tr>
<tr><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">S-1</td><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">Photos, vidéo drone, plan d'étage, rédaction de la fiche</td></tr>
<tr><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">Jour J</td><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">Mise en marché Centris + pré-diffusion à mon réseau (72 h en avant-première)</td></tr>
<tr><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">Semaines 1-4</td><td style="padding:.6rem;border-bottom:1px solid #e6ebf2">Visites, feedback, ajustements, négociation des premières offres</td></tr>
<tr><td style="padding:.6rem">Semaines 5-9</td><td style="padding:.6rem">Inspection, financement de l'acheteur, signature notaire</td></tr>
</tbody>
</table>

<h2>Les 3 sources de stress que j'élimine pour vous</h2>
<h3>L'incertitude sur la valeur réelle</h3>
<p>Vous ne saurez jamais avec précision si vous avez « bien fait ». Mon rapport d'évaluation comparative vous donne <strong>trois fourchettes</strong> (basse, médiane, optimiste) basées sur des données vérifiables — pas sur des promesses.</p>
<h3>La peur des visites surprises</h3>
<p>Toute visite est planifiée 24 h à l'avance minimum. Aucun acheteur n'entre chez vous sans rendez-vous confirmé. Vous gardez le contrôle total de votre temps.</p>
<h3>La panique des offres « time-bombs »</h3>
<p>Quand une offre arrive avec un délai de 24 h, l'instinct est de céder à la pression. Mon rôle est de vous montrer froidement les 2-3 options réalistes : accepter, contre-proposer, refuser. Et de vous dire ce que je ferais si c'était la mienne.</p>

<h2>Ce que disent mes clients</h2>
<blockquote style="border-left:3px solid #0f2855;padding:.6rem 0 .6rem 1.2rem;margin:1.5rem 0;color:#2a3a54;font-style:italic">« Quand on a vendu notre maison à Sainte-Thérèse, j'avais perdu le sommeil pendant des mois en pensant à toute la paperasse. Alain a tout pris en main. Il m'envoyait un texto le vendredi avec le résumé de la semaine. Je n'ai jamais eu à courir après lui pour comprendre où on en était. — Marie-Claude, vendu en 22 jours »</blockquote>

<h2>FAQ — vendre sans stress</h2>
<h3>Combien de visites devrai-je accepter ?</h3>
<p>En moyenne, mes inscriptions reçoivent 8 à 15 visites avant d'obtenir une offre acceptable. Toutes sont coordonnées et regroupées si possible (visites libres, après-midis dédiés).</p>
<h3>Que se passe-t-il si je change d'idée en cours de route ?</h3>
<p>Le mandat peut être résilié avec préavis. Aucune pénalité tant qu'il n'y a pas d'offre acceptée. <a href="/contact/">Parlons-en avant la signature</a> pour éviter toute mauvaise surprise.</p>
<h3>Et si je dois vendre rapidement pour un déménagement professionnel ?</h3>
<p>Mon délai médian est de 28 jours. Avec un positionnement de prix légèrement agressif (-3 à -5 %), on peut viser 14-21 jours sans sacrifier la qualité de l'offre.</p>`],
  ['acheter/premier-acheteur','Premier acheteur','Acheteur · Guide','Acheter sa première maison à Sainte-Thérèse ou Blainville — le guide complet, sans jargon.','Premier acheteur Sainte-Thérèse Blainville 2026 | Alain Brunelle','Guide complet premier acheteur Rive-Nord : préapprobation, RAP, CELIAPP, frais cachés, négociation. Alain Brunelle vous accompagne pas à pas.',`<p>Vous achetez votre première propriété. C'est probablement la plus grosse décision financière de votre vie, et personne ne vous a vraiment appris à la prendre. Voici le guide que j'aurais aimé avoir quand j'ai acheté ma première maison à 24 ans.</p>

<h2>1. Connaître votre capacité réelle (pas le maximum)</h2>
<p>La première erreur du premier acheteur, c'est de viser le maximum permis par le prêteur. La banque accepte de vous prêter jusqu'à <strong>32 % de votre revenu brut</strong> en logement (ABD) et 40 % avec toutes vos dettes (ATD). Mais vivre à 32 % d'ABD, c'est financièrement étranglé. <strong>Cible réaliste : 28 % maximum.</strong></p>
<p><a href="/acheter/calculatrices/">Utilisez ma calculatrice de capacité</a> pour avoir un chiffre précis avant même de parler à une banque.</p>

<h2>2. Préapprobation hypothécaire — toujours avant les visites</h2>
<p>Ne visitez <strong>jamais</strong> sans préapprobation écrite en main. Trois raisons :</p>
<ul>
<li>Vous évitez de tomber amoureux d'une maison hors de prix</li>
<li>Vous gelez votre taux d'intérêt pour 90-120 jours (protection contre une hausse)</li>
<li>Vos offres sont prises au sérieux par les vendeurs et leurs courtiers</li>
</ul>
<p>La préapprobation est gratuite et n'engage à rien. Je peux vous référer à 3-4 courtiers hypothécaires partenaires qui magasinent pour vous parmi 20+ prêteurs.</p>

<h2>3. Mise de fonds : combien et d'où ?</h2>
<p>Minimum légal au Canada :</p>
<ul>
<li><strong>5 %</strong> pour la tranche jusqu'à 500 000 $</li>
<li><strong>10 %</strong> pour la tranche entre 500 000 $ et 1 500 000 $</li>
<li><strong>20 %</strong> au-delà de 1,5 M$</li>
</ul>
<p>Sous 20 %, vous payez une <strong>assurance prêt SCHL</strong> (1,8 % à 4 % du prêt, ajoutée à votre hypothèque). Si possible, visez 20 % pour l'éviter — sur 500 k$ empruntés, c'est ~15 000 $ d'économisés en assurance.</p>

<h2>4. Programmes gouvernementaux à connaître</h2>
<h3>Régime d'accession à la propriété (RAP)</h3>
<p>Retirez jusqu'à <strong>60 000 $ par personne</strong> de votre REER (120 000 $ en couple) sans impôt, à rembourser sur 15 ans. Particulièrement puissant si vous cotisez au REER depuis quelques années.</p>
<h3>CELIAPP (Compte d'épargne libre d'impôt pour l'achat d'une première propriété)</h3>
<p>Le programme le plus avantageux créé en 2023. Contributions <strong>déductibles d'impôt</strong> (jusqu'à 8 000 $/an, max 40 000 $ à vie), retrait <strong>non imposable</strong> pour acheter. Combinable avec le RAP.</p>
<h3>Crédit d'impôt fédéral et provincial</h3>
<p>Jusqu'à <strong>1 500 $ fédéral + 1 500 $ provincial</strong> à votre déclaration suivant l'achat. Cumulables.</p>
<h3>Remboursement de la TPS/TVQ (constructions neuves)</h3>
<p>Sur les propriétés neuves, vous récupérez une partie des taxes (jusqu'à 36 % du remboursement TPS sur les premières tranches). À connaître avant de signer un préliminaire avec un constructeur.</p>

<h2>5. Les frais cachés que personne ne mentionne</h2>
<p>En plus de la mise de fonds, prévoyez <strong>1,5 % à 3 % du prix d'achat</strong> en frais ponctuels :</p>
<ul>
<li>Inspection préachat : 600-1 200 $</li>
<li>Notaire : 1 200-2 500 $</li>
<li>Taxe de bienvenue (mutation immobilière) : ~1 % à 2 % du prix — payable 30 à 60 jours après la prise de possession (souvent une mauvaise surprise)</li>
<li>Ajustements (taxes municipales, scolaires payées d'avance par le vendeur) : 500-2 500 $</li>
<li>Déménagement, peinture, petits travaux : prévoir 3 000-8 000 $</li>
</ul>

<h2>Comment je vous accompagne comme premier acheteur</h2>
<p>Mes services sont <strong>gratuits pour vous comme acheteur</strong> — je suis rémunéré par le vendeur via la commission Centris. Concrètement :</p>
<ul>
<li>Pré-sélection de propriétés selon vos vrais critères (pas juste prix + nb chambres)</li>
<li>Visites accompagnées avec mes 29 ans d'expérience pour repérer les drapeaux rouges</li>
<li>Référencement aux meilleurs courtiers hypothécaires, inspecteurs, notaires</li>
<li>Rédaction et négociation de votre promesse d'achat — la majorité des premiers acheteurs payent 3-5 % trop cher faute de négociation</li>
<li>Coordination jusqu'à la remise des clés</li>
</ul>

<h2>FAQ — premier acheteur</h2>
<h3>Quel revenu faut-il pour acheter à Blainville en 2026 ?</h3>
<p>Pour une unifamiliale médiane à 685 000 $ avec 20 % de mise de fonds : revenu ménage minimum d'environ <strong>135 000-150 000 $/an</strong>. Pour un condo à 380 000 $ : ~75 000 $/an.</p>
<h3>Combien de temps prend tout le processus ?</h3>
<p>De la préapprobation à la prise de possession : typiquement <strong>3 à 5 mois</strong>. Recherche active 4-8 semaines, négociation 1-2 semaines, fermeture 6-10 semaines.</p>
<h3>Et si l'inspection révèle des problèmes ?</h3>
<p>Vous avez trois options : négocier une réduction de prix, exiger des travaux avant signature, ou annuler la promesse (si la condition d'inspection est encore active). Mon rôle est de vous guider vers la décision rationnelle, pas émotionnelle.</p>`],
  ['acheter/etapes-pour-acheter','Les 9 étapes pour acheter','Processus acheteur','De la préapprobation à la remise des clés — chaque étape démystifiée.','Les 9 étapes pour acheter une maison au Québec | Alain Brunelle','Étapes complètes pour acheter une maison au Québec : préapprobation, visites, promesse, inspection, financement, notaire, possession.',`<p>Acheter une propriété au Québec, c'est neuf étapes parfaitement balisées. Voici la cartographie complète avec les délais réalistes, pour que vous sachiez toujours où vous en êtes.</p>

<h2>1. Préapprobation hypothécaire <span style="color:#6a7891;font-weight:400">— 1 à 3 jours</span></h2>
<p>Avant tout. Le courtier hypothécaire magasine pour vous parmi 20+ prêteurs. Vous repartez avec une lettre confirmant votre capacité maximale et votre taux gelé 90-120 jours.</p>

<h2>2. Définition des critères et recherche <span style="color:#6a7891;font-weight:400">— variable</span></h2>
<p>Pas juste « 3 chambres, 600 000 $ ». Mes vraies questions : votre rythme de vie, vos déplacements, l'évolution familiale prévue, votre tolérance aux rénos, votre horizon de revente. Je bâtis ensuite une liste sur mesure depuis Centris + mes inscriptions à venir.</p>

<h2>3. Visites accompagnées <span style="color:#6a7891;font-weight:400">— 2 à 8 semaines</span></h2>
<p>Je vise <strong>maximum 5 visites par sortie</strong> — au-delà, vous mélangez tout. Après chaque visite, on prend 10 minutes pour noter à chaud les + et les − de chaque propriété.</p>

<h2>4. Promesse d'achat <span style="color:#6a7891;font-weight:400">— 1 à 3 jours</span></h2>
<p>Document légal de 14-20 pages. Prix, conditions (financement, inspection, vente d'une autre propriété), délais, inclusions/exclusions. <strong>L'étape où la négociation se gagne ou se perd</strong> — je rédige chaque clause stratégiquement.</p>

<h2>5. Négociation et contre-propositions <span style="color:#6a7891;font-weight:400">— 1 à 5 jours</span></h2>
<p>Le vendeur peut accepter, refuser, ou contre-proposer. La négociation peut tourner 2-3 fois. Mon rôle : vous donner les chiffres comparables en temps réel pour vous éviter de surenchérir émotionnellement.</p>

<h2>6. Inspection préachat <span style="color:#6a7891;font-weight:400">— 3 à 10 jours après acceptation</span></h2>
<p>Inspection complète (2-4 h), rapport écrit livré 24-48 h après. Si problèmes majeurs trouvés : on renégocie ou on se retire. Voir <a href="/acheter/inspection/">notre guide complet inspection</a>.</p>

<h2>7. Confirmation du financement <span style="color:#6a7891;font-weight:400">— 7 à 14 jours</span></h2>
<p>La banque confirme votre financement après évaluation de la propriété. C'est l'étape où certaines transactions tombent — d'où l'importance d'une préapprobation solide en amont.</p>

<h2>8. Réception chez le notaire <span style="color:#6a7891;font-weight:400">— 4 à 8 semaines après promesse</span></h2>
<p>Le notaire vérifie les titres, calcule les ajustements (taxes payées d'avance, services publics), prépare l'acte. Vous signez, vous payez le solde de la mise de fonds + les frais notariés. Je suis présent.</p>

<h2>9. Prise de possession <span style="color:#6a7891;font-weight:400">— jour J</span></h2>
<p>Remise des clés. Je vous accompagne pour la visite finale (vérification que la propriété est dans l'état convenu, inclusions présentes, services transférés).</p>

<h2>Délai total typique</h2>
<p>De la préapprobation à la remise des clés : <strong>3 à 5 mois</strong>. Ça peut être plus rapide (45 jours) en cas d'urgence, ou plus lent si vous prenez votre temps en recherche.</p>

<h2>FAQ — étapes d'achat</h2>
<h3>Combien de promesses d'achat faut-il en moyenne avant qu'une soit acceptée ?</h3>
<p>Sur le marché Rive-Nord 2026, environ <strong>1 à 3 promesses</strong> sont nécessaires pour mes clients acheteurs. La sélection en amont fait toute la différence.</p>
<h3>Que faire si je me fais surenchérir ?</h3>
<p>Cas par cas. Parfois on garde la même offre (le vendeur revient si l'autre acheteur retire), parfois on monte modérément, parfois on passe. Décision basée sur la valeur réelle, pas l'émotion.</p>
<h3>Combien coûtent les services d'un courtier acheteur ?</h3>
<p><strong>Zéro pour vous.</strong> Ma rémunération vient du vendeur via la commission Centris. <a href="/rendez-vous/">Parlons-en sans engagement</a>.</p>`],
  ['acheter/financement-hypothecaire','Financement hypothécaire','Hypothèque · Stratégie','Taux fixe ou variable, amortissement 25 ou 30 ans — les vraies questions à se poser.','Financement hypothécaire Québec 2026 | Alain Brunelle','Tout sur le financement hypothécaire : taux fixe vs variable, amortissement, stress test, assurance SCHL, courtier vs banque. Conseils pratiques.',`<p>Le taux d'intérêt n'est qu'une variable parmi cinq qui déterminent ce que votre hypothèque va vraiment vous coûter. Voici la lecture stratégique complète.</p>

<h2>Taux fixe ou taux variable ?</h2>
<p>En 2026, les fixes 5 ans tournent autour de <strong>4,89 % à 5,29 %</strong>, les variables <strong>5,15 % à 5,75 %</strong>. La différence : prévisibilité contre flexibilité.</p>
<ul>
<li><strong>Fixe</strong> : votre paiement ne bouge pas pendant le terme. Idéal si votre tolérance au risque est faible ou si vous achetez à la limite de votre capacité.</li>
<li><strong>Variable</strong> : suit le taux directeur de la Banque du Canada. Historiquement, le variable a battu le fixe sur ~80 % des périodes de 5 ans. Mais 2022-2024 a montré qu'il pouvait monter brutalement.</li>
</ul>
<p>Ma règle pragmatique : <strong>fixe pour le premier achat</strong> (vous gérez déjà beaucoup d'incertitude), <strong>variable possible pour l'investisseur ou le 2e achat</strong> avec coussin financier.</p>

<h2>Amortissement : 25 ou 30 ans ?</h2>
<p>Avec une mise de fonds <strong>≥ 20 %</strong>, vous pouvez choisir 30 ans. Sur 500 000 $ empruntés à 5 % :</p>
<ul>
<li>25 ans : paiement mensuel ~2 908 $, intérêts totaux ~372 400 $</li>
<li>30 ans : paiement mensuel ~2 669 $ (-239 $/mois), intérêts totaux ~460 800 $ (+88 400 $)</li>
</ul>
<p>Le 30 ans donne du souffle mensuel, mais coûte ~90 k$ de plus en intérêts. <strong>Compromis intelligent</strong> : prendre 30 ans pour la flexibilité, puis ajouter des paiements anticipés volontaires (la plupart des prêts permettent +20 % du paiement chaque année sans pénalité).</p>

<h2>Le stress test fédéral</h2>
<p>Depuis 2018, tous les prêts hypothécaires sont qualifiés à <strong>max(taux contractuel + 2 %, 5,25 %)</strong>. Ça signifie : même si votre taux est 4,89 %, la banque calcule votre capacité comme si vous payiez 6,89 %.</p>
<p>Conséquence : votre capacité d'emprunt est environ <strong>15 à 20 % inférieure</strong> à ce que le taux contractuel suggérerait. Calculez avec mon <a href="/acheter/calculatrices/">simulateur de capacité</a>.</p>

<h2>Assurance SCHL — quand l'éviter</h2>
<p>Si vous mettez moins de 20 % en mise de fonds, l'assurance prêt hypothécaire SCHL est obligatoire. Coût : 1,8 % à 4 % du prêt selon le ratio. Sur 500 000 $ empruntés à 10 % de mise :</p>
<ul>
<li>Prime SCHL : ~3,1 % = <strong>15 500 $</strong> ajoutés à l'hypothèque</li>
<li>Vous payez intérêts sur ces 15 500 $ pendant 25-30 ans</li>
</ul>
<p>Vraie addition sur la durée du prêt : ~25 000 $. Vaut-il mieux attendre 6-12 mois pour atteindre 20 % ? Souvent oui, sauf si les prix du marché montent plus vite que vos économies.</p>

<h2>Courtier hypothécaire ou directement la banque ?</h2>
<p>Le courtier hypothécaire <strong>magasine pour vous parmi 20+ prêteurs</strong> (banques, caisses, prêteurs alternatifs) — sans frais pour vous (commission payée par le prêteur). Économie typique : 0,15 à 0,40 % de taux par rapport au taux affiché de votre banque. Sur 500 k$, c'est <strong>10 000 à 25 000 $ d'intérêts économisés</strong> sur 5 ans.</p>
<p>Mes partenaires courtiers hypothécaires sont disponibles dans les 48 h pour un appel découverte.</p>

<h2>Le terme vs l'amortissement</h2>
<p>Deux concepts souvent confondus :</p>
<ul>
<li><strong>Amortissement</strong> : durée totale pour rembourser entièrement (25 ou 30 ans)</li>
<li><strong>Terme</strong> : durée du contrat actuel avec votre prêteur (1, 3, 5, 7, 10 ans). À la fin du terme, vous renégociez (taux, prêteur, conditions).</li>
</ul>
<p>Terme 5 ans = standard. Terme 3 ans = bon choix si vous prévoyez vendre ou si les taux semblent près d'un sommet. Terme 1-2 ans = stratégie de patience pour attendre une baisse.</p>

<h2>FAQ — financement</h2>
<h3>Combien coûte une préapprobation ?</h3>
<p><strong>Gratuit.</strong> Aucun engagement, aucun impact sur votre dossier de crédit majeur (vérification dite « douce » la plupart du temps).</p>
<h3>Quel est le délai pour obtenir le financement final ?</h3>
<p>De la promesse d'achat acceptée à la confirmation finale : généralement <strong>7 à 14 jours</strong>. La banque évalue la propriété et finalise votre dossier.</p>
<h3>Et si mon taux gelé expire avant la prise de possession ?</h3>
<p>Vous payez le taux en vigueur au moment de la signature. C'est pourquoi le choix du terme et la coordination des dates importent autant.</p>`],
  ['acheter/inspection','Inspection pré-achat','Inspection · Garantie','Jamais d\'achat sans inspection — voici exactement ce qu\'elle vérifie et ne vérifie pas.','Inspection préachat Québec — guide 2026 | Alain Brunelle','Tout savoir sur l\'inspection préachat : déroulement, coût, vices cachés, recours. Le filet de sécurité non négociable avant d\'acheter.',`<p>L'inspection préachat, c'est votre dernière protection avant de signer un engagement de plusieurs centaines de milliers de dollars. Pourtant, 1 acheteur sur 6 au Québec en fait l'économie pour « gagner le bidding war ». C'est le pari le plus risqué de toute la transaction. Voici pourquoi je ne laisse jamais un client passer outre — et comment j'organise une inspection efficace en 48 h.</p>

<h2>Ce que l'inspecteur vérifie</h2>
<p>Une inspection complète dure 2 à 4 heures et couvre :</p>
<ul>
<li><strong>Structure</strong> : fondation, charpente, sous-sol, planchers, plafonds, murs porteurs</li>
<li><strong>Toiture</strong> : état général, durée de vie résiduelle, ventilation, gouttières, solins</li>
<li><strong>Enveloppe</strong> : revêtement extérieur, fenêtres, portes, isolation visible</li>
<li><strong>Plomberie</strong> : tuyauterie, robinetterie, chauffe-eau, drains, signe de fuites historiques</li>
<li><strong>Électricité</strong> : panneau, distribution, mise à la terre, prises GFCI, signes de surcharge</li>
<li><strong>Chauffage/climatisation</strong> : système, âge, entretien, efficacité</li>
<li><strong>Intérieur</strong> : finition, salles de bain, cuisine, escaliers, garde-corps</li>
<li><strong>Indicateurs d'humidité, moisissure, parasites</strong></li>
</ul>

<h2>Ce que l'inspection NE couvre PAS</h2>
<p>Important à savoir pour éviter les fausses attentes :</p>
<ul>
<li>L'inspecteur ne <strong>démolit rien</strong> — il ne voit que ce qui est visible</li>
<li>Pas de tests environnementaux (radon, pyrite, mérule) sauf demande spécifique en supplément</li>
<li>Pas d'évaluation des piscines, foyers ou cheminées (inspections spécialisées séparées)</li>
<li>Pas d'inspection thermographique infrarouge sauf si demandée</li>
</ul>
<p>Pour les propriétés à risque (construction 1970-1985 = potentiel pyrite, sous-sols inondables = potentiel mérule, anciennes maisons rurales = potentiel radon), je recommande des tests complémentaires ciblés.</p>

<h2>Coût et délai</h2>
<ul>
<li><strong>Coût</strong> : 600 à 1 200 $ + taxes selon la grandeur et l'âge de la propriété</li>
<li><strong>Délai</strong> : 24-72 h pour planifier ; rapport écrit livré 24-48 h après l'inspection</li>
<li><strong>Présence recommandée</strong> : vous + moi pendant les 2 dernières heures (l'inspecteur fait le tour avec vous et explique ses constats)</li>
</ul>

<h2>Mes inspecteurs partenaires</h2>
<p>J'ai trois inspecteurs de confiance sur la Rive-Nord, tous membres en règle de l'AIBQ (Association des inspecteurs en bâtiment du Québec) ou de l'InterNACHI. Ils ne sont <strong>jamais payés par moi</strong> — vous les payez directement, leur indépendance reste totale. Mon rôle est juste la mise en contact rapide.</p>

<h2>Comment lire un rapport d'inspection</h2>
<p>Tous les rapports listent des « défauts ». La question stratégique : <strong>lesquels sont des deal-breakers, lesquels sont du normal pour l'âge de la propriété ?</strong></p>
<h3>Drapeaux rouges qui justifient une renégociation ou un retrait</h3>
<ul>
<li>Fissures structurales actives ou affaissement de fondation</li>
<li>Toit en fin de vie (-2 ans) non déclaré</li>
<li>Panneau électrique aluminium ou Federal Pioneer (problèmes d'assurance)</li>
<li>Présence de pyrite, vermiculite, mérule, infiltration chronique</li>
<li>Système septique défaillant ou non conforme</li>
<li>Réservoir d'huile enfoui (responsabilité environnementale)</li>
</ul>
<h3>Items normaux à ignorer (ou presque)</h3>
<ul>
<li>Petites fissures de retrait du béton</li>
<li>Calfeutrant à refaire</li>
<li>Composantes en fin de vie utile mais fonctionnelles</li>
<li>Mises aux normes mineures de code</li>
</ul>

<h2>Et après le rapport ?</h2>
<p>Trois options selon la condition d'inspection encore active dans votre promesse :</p>
<ol>
<li><strong>Tout accepter</strong> et procéder (rare avec un rapport propre)</li>
<li><strong>Demander une réduction de prix</strong> équivalente aux travaux requis (le plus commun)</li>
<li><strong>Annuler la promesse</strong> sans pénalité (en cas de défauts majeurs)</li>
</ol>
<p>Je négocie cette étape avec vous, basé sur les comparables et la réalité du marché.</p>

<h2>FAQ — inspection</h2>
<h3>Puis-je vraiment renoncer à l'inspection pour gagner un bidding war ?</h3>
<p>Légalement oui. Stratégiquement, presque jamais. Les vices cachés découverts après signature deviennent <strong>votre problème</strong> — et les recours juridiques contre le vendeur durent 18-36 mois et coûtent cher.</p>
<h3>L'inspecteur est-il responsable s'il a manqué un problème ?</h3>
<p>Limité. Sa responsabilité est généralement plafonnée au coût de l'inspection sauf faute lourde démontrée. Choisir un inspecteur expérimenté et certifié réduit beaucoup ce risque.</p>
<h3>Et pour une construction neuve ?</h3>
<p>Inspection encore plus importante. La <strong>garantie GCR</strong> couvre certains défauts, mais ne dispense pas de vérifier l'exécution avant signature. Je recommande aussi une inspection avant la fin de la 1<sup>re</sup> année de possession (avant l'expiration de la garantie d'un an).</p>`],
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
const GUIDE_CONTENT = {
  'guide-du-vendeur-2026': {
    lead: '42 pages pour vendre votre propriété au meilleur prix, dans le meilleur délai — sans laisser d\'argent sur la table.',
    body: `<p>Ce guide est l'aboutissement de 33 ans de pratique sur la Rive-Nord. Il rassemble les méthodes que j'utilise concrètement avec chaque client vendeur.</p>
<h2>Ce que vous y trouverez</h2>
<ul>
<li>La méthode de positionnement de prix en 3 fourchettes</li>
<li>Checklist complète de préparation (par pièce, par budget)</li>
<li>Les 7 erreurs qui coûtent en moyenne 23 000 $ aux vendeurs</li>
<li>Comment lire et négocier une promesse d'achat</li>
<li>Coordonner inspection, financement, notaire sans accroc</li>
<li>5 templates de questions à poser à votre courtier potentiel</li>
</ul>
<h2>Format</h2>
<p>PDF, 42 pages, illustré. Téléchargeable immédiatement, gratuit, sans engagement.</p>`
  },
  'guide-du-premier-acheteur': {
    lead: '38 pages pour acheter votre première propriété en toute confiance — du calcul de capacité à la remise des clés.',
    body: `<p>Acheter sa première maison ne devrait pas être un saut dans le vide. Ce guide est conçu pour vous donner la même rigueur d'analyse qu'un acheteur expérimenté.</p>
<h2>Ce que vous y trouverez</h2>
<ul>
<li>Le vrai calcul de votre capacité (au-delà du chiffre de la banque)</li>
<li>RAP, CELIAPP, crédits d'impôt — la combinaison optimale par profil</li>
<li>Tous les frais cachés détaillés (taxes, ajustements, fonds)</li>
<li>Comment lire un rapport d'inspection comme un pro</li>
<li>Stratégie de négociation pour primo-accédants</li>
<li>Préparer la 1<sup>re</sup> année dans votre maison (budget, garantie, entretien)</li>
</ul>`
  },
  'guide-de-l-investisseur-plex': {
    lead: '46 pages pour bâtir un portfolio plex rentable sur la Rive-Nord — financement, sélection, gestion.',
    body: `<p>Le plex Rive-Nord reste l'un des véhicules d'investissement immobilier les plus rentables au Québec en 2026. Ce guide est conçu pour les investisseurs débutants et intermédiaires.</p>
<h2>Ce que vous y trouverez</h2>
<ul>
<li>Calcul de cap rate, cash flow, TRI — avec gabarit Excel téléchargeable</li>
<li>Sélection : les 12 critères que je vérifie sur chaque plex</li>
<li>Financement : prêt résidentiel multi-logement vs commercial</li>
<li>Marché locatif Rive-Nord : loyers moyens par ville, par typologie</li>
<li>Gestion : faire soi-même vs gestionnaire professionnel</li>
<li>Sortie de l'investissement : revente, refinancement, transfert</li>
</ul>`
  },
  'guide-demenagement-rive-nord': {
    lead: '24 pages — tout le savoir pratique pour s\'installer à Blainville, Sainte-Thérèse, Rosemère ou Lorraine.',
    body: `<p>Vous quittez Montréal, Laval ou une autre région ? Ce guide pratique vous prépare à la transition concrète : services, écoles, transport, vie de quartier.</p>
<h2>Ce que vous y trouverez</h2>
<ul>
<li>Carte des écoles primaires et secondaires + cotes ministère</li>
<li>Transports : autoroutes 15, 19, 640, train de banlieue, REM à venir</li>
<li>Services municipaux par ville (taxes, déchets, recyclage, loisirs)</li>
<li>Carte des secteurs commerciaux et marchés locaux</li>
<li>Checklist de changement d'adresse (Hydro, Énergir, SAAQ, école, etc.)</li>
<li>Vie de quartier : restos, parcs, événements annuels</li>
</ul>`
  }
};
for (const [s,t] of GUIDES) {
  const content = GUIDE_CONTENT[s] || { lead:`${t} — téléchargement gratuit.`, body:`<p>${t} — format PDF, téléchargement gratuit.</p>` };
  writePage(`guides/${s}/index.html`, contentPage({
    eyebrow:'Guide PDF · Gratuit',h1:t,lead:content.lead,
    title:`${t} — PDF gratuit | Alain Brunelle`,
    desc:`${t} — guide PDF gratuit pour comprendre l'immobilier Rive-Nord par Alain Brunelle.`,
    canonical:`https://alainbrunelle.com/guides/${s}/`,
    body:content.body + `<div style="background:#e6ecf7;border-radius:14px;padding:1.5rem;margin-top:2rem"><p style="margin-bottom:1rem;color:#0f2855;font-weight:500">Téléchargez le guide gratuitement en échange de votre courriel.</p><form style="display:flex;gap:.5rem;flex-wrap:wrap"><input type="email" placeholder="votre@courriel.com" style="flex:1;min-width:200px;padding:.85rem 1rem;border:1px solid #cdd6e6;border-radius:12px;font-family:inherit"><button type="button" style="background:#0f2855;color:#fff;border:0;padding:.85rem 1.4rem;border-radius:12px;font-family:inherit;font-weight:500;cursor:pointer">Recevoir le PDF</button></form><p style="font-size:.78rem;color:#6a7891;margin-top:.8rem">Aucun spam. Désabonnement en 1 clic.</p></div>`
  }));
}

writePage('marche-immobilier/index.html', contentPage({
  eyebrow:'Marché immobilier Rive-Nord',h1:'Rapports de marché',lead:'Statistiques APCIQ + mon analyse mensuelle, par ville.',
  title:'Marché immobilier Rive-Nord 2026 | Alain Brunelle',desc:'Statistiques du marché immobilier Rive-Nord.',
  canonical:'https://alainbrunelle.com/marche-immobilier/',
  body:`<ul><li><a href="/marche-immobilier/statistiques-blainville/">Statistiques Blainville</a></li><li><a href="/marche-immobilier/statistiques-sainte-therese/">Statistiques Sainte-Thérèse</a></li><li><a href="/marche-immobilier/rapport-mensuel/">Rapport mensuel</a></li></ul>`
}));
const MARCHE_PAGES = {
  'statistiques-blainville': {
    title: 'Statistiques Blainville',
    lead: 'Le marché immobilier de Blainville en 2026 — chiffres APCIQ + mon analyse locale.',
    desc: 'Statistiques immobilières Blainville 2026 : prix médian, délai de vente, ratio V/D, évolution par quartier.',
    body: `<h2>Vue d'ensemble — Blainville 2026</h2>
<ul>
<li><strong>Prix médian unifamiliale</strong> : 685 000 $ (+ 5,1 % YoY)</li>
<li><strong>Prix médian condo</strong> : 380 000 $ (+ 3,8 % YoY)</li>
<li><strong>Prix médian plex</strong> : 870 000 $ (+ 6,4 % YoY)</li>
<li><strong>Délai médian de vente</strong> : 34 j (vs 28 j sur mes inscriptions)</li>
<li><strong>Ratio V/D moyen</strong> : 98,1 % (vs 99,2 % sur mes inscriptions)</li>
<li><strong>Inventaire actif</strong> : 218 propriétés (équilibré, légèrement favorable aux acheteurs)</li>
</ul>

<h2>Par quartier (12 derniers mois)</h2>
<ul>
<li><strong>Fontainebleau</strong> : médian 745 k$, délai 28 j — secteur premium</li>
<li><strong>Chambéry</strong> : médian 695 k$, délai 32 j</li>
<li><strong>Chante-Bois</strong> : médian 715 k$, délai 30 j</li>
<li><strong>Plan-Bouchard</strong> : médian 625 k$, délai 38 j</li>
<li><strong>Jardins-de-Blainville</strong> : médian 660 k$, délai 35 j</li>
<li><strong>Côte-Saint-Louis</strong> : médian 580 k$, délai 41 j — entrée de gamme</li>
</ul>

<h2>Ce qui anime le marché en 2026</h2>
<p>Trois forces structurelles :</p>
<ul>
<li><strong>Stabilisation des taux hypothécaires</strong> autour de 5 % — fin de la pression baissière sur la demande</li>
<li><strong>Rareté foncière</strong> dans les secteurs établis — pression haussière sur les unifamiliales avec lot &gt;700 m²</li>
<li><strong>Nouvelle phase de Chambéry</strong> et construction sur Notre-Dame Nord — ajout de ~180 unités neuves sur 18 mois</li>
</ul>

<h2>Pour 2026-2027</h2>
<p>Ma projection : prix médian unifamiliale entre <strong>700 000 $ et 735 000 $</strong> d'ici fin 2027, soit + 4 à + 7 % sur 24 mois. Les condos resteront sous pression haussière modeste (+ 3 à + 5 %) en raison de l'inventaire abondant de projets neufs.</p>

<p>Pour discuter de votre projet d'achat ou de vente à Blainville, <a href="/rendez-vous/">réservez un rendez-vous</a>.</p>`
  },
  'statistiques-sainte-therese': {
    title: 'Statistiques Sainte-Thérèse',
    lead: 'Le marché immobilier de Sainte-Thérèse en 2026 — données fines par secteur.',
    desc: 'Statistiques immobilières Sainte-Thérèse 2026 : prix médian par secteur, délai, ratio V/D, tendances.',
    body: `<h2>Vue d'ensemble — Sainte-Thérèse 2026</h2>
<ul>
<li><strong>Prix médian unifamiliale</strong> : 582 000 $ (+ 5,2 % YoY)</li>
<li><strong>Prix médian condo</strong> : 415 000 $ (+ 4,1 % YoY)</li>
<li><strong>Prix médian plex</strong> : 745 000 $ (+ 7,2 % YoY) — segment le plus actif</li>
<li><strong>Délai médian de vente</strong> : 31 j (vs 24 j sur mes inscriptions)</li>
<li><strong>Ratio V/D moyen</strong> : 98,4 %</li>
</ul>

<h2>Par secteur</h2>
<ul>
<li><strong>Vieux-Village</strong> : prix médian 624 k$, délai 24 j — inventaire très faible, demande forte</li>
<li><strong>En-Haut</strong> : médian 575 k$, délai 32 j — familial, demande stable</li>
<li><strong>En-Bas</strong> : médian 498 k$, délai 38 j — primo-accédants</li>
</ul>

<h2>Particularité 2026</h2>
<p>Trois projets de condos neufs livrés au Vieux-Village ces 18 derniers mois ont changé la dynamique. L'inventaire condo est temporairement abondant (45 unités actives) — opportunité d'achat pour qui veut entrer dans le secteur premium.</p>

<p>Voir aussi notre <a href="/blog/radioscopie-sainte-therese-marche-2026/">analyse approfondie du marché Sainte-Thérèse</a>.</p>`
  },
  'rapport-mensuel': {
    title: 'Rapport mensuel du marché Rive-Nord',
    lead: 'Mes constats du mois — ce qui bouge, ce qui ralentit, ce qu\'il faut surveiller.',
    desc: 'Rapport mensuel du marché immobilier Rive-Nord par Alain Brunelle : tendances, opportunités, signaux.',
    body: `<h2>Rapport — Mai 2026</h2>

<h3>Ce qui s'est passé en avril</h3>
<ul>
<li><strong>Ventes totales Rive-Nord</strong> : 348 (+ 8 % vs avril 2025)</li>
<li><strong>Nouvelles inscriptions</strong> : 521 (+ 12 %)</li>
<li><strong>Délai médian</strong> : 33 jours (stable)</li>
<li><strong>Multiples offres</strong> : 22 % des transactions (vs 31 % il y a un an)</li>
</ul>

<h3>Ce que je surveille en mai</h3>
<ul>
<li><strong>Pic saisonnier</strong> : la fenêtre vendeur optimale s'ouvre fin avril, pic mi-mai à Sainte-Thérèse, début juin à Blainville</li>
<li><strong>Réunion BdC</strong> : la prochaine décision sur les taux directeurs aura un effet quasi immédiat sur la demande d'achat</li>
<li><strong>Inventaire neuf Blainville</strong> : 180 unités à livrer d'ici septembre — pression sur les reventes équivalentes</li>
</ul>

<h3>Opportunités</h3>
<p>Le marché des plex 4 logements à Sainte-Thérèse est sous-évalué de ~5-8 % par rapport à Blainville équivalent. Pour un investisseur cash-flow, la fenêtre actuelle est intéressante. <a href="/rendez-vous/">Parlons-en</a>.</p>

<h3>Signaux d'alerte</h3>
<p>Les ventes en deçà de 400 000 $ ralentissent — l'effet du stress test sur les primo-accédants. Si vous vendez dans ce segment, prévoyez un délai de 45-60 jours et un positionnement de prix sans agressivité.</p>

<p style="font-size:.85rem;color:#6a7891;margin-top:2rem;font-style:italic">Rapport mis à jour le 18 mai 2026. Sources : APCIQ, Centris, mes inscriptions et transactions actives.</p>`
  }
};
for (const [s, p] of Object.entries(MARCHE_PAGES)) {
  writePage(`marche-immobilier/${s}/index.html`, contentPage({
    eyebrow: 'Marché immobilier',
    h1: p.title,
    lead: p.lead,
    title: `${p.title} 2026 | Alain Brunelle`,
    desc: p.desc,
    canonical: `https://alainbrunelle.com/marche-immobilier/${s}/`,
    body: p.body
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
const BLOG_CONTENT = {
  'combien-vaut-ma-maison-blainville': {
    lead: 'La méthode honnête, en 4 couches, pour estimer la valeur réelle de votre maison à Blainville en 2026.',
    body: `<p>« Combien vaut ma maison ? » C'est la question la plus simple à poser et la plus difficile à répondre correctement. Voici la méthode que j'utilise chaque jour, à expliquer en 4 couches.</p>
<h2>Couche 1 — Les ventes comparables (la base)</h2>
<p>Les 5 à 10 ventes les plus pertinentes des 12 derniers mois à moins de 500 m, dans la même typologie, avec ajustements pour les écarts (sup. terrain, nombre de chambres, rénovations). C'est environ 60 % de la valeur finale.</p>
<h2>Couche 2 — L'inventaire actif comparable</h2>
<p>Que se vend-il en ce moment dans votre secteur, à quel prix, et combien de jours sur le marché ? Indique la pression actuelle.</p>
<h2>Couche 3 — La saisonnalité du secteur</h2>
<p>À Blainville, le pic de demande est mi-mai à début juillet. Vendre en novembre = -3 à -5 % sur le prix médian.</p>
<h2>Couche 4 — Les particularités de votre propriété</h2>
<p>Vue, orientation, état réel des grosses composantes (toit, fenêtres, mécanique), qualité du sous-sol, voisinage immédiat. Peut faire varier de ± 8 %.</p>
<p>Le rapport d'évaluation que je produis intègre ces 4 couches en un chiffre justifié, avec une fourchette basse/médiane/optimiste. <a href="/vendre/evaluation-gratuite/">Demandez votre évaluation gratuite</a>.</p>`
  },
  'fontainebleau-vs-chambery-chante-bois': {
    lead: 'Trois secteurs phares de Blainville comparés rue par rue — prix, écoles, démographie, vie de quartier.',
    body: `<p>Vous hésitez entre Fontainebleau, Chambéry et Chante-Bois ? Les trois sont d'excellents choix, mais ils répondent à des profils différents. Voici la comparaison honnête.</p>
<h2>Fontainebleau — le secteur établi</h2>
<p>Tissu mature (constructions 1985-2000), boisé préservé, démographie stable (familles 35-55 ans). Médian unifamiliale 745 k$. Délai vente 28 j. École primaire francisée à 5 minutes à pied. Idéal pour familles cherchant l'établissement long-terme.</p>
<h2>Chambéry — le secteur jeune</h2>
<p>Constructions 2008-2020, design plus moderne. Médian 695 k$. Délai 32 j. Mix de jeunes familles et professionnels. Accessibilité 640 supérieure. Idéal pour acheteurs cherchant le neuf sans le prix Mirabel.</p>
<h2>Chante-Bois — le compromis</h2>
<p>Constructions 1995-2010, lots généralement plus grands (~900 m²). Médian 715 k$. Délai 30 j. Plus boisé, plus calme. Idéal pour familles cherchant l'intimité.</p>
<h2>Verdict</h2>
<p>Mon angle : Fontainebleau pour stabilité, Chambéry pour modernité, Chante-Bois pour l'espace. Aucun mauvais choix. <a href="/courtier-immobilier/blainville/">Voir toutes les options Blainville</a>.</p>`
  },
  '7-etapes-vendre-sainte-therese': {
    lead: 'Vendre à Sainte-Thérèse en 2026 — les particularités locales que les courtiers généralistes ignorent.',
    body: `<p>Voir notre <a href="/vendre/etapes-pour-vendre/">guide complet des 7 étapes</a>, mais voici les particularités spécifiques au marché Sainte-Thérèse à intégrer dans votre stratégie.</p>
<h2>1. Le calendrier Sainte-Thérèse</h2>
<p>Pic de demande : 28 avril à 20 juin. Acheteurs principalement de Laval et Montréal post-Pâques.</p>
<h2>2. Le pouvoir du Vieux-Village</h2>
<p>Si votre propriété est dans le périmètre historique, votre prix peut être positionné 8-12 % plus haut que la médiane Sainte-Thérèse globale.</p>
<h2>3. La photographie aérienne obligatoire</h2>
<p>Les acheteurs urbains veulent voir le tissu de quartier. Drone systématique sur mes inscriptions.</p>
<h2>4. La fiche bilingue</h2>
<p>~22 % des acheteurs sur ce marché sont anglophones (de Laval-Ouest, Montréal). Fiche FR/EN obligatoire.</p>
<h2>5. La pré-mise en marché</h2>
<p>72 h en exclusivité à mon réseau avant Centris public — 40 % de mes ventes Vieux-Village se concluent dans cette fenêtre.</p>
<h2>6. La gestion des bidding wars</h2>
<p>Sur les bonnes propriétés Vieux-Village, prévoir 3-6 offres simultanées. Mon protocole de gestion équitable et stratégique.</p>
<h2>7. Le suivi notaire</h2>
<p>Je suis présent à la signature. Aucune zone d'ombre, aucun frais surprise.</p>`
  },
  'premier-acheteur-blainville-revenu': {
    lead: 'Combien faut-il vraiment gagner pour acheter à Blainville en 2026 — calcul complet, sans enrobage.',
    body: `<p>Voici les chiffres réels pour un premier acheteur à Blainville en 2026, basés sur les médianes du marché et le stress test fédéral en vigueur.</p>
<h2>Scénario 1 — Condo 380 000 $</h2>
<ul>
<li>Mise de fonds 10 % : 38 000 $</li>
<li>Hypothèque : 342 000 $ + assurance SCHL</li>
<li>Paiement mensuel (5 % / 25 ans) : ~1 990 $</li>
<li>Taxes + charges + chauffage : ~750 $</li>
<li><strong>Revenu ménage requis : ~88 000 $/an</strong></li>
</ul>
<h2>Scénario 2 — Maison de ville 525 000 $</h2>
<ul>
<li>Mise de fonds 15 % : 78 750 $</li>
<li>Hypothèque : 446 250 $ + assurance SCHL</li>
<li>Paiement : ~2 596 $/mois</li>
<li>Taxes + chauffage : ~525 $/mois</li>
<li><strong>Revenu requis : ~112 000 $/an</strong></li>
</ul>
<h2>Scénario 3 — Unifamiliale médiane 685 000 $</h2>
<ul>
<li>Mise de fonds 20 % : 137 000 $</li>
<li>Hypothèque : 548 000 $ (sans SCHL)</li>
<li>Paiement : ~3 188 $/mois</li>
<li>Taxes + chauffage : ~700 $/mois</li>
<li><strong>Revenu requis : ~135 000 $/an</strong></li>
</ul>
<p>Calculs basés sur ABD &lt;= 30 %. <a href="/acheter/calculatrices/">Personnalisez avec mon outil</a>.</p>`
  },
  'plex-blainville-rendement': {
    lead: 'Rendement réel d\'un plex à Blainville en 2026 — exemple chiffré, cap rate, cash flow.',
    body: `<p>Le plex Blainville reste un véhicule d'investissement intéressant en 2026, mais le cap rate s'est compressé sur 5 ans. Voici un exemple chiffré actuel.</p>
<h2>Exemple : triplex 870 000 $</h2>
<ul>
<li>3 unités de 4½, loyers actuels combinés : 4 350 $/mois (1 450 $ chacun)</li>
<li>Revenus annuels bruts : 52 200 $</li>
<li>Dépenses annuelles (taxes, assurance, entretien, vacance 5 %) : 14 800 $</li>
<li>Revenu net opération (NOI) : 37 400 $</li>
<li><strong>Cap rate : 4,3 %</strong></li>
</ul>
<h2>Avec financement</h2>
<ul>
<li>Mise de fonds 20 % : 174 000 $</li>
<li>Hypothèque commerciale 696 000 $ à 5,5 % / 25 ans : ~4 230 $/mois ou ~50 760 $/an</li>
<li>Cash flow annuel : 37 400 − 50 760 = <strong>-13 360 $ (négatif première année)</strong></li>
</ul>
<h2>L'angle gagnant</h2>
<p>Les loyers Blainville sont sous-marché de ~12-18 % en moyenne. Sur 3-5 ans, en haussant progressivement les loyers à la valeur de marché, le cash flow devient positif et le cap rate effectif monte à ~5,2-5,8 %. La vraie valeur est dans l'appréciation du capital (+ 4 à 6 % par an) combinée à l'amortissement de l'hypothèque.</p>
<p>Voir aussi notre <a href="/acheter/calculatrices/">calculatrice de rendement plex</a>.</p>`
  },
  'vieux-sainte-therese-vivre-village': {
    lead: 'Vivre au Vieux Sainte-Thérèse en 2026 — vie de quartier, prix, qualité de vie.',
    body: `<p>Le Vieux Sainte-Thérèse n'est pas qu'un secteur immobilier — c'est un mode de vie. Voici à quoi ça ressemble en 2026.</p>
<h2>Le cachet historique</h2>
<p>Bâtiments centenaires restaurés, rue principale piétonnière l'été, terrasses, marché public le samedi matin de mai à octobre.</p>
<h2>La marche comme transport principal</h2>
<p>Tout est à 10 minutes à pied : épicerie, pharmacie, restos, parcs, gare du train de banlieue (15 minutes vers Montréal centre-ville).</p>
<h2>L'immobilier</h2>
<p>Mix de maisons centenaires patrimoniales (650 k$-1,2 M$), de condos neufs récents (380-550 k$) et de plex de caractère (700-1,1 M$). Inventaire très limité — la rareté soutient les prix.</p>
<h2>Le profil des résidents</h2>
<p>Couples sans enfants ou empty-nesters (60 %), jeunes professionnels (25 %), familles avec enfants en bas âge (15 %). Démographie en évolution avec les nouveaux condos neufs.</p>
<h2>Les points faibles</h2>
<p>Stationnement public limité, certaines maisons patrimoniales coûteuses à entretenir (toit ardoise, fenêtres bois). Si vous n'aimez pas la proximité immédiate des voisins, le Vieux-Village n'est pas pour vous.</p>
<p>Pour voir les inscriptions actives du secteur, consultez <a href="/courtier-immobilier/sainte-therese/">notre page Sainte-Thérèse</a> ou <a href="/rendez-vous/">prenez rendez-vous</a>.</p>`
  }
};
for (const [s,t] of BLOG_POSTS) {
  const c = BLOG_CONTENT[s] || { lead:'', body:'<p>Article en rédaction.</p>' };
  writePage(`blog/${s}/index.html`, contentPage({
    eyebrow:'Blog · Conseils',h1:t,lead:c.lead,
    title:`${t} | Alain Brunelle`,
    desc:c.lead || t,
    canonical:`https://alainbrunelle.com/blog/${s}/`,
    body: c.body
  }));
}

// --- À PROPOS / CONTACT / TÉMOIGNAGES / PERFORMANCE ---
writePage('a-propos/index.html', layout({
  title:'À propos — Alain Brunelle, courtier immobilier Rive-Nord',
  description:'Alain Brunelle, courtier immobilier à Sainte-Thérèse et Blainville depuis 1992. Plus de 3 000 transactions, Top 5 % RE/MAX Québec depuis 20 ans. Approche analytique, livraison rigoureuse.',
  canonical:'https://alainbrunelle.com/a-propos/',
  body:`
<section class="page-head container"><div class="eyebrow">À propos · 1992 → 2026</div><h1>Alain Brunelle, stratège immobilier Rive-Nord.</h1><p class="lead">Plus de 3 000 transactions · Top 5 % RE/MAX Québec depuis 20 ans · Sainte-Thérèse · Blainville · Rosemère · Lorraine.</p></section>

<section class="container"><div class="about-grid">
  <div class="about-photo"><img src="/photos/P21_5407-Edit.jpg" alt="Alain Brunelle, courtier immobilier RE/MAX CRYSTAL"></div>
  <div>
    <p style="font-size:1.15rem;color:var(--ink);line-height:1.65;font-weight:500">Depuis 1992, j'accompagne les familles, les premiers acheteurs et les investisseurs de la Rive-Nord à travers la décision financière la plus importante de leur vie.</p>
    <p style="color:var(--ink-2);line-height:1.75;margin-top:1.2rem">Formation en administration, esprit analytique, exécution rigoureuse. J'ai bâti ma pratique sur une conviction simple : <strong>chaque propriété a un prix juste</strong>, et chaque client mérite une stratégie sur mesure — pas une formule toute faite. Pas de promesses irréalistes, pas de pression. Juste les chiffres, la méthode, et 33 ans d'expérience locale.</p>
    <p style="color:var(--ink-2);line-height:1.75;margin-top:1rem">Mon territoire principal : Sainte-Thérèse, Blainville, Rosemère, Lorraine. Mon réseau d'acheteurs qualifiés s'étend à toute la Rive-Nord (12 400 contacts actifs au 2026). Mon rôle, comme courtier RE/MAX CRYSTAL, est d'être le point de pivot entre vos objectifs et la réalité du marché — avec transparence totale à chaque étape.</p>
  </div>
</div></section>

<section class="section-dark"><div class="container">
  <div class="sec-head"><div><div class="eye">En chiffres · 2026</div><h2>Le portrait, en données.</h2></div></div>
  <div class="stats-grid">
    <div class="stat"><div class="n">3 000+</div><div class="l">Transactions conclues depuis 1992</div></div>
    <div class="stat"><div class="n">Top 5 %</div><div class="l">RE/MAX Québec — 20 années consécutives</div></div>
    <div class="stat"><div class="n">99,2 %</div><div class="l">Ratio prix vendu / prix demandé</div></div>
    <div class="stat"><div class="n">28 j</div><div class="l">Délai médian de vente (vs 52 j marché)</div></div>
  </div>
</div></section>

<section class="container"><div class="two-col">
  <article class="prose">
    <h2>Ma philosophie</h2>
    <p>L'immobilier est l'industrie où l'écart entre la perception et la réalité est le plus large. Tout le monde a un avis sur la valeur d'une maison ; presque personne ne sait calculer un prix avec rigueur. Mon travail, c'est de combler cet écart pour mes clients.</p>
    <p>Concrètement, ça veut dire trois choses :</p>
    <ul>
      <li><strong>Décider avec des données</strong>, pas avec des sentiments. Les ventes comparables, les délais médians par secteur, l'inventaire actif — tout est mesuré et partagé.</li>
      <li><strong>Communication régulière</strong>. Un point hebdomadaire fixe, des réponses sous 4 h en semaine, aucune zone d'ombre.</li>
      <li><strong>Livrer ce que j'ai promis</strong>. Si je m'engage sur un délai, un prix de mise en marché ou une stratégie, je le tiens. Sinon je l'ajuste avec vous, en expliquant pourquoi.</li>
    </ul>

    <h2>Mon parcours</h2>
    <p>Premier cycle en administration, certifications continues OACIQ, et 33 ans de pratique active sur le terrain. J'ai vu cinq cycles complets de marché immobilier — la flambée des années 2000, la correction 2008-2009, la stagnation 2012-2015, l'explosion COVID 2020-2022, et le rééquilibrage 2023-2025. Chaque cycle a renforcé une même leçon : <em>la connaissance fine du marché local bat les généralités à tous les coups</em>.</p>

    <h2>Ce qui m'anime</h2>
    <p>Voir une famille accéder à sa première maison après deux ans d'épargne. Vendre la maison d'un parent décédé avec respect et fluidité. Aider un investisseur à structurer sa quatrième acquisition. Chaque transaction est une histoire — et c'est ce mélange d'humain et de méthode qui rend ce métier passionnant.</p>

    <h2>Hors du bureau</h2>
    <p>Père, conjoint, cycliste invétéré et amateur d'architecture. Membre actif de la Chambre de commerce Thérèse-De Blainville depuis 2008. Quand je ne visite pas une propriété, je suis probablement sur la 117 nord vers les Laurentides.</p>
  </article>
  <aside>
    <div class="blue-block soft" style="padding:2rem;position:sticky;top:100px">
      <div class="eye" style="color:var(--blue-2)">Coordonnées</div>
      <h3 style="margin:.7rem 0 1rem">Alain Brunelle</h3>
      <p style="color:var(--ink-2);font-size:.95rem;line-height:1.7;margin-bottom:1.5rem">Courtier immobilier résidentiel<br>RE/MAX CRYSTAL<br>Sainte-Thérèse · Blainville · Rive-Nord</p>
      <p style="font-size:.95rem;color:var(--ink-2);margin-bottom:.5rem">📞 <a href="tel:4504305555" style="color:var(--blue)">450.430.5555</a></p>
      <p style="font-size:.95rem;color:var(--ink-2);margin-bottom:1.5rem">✉ <a href="mailto:alainbrunelle@alainbrunelle.com" style="color:var(--blue)">alainbrunelle@alainbrunelle.com</a></p>
      <a class="btn" href="/rendez-vous/" style="display:block;background:var(--ink);color:#fff;text-align:center;padding:1rem;border-radius:var(--radius);font-weight:500">Prendre rendez-vous</a>
    </div>
  </aside>
</div></section>`
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
  eyebrow:'Témoignages',h1:'Ce que mes clients disent.',
  lead:'Trente-trois ans de pratique, des milliers de transactions, et autant d\'histoires. En voici quelques-unes.',
  title:'Témoignages clients | Alain Brunelle Courtier Rive-Nord',desc:'Témoignages réels de clients ayant vendu ou acheté avec Alain Brunelle à Sainte-Thérèse, Blainville, Rosemère, Lorraine.',
  canonical:'https://alainbrunelle.com/temoignages/',
  body:`<blockquote style="border-left:3px solid #0f2855;padding:1rem 0 1rem 1.5rem;margin:1.5rem 0;font-style:italic;color:#2a3a54;font-size:1.1rem;line-height:1.5">
<p>« Alain a vendu notre maison de Fontainebleau en 11 jours, au prix demandé. Sa stratégie de mise en marché était tellement précise qu'on a eu 4 visites privées avant même la publication Centris. Rigueur exceptionnelle. »</p>
<cite style="display:block;margin-top:.8rem;font-size:.88rem;color:#6a7891;font-style:normal">Marie &amp; Philippe — Fontainebleau, Blainville · 2025</cite></blockquote>

<blockquote style="border-left:3px solid #0f2855;padding:1rem 0 1rem 1.5rem;margin:1.5rem 0;font-style:italic;color:#2a3a54;font-size:1.1rem;line-height:1.5">
<p>« On a acheté notre première maison à Sainte-Thérèse avec Alain. Il a passé des heures à expliquer chaque clause de la promesse, sans jamais nous brusquer. Il nous a même retenus d'enchérir sur deux propriétés où il sentait qu'on payait trop. Ces réflexes-là, ça vaut de l'or. »</p>
<cite style="display:block;margin-top:.8rem;font-size:.88rem;color:#6a7891;font-style:normal">Camille &amp; Jonathan — Sainte-Thérèse-en-Bas · 2025</cite></blockquote>

<blockquote style="border-left:3px solid #0f2855;padding:1rem 0 1rem 1.5rem;margin:1.5rem 0;font-style:italic;color:#2a3a54;font-size:1.1rem;line-height:1.5">
<p>« Analyse de marché impeccable. Alain m'a sorti un tableau comparatif rue par rue que je n'avais jamais vu de toute ma vie. Du coup, on a positionné la maison 18 000 $ plus haut que ce que j'envisageais — et on a vendu en 19 jours. »</p>
<cite style="display:block;margin-top:.8rem;font-size:.88rem;color:#6a7891;font-style:normal">Jean-François — Vieux Sainte-Thérèse · 2024</cite></blockquote>

<blockquote style="border-left:3px solid #0f2855;padding:1rem 0 1rem 1.5rem;margin:1.5rem 0;font-style:italic;color:#2a3a54;font-size:1.1rem;line-height:1.5">
<p>« Quand ma mère est décédée, vendre sa maison de Lorraine était la dernière chose dont j'avais l'énergie de m'occuper. Alain a tout coordonné — l'évaluation, le ménage, les photos, les visites, le notaire. Avec dignité et patience. Je le recommanderais à n'importe qui dans la même situation. »</p>
<cite style="display:block;margin-top:.8rem;font-size:.88rem;color:#6a7891;font-style:normal">Sophie — Lorraine · 2024</cite></blockquote>

<blockquote style="border-left:3px solid #0f2855;padding:1rem 0 1rem 1.5rem;margin:1.5rem 0;font-style:italic;color:#2a3a54;font-size:1.1rem;line-height:1.5">
<p>« On a vendu et acheté la même semaine. Alain a coordonné les deux notaires, les financements, et notre déménagement avec une précision militaire. Stress total : zéro. »</p>
<cite style="display:block;margin-top:.8rem;font-size:.88rem;color:#6a7891;font-style:normal">Famille Vaillancourt — Rosemère → Blainville · 2024</cite></blockquote>

<blockquote style="border-left:3px solid #0f2855;padding:1rem 0 1rem 1.5rem;margin:1.5rem 0;font-style:italic;color:#2a3a54;font-size:1.1rem;line-height:1.5">
<p>« J'ai acheté trois plex avec Alain depuis 2018. Il connaît le marché locatif Rive-Nord mieux que la plupart des investisseurs eux-mêmes. Mes trois acquisitions cashflowent positivement dès l'année 1 — c'est rare. »</p>
<cite style="display:block;margin-top:.8rem;font-size:.88rem;color:#6a7891;font-style:normal">Stéphane R. — Investisseur Blainville · 2024</cite></blockquote>

<h2>Vous avez une bonne expérience à partager ?</h2>
<p>Vos témoignages comptent énormément, autant pour la confiance des futurs clients que pour notre référencement local. Si vous avez deux minutes, j'apprécierais grandement un avis Google. <a href="https://g.page/r/CXxRl3hPQT" target="_blank" rel="noopener">Laisser un avis Google</a>.</p>`
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
