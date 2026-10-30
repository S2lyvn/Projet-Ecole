# 03 — Communauté d'échange : la bourse

## L'idée

Une pièce qui dort chez toi peut vivre chez quelqu'un d'autre. Au lieu de la vendre, tu l'**échanges** : tu la proposes à la communauté, quelqu'un la prend, tu gagnes un **jeton de réclamation**, et ce jeton te permet de réclamer une pièce proposée par n'importe quel autre membre, quand tu veux.

> **1 habit fourni = 1 jeton = 1 habit à réclamer chez n'importe quel membre.**

Pourquoi des jetons plutôt qu'un troc direct « ma veste contre ton pull » : le troc direct exige que chacun veuille exactement ce que l'autre propose, au même moment. Souvent, deux personnes ne trouvent rien qui leur plaise chez l'autre, mais chez quelqu'un d'autre de la communauté. Le jeton fait le pont dans le temps : je donne à Léo aujourd'hui, et je réclame chez Sarah le jour où je trouve la bonne pièce. KidiTroc fonctionnait déjà avec des points d'échange en 2011.

## Ce que ça apporte au concept

- **Une quatrième sortie** pour les pièces dormantes, en plus de remettre en jeu, vendre et donner.
- **Zéro saisie à l'arrivée** : la pièce reçue entre dans le dressing du receveur avec sa fiche déjà remplie (photo, catégorie, taille, couleur, marque). C'est le lien avec notre promesse « Ton dressing se tient à jour tout seul ».
- **Moins d'achats neufs** : on renouvelle son dressing sans acheter.
- **Pas un réseau social** : pas de fil, pas de likes, pas d'abonnés. On garde l'élimination du fil d'inspiration (grille ERRC).

## Règles des jetons (décidées le 30 octobre 2026)

- **1 habit = 1 jeton**, quelle que soit la pièce : un manteau vaut autant qu'un t-shirt. Simple à expliquer, pas de négociation. Point à observer pendant les tests : voir `08-decisions-ouvertes.md`.
- **Le jeton est gagné à la remise confirmée** (QR code scanné), jamais à la mise en ligne. Cela empêche de gagner des jetons avec des annonces fictives.
- **Pas d'expiration** : un jeton reste valable jusqu'à ce que son propriétaire trouve la pièce qui lui plaît.
- **Jetons de bienvenue : 0.** On commence par donner une pièce. Option à tester : 1 jeton offert après la première remise réussie.
- Quand je réclame une pièce, **1 jeton est bloqué**. S'il y a annulation, ou expiration de la réclamation (72 h sans rendez-vous), il m'est rendu. À la remise, il est dépensé.
- **Les jetons ne s'achètent pas et ne se convertissent pas en euros.** C'est ce qui distingue la bourse d'une place de marché. Points juridiques à faire vérifier (fiscalité, obligations des plateformes) : voir `08-decisions-ouvertes.md`. Ceci n'est pas un avis juridique.
- Solde = somme du registre des jetons (`token_ledger`). Aucune colonne « solde » modifiable directement.

## Parcours

### A. Proposer une pièce à l'échange
Points d'entrée : bouton « Échanger » sur une pièce dormante (À sortir) ou depuis la fiche d'une pièce (Dressing).

1. Écran « Proposer à l'échange », prérempli depuis la fiche : photo, nom, catégorie, taille, couleur. Le membre ajoute l'**état** (neuf avec étiquette, très bon, bon, satisfaisant) et, s'il veut, une phrase.
2. Il choisit la **visibilité** : sa ville, ou un cercle privé (amis, promo, entreprise).
3. Il coche deux engagements : « La pièce est propre » et « J'ai signalé les défauts ».
4. L'annonce est publiée. Dans son dressing, la pièce reste active avec la puce « Proposée à l'échange ».

### B. Trouver et réserver une pièce
1. Onglet Échanges → **Bourse** : grille d'annonces filtrée par défaut sur **mes tailles** et **ma ville**. Filtres : catégorie, taille, cercle.
   - **Près de chez toi** : filtre par distance autour de **mon quartier** (1 km, 3 km par défaut, 5 km, toute la ville), annonces triées de la plus proche à la plus lointaine. La distance est calculée **entre centres de quartiers** et arrondie au demi-kilomètre : l'appli ne connaît jamais la position exacte ni l'adresse (CLAUDE.md, règle 5). Dans le simulateur, les positions des quartiers de Clermont-Ferrand sont des ordres de grandeur d'exemple ; à l'étape 4, une table `neighborhoods` (ville, nom, centre approximatif) les remplacera.
