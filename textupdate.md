# textupdate.md — Brief de réécriture du site Brunelle

À coller à Claude Code pour qu'il applique les changements. Ce document remplace le copy actuel par une version humaine, analytique et SEO-optimisée pour les 4 villes du territoire.

---

## 1. RÈGLES GLOBALES (à appliquer partout)

### 1.1 Identité du courtier — chiffres officiels
- **Date de début de carrière** : 1992
- **Années d'expérience** : 33 ans (et pas 29)
- **Transactions totales** : 3 000+
- **Top 5 % RE/MAX Québec** : 20 années consécutives
- **Ratio prix vendu / demandé** : 99,2 %
- **Délai médian de vente** : 28 jours (vs 52 j marché)

### 1.2 Mot-clé SEO obligatoire
Le terme **« courtier immobilier »** doit apparaître dans :
- Tous les `<title>` (déjà OK)
- Tous les `<h1>` des pages-villes et page d'accueil
- Au moins une fois dans le premier paragraphe de chaque page
- Toutes les balises `alt` de la photo principale d'Alain

### 1.3 SEO local — les 4 villes
Chaque page-ville doit avoir un **copy distinct** (pas du copier/coller avec juste le nom changé). Les 4 villes :
- **Sainte-Thérèse** (chef-lieu historique, transit train, vieux village)
- **Blainville** (familles, quartiers planifiés, golf, Fontainebleau-Chambéry)
- **Rosemère** (haut de gamme, Grande-Côte, secteur boisé, riveraineté)
- **Lorraine** (urbanisme à thème, ville-jardin, marché niché)

