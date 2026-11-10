# Mettre la vitrine DeepIn Armour sur systeme.io

Ce guide reconstruit la page vitrine dans systeme.io, pour que systeme.io compte les visites et les inscriptions. Tout se fait dans l'éditeur de systeme.io, sans code, pour que l'équipe puisse tout modifier plus tard (textes, images, quiz).

Chaque bloc gris est à copier-coller tel quel. Les images sont dans le dossier [`images/`](images/).

> Les noms de menus viennent de l'aide de systeme.io (souvent en anglais). Si ton interface est en français, cherche l'équivalent : *Form* = Formulaire, *Survey* = Sondage, *Raw HTML* = HTML brut, *Funnel* = Tunnel.

---

## 1. Ce qu'on construit

Un **tunnel de vente** (funnel) avec deux pages :

| Étape | Type d'étape | Rôle |
|---|---|---|
| 1. Vitrine | Page de capture (*Opt-in page*) | La page publique. Elle contient le formulaire d'inscription, donc systeme.io compte les visites **et** les inscrits |
| 2. Merci | Page de remerciement (*Thank you page*) | S'affiche après l'inscription |

Le bouton « Essayer la démo » renvoie vers l'appli, qui reste sur GitHub :

```
https://s2lyvn.github.io/Projet-Ecole/app/
```

---

## 2. Créer le tunnel

1. **Tunnels** → **Créer** → nom :

```
DeepIn Armour – Vitrine
```

2. Ajoute l'étape 1, type **Page de capture**, nom et chemin d'URL :

```
vitrine
```

3. Ajoute l'étape 2, type **Page de remerciement**, nom et chemin :

```
merci
```

4. Pour chaque page, choisis un **modèle vide** (blank) : on construit tout nous-mêmes.

### Réglages de la page Vitrine (onglet Réglages / SEO)

Titre de la page (onglet du navigateur) :

```
DeepIn Armour : la pièce que tu avais oubliée
```

Description (Google et partages) :

```
Chaque matin, DeepIn Armour te propose la pièce que tu as oubliée. Ton dressing se tient à jour sans inventaire. Projet d'école, Clermont School of Business.
```

