# Prompt pour « Catalogue pépinière » (végétal) — nouveau Wilder

_À coller dans Claude Code. Il analyse d'abord, il code seulement après ton feu vert._
_Écran 4 du parcours. La 2ᵉ porte d'entrée : parcourir au lieu de scanner._
_Choix acté : OPTION C maintenant (plantes en dur / mock), OPTION A à la fin_
_(vraie base Supabase à toi — moins chère qu'une API externe facturée à l'appel)._
_Le mock sert de PLAN pour la future table : bien définir la structure d'une plante._

---

## Rappel : comment fonctionne le « Catalogue pépinière » (pour toi)

**Son rôle :** permettre à quelqu'un qui n'a rien croisé (ou qui part de zéro) de parcourir des plantes et de les ajouter à son jardin, sans scanner. Accès via le menu (☰).

**Ce qu'il contient (de haut en bas) :** un titre + une phrase d'intro ; des filtres « par envie » (Pour l'ombre, Floraison violette, Persistant, Sans entretien, Brise-vue) ; une grille de familles (Arbustes, Vivaces, Conifères, Arbres, Fleurs, Rosiers) ; une section « Populaires » listant des plantes avec le bouton « + Mon jardin ».

**Le point clé (Option C) :** les plantes du catalogue ne viennent PAS d'une base réelle pour l'instant. On code avec une petite liste de plantes EN DUR dans le code (10-15 exemples), stockée dans un fichier séparé et clair. Cette liste doit avoir une STRUCTURE propre et réfléchie, parce qu'elle servira de modèle exact à la future table Supabase (Option A). Objectif : quand on passera à la vraie base, on remplacera juste la source, sans refaire l'écran.

**Cohérence avec les décisions déjà prises :** une plante ajoutée depuis le catalogue va directement dans Mon projet jardin (pas dans Mes scans, car pas scannée). Pas de zones pour l'instant (ajout « en tas »). Même bouton « + Mon jardin » → « ✓ Mon jardin » que partout. App gratuite pour tous.

---

## LE PROMPT À COLLER DANS CLAUDE CODE

```
On attaque l'écran « Catalogue pépinière » (onglet Végétal).
Lis le CLAUDE.md, et la maquette wilder_ecran_catalogue.html si elle est dans le projet.

CHOIX IMPORTANT — ON EST EN OPTION C (données en dur) :
Les plantes du catalogue ne viennent d'aucune base réelle pour l'instant.
On crée une liste EN DUR (mock) de 10-15 plantes, dans un fichier dédié et lisible
(ex : lib/catalogueMock.js ou data/plants.js). Cette liste doit avoir une structure
PROPRE et bien pensée, car elle servira de modèle à une future table Supabase
(Option A, plus tard). But : pouvoir remplacer la source sans refaire l'écran.

ÉTAPE 1 — ANALYSE + PROPOSITION DE STRUCTURE (ne code pas l'écran encore) :
1) Explore le code et dis-moi en français :
   - Comment est géré le menu (☰) / la navigation entre écrans (pages/index.js,
     screen === "..."), pour y ajouter une entrée « Catalogue ».
   - Comment « Ajouter au jardin » est déjà câblé (addZoneItems / ensureSujetsIsolesZone)
     pour réutiliser exactement la même logique depuis le catalogue.
   - Comment savoir si une plante du catalogue est déjà dans le jardin (pour afficher
     « + Mon jardin » ou « ✓ Mon jardin »).
2) PROPOSE-MOI la structure d'un objet « plante de catalogue » (les champs), pensée
   pour devenir une table Supabase ensuite. À mon avis il faut au moins :
   id, nom, nom_latin, famille (arbustes/vivaces/conifères/arbres/fleurs/rosiers),
   photo (url), exposition, taille_adulte, floraison, rusticite, sol,
   tags_envie (ex: ["ombre","persistant"]). Complète/corrige selon ce qui est cohérent
   avec les discoveries existantes, pour que catalogue et scans parlent le même langage.
Montre-moi ton analyse ET ta proposition de structure AVANT de coder l'écran.

ÉTAPE 2 — SEULEMENT APRÈS MON FEU VERT :
- Crée le fichier mock avec 10-15 plantes réalistes, suivant la structure validée.
- Crée l'écran « Catalogue pépinière » fidèle à la maquette :
  filtres par envie (basés sur tags_envie) + grille de familles + liste de plantes
  avec le bouton « + Mon jardin » (→ « ✓ Mon jardin ») qui réutilise la logique existante.
- Ajoute l'entrée « Catalogue » dans le menu (☰).
- Prévois déjà les 2 onglets « Végétal / Minéral & déco » en haut (l'onglet Minéral
  sera rempli plus tard), mais ne code QUE le contenu Végétal pour l'instant.

CONTRAINTES :
- Un seul écran à la fois. Ne touche qu'aux fichiers strictement nécessaires.
- La source de données doit être isolée (un seul fichier mock) pour brancher Supabase
  plus tard sans refaire l'UI.
- Ne casse pas la navigation ni le flux existant.
- Style identique à la maquette (sobre, vert + accent violet, cartes fine bordure).
- Montre-moi le diff fichier par fichier et explique en français avant que je valide.
```

---

## Après avoir collé

1. Claude Code te répond son ANALYSE + sa PROPOSITION DE STRUCTURE. **Ne le laisse pas coder l'écran encore.**
2. Montre-moi ça → je vérifie surtout la structure de la plante (c'est le futur plan de ta
   table Supabase, autant qu'elle soit bonne du premier coup) et qu'il isole bien le mock.
3. Feu vert → Étape 2.
4. Il propose le code → tu lis le diff → tu acceptes ou refuses.
5. Tu testes : ouvre le catalogue depuis le menu, ajoute une plante, vérifie qu'elle
   arrive bien dans Mon projet jardin, et que le bouton passe à « ✓ Mon jardin ».

_Rappel : l'Option A (vraie base Supabase à toi, pas chère) sera le chantier plus tard —
et grâce au mock bien structuré, on n'aura qu'à remplacer la source._
