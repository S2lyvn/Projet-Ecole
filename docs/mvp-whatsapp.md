# Kit du test WhatsApp : la bourse d'échange à l'école

Tester l'échange de vêtements avec de vrais étudiants, sans mettre l'application en ligne. Tu joues le rôle de « concierge » : un formulaire et un tableur font les calculs, et tu fais le lien entre les membres sur WhatsApp.

**Fichiers :** `mvp-whatsapp/e-mirror-test-whatsapp.xlsx` (le tableur, à importer) et `mvp-whatsapp/generer_tableur.py` (le script qui le produit, à relancer seulement si on change sa structure).

## 1. Ce que le test doit prouver

**Question centrale : des étudiants donnent-ils vraiment une pièce, puis reviennent-ils en réclamer une autre ?**

| Ce que le test valide | Ce qu'il ne valide pas |
|---|---|
| L'envie de donner une pièce qui dort | La promesse « ton dressing se tient à jour tout seul » |
| L'intérêt des jetons quand on ne veut rien de la personne en face | La tenue du jour, le lavage, le Bilan |
| La simplicité d'une remise à l'école | Le fonctionnement sans concierge, à grande échelle |
| L'équilibre entre les types de pièces | Une population autre que celle de ton école |

Pour la soutenance : le test valide l'échange, et l'application en mode démo montre le reste.

## 2. Les règles du test

- **1 habit fourni = 1 jeton = 1 habit à réclamer**, quelle que soit la pièce. Les jetons ne s'achètent pas et ne valent pas d'euros.
- **Jeton de lancement :** ta première annonce validée te donne 1 jeton, une seule fois. Sans lui, personne ne pourrait réclamer la toute première pièce. Si tu retires toutes tes annonces, tu le perds.
- **Jeton gagné à la remise :** chaque pièce remise rapporte 1 jeton au donneur.
- **Réclamer :** 1 jeton est bloqué, puis utilisé à la remise. Il est rendu si l'échange est annulé.
- **Limites :** 3 réservations en cours au maximum. Sans remise ni créneau confirmé sous 72 h, la réservation est annulée. Après 2 absences, pas de nouvelle réservation pendant 7 jours.
- **Remises :** en main propre, à l'école, sur les créneaux prévus. Aucune adresse personnelle.
- **Réservé aux 18 ans et plus** (`docs/08-decisions-ouvertes.md`, décision n° 3).

## 3. Mise en place

**À faire dans cet ordre :**

1. **Faire valider le test** par l'école : accord pour les remises sur place, choix du lieu et de deux créneaux par semaine.
2. **Importer le tableur** : dans Google Drive, *Nouveau > Importer un fichier*, choisir `e-mirror-test-whatsapp.xlsx`, l'ouvrir, puis *Fichier > Enregistrer au format Google Sheets*. Travaille ensuite uniquement dans cette version Google Sheets.
3. **Régler la langue :** *Fichier > Paramètres*, région **France**.
4. **Renseigner l'onglet `Réglages` :** ton numéro WhatsApp au format `336XXXXXXXX`, sans `+` ni espace. Ce numéro reçoit toutes les réclamations : si tu ne veux pas utiliser le tien, prends-en un dédié au test.
5. **Créer le Google Form** (section 4), en respectant **exactement** l'ordre des questions.
6. **Relier le formulaire au tableur :** onglet *Réponses* du formulaire, *Associer à Sheets*, *Sélectionner une feuille de calcul existante*. Un nouvel onglet apparaît : **renomme-le exactement `Réponses`**.
7. **Faire le test à sec** (section 10). Ne saute pas cette étape.
8. **Créer le canal WhatsApp :** une communauté où seuls les administrateurs publient dans le groupe d'annonces. **Vérifie avec un autre téléphone ce que les membres voient**, notamment que leurs numéros ne sont pas visibles entre eux.
9. **Épingler les règles** (section 6) et le lien du formulaire.

**Trois règles pour ne pas casser le tableur :**
- Ne trie jamais et ne supprime aucune ligne dans `Réponses` ou `Annonces` pendant le test : chaque ligne d'`Annonces` correspond à la même ligne de `Réponses`. Pour écarter une annonce, change son statut.
- Ne modifie que les colonnes jaune clair.
- Ne change ni l'ordre ni le nombre de questions du formulaire une fois le test lancé.

