# Audit complet — Wilder (plante-infini)

**Date :** 14 juin 2026  
**Périmètre :** codebase Next.js 14 (`pages/`, `components/`, `lib/`, `pages/api/`, Supabase migrations, Stripe, PWA)  
**Méthode :** lecture statique du code — **aucune modification** appliquée dans cette passe.

> Ce document est un audit technique. Les textes légaux du repo sont explicitement marqués « à faire valider par un juriste ».

---

## 1. Architecture & structure du code

### 🔴 Critique — Monolithe `pages/index.js` (~4 200 lignes)

- **Où :** `pages/index.js` — ~81 imports, ~37 fonctions locales, ~57 `useState`, ~69 `setScreen(...)`, routing client par string (`home`, `camera`, `result`, etc.).
- **Pourquoi :** Toute évolution (bug, feature, test) touche un fichier ingérable ; risque de régressions ; impossible à tester unitairement ; onboarding développeur très lent.
- **Correction :** Extraire par domaine : `useScreenRouter`, `useCamera`, `useScanFlow`, écrans dans `components/screens/*`, garder `index.js` comme assembleur léger (<500 lignes).

### 🟠 Important — Monolithes `lib/i18n.js` (~4 100 lignes) et `styles/globals.css` (~14 000 lignes)

- **Où :** `lib/i18n.js` (6 langues × arborescence complète) ; `styles/globals.css` (tout le design system).
- **Pourquoi :** Conflits Git fréquents, chargement CSS/parse JS coûteux, duplication de clés entre thèmes (`potager`, `jardin`, `randos`).
- **Correction :** Split i18n par locale (`locales/fr.json`) ou par domaine ; CSS par feature (`home.css`, `scanner.css`) ou CSS modules ; tokens dans un fichier `:root` partagé.

### 🟠 Important — Composants et `lib/` plats sans regroupement

- **Où :** 74 composants et 79 fichiers `lib/` à la racine, nommés par préfixe (`potager*`, `espaceVert*`, `rando*`).
- **Pourquoi :** Navigation difficile, frontières floues, duplication entre thèmes parallèles.
- **Correction :** Dossiers `components/home/`, `components/potager/`, `lib/potager/`, etc.

### 🟠 Important — Duplication scan résultats / notifications / storage

- **Où :** `PotagerScanResult.js`, `JardinScanResult.js`, `RandoScanResult.js` (structure quasi identique) ; `potagerNotifications.js` / `natureNotifications.js` ; pattern `load/save localStorage` répété dans ~15 fichiers.
- **Pourquoi :** Bugs corrigés dans un thème mais pas l'autre ; maintenance × N.
- **Correction :** `ScanResultLayout` générique ; `createNotificationHelpers()` ; utilitaire `createLocalStorageStore(key, schema)`.

### 🟢 Secondaire — Code mort et imports orphelins

- **Où :** `RandosView.js`, `EspacesVertsView.js`, `HomeDashboard.js`, `HomeGreeting.js` importés dans `index.js` mais non rendus ; `AlbumMap`, `AlbumsMapView`, `HomeFireflies`, `FallingLeaves` définis inline mais jamais utilisés ; `setScreen("randos")` sans branche `screen === "randos"`.
- **Pourquoi :** Bundle et confusion ; dette de routing legacy (`randos` / `jardin` vs `NAV_THEMES`).
- **Correction :** Supprimer ou réintégrer ; aligner `lib/themes.js` et les écrans réels.

### 🟢 Secondaire — Un seul hook custom (`hooks/useGuestAccount.js`)

- **Où :** `hooks/` (1 fichier) ; `lib/useRandoNatureAlerts.js` (hook hors convention).
- **Pourquoi :** Logique réactive concentrée dans `Wilder()` au lieu de hooks réutilisables.
- **Correction :** Déplacer hooks dans `hooks/` ; extraire `useGuestAccount`-like pour auth boot, discoveries, albums.

### 🟢 Secondaire — Pages légales : bon pattern à généraliser

- **Où :** `pages/cgu.js`, `cgv.js`, etc. → `LegalPageLayout` + `lib/legalContent.js`.
- **Pourquoi :** C'est le bon modèle (thin pages, contenu séparé).
- **Correction :** Répliquer pour i18n et autres contenus statiques.

---

## 2. Sécurité

### 🔴 Critique — Premium activable sans paiement Stripe

