# PROMPT PRO — Sevya · espace paysagiste + lien client (13 octobre)

> À coller dans Cursor :
> **« Lis sevya/PROMPT-PRO.md et wilderpro.md, puis exécute le BLOC 0. Arrête-toi à la fin de chaque bloc et attends mon OK. »**
>
> **À faire AVANT le prompt particulier** : il crée la colonne `details` et les 4 composants d'étapes que le particulier réutilise.

---

## RÈGLES (valables pour tous les blocs)

1. Branche **`wilder-pro` uniquement**. Jamais `main`. Pas de déploiement prod.
2. **Un bloc = un commit.** À la fin de chaque bloc : `npm run build` vert, commit, puis **STOP** et dis à Emilien quoi tester sur son iPhone.
3. **SQL** : tu ne l'exécutes jamais. Tu l'affiches **en entier** dans le chat, tu le sauvegardes aussi dans `supabase/migrations/AAAAMMJJHHMM_nom.sql`, et tu **attends** qu'Emilien confirme l'avoir collé dans le SQL Editor Supabase avant de coder ce qui en dépend.
4. Aucune clé, aucun mot de passe, aucun token dans le code ou le chat. Les clés restent dans `.env.local`.
5. Ne jamais `GRANT SELECT ON pro_links TO anon`. L'accès invité passe par les fonctions `SECURITY DEFINER` existantes (`get_pro_link_by_token`, `submit_pro_brief`, `is_valid_brief_token`).
6. Les maquettes sont la référence visuelle. Ouvre-les et respecte-les (couleurs, typo, espacements, textes) :
   - `sevya/29-prototype-pro.html` → espace pro (référence principale)
   - `sevya/30-prototype-particulier-v2.html` → écrans `vie`, `evite`, `exist`, `ent` : les 4 nouvelles étapes du brief client
   - `sevya/16-pdf-atelier.html` → PDF
   - `sevya/20-lien-client.html` → page d'arrivée du lien client
7. Design « atelier » : `--bg #0F1A14`, `--card #17241C`, `--line #2A3A30`, `--ink #F1ECE2`, `--mute #A9B3A6`, `--sage #C9D6B8`, `--clay #D9A47A`. Polices Fraunces (titres) + Inter (texte). Filets fins plutôt que boîtes pleines. Icônes lucide.
8. Si un bloc s'annonce plus gros que prévu, **dis-le avant de commencer** et propose de le couper.

---

## ORDRE

Priorité = les 3 tests clients de la semaine prochaine (lien pro → brief client → fiche brief chez le pro).
Blocs 0, 0 bis et 1 à 5 = indispensables. Blocs 6 et 7 = si le temps le permet.

---

## BLOC 0 — Préparation (5 min)

- `git status` : l'arbre doit être propre. Sinon, montre-moi ce qui traîne avant de toucher quoi que ce soit.
- Vérifie qu'on est sur `wilder-pro`.
- Vérifie que les maquettes 25 à 30 sont bien dans `sevya/` et commit-les : `docs: maquettes 25-30 (particulier v2, pro v3)`.
- Ajoute à `wilderpro.md` une section **§19 Décisions du 13 octobre (suite)** avec ce texte :

