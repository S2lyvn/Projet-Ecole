# 06 — Design

Identité issue de la **charte graphique DeepIN Armour** (novembre 2026), appliquée à l'application et à la vitrine. Elle remplace les palettes précédentes (menthe et violet, puis crème et miel). Le prototype reste la référence pour la mise en page et les textes, plus pour les couleurs.

**La marque :** DeepIN Armour, « Partager le bonheur dans son armoire ». Une communauté qui révèle la valeur de nos armoires, prolonge la vie des vêtements et fait circuler le style, les savoir-faire et le bonheur. Six valeurs : communautaire, responsable, transformatrice, circulaire, positive, inspirante. Message : « Less is more. Plus de bonheur avec ce que l'on possède déjà ! »

## Polices (Google Fonts)

- Titres : **Montserrat** 600, 700 et 800 (moderne, impactant, accessible).
- Texte : **Lato** 400 et 700 (claire, lisible, digitale et inclusive). Lato n'a pas de graisse 500 : « medium » s'affiche en 400.

## Couleurs de la charte

| Couleur | Code | Rôle |
|---|---|---|
| Violet | `#5A1E56` | Identité, élégance : texte des titres, bouton principal |
| Jaune Soleil | `#FFC83D` | Énergie, bonheur : jetons, pièces qui dorment, bande d'action, « IN » du logo |
| Rose poudré | `#F7D4DC` | Douceur, féminité : fonds de vignette |
| Vert sauge | `#A8C9B5` | Nature, équilibre : puce « Disponible » |
| Crème | `#FFF7E8` | Lumière, respiration : fond de l'appli |
| Bleu nuit | `#1E4D56` | Confiance, contraste : lavage, boutons pleins, toasts |

## Variables CSS (`src/styles/tokens.css`)

Les valeurs ci-dessous dérivent des six couleurs ; les teintes plus claires ou plus foncées (texte, bordures, thème sombre) sont calculées pour respecter les contrastes.

| Variable | Clair | Sombre | Usage |
|---|---|---|---|
| `--stage` | `#FBEED9` | `#120812` | Fond derrière l'appli (bureau) |
| `--app` | `#FFF7E8` | `#1B0F1B` | Fond de l'appli (crème) |
| `--surface` | `#FFFDF8` | `#281727` | Cartes, barre d'onglets |
| `--ink` | `#3D1A3A` | `#FFF7E8` | Texte (violet très foncé) |
| `--muted` | `#755673` | `#CDB6CB` | Texte secondaire |
| `--line` | `#EFDFD3` | `#3E2A3D` | Bordures |
| `--tile` | `#F8ECDB` | `#331F32` | Fond neutre de vignette |
| `--outline` | `#957693` | `#8F7390` | Bordure des boutons secondaires |
| `--accent` | `#5A1E56` | `#D9A3D3` | Action principale (violet ; violet clair en sombre) |
| `--on-accent` | `#FFF7E8` | `#1B0F1B` | Texte sur l'action principale |
| `--accent-ink` | `#5A1E56` | `#EBC2E6` | Texte sur teinte violette |
| `--accent-tint` | `#F3E4F1` | `#3C1F3A` | Bannières, onglet actif |
| `--sun` | `#FFC83D` | `#FFC83D` | Jaune Soleil : jetons, mises en avant |
| `--on-sun` | `#3D1A3A` | `#1B0F1B` | Texte sur le jaune (jamais de blanc sur du jaune) |
| `--amber` | `#FFC83D` | `#FFC83D` | Puce « Dort » |
| `--amber-ink` | `#8A2A5C` | `#FFD77A` | Texte « pas portée depuis… » |
| `--fresh` | `#A8C9B5` | `#A8C9B5` | Puce « Disponible » |
| `--wash` | `#1E4D56` | `#8FD3DE` | Puce « Lavage » |
| `--solid` | `#1E4D56` | `#FFF7E8` | Bouton plein foncé, toast |
| `--focus` | `#5A1E56` | `#FFC83D` | Contour de focus |

Pastels de vignette (une couleur par pièce, choisie à partir du nom), tous tirés des couleurs de la charte : rose, sauge, soleil, violet, bleu nuit, rose-violet.
Clair `#F7D4DC #D9E9DF #FFE8A6 #EAD5E8 #D2E3E3 #F3DDEB` ; sombre `#4A2535 #2D4439 #4D4018 #43264A #1F4347 #4A2B44`.

Contrastes vérifiés au calcul (WCAG AA : 4,5:1 pour le texte, 3:1 pour les contours) pour chaque paire texte/fond, en clair et en sombre. Deux exceptions assumées : le jaune sur la crème (anneau du Bilan, 1,5:1), où le chiffre central et le libellé portent aussi l'information, et le « IN » jaune du logo, qui est un logotype.

