# Stratégie SEO + Google Ads — Alain Brunelle

Date : 2026-08-26 · Territoire : Blainville, Sainte-Thérèse + couronne (Rosemère, Lorraine, Boisbriand, Bois-des-Filion, Saint-Eustache, Sainte-Anne-des-Plaines)
Sources : Google Keyword Planner via MCC vpourdesign (volumes réels, géo Québec, langue FR, 12 mois août 2025 à juillet 2026) + GSC/GA4 du site + `SEO_TECHNIQUE_BRUNELLE.md` (architecture et concurrence, avril 2026).
Ce document ajoute la couche data et le plan Google Ads chiffré au plan technique existant. Version visuelle : `06_livrables/strategie-seo.html`.

---

## 1. État actuel (data réelle du site)

- Site refait 2026, title et H1 alignés « courtier immobilier Sainte-Thérèse & Blainville », pages villes en place.
- Juillet 2026 (GSC) : 55 visites Google (×18 vs juin), 3 766 apparitions (+556 %), 44 requêtes top 10 dont 16 top 3. Le momentum est réel, la fondation est bonne.
- Manques identifiés : schema.org absent, meta description dupliquée, vidéos sans transcription, contenu quartiers pas encore construit.

## 2. Lecture du marché (data Google réelle)

### 2.1 Requêtes courtier — le cœur du positionnement

| Requête | Vol./mois | CPC marché |
|---|---:|---|
| courtier immobilier blainville | 110 | 4,91-13,45 $ |
| courtier immobilier sainte-therese | 70 | 7,74-23,14 $ |
| courtier immobilier mirabel | 50 | 4,89-19,68 $ |
| courtier immobilier saint-eustache | 30 | 11,03-21,50 $ |
| courtier immobilier rosemere / lorraine / boisbriand | 60 cumulé | 4,93-19,70 $ |
| courtier immobilier deux-montagnes | 10 | HIGH (95) |
| alain brunelle (marque personnelle) | 50-60 | ≈ 0 $ |

Pic saisonnier des requêtes courtier : mars et septembre-novembre. Le marché paie jusqu'à 23 $ le clic sur Sainte-Thérèse : chaque position organique tenue est une dépense évitée.

### 2.2 Niches acheteur validées par la data (SERP faibles, gagnables)

| Requête | Vol./mois | CPC | Lecture |
|---|---:|---|---|
| maison a vendre blainville fontainebleau | 170 | 0,44-1,66 $ | quartier le plus cherché |
| quartier fontainebleau blainville | 110 | quasi nul | intention découverte |
| duplex a vendre blainville | 170 | 0,02-1,45 $ | niche investisseur |
| terrain a vendre blainville | 170 | 0,02-1,38 $ | niche constructeur |
| condo a vendre rosemere | 260 | 0,02-0,67 $ | stable 12 mois |
| condo a vendre lorraine | 140 | quasi nul | zéro concurrence Ads |
| plex a vendre rive nord | 140 | quasi nul | investisseur |
| maison a vendre blainville centris | 110 | quasi nul | intention outil |
| maison neuve blainville | 40 | 0,64-1,82 $ | MEDIUM 63 |

La grappe Fontainebleau à elle seule : ≈ 280 recherches/mois. La page `/quartiers/blainville/fontainebleau/` prévue au sitemap cible est la priorité no 1 des quartiers, loin devant les autres.

### 2.3 Volume acheteur de fond (contexte)

Blainville 8 100 · Mirabel 5 400 · Rosemère 4 400 · Boisbriand 3 600 · Lorraine 2 400 · Deux-Montagnes 1 900 · Bois-des-Filion 1 900 · Saint-Eustache 1 300 · Sainte-Anne-des-Plaines 1 000 · Sainte-Thérèse 480. Les portails dominent ces SERP : on les travaille via les fiches DDF indexées (longue traîne par propriété) et les pages niches, jamais en frontal.

### 2.4 Vendeurs — capturable en Ads géo-cadré

Les requêtes vendeur se tapent sans nom de ville : combien vaut ma maison 4 400/mois province (pic août 22 200), estimation maison en ligne gratuite 1 600, evaluation maison 880. « evaluation maison blainville » n'a pas de volume mesurable : le jeu local se fait en ciblage géographique Ads sur les requêtes génériques + une landing locale.

## 3. Le constat stratégique

