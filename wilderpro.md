# wilderpro.md — Contexte projet (source de vérité)

> Ce fichier est la mémoire du projet. Toute session Cursor / Claude Code / Claude
> doit le lire en premier. À garder à jour à chaque décision importante.
> **Nom officiel : Sevya** (voir §8). Affichage envisagé : « Sévya » (accent pour la prononciation), URL et code restent sans accent.
> **Dernière mise à jour : 17 octobre 2026** (voir §20).

---

## 1. La promesse

Aider le **paysagiste** à comprendre les envies de son client **avant le premier rendez-vous**.

On ne vend ni une IA, ni un logiciel : on vend un résultat.
**« Avant même le premier RDV, le paysagiste comprend ce que son client imagine. »**

---

## 2. Décision stratégique fondatrice : PRO-FIRST

On construit **d'abord l'outil pour le paysagiste**, pas pour le particulier. Raisons :

- **Distribution** : c'est le pro qui amène le client (au moment de plus forte intention), on ne se bat pas dans les stores contre PictureThis.
- **Monétisation** : le particulier ne paierait pas ; le pro oui (~29 €/mois) s'il gagne du temps et convertit plus.

**Le flux d'entrée (à respecter absolument) :**
1. Le paysagiste envoie un **lien** à son client avant le 1er RDV.
2. Le client remplit un brief **sans créer de compte, sans rien télécharger** (mode invité).
3. Le brief remonte **directement dans le compte du pro**, avec nom / adresse / téléphone du client, sans ressaisie.

Chaque étape d'install ou d'inscription tue 60–80 % des gens → le mode invité est non négociable pour le MVP.

---

## 3. Le cap (ce qu'on ne fait JAMAIS)

Mission unique : **préparer un excellent premier rendez-vous.** Rien d'autre.

Exclu du produit :
- Plans 2D / 3D, réalité augmentée
- Devis, facturation
- Planning complet, gestion d'équipe, gestion de matériel
- CRM complet

**Note :** un **agenda RDV léger** (planifier un créneau lié à un brief) est dans le MVP — ce n'est pas un planning d'équipe ni une gestion de chantier.

**Ligne rouge design :** l'app aide le client à **choisir ses envies** (végétaux, ambiances, matériaux) — mais elle ne fait **jamais le plan / le placement dans l'espace**.
Le placement (distances, associations, « qui va étouffer qui »), c'est l'expertise du paysagiste.
→ Un client qui arrive avec « lavande, olivier, cordyline » est un **cadeau** (gain de temps pour le pro). Choisir des végétaux = OK et utile. Composer/dessiner le jardin = réservé au pro.

---

## 4. Le différenciateur (le « wouah » du paysagiste)

1. **Le goût déduit (« Profil Jardin »)** : style, ambiance, entretien, priorités classées — formulé dans le **vocabulaire du pro**, pas comme un inventaire.
2. **Les points de vigilance / contradictions détectées** (ex. « veut du luxuriant mais très faible entretien », « cordyline peu rustique pour la région »). C'est ce qui rend l'outil *indispensable* : ça dit au pro exactement quelle conversation avoir sur place.
3. **Le terrain** : photos du jardin actuel + orientation + surface + sol → le pro peut pré-chiffrer avant de se déplacer.

Bénéfice pro : arrive préparé → convertit plus, chiffre plus vite et plus juste, ne gaspille plus sa première visite.

---

## 5. Le marché

- **Déjà saturé** : ID de plantes (PictureThis, PlantNet, Planta) ; design IA/3D (Gardenly, iScape, Neighborbrite) ; logiciels pros (Extrabat, WAD, JardiContacts).
- **Le trou que personne ne remplit** = le nôtre : un outil **côté client** qui transforme un goût en **brief remis à SON paysagiste**, sans plan ni gestion.
- **Le moat n'est pas la techno de scan** (un géant peut l'ajouter). Le moat = le **document de brief** + le fait de **posséder le moment particulier → pro**.

---

## 6. Architecture : deux apps, un socle commun

**Ne jamais repartir de zéro. Ne jamais casser la v2 particulier qui tourne (déployée sur Vercel).**

- La **v2 particulier** existe déjà : carnet, scan, catalogue (Végétal / Minéral / Déco / Idées), « Mon jardin », « Mon mot pour le paysagiste », brief.
- **Amont Pro** réutilise ~80 % de la v2 : design system, IA d'analyse d'image, catalogue, logique de brief.

### Décision actuelle (juillet 2026) : route `/pro` dans l'app Next.js existante

