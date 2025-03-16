// Configuration Firebase pour Ndiambour Location
// Fichier à inclure dans toutes les pages nécessitant Firebase

// Importation des modules Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCxq7iouliSVqm1hgGENnFK2UGxoY2MAh8",
  authDomain: "ndiambourloc.firebaseapp.com",
  projectId: "ndiambourloc",
  storageBucket: "ndiambourloc.appspot.com",
  messagingSenderId: "1056814375018",
  appId: "1:1056814375018:web:75f449cb0765fcfd9a6a13",
  measurementId: "G-YD84XNTKEG"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Exporter les modules Firebase pour utilisation
export {
  app,
  auth,
  db,
  storage,
  analytics,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

// Authentification simplifiée
export const FirebaseAuth = {
  // Connexion avec email et mot de passe
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Déconnexion
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Vérifier l'état de l'authentification
  checkAuthState: (callback) => {
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  }
};

// Vérifier l'authentification et rediriger si nécessaire
export const checkAdminAuth = () => {
  onAuthStateChanged(auth, (user) => {
    if (!user && window.location.pathname.includes('admin')) {
      window.location.href = 'admin-login.html';
    }
  });
};
