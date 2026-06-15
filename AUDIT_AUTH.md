# Audit authentification Wilder

**Périmètre :** création de compte et connexion (email, Google, anonyme).  
**Date :** 2026-06-13  
**Méthode :** lecture du code source (`lib/cloudSync.js`, `PremiumAuthStep`, points d’entrée UI). Aucune modification de code dans cet audit.

---

## 1. Flux actuel (étape par étape)

### 1.1 Visiteur anonyme (état par défaut)

| Étape | Où | Action |
|-------|-----|--------|
| 1 | `pages/index.js` | Au boot : `subscribeToAuthSession()` attend la première session Supabase, puis `authBootState = "ready"`. |
| 2 | `pages/index.js` | Si pas de session **et** `wilder_onboarding_vu` absent → slides `WelcomeSlidesScreen` (marketing, **pas d’auth**). |
| 3 | `pages/index.js` | Sinon `bootstrapCloudSync()` → `ensureCloudAuth()` dans `lib/cloudSync.js`. |
| 4 | `ensureCloudAuth()` | Si pas de session : `supabase.auth.signInAnonymously()`. Crée un utilisateur `auth.users` avec `is_anonymous = true`. |
| 5 | `bootstrapCloudSync()` | Pull `analyses` (cloud), fusion avec `localStorage`, push des pending. Métadonnées dans `wilder-cloud-meta`. |
| 6 | `hooks/useGuestAccount.js` | `hasRealAccount()` = `isPermanentAuthUser(session.user)` → `isGuest = true` tant que pas email / pas permanent. |
| 7 | Usage | Scans et sync cloud fonctionnent avec le **même `user_id`** anonyme. Découvertes stockées localement + cloud (`analyses.user_id`). |

**Important :** dès la première visite (ou après boot), presque tous les utilisateurs ont déjà une session Supabase anonyme. Ils ne sont pas « sans compte » au sens auth — ils ont un compte anonyme.

---

### 1.2 « Créer un compte » — email + mot de passe

**Points d’entrée UI (tous utilisent `PremiumAuthStep` en mode `signup`) :**

- Menu compte (`AccountMenu`) → « Créer mon compte gratuit »
- `FeatureGateModal` → CTA puis auth
- `SignupPromptModal` (quota 5 scans, etc.)
- `SubscriptionScreen` → auth si anonyme (`convertAnonymousOnly`, onglet connexion masqué)

| Étape | Fichier | Action |
|-------|---------|--------|
| 1 | `PremiumAuthStep` | Mode `signup` : case CGU obligatoire (`CguConsentCheckbox`). Boutons Google / submit désactivés si CGU non cochée (`canProceedSignup`). |
| 2 | Submit email | `signUpWithEmail(email, password)` dans `lib/cloudSync.js`. |
| 3a | Si session anonyme | `supabase.auth.updateUser({ email, password })` — **conversion**, même `user_id`. |
| 3b | Si pas anonyme | `supabase.auth.signUp({ email, password })` — nouveau compte. |
| 4 | Après succès | `bootstrapCloudSync()` (re-sync). |
| 5 | `PremiumAuthStep` | `recordCguConsent()` → `user_profiles` + `auth.updateUser` metadata. |
| 6 | `finish()` | `syncDiscoveriesToCloud()` puis `onComplete()` (ferme modal / suite abonnement / action en attente). |

**Appels Supabase :** `auth.updateUser` ou `auth.signUp`, puis lecture/écriture `analyses`, optionnel `user_profiles`, stockage `images`.

---

### 1.3 « Créer un compte » — Google

| Étape | Fichier | Action |
|-------|---------|--------|
| 1 | `PremiumAuthStep.handleGoogle` | Si mode signup : `recordCguConsent()` **avant** OAuth (peut échouer sur RLS `user_profiles`). |
| 2 | `signInWithOAuth("google", { pendingCheckoutPlan? })` | `lib/cloudSync.js`. |
| 3 | Si `session.user.is_anonymous` | `supabase.auth.linkIdentity({ provider: "google", options: { redirectTo } })`. |
| 4 | Si pas anonyme | `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })`. |
| 5 | `redirectTo` | `getOAuthRedirectUrl()` → `{origin}{pathname}` (ex. `https://wilder-nature.com/`). |
| 6 | Retour OAuth | Client Supabase `detectSessionInUrl: true` (`lib/supabase.js`) traite le hash/query. |
| 7 | Abonnement | Si `pendingCheckoutPlan` en `sessionStorage` → reprise checkout (`consumePendingCheckoutPlan`). |

**Note :** le composant `AuthWelcomeScreen.js` propose aussi Google + Apple, mais **il n’est importé nulle part** (code mort).

