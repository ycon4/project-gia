// src/firebase/services.js
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc,
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  setDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
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
  const colRef = collection(db, collectionName);
  const q = query(colRef); 
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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
    
    const constraints = [];
    conditions.forEach(([field, operator, value]) => {
      constraints.push(where(field, operator, value));
    });
    
    if (orderByField) {
      constraints.push(orderBy(orderByField));
    }
    
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
  if (!documentId || typeof documentId !== 'string') {
    console.error("❌ UPDATE FAILED: documentId is missing or invalid!", documentId);
    throw new Error("Invalid Document ID");
  }

  try {
    const docRef = doc(db, collectionName, documentId);
    const { id, ...dataToUpdate } = data; // Remove 'id' from the update payload
    
    await updateDoc(docRef, {
      ...dataToUpdate,
      updatedAt: new Date().toISOString()
    });

    console.log('Document updated successfully:', documentId);
  } catch (error) {
    
    if (error.code === 'not-found') {
      console.error("Document does not exist in Firestore. Check your ID!")
    }
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
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
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

// Save a new event to Firestore
export const saveEvent = async (eventData) => {
  try {
    const docRef = await addDoc(collection(db, 'events'), {
      ...eventData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...eventData };
  } catch (error) {
    console.error("Error adding event: ", error);
    throw error;
  }
};

// Delete an event AND its associated attendance records from Firestore
export const removeEvent = async (eventId) => {
  try {
    const batch = writeBatch(db);

    // 1. Reference the event document and add to batch delete
    const eventRef = doc(db, 'events', eventId);
    batch.delete(eventRef);

    // 2. Find all attendance records linked to this event
    const attendanceRef = collection(db, 'attendance');
    const q = query(attendanceRef, where("eventId", "==", eventId));
    const querySnapshot = await getDocs(q);

    // 3. Add each attendance record to the batch delete
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    // 4. Commit all deletions at once
    await batch.commit();
    console.log(`Event ${eventId} and associated attendance records deleted.`);
  } catch (error) {
    console.error("Error deleting event and records: ", error);
    throw error;
  }
};

/**
 * Add a new session to an existing event
 * @param {string} eventId - The ID of the event
 * @param {string} sessionName - The name of the new session (e.g., "Day 3")
 */
export const addEventSession = async (eventId, sessionName) => {
  try {
    const cleanId = String(eventId);
    const eventRef = doc(db, 'events', eventId);
    
    await updateDoc(eventRef, {
      sessions: arrayUnion(sessionName),
      updatedAt: serverTimestamp()
    });
    console.log(`Session ${sessionName} added successfully!`);
  } catch (error) {
    console.error("Error adding session: ", error.code, error.message);
    throw error;
  }
};


