# wilderpro.md — Contexte projet (source de vérité)

> Ce fichier est la mémoire du projet. Toute session Cursor / Claude Code / Claude
> doit le lire en premier. À garder à jour à chaque décision importante.
> Nom de code interne : **Wilder** (le nom définitif n'est pas tranché — voir §8).

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
- Planning, gestion d'équipe, gestion de matériel
- CRM complet

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
- **Wilder Pro** réutilise ~80 % de la v2 : design system, IA d'analyse d'image, catalogue, logique de brief.

### Décision actuelle (juillet 2026) : route `/pro` dans l'app Next.js existante

**Pas de monorepo pour l'instant.** On ajoute simplement la route `/pro` dans le même projet Next.js (même dépôt, même Supabase, même design system). Zéro plomberie inutile.

- Particulier : `/` (inchangé, priorité absolue de ne pas le casser).
- Pro : `/pro` — styles isolés sous le préfixe `.wp` (`styles/pro/wilder-pro.css`), composants dans `components/pro/`.
- Branche de travail : `wilder-pro` (jamais merger à l'aveugle dans `main` sans validation).

Un monorepo (deux apps déployées séparément, ex. `app.wilder.fr` / `mon.wilder.fr`) reste une option **plus tard** si l'isolation ou le déploiement le justifient. Même base de données / backend commun restera indispensable pour le lien pro → client.

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

## 8. Nom (NON tranché)

- **« Wilder » déconseillé** : déjà pris dans le créneau (app **Wildr** plantes/jardin, **Wilder Plant Company**) ; sens à l'envers (« wild » = l'opposé de la clarté qu'on vend) ; mot anglais pour un marché FR.
- **« Brief » tout court** : à éviter — générique, non déposable, déjà pris, invisible en SEO.
- Candidats explorés : Amont, Sève, Osier, **Briva** (contient « brief », joli, mais proche de « Brivo » SaaS).
- **Décision actuelle** : on garde **Wilder** comme nom de code interne, on tranchera plus tard.
- **Avant de fixer un nom** : vérifier INPI + EUIPO + domaine + App Store.

---

## 9. MVP Pro (à construire en premier)

- [ ] Onboarding / création de compte pro (studio, logo, zone d'intervention)
- [ ] Personnalisation du lien (couleur + logo du pro sur la page vue par le client)
- [ ] Abonnement / facturation (c'est le pro qui paie)
- [ ] **Empty state** : premier pro sans brief → écran « Envoyez votre premier lien » (moment clé pour ne pas le perdre)
- [ ] Tableau de bord / pipeline : `Brief prêt` · `En attente` · `RDV planifié`
- [ ] Envoi du lien : nom / tél / adresse → lien unique → SMS / e-mail / QR / copier
- [ ] **Suivi d'état du lien** : `Envoyé` → `Ouvert` → `Rempli` (savoir qui relancer)
- [ ] Confirmation d'envoi (« on vous prévient dès qu'il répond »)
- [ ] **Fiche brief** (le cœur) : identité client · goût déduit · priorités classées · végétaux · matériaux & couleurs · inspirations + analyse image · terrain (photos / orientation / surface / sol) · budget · points de vigilance · à aborder au RDV
- [ ] Un **seul dossier vivant** qui s'enrichit (pas deux briefs séparés)
- [ ] Export PDF (livrable à emporter sur le terrain)

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

## 12. ⚠️ Prochaine grosse priorité (rappel)

Le pro reçoit des **briefs vides** tant que **le parcours client du lien** n'existe pas.
Donc après les manques MVP pro (surtout empty state + suivi du lien), **construire ce que voit le client quand il clique sur le lien** :
**questionnaire rapide (adaptatif) + import de photos + scan.**
C'est ça qui remplit le brief, donc c'est ça qui fait vivre tout le reste.

---

## 13. Workflow (solo)

- Fondateur seul, travaille avec : Claude (chat/projet), **Claude Code**, **Cursor**.
- Ces espaces **ne partagent pas de mémoire** entre eux.
- **Ce fichier `wilderpro.md` est la source de vérité.** Le garder à la racine du repo et le mettre à jour à chaque décision.

---

*Dernière mise à jour : 2026-07-18 — décision route `/pro` (pas monorepo) ; proto WilderProV2 intégré en mock.*

