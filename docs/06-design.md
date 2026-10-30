# 06 — Design

Identité chaleureuse, validée par Sullyvan le 30 octobre 2026 (elle remplace la palette menthe et violet du prototype) : fond crème, encre brun chocolat, jaune miel pour agir, terracotta pour les pièces qui dorment, un pastel chaud par pièce. Le prototype reste la référence pour la mise en page et les textes, plus pour les couleurs.

## Polices (Google Fonts)

- Titres : **Bricolage Grotesque** 600 et 700.
- Texte : **DM Sans** 400, 500, 700.

## Couleurs (variables CSS)

| Variable | Clair | Sombre | Usage |
|---|---|---|---|
| `--stage` | `#F5E9CF` | `#14100B` | Fond derrière l'appli (bureau) |
| `--app` | `#FFF8EB` | `#1C1711` | Fond de l'appli (crème) |
| `--surface` | `#FFFDF7` | `#27201A` | Cartes, barre d'onglets |
| `--ink` | `#2B2118` | `#FBF3E4` | Texte (brun chocolat) |
| `--muted` | `#6B5A45` | `#CDBDA4` | Texte secondaire |
| `--line` | `#ECDFC5` | `#3D3328` | Bordures |
| `--tile` | `#F6EAD2` | `#30281F` | Fond neutre de vignette |
| `--outline` | `#9A8668` | `#8F7D63` | Bordure des boutons secondaires |
| `--accent` | `#F2B705` | `#F2B705` | Action principale (jaune miel) |
| `--on-accent` | `#2B2118` | `#1C1711` | Texte sur le jaune (toujours foncé : le blanc ne se lit pas sur du jaune) |
| `--accent-ink` | `#7A5200` | `#FFD46B` | Texte sur teinte miel |
| `--accent-tint` | `#FCEFC7` | `#3D3014` | Bannières, onglet actif, jetons |
| `--amber` | `#F2946A` | `#F2946A` | Puce « Dort » (terracotta) |
| `--amber-ink` | `#A23B12` | `#FFB18C` | Texte « pas portée depuis… » |
| `--fresh` | `#A9D98F` | `#A9D98F` | Puce « Disponible » (vert sauge) |
| `--wash` | `#1D6A80` | `#7FD6EE` | Puce « Lavage » |
| `--solid` | `#2B2118` | `#FBF3E4` | Bouton plein foncé, toast |
| `--focus` | `#8A5A00` | `#FFD46B` | Contour de focus (le jaune seul est trop pâle sur la crème) |

Pastels de vignette (une couleur par pièce, choisie à partir du nom) : beurre, pêche, miel, olive, rose, latte.
Clair `#FFE8B0 #FFDCC6 #F7E3A6 #E6EBC8 #FBD7D0 #F0E2CC` ; sombre `#4A3A12 #4D3020 #46401C #3A4024 #4A2C2A #43382B`.

Contrastes vérifiés au calcul (WCAG AA, 4,5:1 pour le texte, 3:1 pour les contours) pour chaque paire texte/fond, en clair et en sombre.

**Nouveau pour l'échange** : puce « Proposée à l'échange » et jetons de réclamation en `--accent-tint` / `--accent-ink`. Ne pas ajouter de nouvelle couleur vive sans raison.

## Composants

- **Carte** : rayon 24 px, bordure `--line`, marge interne 16 px.
- **Bouton principal** : jaune miel, texte brun foncé gras, hauteur 48 px (56 px pour l'action de l'écran), rayon 14 à 18 px.
- **Bouton secondaire** : contour `--outline`, fond transparent.
- **Pastille de filtre** (pill) : rayon 999 px, 44 px de haut, active = jaune miel plein.
- **Puce d'état** (chip) : petite, grasse, rayon 999 px.
- **Vignette de pièce** : pastel + silhouette (ou photo réelle quand elle existe), rayon 16 px.
- **Feuille du bas** (bottom sheet) pour les actions sur une pièce.
- **Toast** en bas, avec « Annuler » pour les actions destructrices (donner, vendre, échanger).
- **Barre d'onglets** : 5 onglets, icône + libellé, onglet actif sur fond `--accent-tint`.

## Ton des textes

- Tutoiement, phrases courtes, verbes d'action : « Je porte cette tenue », « Remettre en jeu », « Je la veux ».
- Accords : « Pas porté / portée / portées depuis… » selon la pièce (le prototype gère le genre de chaque pièce).
- Jamais culpabilisant sur les pièces dormantes : on propose, l'utilisateur décide.

## Accessibilité

- Contrastes AA au minimum, vérifiés en clair et en sombre.
- Respecter `prefers-reduced-motion`.
- Focus visible (contour `--focus` 3 px, brun miel en clair, jaune clair en sombre).
- Les silhouettes sont décoratives (`aria-hidden`) ; le nom de la pièce porte l'information.
