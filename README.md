# e-mirror

Projet d'école (Clermont School of Business). **Ton dressing se tient à jour tout seul.**

Application web mobile installable (PWA) qui aide à porter ce qu'on possède vraiment : tenue du jour construite autour d'une pièce oubliée, suivi du lavage, pièces dormantes à remettre en jeu, échanger, vendre ou donner, et une bourse d'échange entre membres avec des jetons de réclamation (1 habit fourni = 1 jeton = 1 habit à réclamer).

« e-mirror » est un nom de code : le nom définitif reste à choisir (voir `docs/08-decisions-ouvertes.md`).

## Tester l'appli

- **En ligne** : https://s2lyvn.github.io/Projet-Ecole/ (mise à jour automatique à chaque push sur `main`).
- **Sur ton ordinateur** (Node.js 20.19 ou plus) :

```bash
npm install
npm run dev
```

Puis ouvre l'adresse affichée (http://localhost:5173). Pour avoir le panneau de démo (avancer d'un jour, mode miroir), crée un fichier `.env.local` contenant `VITE_DEMO_MODE=true`. Pour voir la version mobile, ouvre les outils de développement du navigateur et choisis un écran de téléphone.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur local avec rechargement automatique |
| `npm run test` | Tests Vitest des règles métier (`src/domain/`) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert le build de production en local |

## Organisation

| Dossier | Contenu |
|---|---|
| `CLAUDE.md` | Résumé du projet et règles de travail |
| `docs/` | Dossier de conception : contexte, produit, échange, données, technique, design, feuille de route |
| `reference/` | Prototype interactif HTML (référence visuelle) |
| `src/domain/` | Règles métier pures et testées |
| `src/data/` | Accès aux données : interface commune et version locale (données d'exemple) |
| `src/screens/` | Un dossier par écran |
| `src/components/` | Composants partagés (barre d'onglets, en-têtes…) |
| `src/styles/tokens.css` | Couleurs du design, thème clair et sombre |
| `public/` | Icônes de l'appli installable |

## Avancement

Voir `docs/07-feuille-de-route.md`. Étapes 0 (mise en place), 1 (règles métier et données d'exemple) et 2 (écrans du cœur en mode démo) faites.

En plus, un **simulateur de la bourse d'échange** fonctionne hors ligne avec des membres fictifs : annonces, réclamation avec des jetons, rendez-vous, QR code de remise, pièce reçue dans le dressing, avis. Il sera remplacé par la vraie bourse (Supabase) à l'étape 4, sans changer les écrans.

## Configuration

Copie `.env.example` en `.env.local` et remplis les valeurs. `.env.local` n'est jamais envoyé sur GitHub.
