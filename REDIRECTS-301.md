# Redirections 301 — Ancien site alainbrunelle.com → Nouveau site

> But : préserver le SEO en redirigeant les anciennes URLs (template Centiva / RE/MAX)
> vers les pages équivalentes du nouveau site. **Propriétés individuelles exclues** (gérées séparément).
> Même domaine (`alainbrunelle.com`) → redirections par *path*.

## 1. Pages structurelles (mapping 1:1)

| Ancienne URL | Nouvelle URL |
|---|---|
| `/` | `/` |
| `/fr/` | `/` |
| `/fr/temoignages.html` | `/temoignages/` |
| `/fr/achat-vente.html` | `/acheter/` |
| `/fr/outils.html` | `/acheter/calculatrices/` |
| `/fr/outils/calculatrice-hypothecaire.html` | `/acheter/calculatrices/` |
| `/fr/politique-confidentialite.html` | `/politique-confidentialite/` |
| `/fr/conditions-d-utilisation.html` | `/conditions-utilisation/` |
| `/fr/mes-proprietes.html` | `/nos-proprietes/` |

## 2. Blogue (601 articles, pas de mapping 1:1 → catch-all vers l'index)

L'ancien blogue compte 601 articles avec IDs numériques. Le nouveau blogue a des
articles différents. On redirige **tout** vers le nouvel index de blogue.

| Ancien pattern | Nouvelle URL |
|---|---|
| `/fr/articles` | `/blog/` |
| `/fr/articles/a-decouvrir` | `/blog/` |
| `/fr/articles/achat-vente` | `/blog/` |
| `/fr/articles/actualites` | `/blog/` |
| `/fr/articles/design` | `/blog/` |
| `/fr/articles/finances` | `/blog/` |
| `/fr/articles/immobilier` | `/blog/` |
| `/fr/articles/renovation` | `/blog/` |
| `/fr/articles/style-de-vie` | `/blog/` |
| `/fr/articles/:id/:slug` (601 articles) | `/blog/` |

## 3. Version anglaise (le nouveau site a maintenant une version EN sous `/en/`)

Le nouveau site est bilingue : français à la racine, anglais sous `/en/`. On mappe
donc les anciennes URLs `/en/*` vers leur équivalent `/en/` (et non vers la racine).

| Ancienne URL | Nouvelle URL |
|---|---|
| `/en` | `/en/` |
| `/en/temoignages.html` | `/en/temoignages/` |
| `/en/achat-vente.html` | `/en/acheter/` |
| `/en/outils.html` | `/en/acheter/calculatrices/` |
| `/en/outils/calculatrice-hypothecaire.html` | `/en/acheter/calculatrices/` |
| `/en/politique-confidentialite.html` | `/en/politique-confidentialite/` |
| `/en/conditions-d-utilisation.html` | `/en/conditions-utilisation/` |
| `/en/mes-proprietes.html` | `/en/nos-proprietes/` |
| `/en/articles` | `/en/blog/` |
| `/en/articles/:path*` (blogue) | `/en/blog/` |

## 4. Propriétés — EXCLUES de ce fichier

Les URLs `/fr/nos-proprietes/...` ne sont **pas** traitées ici (à mapper à part
vers `/nos-proprietes/{id}-{adresse}/` selon les fiches actives).

---

## Bloc prêt à coller (vercel.json → `"redirects"`)

```json
[
  { "source": "/fr", "destination": "/", "permanent": true },
  { "source": "/fr/temoignages.html", "destination": "/temoignages/", "permanent": true },
  { "source": "/fr/achat-vente.html", "destination": "/acheter/", "permanent": true },
  { "source": "/fr/outils.html", "destination": "/acheter/calculatrices/", "permanent": true },
  { "source": "/fr/outils/calculatrice-hypothecaire.html", "destination": "/acheter/calculatrices/", "permanent": true },
  { "source": "/fr/politique-confidentialite.html", "destination": "/politique-confidentialite/", "permanent": true },
  { "source": "/fr/conditions-d-utilisation.html", "destination": "/conditions-utilisation/", "permanent": true },
  { "source": "/fr/mes-proprietes.html", "destination": "/nos-proprietes/", "permanent": true },
  { "source": "/fr/articles", "destination": "/blog/", "permanent": true },
  { "source": "/fr/articles/:path*", "destination": "/blog/", "permanent": true },

  { "source": "/en", "destination": "/en/", "permanent": true },
  { "source": "/en/temoignages.html", "destination": "/en/temoignages/", "permanent": true },
  { "source": "/en/achat-vente.html", "destination": "/en/acheter/", "permanent": true },
  { "source": "/en/outils.html", "destination": "/en/acheter/calculatrices/", "permanent": true },
  { "source": "/en/outils/calculatrice-hypothecaire.html", "destination": "/en/acheter/calculatrices/", "permanent": true },
  { "source": "/en/politique-confidentialite.html", "destination": "/en/politique-confidentialite/", "permanent": true },
  { "source": "/en/conditions-d-utilisation.html", "destination": "/en/conditions-utilisation/", "permanent": true },
  { "source": "/en/mes-proprietes.html", "destination": "/en/nos-proprietes/", "permanent": true },
  { "source": "/en/articles", "destination": "/en/blog/", "permanent": true },
  { "source": "/en/articles/:path*", "destination": "/en/blog/", "permanent": true }
]
```

> Note : `permanent: true` = 301. L'ordre compte — les routes spécifiques
> (`/fr/articles`) avant les catch-all (`/fr/articles/:path*`).
> Le `vercel.json` actuel contient déjà une redirection `/contact → /rendez-vous/`
> (à conserver lors de la fusion).
