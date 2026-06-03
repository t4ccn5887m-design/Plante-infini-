# Wilder

**Explore the wild around you** — identification naturelle par photo.

Prenez une photo, Claude analyse l’image, le résultat s’affiche. Aucune sauvegarde (pas de base de données, pas de stockage local des découvertes).

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

L’API `/api/analyze` envoie la photo à Claude et renvoie l’identification en JSON.

## Parcours

1. **Accueil** — logo, bouton Scanner
2. **Caméra** — capture plein écran
3. **Analyse** — appel `/api/analyze`
4. **Résultat** — fiche espèce (nom, description, rareté, etc.)
