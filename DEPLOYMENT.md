# Déploiement GitHub Pages

Ce projet est configuré pour être automatiquement déployé sur GitHub Pages.

## 🌐 URL de Production
- **GitHub Pages**: https://natuition.github.io/geojson_viewer/

## 🚀 Déploiement Automatique

Le déploiement se fait automatiquement via GitHub Actions à chaque push sur la branche `main`.

### Configuration requise :
1. ✅ Repository public (ou GitHub Pro pour repository privé)
2. ✅ GitHub Actions activé
3. ✅ GitHub Pages activé dans les paramètres du repository

### Workflow de déploiement :
- **Déclencheur** : Push sur `main` ou déclenchement manuel
- **Node.js** : Version 18
- **Dependencies** : Installation automatique via `npm ci`
- **Artifact** : Upload de tous les fichiers du projet
- **Déploiement** : Automatique sur GitHub Pages

## 🔧 Configuration locale pour test

Pour tester localement avant déploiement :

```bash
# Installation des dépendances
npm install

# Serveur de développement
npm start

# Test de l'application
open http://localhost:8080
```

## 📱 PWA sur GitHub Pages

L'application fonctionne comme une PWA complète sur GitHub Pages :

- ✅ **HTTPS** : Requis par GitHub Pages
- ✅ **Service Worker** : Cache automatique
- ✅ **Manifest** : Installation sur mobile
- ✅ **Partage de fichiers** : Support natif
- ✅ **Mode hors-ligne** : Fonctionnalité basique

## 🐛 Résolution de problèmes

### PWA ne s'installe pas
- Vérifier HTTPS (automatique sur GitHub Pages)
- Vérifier le Service Worker dans DevTools
- Vérifier le manifest.json

### Erreur 404 sur les ressources
- Vérifier les chemins relatifs dans le code
- GitHub Pages utilise `/geojson_viewer/` comme base URL

### Mapbox ne charge pas
- Vérifier la clé API Mapbox
- Vérifier les domaines autorisés sur Mapbox

## 📝 Notes importantes

- Les chemins sont adaptés pour GitHub Pages (`/geojson_viewer/`)
- Le dossier `.github/` est ignoré dans le repository mais nécessaire pour les Actions
- Le fichier `404.html` gère les redirections PWA