```
- Espace pro : 4 onglets Projets · Agenda · Réalisations · Studio. Plus de bouton +.
- Accueil Projets : prochain RDV, bouton « Envoyer un lien à un client », 4 cases sans photo
  (icône + gros chiffre + dernière activité) : Demandes · Briefs prêts · En attente · Mes clients.
- Objectif du brief : aider le paysagiste à trouver la bonne PROPOSITION D'AMÉNAGEMENT, pas à chiffrer.
- Brief client : 4 étapes en plus → Votre quotidien, Ce que vous ne voulez pas, Ce qui existe déjà,
  Entretien et calendrier (9 étapes au total, toujours une option « Je ne sais pas »).
- Fiche brief pro : ligne « En bref », « Pistes pour votre proposition » (IA, côté pro uniquement,
  jamais dans le PDF client), qui vit dans le jardin, aime / ne veut pas, existant, entretien, dispos RDV.
- Suivi après RDV en 1 clic : RDV fait → Proposition envoyée → Gagné / Perdu → Archivé. Pas de devis.
- SMS : jamais d'envoi automatique payant. On ouvre l'appli Messages avec le texte prérempli (lien sms:).
- Réalisations : un style en 1 clic (pour les suggérer au bon client) + interrupteur « visible dans Partenaires ».
- Maquettes de référence : 29 (pro) et 30 (particulier).
- Logo validé : le sceau italique (S Cormorant italique dans un double cercle, « SEVYA · LE JARDIN AVANT LE JARDIN »). En petit : S + 1 cercle. Fichiers dans sevya/logo/.
```

Commit, STOP.

---

## BLOC 0 bis — Logo et icônes (15 min, sans risque)

Le logo est validé : **le sceau italique** (S calligraphique dans un double cercle, texte « SEVYA · LE JARDIN AVANT LE JARDIN »). Les fichiers sont dans `sevya/logo/` et sont déjà vectorisés : ils ne dépendent d'aucune police, n'en ajoute pas.

| Fichier | Usage |
|---|---|
| `icon-1024.png`, `icon-512.png`, `icon-192.png` | Icônes de l'appli (manifest PWA) |
| `icon-maskable-512.png` | Icône « maskable » Android (marge de sécurité incluse) |
| `apple-touch-icon.png` (180 px) | Écran d'accueil iPhone |
| `favicon.svg`, `favicon-32.png`, `favicon-16.png` | Onglet du navigateur (version courte : S + 1 cercle) |
| `sceau-blanc.svg` | Sceau clair, fond transparent → sur fonds sombres (connexion, couverture PDF) |
| `sceau-clair.svg` | Sceau vert forêt, fond transparent → sur fonds clairs (pages intérieures du PDF) |
| `symbole-sombre.svg`, `symbole-clair.svg` | Version courte (S + 1 cercle) pour les petites tailles |

À faire :
1. Copie les icônes dans `public/` et les SVG dans `public/brand/`.
2. Mets à jour le manifest PWA : `icons` (192, 512, maskable 512 avec `"purpose": "maskable"`), `theme_color` et `background_color` à `#0F1A14`, `name` et `short_name` à « Sevya ».
3. Dans `pages/_document.js` : `apple-touch-icon`, favicons (svg + png), `<meta name="theme-color" content="#0F1A14">`.
4. Remplace les anciennes icônes et l'ancien logo, sans toucher à autre chose.
5. Le sceau en grand (`sceau-blanc.svg`, environ 96 px) sur l'écran de connexion et sur l'écran de choix pro / particulier. Dans les en-têtes, garde le mot « Sevya » en texte, pas le sceau.
6. **Ne supprime aucune ancienne icône du dépôt** sans me montrer la liste.

Préviens Emilien : **iOS garde l'ancienne icône en cache**. Pour voir la nouvelle, il faut supprimer le raccourci de l'écran d'accueil puis le rajouter depuis Safari.

Commit `feat: logo sceau Sevya + icônes`, STOP.

---

## BLOC 1 — Réparer l'analyse IA (le PDF sort sans les 2 encadrés)

Symptôme : en prod, `/api/garden-analysis` échoue en silence ; le PDF n'a ni « Profil jardin » ni « Points à aborder ».

