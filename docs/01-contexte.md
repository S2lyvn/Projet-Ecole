# 01 — Contexte du projet

Projet d'entrepreneuriat (master, Clermont School of Business). Nom de code : **e-mirror**. Le nom définitif de l'application n'est pas choisi (voir `08-decisions-ouvertes.md`).

## Problématique

Version fusionnée proposée le 26 octobre 2026, à valider avec le professeur :

> Comment aider chacun à s'habiller chaque matin avec ce qu'il possède vraiment, sans rien avoir à saisir ni à déclarer ?

Historique : la première problématique portait sur le choix de la tenue du matin (agenda, météo, style). Le 26 octobre, l'équipe l'a recentrée sur la **garde-robe sous-utilisée**, puis a appliqué la méthode Océan Bleu.

## Le problème en chiffres

Source : ADEME, « Analyse des pratiques liées aux achats de produits d'habillement », enquête en ligne auprès de 4 000 personnes de 16 à 75 ans, du 15 au 30 avril 2024 (diapositive 3). Numéros de diapositive lus dans le texte extrait du PDF, à contrôler à l'ouverture.

- **Environ 50 % de stock dormant** (titre de la diapositive 6). À utiliser à la place du « 70 % » de la synthèse d'équipe, qui n'a pas de source.
- **78 pièces déclarées contre 172 constatées** lors des revues de placards (diapositive 6) : on sous-estime son propre dressing.
- **44 % possèdent au moins une pièce quasi neuve** (achetée il y a plus de 3 mois, portée deux fois au plus), 6 pièces en moyenne par personne concernée (diapositive 7).
- **35 % jugent leur stock de vêtements excessif** (diapositive 8).
- **31 % des acheteurs d'enseignes de type fast fashion** ont regretté un achat jamais ou à peine porté sur 12 mois (diapositive 13).

## Personas

Définis par l'équipe, utilisés dans le TAM/SAM/SOM du 14 octobre 2026 :

- **Emma**, 25 ans, jeune femme active (travail, sport, sorties).
- **Jeune homme actif**, 25-34 ans.
- **Mère de famille** et **père de famille** : gèrent aussi les vêtements des enfants, manquent de temps le matin.

Un guide d'entretien de 15 minutes existe pour le persona Emma.

## Marché (en nombre de personnes)

Détail et sources : document `claude/tam-sam-som-miroir.md` du projet Claude et tableau de bord TAM/SAM/SOM.

| Niveau | Personnes | Définition |
|---|---|---|
| TAM | ≈ 6,21 milliards | Monde, 15 ans et plus |
| SAM | ≈ 45,2 millions | France, 15 ans et plus, concernés par au moins 1 des 4 sujets |
| SOM | ≈ 17,8 millions | SAM recoupé avec les personas (Emma, jeune homme actif, mères, pères) |

Point à refaire : le sujet « garde-robe trop grande » (35 % × 57 854 000 = 20 248 900 personnes) devient le sujet central ; le recoupement du SAM est à recalculer autour de lui.

## Stratégie Océan Bleu (26 octobre 2026)

Les applis de dressing existantes (Whering, Acloset, Indyx, Cladwell) se battent sur la suggestion de tenues et les statistiques. Elles laissent toutes **manuelle la déclaration de ce qu'on porte**. C'est là que se trouve l'espace libre.

### Grille ERRC mise à jour avec la communauté d'échange

| Éliminer | Réduire | Augmenter | Créer |
|---|---|---|---|
| Le fil d'inspiration sociale (posts, likes, influence) | La saisie initiale : démarrer avec 15 à 20 pièces | La fiabilité du stock réel : propre, au lavage, disponible | La détection passive du portage |
| La capsule minimaliste imposée | La déclaration quotidienne : un geste | L'activation des pièces dormantes | La pièce orpheline du jour |
| | Les tableaux de bord : un seul indicateur | La décision de sortie assistée | Le déclencheur automatique de la sortie |
| | | | **La bourse d'échange entre membres** : la pièce arrive déjà décrite dans le dressing de celui qui la reçoit |

**Changement par rapport au document Océan Bleu** : la grille d'origine éliminait « la communauté et l'inspiration sociale ». La communauté ajoutée ici est différente : ce n'est pas un réseau social, c'est un service utile à l'étape « Faire sortir ». On garde l'élimination du fil d'inspiration, on crée la bourse d'échange. À présenter comme un choix assumé de l'équipe.

### Ce qui différencie l'échange

- **Vinted ne permet pas le troc** : chaque transaction passe par un paiement, car sa protection acheteur repose sur une transaction en argent (source tierce : blog Fripio, 2026 ; à confirmer sur l'aide de Vinted).
- Le troc de vêtements existe surtout hors ligne : trocantes, « free troc parties », associations. En ligne, Nuw (Royaume-Uni) propose d'emprunter et d'échanger ; KidiTroc (2011) échangeait des lots de vêtements d'enfants contre des points.
- **Notre angle** : l'échange est relié au dressing. La pièce proposée est une pièce dormante détectée par l'appli, et elle arrive chez le receveur avec sa fiche déjà remplie (photo, catégorie, taille, couleur). Zéro saisie des deux côtés.

## Le miroir

Décision recommandée (option A du document Océan Bleu) : **l'application d'abord**. Le miroir sans caméra devient un point de contact du matin, testé plus tard. Un miroir de dressing connecté existe déjà (HEYMIRROR, CES 2026), et Amazon a arrêté Echo Look en 2020. Dans l'application, un interrupteur « mode miroir » peut simuler la détection automatique pour la démonstration.
