# GeoJSON Map Viewer PWA

Une Progressive Web App (PWA) pour visualiser des données GeoJSON contenues dans des fichiers ZIP sur des cartes Mapbox. L'application fonctionne sur iPhone et Android comme une app native.

## 🚀 Fonctionnalités

- **📱 PWA complète** : Installable sur iOS et Android
- **📁 Support des fichiers ZIP** : Extraction automatique des GeoJSON
- **🗺️ Cartes Mapbox** : Visualisation interactive des données géospatiales
- **🎯 Partage natif** : Réception de fichiers via le partage système
- **🌐 Mode hors ligne** : Cache des ressources essentielles
- **📊 Gestion des couches** : Activation/désactivation des calques
- **💡 Interface intuitive** : Glisser-déposer et sélection de fichiers
- **📮 Popups informatifs** : Affichage des propriétés des features

## 🛠️ Configuration

### 1. Clé API Mapbox

**IMPORTANT** : Vous devez configurer votre clé API Mapbox avant d'utiliser l'application.

1. Obtenez une clé API sur [mapbox.com](https://www.mapbox.com/)
2. Ouvrez le fichier `js/app.js`
3. Remplacez la ligne 4 :
   ```javascript
   this.mapboxToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example'; // À REMPLACER
   ```
   par votre vraie clé :
   ```javascript
   this.mapboxToken = 'pk.eyJ1IjoiVk9UUkVfVVNFUiIsImEiOiJWT1RSRV9DTEUifQ.VOTRE_SIGNATURE';
   ```

### 2. Icônes de l'application

Les icônes PNG ne sont pas incluses dans ce template. Vous devez créer les icônes suivantes dans le dossier `icons/` :

- `favicon.ico` (16x16, 32x32)
- `apple-touch-icon.png` (180x180)
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

## 🚀 Installation et lancement

### Prérequis
- Node.js (pour le serveur de développement)
- Clé API Mapbox valide

### Installation
```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:8080`

### Production
```bash
# Servir les fichiers statiques
npm start
```

## 📱 Installation sur mobile

### iOS (Safari)
1. Ouvrez l'app dans Safari
2. Appuyez sur le bouton "Partager" 
3. Sélectionnez "Sur l'écran d'accueil"
4. Confirmez l'installation

### Android (Chrome)
1. Ouvrez l'app dans Chrome
2. Appuyez sur le menu (⋮)
3. Sélectionnez "Installer l'application"
4. Confirmez l'installation

## 🗂️ Utilisation

### 1. Préparation des données
- Créez des fichiers GeoJSON (.geojson ou .json)
- Placez-les dans un fichier ZIP
- Le ZIP peut contenir plusieurs fichiers GeoJSON

### 2. Import des données
- **Glisser-déposer** : Glissez le fichier ZIP sur la zone d'upload
- **Sélection** : Cliquez sur "Choisir un fichier"
- **Partage** : Partagez le ZIP avec l'app depuis d'autres applications

### 3. Visualisation
- Les données s'affichent automatiquement sur la carte
- Chaque fichier GeoJSON devient une couche
- Utilisez le panneau "Calques" pour gérer la visibilité
- Cliquez sur les éléments pour voir leurs propriétés

## 🏗️ Structure du projet

```
test_geojson_swmap/
├── index.html              # Page principale
├── manifest.json           # Manifeste PWA
├── sw.js                   # Service Worker
├── package.json            # Dépendances Node.js
├── styles/
│   └── main.css            # Styles CSS
├── js/
│   └── app.js              # Application JavaScript
├── icons/                  # Icônes de l'app (à créer)
└── .github/
    └── copilot-instructions.md
```

## 🔧 Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Cartes** : Mapbox GL JS
- **Extraction ZIP** : JSZip
- **PWA** : Service Worker, Web App Manifest
- **Mobile** : Web Share Target API, File Handling API

## 🌟 Fonctionnalités avancées

### Partage natif
L'app peut recevoir des fichiers ZIP directement depuis d'autres applications grâce à la Web Share Target API.

### Mode hors ligne
Les ressources principales sont mises en cache pour permettre l'utilisation hors ligne.

### Responsive design
Interface optimisée pour tous les écrans (mobile, tablette, desktop).

### Gestion des erreurs
Messages d'erreur explicites et récupération gracieuse des pannes.

## 🐛 Dépannage

### "Veuillez configurer votre clé API Mapbox"
- Vérifiez que vous avez remplacé la clé d'exemple dans `js/app.js`
- Assurez-vous que votre clé est valide et active

### Les icônes ne s'affichent pas
- Créez les fichiers PNG dans le dossier `icons/`
- Vérifiez les dimensions spécifiées dans le manifeste

### L'app ne s'installe pas
- Vérifiez que vous utilisez HTTPS (ou localhost)
- Assurez-vous que le manifeste est valide
- Testez sur différents navigateurs

## 📄 License

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir des issues ou proposer des pull requests.