## Logo et symboles de la marque

**Le logo n'est jamais redessiné.** Il est découpé tel quel dans la charte graphique et enregistré en PNG à fond transparent dans `public/brand/` :
- `logo-complet.png` : maison, cintre, lien infini, papillon, nom « DeepIN Armour » et signature « Partager le bonheur dans son armoire » (pied de la vitrine) ;
- `logo-symbole.png` : la maison avec le cintre-cœur, le lien infini et le papillon, sans le nom (en-têtes de la vitrine et de l'appli, icône d'application, favicon) ;
- `papillon.png` : le papillon seul (papillons qui volent sur la vitrine, message « Less is more » du Bilan).

Les composants sont dans `src/components/Brand.tsx`. Le nom « Deep**IN** Armour » à côté du symbole est écrit en texte (Montserrat 800, « IN » en jaune soleil) pour rester lisible et accessible.

**Limites :** ces PNG viennent de l'image de la charte (environ 550 px de large) : suffisant pour l'écran, pas pour l'impression ni les grands formats. Pour ces usages, utiliser les fichiers vectoriels d'origine, et les placer dans `public/brand/` à la place pour une netteté parfaite (mêmes noms de fichiers : SVG ou PNG plus grand).

**Fond sombre :** les traits du logo sont violets, donc invisibles sur fond sombre. En thème sombre, le logo est posé sur une pastille crème (variable `--logo-bg`, transparente en clair).

**Sens des symboles :** maison / communauté (le foyer, le collectif), lien infini (partage, circularité, continuité), papillon (transformation, renouveau), cintre-cœur (style, amour de ses pièces).

## Icônes (bibliothèque de la charte)

Au trait, violet, 24 px : Mon armoire & mon inventaire, Idées looks & inspirations, Réutiliser & faire circuler, Réparer & entretenir, Donner / Vendre / Échanger, Prêter / Louer, Artisans & partenaires locaux, Communauté & partage, Suivi d'impact & armoire responsable, Mes progrès & défis.

Barre d'onglets : Carte = repère de lieu (Artisans & partenaires locaux), Échanges = Réutiliser & faire circuler, Armoire = Mon armoire, Looks = Idées looks. Les icônes Communauté et Suivi d'impact restent disponibles. Les autres icônes de la bibliothèque (Réparer, Prêter, Artisans, Mes progrès) servent aux fonctions futures et ne sont pas encore dessinées.

**Parcours utilisateur de la charte :** Évaluer mon armoire → Découvrir des looks → Faire circuler → Réduire mon impact → Me sentir bien !

## Composants

- **Carte** : rayon 24 px, bordure `--line`, marge interne 16 px.
- **Bouton principal** : violet, texte crème gras, hauteur 48 px (56 px pour l'action de l'écran), rayon 14 à 18 px.
- **Bouton secondaire** : contour `--outline`, fond transparent.
- **Pastille de filtre** (pill) : rayon 999 px, 44 px de haut, active = violet plein.
- **Puce d'état** (chip) : petite, grasse, rayon 999 px.
- **Vignette de pièce** : pastel + silhouette (ou photo réelle quand elle existe), rayon 16 px.
- **Feuille du bas** (bottom sheet) pour les actions sur une pièce.
- **Toast** en bas, avec « Annuler » pour les actions destructrices (donner, vendre, échanger).
- **Barre d'onglets** : 4 onglets (Carte, Échanges, Armoire, Looks), icône + libellé, onglet actif sur fond `--accent-tint`.
- **Carte de proximité** : illustration des quartiers sur fond `--tile` (pastilles de quartier aux teintes de la charte, routes `--surface`, parc `--fresh`), cercle pointillé violet pour le rayon, pastilles violettes avec le nombre de pièces (jaune soleil pour le quartier sélectionné), pastille « Toi » sur mon quartier.

## Ton des textes

- Tutoiement, phrases courtes, verbes d'action : « Je porte cette tenue », « Remettre en jeu », « Je la veux ».
- Accords : « Pas porté / portée / portées depuis… » selon la pièce (le prototype gère le genre de chaque pièce).
- Jamais culpabilisant sur les pièces dormantes : on propose, l'utilisateur décide.

## Accessibilité

- Contrastes AA au minimum, vérifiés en clair et en sombre.
- Respecter `prefers-reduced-motion`.
- Focus visible (contour `--focus` 3 px : violet en clair, jaune en sombre).
- Les silhouettes sont décoratives (`aria-hidden`) ; le nom de la pièce porte l'information.
