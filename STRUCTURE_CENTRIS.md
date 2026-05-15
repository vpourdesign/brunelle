# Structure du flux Centris `VPOURDESIGN{YYYYMMDD}.zip`

Document de référence pour bâtir le site d'**Alain Brunelle** avec Claude Code,
sur le même modèle que :
- https://www.fredetmax.com/nosproprietes
- https://www.jacquesroussel.com/nosproprietes

---

## 1. Source des données

- **Fournisseur** : Centris (flux DDF / inscriptions brutes)
- **Livraison** : dépôt automatique d'un `.zip` chaque jour dans le compte
  DriveHQ (`VPOURDESIGN{YYYYMMDD}.zip`, ex. `VPOURDESIGN20260423.zip`)
- **Contenu** : 16 fichiers `.TXT` séparés par virgules, valeurs entre `"`,
  encodage **Windows-1252 / ISO-8859-1** (pas UTF-8 — les accents sortent
  cassés si on les lit en UTF-8)
- **Le zip contient TOUS tes clients courtiers dans le même fichier**.
  Le filtrage par courtier se fait côté code.

---

## 2. Les 16 fichiers et leur rôle

| Fichier                      | Rôle                              | Clé de liaison     |
|------------------------------|-----------------------------------|--------------------|
| `INSCRIPTIONS.TXT`           | Fiche de chaque propriété (189 colonnes) | `NO_INSCRIPTION` (col. 1) |
| `PHOTOS.TXT`                 | URLs des photos                   | `NO_INSCRIPTION` + `SEQUENCE` |
| `ADDENDA.TXT`                | Description longue (FR / EN)      | `NO_INSCRIPTION` + `LANGUE` + `SEQUENCE` |
| `REMARQUES.TXT`              | Remarques publiques courtier (FR/EN) | `NO_INSCRIPTION` |
| `CARACTERISTIQUES.TXT`       | Caractéristiques codées (type revêtement, chauffage, etc.) | `NO_INSCRIPTION` + `CODE` |
| `PIECES_UNITES.TXT`          | Liste des pièces (cuisine, chambre, dimensions) | `NO_INSCRIPTION` |
| `UNITES_SOMMAIRES.TXT`       | Sommaire des unités (plex/multi)  | `NO_INSCRIPTION` |
| `UNITES_DETAILLEES.TXT`      | Détail par unité (plex/multi)     | `NO_INSCRIPTION` |
| `DEPENSES.TXT`               | Dépenses annuelles (taxes, etc.)  | `NO_INSCRIPTION` |
| `RENOVATIONS.TXT`            | Rénovations effectuées            | `NO_INSCRIPTION` |
| `VISITES_LIBRES.TXT`         | Portes ouvertes                   | `NO_INSCRIPTION` |
| `LIENS_ADDITIONNELS.TXT`     | Vidéo YouTube, visite virtuelle   | `NO_INSCRIPTION` |
| `MEMBRES.TXT`                | **Liste des courtiers** (nom, courriel, site web, photo) | `NO_MEMBRE` |
| `MEMBRES_MEDIAS_SOCIAUX.TXT` | Facebook / Instagram / YouTube    | `NO_MEMBRE` |
| `BUREAUX.TXT`                | Adresse du bureau                 | `NO_BUREAU` |
| `FIRMES.TXT`                 | Firme (ex. RE/MAX CRYSTAL)        | `NO_FIRME` |

---

## 3. Colonnes clés (à valider en parsant vraiment le fichier)

### `MEMBRES.TXT` — identifier Alain Brunelle
```
col 1  NO_MEMBRE           ex. "135334"
col 2  NO_BUREAU           ex. "CYL001"
col 3  CODE_CENTRIS        ex. "J3732"
col 4  TYPE                "AF" (agent) | "CRES" (courtier résidentiel)
col 5  NOM                 "Lanni"
col 6  PRENOM              "Vincent"
col 9  TELEPHONE
col 12 EMAIL
col 13 SITE_WEB
col 16 PHOTO_URL           mediaserver.centris.ca/...
col 19 NOM_ENTREPRISE
```
→ Dès qu'Alain Brunelle apparaîtra dans ce fichier, note son `NO_MEMBRE`.

