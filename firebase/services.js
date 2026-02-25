// src/firebase/services.js
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  setDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

// ==================== CREATE ====================

/**
 * Add a new document with auto-generated ID
 * @param {string} collectionName - Name of the collection
 * @param {object} data - Data to add
 * @returns {Promise<string>} - Document ID
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Document added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

/**
 * Set a document with a specific ID (creates or overwrites)
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @param {object} data - Data to set
 * @returns {Promise<void>}
 */
export const setDocument = async (collectionName, documentId, data) => {
  try {
    await setDoc(doc(db, collectionName, documentId), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Document set with ID:', documentId);
  } catch (error) {
    console.error('Error setting document:', error);
    throw error;
  }
};

// ==================== READ ====================

/**
 * Get a single document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @returns {Promise<object|null>} - Document data or null
 */
export const getDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Array>} - Array of documents
 */
export const getAllDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    return documents;
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

/**
 * Query documents with conditions
 * @param {string} collectionName - Name of the collection
 * @param {Array} conditions - Array of where conditions [field, operator, value]
 * @param {string} orderByField - Field to order by (optional)
 * @param {number} limitCount - Limit number of results (optional)
 * @returns {Promise<Array>} - Array of documents
 */
export const queryDocuments = async (collectionName, conditions = [], orderByField = null, limitCount = null) => {
  try {
    let q = collection(db, collectionName);
    
    // Apply where conditions
    const constraints = [];
    conditions.forEach(([field, operator, value]) => {
      constraints.push(where(field, operator, value));
    });
    
    // Apply orderBy
    if (orderByField) {
      constraints.push(orderBy(orderByField));
    }
    
    // Apply limit
    if (limitCount) {
      constraints.push(limit(limitCount));
    }
    
    q = query(q, ...constraints);
    
    const querySnapshot = await getDocs(q);
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    return documents;
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
};

// ==================== UPDATE ====================

/**
 * Update a document
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @param {object} data - Data to update
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, documentId, data) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log('Document updated:', documentId);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// ==================== DELETE ====================

/**
 * Delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, documentId) => {
  try {
    await deleteDoc(doc(db, collectionName, documentId));
    console.log('Document deleted:', documentId);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const deleteAYData = async (sector, academicYear) => {
  const q = query(collection(db, sector), where("academicYear", "==", academicYear));
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  querySnapshot.forEach((docSnap) => {
    batch.delete(doc(db, sector, docSnap.id));
  });
  return await batch.commit();
};

// ==================== REAL-TIME LISTENERS ====================

/**
 * Listen to a single document in real-time
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @param {function} callback - Callback function to handle updates
 * @returns {function} - Unsubscribe function
 */
export const listenToDocument = (collectionName, documentId, callback) => {
  const docRef = doc(db, collectionName, documentId);
  
  const unsubscribe = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to document:', error);
  });
  
  return unsubscribe;
};

/**
 * Listen to a collection in real-time
 * @param {string} collectionName - Name of the collection
 * @param {function} callback - Callback function to handle updates
 * @param {Array} conditions - Array of where conditions (optional)
 * @returns {function} - Unsubscribe function
 */
export const listenToCollection = (collectionName, callback, conditions = []) => {
  let q = collection(db, collectionName);
  
  if (conditions.length > 0) {
    const constraints = conditions.map(([field, operator, value]) => 
      where(field, operator, value)
    );
    q = query(q, ...constraints);
  }
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    callback(documents);
  }, (error) => {
    console.error('Error listening to collection:', error);
  });
  
  return unsubscribe;
};