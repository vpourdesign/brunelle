# Notes — BRUNELLE

> Auto-classé par Claude depuis le chat Cowork du projet.
> Convention : `_AGENCY/CTO/conventions/project-notes.md`

## 📅 Échéances

*(vide pour l'instant — ajoute "vendredi il faut envoyer X" et je classe)*

## ✅ À faire

- Suivi avec Remax Québec pour le site
- Envoyer le site à Alain pour révision

## 💭 Long shots

*(vide pour l'instant — "un jour on pourrait explorer ..." finit ici)*

## 📝 Notes client

*(vide pour l'instant — "le client préfère ..." finit ici)*

## 🔍 Précisions

- Compétiteur de référence pour le dashboard SEO : Michel Salomon (michelsalomon.com), RE/MAX Crystal aussi, bureau 926 boul. Curé-Labelle Blainville — top 10 RE/MAX Québec depuis 2017, pages ville dédiées (Blainville, Lorraine, Sainte-Thérèse)
- GA4 installé sur le site (propriété 543143174, tag G-F5DLZC93S3) + Search Console (propriété `https://www.alainbrunelle.com/`, type préfixe d'URL avec www) — lecture API via compte de service `rapportsvpd@site-vpd.iam.gserviceaccount.com` (clé : `.secrets/google-service-account.json`, config `.env.local`)
- Pull des données réelles : `node scripts/seo-snapshot.mjs` — chaque exécution ajoute un point au dashboard SEO
- Rapports SEO mensuels PDF (format Probaclac) : `06_livrables/rapports-seo/` — scheduled task Cowork le 4 de chaque mois (~9 h, modèle Opus 5) qui compare le mois terminé aux précédents. Le sandbox cloud bloque googleapis.com : le pull passe par Claude in Chrome (fetch JWT compte de service depuis un onglet alainbrunelle.com) ou par GoMarble si GSC/GA y sont connectés

## ✓ Fait

- 2026-07-02 — Dashboard SEO Alain vs Salomon créé (`06_livrables/seo-dashboard.html`) avec snapshot SERP baseline, graphique de progression et plan d'action Google Ads / GBP / Meta
- 2026-07-02 — Données réelles Google branchées (gratuit, sans Supermetrics) : compte de service + `scripts/seo-snapshot.mjs` — premier pull réussi (3 clics, 336 impressions, 34 sessions GA4)
- 2026-08-04 — Premier rapport SEO client PDF juin–juillet (`06_livrables/rapports-seo/Brunelle_RapportSEO_JuinJuillet2026.pdf`) : 55 visites Google en juillet (×18), 3 766 apparitions (+556 %), 44 requêtes top 10 dont 16 top 3 — + rapport mensuel automatisé activé (scheduled task, Opus 5)