### `INSCRIPTIONS.TXT` — lier une propriété à un courtier
```
col 1  NO_INSCRIPTION (MLS)
col 3  NO_MEMBRE_1  (courtier inscripteur)
col 4  NO_BUREAU_1
col 5  NO_MEMBRE_2  (co-courtier, peut être vide)
col 6  NO_BUREAU_2
col 7  PRIX
col 21 DATE_INSCRIPTION
col 25 MUNICIPALITE (code)
col 26 TYPE_LIEU
col 27 RUE
col 28 NO_CIVIQUE
col 30 RUE_2
col 31 NO_CIVIQUE_2
col 32 CODE_POSTAL
...
col 69 ANNEE_CONSTRUCTION
col 75 DIMENSIONS
col 81 SUPERFICIE_TERRAIN
...
col 109 TAXES_MUNICIPALES
col 110 TAXES_SCOLAIRES
col 113 NB_CHAMBRES
col 114 NB_SALLES_BAIN
col 115 NB_SALLES_EAU
```
→ Pour récupérer **les propriétés d'Alain Brunelle** :
   `WHERE col3 = NO_MEMBRE_Brunelle OR col5 = NO_MEMBRE_Brunelle`

### `PHOTOS.TXT`
```
col 1  NO_INSCRIPTION
col 2  SEQUENCE (ordre d'affichage)
col 4  TYPE_PIECE (FACA = façade, etc.)
col 7  URL_PHOTO  (mediaserver.centris.ca — photos hébergées par Centris)
col 9  DATE_MAJ
```

### `ADDENDA.TXT` / `REMARQUES.TXT`
```
col 1  NO_INSCRIPTION
col 2  SEQUENCE
col 3  LANGUE  ("F" = français, "A" = anglais)
col 4  LIGNE_NUMERO
col 7  TEXTE
```
→ Il faut **concaténer toutes les lignes** d'une même (inscription, langue)
  dans l'ordre de `SEQUENCE` pour reconstituer le paragraphe.

---

## 4. Courtiers déjà présents dans le zip du 2026-04-23

| NO_MEMBRE | Nom                    | Site actuel            |
|-----------|------------------------|------------------------|
| 111464    | Maxime Beaulac         | fredetmax.com          |
| 112707    | Frédéric Gingras       | fredetmax.com          |
| 116807    | Marilyn Jacques        | (membre RE/MAX)        |
| 126477    | Alexandre Roussel      | jacquesroussel.com     |
| 128747    | Carl Jobin-Shaw        | fredetmax.com          |
| 135334    | Vincent Lanni          | vincentlanni.com       |
| 139871    | Marie Côté             | fredetmax.com          |
| 140233    | Vanessa Millaire       | fredetmax.com          |

→ **Alain Brunelle n'est pas encore dans le flux.** Quand Centris
  l'ajoutera, son `NO_MEMBRE` apparaîtra dans `MEMBRES.TXT`.

---

## 5. Architecture cible pour le site d'Alain Brunelle

