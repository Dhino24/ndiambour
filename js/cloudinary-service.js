const CloudinaryService = {
    // Configuration Cloudinary
    config: {
        cloudName: 'diovja6qr', // Remplacer par votre cloud_name
        uploadPreset: 'ndiambour'
    },
    
    // Chargement du script Cloudinary de manière asynchrone
    loadCloudinaryScript() {
        // Ne rien faire si le script est déjà chargé via le HTML
        if (typeof cloudinary !== 'undefined') {
            console.log("Script Cloudinary déjà chargé");
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
            script.onload = () => {
                console.log("Script Cloudinary chargé avec succès");
                resolve();
            };
            script.onerror = () => {
                console.error("Erreur lors du chargement du script Cloudinary");
                reject(new Error("Impossible de charger le script Cloudinary"));
            };
            document.head.appendChild(script);
        });
    },
    
    // Optimiser une URL d'image pour l'affichage
    getOptimizedUrl(url, width = 400, height = 300, options = {}) {
        if (!url || !url.includes('cloudinary.com')) return url;
        
        // Options par défaut
        const defaultOptions = {
            crop: 'fill',        // Type de recadrage
            gravity: 'auto',     // Zone d'intérêt automatique
            quality: 'auto',     // Qualité automatique
            fetchFormat: 'auto'  // Format optimal pour le navigateur
        };
        
        // Fusionner les options par défaut avec les options personnalisées
        const finalOptions = { ...defaultOptions, ...options };
        
        // Construire les paramètres de transformation
        let transformParams = `w_${width},h_${height},c_${finalOptions.crop},g_${finalOptions.gravity},q_${finalOptions.quality},f_${finalOptions.fetchFormat}`;
        
        // Ajouter d'autres paramètres si nécessaires
        if (finalOptions.effect) {
            transformParams += `,e_${finalOptions.effect}`;
        }
        
        if (finalOptions.blur) {
            transformParams += `,e_blur:${finalOptions.blur}`;
        }
        
        return url.replace('/upload/', `/upload/${transformParams}/`);
    },
    
    // Créer une miniature optimisée
    getThumbnailUrl(url, width = 100, height = 100) {
        return this.getOptimizedUrl(url, width, height, { crop: 'thumb', gravity: 'face' });
    },
    
    // Créer une URL optimisée pour le hero banner
    getHeroBannerUrl(url, width = 1200, height = 600) {
        return this.getOptimizedUrl(url, width, height, { 
            crop: 'fill', 
            gravity: 'auto',
            effect: 'contrast:10' // Légère amélioration du contraste
        });
    },
    
    // Créer une URL pour une version basse qualité (pour le chargement progressif)
    getLowQualityUrl(url, width = 20) {
        return this.getOptimizedUrl(url, width, Math.round(width * 0.75), { 
            quality: 30,
            blur: 1000
        });
    }
};

export default CloudinaryService;

// ÉTAPE 3: Modifiez la fonction renderVehicles dans index.html
// pour utiliser CloudinaryService pour les images

// Remplacez cette partie dans la fonction renderVehicles:

if (vehicle.images && vehicle.images.length > 0) {
    // Utiliser la fonction getImageById asynchrone dans une fonction auto-exécutée
    (async () => {
        try {
            const image = await DataService.getImageById(vehicle.images[0]);
            if (image && image.src) {
                const img = card.querySelector('.vehicle-image');
                if (img) {
                    // Utiliser Cloudinary pour optimiser l'image
                    img.src = CloudinaryService.getOptimizedUrl(image.src, 400, 300);
                    img.alt = image.alt || imageAlt;
                    
                    // Ajouter un préchargement avec une image de basse qualité pour le chargement progressif
                    const lowQualitySrc = CloudinaryService.getLowQualityUrl(image.src);
                    img.style.backgroundImage = `url('${lowQualitySrc}')`;
                    img.style.backgroundSize = 'cover';
                    img.style.backgroundPosition = 'center center';
                }
            }
        } catch (error) {
            console.error("Erreur lors du chargement de l'image:", error);
        }
    })();
}

// ÉTAPE 4: Modifiez la fonction openDetailsModal 
// pour optimiser les images dans le modal de détails

// Remplacez cette partie dans la fonction updateDetailsGallery:

if (validImages.length === 0) {
    mainImage.src = '/api/placeholder/600/400';
    mainImage.alt = `${vehicle.make} ${vehicle.model}`;
    return;
}

// Mettre à jour l'image principale avec une version optimisée
mainImage.src = CloudinaryService.getOptimizedUrl(validImages[0].src, 600, 400);
mainImage.alt = validImages[0].alt || `${vehicle.make} ${vehicle.model}`;

// Créer les miniatures
validImages.forEach((image, index) => {
    const thumb = document.createElement('img');
    // Utiliser des miniatures optimisées pour un chargement plus rapide
    thumb.src = CloudinaryService.getThumbnailUrl(image.src, 120, 80);
    thumb.alt = image.alt || `Vue ${index + 1}`;
    thumb.className = index === 0 ? 'thumb-image active' : 'thumb-image';
    thumb.dataset.src = CloudinaryService.getOptimizedUrl(image.src, 600, 400);
    
    thumb.addEventListener('click', function() {
        // Désactiver toutes les miniatures
        galleryThumbs.querySelectorAll('.thumb-image').forEach(t => {
            t.classList.remove('active');
        });
        
        // Activer cette miniature
        this.classList.add('active');
        
        // Mettre à jour l'image principale
        mainImage.src = this.dataset.src;
        mainImage.alt = this.alt;
    });
    
    galleryThumbs.appendChild(thumb);
});