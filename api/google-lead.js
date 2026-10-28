// Webhook des formulaires de lead Google Ads → Formspree (courriel à Alain).
// Google envoie un POST JSON ; on valide la clé (seul son hash SHA-256 est dans le repo),
// puis on transfère le lead au même formulaire Formspree que le site.
const crypto = require('crypto');

const KEY_SHA256 = '1c92b6ceb0843fe2083663c7caaa42ef8bcb66e0021d575ce5ba41953dec568d';
const FORMSPREE = 'https://formspree.io/f/xlgyblyk';

const LABELS = {
  FULL_NAME: 'nom',
  FIRST_NAME: 'prenom',
  LAST_NAME: 'nom_famille',
  PHONE_NUMBER: 'telephone',
  EMAIL: 'email',
  POSTAL_CODE: 'code_postal',
  STREET_ADDRESS: 'adresse',
  CITY: 'ville',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ ok: false }); }
  }
  body = body || {};

  const hash = crypto.createHash('sha256').update(String(body.google_key || '')).digest('hex');
  if (hash !== KEY_SHA256) return res.status(401).json({ ok: false });

  const lead = {
    _subject: (body.is_test ? '[TEST] ' : '') + 'Lead Google Ads — Évaluation gratuite',
    source: 'Formulaire de lead Google Ads',
    campagne_id: String(body.campaign_id || ''),
    lead_id: String(body.lead_id || ''),
  };
  for (const col of body.user_column_data || []) {
    const k = LABELS[col.column_id] || col.column_name || col.column_id;
    lead[k] = col.string_value;
  }

  try {
    const r = await fetch(FORMSPREE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(lead),
    });
    if (!r.ok) {
      console.error('Formspree', r.status, await r.text());
      return res.status(502).json({ ok: false });
    }
  } catch (e) {
    console.error('Formspree fetch', e);
    return res.status(502).json({ ok: false });
  }
  return res.status(200).json({ ok: true });
};
