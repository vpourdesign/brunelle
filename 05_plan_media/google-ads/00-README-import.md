# Campagne Google Ads — Brunelle · Autorité Blainville (350 $/mois)

Générée le 2026-08-24 à partir des données GSC/GA4 du dossier BRUNELLE et de la stratégie
`06_livrables/google-ads-strategie.html`, adaptée de 500 $ → 350 $/mois, focus Blainville.

## Structure

- **Campagne** : Brunelle — Autorité Blainville · Search seulement · budget 11,50 $/jour (350 $ ÷ 30,4)
  · Maximiser les clics (plafond CPC 4 $ à régler dans les paramètres) · **créée en PAUSE** — Vincent active après révision.
- **3 groupes d'annonces** (exact + expression seulement, jamais large) :
  1. *Courtier Blainville* → `/courtier-immobilier/blainville/` (page qui a déjà 228 impressions GSC en juillet, pos. ~8)
  2. *Vendre — Blainville* → `/vendre/evaluation-gratuite/`
  3. *Évaluation — Blainville* → `/vendre/evaluation-gratuite/`
- **21 mots-clés négatifs** au niveau campagne (emploi, location, duproprio, centris, maison à vendre…)
- **1 RSA par groupe** : 12 titres + 4 descriptions, mot-clé de ville dans le titre 1 (Quality Score), conformité OACIQ (nom + RE/MAX Crystal visibles).
- **Assets** : 5 liens annexes, 6 accroches, 2 extraits structurés (Services + Quartiers), extension d'appel 450 430-4207.

## Ordre d'import dans Google Ads Editor

1. `01-campagne-blainville.csv` — campagne + négatifs + groupes + mots-clés + RSA
2. `02-liens-annexes.csv`
3. `03-accroches.csv`
4. `04-extraits-structures.csv`
5. `05-appel.csv`
6. `06-ciblage-geo.csv` (sinon : régler la géo à la main)

## Réglages à vérifier dans Editor / l'interface web (non couverts par CSV)

- **Géo** : Blainville (Québec) seulement · option « Présence : personnes se trouvant régulièrement dans la zone » · exclure le reste du Québec si volume hors zone.
- **Réseau** : décocher partenaires de recherche + Display.
- **Enchères** : Maximiser les clics avec **plafond CPC 4,00 $**.
- **Langues** : Français + Anglais.
- **Calendrier** : +enchère 18 h–22 h et fins de semaine ; réduire 1 h–7 h (à faire après 2 semaines de données).

## Sponsorisé dans la carte (Maps)

Les annonces sur Google Maps exigent des **assets de lieu** liés à la fiche Google Business Profile
d'Alain (RE/MAX Crystal, Sainte-Thérèse). Ça se fait dans l'interface web Google Ads :
**Éléments → Lieu → Associer le compte Business Profile**, puis l'annonce Search devient éligible
à l'épingle « Sponsorisé » sur la carte pour les recherches « courtier immobilier blainville » à proximité.
Impossible via CSV/Editor — étape manuelle de 2 minutes une fois la campagne poussée.

## Suivi des conversions (non négociable avant d'activer)

Formulaire d'évaluation soumis + clic-pour-appeler via GA4 (G-F5DLZC93S3), importés dans Google Ads.
Sans ça, impossible d'optimiser un budget de 350 $.
