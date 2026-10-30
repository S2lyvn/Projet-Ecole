# 06 — Design

Reprendre l'identité du prototype (`reference/prototype-e-mirror.html`), validée par Sullyvan après le passage à des couleurs « plus jeunes et plus fraîches » : fond menthe, encre indigo, violet pour agir, corail pour les pièces qui dorment, un pastel par pièce.

## Polices (Google Fonts)

- Titres : **Bricolage Grotesque** 600 et 700.
- Texte : **DM Sans** 400, 500, 700.

## Couleurs (variables CSS)

| Variable | Clair | Sombre | Usage |
|---|---|---|---|
| `--stage` | `#DDF3E8` | `#0E0D1A` | Fond derrière l'appli (bureau) |
| `--app` | `#F4FBF7` | `#16142A` | Fond de l'appli |
| `--surface` | `#FFFFFF` | `#201E3A` | Cartes, barre d'onglets |
| `--ink` | `#1C1A33` | `#F2F0FF` | Texte |
| `--muted` | `#5A5878` | `#B0AED0` | Texte secondaire |
| `--line` | `#D8E6DE` | `#35325A` | Bordures |
| `--tile` | `#E6F0EB` | `#2A2850` | Fond neutre de vignette |
| `--outline` | `#7C7B96` | `#7C7AA5` | Bordure des boutons secondaires |
| `--accent` | `#6247F5` | `#6A52F0` | Action principale (violet) |
| `--accent-ink` | `#4A31CF` | `#C5BAFF` | Texte sur teinte violette |
| `--accent-tint` | `#ECE8FF` | `#2E2A66` | Bannières, onglet actif |
| `--amber` | `#FF9E7D` | `#FF9E7D` | Puce « Dort » (corail) |
| `--amber-ink` | `#B4360F` | `#FFB59B` | Texte « pas portée depuis… » |
| `--fresh` | `#7BE0B8` | `#7BE0B8` | Puce « Disponible » |
| `--wash` | `#0A6C86` | `#7FD6EE` | Puce « Lavage » |
| `--solid` | `#1C1A33` | `#F2F0FF` | Bouton plein foncé, toast |

Pastels de vignette (une couleur par pièce, choisie à partir du nom) :
clair `#D5F3E6 #E3DCFF #FFE0D3 #D3EBFF #FFF1BF #FFD9E8` ; sombre `#1F4A3E #35306A #5A3328 #1F3F5C #55481C #5A2A42`.

**Nouveau pour l'échange** : puce « Proposée à l'échange » et jetons de réclamation en `--accent-tint` / `--accent-ink`. Ne pas ajouter de nouvelle couleur vive sans raison.

## Composants

- **Carte** : rayon 24 px, bordure `--line`, marge interne 16 px.
- **Bouton principal** : violet, texte blanc gras, hauteur 48 px (56 px pour l'action de l'écran), rayon 14 à 18 px.
- **Bouton secondaire** : contour `--outline`, fond transparent.
- **Pastille de filtre** (pill) : rayon 999 px, 44 px de haut, active = violet plein.
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
- Focus visible (contour violet 3 px).
- Les silhouettes sont décoratives (`aria-hidden`) ; le nom de la pièce porte l'information.
