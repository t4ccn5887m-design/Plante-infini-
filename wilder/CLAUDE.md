# CLAUDE.md — Wilder

Ce fichier cadre le travail de Claude Code sur le projet Wilder. Lis-le avant toute tâche.

## Ce qu'est Wilder (le cap — ne dévie jamais)

**Wilder transforme « j'ai vu un truc joli quelque part » en un brief que le paysagiste du client comprend.**

Ce n'est PAS une app de reconnaissance de plantes. C'est une **app d'aide à la conception de jardin**. L'identification par photo n'est que le geste d'entrée. Le produit, c'est le **brief de jardin** qui se construit, puis se remet à un professionnel.

**Cible :** un nouveau propriétaire qui aménage son espace vert. Pas un botaniste. Il sait ce qu'il aime, mais pas comment le dire à un pro.

**Ligne rouge :** Wilder ne remplace pas le paysagiste et ne fait pas son diagnostic (terrain, exposition réelle, sol, ressenti sur place = son expertise). Wilder prépare le premier rendez-vous. Le brief est un **brief d'intention**, pas un cahier des charges technique.

## Règle de travail (IMPORTANT)

- **Un écran / une tâche à la fois.** Ne modifie jamais des dizaines de fichiers d'un coup. Touche uniquement les fichiers strictement nécessaires à la tâche demandée.
- **Montre les changements fichier par fichier** et explique ce que fait chacun avant validation.
- **Ne casse pas l'existant.** Le codebase tourne déjà (PWA Next.js, Supabase, scan fonctionnel, « Ma Palette » en place). On réoriente et on complète, on ne réécrit pas tout.
- Style visuel : sobre, éditorial, mobile-first. Verts naturels + touche violette pour les accents (goût déduit, floraison). Cartes à fine bordure. Éviter le look « care-app » glossy générique.

## La mécanique (le système)

**Capturer → Ranger → Choisir → Transmettre**

- On capture de 3 façons : scanner une plante, piocher dans le **Catalogue** (végétal ou minéral), ou récupérer une palette entière dans **Idées de jardins**.
- Tout ce qui est **scanné** tombe automatiquement dans **Mes scans** (le dictionnaire, sans décision de l'utilisateur).
- Ce qui est **choisi** est promu dans **Mon projet jardin** (la sélection qui prépare le brief).
- **Mon projet jardin** génère le **Brief** remis au paysagiste.
- Règle d'or : **1 scan → toujours dans Mes scans, et en plus dans Mon projet jardin s'il le décide.** Une plante peut être dans les deux, mais toujours dans Mes scans.
- Principe : **on capture maintenant, on décide plus tard — jamais de décision dans l'instant du scan.**
- Une plante ajoutée depuis le Catalogue ou les Idées va directement dans Mon projet jardin (pas dans Mes scans, car pas scannée).
- Le jardin mêle **végétal ET minéral** (paillage, pierres, bordures, déco…), et se conclut par un **mot d'intention libre** pour le pro.

## Les écrans (parcours particulier)

1. **Mon projet jardin** (accueil) — plantes par zone, bandeau « ton style se dessine » (goût déduit), coups de cœur, case « mon mot pour le paysagiste » en bas, boutons « Voir mon brief » + « Scanner une plante ». Un seul projet par utilisateur.
2. **Résultat de scan** — photo + nom courant + nom latin, section « Ce qu'un paysagiste retiendra » (exposition, taille adulte, floraison, rusticité, sol). Déjà enregistré dans Mes scans ; bouton « Ajouter à mon jardin » = promotion optionnelle ; cœur = coup de cœur.
3. **Mes scans** — dictionnaire auto de tout le scanné. Bouton « + Mon jardin » qui bascule en « ✓ Mon jardin ».
4. **Catalogue pépinière** — 2 onglets : Végétal / Minéral & déco. Filtres par envie + grille de familles. Bouton « + Mon jardin » partout.
5. **Idées de jardins** — ambiances toutes faites et cohérentes (méditerranéen, japonais…). Bouton « Ajouter la palette ».
6. **Aperçu du brief** — livrable pour le pro : goût déduit EN PREMIER, puis plantes par zone, cœurs sur les prioritaires. « Envoyer au paysagiste » + « Exporter en PDF ».
7. **Aperçu de ma zone** (PHASE 2) — poser ses plantes sur la photo de sa zone, base de discussion avec le pro (pas un rendu IA).

Les maquettes HTML de référence de chaque écran existent (fichiers `wilder_ecran_*.html`). Reproduis-les fidèlement en composants React.

## Priorités techniques héritées de l'audit

- Valider/verrouiller la sync prod Supabase (migrations RLS, client_id, policies Storage) avant de promettre le multi-appareil.
- Nettoyage ciblé du legacy (composants morts, thèmes potager/rando/juniors, deps leaflet/stripe si abandonnées) — mais SANS tout casser, par petits pas.
- Clarifier le parcours invité (message UX « crée un compte pour sauvegarder »).

## Phase 2 (ne pas coder maintenant, juste garder en tête)

Suggestion des « compagnes » d'une plante aimée (esprit phormium) · alerte d'incompatibilité entre plantes · Aperçu de ma zone · outil côté pro · mise en relation particulier↔pro.