1. Demande à Emilien de lancer `vercel logs` (ou de regarder Vercel → Logs) pendant qu'il génère un dossier, et lis l'erreur avec lui avant de corriger.
2. Corrections probables, à appliquer selon ce que montrent les logs :
   - `export const config = { maxDuration: 60 }` sur la route ;
   - timeout côté client à 55 000 ms ;
   - valider le token avec le client **anon** + les fonctions SECURITY DEFINER (pas de service_role) ;
   - centraliser le nom du modèle dans `lib/aiModel.js` ;
   - envoyer **2 photos maximum**, compressées ;
   - **1 nouvel essai** automatique en cas d'échec ;
   - en cas d'échec définitif, **un message visible** (« Analyse indisponible, réessayer »), jamais un échec silencieux.
3. Ajoute dans la réponse de l'IA un champ **`pistes`** (tableau de 2 à 3 phrases courtes) : des pistes d'aménagement pour le paysagiste, tirées du brief. Consigne au modèle : proposer des orientations (zones, ombre, ambiance, choix de végétaux), **ne jamais décrire un plan, ni des distances, ni un placement précis**.
4. Les `pistes` ne vont **jamais** dans le PDF ni dans aucune vue du client. Elles sont réservées au pro.

Test iPhone : remplir un brief → générer le PDF → les 2 encadrés apparaissent. Commit, STOP.

---

## BLOC 2 — Base de données : les nouvelles infos du brief (SQL)

On ajoute **une seule colonne JSON** pour ne pas multiplier les migrations.

Affiche ce SQL, sauvegarde-le dans `supabase/migrations/`, puis **attends la confirmation d'Emilien** :

```sql
-- 1. Colonne pour les 4 nouvelles étapes du brief
alter table public.pro_briefs
  add column if not exists details jsonb not null default '{}'::jsonb;

-- 2. Suivi après RDV + archivage
alter table public.pro_links
  add column if not exists stage text
    check (stage in ('done','proposal','won','lost')),
  add column if not exists archived_at timestamptz;

-- 3. Réalisations : style + visibilité Partenaires
alter table public.pro_projects
  add column if not exists style text,
  add column if not exists is_public boolean not null default true;

-- 4. Fiche studio
alter table public.pro_studios
  add column if not exists presentation text,
  add column if not exists years_experience int,
  add column if not exists specialties text[];
```

Ensuite, **avant de toucher à `submit_pro_brief`** :
- Retrouve la définition actuelle de `submit_pro_brief(text, jsonb)` dans `supabase/migrations/`. Si elle n'y est pas, **dis-le à Emilien** et demande-lui de la copier depuis Supabase → Database → Functions (on a déjà perdu une fonction une fois).
- Propose une nouvelle version (`create or replace`) qui ajoute à l'insert : `details = coalesce(p_payload->'details', '{}'::jsonb)`. Tout le reste doit rester identique : même transaction, passage à `filled`, refus `already_filled`.
- Affiche-la en entier, sauvegarde-la en migration, attends l'OK.

Format attendu de `details` :

```json
{
  "household": { "children": "4 – 10 ans", "pets": ["Chien"], "uses": ["Repas dehors","Piscine"] },
  "avoid":     { "items": ["Épines","Pelouse à tondre"], "other": "pas de bambous" },
  "existing":  { "orientation": "Sud", "slope": "Plat", "soil": "Je ne sais pas", "keep": "le chêne", "remove": "thuyas" },
  "upkeep":    { "who": "Moi", "time": "1 h par mois", "contract": "Peut-être",
                 "when": "Cette année", "date_note": "avant juin", "availability": ["Samedi matin"] }
}
```

Commit, STOP.

---

## BLOC 3 — Parcours client `/b/[token]` : les 4 nouvelles étapes

Référence : `30-prototype-particulier-v2.html` (écrans `vie`, `evite`, `exist`, `ent`).

