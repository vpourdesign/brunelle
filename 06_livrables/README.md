# Dashboard stratégie Meta Ads

Ce dossier contient le dashboard de proposition Meta Ads pour ce client.

## Mettre à jour

1. Éditer `../05_plan_media/strategy.json`
2. Relancer le build :
   ```bash
   python3 ../../_AGENCY/CTO/blueprints/meta-ads-strategy-dashboard/build.py \
     ../05_plan_media/strategy.json dashboard.html
   ```

## Ajouter des créatifs

Encoder en base64 dans `creatives_data.js` :
```js
window.CREATIVES = {
  "ad_001_carre": "data:image/jpeg;base64,...",
};
```

## Convention

- Référence : `_AGENCY/CTO/blueprints/meta-ads-strategy-dashboard/README.md`
- Exemple complet (PVM 2026) : `_AGENCY/CTO/blueprints/meta-ads-strategy-dashboard/examples/pvm-2026.json`
