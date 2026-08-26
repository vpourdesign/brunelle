# Données SEO réelles — mise en place (gratuit, une seule fois, ~10 min)

Le script `scripts/seo-snapshot.mjs` tire les clics/impressions/positions réels de
Google Search Console (+ GA4 en option) et les injecte dans
`06_livrables/seo-dashboard.html`. Aucun abonnement — API officielles Google,
gratuites pour cet usage.

## Étape 1 — Créer le projet Google Cloud (gratuit)

1. Va sur <https://console.cloud.google.com/> (connecté avec le compte Google
   qui gère la Search Console d'alainbrunelle.com).
2. En haut : **Sélectionner un projet → Nouveau projet** → nom : `brunelle-seo` → Créer.
3. Menu ☰ → **API et services → Bibliothèque** :
   - cherche **« Google Search Console API »** → Activer
   - cherche **« Google Analytics Data API »** → Activer

## Étape 2 — Créer le compte de service + la clé

1. Menu ☰ → **IAM et administration → Comptes de service** → **Créer un compte de service**.
2. Nom : `seo-dashboard` → Créer et continuer → (aucun rôle nécessaire) → OK.
3. Clique sur le compte créé → onglet **Clés** → **Ajouter une clé → Créer une clé → JSON** → Créer.
   Un fichier `.json` se télécharge.
4. Renomme-le et dépose-le ici :
   `BRUNELLE/.secrets/google-service-account.json`
   (le dossier `.secrets/` est déjà dans `.gitignore` — jamais committé.)

## Étape 3 — Donner accès en lecture au compte de service

Ouvre le fichier JSON et copie le courriel `client_email`
(ressemble à `seo-dashboard@brunelle-seo.iam.gserviceaccount.com`).

- **Search Console** : <https://search.google.com/search-console> → propriété
  alainbrunelle.com → Paramètres → **Utilisateurs et autorisations** →
  Ajouter un utilisateur → colle le courriel → autorisation **Complète** (ou Restreinte).
- **GA4** (optionnel mais recommandé) : Analytics → Administration →
  **Gestion de l'accès à la propriété** → + → colle le courriel → rôle **Lecteur**.
  Note aussi l'**ID de propriété** numérique (Administration → Paramètres de la
  propriété, ex. `421301275`).

## Étape 4 — Config du projet

Ajoute dans `.env.local` :

```
GOOGLE_SA_KEY=.secrets/google-service-account.json
GSC_SITE_URL=sc-domain:alainbrunelle.com
GA_PROPERTY_ID=<ID numérique GA4>
```

> Si la propriété Search Console est de type « préfixe d'URL » plutôt que
> « domaine », mets plutôt `GSC_SITE_URL=https://alainbrunelle.com/`.

## Étape 5 — Lancer

```bash
node scripts/seo-snapshot.mjs
```

Le dashboard (`06_livrables/seo-dashboard.html`) affiche alors les clics réels,
et chaque exécution ajoute un point de progression. Rythme suggéré : 1×/mois,
ou demander à Claude « ajoute un snapshot SEO » (il relance le script et
re-vérifie en plus les positions SERP Alain vs Salomon manuellement).
