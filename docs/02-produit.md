# 02 — Produit : écrans, parcours et règles métier

Référence visuelle et logique : `reference/prototype-e-mirror.html` (ouvrir dans un navigateur). Le prototype contient déjà les écrans Aujourd'hui, Dressing, À sortir, Bilan, Achats détectés, Confirmation et Vendre. Cette version ajoute l'onglet **Échanges**.

## Navigation

Barre du bas, 5 onglets :

| Onglet | Rôle | Boucle |
|---|---|---|
| Aujourd'hui | Tenue du jour, bannière « Hier : X pièces à confirmer » | Proposer |
| Dressing | Stock réel : disponible, au lavage ; achats détectés | Capturer, Mettre à jour |
| Échanges | La bourse : pièces proposées par les membres, mes échanges en cours, mes jetons de réclamation | Faire sortir (et entrer) |
| À sortir | Pièces dormantes : remettre en jeu, échanger, vendre, donner | Faire sortir |
| Bilan | Un seul chiffre : la part du dressing portée | Mesurer |

Écrans secondaires (sans barre du bas) : Achats détectés, Qu'as-tu porté hier ?, Vendre, Proposer à l'échange, Fiche d'une annonce, Échange en cours (avec messages), Profil d'un membre, Onboarding.

## Parcours principaux

### 1. Démarrer sans inventaire (onboarding)
1. Créer un compte (lien magique par e-mail).
2. Renseigner ses tailles (haut, bas, pointure) et sa ville. Facultatif, mais nécessaire pour la bourse.
3. Ajouter **15 à 20 pièces portées cette semaine** : photo, catégorie, couleur. Pas tout le dressing.
4. Arriver sur la tenue du jour.

### 2. Tenue du jour (Aujourd'hui)
- Carte avec la **pièce orpheline** (celle qu'on n'a pas portée depuis le plus longtemps) et 1 à 2 **valeurs sûres** pour l'accompagner.
- Actions : « Je porte cette tenue », « Autre proposition », « Pas aujourd'hui ».
- Une fois validée : « Demain matin, tu confirmeras ces pièces d'un geste. »

### 3. Confirmation du lendemain (un geste)
- Bannière « Hier : 3 pièces à confirmer » → écran « Qu'as-tu porté hier ? », pièces précochées.
- « C'est bon » met à jour la date de dernier portage et passe les pièces au lavage selon leur catégorie. « Corriger » permet d'ajouter d'autres pièces.
- **Mode miroir** (simulation) : la confirmation se fait sans geste.

### 4. Dressing
- Grille des pièces, filtres Tout, Disponible, Au lavage. Puces : Disponible, Lavage (jour de retour), Dort (durée).
- Fiche d'une pièce : Mettre au lavage / Déjà propre, La proposer aujourd'hui, Échanger, Vendre, Donner.
- Bannière « X achats détectés, à confirmer » → écran Achats détectés (Ajouter / Ignorer / Tout ajouter). Dans le MVP, l'import automatique est **simulé** (données d'exemple) ; le vrai import d'e-mails est une étape future (RGPD à cadrer).

### 5. À sortir
- Seuil de dormance : 3, 6 ou 12 mois.
- Pour chaque pièce dormante : **Remettre en jeu** (proposée dans la tenue du jour), **Échanger**, **Vendre** (annonce préremplie à copier), **Donner**.
- Une pièce portée quitte la liste d'elle-même.

### 6. Échanges
Voir `03-communaute-echange.md`.

### 7. Bilan
- Anneau : pièces portées / pièces actives sur 3 ou 12 mois glissants.
- Lien vers À sortir.
- Ajout de cette version : une ligne « X pièces remises en circulation par l'échange ».

## Règles métier

Toutes ces règles sont des fonctions pures dans `src/domain/`, avec tests. Les valeurs par défaut sont des choix de l'équipe, à ajuster après les tests utilisateurs.

### Catégories
`tee` (t-shirt, top), `long` (chemise, pull, veste), `pants` (pantalon, jean, jupe), `dress` (robe), `shoes` (chaussures), `outerwear` (manteau), `other`.

### Lavage par défaut
Une pièce confirmée comme portée passe « au lavage » pendant une durée qui dépend de sa catégorie, puis redevient disponible.

| Catégorie | Jours au lavage |
|---|---|
| tee | 3 |
| long | 4 |
| dress | 3 |
| pants, shoes, outerwear, other | 0 (pas de lavage automatique) |

L'utilisateur peut toujours forcer « Mettre au lavage » ou « Déjà propre ».

### Dormance
- Une pièce est **dormante** si elle n'a pas été portée depuis le seuil choisi (par défaut **180 jours** ; options 90, 180, 365).
- Critère ADEME à proposer comme option : pièce acquise depuis plus de 3 mois et portée deux fois au plus (diapositive 7).
- Une pièce sans aucun portage enregistré compte depuis sa date d'ajout.

### Tenue du jour (algorithme du prototype)
1. Candidates : pièces actives, disponibles (pas au lavage), hors chaussures.
2. **Pièce orpheline** = la candidate non portée depuis le plus longtemps.
3. Compléments (« valeurs sûres ») = les pièces les plus récemment portées de la catégorie complémentaire :
   - orpheline haut (`tee`, `long`) → un bas (`pants`) ;
   - orpheline bas → un haut ;
   - orpheline robe → pas de haut ni de bas ;
   - dans tous les cas, une paire de chaussures disponible.
4. « Autre proposition » passe à l'orpheline suivante dans la liste.
5. Plus tard : tenir compte de la météo et de l'agenda (déjà proposé par la concurrence, donc pas prioritaire).

### Indicateur unique
`part portée = pièces actives portées au moins une fois sur la période / pièces actives`, période 90 ou 365 jours.

### Statuts d'une pièce
`active`, `donated`, `sold`, `swapped_out` (sortie par échange), `archived`. Le lavage n'est pas un statut : c'est une date `laundry_until`.

## Hors périmètre du MVP
- Import réel des e-mails et tickets de caisse.
- Miroir physique, capteurs RFID ou NFC.
- Météo et agenda.
- Envoi postal des échanges.
- Publication automatique sur Vinted (pas d'API publique officielle trouvée).