### 1.4 Ton à respecter
- **Humain + analytique** : phrases courtes, ton direct, mais toujours appuyées sur des chiffres
- **Leader local** : on est le référent, pas un challenger
- **33 ans d'expérience** : à mentionner sans être lourd, comme une autorité tranquille
- **Bannir** : « sans engagement », « gratuit pour vous », « parlez à un expert » (formulations corporate fades)
- **Bannir** : superlatifs invérifiables (« le meilleur », « le numéro 1 », « unique »)
- **Bannir** : phrases boilerplate AI (« la combinaison d'un tissu familial stable... »)

### 1.5 Éléments à supprimer ou nuancer (sonnent inventés)
- **« 12 000 / 12 400 contacts qualifiés Rive-Nord »** — à remplacer par « base d'acheteurs actifs sur la Rive-Nord » sans chiffre, OU par un chiffre que Vincent confirme
- **« Membre actif de la Chambre de commerce Thérèse-De Blainville depuis 2008 »** — à confirmer ou retirer
- **« cycliste invétéré et amateur d'architecture »** — à confirmer ou retirer
- **« 5 cycles complets de marché »** — à reformuler pour être plus crédible
- **« 47 mots-clés Top 10, ×8,2 trafic vs M0 »** (page Performance) — données internes qui ne devraient pas être publiques

---

## 2. CHANGEMENTS GLOBAUX (find / replace sitewide)

À exécuter sur **tous les fichiers HTML du site** :

| Trouver | Remplacer par |
|---|---|
| `29 ans` | `33 ans` |
| `29 années` | `33 années` |
| `Plus de 29 ans` | `33 ans` |
| `depuis 1997` | `depuis 1992` |
| `12 000 contacts qualifiés` | `un réseau d'acheteurs actifs sur la Rive-Nord` |
| `12 400 contacts qualifiés` | `un réseau d'acheteurs actifs sur la Rive-Nord` |
| `12 400 contacts` | `réseau d'acheteurs actifs Rive-Nord` |
| `Pré-mise en marché à 12 400 contacts qualifiés Rive-Nord` | `Pré-diffusion à mon réseau d'acheteurs actifs avant publication Centris` |
| `le meilleur courtier immobilier de la Rive-Nord` | `un courtier immobilier qui connaît la Rive-Nord rue par rue` |
| `Parler à Alain` | `Discuter de votre projet` |
| `Parlons de votre projet immobilier.` | `Vendre, acheter, investir — discutons-en.` |
| `Choisissez un créneau directement dans son agenda` | `Réservez 20 minutes — sans pression, sans engagement` |

---

## 3. PAGES STRATÉGIQUES — refonte ciblée

### 3.1 `/` — Homepage (`site/index.html`)

#### Hero (lignes 30-52)

**REMPLACER** le bloc actuel par :

```html
<section class="hero container">
  <div class="hero-grid">
    <div class="hero-photo reveal">
      <span class="p-tag">Alain Brunelle · Courtier immobilier · RE/MAX CRYSTAL</span>
      <img src="/photos/P21_5407-Edit.jpg" alt="Alain Brunelle, courtier immobilier à Sainte-Thérèse, Blainville, Rosemère et Lorraine" fetchpriority="high">
      <p class="p-caption">3 000+ transactions accompagnées sur la Rive-Nord depuis 1992.</p>
    </div>
    <div class="hero-card reveal">
      <div class="eyebrow">Courtier immobilier · Rive-Nord</div>
      <h1>Vendre ou acheter à <em>Sainte-Thérèse</em>, <em>Blainville</em>, <em>Rosemère</em> ou <em>Lorraine</em> — avec un courtier qui décide par les chiffres.</h1>
      <p class="cities">33 ans de transactions locales · Lecture du marché rue par rue.</p>
    </div>
    <a class="hero-cta reveal" href="/rendez-vous/">
      <div><strong>Réservez 20 minutes avec Alain Brunelle</strong><small>Appel découverte — sans engagement, sans pression</small></div>
      <span class="arrow">→</span>
    </a>
  </div>
  <div class="hero-lead">
    <h2>Le courtier immobilier de la Rive-Nord qui appuie chaque décision sur la donnée locale.</h2>
    <div class="lead-meta">Sources : Centris® · APCIQ · Transactions internes 1992-2026</div>
  </div>
</section>
```

#### Section stats (lignes 54-63)

**REMPLACER** par :

```html
<section class="section-dark">
  <div class="container">
    <div class="sec-head reveal"><div><div class="eye">En chiffres · 2026</div><h2>33 ans à mesurer le marché — les chiffres qui le prouvent.</h2></div></div>
    <div class="stats-grid reveal">
      <div class="stat"><div class="n">3 000+</div><div class="l">Transactions conclues depuis 1992</div></div>
      <div class="stat"><div class="n">28 j</div><div class="l">Délai médian sur mes inscriptions (vs 52 j marché)</div></div>
      <div class="stat"><div class="n">Top 5 %</div><div class="l">RE/MAX Québec · 20 années consécutives</div></div>
    </div>
  </div>
</section>
```

#### Section about (lignes 153-166)

**REMPLACER** le H2 et le paragraphe par :

```html
<h2 style="max-width:24ch">Le courtier immobilier de la Rive-Nord qui décide avec des chiffres, pas des intuitions.</h2>
<p style="margin-top:1.5rem;color:var(--ink-2);font-size:1.05rem;line-height:1.7;max-width:58ch">Depuis 1992, j'accompagne les familles, les premiers acheteurs et les investisseurs de Sainte-Thérèse, Blainville, Rosemère et Lorraine à travers la décision financière la plus importante de leur vie. Pas de promesses gonflées. Une lecture rigoureuse du marché local : historique de vente par rue, saisonnalité, positionnement de prix, taux d'absorption du quartier. Le résultat : des ventes au juste prix, sans drame, sans surprise.</p>
```

#### Témoignage (lignes 189-196)

Le copy est correct, mais **vérifier la véracité** (« Marie & Philippe · Fontainebleau, Blainville · 2025 ») avec Alain avant publication.

#### CTA finale (lignes 199-204)

**REMPLACER** par :

```html
<section class="container">
  <div class="cta-band reveal">
    <h2>Combien vaut votre propriété en 2026 ?</h2>
    <p style="color:rgba(255,255,255,.8);margin-top:.5rem;margin-bottom:1.5rem">Rapport personnalisé livré sous 48 h. Données comparables de votre rue, fondées sur mes transactions et les chiffres APCIQ.</p>
    <a class="btn" href="/vendre/evaluation-gratuite/">Obtenir mon évaluation</a>
  </div>
</section>
```

---

### 3.2 `/a-propos/` — À propos (`site/a-propos/index.html`)

#### Page-head (ligne 31)

**REMPLACER** par :

```html
<section class="page-head container"><div class="eyebrow">À propos · Courtier immobilier depuis 1992</div><h1>Alain Brunelle, courtier immobilier de la Rive-Nord depuis 33 ans.</h1><p class="lead">3 000+ transactions · Top 5 % RE/MAX Québec depuis 20 ans · Sainte-Thérèse, Blainville, Rosemère, Lorraine.</p></section>
```

#### Bloc texte principal (lignes 34-39)

**REMPLACER** par :

```html
<p style="font-size:1.15rem;color:var(--ink);line-height:1.65;font-weight:500">Depuis 1992, j'accompagne les familles, les premiers acheteurs et les investisseurs de Sainte-Thérèse, Blainville, Rosemère et Lorraine à travers la décision financière la plus importante de leur vie.</p>
<p style="color:var(--ink-2);line-height:1.75;margin-top:1.2rem">33 ans sur le terrain m'ont appris une chose simple : <strong>chaque propriété a un prix juste</strong>, et chaque client mérite une stratégie qui repose sur des chiffres, pas sur une formule toute faite. Pas de promesses gonflées, pas de pression. La méthode, les données, et 33 ans à voir le marché de la Rive-Nord bouger rue par rue.</p>
<p style="color:var(--ink-2);line-height:1.75;margin-top:1rem">Mon territoire principal : Sainte-Thérèse, Blainville, Rosemère et Lorraine. Mon réseau d'acheteurs actifs couvre l'ensemble de la Rive-Nord. Mon rôle, comme courtier immobilier RE/MAX CRYSTAL, c'est d'être le point de pivot entre vos objectifs et la réalité du marché — avec transparence totale à chaque étape.</p>
```

#### Stats (lignes 42-50) — bon, juste corriger le H2

**REMPLACER** :
```
<h2>Le portrait, en données.</h2>
```
**par** :
```
<h2>Ce que 33 ans à courtier sur la Rive-Nord donnent comme chiffres.</h2>
```

#### Section « Mon parcours » (ligne 64)

**REMPLACER** par :

```html
<h2>Mon parcours</h2>
<p>Formation en administration, certifications continues OACIQ, et 33 ans de pratique active à courtier dans le même secteur. J'ai vu le marché de la Rive-Nord à travers les hausses, les corrections, la flambée COVID et le rééquilibrage récent. Chaque cycle a renforcé la même leçon : <em>la connaissance fine du marché local bat les généralités à tous les coups</em>.</p>
```

#### Section « Hors du bureau » (ligne 69-70)

**À CONFIRMER AVEC ALAIN** avant publication. Si véridique, garder. Sinon, **REMPLACER** par :

```html
<h2>Hors du bureau</h2>
<p>Père, conjoint, ancré dans la communauté de la Rive-Nord depuis plus de 30 ans. Quand je ne suis pas en visite ou en évaluation, je suis quelque part entre Sainte-Thérèse et les Laurentides.</p>
```

---

### 3.3 `/courtier-immobilier/sainte-therese/`

**Problème majeur** : le copy de cette page est presque identique à celui de Blainville, Rosemère et Lorraine (boilerplate AI). À réécrire complètement avec contenu local distinct.

#### Page-head (lignes 31-35)

**REMPLACER** par :

```html
<section class="page-head container">
  <div class="eyebrow">Courtier immobilier · Sainte-Thérèse</div>
  <h1>Courtier immobilier à Sainte-Thérèse — Alain Brunelle, 33 ans d'expérience locale.</h1>
  <p class="lead">Vendre ou acheter à Sainte-Thérèse demande une lecture précise du marché : Vieux-Village, En-Haut, En-Bas — trois marchés distincts, trois stratégies. Voici comment je travaille.</p>
</section>
```

#### Section « Le marché immobilier à Sainte-Thérèse » (lignes 76-78)

**REMPLACER** par :

```html
<h2>Le marché immobilier à Sainte-Thérèse en 2026</h2>
<p>Sainte-Thérèse n'est pas <em>une</em> ville, c'est <strong>trois marchés distincts</strong>. Le Vieux-Village joue la rareté foncière et le cachet patrimonial (prix médian ~624 k$, délai 24 j). Le secteur En-Haut attire les familles installées (575 k$, 32 j). Et l'En-Bas reste la porte d'entrée des primo-accédants (498 k$, 38 j). Trois lectures, trois stratégies de mise en marché.</p>
<p>Mon rôle de <strong>courtier immobilier à Sainte-Thérèse</strong> : positionner votre propriété par rapport à son <em>vrai</em> secteur — pas la moyenne de la ville, qui dilue les écarts et coûte cher. Données APCIQ et Centris à l'appui, croisées avec ma base de transactions locales depuis 1992.</p>
```

#### Section « Pourquoi choisir » (lignes 79-85)

**REMPLACER** par :

```html
<h2>Pourquoi choisir Alain Brunelle comme courtier immobilier à Sainte-Thérèse</h2>
<ul>
  <li><strong>33 ans à courtier exclusivement sur la Rive-Nord</strong> — je connais les rues, les écoles, les voisins, les écarts de prix entre deux côtés de la même artère</li>
  <li><strong>Mise en marché complète incluse</strong> : photographie HDR 4K, vidéo drone, plan d'étage 2D, visite virtuelle 360°, fiche Centris optimisée</li>
  <li><strong>Pré-diffusion à mon réseau d'acheteurs actifs</strong> avant publication Centris (en moyenne 3-5 visites privées dès le départ)</li>
  <li><strong>Équipe RE/MAX CRYSTAL complète</strong> : courtiers, photographes, stagers, notaires partenaires</li>
</ul>
```

#### Section « Types de propriétés » (lignes 86-87)

**REMPLACER** par :

```html
<h2>Types de propriétés les plus actifs à Sainte-Thérèse</h2>
<p>Le condo neuf et la maison de ville dominent dans le Vieux-Village (acheteurs 35-50 ans, professionnels travaillant à Laval ou Montréal). Le cottage unifamilial 1990-2010 mène En-Haut. Le bungalow rénové reste la valeur sûre En-Bas. Voir <a href="/types-de-propriete/">toutes les catégories</a>.</p>
```

#### FAQ (lignes 88-92)

**GARDER** la FAQ actuelle (les chiffres sont corrects).

#### CTA finale (ligne 103)

**REMPLACER** par :

```html
<section class="container"><div class="cta-band"><h2>Vendre ou acheter à Sainte-Thérèse — parlons-en.</h2><a class="btn" href="/rendez-vous/">Réserver 20 minutes</a></div></section>
```

---

### 3.4 `/courtier-immobilier/blainville/`

#### Page-head (lignes 31-35)

**REMPLACER** par :

```html
<section class="page-head container">
  <div class="eyebrow">Courtier immobilier · Blainville</div>
  <h1>Courtier immobilier à Blainville — Alain Brunelle, RE/MAX CRYSTAL.</h1>
  <p class="lead">Blainville, c'est neuf quartiers à personnalité forte : de Fontainebleau à Chante-Bois, en passant par Chambéry et Plan-Bouchard. 33 ans à vendre et acheter rue par rue dans cette ville.</p>
</section>
```

#### Section « Le marché immobilier à Blainville » (lignes 88-90)

**REMPLACER** par :

```html
<h2>Le marché immobilier à Blainville en 2026</h2>
<p>Blainville en 2026 est en phase de <strong>rééquilibrage</strong>. L'inventaire d'unifamiliales a bondi de 29 %, ramenant du pouvoir de négociation aux acheteurs. Le prix médian unifamilial recule modestement (-4 %, à 715 k$), tandis que le condo (+3 %) et le plex (+10 %) restent fermement haussiers. Lire un marché comme celui-là demande de la précision — pas une moyenne globale, mais une lecture par quartier et par typologie.</p>
<p>Comme <strong>courtier immobilier à Blainville</strong> depuis 33 ans, je positionne chaque inscription en croisant les transactions des 12 derniers mois à moins de 500 m, l'inventaire actif comparable, et les tendances saisonnières du quartier visé. Données APCIQ et Centris à jour, méthode rigoureuse.</p>
```

#### Section « Pourquoi choisir » (lignes 91-97)

**REMPLACER** par :

```html
<h2>Pourquoi choisir Alain Brunelle comme courtier immobilier à Blainville</h2>
<ul>
  <li><strong>Connaissance fine des 9 quartiers</strong> : Fontainebleau, Chambéry, Chante-Bois, Plan-Bouchard, Jardins-de-Blainville, Côte-Saint-Louis, Alençon, Renaissance, Blainvillier</li>
  <li><strong>33 ans d'inscriptions et de transactions actives à Blainville</strong> — je sais ce qui se vend, à quel prix, en combien de temps, et pourquoi</li>
  <li><strong>Mise en marché complète incluse</strong> : photo HDR 4K, vidéo drone, plan d'étage 2D, visite virtuelle 360°</li>
  <li><strong>Équipe RE/MAX CRYSTAL</strong> — réseau de courtiers, stagers, photographes et notaires partenaires</li>
</ul>
```

#### Section « Types de propriétés » (lignes 98-99)

**REMPLACER** par :

```html
<h2>Types de propriétés les plus actifs à Blainville</h2>
<p>L'unifamiliale en cottage (typologie 1990-2010) reste le moteur de Blainville, particulièrement dans Fontainebleau et Chambéry. Le condo neuf gagne du terrain près du REM et des secteurs commerciaux. Le plex pour investissement locatif est en croissance rapide (+10 % en 12 mois). Voir <a href="/types-de-propriete/">toutes les catégories</a>.</p>
```

#### FAQ (lignes 100-104)

**REMPLACER** le prix médian par celui de Blainville :

```html
<h3>Quel est le prix moyen d'une maison à Blainville en 2026 ?</h3>
<p>Prix médian unifamilial Q1 2026 : <strong>715 000 $</strong>. La fourchette s'étend de ~580 000 $ (Côte-Saint-Louis, Alençon) à ~1,2 M$ (Fontainebleau secteur boisé, Chambéry haut de gamme).</p>
```

#### CTA finale (ligne 115)

**REMPLACER** par :

```html
<section class="container"><div class="cta-band"><h2>Vendre ou acheter à Blainville — parlons-en.</h2><a class="btn" href="/rendez-vous/">Réserver 20 minutes</a></div></section>
```

---

### 3.5 `/courtier-immobilier/rosemere/`

#### Page-head (lignes 31-35)

**REMPLACER** par :

```html
<section class="page-head container">
  <div class="eyebrow">Courtier immobilier · Rosemère</div>
  <h1>Courtier immobilier à Rosemère — Alain Brunelle, RE/MAX CRYSTAL.</h1>
  <p class="lead">Rosemère est l'un des marchés les plus haut de gamme de la Rive-Nord : Grande-Côte, Bois-Franc, Domaine-du-Parc. Demande constante, inventaire serré, exigences acheteurs élevées. 33 ans à lire ce marché spécifique.</p>
</section>
```

#### Section « Le marché immobilier à Rosemère » (lignes 60-62)

**REMPLACER** par :

```html
<h2>Le marché immobilier à Rosemère en 2026</h2>
<p>Rosemère se distingue du reste de la Rive-Nord par son <strong>profil acheteur exigeant</strong> : familles établies, professionnels, retraités haut de gamme. La rareté foncière sur la Grande-Côte et dans Bois-Franc maintient les prix médians au-dessus de 685 k$, avec des pointes au-delà de 1,5 M$ pour les propriétés riveraines de la rivière des Mille-Îles.</p>
<p>Comme <strong>courtier immobilier à Rosemère</strong> depuis 33 ans, je connais les particularités de ce marché : ce qui se vend rapidement (terrains de 15 000 PC+, propriétés rénovées clé en main, condos haut de gamme), et ce qui demande plus de patience (propriétés à rafraîchir, prix au-dessus de 1,3 M$).</p>
```

#### Section « Pourquoi choisir » (lignes 63-69)

**REMPLACER** par :

```html
<h2>Pourquoi choisir Alain Brunelle comme courtier immobilier à Rosemère</h2>
<ul>
  <li><strong>Spécialisation sur le segment haut de gamme</strong> de la Rive-Nord (Grande-Côte, riverains, propriétés &gt;1 M$)</li>
  <li><strong>33 ans à courtier dans le secteur</strong> — je connais l'historique de vente des principales propriétés et le profil typique des acheteurs Rosemère</li>
  <li><strong>Mise en marché haut de gamme</strong> : photo HDR 4K, vidéo drone, visite virtuelle 360°, brochure imprimée sur place</li>
  <li><strong>Discrétion totale</strong> : option de pré-diffusion privée avant Centris pour les propriétés sensibles à la confidentialité</li>
</ul>
```

#### Section « Types de propriétés » (lignes 70-71)

**REMPLACER** par :

```html
<h2>Types de propriétés les plus actifs à Rosemère</h2>
<p>L'unifamiliale sur grand terrain (15 000 PC+) reste le cœur du marché Rosemère, particulièrement dans Bois-Franc et Domaine-du-Parc. Les propriétés riveraines sur la Grande-Côte forment un segment distinct (1,2-2 M$). Le condo haut de gamme près de l'autoroute 640 est en croissance. Voir <a href="/types-de-propriete/">toutes les catégories</a>.</p>
```

#### FAQ (lignes 72-76)

**REMPLACER** par :

```html
<h2>FAQ — vendre et acheter à Rosemère</h2>
<h3>Quel est le prix moyen d'une maison à Rosemère en 2026 ?</h3>
<p>Prix médian unifamilial : <strong>685 000 $</strong>. Fourchette typique : 600 000 $ (cottage standard) à 1,5 M$+ (riverain, Bois-Franc haut de gamme).</p>
<h3>Combien de temps prend la vente d'une propriété à Rosemère ?</h3>
<p>Délai médian sur mes inscriptions : 32 jours. Pour les propriétés au-dessus de 1,2 M$, prévoir 60-90 jours — le segment haut de gamme demande plus de patience et un acheteur très ciblé.</p>
```

#### CTA finale (ligne 87)

**REMPLACER** par :

```html
<section class="container"><div class="cta-band"><h2>Vendre ou acheter à Rosemère — parlons-en.</h2><a class="btn" href="/rendez-vous/">Réserver 20 minutes</a></div></section>
```

---

### 3.6 `/courtier-immobilier/lorraine/`

Mêmes problèmes que les autres pages-villes. **À RÉÉCRIRE COMPLÈTEMENT** avec contenu spécifique à Lorraine.

#### Page-head

```html
<section class="page-head container">
  <div class="eyebrow">Courtier immobilier · Lorraine</div>
  <h1>Courtier immobilier à Lorraine — Alain Brunelle, RE/MAX CRYSTAL.</h1>
  <p class="lead">Lorraine est unique sur la Rive-Nord : urbanisme à thème médiéval, ville-jardin, rues nommées d'après des cités françaises. Marché niché, acheteurs spécifiques. 33 ans à comprendre ce qui s'y vend.</p>
</section>
```

#### Marché et pourquoi

```html
<h2>Le marché immobilier à Lorraine en 2026</h2>
<p>Lorraine attire les acheteurs qui cherchent un cadre de vie distinct du quadrillage classique de banlieue : rues sinueuses, arbres matures, architecture cohérente. Le marché y est plus tranquille mais plus stable que dans les villes voisines — moins de pression vendeur, plus de fidélité acheteur.</p>
<p>Comme <strong>courtier immobilier à Lorraine</strong>, ma méthode tient compte de la spécificité du territoire : un cottage des années 1980 dans Lorraine se compare à un autre cottage des années 1980 dans Lorraine, pas à une construction récente de Blainville. C'est cette précision qui évite les positionnements de prix erratiques.</p>

<h2>Pourquoi choisir Alain Brunelle comme courtier immobilier à Lorraine</h2>
<ul>
  <li><strong>Lecture précise d'un marché niché</strong> — Lorraine ne se compare pas à Blainville malgré la proximité géographique</li>
  <li><strong>33 ans d'expérience sur la Rive-Nord</strong>, dont une connaissance approfondie de l'architecture et de l'urbanisme particulier de Lorraine</li>
  <li><strong>Mise en marché complète</strong> : photo HDR 4K, vidéo drone, plan d'étage 2D, visite virtuelle 360°</li>
  <li><strong>Équipe RE/MAX CRYSTAL</strong> et réseau d'acheteurs actifs sur la Rive-Nord</li>
</ul>

<h2>Types de propriétés les plus actifs à Lorraine</h2>
<p>L'unifamiliale 1980-2000 sur terrain paysager domine. Les bungalows rénovés attirent les retraités. Le marché des constructions récentes est limité par la rareté foncière. Voir <a href="/types-de-propriete/">toutes les catégories</a>.</p>
```

#### CTA finale

```html
<section class="container"><div class="cta-band"><h2>Vendre ou acheter à Lorraine — parlons-en.</h2><a class="btn" href="/rendez-vous/">Réserver 20 minutes</a></div></section>
```

---

### 3.7 `/vendre/evaluation-gratuite/`

#### Page-head (lignes 80-84)

**REMPLACER** par :

```html
<section class="page-head container">
  <div class="eyebrow">Évaluation gratuite · Sans engagement</div>
  <h1>Combien vaut votre propriété en 2026 ?</h1>
  <p class="lead">Cinq questions, 60 secondes. Rapport personnalisé livré par courriel sous 48 h — avec les ventes comparables récentes de votre rue, et la lecture de votre <strong>courtier immobilier</strong> de la Rive-Nord depuis 1992.</p>
</section>
```

#### Étape 6 (succès) — à confirmer dans le code mais ajouter cette mention

Le message de confirmation devrait inclure :
> Votre demande est reçue. Alain vous contacte personnellement sous 24 h ouvrables avec votre rapport. En attendant, vous pouvez réserver un appel découverte de 20 minutes : [Réserver un créneau]

---

### 3.8 `/vendre/etapes-pour-vendre/`

#### Page-head (ligne 31-38)

**MODIFIER** le `<p class="lead">` :

```html
<p class="lead">De la mise en marché à l'acte notarié — sept étapes, balisées par 33 ans de courtage immobilier sur la Rive-Nord. Voici la méthode et les délais réalistes.</p>
```

#### Stat-row (lignes 43-47)

**REMPLACER** le 3e stat par :

```html
<div class="stat-mini"><div class="n">3 000+</div><div class="l">transactions conclues depuis 1992</div></div>
```

#### Étape 4 (ligne 73-78)

**REMPLACER** par :

```html
<div class="step">
<div>
<h3>Diffusion Centris + pré-mise en marché</h3>
<p>72 h en avant-première à mon réseau d'acheteurs actifs sur la Rive-Nord, puis publication Centris. Cette pré-diffusion génère en moyenne 3-5 visites privées dès le départ.</p>
<p class="meta">Jour J</p>
</div>
</div>
```

#### CTA finale (lignes 128-133)

**REMPLACER** par :

```html
<section class="container">
  <div class="cta-band">
    <h2>Prêt à vendre ? Réservez 20 minutes pour en parler.</h2>
    <a class="btn" href="/rendez-vous/">Réserver un créneau</a>
  </div>
</section>
```

---

### 3.9 `/vendre/commission-courtier/`

#### Lead (ligne 41)

**MODIFIER** :

```html
<p>La commission, c'est le point le plus mal compris du métier de <strong>courtier immobilier</strong>. Le mythe : « le courtier prend 5 % juste pour mettre une pancarte ». La réalité : la commission paie un service complet — habituellement plus de <strong>50 heures de travail spécialisé</strong>, des outils marketing professionnels, et un réseau d'acheteurs actifs construit sur 33 ans.</p>
```

#### Liste « Ce qui est inclus » (lignes 77-88)

**REMPLACER** la ligne 83 par :

```html
<li>Pré-diffusion à mon réseau d'acheteurs actifs sur la Rive-Nord</li>
```

---

### 3.10 `/vendre/preparer-sa-maison/`

#### Page-head (ligne 31-38)

**MODIFIER** le lead :

```html
<p class="lead">1 500 $ investis rapportent en moyenne 25 000 $ sur le prix final. Voici la méthode que j'applique avec mes clients vendeurs depuis 33 ans.</p>
```

Reste du copy est solide, peu de changements requis.

---

### 3.11 `/vendre/vendre-sans-stress/`

#### Page-head (ligne 31-38)

**MODIFIER** le lead :

```html
<p class="lead">Un processus balisé par 33 ans de pratique. Des nouvelles aux 7 jours. Zéro surprise — ma promesse.</p>
```

#### Témoignage (ligne 73)

**À VÉRIFIER** avec Alain — le témoignage de « Marie-Claude · Vendu en 22 jours » doit être réel.

---

### 3.12 `/acheter/premier-acheteur/`

#### Page-head (lignes 31-38)

**REMPLACER** par :

```html
<section class="page-head container"><div class="page-head-grid">
  <div>
    <div class="eyebrow">Acheteur · Premier achat</div>
    <h1>Premier acheteur — Sainte-Thérèse, Blainville, Rosemère, Lorraine.</h1>
    <p class="lead">Acheter votre première propriété sur la Rive-Nord, sans jargon et sans surprise. Le guide que j'aurais aimé recevoir comme jeune acheteur — par votre <strong>courtier immobilier</strong> depuis 1992.</p>
  </div>
  <figure class="ph-hero"><img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&auto=format&fit=crop" alt="Premier acheteur Rive-Nord" loading="eager"></figure>
</div></section>
```

#### Section « Comment je vous accompagne » (lignes 83-91)

**REMPLACER** ligne 87 par :

```html
<li>Visites accompagnées : 33 ans à repérer les drapeaux rouges en quelques minutes</li>
```

---

### 3.13 `/acheter/etapes-pour-acheter/`

#### Page-head (ligne 31-38)

**MODIFIER** le lead :

```html
<p class="lead">De la préapprobation à la remise des clés — neuf étapes, délais réalistes, méthode appliquée depuis 33 ans par votre <strong>courtier immobilier</strong> de la Rive-Nord.</p>
```

---

### 3.14 `/acheter/financement-hypothecaire/`, `/acheter/inspection/`, `/acheter/calculatrices/`

**Lire et appliquer les mêmes principes** :
- Mentionner « courtier immobilier » au moins une fois dans le premier paragraphe
- Remplacer « 29 ans » par « 33 ans » partout
- Garder le contenu factuel (chiffres, programmes, etc.)

---

### 3.15 `/marche-immobilier/` (index)

#### Ligne 41 — Lead

**REMPLACER** par :

```html
<p class="lead">Trois lectures complémentaires : les chiffres par ville, le baromètre mensuel APCIQ et mon analyse de <strong>courtier immobilier</strong> ancrée sur 33 ans de transactions Rive-Nord.</p>
```

---

### 3.16 `/marche-immobilier/statistiques-blainville/` et `/marche-immobilier/statistiques-sainte-therese/`

Les données sont bonnes. **Ajouter** dans l'introduction de chacune :
> Analyse par Alain Brunelle, courtier immobilier RE/MAX CRYSTAL — 33 ans de transactions sur la Rive-Nord.

---

### 3.17 `/temoignages/`

#### Page-head (ligne 31)

**REMPLACER** par :

```html
<section class="page-head container"><div class="eyebrow">Témoignages clients</div><h1>33 ans à courtier, des milliers d'histoires.</h1><p class="lead">Quelques voix de clients qui ont vendu, acheté ou investi avec moi sur la Rive-Nord.</p></section>
```

#### Témoignages individuels (lignes 35-56)

**TOUS À VÉRIFIER** avec Alain. Si fictifs, **NE PAS PUBLIER**. Les témoignages inventés détruisent la crédibilité et exposent à des plaintes à l'OACIQ.

Si les noms ne peuvent être confirmés mais que l'expérience est vraie, utiliser : « Cliente · Vendeur Fontainebleau · 2025 » (anonymisé).

---

### 3.18 `/rendez-vous/`

#### Page-head (ligne 56-60)

**REMPLACER** par :

```html
<section class="page-head container">
  <div class="eyebrow">Rendez-vous · 20 minutes</div>
  <h1>Réservez 20 minutes avec Alain Brunelle.</h1>
  <p class="lead">Appel découverte sans pression. Choisissez un créneau directement dans mon agenda Google — mis à jour en temps réel. Confirmation et rappel automatiques par courriel.</p>
</section>
```

#### Aside « Ce qu'on couvre » (lignes 79-87)

**REMPLACER** par :

```html
<h3>Ce qu'on couvre en 20 minutes</h3>
<ul>
  <li>Votre projet (vendre, acheter, investir) et votre échéancier</li>
  <li>Le marché de votre quartier ou de celui qui vous intéresse</li>
  <li>La prochaine étape concrète — pas de blabla, pas de pression</li>
</ul>
<h3 style="margin-top:1.5rem">Préférez le téléphone ?</h3>
<p style="font-size:1.2rem;color:var(--blue);margin:.3rem 0 0"><a href="tel:4504305555" style="color:inherit">450.430.5555</a></p>
```

---

### 3.19 `/contact/`

#### Page-head (ligne 31)

**REMPLACER** par :

```html
<section class="page-head container"><div class="eyebrow">Contact</div><h1>Joindre Alain Brunelle, courtier immobilier RE/MAX CRYSTAL.</h1><p class="lead">Téléphone, courriel ou rendez-vous en ligne — je réponds personnellement en moins de 24 h ouvrables.</p></section>
```

---

### 3.20 `/performance/`

⚠️ **À RECONSIDÉRER** : cette page expose des données SEO internes (« Mots-clés Top 10 », « ×8,2 Trafic vs M0 ») qui peuvent dévaloriser le site aux yeux des visiteurs et signaler que le SEO est artificiellement gonflé.

**Recommandation** : soit la dépublier (404 ou redirection), soit la transformer en page interne (mot de passe), soit la réécrire pour qu'elle parle de **performance de vente** (délai médian, ratio prix vendu/demandé) plutôt que de SEO.

Si on la garde publique, **remplacer** par :

```html
<section class="page-head container"><div class="eyebrow">Performance · Transactions 2026</div><h1>Performance de vente — Alain Brunelle, courtier immobilier.</h1><p class="lead">Les chiffres réels de mes inscriptions vs la moyenne du marché Rive-Nord.</p></section>

<section class="container">
  <div class="blue-block">
    <div class="stats-grid">
      <div class="stat"><div class="n">28 j</div><div class="l">Délai médian de vente</div></div>
      <div class="stat"><div class="n">99,2 %</div><div class="l">Ratio prix vendu / demandé</div></div>
      <div class="stat"><div class="n">3 000+</div><div class="l">Transactions depuis 1992</div></div>
      <div class="stat"><div class="n">Top 5 %</div><div class="l">RE/MAX Québec · 20 ans</div></div>
    </div>
  </div>
</section>
```

---

### 3.21 `/blog/` (index)

#### Hero (lignes 86-101)

**REMPLACER** le H1 et lead :

```html
<div class="eyebrow">Le journal d'Alain Brunelle, courtier immobilier</div>
<h1>Comprendre le marché de la Rive-Nord — avant d'agir.</h1>
<p class="lead">Analyses rue par rue, outils interactifs et guides. Pour vendeurs, acheteurs et investisseurs de Sainte-Thérèse, Blainville, Rosemère et Lorraine.</p>
```

---

### 3.22 `/blog/radioscopie-sainte-therese-marche-2026/`

#### Lead (ligne 114)

**REMPLACER** par :

```html
<p class="a-lead">À Sainte-Thérèse, la différence entre vendre vite et vendre bien tient à <strong>trois chiffres que personne ne vous donne</strong> — sauf un <strong>courtier immobilier local</strong> qui a 33 ans de transactions dans le secteur. Ce guide interactif met ces chiffres sur la table, rue par rue, secteur par secteur, avec les outils pour les interroger.</p>
```

Le passage « **le meilleur courtier immobilier de la Rive-Nord** » est à supprimer (arrogant, invérifiable).

---

### 3.23 Pages quartiers (template — appliquer à tous : `/quartiers/*/*`)

Exemple : `/quartiers/blainville/fontainebleau/`

#### Page-head (lignes 31-35)

**REMPLACER** par (pattern réutilisable) :

```html
<section class="page-head container">
  <div class="eyebrow">Quartier · {VILLE}</div>
  <h1>Immobilier {QUARTIER}, {VILLE} — analyse de votre courtier immobilier local.</h1>
  <p class="lead">Portrait précis de {QUARTIER} : prix médians, typologies dominantes, écoles, services, propriétés actives. Mise à jour par Alain Brunelle, 33 ans à courtier sur la Rive-Nord.</p>
</section>
```

#### Section « Que vaut votre maison à {QUARTIER} » (lignes 57-58)

**REMPLACER** par :

```html
<h2>Que vaut votre maison à {QUARTIER} ?</h2>
<p>Les écarts de prix d'une rue à l'autre dans {QUARTIER} peuvent atteindre 15-20 % pour des propriétés visuellement similaires. C'est précisément le genre de nuance qu'une analyse comparative rigoureuse révèle — et qu'une moyenne municipale dilue. <a href="/vendre/evaluation-gratuite/">Demandez l'analyse précise de votre rue</a>.</p>
```

#### Important pour le SEO local

Chaque page-quartier devrait inclure **au moins un paragraphe distinctif** sur le quartier (parc emblématique, école réputée, type architectural, histoire, écart de prix avec le quartier voisin). Génériquement « tissu familial stable + bon transport » ne se distingue pas — Google déteste le duplicate content.

---

## 4. NAVIGATION & FOOTER (changements globaux)

### 4.1 Footer — Tag (présent sur toutes les pages)

**REMPLACER** :

```html
<p class="f-tag">Courtier immobilier — RE/MAX CRYSTAL<br>Sainte-Thérèse · Blainville · Rive-Nord</p>
```

**par** :

```html
<p class="f-tag">Courtier immobilier — RE/MAX CRYSTAL<br>Sainte-Thérèse · Blainville · Rosemère · Lorraine</p>
```

Raison : actuellement Rosemère et Lorraine ne sont jamais mentionnées dans le tag footer, ce qui affaiblit le SEO local sur ces deux villes.

### 4.2 Bouton CTA principal du header

**MODIFIER** sur toutes les pages :

```html
<a class="nav-cta" href="/rendez-vous/">Réserver 20 min</a>
```

(Plus précis et plus engageant que « Prendre rendez-vous »)

---

## 5. NOUVELLE SECTION HOMEPAGE — Qualification du lead (rappel du brief précédent)

Voir le brief séparé déjà fourni : section post-hero « Vous songez à vendre? » avec 3 questions de qualification menant aux 3 CTA (Awareness / Consideration / Decision). À insérer entre le hero et la section stats.

---

## 6. CHECKLIST DE VALIDATION POST-CHANGEMENTS

Avant de publier, vérifier que :

- [ ] Aucune occurrence de « 29 ans » dans le code source (`grep -r "29 ans" site/`)
- [ ] Aucune occurrence de « 12 000 contacts » ou « 12 400 contacts » (`grep -rE "12 [04]00 contacts" site/`)
- [ ] Aucune occurrence de « le meilleur courtier » (`grep -r "le meilleur courtier" site/`)
- [ ] Le terme « courtier immobilier » apparaît dans le H1 de chaque page-ville et de la homepage
- [ ] Les 4 villes (Sainte-Thérèse, Blainville, Rosemère, Lorraine) sont mentionnées sur la homepage
- [ ] Les 4 pages-villes ont du contenu **distinct** (pas du copier/coller)
- [ ] Les témoignages sur `/temoignages/` ont été confirmés par Alain comme réels
- [ ] La page `/performance/` ne diffuse pas des données SEO internes en public

---

## 7. APRÈS LES CHANGEMENTS — actions Vincent

1. Confirmer/corriger les détails personnels (Chambre de commerce, cyclisme, etc.) avec Alain
2. Confirmer les témoignages individuels avec Alain — supprimer les inventés
3. Vérifier que la photo principale d'Alain a l'alt mis à jour avec les 4 villes
4. Re-tester localhost:4010 après le déploiement des changements
5. Lancer Google Search Console pour suivre l'évolution du ranking sur « courtier immobilier {ville} » pour les 4 villes
