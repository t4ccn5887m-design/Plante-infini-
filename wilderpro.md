# wilderpro.md — Contexte projet (source de vérité)

> Ce fichier est la mémoire du projet. Toute session Cursor / Claude Code / Claude
> doit le lire en premier. À garder à jour à chaque décision importante.
> **Nom produit : Amont** (ex-Wilder — voir §8).

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

- Particulier : `/` (inchangé, priorité absolue de ne pas le casser).
- Pro : `/pro` — styles isolés sous le préfixe `.wp` (`styles/pro/wilder-pro.css`), composants dans `components/pro/`.
- **Parcours client du lien :** `/b/[token]` — questionnaire invité 9 écrans, plein écran, isolé du shell app (pas de menu compte / install guide). Lit `pro_links` + branding studio ; écrit `pro_briefs` + Storage ; statuts `sent` → `opened` → `filled` via RPC.
- **App pro `/pro` :** même auth Supabase que le particulier ; `pro_studios` (1 / compte) ; création de liens réels ; liste + fiche brief depuis `pro_links` / `pro_briefs` ; RDV via `pro_appointments` ; export PDF (`window.print`).
- Branche de travail : `wilder-pro` (**jamais** pousser / merger sur `main` sans validation explicite — `main` = v2 particulier en prod).

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

## 8. Nom

- **Décision : « Amont »** (ex-nom de code **Wilder**).
- « Wilder » était déconseillé (déjà pris dans le créneau, sens à l’envers, anglais pour marché FR) — conservé seulement comme héritage technique (branche `wilder-pro`, préfixe CSS `.wp`, chemins historiques) jusqu’à un renommage propre.
- **Avant dépôt / go-to-market public** : vérifier INPI + EUIPO + domaine + stores si besoin.

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

## 12. ⚠️ Prochaine priorité

Le **parcours client du lien** (`/b/[token]`) et le **cœur pro** (auth, liens, briefs, PDF, RDV) sont **faits**.

**Prochaine priorité MVP :**

1. **Branding du lien client** — couleur + logo studio **persistés** et visibles sur `/b/[token]`.
2. **Abonnement / facturation** — le pro paie (~29 €/mois).
3. Ensuite : onboarding studio (zone d’intervention, logo), confirmation d’envoi / notifications, enrichissement terrain sur la fiche.

Ne pas rouvrir monorepo ni casser `/` tant que ces manques MVP ne sont pas traités.

---

## 13. Workflow (solo)

- Fondateur seul, travaille avec : Claude (chat/projet), **Claude Code**, **Cursor**.
- Ces espaces **ne partagent pas de mémoire** entre eux.
- **Ce fichier `wilderpro.md` est la source de vérité.** Le garder à la racine du repo et le mettre à jour à chaque décision.
- Branche de travail Pro : **`wilder-pro` uniquement** — jamais `main` sans accord explicite.

---

*Dernière mise à jour : 2026-07-22 — étape C terminée et testée (auth, liens, briefs, PDF, RDV in-app) ; nom produit Amont ; `submit_pro_brief` + `pro_appointments` versionnés en migrations.*