```
┌─────────────────────────────────────────────────────────────┐
│  DriveHQ  →  VPOURDESIGN{YYYYMMDD}.zip  (déposé par Centris) │
└─────────────────────────────────────────────────────────────┘
                          │  1x / 24h (cron)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Job d'ingestion (Node / Python — à bâtir avec Claude Code) │
│   • télécharge le zip du jour depuis DriveHQ                │
│   • décompresse                                             │
│   • parse les 16 .TXT (Windows-1252 → UTF-8)                │
│   • filtre par NO_MEMBRE d'Alain Brunelle                   │
│   • joint INSCRIPTIONS + PHOTOS + ADDENDA + REMARQUES +     │
│     CARACTERISTIQUES + PIECES_UNITES                        │
│   • produit un JSON normalisé  (1 objet par propriété)      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Stockage                                                   │
│   Option A  →  fichier JSON statique dans /public (site Vite)│
│   Option B  →  Wix CMS Collection (comme fredetmax)         │
│   Option C  →  Supabase / Firestore / DB tierce             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Site d'Alain Brunelle (Wix OU React/Vite si sorti de Wix)  │
│   • page /nosproprietes — grille avec vignette, prix, ville │
│   • page /propriete/:mls — fiche complète + carrousel photos│
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Ce que Claude Code devra bâtir

### 6.1  Module d'ingestion (le plus critique)

**Entrée** : identifiants DriveHQ + `NO_MEMBRE` d'Alain Brunelle
**Sortie** : `properties.json` (1 objet par propriété active)

Étapes :
1. Connexion à DriveHQ (WebDAV ou FTP — à confirmer selon la méthode
   actuellement utilisée pour fredetmax).
2. Téléchargement de `VPOURDESIGN{YYYYMMDD}.zip` du jour.
3. Décompression.
4. Lecture des 16 `.TXT` avec encodage **Windows-1252** (sinon
   `Frédéric` devient `Fr�d�ric`).
5. Parsing CSV (attention : valeurs avec virgules internes entre
   guillemets — ex. « Luminaires, fixtures, échangeur d'air »).
6. Filtrage de `INSCRIPTIONS.TXT` par `NO_MEMBRE` de Brunelle
   (colonnes 3 et 5).
7. Pour chaque propriété retenue, jointure avec :
   - toutes ses lignes de `PHOTOS.TXT` (triées par `SEQUENCE`)
   - texte `ADDENDA.TXT` FR + EN (concat par `SEQUENCE`)
   - texte `REMARQUES.TXT` FR + EN
   - caractéristiques codées de `CARACTERISTIQUES.TXT`
   - pièces de `PIECES_UNITES.TXT`
   - liens vidéo de `LIENS_ADDITIONNELS.TXT`
8. Normalisation : 1 objet JSON par propriété avec schéma clair
   (voir §7).
9. Détection des **propriétés retirées** : comparer avec le snapshot
   précédent → marquer `status: "sold"` ou supprimer.
10. Écriture du JSON de sortie.

### 6.2  Planification
- Cron (`node-cron` ou GitHub Actions `schedule:`) → tous les jours
  vers 06:00 Montréal.
- Logger les erreurs (zip manquant, nouveau schéma Centris, etc.).

### 6.3  Front (site Alain Brunelle)
- Lecture du `properties.json`.
- Page liste + page détail (comme fredetmax.com/nosproprietes).
- Gabarit design à cloner depuis fredetmax / jacquesroussel.

---

## 7. Schéma JSON normalisé proposé

```json
{
  "mls": "9030072",
  "broker": {
    "memberNo": "XXXXX",
    "name": "Alain Brunelle",
    "isCollaborator": false
  },
  "price": 319000,
  "propertyType": "AP",
  "status": "active",
  "listingDate": "2025-09-09",
  "address": {
    "civic": "402",
    "street": "Rue du Bocage",
    "city": "Ville",
    "postalCode": "J7M2K2"
  },
  "rooms": { "bedrooms": 2, "bathrooms": 1, "powderRooms": 0 },
  "yearBuilt": 2008,
  "livingArea": { "value": 823.40, "unit": "PC" },
  "taxes": { "municipal": 1234, "school": 210 },
  "descriptionFr": "…",
  "descriptionEn": "…",
  "remarksFr": "…",
  "remarksEn": "…",
  "features": [ { "code": "ALLE", "value": "ASPH" }, ... ],
  "rooms_detail": [ { "name": "Cuisine", "level": "RC", "dim": "12x10" }, ... ],
  "photos": [
    { "seq": 1, "type": "FACA", "url": "https://mediaserver.centris.ca/..." },
    ...
  ],
  "video": "https://youtu.be/..."
}
```

---

## 8. Points d'attention

1. **Encodage** : toujours lire en `cp1252` / `latin1`, jamais UTF-8.
2. **CSV mal formé possible** : certaines lignes d'`INSCRIPTIONS` et
   d'`ADDENDA` contiennent des retours à la ligne à l'intérieur d'un
   champ quoté. Utiliser un parser CSV sérieux (`papaparse`,
   `csv-parse` en Node) plutôt que `split(',')`.
3. **Photos hébergées par Centris** : les URLs
   `mediaserver.centris.ca` sont publiques et peuvent être affichées
   directement (pas besoin de rehoster).
4. **Relation courtier ↔ propriété** : une propriété peut avoir
   deux courtiers (colonnes 3 et 5). Décider si le site d'Alain
   affiche aussi ses co-inscriptions.
5. **Suppressions** : Centris n'envoie PAS de flag "supprimé". Si
   une propriété disparaît du zip d'aujourd'hui par rapport à hier,
   c'est qu'elle est vendue ou retirée → à gérer dans le diff.
6. **Fichier à jour** : le zip du 23 avril 2026 contient 59
   propriétés pour l'ensemble de ton portefeuille courtier.

---

## 9. Prochaines étapes quand tu lanceras Claude Code

1. Récupérer les credentials DriveHQ (protocole : WebDAV ou FTP ?).
2. Attendre / demander à Centris d'ajouter Alain Brunelle au flux
   `VPOURDESIGN*.zip`.
3. Noter son `NO_MEMBRE` dès qu'il apparaît.
4. Lancer Claude Code avec ce document + le zip exemple comme
   référence → il pourra bâtir :
   - le module d'ingestion (§6.1),
   - le cron quotidien (§6.2),
   - le site Alain Brunelle (§6.3).
5. Héberger (Vercel / Netlify / Wix).

---

*Fichier exemple utilisé pour cette analyse :*
`VPOURDESIGN20260423.zip` — 59 propriétés, 1918 photos, 8 courtiers,
2 bureaux RE/MAX CRYSTAL.
