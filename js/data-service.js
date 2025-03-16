// Clés localStorage
const KEYS = {
  IMGS: 'ndiambour_images',
  VEHS: 'ndiambour_vehicles',
  CATS: 'ndiambour_categories',
  SETS: 'ndiambour_settings'
};

// Service de données optimisé
const DataService = {
  // Initialisation
  init() {
    // Images
    this._initStore(KEYS.IMGS, []);
    
    // Véhicules
    this._initStore(KEYS.VEHS, []);
    
    // Catégories
    this._initStore(KEYS.CATS, [
      { id: 'vehicles', name: 'Véhicules', icon: 'fas fa-car', count: 0 },
      { id: 'interiors', name: 'Intérieurs', icon: 'fas fa-couch', count: 0 },
      { id: 'exteriors', name: 'Extérieurs', icon: 'fas fa-car-side', count: 0 },
      { id: 'others', name: 'Autres', icon: 'fas fa-images', count: 0 }
    ]);
    
    // Paramètres
    this._initStore(KEYS.SETS, {
      siteName: 'Ndiambour Location',
      currency: 'FCFA',
      language: 'fr'
    });
    
    console.log('DataService: initialisé');
  },
  
  // Helper pour initialiser un store
  _initStore(key, defaultVal) {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
    }
  },
  
  // Helper pour get/set un store
  _getStore(key) { return JSON.parse(localStorage.getItem(key) || '[]'); },
  _setStore(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
  
  // Helper pour générer un ID
  _genId(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; },
  
  // =============== GESTION DES IMAGES ===============
  
  // Récupérer toutes les images
  getAllImages() { return this._getStore(KEYS.IMGS); },
  
  // Filtrer par catégorie
  getImagesByCategory(cat) {
    const imgs = this.getAllImages();
    return cat === 'all' ? imgs : imgs.filter(img => img.category === cat);
  },
  
  // Filtrer par véhicule
  getImagesByVehicle(vehId) {
    return this.getAllImages().filter(img => img.vehicleId === vehId);
  },
  
  // Trouver par ID
  getImageById(imgId) {
    return this.getAllImages().find(img => img.id === imgId);
  },
  
  // Ajouter image
  addImage(imgData) {
    const imgs = this.getAllImages();
    
    // Auto-générer ID et date si manquants
    if (!imgData.id) imgData.id = this._genId('img');
    if (!imgData.dateAdded) imgData.dateAdded = new Date().toISOString();
    
    imgs.push(imgData);
    this._setStore(KEYS.IMGS, imgs);
    
    // Mettre à jour compteur catégorie
    this.updateCategoryCount(imgData.category, 1);
    
    return imgData;
  },
  
  // Mettre à jour image
  updateImage(imgId, updates) {
    const imgs = this.getAllImages();
    const idx = imgs.findIndex(img => img.id === imgId);
    
    if (idx === -1) return null;
    
    const oldImg = imgs[idx];
    const updatedImg = {...oldImg, ...updates};
    
    // Gestion changement catégorie
    if (updates.category && updates.category !== oldImg.category) {
      this.updateCategoryCount(oldImg.category, -1);
      this.updateCategoryCount(updates.category, 1);
    }
    
    // Gestion changement véhicule
    if (updates.vehicleId !== undefined && updates.vehicleId !== oldImg.vehicleId) {
      if (oldImg.vehicleId) this.removeImageFromVehicle(imgId, oldImg.vehicleId);
      if (updates.vehicleId) this.addImageToVehicle(imgId, updates.vehicleId);
    }
    
    imgs[idx] = updatedImg;
    this._setStore(KEYS.IMGS, imgs);
    
    return updatedImg;
  },
  
  // Supprimer image
  deleteImage(imgId) {
    const imgs = this.getAllImages();
    const idx = imgs.findIndex(img => img.id === imgId);
    
    if (idx === -1) return false;
    
    const deletedImg = imgs[idx];
    imgs.splice(idx, 1);
    this._setStore(KEYS.IMGS, imgs);
    
    // Mise à jour compteur catégorie
    this.updateCategoryCount(deletedImg.category, -1);
    
    // Mise à jour véhicule si besoin
    if (deletedImg.vehicleId) {
      this.removeImageFromVehicle(imgId, deletedImg.vehicleId);
    }
    
    return true;
  },
  
  // =============== CATÉGORIES ===============
  
  // Récupérer toutes les catégories
  getAllCategories() { return this._getStore(KEYS.CATS); },
  
  // Mettre à jour compteur
  updateCategoryCount(catId, delta) {
    const cats = this.getAllCategories();
    const idx = cats.findIndex(cat => cat.id === catId);
    
    if (idx === -1) return false;
    
    cats[idx].count = Math.max(0, cats[idx].count + delta);
    this._setStore(KEYS.CATS, cats);
    return true;
  },
  
  // =============== VÉHICULES ===============
  
  // Récupérer tous les véhicules
  getAllVehicles() { return this._getStore(KEYS.VEHS); },
  
  // Trouver par ID
  getVehicleById(vehId) {
    return this.getAllVehicles().find(v => v.id === vehId);
  },
  
  // Ajouter véhicule
  addVehicle(vehData) {
    const vehs = this.getAllVehicles();
    
    // Auto-générer ID, initialiser images et date si manquants
    if (!vehData.id) vehData.id = this._genId('veh');
    if (!vehData.images) vehData.images = [];
    if (!vehData.dateAdded) vehData.dateAdded = new Date().toISOString();
    
    vehs.push(vehData);
    this._setStore(KEYS.VEHS, vehs);
    
    return vehData;
  },
  
  // Mettre à jour véhicule
  updateVehicle(vehId, updates) {
    const vehs = this.getAllVehicles();
    const idx = vehs.findIndex(v => v.id === vehId);
    
    if (idx === -1) return null;
    
    vehs[idx] = {...vehs[idx], ...updates};
    this._setStore(KEYS.VEHS, vehs);
    return vehs[idx];
  },
  
  // Supprimer véhicule
  deleteVehicle(vehId) {
    const vehs = this.getAllVehicles();
    const idx = vehs.findIndex(v => v.id === vehId);
    
    if (idx === -1) return false;
    
    // Récupérer images associées pour mise à jour
    const vehImgs = this.getImagesByVehicle(vehId);
    
    // Supprimer véhicule
    vehs.splice(idx, 1);
    this._setStore(KEYS.VEHS, vehs);
    
    // Mettre à jour les images associées
    vehImgs.forEach(img => {
      this.updateImage(img.id, {vehicleId: null, vehicleName: ''});
    });
    
    return true;
  },
  
  // Ajouter image à véhicule
  addImageToVehicle(imgId, vehId) {
    const vehs = this.getAllVehicles();
    const vehIdx = vehs.findIndex(v => v.id === vehId);
    
    if (vehIdx === -1) return false;
    
    // Initialiser tableau images si nécessaire
    if (!vehs[vehIdx].images) vehs[vehIdx].images = [];
    
    // Ajouter image si pas déjà présente
    if (!vehs[vehIdx].images.includes(imgId)) {
      vehs[vehIdx].images.push(imgId);
      this._setStore(KEYS.VEHS, vehs);
      
      // Mise à jour bidirectionnelle
      const veh = vehs[vehIdx];
      this.updateImage(imgId, {
        vehicleId: vehId,
        vehicleName: `${veh.make} ${veh.model} ${veh.year || ''}`
      });
    }
    
    return true;
  },
  
  // Supprimer image de véhicule
  removeImageFromVehicle(imgId, vehId) {
    const vehs = this.getAllVehicles();
    const vehIdx = vehs.findIndex(v => v.id === vehId);
    
    if (vehIdx === -1 || !vehs[vehIdx].images) return false;
    
    const imgIdx = vehs[vehIdx].images.indexOf(imgId);
    if (imgIdx > -1) {
      vehs[vehIdx].images.splice(imgIdx, 1);
      this._setStore(KEYS.VEHS, vehs);
      
      // Mise à jour bidirectionnelle
      this.updateImage(imgId, {vehicleId: null, vehicleName: ''});
    }
    
    return true;
  },
  
  // =============== UTILITAIRES ===============
  
  // Formatter taille fichier
  formatFileSize(bytes) {
    if (bytes === undefined || bytes === null) return 'Inconnu';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },
  
  // Vider données (dev/test)
  clearAllData() {
    localStorage.removeItem(KEYS.IMGS);
    localStorage.removeItem(KEYS.VEHS);
    localStorage.removeItem(KEYS.CATS);
    localStorage.removeItem(KEYS.SETS);
    this.init();
  },
  
  // Paramètres
  getSettings() { return JSON.parse(localStorage.getItem(KEYS.SETS) || '{}'); },
  
  updateSettings(updates) {
    const settings = this.getSettings();
    const newSettings = {...settings, ...updates};
    localStorage.setItem(KEYS.SETS, JSON.stringify(newSettings));
    return newSettings;
  }
};

// Init au chargement
document.addEventListener('DOMContentLoaded', () => DataService.init());