- Crée **un seul composant par étape**, réutilisable : `components/brief/StepQuotidien.js`, `StepAEviter.js`, `StepExistant.js`, `StepEntretien.js`. Ils serviront aussi dans l'appli particulier (prompt particulier) : garde-les génériques, sans logique propre à `/b/`.
- Ordre des 9 étapes : Coups de cœur · Ambiance · Mot au paysagiste · **Votre quotidien** · **Ce que vous ne voulez pas** · Mon terrain · **Ce qui existe déjà** · **Entretien et calendrier** · Budget.
- Uniquement des boutons-puces (chips) + 3 champs texte facultatifs. Chaque groupe a une option « Je ne sais pas » ou « Rien de particulier ».
- Champs obligatoires minimum : enfants + animaux (étape 4), au moins 1 choix (étape 5), orientation (étape 7), qui entretient + pour quand (étape 8).
- Enregistrer dans `details` (format du bloc 2) au moment de `submit_pro_brief`.
- La barre de progression compte désormais 9 étapes.

Test iPhone : ouvrir un vrai lien pro en navigation privée → remplir les 9 étapes → envoyer. Vérifier dans Supabase que `details` est rempli. Commit, STOP.

---

## BLOC 4 — Fiche brief côté pro (le cœur)

Référence : `29-prototype-pro.html` → écran `brief` (client « Claire Martin »).

Ordre exact des sections :
1. Photo du terrain en haut, nom, commune.
2. Boutons : **Appeler** (`tel:`), **SMS** (`sms:` prérempli, pas d'envoi automatique), **E-mail** (`mailto:`), **Itinéraire** (lien Plans/Maps avec l'adresse).
3. **En bref** : une ligne fabriquée à partir des réponses, par exemple `ambiance · entretien · usage principal · surface`.
4. La phrase du client.
5. Profil jardin + priorités (IA).
6. **Pistes pour votre proposition**, avec le sous-titre « Analyse Sevya · à vous de juger ».
7. Points à aborder au RDV (couleur clay).
8. Qui vit dans le jardin + usages (puces).
9. Ce qu'il aime (puces sauge) / ce qu'il ne veut pas (puces clay avec ✕).
10. Coups de cœur, jardins qui lui plaisent.
11. Le terrain : photos + grille Orientation · Sol · Pente · Eau · À garder · À enlever.
12. Entretien : qui, temps, contrat d'entretien.
13. Calendrier et budget + « Disponible pour le RDV : … ».
14. À montrer au RDV : réalisations du **même style** (`pro_projects.style`) ; s'il n'y en a aucune, les 3 plus récentes.

En bas, un bouton fixe qui change selon l'état : **Planifier le RDV** → (RDV posé) **Déplacer** + **RDV fait ›** → (après) **Suivi : <étape> ›**.

Les anciens briefs, qui n'ont pas de `details`, doivent s'afficher sans planter : on masque simplement les sections vides.

Test iPhone : ouvrir le brief rempli au bloc 3. Commit, STOP.

---

## BLOC 5 — PDF « atelier » + nouvelles infos

Référence : `16-pdf-atelier.html`. Couverture sombre, pages intérieures claires `#F7F4EE`.
- Ajouter : Votre quotidien, Ce que vous ne voulez pas, Ce qui existe déjà, Entretien et calendrier.
- Garder : Profil jardin + Points à aborder.
- Logo : `sceau-blanc.svg` en haut de la couverture sombre, `symbole-clair.svg` en petit dans le pied des pages claires.
- **Ne jamais mettre** les `pistes` ni les questions internes au pro (le client voit aussi ce PDF).
- Partage iOS : préparer le PDF **avant** le tap, puis `navigator.share`.

Test iPhone : générer + partager le PDF. Commit, STOP.

---

## BLOC 6 — Espace pro : navigation et accueil Projets

Référence : `29-prototype-pro.html` → écrans `projets`, `list`, `notifs`.
- Barre du bas : **Projets · Agenda · Réalisations · Studio** (4 onglets, plus de FAB +).
- Accueil : date + « Bonjour <prénom> », bloc « Prochain rendez-vous » (→ brief), gros bouton « Envoyer un lien à un client », puis **4 cases sans photo** (icône lucide + gros chiffre Fraunces + dernière activité) :
  - **Demandes** : n'apparaît que si `PARTNERS_LIVE` vaut true. Sinon, on garde 3 cases + Mes clients.
  - **Briefs prêts** = `status='filled'` sans RDV ni `stage`.
  - **En attente** = `sent` + `opened`.
  - **Mes clients** = tout le reste, avec recherche + filtres En cours / Gagnés / Perdus / Archivés.
