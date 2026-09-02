# Notes — BRUNELLE

> Auto-classé par Claude depuis le chat Cowork du projet.
> Convention : `_AGENCY/CTO/conventions/project-notes.md`

## 📅 Échéances

*(vide pour l'instant — ajoute "vendredi il faut envoyer X" et je classe)*

## ✅ À faire

- Suivi avec Remax Québec pour le site
- Envoyer le site à Alain pour révision
- Google Ads — funnel : aucun événement de conversion GA4/Ads dans le site (pas de gtag event, pas de AW-, pas de page merci Formspree), page Blainville sans lien tel: ni formulaire, consent mode denied par défaut → à régler avant d'activer
- Google Ads — demander à Alain : délai moyen de vente vs marché, % vendu au prix demandé, commission moyenne, capacité de nouveaux mandats/mois, ses 3 objections les plus entendues, quartiers/types les plus vendus 2025-2026
- Google Ads — compléter OBJECTIONS-VENDEUR.md avec des verbatims Reddit (r/QuebecFinance, r/Quebec — bloqué depuis le sandbox)
- Google Ads — prochain groupe/campagne Sainte-Thérèse (172 impressions GSC sans clic, page ville existante)
- Google Ads — script mensuel qui ajoute termes de recherche + perfs (MCP google-ads lecture) dans CONTEXTE.md
- Google Ads — la campagne « Autorité Blainville » est EN LIGNE depuis le 25 août (27 clics, 95 $, 0 conversion mesurée) : créer les actions de conversion (formulaire + appel), passer la géo en « Présence », lier la fiche GBP, ajouter les négatifs (« du proprio », royal lepage, realtor, via capitale, vendirect, engel volkers, maison, achat, reprise de finance, intergeneration, noms de courtiers) — décisions à prendre avec Vincent avant d'écrire
- Google Ads — tenir à jour `05_plan_media/google-ads/PROCESSUS-GOOGLE-ADS-SKILL.md` à chaque nouvelle étape, puis le passer en skill global quand le processus est complet

## 💭 Long shots

*(vide pour l'instant — "un jour on pourrait explorer ..." finit ici)*

## 📝 Notes client

*(vide pour l'instant — "le client préfère ..." finit ici)*

## 🔍 Précisions

- 2026-09-02 — Vincent a monté un bridge Google Ads en lecture via le MCP officiel (`google-ads` / `google-ads-direct`, search_search + metadata) ; `gads` reste le bridge d'écriture. Un bridge Search Console existe aussi côté Vincent mais n'apparaît pas encore dans les outils de session (à reconnecter)
- 2026-09-02 — Décisions Google Ads (Vincent) : chiffres officiels = 33 ans / 3 000+ transactions ; on garde « Évaluation gratuite » dans les annonces et la page ; site neuf = 0 lead à ce jour, CPA à calibrer après 30 jours ; Alain rappelle lui-même dans les 24 h après un formulaire
- 2026-09-02 — Search Console, 28 derniers jours, 0 clic malgré les impressions : « agent immobilier blainville » (281), « courtier immobilier sainte-thérèse » (172), « inspection pre achat lacolle » (166). Signal double : (1) « agent immobilier » est le mot que les gens tapent, à ajouter aux mots-clés Ads à côté de « courtier » ; (2) Sainte-Thérèse mérite son propre groupe/campagne ; (3) CTR 0 % = titres/meta des pages à retravailler côté SEO ; « lacolle » = requête hors territoire à surveiller (page inspection pré-achat qui ranke au mauvais endroit)
- Amélioration du processus Google Ads (à intégrer dans PROCESSUS-GOOGLE-ADS-SKILL.md) : à l'Étape 0, tirer systématiquement les requêtes Search Console à fortes impressions / 0 clic des 28 derniers jours — ce sont des mots-clés Ads gratuits et des pages à corriger
- Processus Google Ads (inspiré d'un post X, 2026-09-02) : alimenter le contexte AVANT de demander quoi que ce soit — le dossier projet joue le rôle du « Claude Project ». Liste e-commerce du post transposée courtier immobilier : product pages → pages ville + fiches ; best sellers → quartiers/types qui vendent ; reviews → avis GBP/Centris ; objection docs → objections vendeur ; competitor URLs + Transparency Center → Salomon/Crystal ; search terms + performance exports → arrivent après activation
- Le processus est documenté au fur et à mesure dans `05_plan_media/google-ads/PROCESSUS-GOOGLE-ADS-SKILL.md` (brouillon de skill global, plusieurs étapes à venir)
- Compétiteur de référence pour le dashboard SEO : Michel Salomon (michelsalomon.com), RE/MAX Crystal aussi, bureau 926 boul. Curé-Labelle Blainville — top 10 RE/MAX Québec depuis 2017, pages ville dédiées (Blainville, Lorraine, Sainte-Thérèse)
- GA4 installé sur le site (propriété 543143174, tag G-F5DLZC93S3) + Search Console (propriété `https://www.alainbrunelle.com/`, type préfixe d'URL avec www) — lecture API via compte de service `rapportsvpd@site-vpd.iam.gserviceaccount.com` (clé : `.secrets/google-service-account.json`, config `.env.local`)
- Pull des données réelles : `node scripts/seo-snapshot.mjs` — chaque exécution ajoute un point au dashboard SEO
- Rapports SEO mensuels PDF (format Probaclac) : `06_livrables/rapports-seo/` — scheduled task Cowork le 4 de chaque mois (~9 h, modèle Opus 5) qui compare le mois terminé aux précédents. Le sandbox cloud bloque googleapis.com : le pull passe par Claude in Chrome (fetch JWT compte de service depuis un onglet alainbrunelle.com) ou par GoMarble si GSC/GA y sont connectés

## ✓ Fait

- 2026-09-02 — Accueil : section « Avis Google vérifiés » déplacée juste au-dessus de « Vous songez vendre ? » (après la barre de preuves) ; bouton renommé « Faites comme mes clients satisfaits, et vous aussi laissez-moi un avis Google. » ; lien direct vérifié en navigateur : https://g.page/r/CWReusNbS1LV/review (fiche Alain Brunelle RE/MAX Crystal, 4,9 ★) ; traduction EN ajoutée (`i18n/04.json`)
- 2026-09-02 — PROFIL-MARQUE.md v0.1 créé (`05_plan_media/google-ads/`) : ICP, douleurs, déclencheurs, objections, langage client, offres, compétiteurs, 10 trous de funnel, opportunités, liste des manques — en attente des réponses d'Alain/Vincent
- 2026-09-02 — CONTEXTE.md créé (`05_plan_media/google-ads/`) : dossier interne consolidé, 37 avis Google d'Alain (4,9 ★), 64 annonces Salomon + 6 Béland relevées au Transparency Center, 12 objections vendeur sourcées (`OBJECTIONS-VENDEUR.md`), signal GSC 28 j

- 2026-07-02 — Dashboard SEO Alain vs Salomon créé (`06_livrables/seo-dashboard.html`) avec snapshot SERP baseline, graphique de progression et plan d'action Google Ads / GBP / Meta
- 2026-07-02 — Données réelles Google branchées (gratuit, sans Supermetrics) : compte de service + `scripts/seo-snapshot.mjs` — premier pull réussi (3 clics, 336 impressions, 34 sessions GA4)
- 2026-08-04 — Premier rapport SEO client PDF juin–juillet (`06_livrables/rapports-seo/Brunelle_RapportSEO_JuinJuillet2026.pdf`) : 55 visites Google en juillet (×18), 3 766 apparitions (+556 %), 44 requêtes top 10 dont 16 top 3 — + rapport mensuel automatisé activé (scheduled task, Opus 5)
