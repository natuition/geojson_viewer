class GeoJSONMapApp {
    constructor() {
        // Mapbox configuration - REMPLACEZ CETTE CLEF PAR VOTRE CLÉ MAPBOX
        this.mapboxToken = 'pk.eyJ1IjoidmluY2VudGxiIiwiYSI6ImNtZno0aGJ1bTByaTkya3NoM3lmNDhicmsifQ.o8go9oRwhbPYjiXOfwE-DQ'; // À REMPLACER
        this.map = null;
        this.layers = new Map();
        this.currentLayers = [];
        this.currentBounds = null; // Pour stocker les limites des données

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.handleSharedFile();
    }

    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('fileInput');
        const selectFileBtn = document.getElementById('selectFileBtn');
        const uploadArea = document.getElementById('uploadArea');

        selectFileBtn.addEventListener('click', (e) => {
            console.log('🔘 Bouton "Choisir" cliqué');
            e.preventDefault();
            e.stopPropagation();

            // Essayer plusieurs méthodes pour déclencher l'input
            try {
                fileInput.click();
            } catch (error) {
                console.warn('Erreur click direct:', error);
                // Fallback : déclencher manuellement
                const event = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                });
                fileInput.dispatchEvent(event);
            }
        });

        // Ajout d'événements tactiles pour mobile
        selectFileBtn.addEventListener('touchstart', (e) => {
            console.log('👆 Touch sur bouton "Choisir"');
        });

        selectFileBtn.addEventListener('touchend', (e) => {
            console.log('👆 Touch end sur bouton "Choisir"');
            e.preventDefault();
            fileInput.click();
        });

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            console.log('📁 Fichier sélectionné:', e.target.files.length);
            if (e.target.files.length > 0) {
                console.log('📄 Nom du fichier:', e.target.files[0].name);
                console.log('📊 Taille du fichier:', e.target.files[0].size);
                this.handleFile(e.target.files[0]);
            }
        });

        // Navigation
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showUploadSection();
        });

        document.getElementById('layersBtn').addEventListener('click', () => {
            this.toggleLayerPanel();
        });

        document.getElementById('closePanelBtn').addEventListener('click', () => {
            this.closeLayerPanel();
        });

        // Help modal
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelpModal();
        });

        document.getElementById('closeHelpBtn').addEventListener('click', () => {
            this.hideHelpModal();
        });

        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                this.hideHelpModal();
            }
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });

        uploadArea.addEventListener('drop', (e) => {
            console.log('🎯 Drop détecté!');
            const dt = e.dataTransfer;
            const files = dt.files;
            console.log('📁 Nombre de fichiers droppés:', files.length);

            if (files.length > 0) {
                console.log('📄 Fichier droppé:', files[0].name);
                this.handleFile(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.zip')) {
            this.showError('Veuillez sélectionner un fichier ZIP.');
            return;
        }

        this.showLoading(true);

        try {
            const geojsonFiles = await this.extractGeoJSONFromZip(file);

            if (geojsonFiles.length === 0) {
                this.showError('Aucun fichier GeoJSON trouvé dans le ZIP.');
                return;
            }

            // Essayer d'afficher sur la carte avec retry
            await this.displayOnMapWithRetry(geojsonFiles);
            this.showMapSection();
        } catch (error) {
            console.error('Erreur lors du traitement du fichier:', error);
            this.showError('Erreur lors du traitement du fichier ZIP.');
        } finally {
            this.showLoading(false);
        }
    }

    async displayOnMapWithRetry(geojsonFiles, retryCount = 0) {
        try {
            await this.displayOnMap(geojsonFiles);
        } catch (error) {
            console.warn(`Tentative ${retryCount + 1} échouée:`, error);

            if (retryCount < 2) {
                // Attendre un peu et réessayer
                await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
                return await this.displayOnMapWithRetry(geojsonFiles, retryCount + 1);
            } else {
                throw error;
            }
        }
    }

    async extractGeoJSONFromZip(file) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        const geojsonFiles = [];

        for (const [filename, zipEntry] of Object.entries(contents.files)) {
            if (zipEntry.dir) continue;

            const extension = filename.toLowerCase().split('.').pop();
            if (['geojson', 'json'].includes(extension)) {
                try {
                    const content = await zipEntry.async('text');
                    const geojson = JSON.parse(content);

                    // Vérifier que c'est un GeoJSON valide
                    if (this.isValidGeoJSON(geojson)) {
                        geojsonFiles.push({
                            filename: filename,
                            data: geojson
                        });
                    }
                } catch (error) {
                    console.warn(`Impossible de parser ${filename}:`, error);
                }
            }
        }

        return geojsonFiles;
    }

    isValidGeoJSON(data) {
        return data &&
            data.type &&
            ['FeatureCollection', 'Feature', 'Point', 'LineString', 'Polygon',
                'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].includes(data.type);
    }

    async displayOnMap(geojsonFiles) {
        // Vérifier la clé Mapbox
        if (this.mapboxToken === 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example') {
            this.showError('Veuillez configurer votre clé API Mapbox dans le fichier js/app.js');
            return;
        }

        if (!this.map) {
            mapboxgl.accessToken = this.mapboxToken;

            this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/vincentlb/cmfwcr7jb008101sc99fk3cfo',
                center: [0, 20], // Vue globe par défaut
                zoom: 1.5, // Vue globe éloignée
                projection: 'globe' // Projection globe si supportée
            });

            this.map.addControl(new mapboxgl.NavigationControl());
            this.map.addControl(new mapboxgl.ScaleControl());

            // Attendre que la carte soit complètement prête
            await new Promise((resolve) => {
                if (this.map.loaded()) {
                    resolve();
                } else {
                    this.map.on('load', resolve);
                }
            });

            // Attendre un peu plus pour s'assurer que tout est stabilisé
            await new Promise(resolve => setTimeout(resolve, 300));

            // S'assurer que la carte prend la bonne taille
            this.map.resize();
        } else {
            // S'assurer que la carte est chargée pour une carte existante
            if (!this.map.loaded()) {
                await new Promise((resolve) => {
                    this.map.on('load', resolve);
                });
            }

            // Petit délai pour la stabilité
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Nettoyer les couches existantes
        this.clearLayers();        // Calculer les limites pour ajuster la vue
        let bounds = new mapboxgl.LngLatBounds();
        let hasFeatures = false;

        // Ajouter chaque fichier GeoJSON comme couche
        geojsonFiles.forEach((file, index) => {
            const layerId = `layer-${index}`;
            const sourceId = `source-${index}`;

            // Ajouter la source
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: file.data
            });

            // Déterminer le style basé sur le type de géométrie
            const styles = this.getStylesForGeoJSON(file.data, layerId);

            styles.forEach(style => {
                this.map.addLayer(style);
            });

            // Étendre les limites
            if (file.data.type === 'FeatureCollection') {
                file.data.features.forEach(feature => {
                    if (feature.geometry) {
                        this.addGeometryToBounds(bounds, feature.geometry);
                        hasFeatures = true;
                    }
                });
            } else if (file.data.geometry) {
                this.addGeometryToBounds(bounds, file.data.geometry);
                hasFeatures = true;
            }

            // Stocker les informations de couche
            this.layers.set(layerId, {
                filename: file.filename,
                sourceId: sourceId,
                data: file.data,
                visible: true,
                styles: styles.map(s => s.id)
            });

            // Ajouter les popups
            this.setupLayerPopups(layerId, sourceId);
        });

        // Ajuster la vue aux données - différer pour permettre le redimensionnement
        if (hasFeatures) {
            // Stocker les bounds pour un recentrage ultérieur
            this.currentBounds = bounds;

            // Au lieu de centrer immédiatement, garder la vue par défaut
            // L'animation se fera quand la carte sera visible et redimensionnée
        }

        // Mettre à jour le panneau des couches
        this.updateLayerPanel();
    }

    getStylesForGeoJSON(geojson, layerId) {
        const styles = [];
        const sourceId = `source-${layerId.split('-')[1]}`;

        // Analyser les types de géométries présents
        const geometryTypes = new Set();

        if (geojson.type === 'FeatureCollection') {
            geojson.features.forEach(feature => {
                if (feature.geometry) {
                    geometryTypes.add(feature.geometry.type);
                }
            });
        } else if (geojson.geometry) {
            geometryTypes.add(geojson.geometry.type);
        }

        // Couleurs aléatoires pour chaque couche
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        const colorIndex = parseInt(layerId.split('-')[1]) % colors.length;
        const color = colors[colorIndex];

        // Style pour les polygones
        if (geometryTypes.has('Polygon') || geometryTypes.has('MultiPolygon')) {
            styles.push({
                id: `${layerId}-fill`,
                type: 'fill',
                source: sourceId,
                filter: ['in', '$type', 'Polygon'],
                paint: {
                    'fill-color': color,
                    'fill-opacity': 0.6
                }
            });

            styles.push({
                id: `${layerId}-line`,
                type: 'line',
                source: sourceId,
                filter: ['in', '$type', 'Polygon'],
                paint: {
                    'line-color': color,
                    'line-width': 2
                }
            });
        }

        // Style pour les lignes
        if (geometryTypes.has('LineString') || geometryTypes.has('MultiLineString')) {
            styles.push({
                id: `${layerId}-line`,
                type: 'line',
                source: sourceId,
                filter: ['in', '$type', 'LineString'],
                paint: {
                    'line-color': color,
                    'line-width': 3
                }
            });
        }

        // Style pour les points
        if (geometryTypes.has('Point') || geometryTypes.has('MultiPoint')) {
            styles.push({
                id: `${layerId}-circle`,
                type: 'circle',
                source: sourceId,
                filter: ['in', '$type', 'Point'],
                paint: {
                    'circle-color': color,
                    'circle-radius': 6,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'
                }
            });
        }

        return styles;
    }

    addGeometryToBounds(bounds, geometry) {
        switch (geometry.type) {
            case 'Point':
                bounds.extend(geometry.coordinates);
                break;
            case 'LineString':
            case 'MultiPoint':
                geometry.coordinates.forEach(coord => bounds.extend(coord));
                break;
            case 'Polygon':
            case 'MultiLineString':
                geometry.coordinates.forEach(ring => {
                    ring.forEach(coord => bounds.extend(coord));
                });
                break;
            case 'MultiPolygon':
                geometry.coordinates.forEach(polygon => {
                    polygon.forEach(ring => {
                        ring.forEach(coord => bounds.extend(coord));
                    });
                });
                break;
        }
    }

    setupLayerPopups(layerId, sourceId) {
        const circleLayerId = `${layerId}-circle`;
        const fillLayerId = `${layerId}-fill`;

        // Popup pour les points
        if (this.map.getLayer(circleLayerId)) {
            this.map.on('click', circleLayerId, (e) => {
                this.showPopup(e);
            });

            this.map.on('mouseenter', circleLayerId, () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });

            this.map.on('mouseleave', circleLayerId, () => {
                this.map.getCanvas().style.cursor = '';
            });
        }

        // Popup pour les polygones
        if (this.map.getLayer(fillLayerId)) {
            this.map.on('click', fillLayerId, (e) => {
                this.showPopup(e);
            });

            this.map.on('mouseenter', fillLayerId, () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });

            this.map.on('mouseleave', fillLayerId, () => {
                this.map.getCanvas().style.cursor = '';
            });
        }
    }

    showPopup(e) {
        const feature = e.features[0];
        const coordinates = e.lngLat;

        let content = '<div style="max-width: 200px;">';

        if (feature.properties && Object.keys(feature.properties).length > 0) {
            Object.entries(feature.properties).forEach(([key, value]) => {
                content += `<p><strong>${key}:</strong> ${value}</p>`;
            });
        } else {
            content += '<p>Aucune propriété disponible</p>';
        }

        content += '</div>';

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(content)
            .addTo(this.map);
    }

    clearLayers() {
        this.layers.forEach((layer, layerId) => {
            layer.styles.forEach(styleId => {
                if (this.map.getLayer(styleId)) {
                    this.map.removeLayer(styleId);
                }
            });

            if (this.map.getSource(layer.sourceId)) {
                this.map.removeSource(layer.sourceId);
            }
        });

        this.layers.clear();
    }

    updateLayerPanel() {
        const layerList = document.getElementById('layerList');
        layerList.innerHTML = '';

        this.layers.forEach((layer, layerId) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';

            const featureCount = layer.data.type === 'FeatureCollection'
                ? layer.data.features.length
                : 1;

            layerItem.innerHTML = `
                <div class="layer-info">
                    <div class="layer-name">${layer.filename}</div>
                    <div class="layer-count">${featureCount} élément${featureCount > 1 ? 's' : ''}</div>
                </div>
                <div class="layer-toggle ${layer.visible ? 'active' : ''}" data-layer="${layerId}"></div>
            `;

            const toggle = layerItem.querySelector('.layer-toggle');
            toggle.addEventListener('click', () => {
                this.toggleLayer(layerId);
            });

            layerList.appendChild(layerItem);
        });
    }

    toggleLayer(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return;

        layer.visible = !layer.visible;
        const visibility = layer.visible ? 'visible' : 'none';

        layer.styles.forEach(styleId => {
            if (this.map.getLayer(styleId)) {
                this.map.setLayoutProperty(styleId, 'visibility', visibility);
            }
        });

        this.updateLayerPanel();
    }

    showUploadSection() {
        document.getElementById('uploadSection').style.display = 'flex';
        document.getElementById('mapSection').style.display = 'none';
        this.closeLayerPanel();
    }

    showMapSection() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('mapSection').style.display = 'flex';

        // Forcer le redimensionnement de la carte après qu'elle soit visible
        if (this.map) {
            setTimeout(() => {
                this.map.resize();
                console.log('Carte redimensionnée');

                // Démarrer l'animation de zoom après un petit délai
                setTimeout(() => {
                    this.recenterMap();
                }, 200);
            }, 100);
        }
    }

    recenterMap() {
        if (this.map && this.currentBounds) {
            // Animation en 2 étapes : partir du globe puis zoomer sur les données
            this.animateToData();
        }
    }

    async animateToData() {
        // Zoomer directement sur les données depuis la vue globe par défaut
        this.map.fitBounds(this.currentBounds, {
            padding: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            },
            duration: 5000, // Animation plus longue pour compenser l'étape supprimée
            essential: true,
            maxZoom: 20, // Zoom final plus proche
            pitch: 45, // Angle d'inclinaison vers le bas (0-60°)
            bearing: 0 // Orientation nord (optionnel)
        });

        console.log('🎯 Animation de zoom direct terminée');
    }

    toggleLayerPanel() {
        const panel = document.getElementById('layerPanel');
        panel.classList.toggle('open');
    }

    closeLayerPanel() {
        const panel = document.getElementById('layerPanel');
        panel.classList.remove('open');
    }

    showHelpModal() {
        document.getElementById('helpModal').classList.add('show');
    }

    hideHelpModal() {
        document.getElementById('helpModal').classList.remove('show');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showError(message) {
        const toast = document.getElementById('errorToast');
        const messageEl = document.getElementById('errorMessage');

        messageEl.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Gestion du partage de fichiers (Web Share Target API)
    handleSharedFile() {
        // Vérifier s'il y a des paramètres de partage dans l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const sharedFile = urlParams.get('file');

        if (sharedFile) {
            // Traiter le fichier partagé
            console.log('Fichier partagé détecté:', sharedFile);
        }

        // Écouter les événements de partage
        if ('serviceWorker' in navigator && 'share' in navigator) {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SHARED_FILE') {
                    this.handleFile(event.data.file);
                }
            });
        }
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new GeoJSONMapApp();
});