- Cloche en haut : liste des derniers événements (lien ouvert, brief rempli). **Affichage seulement**, pas d'e-mail ni de push ce soir.

Commit, STOP.

---

## BLOC 7 — Espace pro : le reste (si le temps le permet)

Référence : `29-prototype-pro.html`.
- **Planifier le RDV** : jour + heure (durée fixée à 1 h), afficher les dispos du client. À l'enregistrement, ouvrir Messages avec la confirmation préremplie (`sms:`).
- **Agenda** : sous chaque RDV, « + Calendrier iPhone » (un fichier `.ics` pour ce seul RDV) et « Itinéraire ».
- **Suivi** (`pro_links.stage`) : RDV fait → Proposition envoyée → Gagné / Perdu, plus **Archiver** (`archived_at`).
- **Modifier / supprimer un client** (menu ⋯).
- **« Voir ce que reçoit le client »** : aperçu de la page `/b/[token]`.
- **Réalisations** : choix du style en 1 clic à la création, interrupteur « Visible dans Partenaires » (`is_public`), badge « Privée ».
- **Studio** : présentation, zone, spécialités, années d'expérience ; aperçu de la fiche publique ; « Lien client » regroupe aperçu + couleur.

Un commit par sous-partie. STOP après chacune.

---

## BLOC 8 — Écran de choix + mode découverte pro (APRÈS les tests clients, pas ce soir)

Référence : `sevya/31-prototype-decouverte.html`.
- Premier écran : « Je prépare mon jardin » / « Je suis paysagiste ».
- Même ordre sur les deux écrans : **la carte « Découvrir » en premier, en haut**, puis « ou », puis e-mail + mot de passe, **Se connecter**, **Créer mon compte**.
- Particulier → « **Découvrir sans compte** » = le vrai mode invité (ce qu'il fait est gardé, compte demandé à l'envoi du dossier). Il peut aussi se connecter ou créer son compte tout de suite. **Pas de faux compte démo côté particulier.**
- Pro → « **Découvrir avec un compte démo** » (studio fictif, voir ci-dessous), puis Se connecter / Créer mon compte.
- Page d'explication avant d'entrer : ✓ tout ouvrir, ✓ cliquer partout, ✕ rien n'est envoyé, ✕ rien n'est gardé.
- Le mode démo = **données fictives en dur dans le front** (`lib/demoStudio.js`, à partir des clients de la maquette 29). **Aucune lecture ni écriture Supabase, aucune session auth.** Impossible de toucher un vrai compte.
- Bandeau clay fixe en haut : « Mode découverte · clients fictifs — Créer mon compte ».
- Bloqués avec un message (« rien n'est envoyé ») : envoyer un lien, relancer, appeler, SMS, e-mail, itinéraire, copier le lien, s'abonner. Le reste marche en local (planifier, accepter, filtrer) et repart à zéro en quittant.
- Dans Studio : « Quitter la découverte » à la place de « Se déconnecter ».

---

## PAS CE SOIR (noté, ne pas coder)

- **Notifications par e-mail / push** : il faut un service d'envoi (Resend ou équivalent) et une clé. C'est à décider avec Emilien.
- **Demandes Partenaires réelles** (table des demandes, délai de 48 h, accepter / décliner, partage des coordonnées avec consentement RGPD) : quand il y aura environ 10 paysagistes.
- Abonnement Stripe à 29 €/mois.
- Suggestion automatique de réalisations par IA (le filtre par style suffit).
- Devis, facture, plan, placement : **hors cap**.