---

### 1.4 « Se connecter » — email + mot de passe

**Point d’entrée principal :** `AccountMenu` → « Se connecter » → modal `PremiumAuthStep` avec `initialMode="signin"`.

| Étape | Action |
|-------|--------|
| 1 | Mode `signin` : **pas** de case CGU obligatoire. |
| 2 | `signInWithEmail` → `supabase.auth.signInWithPassword({ email, password })`. |
| 3 | `bootstrapCloudSync()` — fusion avec cloud du **nouveau** `user_id`. |
| 4 | `finish()` → `onAccountCreated` dans `index.js` → `refreshGuestAccount()`, action en attente. |

**Problème structurel :** si l’utilisateur a encore une session **anonyme** et choisit « Se connecter », `signInWithPassword` **remplace** la session par le compte existant → **nouveau `user_id`**, pas une conversion. Les découvertes liées à l’ancien id anonyme ne suivent pas automatiquement (sauf merge local partiel).

**Dans `SubscriptionScreen` (`convertAnonymousOnly`) :** l’onglet « Se connecter » est **masqué** ; tentative email en mode signin affiche `freemium.auth_convert_only`.

---

### 1.5 « Se connecter » — Google

Même handler que création (`handleGoogle`), mais en mode `signin` :

- Pas de `recordCguConsent()` avant OAuth (seulement en mode signup).
- Si session anonyme → `linkIdentity` (conversion).
- Si déjà permanent → `signInWithOAuth` (connexion / changement de compte Google).

---

## 2. Problèmes (par gravité)

### 🔴 Critique — « Continuer avec Google » ne fait rien (aucune redirection, aucune erreur)

| Aspect | Détail |
|--------|--------|
| **Où** | `lib/cloudSync.js` → `signInWithOAuth()` ; `components/PremiumAuthStep.js` → `handleGoogle` |
| **Handler branché ?** | Oui : `onClick={handleGoogle}` sur le bouton Google. |
| **Cause probable A — bouton désactivé sans feedback** | En mode **signup**, `disabled={loading \|\| !canProceedSignup}`. Si la case CGU n’est pas cochée, le clic **ne fait rien** (pas d’erreur, pas de message). Très fréquent sur « Créer un compte » et abonnement. |
| **Cause probable B — pas de redirection après `linkIdentity`** | Pour un utilisateur **anonyme**, le code appelle `linkIdentity` puis retourne `{ ok: true, redirecting: true }` **sans** `window.location.assign(data.url)`. Contrairement à `signInWithOAuth`, `linkIdentity` retourne une URL OAuth à ouvrir **manuellement**. Résultat : succès silencieux, aucune navigation. |
| **Cause probable C — configuration Supabase** | À vérifier dans le dashboard (non visible dans le code) : |
| | • **Authentication → Providers → Google** : activé + Client ID/Secret Google Cloud |
| | • **Authentication → Sign In / Up → Anonymous sign-ins** : activé (sinon pas d’anonyme) |
| | • **Authentication → Sign In / Up → Manual linking** (ou équivalent) : requis pour `linkIdentity` depuis un compte anonyme |
| | • **Authentication → URL Configuration → Redirect URLs** : doit inclure `https://wilder-nature.com/` et `http://localhost:3000/` (et variantes avec trailing slash si utilisées) |
| **Cause possible D — erreur non affichée** | `handleGoogle` n’a pas `try/catch`. Une exception (ex. `linkIdentity` indisponible) peut laisser `loading` à true ou une erreur non gérée dans la console uniquement. |
| **Correction simple** | 1) Après `linkIdentity` / `signInWithOAuth`, si `data?.url` → `window.location.assign(data.url)`. 2) Si CGU requise et non cochée, message explicite au clic Google (pas seulement `disabled`). 3) Vérifier dashboard Supabase (Google, anonyme, manual linking, redirect URLs). |

---

### 🔴 Critique — Connexion email sur session anonyme = nouveau compte, pas conversion

| Aspect | Détail |
|--------|--------|
| **Où** | `lib/cloudSync.js` → `signInWithEmail()` toujours `signInWithPassword` |
| **Pourquoi** | Remplace la session anonyme par un autre `user_id`. Découvertes cloud de l’anonyme (`analyses.user_id`) ne sont pas transférées. |
| **Correction** | En session anonyme : interdire « Se connecter » (comme abonnement) ou fusionner explicitement ; ou forcer `linkIdentity` / flux « convertir » uniquement. |

---

### 🟠 Majeur — Multiples écrans auth qui se chevauchent / se mélangent

