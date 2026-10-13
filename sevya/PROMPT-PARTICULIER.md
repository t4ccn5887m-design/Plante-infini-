# PROMPT PARTICULIER — Sevya · appli particulier (13 octobre)

> À coller dans Cursor :
> **« Lis sevya/PROMPT-PARTICULIER.md et wilderpro.md, puis exécute le BLOC 0. Arrête-toi à la fin de chaque bloc et attends mon OK. »**
>
> **À faire APRÈS le prompt pro** : celui-ci réutilise la colonne `details` et les composants `components/brief/Step*.js` qu'il a créés.

---

## RÈGLES (valables pour tous les blocs)

1. Branche **`wilder-pro` uniquement**. Jamais `main`. Pas de déploiement prod.
2. **Un bloc = un commit.** À la fin de chaque bloc : `npm run build` vert, commit, puis **STOP** et dis à Emilien quoi tester sur son iPhone.
3. **SQL** : tu ne l'exécutes jamais. Tu l'affiches **en entier** dans le chat, tu le sauvegardes aussi dans `supabase/migrations/AAAAMMJJHHMM_nom.sql`, et tu **attends** qu'Emilien confirme l'avoir collé dans le SQL Editor Supabase avant de coder ce qui en dépend.
4. Aucune clé, aucun mot de passe, aucun token dans le code ou le chat. Les clés restent dans `.env.local`.
5. Ne jamais `GRANT SELECT ON pro_links TO anon`. L'accès invité passe par les fonctions `SECURITY DEFINER` existantes (`get_pro_link_by_token`, `submit_pro_brief`, `is_valid_brief_token`).
6. Les maquettes sont la référence visuelle. Ouvre-les et respecte-les (couleurs, typo, espacements, textes) :
   - `sevya/30-prototype-particulier-v2.html` → appli particulier cliquable (référence principale)
   - `sevya/18-accueil-atelier.html` (choix pro / particulier avant connexion), `19-connexion`, `21-dossier`, `22-paillages-bordures`, `23-styles` → écrans isolés
   - `sevya/16-pdf-atelier.html` → PDF (déjà traité dans le prompt pro)
7. Design « atelier » : `--bg #0F1A14`, `--card #17241C`, `--line #2A3A30`, `--ink #F1ECE2`, `--mute #A9B3A6`, `--sage #C9D6B8`, `--clay #D9A47A`. Polices Fraunces (titres) + Inter (texte). Filets fins plutôt que boîtes pleines. Icônes lucide.
8. Si un bloc s'annonce plus gros que prévu, **dis-le avant de commencer** et propose de le couper.

---

## BLOC 0 — Vérifications (5 min)

- `git status` : l'arbre doit être propre. Vérifie qu'on est sur `wilder-pro`.
- Vérifie que les fichiers créés par le prompt pro existent : `components/brief/StepQuotidien.js`, `StepAEviter.js`, `StepExistant.js`, `StepEntretien.js`, et la migration avec `details jsonb`.
  - **S'ils n'existent pas** : dis-le à Emilien et propose d'exécuter d'abord les blocs 2 et 3 du prompt pro. Ne les recrée pas de ton côté avec d'autres noms.
- Fais un état des lieux en 10 lignes maximum : quels onglets existent aujourd'hui, où est le scan, où vit le dossier du particulier (table, localStorage, les deux ?), et comment il est envoyé au paysagiste.

STOP, sans commit.

---

## BLOC 1 — Supprimer le scan et le bouton +, passer à 5 onglets

1. Supprime le bouton **+**, l'écran de scan et `AjouterAuJardinSheet`.
2. **Garde `/api/analyze`** et tout ce que `/pro` ou `/b/` utilisent encore : vérifie avec un grep avant chaque suppression, et liste ce que tu supprimes.
3. Barre du bas : **Accueil · Idées · Cœurs · Dossier · Partenaires** (5 onglets, aucun bouton central).
4. Aucune donnée utilisateur ne doit être perdue : les anciennes trouvailles déjà sauvegardées restent en base, on ne les affiche simplement plus.

Test iPhone : naviguer dans les 5 onglets, vérifier qu'aucun lien ne mène à l'ancien scan. `npm run build`, commit, STOP.

---

## BLOC 2 — Dossier particulier : 9 étapes

Référence : `30-prototype-particulier-v2.html` → écrans `dossier`, `vie`, `evite`, `exist`, `ent`, `noted`.

- Le Dossier utilise **les mêmes composants** que le lien client (`components/brief/Step*.js`).
- Ordre : Coups de cœur · Ambiance · Mot au paysagiste · **Votre quotidien** · **Ce que vous ne voulez pas** · Mon terrain · **Ce qui existe déjà** · **Entretien et calendrier** · Budget. Puis « Mes coordonnées ».
- Progression : anneau en %, « X étapes sur 9 », écran « C'est noté ! » avec « Étape suivante : … » après chaque validation.
- Les réponses sont enregistrées au **même format `details`** que le brief pro, là où vit déjà le dossier du particulier (voir l'état des lieux du bloc 0).
  - Si ça demande une colonne ou une table, applique les règles SQL : SQL affiché en entier, migration versionnée, attendre l'OK.
- Un compte connecté doit **toujours** écrire son dossier dans le cloud, pour que Safari et le raccourci PWA voient la même chose.

Test iPhone : remplir les 9 étapes dans Safari, puis ouvrir le raccourci PWA et vérifier que tout y est. Commit, STOP.

---

## BLOC 3 — Écrans « atelier » restants

Références : 30 (cliquable) + 18, 19, 21, 22, 23.
- Accueil (anneau de progression + étapes), Idées (4 cases : Végétal · Paillages · Bordures · Styles de jardin), fiches, Cœurs, Dossier, connexion / inscription, écran d'accueil avant connexion (choix pro / particulier).
- Règle catalogue : **pas de photo = élément masqué** (mais toujours trouvable par son id).
- Styles de jardin = mur de photos **sans texte d'explication**.

Un commit par écran ou groupe d'écrans. STOP après chaque groupe pour un test iPhone.

---

## BLOC 4 — Onglet Partenaires (« Bientôt disponible »)

- Flag `PARTNERS_LIVE=false` dans `lib/partnersPreview.js`, avec les données d'aperçu (studios fictifs « Atelier Vert Bleu », « Les Jardins de Clara »).
- Écran « Bientôt disponible » + bouton **« Me prévenir »** → enregistre `partners_notify: true` dans le `user_metadata` Supabase.
- Lien « Voir l'aperçu » → fiche partenaire de démonstration (maquette 25/30, écran `partners`).

Commit, STOP.

---

## PAS CE SOIR (noté, ne pas coder)

- Envoi réel d'une demande à un paysagiste partenaire (quand environ 10 paysagistes seront inscrits).
- Notifications.
- Tout ce qui ressemble à un plan ou un placement des végétaux : **hors cap** (le client choisit ses envies, le pro compose).