Visibilité sur les moteurs de recherche : **non visible** tant que c'est un projet d'école (tu pourras l'ouvrir plus tard).

---

## 3. Couleurs et polices

À reprendre dans l'éditeur pour garder le style de la vitrine actuelle.

| Usage | Couleur |
|---|---|
| Texte principal (encre indigo) | `#1C1A33` |
| Texte secondaire | `#5E5A48` |
| Bouton principal, bande d'action (or) | `#F2B400` |
| Texte sur le bouton or | `#1C1A33` |
| Fond de la section « problème » (doré pâle) | `#FCF1CC` |
| Grand chiffre « ≈ 50 % » | `#8A5A00` |
| Bouton sombre (dans la bande or) | fond `#1C1A33`, texte `#FFD54A` |
| Fond de page | `#FFFFFF` |

Polices : **Bricolage Grotesque** (gras) pour les titres, **DM Sans** pour le texte. Si systeme.io ne les propose pas, prends une police sans empattement proche (par exemple *Poppins* pour les titres et *Inter* pour le texte).

Boutons : coins arrondis (environ 16 px), texte en gras.

---

## 4. La page Vitrine, section par section

Pour chaque section : ajoute une **section**, puis les éléments dans l'ordre indiqué.

### Section 1 · Accroche (fond blanc)

**Texte** (petit, en gras, en haut à gauche, sert de logo) :

```
DeepIn Armour
```

**Titre** (H1, très grand, gras) :

```
On déclare 78 vêtements. Le placard en cache 172.
```

> Astuce : souligne « 172 » en jaune (`#FFD54A`) si l'éditeur le permet.

**Texte** (taille normale, couleur secondaire) :

```
Chaque matin, DeepIn Armour te propose la pièce que tu as oubliée. Ton dressing se tient à jour sans inventaire.
```

**Bouton 1** (or) :

```
Essayer la démo
```

Action : ouvrir l'URL ci-dessous, **dans un nouvel onglet**.

```
https://s2lyvn.github.io/Projet-Ecole/app/
```

**Bouton 2** (contour, fond transparent) :

```
Être prévenu du lancement
```

Action : **ancre** vers la section 6 (le formulaire). Voir [comment créer une ancre](https://help.systeme.io/article/258-how-to-set-up-an-anchor).

**Texte** (petit, gris) :

```
Source : ADEME, 2024.
```

**Image** : `images/vitrine-dressing-exemple.png`

Texte alternatif de l'image :

```
Un dressing d'exemple : 6 pièces sur 11 dorment depuis 3 mois ou plus.
```

### Section 2 · Le problème (fond `#FCF1CC`)

**Titre** (très grand, couleur `#8A5A00`) :

```
≈ 50 %
```

**Titre** (H2) :

```
du stock des dressings dort au fond du placard.
```

### Section 3 · Tenue du jour (2 colonnes : texte à gauche, image à droite)

**Titre** (H2) :

```
Chaque matin, une pièce que tu avais oubliée.
```

**Texte** :

```
La tenue du jour part de la pièce que tu portes le moins, avec une ou deux valeurs sûres.
```

**Texte** (liste en 3 lignes, le début de chaque ligne en gras) :

```
Jour 1 : 15 à 20 pièces portées cette semaine, pas d'inventaire.
Chaque matin : une pièce oubliée, un bouton pour la porter.
Le lendemain : un geste pour confirmer.
```

**Image** (colonne de droite) : `images/vitrine-tenue-du-jour.png`

Texte alternatif :

```
Écran Tenue du jour de l'appli : une robe grise pas portée depuis 14 mois, avec des baskets blanches.
```

### Section 4 · Bourse d'échange (2 colonnes : image à gauche, texte à droite)

**Image** (colonne de gauche) : `images/vitrine-echanges.png`

Texte alternatif :

```
Écran Échanges de l'appli : un jeton, et trois pièces proposées par des membres fictifs.
```

**Titre** (H2) :

```
Ce qui dort chez toi peut vivre chez quelqu'un d'autre.
```

**Texte** :

```
Tu donnes une pièce, tu en réclames une autre. Pas d'argent, pas de négociation.
```

**Texte** (liste en 3 lignes, la première en gras) :

```
1 habit donné = 1 jeton = 1 habit à réclamer.
Remise en main propre, dans un lieu public.
La pièce arrive dans ton dressing avec sa fiche remplie.
```

**Texte** (petit, gris) :

```
Membres et annonces fictifs.
```

### Section 5 · Quiz (à ajouter plus tard)

Laisse cette place libre pour l'instant. Le quiz se fera avec l'élément **Survey**, voir la [partie 7](#7-le-quiz-plus-tard).

### Section 6 · Action et inscription (fond or `#F2B400`)

Donne à cette section l'ancre :

```
liste
```

**Titre** (H2, encre `#1C1A33`) :

```
Quelle pièce as-tu oubliée ?
```

**Texte** :

```
Ouvre la démo, regarde la tenue du jour, essaie la bourse. Pas de compte à créer.
```

**Bouton** (sombre : fond `#1C1A33`, texte `#FFD54A`) :

```
Essayer la démo
```

Action : nouvel onglet vers

```
https://s2lyvn.github.io/Projet-Ecole/app/
```

**Titre** (H3) :

```
Préviens-moi au lancement
```

**Texte** :

```
Un seul e-mail, le jour où l'appli ouvre. Pas de newsletter.
```

**Formulaire** : ajoute l'élément **Form**, puis dedans :

1. Un **champ** de type **Email**, obligatoire. Texte d'exemple (placeholder) :

```
ton.adresse@exemple.fr
```

2. Une **case à cocher**, obligatoire et **non cochée par défaut** :

```
J'accepte que l'équipe DeepIn Armour garde mon adresse pour m'écrire au lancement. Elle est supprimée à la fin du projet.
```

3. Le **bouton** d'envoi (fond `#1C1A33`, texte `#FFD54A`) :

```
M'inscrire
```

Onglet **Actions** du formulaire :
- Redirection : vers la page **merci** (étape 2).
- Automatisation : **ajouter le tag** ci-dessous (pour compter les inscrits et leur écrire au lancement).

```
liste-attente
```

- Double opt-in : **non** (plus simple pour un test, et pas obligatoire en France).

**Texte** (petit) :

```
Le dressing et les membres de la démo sont des exemples, la bourse est simulée.
```

### Section 7 · Bas de page (fond blanc, texte petit et gris)

**Titre** (petit, gras) :

```
Source
```

**Texte** :

```
ADEME, « Analyse des pratiques liées aux achats de produits d'habillement », enquête en ligne auprès de 4 000 personnes de 16 à 75 ans, avril 2024. Environ 50 % de stock dormant et 78 pièces déclarées contre 172 constatées : diapositive 6.
```

**Texte** (remplace `[CONTACT]` par l'e-mail de l'équipe) :

```
DeepIn Armour est un projet d'école (Clermont School of Business). Le dressing, les membres et les annonces de la démo sont des exemples. Ton adresse e-mail sert uniquement à te prévenir du lancement. Pour la consulter ou la faire supprimer : [CONTACT].
```

---

## 5. La page Merci

**Titre** (H1) :

```
C'est noté !
```

**Texte** :

```
On t'écrit le jour où DeepIn Armour ouvre, et seulement pour ça.
```

**Texte** :

```
En attendant, la démo est ouverte, sans compte à créer.
```

**Bouton** (or), nouvel onglet vers l'appli :

```
Essayer la démo
```

```
https://s2lyvn.github.io/Projet-Ecole/app/
```

**Texte** (petit) :

```
Tu connais quelqu'un dont le placard déborde ? Envoie-lui cette page.
```

---

## 6. E-mail de bienvenue (facultatif)

Dans **Automatisations** → **Règles** : déclencheur « tag ajouté : `liste-attente` » → action « envoyer un e-mail ».

Objet :

```
Tu es sur la liste DeepIn Armour
```

Message :

```
Bonjour,

Merci de ton inscription. On te préviendra le jour où DeepIn Armour ouvre, et c'est le seul e-mail que tu recevras de notre part.

En attendant, la démo est ouverte, sans compte à créer : https://s2lyvn.github.io/Projet-Ecole/app/

Chaque matin, une pièce que tu avais oubliée.

L'équipe DeepIn Armour
Projet d'école, Clermont School of Business
```

---

## 7. Le quiz (plus tard)

systeme.io a un élément **Survey** (sondage) : on le glisse sur la page, on écrit les questions et les réponses, et chaque réponse peut ajouter un **tag** au contact ([aide systeme.io](https://help.systeme.io/article/1398-how-to-use-the-survey-element)). À la dernière étape, le visiteur doit **donner son e-mail** : le quiz est donc aussi un moyen de s'inscrire.

Voici un **brouillon** à valider en équipe. Les tags permettent ensuite de compter les réponses (Contacts → filtrer par tag).

**Titre du quiz** :

```
Ton dressing dort-il ?
```

**Question 1** : Combien de vêtements penses-tu avoir ?

| Réponse | Tag |
|---|---|
| Moins de 50 | `quiz-stock-moins-50` |
| De 50 à 100 | `quiz-stock-50-100` |
| De 100 à 200 | `quiz-stock-100-200` |
| Plus de 200 | `quiz-stock-plus-200` |
| Aucune idée | `quiz-stock-inconnu` |

**Question 2** : Le matin, tu choisis ta tenue…

| Réponse | Tag |
|---|---|
| En deux minutes, souvent les mêmes pièces | `quiz-matin-routine` |
| Après en avoir essayé plusieurs | `quiz-matin-hesite` |
| La veille au soir | `quiz-matin-veille` |

**Question 3** : Une pièce que tu n'as pas mise depuis plus de 6 mois…

| Réponse | Tag |
|---|---|
| Je sais exactement laquelle | `quiz-dormant-sait` |
| J'en ai plusieurs en tête | `quiz-dormant-plusieurs` |
| Je ne sais pas, c'est bien le problème | `quiz-dormant-oublie` |

**Question 4** : Les vêtements que tu ne portes plus, tu…

| Réponse | Tag |
|---|---|
| Les gardes « au cas où » | `quiz-sortie-garde` |
| Les vends (Vinted…) | `quiz-sortie-vend` |
| Les donnes | `quiz-sortie-donne` |
| Les jettes | `quiz-sortie-jette` |

**Question 5** : Échanger une pièce contre une autre, sans argent, avec quelqu'un près de chez toi ?

| Réponse | Tag |
|---|---|
| Carrément | `quiz-echange-oui` |
| Pourquoi pas | `quiz-echange-peut-etre` |
| Non merci | `quiz-echange-non` |

**Dernière étape** (e-mail) :

```
Reçois ton résultat et sois prévenu·e du lancement de DeepIn Armour.
```

> À trancher avant de publier le quiz : ce qu'on affiche comme « résultat », et si les réponses au quiz doivent aussi ajouter le tag `liste-attente`.

---

## 8. Publier et partager

1. Publie le tunnel. systeme.io donne une adresse du type `https://ton-sous-domaine.systeme.io/vitrine` : c'est **ce lien-là** qu'il faut partager (WhatsApp, Instagram, affiche), pas le lien GitHub, sinon systeme.io ne compte pas les visites.
2. Vérifie la page publiée sur ton téléphone. L'aperçu de l'éditeur ne montre pas tout.
3. Fais une inscription de test avec ta propre adresse, puis supprime ce contact pour ne pas fausser les chiffres.

## 9. Lire les chiffres

- **Tunnels** → *DeepIn Armour – Vitrine* → **Statistiques** : pages vues, inscriptions et taux d'inscription, étape par étape.
- **Contacts** : filtre par tag `liste-attente` pour le nombre d'inscrits, et par tags `quiz-…` pour les réponses au quiz.

Fixez en équipe, **avant** de lancer la diffusion, le taux d'inscription qui voudra dire « l'idée intéresse » (comme pour le test WhatsApp).

## 10. Ce qui se modifie facilement plus tard

| À changer | Où |
|---|---|
| Un texte, un titre, une couleur | Directement dans l'éditeur de la page |
| Une image | Remplacer l'image dans l'élément Image |
| Le lien de la démo | Les boutons « Essayer la démo » (section 1, section 6, page Merci) |
| Le quiz | Élément Survey, réglages → modifier les questions |
| Ajouter une section | Ajouter une section dans l'éditeur, puis la glisser à sa place |

Ce que la page systeme.io ne reprend pas : l'ouverture animée du placard et les écrans qu'on peut essayer dans la page. Ils restent sur la vitrine GitHub et dans l'appli de démo, accessibles par le bouton « Essayer la démo ».

## Images disponibles

| Fichier | Où l'utiliser |
|---|---|
| `images/vitrine-dressing-exemple.png` | Section 1 |
| `images/vitrine-tenue-du-jour.png` | Section 3 |
| `images/vitrine-echanges.png` | Section 4 |
| `images/app-aujourdhui.png`, `app-dressing.png`, `app-echanges.png`, `app-a-sortir.png`, `app-bilan.png` | En bonus, par exemple dans un carrousel (élément *Carousel*) |