**Pas de monorepo pour l'instant.** On ajoute simplement la route `/pro` dans le même projet Next.js (même dépôt, même Supabase, même design system). Zéro plomberie inutile.

- **`/`** — page d'accueil Sevya (choix particulier / pro).
- **`/connexion`** — connexion ou création de compte particulier ou pro (`?profil=particulier` \| `?profil=pro`).
- **`/jardin`** — app particulier (ex-v2 sur `/` ; priorité absolue de ne pas le casser).
- **`/pro`** — espace pro — styles isolés sous `.wp` (`styles/pro/wilder-pro.css`), composants dans `components/pro/` ; **≥ 900 px** : menu latéral + contenu pleine largeur.
- **`/b/[token]`** — brief client sans compte (questionnaire invité, plein écran, isolé du shell app). Lit `pro_links` + branding studio ; écrit `pro_briefs` + Storage ; statuts `sent` → `opened` → `filled` via RPC.
- **`/bienvenue`** — redirection vers `/` (alias historique).
- **App pro `/pro` :** même auth Supabase que le particulier ; `pro_studios` (1 / compte) ; création de liens réels ; liste + fiche brief depuis `pro_links` / `pro_briefs` ; RDV via `pro_appointments` ; export PDF (`window.print`).
- Branche de travail : `wilder-pro` (**jamais** pousser / merger sur `main` sans validation explicite — `main` = v2 particulier en prod).

### Espace particulier (`/jardin`)

**Coups de cœur (règle produit, oct. 2026)**  
- Un **coup de cœur** = un **élément présent dans le jardin** (palette Supabase), quelle que soit l’origine (scan ou catalogue / idées).  
- **Cœur sur le catalogue** → ajout au jardin (pas de liste parallèle).  
- **Cœur sur un résultat de scan** → ajout au jardin.  
- Le champ `favori` sur les discoveries **n’est plus** la source de vérité pour les coups de cœur (legacy UI / PDF jusqu’à refonte).  
- Les **scans non ajoutés** au jardin restent dans l’historique **« Tous mes scans »**, accessible depuis l’écran **Coups de cœur**.

**Dossier jardin (progression)** — 5 étapes : coups de cœur (≥ 1 élément palette), mot pour le paysagiste, ambiance, photos du terrain, budget. Calcul purement côté client : `lib/gardenDossierProgress.js`.

**Navigation cible (refonte)** — barre : Accueil · Idées · **+** · Coups de cœur · Dossier.

### Données Pro (Supabase)

| Table | Rôle |
|-------|------|
| `pro_studios` | 1 studio / compte pro (`pro_user_id`) |
| `pro_links` | Lien client ; `status` ∈ `sent` \| `opened` \| `filled` |
| `pro_briefs` | Réponses du questionnaire (1 / lien) |
| `pro_appointments` | RDV planifiés dans l’app (`studio_id`, `link_id`, `starts_at`, `duration_min`, `notes`) |

- **Statut UI « RDV planifié »** : **dérivé** (lien `filled` + au moins un `pro_appointments` pour ce `link_id`). **Pas** de `status = 'rdv'` sur `pro_links`.
- **RPC `submit_pro_brief`** : `SECURITY DEFINER` — dans **la même transaction** : `INSERT` `pro_briefs` **puis** `UPDATE pro_links SET status = 'filled', filled_at = now()`. L’invité (anon) ne touche **pas** `pro_links` en direct.  
  **Versionnée** dans `supabase/migrations/` (ex. `20260719160000_submit_pro_brief_set_filled.sql`) — **ne pas la reperdre** (ne plus compter uniquement sur un collage SQL Editor orphelin).
- Ouverture lien : RPC `get_pro_link_by_token` (`sent` → `opened`).
- Migrations utiles aussi : `20260719150000_pro_studios_unique_and_rls.sql`, `20260722210000_pro_appointments.sql`.

Un monorepo (deux apps déployées séparément, ex. `app.amont.fr` / `mon.amont.fr`) reste une option **plus tard** si l'isolation ou le déploiement le justifient. Même base de données / backend commun restera indispensable pour le lien pro → client.

---

## 7. Design system (identité partagée pro ↔ particulier)

- **Police** : Quicksand (ronde), poids 400/500/600/700.
- **Fond** : greige/beige. Panneaux blancs très arrondis (radius ~30 px).
- **Hero** : vert forêt en dégradé, coins arrondis.
- **Cartes d'action pastel** :
  - Pêche `#F6E7D8` / icône orange `#DB7E44`
  - Vert menthe `#E6F0E3` / vert `#4E7B52`
  - Lavande `#ECE6F5` / violet `#7A67A6`
