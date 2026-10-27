# Comment démarrer avec Claude Code

1. Ouvre un terminal dans ce dossier (le dépôt `Projet Ecole`), puis lance `claude`.
2. Claude Code lit `CLAUDE.md` tout seul. Colle le message ci-dessous comme premier message.
3. Ensuite, suis `docs/07-feuille-de-route.md` : une étape par session, avec le prompt indiqué.

---

## Premier message à coller

```
Bonjour. Je démarre le développement de l'application e-mirror, un projet d'école.

1. Lis CLAUDE.md, puis tous les fichiers de docs/ dans l'ordre (01 à 08 et sources.md).
2. Ouvre reference/prototype-e-mirror.html pour comprendre les écrans et la logique.
3. Résume-moi en 10 lignes maximum ce que tu as compris : le problème, les 4 boucles,
   la bourse d'échange entre membres avec les crédits, et ce qui est hors périmètre.
4. Liste les incohérences ou les questions que tu vois dans le dossier.
5. Propose ensuite le plan de l'étape 0 de docs/07-feuille-de-route.md.

Ne code rien avant que j'aie validé le plan.
```

---

## Ce qu'il te faudra pendant le développement

- **Node.js** version 20 ou plus, avec **npm** (vérifie avec `node -v` dans le terminal ; sinon, installe-le depuis nodejs.org).
- Un compte **Supabase** gratuit à l'étape 3 (Claude Code t'expliquera où trouver l'URL et la clé publique).
- Un compte **Vercel** ou **Netlify** à l'étape 6, relié à ton dépôt GitHub `S2lyvn/Projet-Ecole`.