- **Où :** `components/SubscriptionScreen.js` (`recordPaymentSuccess` au clic plan) ; `lib/freemium.js` (`localStorage` `wilder-premium`, `isPremium()`) ; `pages/api/scan-quota.js` POST `activate_premium` sans vérification paiement ; `lib/scanQuotaClient.js` `activatePremiumOnServer()`.
- **Pourquoi :** N'importe qui peut obtenir Premium gratuitement (UI ou `curl` + header visiteur). Les CGV mentionnent Stripe mais **aucun Checkout / webhook** n'existe dans le code.
- **Correction :** Stripe Checkout Session + webhook signé (`stripe.webhooks.constructEvent`) ; activer premium **uniquement** côté serveur après `checkout.session.completed` ; supprimer la confiance `localStorage` pour `isPremium()`.

### 🔴 Critique — RPC `activate_scan_premium` probablement appelable avec la clé anon

- **Où :** `supabase/migrations/20250605120000_scan_counts.sql` — fonctions `SECURITY DEFINER` sans `REVOKE EXECUTE FROM PUBLIC, anon, authenticated`.
- **Pourquoi :** Avec `NEXT_PUBLIC_SUPABASE_ANON_KEY`, un attaquant peut appeler `POST /rest/v1/rpc/activate_scan_premium` et bypasser `/api/scan-quota`.
- **Correction :** `REVOKE ALL ON FUNCTION ... FROM PUBLIC; GRANT EXECUTE TO service_role;` pour toutes les RPC sensibles ; n'activer premium que via service role (API webhook).

### 🔴 Critique — Bucket Storage `images` : upload public sans auth

- **Où :** `supabase/migrations/20250603000000_images_bucket.sql` — policy `Public upload` `to public` sur `bucket_id = 'images'`.
- **Pourquoi :** Upload illimité de fichiers (10 MB, images) par n'importe qui ; bucket public → URLs permanentes ; risque spam / malware / coûts.
- **Correction :** INSERT/UPDATE/DELETE limités à `authenticated` + chemin `(storage.foldername(name))[1] = auth.uid()::text` ; envisager bucket privé + signed URLs.

### 🟠 Important — RPC admin `SECURITY DEFINER` exposées

- **Où :** `supabase/migrations/20250606100000_admin_stats_rpcs.sql` — `admin_unique_scan_visitors`, `admin_auth_accounts_summary`, etc.
- **Pourquoi :** Agrégats métier et comptes `auth.users` potentiellement accessibles via PostgREST + anon key.
- **Correction :** REVOKE public ; GRANT uniquement `service_role` ; stats admin uniquement via `pages/api/admin/stats` (déjà protégé par cookie).

### 🟠 Important — Tables communauté : INSERT ouvert, pas de modération

- **Où :** `20250604000000_potager_community.sql`, `20250604100000_rando_community.sql` — policies `using (true)` / `with check (true)` sur SELECT/INSERT ; likes supprimables par tous.
- **Pourquoi :** Spam géolocalisé, contenu illicite, manipulation votes (`voter_id` client).
- **Correction :** Auth obligatoire, colonnes `author_id`, rate limiting API, DELETE own-row only.

### 🟠 Important — Routes API IA sans quota uniforme

- **Où :** Quota sur `pages/api/analyze.js`, `analyze-animal.js` seulement ; **pas** sur `potager-daily-care.js`, `tree-age.js`, `potager-ideas.js`, `potager-recipes.js`, `randos-trail-descriptions.js`.
- **Pourquoi :** Abus de `ANTHROPIC_API_KEY` → coûts et DoS économique.
- **Correction :** Middleware quota/auth partagé sur toutes les routes qui appellent Claude.

### 🟠 Important — Quota désactivé si `SUPABASE_SERVICE_ROLE_KEY` absente

- **Où :** `lib/scanQuotaServer.js` — si service role indisponible, `skipped: true` et scans autorisés.
- **Pourquoi :** Mauvaise config prod = freemium illimité silencieux.
- **Correction :** Fail closed : refuser scans si quota serveur indisponible (503 explicite) ; alerte déploiement.

### 🟠 Important — Identité visiteur contrôlée par le client

- **Où :** `lib/visitorId.js` (localStorage) ; header `X-Wilder-Visitor-Id` dans `lib/scanQuotaClient.js` ; `resolveScanIdentity` dans `scanQuotaServer.js`.
- **Pourquoi :** Rotation d'UUID = reset quota ; IP hashée via `X-Forwarded-For` spoofable si non validé par l'edge.
- **Correction :** Lier quota au compte authentifié ; rate limit IP côté Vercel ; cookie HttpOnly visiteur signé.

