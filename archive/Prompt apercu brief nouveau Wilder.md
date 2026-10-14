# Prompt pour « Aperçu du brief » — nouveau Wilder

_À coller dans Claude Code. Il analyse d'abord, il code seulement après ton feu vert._
_Écran 7 du parcours. L'ABOUTISSEMENT : le livrable remis au paysagiste._
_C'est le cœur de la différence de Wilder : PAS une liste de plantes, une LECTURE DU GOÛT._

---

## Rappel : comment fonctionne « Aperçu du brief » (pour toi)

**Son rôle :** l'écran final, généré à partir de Mon projet jardin. C'est ce que le client remet à son paysagiste. Accès depuis le bouton « Voir mon brief » de l'accueil.

**Ce qu'il contient (de haut en bas) :**
- Titre « Brief pour mon jardin » + compteur (plantes repérées · prioritaires).
- EN PREMIER : un encadré violet « Ce que je recherche » = le goût déduit, en étiquettes
  (mi-ombre, floraisons violettes, persistants, sol frais). C'est l'élément le plus important.
- Le « mot pour le paysagiste » écrit par le client (celui saisi dans Mon projet jardin).
- La liste des plantes (et minéraux) en format compact/document, avec un cœur rouge
  sur les prioritaires (coups de cœur).
- En bas : « Envoyer à mon paysagiste » + « Exporter en PDF ».

**Le point clé (le goût déduit) :** l'encadré « Ce que je recherche » doit être calculé
à partir des plantes du jardin (leurs expositions, floraisons, etc.) — c'est LA valeur.
Mais comme les champs paysagiste ne sont pas encore fiables (cf. Option 3 du résultat de
scan), le goût déduit peut, pour l'instant, être calculé de façon simple à partir de ce
qu'on a, ou rester semi-statique. À brancher proprement quand l'Option 1 (API) sera faite.

**Cohérence avec les décisions déjà prises :** pas de zones pour l'instant (liste « en tas »,
pas de regroupement). Végétal + minéral peuvent cohabiter dans le brief avec un repère
visuel distinct. « Exporter en PDF » : ton app a déjà pdfmake (export PDF palette existant),
donc on réutilise cet existant plutôt que d'ajouter une lib.

---

## LE PROMPT À COLLER DANS CLAUDE CODE

```
On attaque l'écran « Aperçu du brief » (accessible via « Voir mon brief » depuis l'accueil).
Lis le CLAUDE.md, et la maquette wilder_ecran_brief.html si elle est dans le projet.
C'est l'aboutissement : le livrable pour le paysagiste. PAS une liste de plantes,
une LECTURE DU GOÛT du client.

ÉTAPE 1 — ANALYSE AVANT DE CODER (ne code rien encore) :
Explore le code et explique-moi en français :
- Comment récupérer le contenu de Mon projet jardin (plantes + minéraux) pour l'afficher
  ici — via les mêmes fonctions que MonJardinScreen (fetchPalettes/zones/items) ?
- L'export PDF existant (pdfmake, export palette) : où est-il, et comment le réutiliser
  pour générer le brief en PDF plutôt que d'ajouter une nouvelle librairie ?
- Le « mot pour le paysagiste » saisi dans Mon projet jardin : où est-il stocké,
  comment le récupérer ici ?
- Pour l'encadré « Ce que je recherche » (goût déduit) : propose-moi une façon SIMPLE
  de le calculer à partir des plantes du jardin avec les données actuellement dispo
  (ou, si rien de fiable, un repli semi-statique). On le branchera vraiment avec l'Option 1 (API).
- Le « coup de cœur » (favori) : comment marquer les plantes prioritaires dans le brief ?
Montre-moi ta compréhension AVANT d'écrire quoi que ce soit.

ÉTAPE 2 — SEULEMENT APRÈS MON FEU VERT :
Crée l'écran « Aperçu du brief » fidèle à la maquette :
- Titre + compteur (X plantes repérées · Y prioritaires).
- EN PREMIER l'encadré violet « Ce que je recherche » (goût déduit, en étiquettes).
- Le mot du client pour le paysagiste (récupéré depuis Mon projet jardin).
- La liste des plantes/minéraux en format compact, cœur rouge sur les prioritaires,
  repère visuel distinct végétal (vert) / minéral (pierre).
- Boutons « Envoyer à mon paysagiste » (peut être un partage simple / mailto pour l'instant)
  et « Exporter en PDF » (réutilise l'export PDF existant pdfmake).
- Branché sur le bouton « Voir mon brief » de l'accueil.

CONTRAINTES :
- Un seul écran à la fois. Ne touche qu'aux fichiers strictement nécessaires.
- Réutilise l'export PDF existant (pdfmake), n'ajoute pas de nouvelle lib PDF.
- Pas de zones pour l'instant (liste simple). Ne casse pas Mon projet jardin ni l'existant.
- Le goût déduit peut rester simple/semi-statique à cette étape (vrai calcul avec l'Option 1).
- Style identique à la maquette (document sobre, goût déduit en violet en tête).
- Montre-moi le diff fichier par fichier et explique en français avant que je valide.
```

---

## Après avoir collé

1. Claude Code te répond son ANALYSE. **Ne le laisse pas coder encore.**
2. Montre-moi son analyse → je vérifie surtout : la réutilisation de l'export PDF existant
   (pas de nouvelle lib), la récupération du contenu du jardin + du mot, et sa méthode
   pour le goût déduit (qu'elle reste simple à cette étape).
3. Feu vert → Étape 2.
4. Il propose le code → tu lis le diff → tu acceptes ou refuses.
5. Tu testes : depuis l'accueil, « Voir mon brief » → vérifie le goût déduit en tête,
   la liste des plantes avec les prioritaires, le mot, et l'export PDF.

_Rappel : le vrai « goût déduit » (calculé finement sur exposition/floraison/etc.) dépend
de l'Option 1 (faire renvoyer ces champs par l'API). Ici on pose l'écran ; on affinera après._
