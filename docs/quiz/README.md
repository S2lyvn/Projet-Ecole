# Quiz de présentation : mode d'emploi

Une page à part, seulement pour le quiz (les 5 questions du document du groupe « Quizz et questions »), pour mesurer en direct pendant la présentation. Elle n'est reliée ni à la vitrine ni à l'appli.

| Page | Adresse (une fois en ligne) | Pour qui |
|---|---|---|
| Le quiz | `https://s2lyvn.github.io/Projet-Ecole/quiz/?src=presentation` | Le public, sur son téléphone (QR code) |
| Les résultats en direct | `https://s2lyvn.github.io/Projet-Ecole/quiz/resultats.html` | Vous, à projeter pendant la présentation |
| Le détail des réponses | Votre Google Sheet | L'équipe, après la présentation |

Les réponses arrivent dans un **Google Sheet** : une ligne par personne, mise à jour au fil du quiz (début, fin, intérêt pour l'appli). C'est anonyme : aucun nom, aucun e-mail.

Fichiers : `public/quiz/` (les pages), `docs/quiz/apps-script.gs` (le script à coller dans Google).

---

## 1. Créer le Google Sheet qui reçoit les réponses (5 minutes, une seule fois)

1. Ouvre [sheets.new](https://sheets.new) avec ton compte Google. Nomme le fichier `Quiz DeepIN Armour – réponses`.
2. Menu **Extensions › Apps Script**. Un éditeur de code s'ouvre.
3. Efface tout le contenu, colle tout le fichier [`apps-script.gs`](apps-script.gs), puis clique sur **Enregistrer** (icône disquette).
4. En haut à droite : **Déployer › Nouveau déploiement**.
   - Roue dentée à côté de « Sélectionner le type » › **Application Web**.
   - Description : `quiz`
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde** (sinon le public ne peut pas envoyer ses réponses)
5. **Déployer**. Google demande d'autoriser l'accès : choisis ton compte. S'il affiche « Google n'a pas validé cette application », clique sur **Paramètres avancés › Accéder à … (non sécurisé)** : c'est normal, c'est ton propre script.
6. Copie l'**URL de l'application Web** (elle finit par `/exec`).

L'onglet `Réponses` se crée tout seul à la première réponse.

## 2. Brancher le quiz sur ce Google Sheet

Ouvre `public/quiz/config.js` et colle l'adresse entre les guillemets :

```js
window.QUIZ_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/……/exec',
}
```

Cette adresse n'est pas un secret : elle permet seulement d'ajouter des réponses et de lire les totaux.

## 3. Mettre en ligne

Le quiz part avec le reste du site sur GitHub Pages : commit puis push sur `main`. Le déploiement prend 1 à 2 minutes (onglet *Actions* du dépôt).

## 4. Tester avant le jour J

1. Ouvre la page des résultats en ajoutant `?src=test` à l'adresse : `…/quiz/resultats.html?src=test`.
2. Scanne le QR code avec ton téléphone et fais le quiz.
3. Ta réponse apparaît en moins de 10 secondes sur la page des résultats, et dans le Google Sheet.
4. Dans le Google Sheet, supprime les lignes de test (ou garde-les : elles ont la source `test` et ne se mélangent pas avec `presentation`).

Pour répéter la présentation sans vraies réponses : `…/quiz/resultats.html?demo=1` affiche des données d'exemple (marquées « Données d'exemple »).

## 5. Le jour de la présentation

- Projette `…/quiz/resultats.html` (plein écran : touche F11 sous Windows, Ctrl+Cmd+F sur Mac). Elle montre le QR code et se met à jour toute seule toutes les 5 secondes.
- Par défaut elle compte seulement les réponses venues du QR code de la présentation (`src=presentation`). Le menu en haut à droite permet de voir toutes les sources.
- Si le Wi-Fi d'un téléphone coupe, ses réponses sont gardées et renvoyées dès que la connexion revient.

Une autre occasion (salon, cours, réseaux sociaux) ? Change la source dans le lien : `…/quiz/?src=salon`, et la page de résultats `…/quiz/resultats.html?src=salon` (le QR code suit).

## 6. Récupérer les réponses

- **Pendant la présentation** : la page de résultats (totaux, répartitions, score moyen, intérêt pour l'appli).
- **Après** : le Google Sheet, onglet `Réponses`. Une ligne par personne :

| Colonne | Contenu |
|---|---|
| `id` | Identifiant anonyme tiré au hasard |
| `maj` | Date et heure de la dernière mise à jour |
| `source` | D'où vient la personne (`presentation`, `test`, `direct`…) |
| `etape` | `debut` (a commencé), `termine` (a vu son résultat), `interet` (a aussi répondu à la question finale) |
| `taille` … `dons` | Les réponses aux 5 questions (`raisons` : choix séparés par « ; ») |
| `score`, `pct_dormant`, `pieces_dormantes` | Le résultat affiché à la personne |
| `interet` | Réponse à « Une appli qui t'aide à faire tout ça, tu l'utiliserais ? » |

Pour des graphiques : *Insertion › Graphique* dans le Sheet, ou *Données › Tableau croisé dynamique*. Pour un fichier : *Fichier › Télécharger › Microsoft Excel* ou *CSV*.

Mesures utiles pour la soutenance : taux de complétion (`termine` + `interet`) ÷ toutes les lignes ; part de « Oui, carrément » ; part de personnes qui portent moins de 60 % de leurs pièces.

## Le calcul du résultat (indicatif)

Il ne repose que sur les réponses de la personne, aucun chiffre extérieur :

- **Pièces qui dorment** = 100 % − la part portée (milieu de la tranche choisie : 90, 70, 50 ou 30 %). Le nombre de pièces prend le milieu de la tranche de taille (25, 45, 80 ou 120 pièces).
- **Valeur** = la tranche que la personne a choisie.
- **Impact positif** = échanges + réparations + dons des 6 derniers mois.
- **Score santé /100** = la moitié de la part portée (jusqu'à 45 points) + 6 points par échange, réparation ou don (jusqu'à 30) + 20 points moins 4 par achat neuf (au moins 0).

Le visuel du groupe montrait aussi un impact en kg de CO₂e. Il n'est pas affiché tant qu'on n'a pas de source pour le CO₂ par vêtement dans `docs/sources.md` (règle « pas de chiffres inventés »).

## Modifier une question

Les textes sont dans `public/quiz/questions.js` (partagé par le quiz et la page de résultats). Évite de changer un libellé de réponse pendant la collecte : les anciennes réponses resteraient sous l'ancien libellé.

Si tu modifies `apps-script.gs` après le déploiement : colle la nouvelle version dans Apps Script, puis **Déployer › Gérer les déploiements › crayon › Version : Nouvelle version › Déployer**. L'adresse `/exec` reste la même.
