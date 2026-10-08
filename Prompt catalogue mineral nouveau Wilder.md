# Prompt pour « Catalogue — Minéral & déco » — nouveau Wilder

_À coller dans Claude Code. Il analyse d'abord, il code seulement après ton feu vert._
_Écran 5 du parcours. C'est le 2ᵉ onglet du Catalogue (pas un nouvel écran séparé)._
_À faire APRÈS le Catalogue pépinière (Végétal), car il réutilise le même écran._
_Choix acté : OPTION C (données en dur / mock), OPTION A à la fin (base Supabase)._

---

## Rappel : comment fonctionne le « Catalogue — Minéral & déco » (pour toi)

**Son rôle :** compléter le jardin au-delà du vivant. Un jardin, c'est aussi du minéral (paillage, pierres, bordures, déco…). C'est le 2ᵉ onglet du même écran Catalogue, pas un écran à part.

**Ce qu'il contient :** les 2 onglets en haut (Végétal / Minéral & déco) — ici on remplit le Minéral ; des filtres d'ambiance (Zen, Contemporain, Naturel, Sans entretien) ; une grille de 6 familles minérales : Paillage & sols, Pierres & rochers, Bordures, Pas & allées, Déco & mobilier, Clôtures & bois ; une section « Populaires » avec le bouton « + Mon jardin ».

**Le point clé :** un article minéral n'est PAS une plante. Il n'a ni exposition, ni floraison, ni rusticité. Il faut donc une structure de données DIFFÉRENTE (mais cohérente) : nom, famille minérale, photo, matériau/finition, tags d'ambiance, etc. Et il doit pouvoir vivre dans « Mon projet jardin » et dans le brief À CÔTÉ des plantes, avec un repère visuel distinct (teinte « pierre » beige-gris vs vert pour le végétal).

**Cohérence avec les décisions déjà prises :** ajout direct dans Mon projet jardin (pas dans Mes scans). Pas de zones (ajout « en tas »). Même bouton « + Mon jardin » → « ✓ Mon jardin ». Option C (mock isolé) qui servira de plan à la future table Supabase.

---

## LE PROMPT À COLLER DANS CLAUDE CODE

```
On remplit le 2ᵉ onglet du Catalogue : « Minéral & déco ».
Lis le CLAUDE.md, et la maquette wilder_ecran_catalogue_mineral.html si elle est
dans le projet. On réutilise l'écran Catalogue déjà créé (les 2 onglets existent déjà) :
il s'agit de remplir l'onglet Minéral, PAS de créer un nouvel écran.

ON RESTE EN OPTION C (données en dur) :
Comme pour le végétal, une liste EN DUR (mock) d'articles minéraux, dans un fichier
dédié et lisible. Structure pensée pour devenir une table Supabase ensuite.

ÉTAPE 1 — ANALYSE + PROPOSITION DE STRUCTURE (ne code pas encore) :
1) Rappelle-moi comment est construit l'écran Catalogue existant (onglets, grille de
   familles, liste, bouton « + Mon jardin ») pour brancher le minéral dessus proprement.
2) PROPOSE-MOI la structure d'un objet « article minéral » (les champs), différente
   d'une plante mais cohérente avec le reste. À mon avis au moins :
   id, nom, famille (paillage_sols / pierres_rochers / bordures / pas_allees /
   deco_mobilier / clotures_bois), photo (url), materiau, finition/couleur,
   tags_ambiance (ex: ["zen","contemporain"]), type = "mineral".
   Ajoute un champ qui distingue clairement végétal vs minéral, pour que
   « Mon projet jardin » et le brief puissent les afficher différemment
   (teinte « pierre » vs vert) et les compter séparément si besoin.
3) Dis-moi comment « Ajouter au jardin » gère un article minéral : réutilise-t-on
   addZoneItems avec un type différent, ou faut-il un ajustement ? (But : minéral et
   végétal cohabitent dans le même jardin sans casser la logique existante.)
Montre-moi ton analyse ET ta proposition de structure AVANT de coder.

ÉTAPE 2 — SEULEMENT APRÈS MON FEU VERT :
- Crée le fichier mock des articles minéraux (10-15 exemples : ardoise concassée,
  bordure acier corten, pas japonais grès, gravier, poterie…), suivant la structure validée.
- Remplis l'onglet « Minéral & déco » : filtres d'ambiance + grille des 6 familles
  minérales + liste d'articles avec le bouton « + Mon jardin » (réutilise la logique existante).
- Donne au minéral un repère visuel distinct (teinte « pierre » beige-gris),
  pour le différencier du végétal (vert), y compris une fois ajouté au jardin.

CONTRAINTES :
- Un seul écran à la fois. Ne touche qu'aux fichiers strictement nécessaires.
- Ne casse PAS l'onglet Végétal déjà fait.
- Source de données isolée (fichier mock à part) pour brancher Supabase plus tard.
- Style identique à la maquette. Montre-moi le diff fichier par fichier avant que je valide.
```

---

## Après avoir collé

1. Claude Code te répond son ANALYSE + sa PROPOSITION DE STRUCTURE (article minéral). **Ne le laisse pas coder encore.**
2. Montre-moi ça → je vérifie surtout : la structure de l'article minéral, le champ
   qui distingue végétal/minéral, et que « Ajouter au jardin » gère les deux sans casser.
3. Feu vert → Étape 2.
4. Il propose le code → tu lis le diff → tu acceptes ou refuses.
5. Tu testes : bascule sur l'onglet Minéral, ajoute un article, vérifie qu'il arrive
   dans Mon projet jardin à côté des plantes, avec son repère visuel distinct.

_Rappel : Option A (base Supabase) plus tard. On aura alors 2 tables cohérentes :
plantes (végétal) et articles (minéral), toutes deux calquées sur les mocks._
