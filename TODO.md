# TODO — Site Alain Brunelle

## 🔵 « Le mot d'Alain » sur chaque fiche propriété (P2)

Système semi-automatique pour ajouter une note personnelle d'Alain sur chaque fiche, sans qu'Alain ait à rédiger lui-même.

### Pourquoi
- Boost GEO majeur (AI Overviews favorisent les contenus avec **perspective personnelle unique**)
- 100-200 mots d'unique par fiche → Google choisit notre version plutôt que celle de remax-quebec.com / centris.ca
- Renforce le E-E-A-T (auteur identifié, qualifié, OACIQ)

### Architecture à implémenter

1. **`lib/notes-alain.json`** — versionné dans Git, source de vérité
   ```json
   {
     "10311321": {
       "headline": "Cottage des années 80 dans un secteur recherché.",
       "text": "2-4 phrases avec angle Alain (positionnement de prix, particularité, comparable, recommandation).",
       "lastUpdated": "2026-05-17"
     }
   }
   ```

2. **Détection auto des nouvelles propriétés** dans `build.mjs`
   - Compare la liste MLS actuelle vs `properties.json` précédent
   - Génère `data/pending-notes.json` avec les nouveautés
   - Message de commit cron : *"daily refresh 2026-05-17 (2 new, 1 sold)"*

3. **GitHub Action — Issue auto** (Option C choisie)
   - À chaque cron, si `pending-notes.json` non vide → crée une issue GitHub
   - Titre : *"🆕 2 nouvelles propriétés — notes à rédiger"*
   - Checklist par MLS avec lien direct pour éditer `notes-alain.json`
   - Vincent travaille en lots (matin café, 30 min couvre 2-3 nouveautés)

4. **Affichage gracieux sur la fiche**
   - Bloc visuel : carte bleu pâle arrondie, signature filigrane d'Alain, citation typographiée
   - Si pas de note → bloc absent (pas de placeholder)
   - Position : juste après la description Centris

### Workflow Vincent
1. Cron tourne à 8h → issue GitHub apparaît
2. Vincent ouvre l'issue, lit la description Centris
3. Si doute → texto à Alain (30 sec)
4. Edit `notes-alain.json` directement sur GitHub Web UI
5. Commit → Vercel rebuild → note live en 30 sec
6. Coche la checkbox dans l'issue

### Variante future — auto-suggestion IA (P3)
Script qui appelle l'API Claude avec :
- Description Centris
- Stats du secteur (déjà calculées)
- Comparables récents

→ Génère une **proposition de note** dans `pending-notes.json` que Vincent valide ou ajuste. Passe de 2 min/note à 30 sec/note.

### Effort estimé
30 min pour l'implémentation initiale.

---

## Autres TODO en attente

- [ ] **Google Business Profile** d'Alain Brunelle — créer/réclamer (Vincent, 1 h)
- [ ] **Stats rue par rue** dans `build.mjs` — calcul + injection dans fiches/quartiers
- [ ] **Articles Radioscopie** : Blainville, Rosemère, Lorraine (gabarit Sainte-Thérèse)
- [ ] **JSON-LD `FAQPage`** sur toutes les pages avec FAQ
- [ ] **Schema `Person` auteur** sur articles blog + fiches
- [ ] **Hébergement vidéos** (gitignorées) : YouTube unlisted / Cloudflare R2 / Vercel Blob
- [ ] **Formspree branchement** pour le formulaire évaluation gratuite
- [ ] **Status `sold`** sur propriétés vendues (garder la page, badge "Vendue")