### 🟠 Important — Admin : mot de passe unique, pas de rate limit

- **Où :** `pages/api/admin/session.js`, `lib/adminAuth.js` — `ADMIN_PASSWORD`, cookie HMAC (bien : HttpOnly, SameSite).
- **Pourquoi :** Brute force sur `/api/admin/session`.
- **Correction :** Rate limit (Vercel / Upstash), lockout, mot de passe fort + rotation, idéalement auth Supabase avec rôle admin.

### 🟠 Important — Pas de webhook Stripe ni vérification de signature

- **Où :** Aucun `pages/api/stripe/*` ; `lib/stripeAdmin.js` = lecture seule MRR ; package `stripe` installé mais non utilisé pour paiements.
- **Pourquoi :** Impossible de réconcilier abonnements réels avec `scan_counts.is_premium`.
- **Correction :** Implémenter webhook + idempotency + mapping `stripe_customer_id` / `subscription_id`.

### 🟢 Secondaire — Fuite messages d'erreur API

- **Où :** Divers `pages/api/*` retournent `error.message` brut au client.
- **Pourquoi :** Fuite stack / internals.
- **Correction :** Messages génériques côté client, logs serveur structurés.

### 🟢 Secondaire — `pages/api/hello.js` scaffold public

- **Où :** `pages/api/hello.js`
- **Pourquoi :** Surface inutile.
- **Correction :** Supprimer en production.

### 🟢 Secondaire — Clés serveur correctement isolées (point positif)

