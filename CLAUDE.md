# CLAUDE.md — Application e-mirror (projet d'école)

Ce fichier est lu automatiquement par Claude Code. Il résume le projet et fixe les règles de travail. Le détail est dans `docs/`.

## Le projet en 5 lignes

- **Problème** : on porte une petite partie de ce qu'on possède. L'ADEME estime environ 50 % de « stock dormant » dans les dressings (voir `docs/sources.md`).
- **Promesse** : « Ton dressing se tient à jour tout seul. » Aucune saisie lourde, aucune déclaration quotidienne.
- **Quatre boucles** : Capturer (achats détectés) → Mettre à jour (porté, au lavage, disponible) → Proposer (la tenue du jour part d'une pièce oubliée) → Faire sortir (remettre en jeu, **échanger**, vendre, donner).
- **Nouveauté de cette version** : une **communauté d'échange** entre membres. On troque ses pièces dormantes au lieu de les vendre, avec des crédits non convertibles en euros.
- **Format** : l'application d'abord (web mobile installable, PWA). Le miroir connecté viendra plus tard, comme point de contact du matin, sans caméra.

## Où lire quoi

| Fichier | Contenu |
|---|---|
| `docs/01-contexte.md` | Problématique, chiffres sourcés, personas, marché, stratégie Océan Bleu |
| `docs/02-produit.md` | Écrans, parcours, règles métier (tenue du jour, lavage, dormance, indicateur) |
| `docs/03-communaute-echange.md` | La bourse d'échange : crédits, réservation, remise en main propre, confiance |
| `docs/04-donnees.md` | Schéma de base de données (Supabase / Postgres) et règles d'accès (RLS) |
| `docs/05-technique.md` | Stack, arborescence du code, commandes, sécurité |
| `docs/06-design.md` | Couleurs, polices, composants, accessibilité |
| `docs/07-feuille-de-route.md` | Les étapes de développement, avec le prompt à donner pour chacune |
| `docs/08-decisions-ouvertes.md` | Ce que l'équipe doit encore trancher |
| `reference/prototype-e-mirror.html` | Le prototype interactif (à ouvrir dans un navigateur) : référence visuelle et logique |

## Règles de travail

1. **Une étape à la fois**, dans l'ordre de `docs/07-feuille-de-route.md`. Avant de coder une étape, présenter un plan court et attendre l'accord.
2. **Langue** : interface, textes et documentation en français. Noms de variables, fonctions, tables et colonnes en anglais.
3. **Logique métier pure et testée** : toutes les règles (tenue du jour, lavage, dormance, crédits) vivent dans `src/domain/`, sans dépendance à React ni à Supabase, avec des tests Vitest.
4. **Les crédits d'échange ne se modifient jamais depuis le client.** Toute écriture dans le registre de crédits passe par une fonction Postgres (RPC) côté serveur. Voir `docs/04-donnees.md`.
5. **Vie privée** : pas de caméra, pas de géolocalisation précise (ville et quartier seulement), photos dans un bucket privé avec URL signées. Les membres de moins de 18 ans ne peuvent pas utiliser la bourse d'échange tant que l'équipe n'a pas tranché (voir `docs/08-decisions-ouvertes.md`).
6. **Pas de chiffres inventés** : toute donnée affichée comme réelle doit venir de `docs/sources.md`. Les données d'exemple sont signalées comme exemples.
7. **Mobile d'abord** : conçu pour 360 à 430 px de large, cibles tactiles d'au moins 44 px, thème clair et sombre.
8. **Git** : ne jamais committer ni pousser sans l'accord explicite de Sullyvan. Proposer un message de commit clair en français.
9. **Secrets** : aucune clé dans le code. Utiliser `.env.local` (ignoré par Git) et tenir `.env.example` à jour.

## Commandes (une fois l'étape 0 faite)

```bash
npm install
npm run dev      # serveur local
npm run test     # tests Vitest de src/domain
npm run build    # build de production
```
