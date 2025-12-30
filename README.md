# AutoNUM

Application de renommage automatique de fichiers avec interface moderne Electron + React + Python.

![Version](https://img.shields.io/badge/version-0.0.11-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Fonctionnalités

### 🎨 Interface moderne
- **Barre de titre personnalisée** : Design moderne sans bordures Windows
- **Scrollbars customisées** : Style cohérent avec le thème vert
- **Drag & Drop** : Glisser-déposer vos fichiers directement depuis l'explorateur
- **Aperçu en temps réel** : Voir les nouveaux noms avant le renommage
- **Thème vert élégant** : Design professionnel avec couleur #10b981

### 🔄 Renommage intelligent
- **Mode Copier** : Conserve les fichiers d'origine
- **Mode Déplacer** : Supprime les fichiers d'origine après renommage
- **Tooltips explicatifs** : Info-bulles sur chaque mode
- **Numérotation automatique** : Format 001, 002, 003...
- **Préfixe personnalisable** : Choisissez votre propre préfixe
- **Formats supportés** : JPG, JPEG, PNG, BMP, TIFF, GIF

### 🚀 Mise à jour automatique
- **Vérification au démarrage** : Détection automatique des nouvelles versions
- **Notification élégante** : Affichage de la version disponible
- **Téléchargement avec progression** : Barre de progression en temps réel
- **Installation en un clic** : Relance automatique après mise à jour
- **Basé sur electron-updater** : Système robuste et éprouvé

### 🛠️ Développement
- **DevTools intégrés** : Appuyez sur F12 pour ouvrir la console
- **Logs détaillés** : Messages d'erreur clairs avec emojis (🔄 ✅ ❌ 💥)
- **Hot reload** : Rechargement automatique en mode développement

## 📦 Installation

### Pour les utilisateurs

Téléchargez la dernière version depuis [GitHub Releases](https://github.com/Matthmusic/AUTONUM/releases) :

```
AutoNUM-0.0.11-Setup.exe
```

L'installeur inclut tout ce dont vous avez besoin, y compris Python embarqué.

### Pour les développeurs

#### Prérequis
- **Node.js 18+** (avec npm)
- **Python 3.11+** (pour le développement uniquement)

#### Installation

```bash
cd electron-react
npm install
```

#### Lancement en mode développement

```bash
npm run electron:dev
```

Cette commande lance :
- Vite dev server (React) sur http://localhost:5173
- Electron avec hot reload

## 🏗️ Build

### Build local

```bash
npm run build:electron
```

Génère l'installeur dans `dist/AutoNUM-0.0.11-Setup.exe`

### Build automatique (GitHub Actions)

Le workflow `.github/workflows/release.yml` s'exécute automatiquement lors d'un push de tag :

```bash
git tag v0.0.11
git push origin v0.0.11
```

Le workflow :
1. ✅ Télécharge Python 3.11 embarqué (avec cache ~30s économisés)
2. ✅ Build le frontend React avec Vite
3. ✅ Package l'application avec electron-builder
4. ✅ Crée un installeur NSIS pour Windows
5. ✅ Publie automatiquement sur GitHub Releases
6. ✅ Génère `latest.yml` pour l'auto-update

**Optimisations** :
- Cache npm (~10s économisés)
- Cache Python embedded (~30s économisés)
- Cache electron-builder (~10-15s économisés)
- Build total : ~1m30s (contre ~2m40s sans cache)

## 🎯 Utilisation

1. **Glissez vos fichiers** dans la zone de dépôt ou cliquez "Sélectionner fichiers"
2. **Choisissez le dossier de sortie** où seront enregistrés les fichiers renommés
3. **Définissez le préfixe** (ex: "Photo", "Scan", "Document")
4. **Choisissez le numéro de départ** (par défaut : 1)
5. **Sélectionnez le mode** :
   - **Copier** : Les fichiers d'origine sont conservés
   - **Déplacer** : Les fichiers d'origine sont supprimés
6. **Cliquez sur RENOMMER** et c'est fait ! ✨

## 📁 Structure du projet

```
autonum/
├── electron-react/              # Application Electron + React
│   ├── electron/
│   │   ├── main.cjs            # Process principal Electron
│   │   ├── preload.cjs         # Bridge IPC sécurisé
│   │   └── autonum.ico         # Icône de l'application
│   ├── src/
│   │   ├── App.tsx             # Composant React principal
│   │   ├── App.css             # Styles CSS
│   │   ├── global.d.ts         # Déclarations TypeScript
│   │   └── main.tsx            # Point d'entrée React
│   ├── python_backend/
│   │   └── renamer.py          # Logique Python de renommage
│   ├── python_runtime/          # Python 3.11 embarqué (non versionné)
│   ├── .github/
│   │   └── workflows/
│   │       └── release.yml     # CI/CD automatique
│   └── package.json            # Configuration npm et build
└── python_backend/              # Backend Python source
    └── renamer.py
```

## 🔧 Configuration

### electron-builder (package.json)

```json
{
  "build": {
    "appId": "com.autonum.app",
    "productName": "AutoNUM",
    "publish": [{
      "provider": "github",
      "owner": "Matthmusic",
      "repo": "AUTONUM",
      "releaseType": "release"
    }],
    "win": {
      "icon": "electron/autonum.ico",
      "artifactName": "AutoNUM-${version}-Setup.${ext}"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

### Auto-updater (main.cjs)

```javascript
const { autoUpdater } = require('electron-updater')

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Vérification au démarrage (délai 3s)
setTimeout(() => {
  autoUpdater.checkForUpdates()
}, 3000)
```

## 🐛 Débogage

### Ouvrir la console développeur

Appuyez sur **F12** dans l'application pour ouvrir DevTools.

### Logs disponibles

- `🔄 Renaming files with:` - Début du renommage
- `✅ Rename result:` - Résultat du renommage
- `❌ Errors during rename:` - Erreurs détaillées
- `💥 Exception during rename:` - Exception critique
- `Mise à jour disponible:` - Nouvelle version détectée

### Debug en production

```javascript
// main.cjs active F12 même en production
mainWindow.webContents.on('before-input-event', (event, input) => {
  if (input.key === 'F12' && input.type === 'keyDown') {
    mainWindow.webContents.toggleDevTools()
  }
})
```

## 🚀 Prochaines fonctionnalités

- [ ] Patterns de nommage avancés (`{date}`, `{time}`, `{original}`)
- [ ] Templates sauvegardés
- [ ] Raccourcis clavier
- [ ] Export de la liste de renommage (CSV)
- [ ] Support multi-langue (FR/EN)

## 📝 Changelog

### v0.0.11 (Actuelle)
- Mise a jour des metadonnees CEA App Store
- Bump version 0.0.11

### v0.0.10
- ✅ Système de mise à jour complètement fonctionnel
- ✅ Bouton "Installer" apparaît correctement
- ✅ Relance automatique après installation
- ✅ Basé sur l'architecture ListX éprouvée

### v0.0.9
- ✅ Correctif TypeScript pour la gestion d'erreur

### v0.0.8
- ✅ Refonte complète du système auto-update
- ✅ Logs d'erreur détaillés avec emojis
- ✅ Import direct d'autoUpdater (plus de lazy loading)

### v0.0.7
- ✅ Python backend correctement empaqueté
- ✅ Fix du chemin `python_backend/renamer.py`

### v0.0.3
- ✅ Toggle Copier/Déplacer avec design moderne
- ✅ Tooltips explicatifs
- ✅ Gradient vert et animations

### v0.0.1
- ✅ Version initiale avec Electron + React + Python
- ✅ Drag & Drop fonctionnel
- ✅ Barre de titre et scrollbars custom
- ✅ Système de build GitHub Actions

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👤 Auteur

**TontonKad**

- GitHub: [@Matthmusic](https://github.com/Matthmusic)
- Projet: [AutoNUM](https://github.com/Matthmusic/AUTONUM)

---

Développé avec ❤️ et [Claude Code](https://claude.com/claude-code)
