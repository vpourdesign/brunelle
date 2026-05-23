# Immobilier — Playbook de sections stratégiques (white-labeled)

Bibliothèque réutilisable de sections, patterns et stratégies pour sites de courtiers immobiliers. Chaque section est documentée avec son **contexte stratégique** (le pourquoi), sa **structure**, un **exemple white-labelé** et les **variables** à remplir.

## Comment utiliser ce fichier

- Les variables sont entre accolades doubles: `{{COURTIER}}`, `{{VILLE_PRINCIPALE}}`, etc.
- Chaque pattern est numéroté pour pouvoir y faire référence (« utilise le pattern #3 »)
- À chaque nouveau projet de courtier: faire un find/replace global des variables
- Pour ajouter une nouvelle section: copier le gabarit en bas du fichier

## Variables globales (à définir une fois par projet)

| Variable | Description | Exemple Brunelle |
|---|---|---|
| `{{COURTIER}}` | Nom complet du courtier | Alain Brunelle |
| `{{COURTIER_PRENOM}}` | Prénom uniquement (pour le ton familier) | Alain |
| `{{AGENCE}}` | Bannière / agence | RE/MAX CRYSTAL |
| `{{VILLE_PRINCIPALE}}` | Ville #1 du territoire | Sainte-Thérèse |
| `{{VILLE_SECONDAIRE}}` | Ville #2 du territoire | Blainville |
| `{{REGION}}` | Région/secteur global | Rive-Nord |
| `{{VILLES_SECONDAIRES}}` | Autres villes couvertes | Rosemère, Lorraine, Boisbriand, Mirabel |
| `{{ANNEES_EXPERIENCE}}` | Années en métier | 29 |
| `{{NB_TRANSACTIONS}}` | Transactions totales | 3 000+ |
| `{{DELAI_MOYEN_VENTE}}` | Délai moyen vs marché | 28 j (vs 52 j marché) |
| `{{RANKING}}` | Classement/badge | Top 5 % RE/MAX Québec |
| `{{TELEPHONE}}` | Ligne directe | 450.430.5555 |
| `{{COURRIEL}}` | Email pro | alain@... |
| `{{POSITIONNEMENT}}` | Angle différenciateur | Stratège analytique du marché |

---

# Index des patterns

1. [Hero « courtier stratège » 3 colonnes](#pattern-1)
2. [Bandeau stats sociales (3 chiffres clés)](#pattern-2)
3. [Carrousel propriétés Centris](#pattern-3)
4. [Section vidéos éducatives (positionnement expert)](#pattern-4)
5. [About data-driven avec photo](#pattern-5)
6. [Graphique marché par tranche de prix](#pattern-6)
7. [Témoignage signé avec quartier](#pattern-7)
8. [CTA band finale (évaluation gratuite)](#pattern-8)
9. [Page-ville SEO (gabarit complet)](#pattern-9)
10. [Questionnaire d'évaluation multi-étapes](#pattern-10)
11. [Stratégie lead magnets par buyer stage](#pattern-11)
12. [3 CTA par étape du funnel (Awareness/Consideration/Decision)](#pattern-12)

---

<a id="pattern-1"></a>
## Pattern 1 — Hero « courtier stratège » 3 colonnes

### Contexte stratégique
Le hero d'un courtier doit faire **trois jobs en 5 secondes**: établir la crédibilité (photo + agence), affirmer le positionnement différenciateur (pas juste « courtier »), et donner une action sans friction. La grille en 3 zones (photo + carte ID + CTA) permet ces trois jobs sans surcharger.

**À éviter**: le hero générique « Vendez votre maison rapidement » avec photo de maison stock. Ça ne distingue pas le courtier des 47 autres dans son secteur.

### Structure
- **Colonne 1** — Photo professionnelle du courtier + tag agence + caption (preuve sociale chiffrée)
- **Colonne 2** — Eyebrow positionnement + H1 avec villes en emphasis + sous-ligne territoires
- **Bandeau CTA** — Prise de rendez-vous avec mention agenda direct (réduit la friction)

### Exemple white-labelé
```
Eyebrow:     Courtier leader — {{REGION}}
H1:          Vendre ou acheter à {{VILLE_PRINCIPALE}} et {{VILLE_SECONDAIRE}}
             — avec un stratège.
Sous-ligne:  {{VILLES_SECONDAIRES}} · et l'ensemble de la {{REGION}}
Caption:     Plus de {{NB_TRANSACTIONS}} familles accompagnées sur la {{REGION}} depuis {{ANNEE_DEBUT}}.

CTA:         Prenez rendez-vous avec {{COURTIER}}
             Choisissez un créneau directement dans son agenda  →
```

### Notes
- Le mot **« stratège »** (ou équivalent: « analyste », « expert ») dans le H1 fait toute la différence vs « courtier »
- La caption sous la photo = preuve sociale instantanée (chiffre + ancrage temporel)
- Le CTA mentionne **l'agenda direct** car les gens craignent le démarchage. Réduit la friction perçue.

---

<a id="pattern-2"></a>
## Pattern 2 — Bandeau stats sociales (3 chiffres clés)

### Contexte stratégique
Trois stats max. Plus = dilution. Les stats doivent répondre à des **objections silencieuses**: « est-il expérimenté? », « est-il efficace? », « est-il reconnu? ».

### Structure
- Fond contrasté (dark ou couleur signature)
- Eyebrow daté pour fraîcheur (« En chiffres · 2026 »)
- H2 qui pose le territoire de leadership
- 3 stats avec chiffre géant + label court

### Exemple white-labelé
```
Eyebrow:  En chiffres · {{ANNEE}}
H2:       Le leader {{VILLE_PRINCIPALE}} & {{VILLE_SECONDAIRE}}, en données.

Stat 1:   {{NB_TRANSACTIONS}}        Transactions conclues depuis {{ANNEE_DEBUT}}
Stat 2:   {{DELAI_MOYEN_VENTE}}      Délai moyen de vente (vs {{DELAI_MARCHE}} marché)
Stat 3:   {{RANKING}}                {{ORGANISME}} — depuis {{NB_ANNEES_RANKING}} ans
```

### Notes
- La stat #2 (délai de vente) doit **toujours** inclure la comparaison marché. Sans comparaison, le chiffre ne dit rien.
- Si pas de ranking officiel, remplacer par: « 100 % clients satisfaits », « 87 % vendu au prix demandé », ou stat équivalente vérifiable.

---

<a id="pattern-3"></a>
## Pattern 3 — Carrousel propriétés Centris

### Contexte stratégique
Montrer 3 propriétés actives prouve que le courtier **travaille en ce moment**. Le MLS visible établit la légitimité. La diversité des types (maison, plex, condo) signale qu'il couvre plusieurs segments.

### Structure
- Sec-head avec lien « voir toutes les propriétés »
- 3 cards: badge type / photo Centris (lazy) / ville+MLS / adresse / prix / meta (année, PC, photos)

### Exemple white-labelé
```
Eyebrow:  Propriétés à vendre
H2:       Récemment inscrits chez {{COURTIER}}.
Lien:     Voir toutes les propriétés →

Card:     [Badge: {{TYPE_PROPRIETE}}]
          {{VILLE}} · MLS {{NUMERO_MLS}}
          {{ADRESSE}}
          {{PRIX}} $
          📅 {{ANNEE_CONSTRUCTION}}   📐 {{SUPERFICIE}} PC   📷 {{NB_PHOTOS}}
```

### Notes
- Toujours utiliser les **vraies URLs Centris** pour les images (mediaserver.centris.ca) — pas de stock
- Si moins de 3 propriétés actives, alterner avec « récemment vendues » (preuve d'activité)
- Le badge type doit être catégorique (Maison unifamiliale / Plex / Condo / Terrain), pas marketing

---

<a id="pattern-4"></a>
## Pattern 4 — Section vidéos éducatives

### Contexte stratégique
Les vidéos courtes du courtier qui explique le marché établissent **l'autorité en mode soft**. Pas du contenu vente — du contenu éducation. Sert aussi de SEO YouTube si syndiqué.

### Structure
- Sec-head avec lien chaîne YouTube
- Grille de 5-6 vignettes vidéo avec play overlay et titre
- Format paysage 16:9, max 90 secondes par vidéo

### Exemple white-labelé
```
Eyebrow:  {{ANNEES_EXPERIENCE}} ans d'expérience · {{VILLE_PRINCIPALE}} & {{VILLE_SECONDAIRE}}
H2:       Le marché expliqué sans compromis.
Lien:     Voir la chaîne YouTube →

Vidéos:   1. L'avantage {{AGENCE}}
          2. L'avenir de l'immobilier
          3. Étapes importantes
          4. Fluctuations du marché
          5. [Sujet spécifique au courtier]
```

### Notes
- Titres courts (2-4 mots), pas de jargon
- Toujours 5 vidéos minimum (la grille pleine = perception de prolifique)
- Si pas de vidéos, NE PAS mettre cette section. Pire qu'absent: section vide ou faible.

---

<a id="pattern-5"></a>
## Pattern 5 — About data-driven avec photo

### Contexte stratégique
La section « À propos » sur la homepage doit **différencier**, pas raconter une autobiographie. Le hook: une phrase qui explique *comment* le courtier travaille différemment, pas combien d'années il a.

### Structure
- Photo plein cadre du courtier (en action ou portrait posé)
- Eyebrow discret « À propos »
- H2 court avec angle distinctif (max 22 caractères de large)
- Paragraphe descriptif (60ch max, line-height 1.7)
- Double CTA: en savoir plus + prendre rendez-vous

### Exemple white-labelé
```
H2:       Le courtier de la {{REGION}} qui décide avec des chiffres,
          pas des intuitions.

Texte:    {{POSITIONNEMENT}}, {{COURTIER}} bâtit chaque transaction sur
          une lecture fine des données locales : historique de vente par
          rue, saisonnalité, positionnement de prix, taux d'absorption
          du quartier. Résultat : des ventes plus rapides, au juste prix.

CTAs:     [En savoir plus →]   Prendre rendez-vous
```

### Notes
- Le H2 doit pouvoir tenir sur une carte de visite. Si trop long = pas assez clair.
- Lister 3-4 éléments concrets de la méthode (pas des qualités vagues)
- Finir par le **résultat business**, pas une qualité du courtier

---

<a id="pattern-6"></a>
## Pattern 6 — Graphique marché par tranche de prix

### Contexte stratégique
Un graphique avec des **vraies données locales** sur la homepage est rare et signale immédiatement « ce courtier connaît son marché en chiffres ». Plus convaincant que tout texte.

### Structure
- Section fond bleu signature
- Eyebrow daté + H2 narratif
- Lien vers rapport mensuel complet
- Barres horizontales par tranche de prix (5 tranches)

### Exemple white-labelé
```
Eyebrow:  Marché {{REGION}} · {{MOIS}} {{ANNEE}}
H2:       Ce que font vraiment les prix — par tranche.
Lien:     Rapport mensuel complet →

Tranches: <300k       [████░░░░░░░░░░] 0
          300-500k    [████░░░░░░░░░░] 0
          500-800k    [████████████████] 6
          800k-1.5M   [██████████░░░░] 4
          >1.5M       [████░░░░░░░░░░] 0
```

### Notes
- Les **vraies données** (extraites de Centris/APCIQ) sont obligatoires
- Mettre à jour mensuellement — un graphique daté de 6 mois fait mauvaise impression
- Le H2 doit être éditorial (« Ce que font les prix ») pas descriptif (« Ventes par tranche »)

---

<a id="pattern-7"></a>
## Pattern 7 — Témoignage signé avec quartier

### Contexte stratégique
Un témoignage avec **prénom + quartier précis + année** est 10x plus crédible qu'un témoignage anonyme. Le quartier signale aussi le territoire d'expertise.

### Structure
- Photo authentique (du courtier en action, pas de stock)
- Quote courte (max 3 phrases) avec emphase sur résultat chiffré
- Signature: Prénom(s) + Quartier précis + Année

### Exemple white-labelé
```
« {{COURTIER_PRENOM}} a vendu notre maison de {{QUARTIER}} en {{NB_JOURS}}
jours, au prix demandé. Sa stratégie de mise en marché, c'est du
sur-mesure. On a rarement vu un courtier aussi rigoureux. »

— {{PRENOMS_CLIENTS}} · {{QUARTIER}}, {{VILLE}} · {{ANNEE}}
```

### Notes
- Toujours inclure **un chiffre** dans la quote (jours, %, prix)
- Le quartier précis (pas juste la ville) sert le SEO local et la preuve géographique
- Demander la permission écrite + le quartier exact au moment du closing

---

<a id="pattern-8"></a>
## Pattern 8 — CTA band finale (évaluation gratuite)

### Contexte stratégique
La dernière section avant le footer doit capturer le lead **vendeur** (segment le plus payant en commission). La question rhétorique force la réflexion.

### Structure
- Bandeau pleine largeur sur fond distinctif
- H2 question
- Bouton unique, clair, action-oriented

### Exemple white-labelé
```
H2:      Prêt à connaître la valeur réelle de votre propriété ?
Bouton:  Demander mon évaluation
URL:     /vendre/evaluation-gratuite/
```

### Notes
- **Une seule CTA**, pas un menu de choix (paradoxe du choix)
- Le mot « réelle » est crucial — implique que l'évaluation municipale est inexacte
- Le bouton dit ce que l'utilisateur fait (« Demander »), pas ce qu'il reçoit

---

<a id="pattern-9"></a>
## Pattern 9 — Page-ville SEO (gabarit complet)

### Contexte stratégique
Une page par ville couverte = pilier SEO local. Cible la requête « courtier immobilier {{VILLE}} ». Structure répétable, contenu unique par ville.

### Structure obligatoire (dans l'ordre)
1. **H1 SEO**: « Courtier immobilier à {{VILLE}} — {{COURTIER}}, {{AGENCE}} »
2. **Bandeau stats locales**: « Les chiffres qui comptent à {{VILLE}} »
3. **Quartiers**: grille des micro-quartiers de la ville
4. **Marché**: « Le marché immobilier à {{VILLE}} en {{ANNEE}} »
5. **Pourquoi le courtier**: « Pourquoi choisir {{COURTIER}} à {{VILLE}} »
6. **Types de propriétés**: « Types de propriétés les plus vendues »
7. **FAQ**: 5-8 questions « vendre et acheter à {{VILLE}} »
8. **CTA finale**: « Prêt à bouger à {{VILLE}}? » → /rendez-vous/

### Notes
- Le H1 doit **exactement** matcher la requête Google ciblée
- Section quartiers = lien interne riche (chaque quartier peut devenir sa propre page plus tard)
- La FAQ remplit le rôle de schema.org FAQPage (riche snippet potentiel)
- CTA finale change le verbe selon la ville (« bouger », « investir », « s'établir »)

---

<a id="pattern-10"></a>
## Pattern 10 — Questionnaire d'évaluation multi-étapes

### Contexte stratégique
Le formulaire monolithique a un taux de conversion de 10-15 %. Le questionnaire **multi-étapes avec progression** monte à 35-50 %. Raison: chaque micro-engagement (« quelle adresse? ») augmente l'engagement à terminer.

### Structure (6 étapes max)
1. **Adresse** de la propriété (champ unique + autocomplete idéalement)
2. **Configuration** (type: maison/condo/plex + nb étages)
3. **Pièces** (chambres + salles de bain)
4. **État** des rénovations (4 boutons: refait à neuf / récent / à rafraîchir / à rénover)
5. **Coordonnées**: « Où vous envoyer votre rapport? » (email + téléphone)
6. **Confirmation**: « Merci. Votre demande est reçue. »

### Exemple white-labelé
```
H1:       Combien vaut votre propriété en {{ANNEE}}?

Étape 1:  Quelle est l'adresse de votre propriété?
Étape 2:  Quelle est la configuration?
Étape 3:  Combien de pièces?
Étape 4:  État des rénovations
Étape 5:  Où vous envoyer votre rapport?
Étape 6:  Merci. Votre demande est reçue.
```

### Notes
- Demander l'email à l'**avant-dernière** étape, pas la première (sunk cost effect)
- Le champ téléphone doit être **optionnel** (sinon -20 % conversion)
- L'étape 6 doit inclure: prochaine étape claire + délai de réponse + signature humaine
- Mettre une barre de progression visible en tout temps

---

<a id="pattern-11"></a>
## Pattern 11 — Stratégie lead magnets par buyer stage

### Contexte stratégique
Le cycle d'achat immobilier est long (6-18 mois). Un seul lead magnet = inefficace. Il faut 3 lead magnets distincts qui correspondent au niveau de chaleur du prospect.

### Mapping des stages

| Stage | Profil prospect | Lead magnet | Format |
|---|---|---|---|
| **Awareness** | Rêve, pas pressé, ne connaît pas le courtier | « 10 erreurs des premiers acheteurs » / « Quel type d'acheteur êtes-vous? » | Quiz ou checklist PDF |
| **Consideration** | Magasine activement, compare les courtiers | Évaluation gratuite de propriété / Rapport de marché par quartier | Formulaire personnalisé |
| **Decision** | Prêt à bouger, cherche le bon humain | Calculateur d'hypothèque + appel découverte 20 min | Calendly intégré |

### Lead magnets par segment

**Pour les vendeurs** (commission plus élevée — prioriser):
- « Évaluation gratuite et confidentielle de votre propriété »
- « Les 7 erreurs qui font baisser le prix de vente de 15 % »
- Rapport mensuel des ventes par code postal

**Pour les acheteurs**:
- « Checklist de visite — 47 points à vérifier avant de faire une offre »
- « Guide du premier acheteur au Québec » (RAP, CELIAPP, taxe de bienvenue)
- Accès anticipé aux nouvelles inscriptions par secteur

### Notes
- Toujours **hyperlocaliser** le lead magnet (« Marché de {{QUARTIER}} » > « Marché du Québec »)
- Inclure la réglementation québécoise (OACIQ, taxe de bienvenue, RAP/CELIAPP)
- Ne PAS demander email + téléphone + nom + ville d'un coup au stage Awareness — email seulement

---

<a id="pattern-12"></a>
## Pattern 12 — 3 CTA par étape du funnel

### Contexte stratégique
Le niveau d'engagement demandé doit matcher le niveau de chaleur du lead. Demander « Réservez un appel » à un visiteur en awareness = bounce. Demander « Téléchargez notre guide » à un lead prêt = perdu.

### Les 3 CTA

#### Awareness — « Découvrez votre profil immobilier en 60 secondes »
- **Pourquoi**: le quiz est le CTA. Aucune mention de courtier, vente ou achat. Pure curiosité.
- **Variantes**:
  - « Quel type d'acheteur (ou vendeur) êtes-vous? Faites le test »
  - « Êtes-vous prêt pour votre prochain move immobilier? »
- **Champ demandé**: rien au début. Email uniquement à la fin, en échange du résultat.

#### Consideration — « Recevez votre évaluation personnalisée — gratuite et sans engagement »
- **Pourquoi**: ils veulent une vraie réponse à une vraie question. « Personnalisée » = spécifique à leur cas. « Sans engagement » désamorce la peur du démarchage.
- **Variantes selon le quiz**:
  - Vendeur → « Obtenez la valeur actuelle de votre propriété »
  - Acheteur → « Découvrez votre capacité d'achat réelle »
- **Champs demandés**: email + téléphone (optionnel) + adresse si vendeur.

#### Decision — « Réservez 20 minutes avec {{COURTIER_PRENOM}} »
- **Pourquoi**: à ce stade, ils veulent un humain sans friction. « 20 minutes » borne l'engagement. « Réservez » donne le contrôle (vs « on vous rappelle »).
- **Variantes**:
  - « Discutons de votre projet — 20 min, sans pression »
  - « Réservez votre appel découverte »
- **À éviter absolument**: « Contactez-nous », « Demandez une soumission », « Parlez à un expert »

### Règle d'or des boutons
- Le **bouton** dit l'action (2-4 mots): « Commencer le test »
- Le **titre au-dessus** porte la promesse: « Découvrez votre profil en 60 secondes »
- Jamais l'inverse.

---

# Gabarit pour ajouter une nouvelle section

Copier-coller ce gabarit en bas du fichier, l'incrémenter dans l'index.

```markdown
<a id="pattern-N"></a>
## Pattern N — [Nom court de la section]

### Contexte stratégique
[Pourquoi cette section existe. Quel problème elle résout. Quelle psychologie utilisateur elle adresse. Quoi éviter.]

### Structure
- [Élément 1]
- [Élément 2]
- [...]

### Exemple white-labelé
```
[Contenu avec variables {{PLACEHOLDER}}]
```

### Notes
- [Pièges à éviter]
- [Variantes contextuelles]
- [Données chiffrées idéales]
```

---

# Changelog

- **2026-05-22** — Création du fichier. Patterns 1-12 documentés à partir du site Brunelle + conversation stratégie lead magnets.
