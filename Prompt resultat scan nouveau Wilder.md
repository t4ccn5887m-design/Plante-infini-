# Prompt pour « Résultat de scan » — nouveau Wilder

_À coller dans Claude Code. Il analyse d'abord, il code seulement après ton feu vert._
_Écran 2 du parcours. Le « moment wow » : le flou devient vocabulaire de paysagiste._
_Choix acté : OPTION 3 maintenant (poser l'écran, champs paysagiste en attente),_
_OPTION 1 juste après (faire renvoyer les vraies données par l'API /api/analyze)._
_Session de préparation._

---

## Rappel : comment fonctionne l'écran « Résultat de scan » (pour toi)

**Son rôle :** l'écran qui s'affiche juste après un scan. Le moment le plus important émotionnellement : le client gagne le vocabulaire qu'il n'avait pas.

**Ce qu'il contient (de haut en bas) :** la photo scannée ; le nom courant en gros + le nom latin en petit ; un badge « Identifié » ; une ligne « Enregistré dans Mes scans — rien à faire, c'est déjà sauvé » ; la section « Ce qu'un paysagiste retiendra » avec 5 cases (exposition, taille adulte, floraison, rusticité, sol) ; en bas, un bouton cœur (coup de cœur) + le bouton « Ajouter à mon jardin » ; une note « on te demandera dans quelle zone la ranger » (à adapter : pour l'instant pas de zones, cf. décision Mes scans).

**Le point clé (Option 3) :** les 5 champs paysagiste (exposition, taille, floraison, rusticité, sol) n'existent PAS encore comme données propres dans l'app — l'API /api/analyze ne les renvoie pas séparément. Donc pour l'instant on AFFICHE les 5 cases mais avec une valeur « — » ou « à venir » quand la donnée n'existe pas. On construit proprement pour qu'en Option 1 (plus tard), on n'ait qu'à brancher la vraie source, sans refaire l'écran.

**Cohérence avec les décisions déjà prises :** le scan est déjà enregistré dans Mes scans au moment du scan → « Ajouter à mon jardin » est une promotion OPTIONNELLE. Pas de zones pour l'instant (on met en tas). App accessible/gratuite pour tous (plus de distinction invité).

---

## LE PROMPT À COLLER DANS CLAUDE CODE

```
On attaque l'écran « Résultat de scan » (celui qui s'affiche après un scan).
Lis le CLAUDE.md, et la maquette de référence wilder_ecran_resultat_scan.html
si elle est dans le projet (sinon base-toi sur ma description).

CHOIX IMPORTANT — ON EST EN OPTION 3 :
Les 5 caractéristiques « paysagiste » (exposition, taille adulte, floraison,
rusticité, sol) n'existent pas encore comme champs propres (l'API /api/analyze
ne les renvoie pas séparément). Pour cet écran, on les AFFICHE quand même,
mais avec une valeur de repli « — » (ou « à venir ») quand la donnée manque.
On code proprement pour qu'une évolution future (Option 1 : faire renvoyer ces
champs par l'API) n'ait qu'à fournir les données, SANS refaire l'écran.

ÉTAPE 1 — ANALYSE AVANT DE CODER (ne code rien encore) :
Explore le code existant et explique-moi en français, simplement :
- Où est géré l'écran de résultat après un scan aujourd'hui (dans pages/index.js,
  screen === "result" ou équivalent) et comment il affiche la trouvaille ?
- Quels champs de la discovery peuvent servir de repli pour les 5 cases paysagiste
  (ex : habitat, description, guide_entretien) ? Propose un mapping simple,
  sachant que si rien de fiable → on affiche « — ».
- Comment est déjà câblé « Ajouter à mon jardin » ailleurs (addZoneItems /
  ensureSujetsIsolesZone) pour réutiliser la même logique ?
- Où stocker le « coup de cœur » (champ favori de la discovery, aujourd'hui placeholder) ?
Montre-moi ta compréhension AVANT d'écrire quoi que ce soit.

ÉTAPE 2 — SEULEMENT APRÈS MON FEU VERT :
Fais l'écran « Résultat de scan » fidèle à la maquette :
- Photo scannée + badge « Identifié ».
- Nom courant en gros + nom latin en petit italique.
- Ligne « Enregistré dans Mes scans — c'est déjà sauvé ».
- Section « Ce qu'un paysagiste retiendra » : 5 cases (Exposition, Taille adulte,
  Floraison, Rusticité, Sol). Chaque case lit une source de repli si dispo,
  sinon affiche « — ». Le composant doit être prêt à recevoir de vraies valeurs
  plus tard sans refonte (ex : une fonction getPaysagisteSpecs(discovery) centralisée).
- En bas : bouton cœur (coup de cœur, écrit dans discovery.favori) +
  bouton « Ajouter à mon jardin » (promotion optionnelle, réutilise la logique existante).
- Pas de zones pour l'instant : ajoute la plante « en tas » dans le jardin
  (même approche que l'écran Mes scans). Adapte / enlève la note sur le choix de zone.

CONTRAINTES :
- Un seul écran à la fois. Ne touche qu'aux fichiers strictement nécessaires.
- Ne modifie PAS l'API /api/analyze à cette étape (ce sera l'Option 1, plus tard).
- Ne casse pas le flux de scan existant (caméra → analyse → résultat).
- Style identique à la maquette (sobre, vert + accent violet, cartes fine bordure).
- Montre-moi le diff fichier par fichier et explique en français avant que je valide.
```

---

## Après avoir collé

1. Claude Code te répond son ANALYSE (Étape 1). **Ne le laisse pas coder encore.**
2. Montre-moi son analyse → je vérifie surtout son mapping de repli pour les 5 cases
   et qu'il ne touche pas à l'API.
3. Feu vert → Étape 2.
4. Il propose le code → tu lis le diff → tu acceptes ou refuses.
5. Tu testes : fais un scan et regarde l'écran résultat (les 5 cases avec « — » c'est
   NORMAL à cette étape — les vraies valeurs viendront en Option 1).

_Rappel : l'Option 1 (faire renvoyer exposition/taille/floraison/rusticité/sol par
l'API /api/analyze, côté Supabase/Vercel) sera le chantier juste après cet écran._
