# 07 — Feuille de route

Chaque étape tient en une ou deux sessions Claude Code. Pour chacune : le prompt à copier, puis ce qui doit marcher à la fin. Cocher les étapes au fur et à mesure.

Conseil : démarrer chaque étape en **mode plan** (Maj+Tab dans Claude Code), relire le plan, puis laisser coder.

---

## ☑ Étape 0 — Mise en place du projet

**Prompt :**
> Lis CLAUDE.md et tout le dossier docs/. Mets en place le projet selon docs/05-technique.md : Vite + React + TypeScript, React Router, Tailwind branché sur les variables de docs/06-design.md (clair et sombre), Vitest, vite-plugin-pwa, .env.example. Crée la barre d'onglets à 5 onglets avec des écrans vides. Présente-moi d'abord ton plan.

**C'est fini quand :** `npm run dev` affiche l'appli avec les 5 onglets, les bonnes polices et couleurs, en clair et en sombre ; `npm run test` passe.

## ☑ Étape 1 — Règles métier et données d'exemple

**Prompt :**
> Étape 1 de la feuille de route. Écris src/domain/ selon les règles de docs/02-produit.md (lavage, dormance, tenue du jour, indicateur) et docs/03-communaute-echange.md (barème de crédits, solde). Reprends l'algorithme de la tenue du jour du prototype reference/prototype-e-mirror.html. Ajoute des tests Vitest pour chaque règle. Crée src/data/repository.ts et une implémentation locale avec les pièces d'exemple du prototype.

**C'est fini quand :** tous les tests passent et couvrent les cas limites (tout au lavage, pas de chaussures, robe orpheline, pièce jamais portée).

## ☑ Étape 2 — Écrans du cœur (sans serveur)

**Prompt :**
> Étape 2. Construis les écrans Aujourd'hui, Dressing (avec la feuille d'actions), Confirmation du lendemain, Achats détectés, À sortir, Vendre et Bilan, en reprenant le prototype. Ils lisent et écrivent via repository.ts en mode démo. Ajoute un petit panneau de démonstration (avancer d'un jour, mode miroir, réinitialiser), visible seulement si VITE_DEMO_MODE=true.

**C'est fini quand :** on peut refaire tout le parcours conseillé du prototype dans la vraie appli, sur un téléphone.

## ☐ Étape 3 — Supabase : comptes, dressing, photos

**Prompt :**
> Étape 3. Crée les migrations Supabase à partir de docs/04-donnees.md pour les tables du dressing (profiles, garments, wears, outfits, outfit_items, purchase_candidates), avec RLS. Ajoute la connexion par lien magique, l'onboarding (tailles, ville, case 18 ans et plus, 15 à 20 premières pièces avec photo) et l'implémentation supabase.ts du repository. Explique-moi comment créer le projet Supabase et où coller les clés.

**C'est fini quand :** deux comptes de test ont chacun leur dressing, et aucun ne voit les pièces de l'autre.

## ☐ Étape 4 — Bourse d'échange : annonces, réservation, jetons

**Prompt :**
> Étape 4. Implémente la bourse d'échange selon docs/03-communaute-echange.md et docs/04-donnees.md : tables swap_listings, swaps, token_ledger, vues, RLS et fonctions RPC reserve_listing, schedule_swap, complete_swap, cancel_swap. Ajoute le bouton Échanger dans À sortir et dans la fiche d'une pièce, l'onglet Échanges (Bourse, Mes échanges, Mes annonces, jetons) et le QR code de remise. Le client ne doit jamais écrire dans token_ledger. Les écrans existent déjà avec le simulateur local (src/data/localSwaps.ts) : il s'agit de brancher Supabase derrière SwapRepository.

**C'est fini quand :** le compte A propose une pièce, le compte B la réclame (1 jeton bloqué), la remise est confirmée par QR code, A gagne 1 jeton, B voit la pièce apparaître dans son dressing avec sa fiche.

## ☐ Étape 5 — Messages, avis, sécurité, cercles

**Prompt :**
> Étape 5. Ajoute la messagerie liée à un échange (Supabase Realtime), les avis après échange, le profil public, le signalement et le blocage, les absences, l'expiration automatique des réservations (pg_cron) et les cercles privés avec code d'invitation. Affiche les règles de la communauté avant la première annonce.

**C'est fini quand :** un échange complet se fait de bout en bout entre deux téléphones, et un membre bloqué ne voit plus les annonces de celui qui l'a bloqué.

## ☐ Étape 6 — Déploiement et démo de soutenance

**Prompt :**
> Étape 6. Prépare le déploiement sur Vercel, l'installation en PWA (icônes, nom, couleur), un fichier supabase/seed.sql avec des comptes de démonstration, et un script de démo de 3 minutes dans docs/demo.md qui montre les 4 boucles et un échange.

**C'est fini quand :** l'appli est en ligne, installable, et la démo tient en 3 minutes.

---

## Plus tard (hors MVP)

- Import réel des achats (e-mails, tickets) : cadrage RGPD d'abord.
- Météo et agenda dans la tenue du jour.
- Troc direct 1 contre 1, en plus des jetons.
- Envoi postal des échanges (point relais).
- Événements de troc avec des associations de Clermont-Ferrand.
- Mode miroir réel, capteurs RFID ou NFC.
