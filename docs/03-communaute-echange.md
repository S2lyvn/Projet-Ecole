# 03 — Communauté d'échange : la bourse

## L'idée

Une pièce qui dort chez toi peut vivre chez quelqu'un d'autre. Au lieu de la vendre, tu l'**échanges** : tu la proposes à la communauté, quelqu'un la prend, tu gagnes des **crédits**, et tu utilises ces crédits pour prendre une pièce proposée par un autre membre.

Pourquoi des crédits plutôt qu'un troc direct « ma veste contre ton pull » : le troc direct exige que chacun veuille exactement ce que l'autre propose, au même moment. Avec des crédits, je donne à Léo et je reçois de Sarah. KidiTroc fonctionnait déjà avec des points d'échange en 2011.

## Ce que ça apporte au concept

- **Une quatrième sortie** pour les pièces dormantes, en plus de remettre en jeu, vendre et donner.
- **Zéro saisie à l'arrivée** : la pièce reçue entre dans le dressing du receveur avec sa fiche déjà remplie (photo, catégorie, taille, couleur, marque). C'est le lien avec notre promesse « Ton dressing se tient à jour tout seul ».
- **Moins d'achats neufs** : on renouvelle son dressing sans acheter.
- **Pas un réseau social** : pas de fil, pas de likes, pas d'abonnés. On garde l'élimination du fil d'inspiration (grille ERRC).

## Règles des crédits (proposition MVP)

| Catégorie | Crédits |
|---|---|
| tee, other | 1 |
| pants, dress, shoes | 2 |
| long (pull, veste, chemise) | 2 |
| outerwear (manteau) | 3 |

- Le barème est fixe dans le MVP : pas de négociation. Il est stocké en base pour pouvoir l'ajuster.
- **Crédits de bienvenue : 0.** On commence par proposer une pièce. Option à tester : 1 crédit offert après la première remise réussie.
- Les crédits sont **gagnés quand la remise est confirmée par les deux membres**, pas à la mise en ligne. Cela empêche de gagner des crédits avec des annonces fictives.
- Quand je réserve une pièce, ses crédits sont **bloqués** sur mon solde. S'il y a annulation ou expiration, ils sont débloqués.
- **Les crédits ne s'achètent pas et ne se convertissent pas en euros.** C'est ce qui distingue la bourse d'une place de marché. Points juridiques à faire vérifier (fiscalité, obligations des plateformes) : voir `08-decisions-ouvertes.md`. Ceci n'est pas un avis juridique.
- Solde = somme du registre des crédits (`credit_ledger`). Aucune colonne « solde » modifiable directement.

## Parcours

### A. Proposer une pièce à l'échange
Points d'entrée : bouton « Échanger » sur une pièce dormante (À sortir) ou depuis la fiche d'une pièce (Dressing).

1. Écran « Proposer à l'échange », prérempli depuis la fiche : photo, nom, catégorie, taille, couleur. Le membre ajoute l'**état** (neuf avec étiquette, très bon, bon, satisfaisant) et, s'il veut, une phrase.
2. Il choisit la **visibilité** : sa ville, ou un cercle privé (amis, promo, entreprise).
3. Il coche deux engagements : « La pièce est propre » et « J'ai signalé les défauts ».
4. L'annonce est publiée. Dans son dressing, la pièce reste active avec la puce « Proposée à l'échange ».

### B. Trouver et réserver une pièce
1. Onglet Échanges → **Bourse** : grille d'annonces filtrée par défaut sur **mes tailles** et **ma ville**. Filtres : catégorie, taille, cercle, crédits.
2. Fiche d'une annonce : photos, état, taille, crédits, ville et quartier du membre (jamais l'adresse), note du membre, nombre d'échanges réussis.
3. « Je la veux » → réservation. Les crédits sont bloqués. L'annonce passe « réservée » et disparaît de la bourse.
4. Limites : 3 réservations en cours maximum par membre ; une réservation expire après **72 heures** sans rendez-vous fixé.

### C. Se mettre d'accord et se rencontrer
1. Échange en cours : messagerie courte entre les deux membres, liée à l'échange (pas de messagerie libre).
2. Rendez-vous : on propose un créneau et un **lieu public** dans une liste suggérée (campus, tiers-lieu, café partenaire, association). Pas d'adresse personnelle demandée par l'appli.
3. Rappel la veille.

### D. Confirmer la remise
1. Sur place, le receveur scanne le **QR code** affiché par le donneur (ou, à défaut, les deux appuient sur « Remise faite »).
2. Une fonction serveur `complete_swap` fait tout en une transaction :
   - débite les crédits bloqués du receveur et crédite le donneur ;
   - passe la pièce du donneur au statut `swapped_out` ;
   - crée une copie de la fiche dans le dressing du receveur (`source = swap`, `origin_garment_id` = pièce d'origine) ;
   - clôt l'annonce.
3. Chacun laisse un **avis** (1 à 5, commentaire facultatif).
4. Le receveur voit sa nouvelle pièce dans Dressing, et elle peut être proposée dans la tenue du jour dès le lendemain.

### E. Problèmes
- **Annulation** avant la remise : crédits débloqués, annonce remise en ligne.
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

1. Onglet Échanges : sous-onglets **Bourse**, **Mes échanges**, **Mes annonces** ; solde de crédits en haut.
2. Proposer à l'échange (formulaire prérempli).
3. Fiche d'une annonce.
4. Échange en cours : état, messagerie, rendez-vous, QR code, bouton de confirmation.
5. Avis après échange.
6. Profil public d'un membre.
7. Règles de la communauté (affichées une fois).
