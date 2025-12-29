# AutoNUM

Renommage automatique de fichiers (Electron + React + Python). UI moderne avec mise à jour automatique.

## Fonctionnalités

- **Interface moderne** : Electron + React avec barre de titre custom
- **Renommage en lot** : Renommer plusieurs fichiers avec préfixe personnalisé
- **Drag & Drop** : Glisser-déposer vos fichiers directement
- **Aperçu en temps réel** : Voir le nouveau nom avant renommage
- **Numérotation auto** : Format 001, 002, 003...
- **Mise à jour auto** : Vérification et installation automatique des mises à jour
- **Formats supportés** : JPG, JPEG, PNG, BMP, TIFF, GIF

## Prérequis

- Node.js 18+ (npm) pour le dev/build
- Python 3.x accessible dans le PATH pour le dev
  ⚡ En production, l'installeur embarque un runtime Python

## Installation & lancement

```bash
cd electron-react
npm install
npm run electron:dev    # Lance Vite + Electron en dev
```

Vérifier Python :
```bash
python --version
```

## Build

```bash
cd electron-react
npm run build:electron
```

## Release GitHub

Le workflow `.github/workflows/release.yml` s'exécute sur un tag `v*` ou via `workflow_dispatch` :
- Build automatique du renderer + backend Python
- Création d'un installeur Windows (.exe)
- Publication automatique sur GitHub Release

Exemple :
```bash
git tag v0.0.1
git push origin main --tags
```

## Mise à jour auto

L'app vérifie les releases GitHub au démarrage. Une notification apparaît si une nouvelle version est disponible avec boutons de téléchargement/installation.

## Structure

- `electron-react/` : App Electron + React (UI)
- `electron-react/electron/main.cjs` : Fenêtre, IPC, barre de titre custom
- `electron-react/src/` : Composants React et styles
- `python_backend/renamer.py` : Logique de renommage Python

## Auteur

Développé avec ❤️ par **TontonKad**