## 4. Le Google Form « Proposer une pièce »

Laisse **désactivée** l'option de collecte des adresses e-mail : elle ajouterait une colonne et décalerait tout.

| Colonne | Question | Type | Obligatoire |
|---|---|---|---|
| B | Ton prénom et l'initiale de ton nom | Réponse courte | Oui |
| C | Ton numéro WhatsApp | Réponse courte | Oui |
| D | Nom de la pièce (ex. Pull marin rayé) | Réponse courte | Oui |
| E | Catégorie | Liste : `T-shirt, top` / `Chemise, pull, veste` / `Pantalon, jean, jupe` / `Robe` / `Chaussures` / `Manteau` / `Autre` | Oui |
| F | Taille | Réponse courte | Oui |
| G | État | Liste : `Neuf avec étiquette` / `Très bon état` / `Bon état` / `État satisfaisant` | Oui |
| H | Un mot sur la pièce, défauts compris | Réponse longue | Non |
| I | Une photo de la pièce | Importation de fichier, 1 image | Oui |
| J | Tes engagements | Cases : `La pièce est propre` / `J'ai signalé les défauts`, avec au moins 2 cases à cocher | Oui |
| K | Pour participer | Cases : `J'ai 18 ans ou plus` / `J'accepte les règles et la note sur mes données`, avec au moins 2 cases à cocher | Oui |

La colonne A (date) est ajoutée par Google. Les libellés des listes doivent rester identiques : le tableau de l'onglet `Mesures` les utilise. Mets la note sur les données (section 6) dans la description du formulaire.

**Plan B pour la photo :** l'importation de fichier oblige à se connecter avec un compte Google. Si cela bloque des participants, remplace cette question, **au même endroit**, par une réponse courte « Tu m'enverras la photo sur WhatsApp : écris OK ».

## 5. Le travail du concierge au quotidien

L'onglet `Annonces` numérote les pièces et prépare les messages. L'onglet `Membres` recalcule les jetons tout seul : **il n'y a jamais de solde à modifier à la main**.

| Ce qui arrive | Ce que tu fais dans `Annonces` | Ce que tu fais sur WhatsApp |
|---|---|---|
| Nouvelle réponse au formulaire | Si tout va bien : Statut = `En ligne`. Sinon : `Refusée` | Copie la colonne *Message à publier* et publie-la avec la photo (message A) |
| « Je réclame #P012 » | Vérifie dans `Membres` : au moins 1 jeton disponible, moins de 3 réservations. Puis Statut = `Réservée`, choisis le Receveur, ajoute la date de réservation | Message B au receveur, message C au donneur, message D dans le canal. Sans jeton : message E |
| Pièce déjà réservée | Rien | Message F |
| Remise faite (tu confirmes sur place) | Statut = `Remise`, ajoute la date de remise | Message G aux deux membres |
| Annulation, ou 72 h sans créneau confirmé | Statut = `En ligne`, efface le Receveur et la date, ajoute 1 dans *Annulations* | Message H, et republie l'annonce si besoin |
| Absence au rendez-vous | Comme une annulation, mais ajoute 1 dans *Absences* | Message I. Après 2 absences : plus de réservation pendant 7 jours |
| Pièce refusée à la remise | Statut = `Retirée`, efface le Receveur | Message H au receveur. Le donneur reprend sa pièce |
| Le donneur retire sa pièce | Statut = `Retirée` | Aucun message si elle n'était pas réservée |

**La colonne *Contrôle*** et la colonne *Alerte* de `Membres` passent en orange s'il y a une anomalie : jetons insuffisants, receveur manquant, même personne des deux côtés, trop de réservations.

**Sur le créneau de remise :** sois présent, avec la liste des remises du jour. Les membres n'ont pas besoin d'échanger leur numéro : tu les présentes par leur prénom.

## 6. Les textes à copier

**Règles à épingler dans le canal :**

