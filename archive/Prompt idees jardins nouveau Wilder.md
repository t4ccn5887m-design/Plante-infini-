# Prompt pour « Idées de jardins » — nouveau Wilder

_À coller dans Claude Code. Il analyse d'abord, il code seulement après ton feu vert._
_Écran 6 du parcours. Pour ceux qui partent de zéro : piocher une ambiance entière._
_Choix acté : OPTION C (ambiances en dur / mock), OPTION A à la fin (base Supabase)._
_Logique particulière : on ajoute une PALETTE ENTIÈRE d'un coup, pas une seule plante._

---

## Rappel : comment fonctionne « Idées de jardins » (pour toi)

**Son rôle :** pour quelqu'un qui n'a aucune idée, ou qui mélange des plantes incompatibles sans le savoir. Il pioche une ambiance toute faite (méditerranéen, japonais…) et récupère d'un coup un ensemble de plantes cohérentes. Accès via le menu (☰).

**Ce qu'il contient :** une galerie d'ambiances. Chaque ambiance = une grande image, un nom, un badge de conditions (« Plein soleil · sec », « Mi-ombre · zen »), une description courte, un compteur (X plantes · Y minéraux), et un bouton « Ajouter la palette ».

**Le point clé (logique différente des autres écrans) :** ici, le bouton n'ajoute pas UNE plante, il ajoute TOUT le contenu de l'ambiance (plusieurs plantes + éventuels minéraux) dans Mon projet jardin, en une action. Une ambiance = une liste d'items prédéfinis.

**Pourquoi ça règle le "je mélange tout" :** une ambiance est cohérente par nature (ses plantes ont les mêmes besoins). Donc en piochant une ambiance, l'utilisateur récupère forcément des plantes qui vont ensemble — sans logique de compatibilité complexe.

**Cohérence avec les décisions déjà prises :** ajout direct dans Mon projet jardin (pas dans Mes scans). Pas de zones (ajout « en tas »). Option C (mock isolé) qui servira de plan à la future base. App gratuite pour tous.

---

## LE PROMPT À COLLER DANS CLAUDE CODE

```
On attaque l'écran « Idées de jardins » (accès via le menu ☰).
Lis le CLAUDE.md, et la maquette wilder_ecran_idees_jardins.html si elle est dans le projet.

ON RESTE EN OPTION C (données en dur) :
Les ambiances sont une liste EN DUR (mock) dans un fichier dédié. Chaque ambiance
contient une liste d'items (plantes, et éventuellement minéraux) qui la composent.
Structure pensée pour devenir une table Supabase ensuite.

LOGIQUE PARTICULIÈRE À BIEN COMPRENDRE :
Contrairement aux autres écrans, « Ajouter la palette » ajoute PLUSIEURS items d'un
coup dans Mon projet jardin (toutes les plantes/minéraux de l'ambiance), en une action.

ÉTAPE 1 — ANALYSE + PROPOSITION DE STRUCTURE (ne code pas encore) :
1) Dis-moi comment est gérée la navigation par le menu (☰) pour ajouter « Idées de jardins ».
2) Comment réutiliser la logique d'ajout au jardin (addZoneItems) mais pour AJOUTER
   PLUSIEURS items d'un coup ? Est-ce qu'on boucle sur addZoneItems, ou y a-t-il déjà
   une fonction qui ajoute une liste ? (But : ajout groupé propre, sans casser l'existant.)
3) PROPOSE-MOI la structure d'un objet « ambiance / idée de jardin ». À mon avis au moins :
   id, nom (ex "Jardin méditerranéen"), image (url), badge_conditions (ex "Plein soleil · sec"),
   description, items: [ liste de références vers des plantes (et minéraux) du catalogue ].
   Point important : les items de l'ambiance doivent-ils POINTER vers les plantes du
   catalogue (mock catalogue existant) pour ne pas dupliquer les données, ou être
   autonomes ? Donne-moi ta reco.
4) Que se passe-t-il si une plante de l'ambiance est DÉJÀ dans le jardin ? (éviter les
   doublons — ne pas l'ajouter deux fois).
Montre-moi ton analyse ET ta proposition de structure AVANT de coder.

ÉTAPE 2 — SEULEMENT APRÈS MON FEU VERT :
- Crée le fichier mock des ambiances (4-6 : Méditerranéen, Japonais, Cottage anglais,
  Jardin sec…), chacune avec ses items, suivant la structure validée.
- Crée l'écran « Idées de jardins » fidèle à la maquette : galerie d'ambiances
  (image + nom + badge conditions + description + compteur + bouton « Ajouter la palette »).
- « Ajouter la palette » ajoute tous les items de l'ambiance dans Mon projet jardin
  d'un coup (en évitant les doublons), en réutilisant la logique existante.
- Ajoute l'entrée « Idées de jardins » dans le menu (☰).

CONTRAINTES :
- Un seul écran à la fois. Ne touche qu'aux fichiers strictement nécessaires.
- Source de données isolée (fichier mock) pour brancher Supabase plus tard.
- Réutilise autant que possible le mock catalogue (ne duplique pas les plantes).
- Ne casse pas la navigation ni la logique d'ajout au jardin existante.
- Style identique à la maquette. Montre-moi le diff fichier par fichier avant que je valide.
```

---

## Après avoir collé

1. Claude Code te répond son ANALYSE + sa PROPOSITION DE STRUCTURE. **Ne le laisse pas coder encore.**
2. Montre-moi ça → je vérifie surtout : l'ajout GROUPÉ (plusieurs items d'un coup sans
   casser addZoneItems), la gestion des doublons, et si les ambiances pointent bien
   vers le catalogue (pas de données dupliquées).
3. Feu vert → Étape 2.
4. Il propose le code → tu lis le diff → tu acceptes ou refuses.
5. Tu testes : ouvre Idées de jardins, ajoute une ambiance, vérifie que TOUTES ses
   plantes arrivent bien dans Mon projet jardin, sans doublon.

_Rappel : Option A (base Supabase) plus tard. Une ambiance deviendra une entrée avec
sa liste d'items pointant vers la table plantes/minéraux._
