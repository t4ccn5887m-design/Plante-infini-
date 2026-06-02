# Wilder

**Explore the wild around you** — application de découverte de la nature.

Scannez plantes, animaux, insectes, oiseaux et champignons avec votre appareil photo. Chaque identification est enregistrée comme une découverte, avec animation façon Pokédex, et peut être rangée dans vos albums personnels.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Configuration

Créez un fichier `.env.local` à la racine :

```
ANTHROPIC_API_KEY=votre_clé_api
```

L’API `/api/analyze` utilise Claude pour identifier les organismes sur les photos.

## Fonctionnalités

- **Accueil** — fond nature, logo, compteur de découvertes, bouton Scanner, albums, feuilles animées
- **Scanner** — caméra plein écran, cadre de visée, capture ou galerie
- **Résultat** — nom commun/latin, description, habitat, rareté, ajout à un album
- **Albums** — création, couverture, tri par date

Les données sont stockées localement dans le navigateur (`localStorage`).