- **Accent lavande** = le goût déduit / l'intelligence.
- **Ambre / pêche** = points de vigilance.
- **Vert boutons** : `#2F5E3F`.
- **Barre d'onglets** flottante blanche + **bouton central surélevé (FAB)**.
- **Icônes** : lucide (line icons).

> ⚠️ Couleurs ci-dessus = reconstituées d'après captures. **À caler sur les valeurs exactes de la v2** (récupérer le fichier de thème / tokens réels du repo).

---

## 8. Nom : SEVYA (décidé le 8 oct. 2026)
- Sevya, de « sève » : ce qui fait vivre le jardin, comme le brief fait vivre le premier RDV. Nom inventé, court, le « y » le rend élégant et distinctif.
- Domaines : **sevya.app** et **www.sevya.app** (acheté le 8 oct. 2026 chez OVH ; branchés sur Vercel le 9 oct. 2026).
- Optionnel : sevya-app.fr en redirection vers sevya.app.
- Pris : sevya.fr, sevya.com, sevia.fr, sevia.com, sevia.app.
- À faire : réserver @sevya sur Instagram / LinkedIn / Facebook ; plus tard, recherche INPI/EUIPO puis dépôt de marque ; renommer progressivement Kré / Wilder → Sevya dans l'UI.
- Historique : Wilder, Amont, Kré abandonnés au profit de Sevya.

---

## 9. MVP Pro

### Fait (étape C — testé)

- [x] Auth pro + studio (`pro_studios`, 1 / compte, même auth Supabase que le particulier)
- [x] Empty state « Envoyez votre premier lien »
- [x] Envoi du lien réel : nom / tél / adresse → token unique → copier / SMS / e-mail
- [x] **Suivi d'état du lien** : `sent` → `opened` → `filled` (RPC)
- [x] Tableau de bord / pipeline UI : `Brief prêt` · `En attente` · `RDV planifié` (ce dernier **dérivé** des appointments)
- [x] **Fiche brief** réelle : identité · goût déduit · priorités · végétaux · matières · photos · budget · vigilance · à aborder au RDV
- [x] Export PDF (impression navigateur de la fiche)
- [x] **RDV in-app** : table `pro_appointments`, sheet Planifier, onglet Agenda (plus de `.ics`)
- [x] Parcours client `/b/[token]` (questionnaire invité + photos Storage + soumission RPC)

### Encore à faire

- [ ] Onboarding riche (logo, zone d’intervention saisie / sauvegardée)
- [ ] Personnalisation du lien (couleur + logo du pro sur la page vue par le client — persistée)
- [ ] Abonnement / facturation (c'est le pro qui paie)
- [ ] Confirmation d'envoi plus explicite (« on vous prévient dès qu'il répond »)
- [ ] Enrichissement fiche : terrain (orientation / surface / sol) côté brief
- [ ] Un **seul dossier vivant** qui s'enrichit dans le temps (pas deux briefs séparés) — socle OK, enrichissement V2

---

## 10. V2 Pro (plus tard, pas au lancement)

- Notes après visite (photos + dictée vocale, résumé IA)
- Le dossier qui s'enrichit quand le client approfondit côté particulier
- Relance automatique
- Suivi de conversion (RDV → devis → gagné / perdu)
- Recherche dans les briefs
- Équipe (plusieurs paysagistes sur un compte)

---

## 11. Couche particulier approfondie (V2, décidée)

Après le **premier brief en invité**, le client PEUT créer un compte pour aller plus loin :
- Il parcourt le catalogue (**idéalement celui du paysagiste** = choix réalistes) et sort un brief plus poussé.
- Ça reste des **envies et priorités**, jamais une prescription / un plan.
- L'app **signale les incohérences** avant que ça n'arrive chez le pro.

Ordre imposé : MVP invité minimaliste **d'abord** → prouver que les pros envoient le lien et adorent → **ensuite seulement** la couche compte client.

---

## 12. ⚠️ Prochaine priorité (mise à jour 17 oct. 2026)

Plan complet : doc « Audit Sevya — octobre 2026 » (Claude) + §20 ci-dessous.

**Définition de « fini » :** un paysagiste peut utiliser Sevya seul avec ses vrais clients, et payer.