| Aspect | Détail |
|--------|--------|
| **Où** | `PremiumAuthStep` réutilisé dans 4 contextes avec titres/sous-titres différents ; `AccountMenu` vs `FeatureGateModal` vs `SignupPromptModal` vs `SubscriptionScreen` |
| **Symptômes** | « Créer un compte » vs « Se connecter » avec onglets dans le même composant ; titres qui changent selon `titleKey` / `displayTitleKey` (logique imbriquée lignes 123–134) ; abonnement masque connexion mais affiche encore texte « création obligatoire » ; `AuthWelcomeScreen` (Google+Apple+email) existe mais **n’est pas utilisé** |
| **Correction** | Un seul composant auth + un seul point d’entrée ; modes explicites « Connexion » / « Créer un compte » avec libellés fixes. |

---

### 🟠 Majeur — Conversion anonyme → permanent (email) dépend de la confirmation email

| Aspect | Détail |
|--------|--------|
| **Où** | `signUpWithEmail` → `updateUser({ email, password })` ; `lib/authUser.js` → `isPermanentAuthUser` |
| **Pourquoi** | Si Supabase exige confirmation email, `user.email` peut rester vide et `is_anonymous` peut rester `true` jusqu’à confirmation → l’app considère encore l’utilisateur comme guest (herbier, abonnement, checkout). |
| **Correction** | Aligner config Supabase (confirm email on/off) avec l’UX ; ou traiter « email en attente de confirmation » ; afficher état « vérifiez votre email ». |

---

### 🟠 Majeur — `recordCguConsent` avant Google (signup) peut bloquer sans lien avec Google

| Aspect | Détail |
|--------|--------|
| **Où** | `PremiumAuthStep.handleGoogle` (signup) ; `lib/userProfile.js` |
| **Pourquoi** | Échec RLS / table `user_profiles` → erreur affichée, OAuth jamais appelé. Distinct du bug « Google ne fait rien » mais même perception utilisateur. |
| **Correction** | Consentement CGV côté serveur au checkout (déjà partiellement fait pour Stripe) ; ou API serveur pour consent ; policies RLS appliquées (`USER_PROFILES_RLS_SQL_EDITOR.sql`). |

---

### 🟡 Modéré — Apple OAuth absent du flux réel

| Aspect | Détail |
|--------|--------|
| **Où** | `AuthWelcomeScreen.js` seul ; `PremiumAuthStep` = Google uniquement |
| **Correction** | Ajouter Apple dans le composant auth unifié si souhaité ; activer provider Apple dans Supabase. |

---

### 🟡 Modéré — `getOAuthRedirectUrl` fragile (pathname courant)

| Aspect | Détail |
|--------|--------|
| **Où** | `lib/supabase.js` → `window.location.origin + window.location.pathname` |
| **Pourquoi** | Si l’utilisateur ouvre l’auth depuis une URL rare (ex. query params, future route), la redirect URL change. Chaque variante doit être whitelistée dans Supabase. |
| **Correction** | Toujours rediriger vers `origin + '/'` (ou route dédiée `/auth/callback`). |

---

### 🟡 Modéré — Déconnexion recrée un nouvel anonyme

| Aspect | Détail |
|--------|--------|
| **Où** | `signOutCloud()` → `signOut()` puis `ensureCloudAuth()` → **nouveau** `signInAnonymously()` |
| **Impact** | Nouveau `user_id` anonyme ; pas un bug auth login mais peut surprendre après déconnexion. |

---

### 🟢 Mineur — `CloudAccountCard` : email seulement, pas OAuth

| Aspect | Détail |
|--------|--------|
| **Où** | `components/CloudAccountCard.js` (écran compte cloud legacy si encore accessible) |
| **Impact** | Parcours incohérent avec le reste de l’app. |

---

## 3. Synthèse des corrections (sans implémenter ici)

| Problème | Fichier(s) | Correction simple |
|----------|------------|-------------------|
| Google silencieux (CGU) | `PremiumAuthStep.js` | Message si clic sans CGU ; ou autoriser Google et enregistrer CGU après retour OAuth |
| Google silencieux (redirect) | `lib/cloudSync.js` | `if (data?.url) window.location.assign(data.url)` après `linkIdentity` et si `signInWithOAuth` ne redirige pas |
| Sign-in email sur anonyme | `signInWithEmail`, `PremiumAuthStep` | Bloquer sign-in si `is_anonymous` ; guider vers signup / conversion |
| Écrans confus | `AccountMenu`, modals, `SubscriptionScreen` | Un `AuthScreen` unique, props `mode: login \| register` |
| Config Supabase | Dashboard | Google on, Anonymous on, Manual linking on, Redirect URLs |
| Permanent pas reconnu | `authUser.js`, Supabase Auth settings | Gérer confirmation email |
| Consentement CGV | `userProfile.js` ou API serveur | RLS + upsert service_role pour checkout |