2. Fiche d'une annonce : photos, état, taille, ville et quartier du membre (jamais l'adresse), note du membre, nombre d'échanges réussis.
3. « Réclamer cette pièce » → réservation. 1 jeton est bloqué. L'annonce passe « réservée » et disparaît de la bourse.
4. Limites : 3 réservations en cours maximum par membre ; une réservation expire après **72 heures** sans rendez-vous fixé.

### C. Se mettre d'accord et se rencontrer
1. Échange en cours : messagerie courte entre les deux membres, liée à l'échange (pas de messagerie libre).
2. Rendez-vous : on propose un créneau et un **lieu public** dans une liste suggérée (campus, tiers-lieu, café partenaire, association). Pas d'adresse personnelle demandée par l'appli.
3. Rappel la veille.

### D. Confirmer la remise
1. Sur place, le receveur scanne le **QR code** affiché par le donneur (ou, à défaut, les deux appuient sur « Remise faite »).
2. Une fonction serveur `complete_swap` fait tout en une transaction :
   - dépense le jeton bloqué du receveur et donne 1 jeton au donneur ;
   - passe la pièce du donneur au statut `swapped_out` ;
   - crée une copie de la fiche dans le dressing du receveur (`source = swap`, `origin_garment_id` = pièce d'origine) ;
   - clôt l'annonce.
3. Chacun laisse un **avis** (1 à 5, commentaire facultatif).
4. Le receveur voit sa nouvelle pièce dans Dressing, et elle peut être proposée dans la tenue du jour dès le lendemain.

### E. Problèmes
- **Annulation** avant la remise : jeton rendu, annonce remise en ligne.
- **Absence au rendez-vous** : l'autre membre la signale ; après 2 absences, la réservation est suspendue 7 jours.
- **Pièce non conforme** : refus à la remise (rien n'est transféré) ou signalement dans les 48 h.
- **Signaler / bloquer** un membre ou une annonce, depuis toutes les fiches.

## Cercles

- **Ville** : visibilité par défaut, tous les membres d'une même ville.
- **Cercle privé** : créé par un membre, rejoint avec un code d'invitation (amis, promo, colocation, entreprise). Utile pour un premier test à Clermont-Ferrand sur le campus.
- Plus tard : **événements de troc** organisés avec des associations (trocantes, « free troc parties ») ; les annonces d'un événement sont réservées aux participants.

## Confiance et sécurité

- E-mail vérifié obligatoire pour la bourse.
- **18 ans et plus** pour la bourse dans le MVP (les rencontres en personne entre inconnus posent un risque pour des mineurs). La cible inclut les 15-17 ans : décision à prendre (voir `08-decisions-ouvertes.md`).
- Localisation : ville et quartier saisis par le membre, jamais de GPS précis.
- Photos des annonces visibles des seuls membres connectés ; photos du dressing toujours privées.
- Profil public minimal : pseudo, ville, note, nombre d'échanges, date d'inscription.
- Modération : file des signalements visible par un compte administrateur.
- Règles de la communauté affichées avant la première annonce (propre, honnête sur l'état, rendez-vous en lieu public, respect).

## Mesures à suivre

- Pièces remises en circulation par l'échange (par mois).
- Part des pièces dormantes sorties par l'échange, la vente ou le don.
- Délai moyen entre la réservation et la remise.
- Taux d'annulation et d'absence.
- Note moyenne des échanges.

## Écrans à ajouter au prototype

1. Onglet Échanges : sous-onglets **Bourse**, **Mes échanges**, **Mes annonces** ; jetons en haut.
2. Proposer à l'échange (formulaire prérempli).
3. Fiche d'une annonce.
4. Échange en cours : état, messagerie, rendez-vous, QR code, bouton de confirmation.
5. Avis après échange.
6. Profil public d'un membre.
7. Règles de la communauté (affichées une fois).