> **Bienvenue dans la bourse d'échange !** Ici, on fait circuler les vêtements qui dorment.
>
> 1 habit donné = 1 jeton = 1 habit à réclamer, chez n'importe quel membre, quand tu veux.
>
> Pour commencer : propose une pièce avec ce formulaire : [LIEN]. Ta première annonce validée te donne 1 jeton.
> Pour réclamer : touche le lien sous une annonce et envoie le message. Premier arrivé, premier servi.
> Pour la remise : [LIEU], [JOURS ET HEURES]. Tu gagnes 1 jeton dès que ta pièce est remise.
>
> Nos règles : des pièces propres, des défauts signalés, du respect, et on prévient si on ne peut pas venir. Les jetons ne s'achètent pas et ne valent pas d'euros. Réservé aux 18 ans et plus.
>
> C'est un test de projet d'école : il dure jusqu'au [DATE].

**Note sur les données** (modèle à faire relire par un enseignant, ceci n'est pas un avis juridique) :

> Ce test est organisé par [NOMS], dans le cadre du projet e-mirror à [ÉCOLE]. Nous utilisons ton prénom, ton numéro WhatsApp, les informations et la photo de ta pièce uniquement pour organiser les échanges et mesurer le test. Ton numéro reste visible des seuls organisateurs. Nous partageons avec les autres membres ton prénom, la photo et la description de la pièce. Toutes ces données sont supprimées au plus tard le [DATE]. Pour les consulter, les corriger ou les faire supprimer plus tôt : [CONTACT].

**Messages types :**

- **A. Annonce :** colonne *Message à publier*, avec la photo.
- **B. Réservation confirmée :** « C'est réservé pour toi ! Ton jeton est bloqué jusqu'à la remise. Rendez-vous [JOUR, HEURE] à [LIEU]. Tu confirmes ? »
- **C. Prévenir le donneur :** « Ta pièce #P012 est réclamée ! Remise [JOUR, HEURE] à [LIEU]. Tu confirmes ? Tu gagnes 1 jeton dès qu'elle est remise. »
- **D. Dans le canal :** « #P012 est réservée. »
- **E. Pas de jeton :** « Tu n'as pas de jeton disponible pour l'instant. Propose une pièce ici : [LIEN]. Tu en gagnes un à ta première annonce validée, puis à chaque remise. »
- **F. Déjà réservée :** « Quelqu'un a été plus rapide ! Si l'échange est annulé, l'annonce reviendra dans le canal. »
- **G. Remise faite :** « C'est fait, merci ! » Au donneur : « Tu as gagné 1 jeton : réclame une pièce quand tu veux. » Au receveur : « Ton jeton a été utilisé. Bonne continuation à cette pièce ! »
- **H. Annulation :** « L'échange est annulé. Ton jeton t'a été rendu. »
- **I. Absence :** « On ne t'a pas vu à la remise. Ton jeton t'a été rendu. Pense à prévenir la prochaine fois : après 2 absences, on ne peut plus réserver pendant 7 jours. »

## 7. Mesurer le test

L'onglet `Mesures` calcule tout seul les chiffres ci-dessous. **Fixe tes seuils avec l'équipe avant le lancement et note-les dans la colonne prévue**, pour ne pas les choisir après avoir vu les résultats. Tiens à jour le nombre d'inscrits dans `Réglages`.

| Hypothèse à vérifier | Mesure principale | Seuil fixé avant le test |
|---|---|---|
| Les gens acceptent de donner | Part des inscrits qui proposent une pièce | |
| Les pièces intéressent | Part des pièces publiées qui ont été remises, jours avant réservation | |
| Le jeton donne envie de revenir | Part des donneurs qui ont aussi reçu une pièce, jetons non utilisés | |
| La remise est simple | Jours avant remise, annulations, absences | |
| Le système reste équilibré | Part remise par catégorie (décision n° 13 de `docs/08`) | |

**À lire avec prudence :** avec quelques dizaines de participants de la même école, les résultats donnent une tendance, pas une preuve. Note aussi ce que tu observes : questions répétées, raisons des abandons, temps passé à gérer le test.

## 8. Questionnaire de fin de test

À envoyer à tous les inscrits, y compris ceux qui n'ont rien fait :

1. As-tu proposé une pièce ? Si non, qu'est-ce qui t'a retenu ?
2. As-tu réclamé une pièce ? Si non, pourquoi ?
3. Sur 1 à 5, le principe « 1 habit = 1 jeton » était-il clair ?
4. Sur 1 à 5, trouves-tu juste qu'un manteau vaille autant qu'un t-shirt ? Pourquoi ?
5. Sur 1 à 5, la remise à l'école était-elle pratique ? Qu'est-ce qui t'aurait aidé ?
6. Sans ce test, qu'aurais-tu fait de la pièce donnée ? (gardée, vendue, donnée, jetée, autre)
7. Grâce à la pièce reçue, as-tu évité un achat ? (oui, non, je ne sais pas)
8. Continuerais-tu si la bourse restait ouverte ? (oui, peut-être, non) Qu'est-ce qui te ferait changer d'avis ?
9. Le ferais-tu avec des membres d'une autre école ou de ta ville ?
10. Un commentaire ?

**Entretiens courts (5 à 8 personnes), en mélangeant actifs et inactifs :** raconte-moi la dernière pièce que tu as donnée ou réclamée. Qu'est-ce qui t'a surpris ? À quel moment as-tu hésité ? Sur quoi as-tu failli abandonner ?

## 9. Calendrier conseillé

Pour 30 à 50 volontaires, sur 4 semaines. C'est un ordre de grandeur à adapter.

| Quand | Quoi |
|---|---|
| Semaine -2 | Accord de l'école, tableur, formulaire, test à sec, seuils fixés |
| Semaine -1 | Recrutement. Demande à quelques volontaires de publier en avance : le canal ne doit pas ouvrir vide |
| Semaine 1 | Ouverture des réclamations, premières remises. Note tout ce qui bloque |
| Semaines 2 et 3 | Rythme normal. Publie de nouvelles annonces régulièrement, et relance les membres qui ont un jeton non utilisé |
| Semaine 4 | Dernières remises, puis questionnaire et entretiens |
| Après | Analyse par rapport aux seuils, puis suppression des données à la date annoncée |

**Si le rythme devient trop lourd à gérer,** ne cherche pas à automatiser WhatsApp : regroupe tes publications à des heures fixes. La charge de travail du concierge est elle-même un résultat du test.

## 10. Test à sec, avant le lancement

Le tableur n'a pas pu être essayé dans Google Sheets au moment de sa création : **ce test est donc indispensable**.

Remplis deux fois le formulaire :
- **Léa T.**, `06 12 34 56 78`, *T-shirt test* ;
- **Tom T.**, `+33 7 11 22 33 44`, *Pull test*.

| Étape | Résultat attendu |
|---|---|
| Après les 2 réponses | `Annonces` montre `P001` et `P002`, avec les numéros `33612345678` et `33711223344`. `Membres` montre `Léa T. · 5678` et `Tom T. · 3344`, à 0 jeton disponible |
| `P001` et `P002` passent `En ligne` | Léa et Tom ont 1 jeton de lancement et 1 disponible |
| Ouvrir le lien du *Message à publier* de `P002` | WhatsApp ouvre une discussion avec ton numéro, message prérempli : « Je réclame #P002 » |
| `P002` passe `Réservée`, Receveur = Léa | Léa : 1 bloqué, 0 disponible |
| `P002` passe `Remise` | Léa : 1 utilisé, 0 bloqué, 0 disponible. Tom : 1 gagné, 2 disponibles. `Mesures` : 2 pièces publiées, 1 remise, 50 % |
| `P002` repasse `Réservée` avec Receveur = Tom | *Contrôle* affiche « Même personne » |

Si un résultat diffère, ou si des cellules affichent une erreur, ne lance pas le test : envoie-moi une capture et je corrigerai le tableur.

**Pour repartir à zéro :** supprime les réponses du formulaire, supprime les lignes de test dans `Réponses`, puis vide les colonnes jaune clair d'`Annonces`.

## 11. Pourquoi pas un robot WhatsApp ?

- **Offre officielle :** l'envoi automatique dans des groupes semble réservé à certains comptes professionnels et limité à de petits groupes. Les messages individuels demandent un compte Meta vérifié et certains sont payants. À revérifier sur la documentation de Meta si le sujet revient.
- **Robots non officiels :** ils exposent le numéro à un bannissement en plein test.
- **Pour ce test :** le concierge coûte moins cher et t'apprend davantage, car tu vois où les gens hésitent.

Si le test fonctionne, la suite logique est l'étape 3 de `docs/07-feuille-de-route.md`, et non un robot.
