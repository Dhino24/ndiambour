// Service de données amélioré avec Firebase et Cloudinary
import { db, storage, collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, ref, uploadBytes, getDownloadURL, deleteObject } from './firebase-config.js';

// Configuration Cloudinary
const cloudinaryConfig = {
  cloudName: 'diovja6qr',
  uploadPreset: 'ndiambour',
  folder: 'ndiambour'
};

// Service de données optimisé
const DataService = {
  // Collections Firestore
  collections: {
    VEHICLES: 'vehicles',
    IMAGES: 'images',
    CATEGORIES: 'categories',
    SETTINGS: 'settings',
    RESERVATIONS: 'reservations',
    CONTACTS: 'contacts'
  },
  
  // Initialisation - vérifier si des données existent déjà
  init: async function() {
    try {
      // Vérifier les catégories
      const categoriesQuery = await getDocs(collection(db, this.collections.CATEGORIES));
      
      if (categoriesQuery.empty) {
        // Créer les catégories par défaut
        const defaultCategories = [
          { id: 'vehicles', name: 'Véhicules', icon: 'fas fa-car', count: 0 },
          { id: 'interiors', name: 'Intérieurs', icon: 'fas fa-couch', count: 0 },
          { id: 'exteriors', name: 'Extérieurs', icon: 'fas fa-car-side', count: 0 },
          { id: 'others', name: 'Autres', icon: 'fas fa-images', count: 0 }
        ];
        
        for (const category of defaultCategories) {
          await addDoc(collection(db, this.collections.CATEGORIES), category);
        }
        
        console.log('Catégories par défaut créées avec succès');
      }
      
      // Vérifier les paramètres
      const settingsQuery = await getDocs(collection(db, this.collections.SETTINGS));
      
      if (settingsQuery.empty) {
        // Créer les paramètres par défaut
        await addDoc(collection(db, this.collections.SETTINGS), {
          siteName: 'Ndiambour Location',
          currency: 'FCFA',
          language: 'fr',
          lastUpdated: new Date().toISOString()
        });
        
        console.log('Paramètres par défaut créés avec succès');
      }
      
      console.log('DataService initialisé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service de données:', error);
      return false;
    }
  },
  
  // =============== GESTION DES VÉHICULES ===============
  
  // Récupérer tous les véhicules
  getAllVehicles: async function() {
    try {
      const vehiclesQuery = await getDocs(collection(db, this.collections.VEHICLES));
      return vehiclesQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
      return [];
    }
  },
  
  // Récupérer les véhicules par type (vente ou location)
  getVehiclesByType: async function(type) {
    try {
      const q = query(
        collection(db, this.collections.VEHICLES),
        where('type', '==', type)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des véhicules de type ${type}:`, error);
      return [];
    }
  },
  
  // Récupérer un véhicule par ID
  getVehicleById: async function(vehicleId) {
    try {
      const vehicleDoc = await getDoc(doc(db, this.collections.VEHICLES, vehicleId));
      
      if (vehicleDoc.exists()) {
        return {
          id: vehicleDoc.id,
          ...vehicleDoc.data()
        };
      } else {
        console.log(`Aucun véhicule trouvé avec l'ID: ${vehicleId}`);
        return null;
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du véhicule ${vehicleId}:`, error);
      return null;
    }
  },
  
  // Ajouter un véhicule
  addVehicle: async function(vehicleData) {
    try {
      // Assurer que les champs requis sont présents
      if (!vehicleData.make || !vehicleData.model) {
        throw new Error('La marque et le modèle sont obligatoires');
      }
      
      // Préparer les données
      const newVehicle = {
        ...vehicleData,
        images: vehicleData.images || [],
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      // Ajouter à Firestore
      const docRef = await addDoc(collection(db, this.collections.VEHICLES), newVehicle);
      
      return {
        id: docRef.id,
        ...newVehicle
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout du véhicule:', error);
      throw error;
    }
  },
  
  // Mettre à jour un véhicule
  updateVehicle: async function(vehicleId, updates) {
    try {
      const vehicleRef = doc(db, this.collections.VEHICLES, vehicleId);
      
      // Vérifier si le véhicule existe
      const vehicleSnap = await getDoc(vehicleRef);
      
      if (!vehicleSnap.exists()) {
        throw new Error(`Le véhicule avec l'ID ${vehicleId} n'existe pas`);
      }
      
      // Ajouter la date de mise à jour
      const updatedData = {
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      // Mettre à jour Firestore
      await updateDoc(vehicleRef, updatedData);
      
      return {
        id: vehicleId,
        ...vehicleSnap.data(),
        ...updatedData
      };
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du véhicule ${vehicleId}:`, error);
      throw error;
    }
  },
  
  // Supprimer un véhicule
  deleteVehicle: async function(vehicleId) {
    try {
      // Récupérer le véhicule pour obtenir ses images
      const vehicle = await this.getVehicleById(vehicleId);
      
      if (!vehicle) {
        throw new Error(`Le véhicule avec l'ID ${vehicleId} n'existe pas`);
      }
      
      // Supprimer d'abord les associations d'images
      if (vehicle.images && vehicle.images.length > 0) {
        for (const imageId of vehicle.images) {
          // Mettre à jour l'image pour supprimer l'association
          try {
            await this.updateImage(imageId, { vehicleId: null, vehicleName: '' });
          } catch (imgError) {
            console.warn(`Impossible de mettre à jour l'image ${imageId}:`, imgError);
          }
        }
      }
      
      // Supprimer le véhicule
      await deleteDoc(doc(db, this.collections.VEHICLES, vehicleId));
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du véhicule ${vehicleId}:`, error);
      throw error;
    }
  },
  
  // =============== GESTION DES IMAGES ===============
  
  // Récupérer toutes les images
  getAllImages: async function() {
    try {
      const imagesQuery = await getDocs(collection(db, this.collections.IMAGES));
      return imagesQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des images:', error);
      return [];
    }
  },
  
  // Récupérer les images par catégorie
  getImagesByCategory: async function(category) {
    try {
      if (category === 'all') {
        return await this.getAllImages();
      }
      
      const q = query(
        collection(db, this.collections.IMAGES),
        where('category', '==', category)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des images de catégorie ${category}:`, error);
      return [];
    }
  },
  
  // Récupérer les images par véhicule
  getImagesByVehicle: async function(vehicleId) {
    try {
      const q = query(
        collection(db, this.collections.IMAGES),
        where('vehicleId', '==', vehicleId)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des images du véhicule ${vehicleId}:`, error);
      return [];
    }
  },
  
  // Récupérer une image par ID
  getImageById: async function(imageId) {
    try {
      const imageDoc = await getDoc(doc(db, this.collections.IMAGES, imageId));
      
      if (imageDoc.exists()) {
        return {
          id: imageDoc.id,
          ...imageDoc.data()
        };
      } else {
        console.log(`Aucune image trouvée avec l'ID: ${imageId}`);
        return null;
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'image ${imageId}:`, error);
      return null;
    }
  },
  
  // Ajouter une image avec Cloudinary
  addImage: async function(file, metadata = {}) {
    try {
      // Si l'image a déjà été uploadée sur Cloudinary
      if (metadata.src && metadata.src.includes('cloudinary.com')) {
        // Créer l'entrée dans Firestore
        const imageData = {
          fileName: metadata.fileName || 'Image',
          fileType: metadata.fileType || 'JPG',
          category: metadata.category || 'others',
          alt: metadata.alt || metadata.fileName || 'Image',
          src: metadata.src,
          size: metadata.size || 'Unknown',
          dimensions: metadata.dimensions || 'Unknown',
          vehicleId: metadata.vehicleId || null,
          vehicleName: metadata.vehicleName || '',
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        // Ajouter à Firestore
        const docRef = await addDoc(collection(db, this.collections.IMAGES), imageData);
        
        // Mettre à jour le compteur de catégorie
        await this.incrementCategoryCount(imageData.category);
        
        // Si l'image est associée à un véhicule, mettre à jour le véhicule
        if (imageData.vehicleId) {
          await this.addImageToVehicle(docRef.id, imageData.vehicleId);
        }
        
        return {
          id: docRef.id,
          ...imageData
        };
      } else {
        // Créer une nouvelle entrée pour l'image
        const imageData = {
          fileName: file.name || 'Image',
          fileType: file.type ? file.type.split('/')[1].toUpperCase() : 'JPG',
          category: metadata.category || 'others',
          alt: metadata.alt || file.name || 'Image',
          // L'URL sera ajoutée après l'upload
          src: '',
          size: this.formatFileSize(file.size) || 'Unknown',
          dimensions: metadata.dimensions || 'Unknown',
          vehicleId: metadata.vehicleId || null,
          vehicleName: metadata.vehicleName || '',
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        // Ajouter d'abord à Firestore pour obtenir l'ID
        const docRef = await addDoc(collection(db, this.collections.IMAGES), imageData);
        
        // Créer un nom unique pour le fichier
        const fileName = `${docRef.id}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        // Uploader sur Firebase Storage
        const storageRef = ref(storage, `images/${fileName}`);
        await uploadBytes(storageRef, file);
        
        // Obtenir l'URL de téléchargement
        const downloadURL = await getDownloadURL(storageRef);
        
        // Mettre à jour l'URL dans Firestore
        await updateDoc(docRef, { src: downloadURL });
        
        // Mettre à jour le compteur de catégorie
        await this.incrementCategoryCount(imageData.category);
        
        // Si l'image est associée à un véhicule, mettre à jour le véhicule
        if (imageData.vehicleId) {
          await this.addImageToVehicle(docRef.id, imageData.vehicleId);
        }
        
        return {
          id: docRef.id,
          ...imageData,
          src: downloadURL
        };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'image:", error);
      throw error;
    }
  },
  
  // Mettre à jour une image
  updateImage: async function(imageId, updates) {
    try {
      const imageRef = doc(db, this.collections.IMAGES, imageId);
      
      // Vérifier si l'image existe
      const imageSnap = await getDoc(imageRef);
      
      if (!imageSnap.exists()) {
        throw new Error(`L'image avec l'ID ${imageId} n'existe pas`);
      }
      
      const oldImageData = imageSnap.data();
      
      // Si la catégorie a changé, mettre à jour les compteurs
      if (updates.category && updates.category !== oldImageData.category) {
        await this.incrementCategoryCount(oldImageData.category, -1);
        await this.incrementCategoryCount(updates.category, 1);
      }
      
      // Si le véhicule a changé, mettre à jour les associations
      if (updates.vehicleId !== undefined && updates.vehicleId !== oldImageData.vehicleId) {
        if (oldImageData.vehicleId) {
          await this.removeImageFromVehicle(imageId, oldImageData.vehicleId);
        }
        if (updates.vehicleId) {
          await this.addImageToVehicle(imageId, updates.vehicleId);
        }
      }
      
      // Ajouter la date de mise à jour
      const updatedData = {
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      // Mettre à jour Firestore
      await updateDoc(imageRef, updatedData);
      
      return {
        id: imageId,
        ...oldImageData,
        ...updatedData
      };
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'image ${imageId}:`, error);
      throw error;
    }
  },
  
  // Supprimer une image
  deleteImage: async function(imageId) {
    try {
      // Récupérer l'image pour obtenir son URL et sa catégorie
      const image = await this.getImageById(imageId);
      
      if (!image) {
        throw new Error(`L'image avec l'ID ${imageId} n'existe pas`);
      }
      
      // Si l'image est associée à un véhicule, mettre à jour le véhicule
      if (image.vehicleId) {
        await this.removeImageFromVehicle(imageId, image.vehicleId);
      }
      
      // Mettre à jour le compteur de catégorie
      await this.incrementCategoryCount(image.category, -1);
      
      // Supprimer l'image de Firebase Storage si l'URL contient storage.googleapis.com
      if (image.src && image.src.includes('storage.googleapis.com')) {
        try {
          // Extraire le chemin du fichier de l'URL
          const url = new URL(image.src);
          const pathName = url.pathname.split('/o/')[1];
          if (pathName) {
            const decodedPath = decodeURIComponent(pathName);
            const fileRef = ref(storage, decodedPath);
            await deleteObject(fileRef);
          }
        } catch (storageError) {
          console.warn("Erreur lors de la suppression du fichier dans Storage:", storageError);
          // Continuer même en cas d'erreur
        }
      }
      
      // Supprimer l'image de Firestore
      await deleteDoc(doc(db, this.collections.IMAGES, imageId));
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'image ${imageId}:`, error);
      throw error;
    }
  },
  
  // =============== GESTION DES CATÉGORIES ===============
  
  // Récupérer toutes les catégories
  getAllCategories: async function() {
    try {
      const categoriesQuery = await getDocs(collection(db, this.collections.CATEGORIES));
      return categoriesQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return [];
    }
  },
  
  // Incrémenter ou décrémenter le compteur d'une catégorie
  incrementCategoryCount: async function(categoryId, delta = 1) {
    try {
      // Trouver le document de la catégorie
      const categoriesQuery = query(
        collection(db, this.collections.CATEGORIES),
        where('id', '==', categoryId)
      );
      
      const querySnapshot = await getDocs(categoriesQuery);
      
      if (querySnapshot.empty) {
        console.warn(`Aucune catégorie trouvée avec l'ID: ${categoryId}`);
        return false;
      }
      
      // Obtenir le premier document correspondant
      const categoryDoc = querySnapshot.docs[0];
      const currentCount = categoryDoc.data().count || 0;
      
      // Mettre à jour le compteur (ne pas laisser devenir négatif)
      const newCount = Math.max(0, currentCount + delta);
      
      // Mettre à jour Firestore
      await updateDoc(categoryDoc.ref, { count: newCount });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du compteur de la catégorie ${categoryId}:`, error);
      return false;
    }
  },
  
  // =============== GESTION DES ASSOCIATIONS ===============
  
  // Ajouter une image à un véhicule
  addImageToVehicle: async function(imageId, vehicleId) {
    try {
      // Récupérer le véhicule
      const vehicle = await this.getVehicleById(vehicleId);
      
      if (!vehicle) {
        throw new Error(`Le véhicule avec l'ID ${vehicleId} n'existe pas`);
      }
      
      // Préparer le tableau d'images s'il n'existe pas
      const images = vehicle.images || [];
      
      // Ne pas ajouter si l'image existe déjà
      if (images.includes(imageId)) {
        return true;
      }
      
      // Ajouter l'imageId au tableau
      images.push(imageId);
      
      // Mettre à jour le véhicule
      await updateDoc(doc(db, this.collections.VEHICLES, vehicleId), { 
        images: images,
        lastUpdated: new Date().toISOString()
      });
      
      // Mettre à jour l'image avec les infos du véhicule
      await updateDoc(doc(db, this.collections.IMAGES, imageId), {
        vehicleId: vehicleId,
        vehicleName: `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`,
        lastUpdated: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'ajout de l'image ${imageId} au véhicule ${vehicleId}:`, error);
      throw error;
    }
  },
  
  // Supprimer une image d'un véhicule
  removeImageFromVehicle: async function(imageId, vehicleId) {
    try {
      // Récupérer le véhicule
      const vehicle = await this.getVehicleById(vehicleId);
      
      if (!vehicle || !vehicle.images) {
        return true; // Si le véhicule n'existe pas ou n'a pas d'images, considérer comme réussi
      }
      
      // Filtrer l'imageId du tableau
      const updatedImages = vehicle.images.filter(id => id !== imageId);
      
      // Mettre à jour le véhicule
      await updateDoc(doc(db, this.collections.VEHICLES, vehicleId), { 
        images: updatedImages,
        lastUpdated: new Date().toISOString()
      });
      
      // Mettre à jour l'image pour supprimer l'association
      await updateDoc(doc(db, this.collections.IMAGES, imageId), {
        vehicleId: null,
        vehicleName: '',
        lastUpdated: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'image ${imageId} du véhicule ${vehicleId}:`, error);
      throw error;
    }
  },
  
  // =============== GESTION DES RÉSERVATIONS ===============
  
  // Ajouter une demande de réservation
  addReservation: async function(reservationData) {
    try {
      // Préparer les données
      const newReservation = {
        ...reservationData,
        status: 'pending', // En attente par défaut
        dateCreated: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      // Ajouter à Firestore
      const docRef = await addDoc(collection(db, this.collections.RESERVATIONS), newReservation);
      
      return {
        id: docRef.id,
        ...newReservation
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réservation:', error);
      throw error;
    }
  },
  
  // =============== GESTION DES CONTACTS ===============
  
  // Ajouter un message de contact
  addContactMessage: async function(messageData) {
    try {
      // Préparer les données
      const newMessage = {
        ...messageData,
        status: 'unread', // Non lu par défaut
        dateCreated: new Date().toISOString()
      };
      
      // Ajouter à Firestore
      const docRef = await addDoc(collection(db, this.collections.CONTACTS), newMessage);
      
      return {
        id: docRef.id,
        ...newMessage
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout du message de contact:', error);
      throw error;
    }
  },
  
  // =============== UTILITAIRES ===============
  
  // Formatter la taille de fichier
  formatFileSize: function(bytes) {
    if (bytes === undefined || bytes === null) return 'Inconnu';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },
  
  // Migration des données du localStorage vers Firebase
  migrateFromLocalStorage: async function() {
    try {
      // Récupérer les données du localStorage
      const vehicles = JSON.parse(localStorage.getItem('autosenegal_vehicles') || '[]');
      const images = JSON.parse(localStorage.getItem('autosenegal_images') || '[]');
      
      console.log(`Migration: ${vehicles.length} véhicules et ${images.length} images trouvés dans localStorage`);
      
      // Importer les images d'abord
      const imageIdMap = {}; // Map pour convertir les anciens IDs en nouveaux IDs
      
      for (const image of images) {
        try {
          // Créer l'image dans Firebase
          const newImage = await addDoc(collection(db, this.collections.IMAGES), {
            ...image,
            lastUpdated: new Date().toISOString()
          });
          
          // Mettre à jour le compteur de catégorie
          await this.incrementCategoryCount(image.category);
          
          // Stocker la correspondance d'ID
          imageIdMap[image.id] = newImage.id;
          
          console.log(`Image migrée: ${image.id} -> ${newImage.id}`);
        } catch (imgError) {
          console.error(`Erreur lors de la migration de l'image ${image.id}:`, imgError);
        }
      }
      
      // Importer les véhicules
      for (const vehicle of vehicles) {
        try {
          // Mettre à jour les IDs d'images
          const newImages = [];
          
          if (vehicle.images && vehicle.images.length > 0) {
            for (const oldImageId of vehicle.images) {
              if (imageIdMap[oldImageId]) {
                newImages.push(imageIdMap[oldImageId]);
              }
            }
          }
          
          // Créer le véhicule dans Firebase
          const newVehicle = await addDoc(collection(db, this.collections.VEHICLES), {
            ...vehicle,
            images: newImages,
            lastUpdated: new Date().toISOString()
          });
          
          console.log(`Véhicule migré: ${vehicle.id} -> ${newVehicle.id}`);
          
          // Mettre à jour les associations d'images
          for (const newImageId of newImages) {
            try {
              const imgRef = doc(db, this.collections.IMAGES, newImageId);
              await updateDoc(imgRef, {
                vehicleId: newVehicle.id,
                vehicleName: `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`,
                lastUpdated: new Date().toISOString()
              });
            } catch (assocError) {
              console.warn(`Erreur lors de la mise à jour de l'association pour l'image ${newImageId}:`, assocError);
            }
          }
        } catch (vehError) {
          console.error(`Erreur lors de la migration du véhicule ${vehicle.id}:`, vehError);
        }
      }
      
      console.log('Migration terminée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la migration des données:', error);
      return false;
    }
  }
};

export default DataService;