- **Où :** `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `ADMIN_PASSWORD` — uniquement côté serveur / `lib/supabaseAdmin.js`, `stripeAdmin.js`.
- **Note :** `NEXT_PUBLIC_SUPABASE_ANON_KEY` est normal ; la sécurité repose sur RLS (actuellement insuffisant sur storage/RPC).

### 🟢 Secondaire — RLS `analyses` et `user_profiles` (point positif partiel)

- **Où :** `20250605000000_analyses_user_sync.sql`, `20250614000000_user_profiles.sql` — accès own-row pour `authenticated`.
- **Note :** Comptes anonymes Supabase comptent comme `authenticated` ; consentements modifiables par le client sans audit serveur.

---

## 3. Performance

### 🟠 Important — Aucun usage de `next/image`

- **Où :** Grep : 0 `next/image` ; toutes les images via `<img>` ; Unsplash en URLs directes (`lib/potagerJuneIdeas.js`, `styles/globals.css` backgrounds).
- **Pourquoi :** Pas d'optimisation format/taille/LCP ; photos scan en base64 volumineuses en mémoire React.
- **Correction :** `next/image` + `images.remotePatterns` pour Unsplash ; thumbnails compressés ; `priority` sur hero.

### 🟠 Important — Bundle monolithique SPA

- **Où :** `pages/index.js` (~66 kB page + ~259 kB First Load JS au build) ; `globals.css` ~40 kB ; Leaflet import dynamique partiel (`index.js`).
- **Pourquoi :** TTI long sur mobile ; tout chargé même si l'utilisateur ne ouvre jamais potager/randos.
- **Correction :** `dynamic()` pour écrans secondaires ; analyser avec `@next/bundle-analyzer` ; code-split par `screen`.

### 🟠 Important — `lib/i18n.js` chargé en entier

- **Où :** Import central dans quasi toute l'app.
- **Pourquoi :** ~4k lignes × 6 langues parsées même si l'utilisateur ne lit qu'une langue.
- **Correction :** Import dynamique de la locale active ; tree-shaking par fichier JSON.

### 🟢 Secondaire — Service Worker : versions incohérentes

- **Où :** `public/sw.js` precache `?v=20250605` ; `pages/_document.js` / `manifest.json` utilisent `20250610`.
- **Pourquoi :** Icônes/manifest potentiellement stale en cache.
- **Correction :** Une seule constante de version partagée ; bump `CACHE_NAME` à chaque release.

### 🟢 Secondaire — Pas de `sharp` en prod build images utilisateur

- **Où :** `sharp` en devDependency (favicons) ; uploads storage sans resize serveur.
- **Pourquoi :** Photos pleine résolution stockées et affichées.
- **Correction :** Resize côté client avant upload ou pipeline storage (Supabase transform / edge function).

---

## 4. UX & cohérence design

### 🟠 Important — Footer fixe sur toutes les routes

- **Où :** `pages/_app.js` + `components/Footer.js` (`position: fixed`, `z-index: 40`).
- **Pourquoi :** Peut masquer contenu bas (section « dernières trouvailles », boutons) ; classe `.with-scanner-fab` définie mais jamais appliquée (`globals.css`).
- **Correction :** Padding bottom global sur écrans scrollables ; ou footer non-fixe sur home ; appliquer `with-scanner-fab` où nécessaire.

### 🟠 Important — Incohérence paiement UX vs réalité

- **Où :** `SubscriptionScreen` simule paiement ; `lib/i18n.js` `payment_note: "Paiement sécurisé"`.
- **Pourquoi :** Utilisateur croit payer ; aucune facture Stripe ; risque juridique.
- **Correction :** Intégrer Stripe réel ou retirer les libellés de paiement jusqu'à implémentation.

### 🟢 Secondaire — États de chargement incomplets

- **Où :** Bon : boot auth, camera, analyze, admin. Manquant : `useRandoNatureAlerts.loading` ignoré ; cartes Leaflet sans spinner ; strings `map_loading` i18n jamais utilisées.
- **Correction :** Uniformiser skeleton/spinner ; supprimer i18n mort.

### 🟢 Secondaire — Consentements légaux en français hardcodé

- **Où :** `components/LegalConsentCheckbox.js` — texte FR fixe hors `i18n`.
- **Pourquoi :** Incohérent avec app multilingue.
- **Correction :** Clés `legal.cgu_consent`, `legal.cgv_consent` dans `i18n.js`.

### 🟢 Secondaire — Navigation SPA sans deep linking

- **Où :** Routing par `screen` state dans `index.js`.
- **Pourquoi :** Pas d'URL pour partager un album, une découverte, retour navigateur imprévisible.
- **Correction :** Query/hash routing ou App Router avec routes réelles.

---

## 5. Accessibilité

### 🟠 Important — Pas de styles `:focus-visible` globaux

- **Où :** `styles/globals.css` — focus explicite seulement sur quelques composants (accordion, certains inputs).
- **Pourquoi :** Navigation clavier invisible sur boutons principaux (scanner, CTA premium).
- **Correction :** Règle globale `button:focus-visible, a:focus-visible { outline: 2px solid #7fe0a0; }`.

### 🟠 Important — `maximum-scale=1` dans viewport

- **Où :** `pages/_document.js` ligne viewport.
- **Pourquoi :** Empêche zoom — non conforme WCAG 2.2 (1.4.4 Resize Text).
- **Correction :** Retirer `maximum-scale=1` ou utiliser `maximum-scale=5`.

### 🟠 Important — `alt=""` sur miniatures alors que le nom est connu

- **Où :** `components/DiscoveryPhotoThumb.js` et usages multiples.
- **Pourquoi :** Screen readers ne voient pas l'espèce identifiée.
- **Correction :** `alt={discovery.nom}` ou `alt={`Photo de ${nom}`}`.

### 🟢 Secondaire — `lang="fr"` fixe sur `<html>`

- **Où :** `pages/_document.js` — app supporte 6 langues via `detectLang()`.
- **Pourquoi :** Synthèse vocale / traduction automatique incorrecte.
- **Correction :** `lang` dynamique dans `_app.js` selon locale active.

### 🟢 Secondaire — Modales partiellement accessibles (points positifs)

- **Où :** `FeatureGateModal`, `SignupPromptModal`, `RandoJournal` — `role="dialog"`, `aria-modal`.
- **Gaps :** `InstallGuideModal` fermeture sans `aria-label` ; erreurs scan sans `role="alert"`.

### 🟢 Secondaire — Contraste `--text-muted` à 50 % opacity

- **Où :** `globals.css` `:root` ; footer links `rgba(127,224,160,0.72)`.
- **Pourquoi :** Peut échouer WCAG 4.5:1 sur petits textes.
- **Correction :** Audit contrast avec outil (axe/Lighthouse) ; relever opacités.

---

## 6. SEO & métadonnées

### 🟠 Important — SPA principale sans métadonnées par « écran »

- **Où :** `pages/index.js` — plusieurs `<Head><title>` mais pas `description` / OG par vue.
- **Pourquoi :** Partage et indexation limités (tout est `/`).
- **Correction :** Routes Next réelles ou meta dynamiques ; `og:url` canonique.

### 🟢 Secondaire — `_document.js` : OG/Twitter présents (point positif)

- **Où :** `og:title`, `og:description`, `og:image`, `twitter:card`.
- **Gaps :** Pas `og:url`, `og:locale`, `canonical` ; `twitter:card` = `summary` (pas `summary_large_image`).

### 🟢 Secondaire — Pas de `robots.txt` / sitemap

- **Où :** `public/` — absent.
- **Pourquoi :** Pages légales peu indexées proprement.
- **Correction :** `public/robots.txt` + `sitemap.xml` (home + 4 pages légales).

### 🟢 Secondaire — Pages légales : title + description seulement

- **Où :** `components/LegalPageLayout.js`
- **Correction :** OG tags alignés avec `_document.js`.

---

## 7. Gestion des erreurs & cas limites

### 🔴 Critique — Aucun Error Boundary React

- **Où :** Pas de `ErrorBoundary`, pas de `pages/_error.js` / `404.js`.
- **Pourquoi :** Une exception dans `index.js` (4k lignes) = écran blanc total.
- **Correction :** `ErrorBoundary` dans `_app.js` + page erreur Next avec bouton « Retour accueil ».

### 🟠 Important — Échecs silencieux (SW, sync, APIs)

- **Où :** `pages/_app.js` `.catch(() => {})` sur service worker ; `lib/cloudSync.js` erreurs bootstrap loguées seulement ; `lib/useRandoNatureAlerts.js` catch vide.
- **Pourquoi :** Utilisateur sans feedback ; debugging prod difficile.
- **Correction :** Toast non bloquant + télémétrie (Sentry) ; retry avec backoff pour sync.

### 🟠 Important — Hors-ligne : pas de UX dédiée

- **Où :** PWA avec `sw.js` (network-first) ; `auth.offline_hint` seulement sur auth ; APIs community retournent `{ offline: true }` mais composants désactivés.
- **Pourquoi :** Scan/analyze échoue sans message clair hors réseau.
- **Correction :** Bannière offline globale ; queue scans locaux ; indicateur sur bouton scanner.

### 🟢 Secondaire — États vides bien couverts (point positif)

- **Où :** Herbier vide, albums, recettes, biodex, etc. + clés i18n `empty_*`.
- **Note :** Maintenir lors des refactors.

### 🟢 Secondaire — Écran erreur scan dédié

- **Où :** `pages/index.js` `screen === "error"`.
- **Gap :** Pas toujours `role="alert"` sur messages erreur.

---

## 8. Conformité RGPD

### 🟠 Important — Consentement inscription implémenté mais incomplet

- **Où :** `PremiumAuthStep.js` + `LegalConsentCheckbox` ; `lib/userProfile.js` → `user_profiles` + `user_metadata`.
- **Pourquoi :** OAuth Google signup enregistre consent avant redirect mais pas de re-vérification post-OAuth ; pas de versioning distinct CGU vs confidentialité ; migration `user_profiles` peut ne pas être appliquée en prod.
- **Correction :** Appliquer migration ; consentement obligatoire aussi après OAuth ; horodatage serveur (RPC) non modifiable par client.

### 🟠 Important — Pas de bandeau cookies / politique cookies non implémentée

- **Où :** `lib/legalContent.js` section 8 — placeholder `[DÉTAILLER LA POLITIQUE COOKIES]`.
- **Pourquoi :** Analytics tiers (si ajoutés), auth Supabase, localStorage = traceurs ; obligation information + consentement pour non-essentiels.
- **Correction :** Bandeau cookies ; liste cookies dans `/confidentialite` ; bloquer non-essentiels avant consent.

### 🟠 Important — Pas de flux suppression de compte / export données

- **Où :** CGU mentionnent suppression (`legalContent.js`) ; **aucune UI/API** `delete account` dans le code.
- **Pourquoi :** Non-conformité droits RGPD (effacement, portabilité).
- **Correction :** Bouton « Supprimer mon compte » → cascade `analyses`, storage, `user_profiles`, `auth.users` ; export JSON des découvertes.

### 🟠 Important — Données collectées : photos, géoloc, identifiants

- **Où :** Analyses + storage images ; community posts lat/lon ; `scan_logs` ; consentements ; email via Supabase Auth.
- **Pourquoi :** Registre des traitements et politique doivent lister précisément finalités + durées (placeholders encore présents).
- **Correction :** Compléter `/confidentialite` ; DPA avec Supabase/Vercel/Stripe/Anthropic.

### 🟢 Secondaire — CGV : renonciation rétractation en UI

- **Où :** `SubscriptionScreen` + `CgvConsentCheckbox` — bon début pour service numérique immédiat.
- **Gap :** Sans paiement réel, valeur juridique limitée ; enregistrer aussi `cgv_consent` côté serveur signé.

### 🟢 Secondaire — Mineurs / âge non vérifié

- **Où :** CGU mentionnent capacité juridique ; pas de gate âge dans l'app.
- **Correction :** Clause + mécanisme si cible juniors (`themes.juniors`).

---

## 9. Dépendances obsolètes / dette technique

### 🟠 Important — Next 14.2 (pas Next 15/App Router)

- **Où :** `package.json` — `next@14.2.35` (patch récent, OK sécurité 14.x).
- **Pourquoi :** Dette vers Pages Router ; pas de React Server Components par défaut.
- **Correction :** Plan migration Next 15 + App Router si besoin long terme ; pas urgent si 14.x maintenu.

### 🟠 Important — Pas d'ESLint en devDependencies

- **Où :** `package.json` script `"lint": "next lint"` sans `eslint` explicite.
- **Pourquoi :** Lint peut échouer ou être incohérent en CI.
- **Correction :** Ajouter `eslint`, `eslint-config-next` ; CI `npm run lint`.

### 🟢 Secondaire — Pas de tests automatisés

- **Où :** Aucun `*.test.*`, pas de Playwright/Cypress.
- **Pourquoi :** Régressions sur flux critique (scan, auth, premium, sync).
- **Correction :** Tests e2e sur parcours guest → première découverte → signup.

### 🟢 Secondaire — `@anthropic-ai/sdk@0.100.1`

- **Où :** `package.json`
- **Pourquoi :** SDK évolue ; vérifier changelog sécurité.
- **Correction :** Dependabot + pin versions en CI.

### 🟢 Secondaire — Pas de `.env.example`

- **Où :** Repo — variables documentées partiellement dans README / messages `cloud.unavailable`.
- **Correction :** `.env.example` listant toutes les clés requises sans valeurs.

### 🟢 Secondaire — Dette routing thèmes legacy

- **Où :** `randos`, `jardin` dans données albums vs navigation `NAV_THEMES`.
- **Correction :** Unifier ou supprimer chemins morts.

---

## TOP 5 — Actions prioritaires

| # | Action | Catégorie | Effort estimé |
|---|--------|-----------|---------------|
| **1** | **Implémenter Stripe Checkout + webhook signé** et supprimer l'activation premium client (`SubscriptionScreen`, `freemium.js`, `scan-quota` POST) | Sécurité / Juridique | Élevé |
| **2** | **Durcir Supabase** : REVOKE RPC `activate_scan_premium` + admin RPCs ; policies storage `images` (auth + path) ; revoir RLS communauté | Sécurité | Moyen |
| **3** | **Ajouter Error Boundary + page `_error`** pour éviter écran blanc sur le monolithe `index.js` | Erreurs / UX | Faible |
| **4** | **Middleware quota + auth** sur toutes les routes API Claude ; fail-closed si service role absent | Sécurité / Coûts | Moyen |
| **5** | **RGPD opérationnel** : appliquer migration `user_profiles`, suppression compte + export données, bandeau cookies, compléter placeholders légaux avec juriste | Conformité | Moyen–élevé |

---

## Annexes — Inventaire rapide

| Zone | Fichiers clés |
|------|----------------|
| App shell | `pages/index.js`, `pages/_app.js`, `pages/_document.js` |
| Auth / sync | `lib/cloudSync.js`, `lib/supabase.js`, `components/PremiumAuthStep.js` |
| Premium | `lib/freemium.js`, `components/SubscriptionScreen.js`, `pages/api/scan-quota.js`, `lib/scanQuotaServer.js` |
| Analyses | `pages/api/analyze.js`, `lib/analysesStorage.js` |
| Stripe (lecture seule) | `lib/stripeAdmin.js`, `pages/admin.js` |
| Légal | `pages/cgu.js`, `lib/legalContent.js`, `lib/userProfile.js` |
| PWA | `public/sw.js`, `public/manifest.json` |
| Migrations Supabase | `supabase/migrations/*.sql` (12 fichiers) |

---

*Fin du rapport — généré par audit statique du dépôt `plante-infini`.*