---

## 4. Proposition — flux d’auth simple et clair (sans code)

### Principes

1. **Un seul écran auth** (`AuthScreen`), ouvert en modal pleine page depuis menu compte, feature gates, et abonnement.
2. **Deux onglets explicites** en haut : **Connexion** | **Créer un compte** (un seul actif, styles distincts).
3. **Toujours** (sous les onglets) :
   - Bouton **Continuer avec Google**
   - Bouton **Continuer avec Apple** (si activé Supabase)
   - Séparateur « ou »
   - Champs email + mot de passe
   - Bouton principal : « Se connecter » ou « Créer mon compte » selon l’onglet
4. **Case CGU + lien CGV** : obligatoire uniquement sur **Créer un compte** (email ou OAuth). Si OAuth sans case cochée → message clair, pas bouton mort.
5. **Session anonyme existante** :
   - Onglet **Créer un compte** → conversion (`updateUser` / `linkIdentity`), **jamais** `signUp` ni `signInWithPassword` d’un autre compte sans avertissement.
   - Onglet **Connexion** → `signInWithPassword` / OAuth **seulement** si pas anonyme ; si anonyme avec données → proposer « Créer un compte pour sauver vos X découvertes » ou fusion guidée.
6. **Retour OAuth** : URL fixe `https://wilder-nature.com/` (ou `/auth/callback`) ; traitement session + `bootstrapCloudSync` + fermeture modal + reprise action (herbier, checkout).
7. **Supprimer ou fusionner** : `AuthWelcomeScreen` (mort), prompts modals redondants → même `AuthScreen` avec `reason` (herbier, premium, gate) pour le sous-titre uniquement.
8. **Feedback** : loading sur boutons, erreurs Supabase traduites sous le formulaire, logs console complets en dev.

### Parcours utilisateur cible

```
[Anonyme sur l’accueil]
  → Menu → Connexion / Créer un compte
  → AuthScreen (onglet choisi)
  → Google / Apple / email
  → [redirect OAuth si besoin]
  → Retour app → sync cloud → isGuest = false → herbier / scan / abonnement

[Anonyme → S’abonner]
  → AuthScreen (onglet Créer un compte, CGU)
  → Conversion compte
  → Checkout Stripe (sans second écran auth)

[Compte permanent]
  → Menu → Connexion (si déconnecté) ou profil / déconnexion
  → Checkout / herbier sans repasser par création de compte
```

---

## 5. Fichiers clés (référence)

| Rôle | Fichier |
|------|---------|
| Auth Supabase (anonyme, OAuth, email) | `lib/cloudSync.js` |
| Client Supabase + redirect URL | `lib/supabase.js` |
| UI auth principale | `components/PremiumAuthStep.js` |
| Menu compte | `components/AccountMenu.js` |
| Gates / modals | `components/FeatureGateModal.js`, `components/SignupPromptModal.js` |
| Abonnement | `components/SubscriptionScreen.js` |
| Guest vs permanent | `lib/authUser.js`, `lib/guestAccount.js` |
| Consentements | `lib/userProfile.js` |
| Boot app | `pages/index.js` |
| Écran auth complet (non utilisé) | `components/AuthWelcomeScreen.js` |
| Table consentements | `supabase/migrations/20250614000000_user_profiles.sql` |
| Découvertes cloud | `lib/analysesStorage.js`, RLS `analyses` |

---

## 6. Checklist Supabase (à valider manuellement)

- [ ] **Anonymous sign-ins** : enabled  
- [ ] **Google provider** : enabled, credentials OK  
- [ ] **Apple provider** : enabled si proposé dans l’UI  
- [ ] **Manual linking** (anonymous → OAuth) : enabled si `linkIdentity` utilisé  
- [ ] **Redirect URLs** : `https://wilder-nature.com/`, `http://localhost:3000/` (+ `www` si applicable)  
- [ ] **Site URL** : `https://wilder-nature.com`  
- [ ] **Email confirmations** : politique alignée avec `isPermanentAuthUser`  
- [ ] **RLS `user_profiles`** : policies + GRANT (`USER_PROFILES_RLS_SQL_EDITOR.sql`)  
- [ ] **RLS `analyses`** : `auth.uid() = user_id` pour `authenticated` (inclut anonymes)

---

*Document généré pour correction ultérieure du code — aucun changement appliqué dans le cadre de cet audit.*