1. **Brevo** (reporté par Emilien) : e-mail au pro quand un brief est rempli (priorité n°1 produit), et envoi serveur du lien par SMS / e-mail (fonctionne depuis n'importe quel appareil).
2. **Pilotes** : 3 à 5 paysagistes, gratuitement, avec de vrais clients pendant 1 mois. Question finale : « Tu paierais 29 €/mois ? »
3. **Page admin Sevya** (remplace les stats Wilder scans/Stripe) pour suivre les pilotes.
4. **Paiement** seulement si les pilotes disent oui : micro-entreprise (SIRET), Stripe, CGV, adresse pro (domiciliation), relecture juriste.
5. Ensuite : dette (CSS mort ~85 %, fichiers géants, Sentry), sauvegardes Supabase, ouverture à Google (retirer noindex, robots, sitemap), photos Adobe (licences seulement après les pilotes).

---

## 12 bis. Dette — dossier particulier (`/jardin`)

**Ambiance, budget et terrain (champs + photos)** sont stockés **uniquement sur l’appareil** :
- `localStorage` : ambiance choisie, fourchette budget, champs terrain (surface, calendrier, eau/électricité).
- **IndexedDB** : photos terrain (JPEG compressé via `lib/compressImage.js`).

**À faire plus tard :** synchroniser ces données avec le compte / Supabase (comme le reste du jardin), sans toucher au parcours `/b/[token]` ni à `pro_briefs`.

---

## 13. Workflow (solo)

- Fondateur seul, travaille avec : Claude (chat/projet), **Claude Code**, **Cursor**.
- Ces espaces **ne partagent pas de mémoire** entre eux.
- **Ce fichier `wilderpro.md` est la source de vérité.** Le garder à la racine du repo et le mettre à jour à chaque décision.
- Branche de travail Pro : **`wilder-pro` uniquement** — jamais `main` sans accord explicite.

**Déploiement continu :** après chaque étape terminée et testée au build, déployer automatiquement en prod : `npm run build`, commit, `git checkout main`, `git merge wilder-pro`, `vercel --prod` (projet **plante-infini-yy6l**, vérifier `.vercel/project.json`), `git push origin main`, `git push origin wilder-pro` (sauvegarde GitHub), `git checkout wilder-pro`, puis donner le statut du déploiement. En cas de conflit de merge ou d'erreur de build, s'arrêter et montrer l'erreur sans rien déployer.

---

*Dernière mise à jour : 2026-07-22 — étape C terminée et testée (auth, liens, briefs, PDF, RDV in-app) ; nom produit Amont ; `submit_pro_brief` + `pro_appointments` versionnés en migrations.*

---

## 17. Décisions du 12 octobre 2026 (catalogue, photos, design)

- **Idées = 4 cases** : Végétal (200 plantes, 188 avec photo) · Paillages (ex-Minéral, 4 familles par couleur, taille des grains fin/moyen/gros) · Bordures (ex-Aménagements, photos = réalisations d'Emilien) · Styles de jardin (mur de vues d'ensemble + réalisations + projets 3D, sans texte).
- **Règle : pas de photo = masqué** (mais toujours résolvable par id pour ne pas casser les coups de cœur).
- **Photos** : banques libres (Wikimedia/Pixabay) triées à la main ; choix dans sevya/photo-choices.json, photo-picks-vegetal.txt, photo-picks-vues.json, realisations-choix.json. Les photos brutes d'Emilien (sevya/realisations/) sont gitignorées et ne sont jamais publiées telles quelles (EXIF/GPS supprimés).
- **Bordures** : les banques gratuites ne donnent rien ; sources = réalisations d'Emilien, sinon Adobe Stock (~30 $ pour 10 images).
- **Design « Atelier »** décidé par Emilien : fond vert nuit #0F1A14, Fraunces + Inter, photo au premier plan, accent sauge #C9D6B8, filets fins. Maquettes : sevya/15-sevya-atelier.html (app) et sevya/16-pdf-atelier.html (PDF : couverture sombre, pages intérieures claires). L'espace pro et /b/[token] seront traités après.
- **Analyse IA du dossier** en ligne mais en échec silencieux en prod au 12/10 (diagnostic via vercel logs demandé : timeout / clé service role / format).

## 18. Décisions du 13 octobre 2026
- **Scan photo supprimé** côté particulier (coût IA, hors cœur de cible). Plus de bouton « + » dans la barre.
- **Barre particulier : Accueil · Idées · Cœurs · Dossier · Partenaires.**
- **Partenaires** : annuaire des paysagistes payants avec leurs réalisations ; un particulier peut leur envoyer son dossier (source de clients = argument d'abonnement). Décision d'Emilien : visible aussi pour les clients venus par un pro. Lancement en « Bientôt disponible » + « Me prévenir », ouverture réelle à ~10 paysagistes.
- Prototype cliquable de référence : sevya/25-prototype-particulier.html. Plan de travail : sevya/PROMPT-CE-SOIR.md.

## 19. Décisions du 13 octobre (suite)

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

---

## 20. Audit et corrections du 17 octobre 2026

Audit complet fait avec Claude (doc « Audit Sevya — octobre 2026 »). Corrigé et déployé le jour même :

- **Textes faux retirés** côté pro : plus d'« Essai 14 j », de « 29 € / mois », de bouton « Gérer », ni de « Amont Pro ». Abonnement = « Version pilote gratuite », Notifications = « Bientôt disponible ».
- **Envoi du lien** : uniquement **SMS** et **E-mail** + bouton « Copier le lien » à côté de l'URL. **QR code supprimé** (le client n'est pas à côté du pro avant le RDV ; chaque lien est personnel). Plus aucun appel à api.qrserver.com.
- **Onglet Partenaires retiré** de la barre particulier (fonction factice, PARTNERS_LIVE = false). Barre : Accueil · Idées · Cœurs · Dossier. Les écrans restent dans le code.
- **Brief client** : 8 étapes, toutes facultatives (« Passer »), étape « Ce qui existe déjà » supprimée partout. Phrase RGPD avant l'envoi (« transmis uniquement à [studio] »).
- **Quota IA en base** : `consume_ai_quota` (table `ai_usage`), 10 analyses / compte / jour, appelé avant Claude dans `/api/garden-analysis`. L'ancienne limite en mémoire est supprimée.
- **Suppression de compte** (RGPD) : `delete_my_account()` + `lib/accountDeletion.js` (photos effacées d'abord via Storage, puis la fonction SQL en une transaction). Lien « Supprimer mon compte » dans le menu compte (particulier) et l'onglet Studio (pro), confirmation en tapant SUPPRIMER. Testé avec un compte jetable. Supprimer un lien client efface aussi ses photos.
- **Pages légales réécrites** pour Sevya pilote gratuit : éditeur Emilien Gaillard (sans adresse, art. 6-III-2 LCEN, statut non professionnel), hébergeur Vercel, données Supabase **eu-central-2 Zurich (Suisse)**, Anthropic pour les synthèses, CGV = « aucune vente pendant le pilote ». ⚠️ À refaire relire par un juriste + adresse pro avant toute offre payante.
- **Schéma pro versionné** : `20260719000000_pro_schema_base.sql` (pro_studios, pro_links, pro_briefs, RLS, get_pro_link_by_token, is_valid_brief_token), exporté de la prod. Toutes les migrations pro rejouent sans erreur sur une base vide.
- **Nettoyage** : photos plein écran allégées dans `public/images/hero/` (accueil 870 → 320 Ko), 2 polices (Fraunces + Inter) au lieu de 4, en-têtes de sécurité (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy), une seule meta description par page, 4 fichiers morts supprimés, formulaire de connexion pro réaligné.
- **Catalogue** : 217 fiches ajoutées masquées (`sevya/catalogue-*-ajouts.json`) ; sélections Adobe Stock dans `sevya/adobe-picks-*.json` (229 plantes / 347 ont 2 photos choisies ; 118 plantes d'origine restent à faire). **Ne pas licencier avant les pilotes**, sauf les images du lien client.

**Décisions :**
- Le QR code ne revient pas. Canaux d'envoi : SMS + e-mail (+ copier).
- Brevo choisi pour l'envoi serveur (e-mails + SMS, société française), **mis en attente** par Emilien. Remplace la règle « jamais d'envoi automatique payant » du §19 quand il sera branché.
- Nom affiché « Sévya » envisagé ; vérifier INPI/EUIPO (une société américaine « Sevya » existe, autre métier).

**Méthode de travail (validée le 17 oct.) :** Claude fait lui-même les modifications de code, les vérifie (build + captures sur une copie locale) et les enregistre sur `wilder-pro`. Emilien ne colle dans Cursor que le prompt de mise en prod (tag, merge `--no-ff` vers main, `vercel --prod`). Le SQL de prod est toujours affiché en entier et collé à la main dans Supabase, et versionné dans `supabase/migrations/`.

**Points ouverts :**
- Supabase est en offre **FREE** : pas de sauvegarde automatique téléchargeable → mettre en place une sauvegarde manuelle.
- Vérifier que le vrai nom d'Emilien figure dans les réglages du compte Vercel (exigé par la mention légale sans adresse).
- Page admin encore orientée Wilder (scans, Stripe) → à refaire pour Sevya.