1. **La data valide l'architecture quartiers du plan technique.** Fontainebleau d'abord (280/mois), les autres quartiers ensuite. Personne ne détient ces SERP à Blainville.
2. **Les niches duplex/terrain/condo sont désertes en Ads (CPC 0,02 $) et faibles en SEO.** Des pages inventaire filtrées (flux DDF) + 300 mots uniques suffisent pour les prendre.
3. **Salomon reste le concurrent à battre sur « courtier immobilier »** (pages villes + centaines d'URLs propriétés). L'angle : profondeur quartiers, « Le mot d'Alain » (contenu unique par fiche, déjà au TODO), vitesse, schema complet, avis.
4. **Le marché vendeur se gagne en Ads géo-cadré**, pas en SEO local (pas de volume localisé). Landing évaluation + rayon 15 km.

## 4. Plan onsite (priorisé par la data)

1. **P1 — Schema + hygiène** : RealEstateAgent + Person + BreadcrumbList sur tout le site, meta descriptions uniques, transcriptions vidéo. Zéro coût, débloque les rich results.
2. **P2 — `/quartiers/blainville/fontainebleau/`** : page riche (prix réels, écoles, parcs, inscriptions du quartier, le mot d'Alain). Ensuite Chambéry, Alençon, Vieux-Village Sainte-Thérèse.
3. **P3 — Pages niches inventaire** : `/duplex-a-vendre-blainville/`, `/terrain-a-vendre-blainville/`, `/condo-a-vendre-rosemere/`, `/condo-a-vendre-lorraine/`, `/plex-a-vendre-rive-nord/` : listes DDF filtrées + intro unique. ≈ 880 recherches/mois cumulées, concurrence quasi nulle.
4. **P4 — Landing `/evaluation/`** : « Combien vaut votre maison à Blainville ou Sainte-Thérèse? », formulaire court, réponse d'Alain en 24 h, preuves (ventes récentes, avis). Reçoit la campagne Ads vendeur.
5. **P5 — « Le mot d'Alain » sur chaque fiche** (TODO existant) : le boost GEO/AI Overviews. 100-200 mots uniques par propriété, E-E-A-T signé OACIQ.
6. **Compléter les pages villes** du sitemap cible : Saint-Eustache et Sainte-Anne-des-Plaines (territoires déclarés RE/MAX) avant l'expansion.

## 5. Local — Google Business Profile

- Fiche « Alain Brunelle courtier immobilier RE/MAX » : catégorie Agent immobilier, zone Blainville + Sainte-Thérèse + couronne, lien vers la page ville correspondante.
- Avis : 3 avis actuellement (5,0). Objectif 25+ en 90 jours : demande systématique post-transaction + QR carte remerciement. C'est le facteur no 1 du pack local.
- 2 posts/mois : inscription vedette + conseil vendeur. Photos terrain régulières.

## 6. Plan Google Ads (compte 7999591150)

| Campagne | Mots-clés | Budget/mois | CPC cible | Attendu |
|---|---|---:|---|---|
| B1 · Brand | [alain brunelle] + variantes | 15 $ | 0,20 $ | protection, 100 % top |
| B2 · Courtier exact | [courtier immobilier blainville], [sainte-therese], [rosemere], [lorraine], [boisbriand] | 300 $ | max 9 $ | ≈ 40 clics très chauds |
| B3 · Vendeurs géo-cadré (rayon 15 km Blainville) | "combien vaut ma maison", "evaluation maison", "estimation maison en ligne" | 250 $ | 2,50 $ | ≈ 100 clics → 5-8 leads éval |
| B4 · Niches inventaire (si inscriptions en stock) | [duplex a vendre blainville], [terrain a vendre blainville], [condo a vendre rosemere] | 60 $ | 0,50 $ | ≈ 120 clics acheteurs |
| **Total** | | **625 $** | | dans le budget type 600-900 $ |

- Saisonnalité : monter B3 à 400 $ de juin à septembre (pic vendeur), monter B2 en mars et septembre-novembre (pic courtier). Décembre-janvier : B2 et B3 à 60 %.
- Négatifs : emploi, salaire, formation, cours, devenir, duproprio, a louer, estimation municipale, rôle évaluation.
- Coordination MCC : le compte Remax Crystal/D'ici couvre Repentigny, Terrebonne, Mascouche et Mirabel; Blainville et Sainte-Thérèse restent à Brunelle. Zéro enchère croisée entre les deux comptes.
- Extensions : appel, lieu (GBP), liens (évaluation, quartiers, avis), avis.
- Landing par groupe : jamais l'accueil. B2 → page ville exacte, B3 → /evaluation/, B4 → page niche exacte. Quality Score 8+ attendu (pages dédiées déjà en place).

## 7. Roadmap 90 jours

**Septembre** : schema + hygiène (P1) · landing /evaluation/ · lancer B1 + B2 + B3 · demande d'avis systématique.
**Octobre** : page Fontainebleau (P2) · pages niches duplex/terrain (P3) · B4 si inventaire · transcriptions vidéo.
**Novembre** : quartiers suivants (Chambéry, Vieux-Village) · pages villes Saint-Eustache + Sainte-Anne · « Le mot d'Alain » en production · bilan 90 jours.

## 8. KPIs mensuels (départ = juillet 2026)

| Indicateur | Départ | Cible 90 jours |
|---|---|---|
| Clics organiques Google | 55/mois | 200/mois |
| Requêtes top 3 | 16 | 30 |
| « courtier immobilier blainville » | à mesurer | top 3 |
| « courtier immobilier sainte-therese » | à mesurer | top 3 |
| Leads évaluation (B3 + organique) | 0 | 6/mois |
| Avis Google | 3 | 25 |
| Coût par lead vendeur | — | < 45 $ |

---

*Généré par V pour Design. Data Keyword Planner réelle (12 mois, géo Québec, FR). Les positions exactes se suivent dans `06_livrables/seo-dashboard.html` et le rapport mensuel automatisé.*
