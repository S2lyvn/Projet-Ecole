# 05 — Technique

## Stack recommandée

| Besoin | Choix | Pourquoi |
|---|---|---|
| Interface | **React + TypeScript + Vite** | Rapide à lancer, bien maîtrisé par Claude Code |
| Navigation | React Router | Onglets + écrans secondaires |
| Styles | **Tailwind CSS** branché sur les variables CSS de `06-design.md` | Thème clair et sombre par variables, vitesse d'itération |
| Application installable | `vite-plugin-pwa` | S'installe sur l'écran d'accueil du téléphone, pas de store |
| Données, comptes, photos | **Supabase** (Postgres, Auth, Storage, Realtime) | Tout-en-un, RLS pour la sécurité, déjà utilisé sur un autre projet de Sullyvan |
| Messagerie des échanges | Supabase Realtime | Messages en direct sans serveur à gérer |
| QR code | `qrcode` (affichage) + `@zxing/browser` ou saisie du code à 12 caractères | Remise en main propre |
| Tests | **Vitest** (+ Testing Library pour quelques écrans) | Règles métier testées |
| Hébergement | Vercel ou Netlify | Déploiement depuis GitHub |

Alternative si l'équipe veut une vraie appli native : Expo (React Native) avec le même Supabase. Le domaine (`src/domain/`) se réutilise tel quel.

## Arborescence cible

```
.
├── CLAUDE.md
├── docs/                    # ce dossier de passation
├── reference/               # prototype HTML
├── public/                  # icônes PWA
├── src/
│   ├── domain/              # règles métier pures + tests
│   │   ├── types.ts
│   │   ├── laundry.ts
│   │   ├── dormancy.ts
│   │   ├── outfit.ts
│   │   ├── usage.ts         # indicateur « part portée »
│   │   ├── tokens.ts        # jetons de réclamation : solde, contrôles côté client (affichage)
│   │   └── *.test.ts
│   ├── data/
│   │   ├── repository.ts    # interface d'accès aux données
│   │   ├── local.ts         # implémentation locale (données d'exemple) pour la démo hors ligne
│   │   └── supabase.ts      # implémentation Supabase
│   ├── screens/             # un dossier par écran
│   ├── components/          # Card, Button, Chip, Tile, Sheet, Toast, TabBar…
│   ├── styles/tokens.css
│   ├── lib/supabase.ts
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── .env.example
└── package.json
```

**Point clé** : les écrans parlent à `repository.ts`, jamais directement à Supabase. On peut ainsi faire tourner toute l'appli avec des données d'exemple (étapes 1 et 2) avant de brancher Supabase (étape 3), et garder un mode démo pour la soutenance.

## Variables d'environnement

`.env.local` (jamais commité) :

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEMO_MODE=true        # true = données d'exemple locales, sans Supabase
```

La clé `service_role` ne doit **jamais** apparaître dans le code de l'interface.

## Sécurité et vie privée (rappel)

- RLS activée partout ; tests manuels avec deux comptes pour vérifier qu'un membre ne voit pas le dressing de l'autre.
- Jetons modifiés uniquement par les fonctions RPC.
- Photos privées, URL signées.
- Pas de GPS : ville et quartier saisis.
- Bourse réservée aux adultes (case à cocher à l'inscription dans le MVP).
- Suppression de compte : supprime le profil, les pièces, les photos ; les échanges terminés restent anonymisés pour l'historique des jetons de l'autre membre.
- Mentions légales et politique de confidentialité à rédiger avant tout test avec de vrais utilisateurs.

## Qualité

- `npm run test` doit passer avant chaque proposition de commit.
- Accessibilité : boutons de 44 px minimum, libellés sur les icônes, focus visible, contrastes vérifiés en clair et en sombre.
- Tester à 360 px et 430 px de large.
