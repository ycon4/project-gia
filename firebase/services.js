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
  try {
    console.log(`📥 Fetching all documents from: ${collectionName}`);
    const colRef = collection(db, collectionName);
    const q = query(colRef);
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`✅ Fetched ${docs.length} documents from ${collectionName}`);
    return docs;
  } catch (error) {
    console.error(`❌ Error fetching ${collectionName}:`, error.code, error.message);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

/**
 * Get paginated documents from a collection
 * @param {string} collectionName - Name of the collection
 * @param {number} pageSize - Number of documents per page (default: 50)
 * @param {object} lastDoc - Last document from previous page (for pagination)
 * @param {string} orderByField - Field to order by (default: 'createdAt')
 * @returns {Promise<{docs: Array, lastDoc: object, hasMore: boolean}>}
 */
export const getPaginatedDocuments = async (collectionName, pageSize = 50, lastDoc = null, orderByField = 'createdAt') => {
  try {
    console.log(`📥 Fetching paginated documents from: ${collectionName} (page size: ${pageSize})`);
    const colRef = collection(db, collectionName);

    let q;
    if (lastDoc) {
      q = query(colRef, orderBy(orderByField), limit(pageSize + 1));
    } else {
      q = query(colRef, orderBy(orderByField), limit(pageSize + 1));
    }

    const querySnapshot = await getDocs(q);
    const docs = [];
    let newLastDoc = null;
    let hasMore = false;

    querySnapshot.docs.forEach((doc, index) => {
      if (index < pageSize) {
        docs.push({ id: doc.id, ...doc.data() });
        newLastDoc = doc;
      } else {
        hasMore = true;
      }
    });

    console.log(`✅ Fetched ${docs.length} documents from ${collectionName}, hasMore: ${hasMore}`);
    return { docs, lastDoc: newLastDoc, hasMore };
  } catch (error) {
    console.error(`❌ Error fetching paginated ${collectionName}:`, error.code, error.message);
    return { docs: [], lastDoc: null, hasMore: false };
  }
};

/**
 * Get document count from a collection using aggregation
 * @param {string} collectionName - Name of the collection
 * @param {Array} conditions - Array of where conditions (optional)
 * @returns {Promise<number>} - Count of documents
 */
export const getDocumentCount = async (collectionName, conditions = []) => {
  try {
    console.log(`🔢 Counting documents in: ${collectionName}`);
    let q = collection(db, collectionName);

    if (conditions.length > 0) {
      const constraints = conditions.map(([field, operator, value]) =>
        where(field, operator, value)
      );
      q = query(q, ...constraints);
    }

    const querySnapshot = await getDocs(q);
    const count = querySnapshot.size;
    console.log(`✅ Count for ${collectionName}: ${count}`);
    return count;
  } catch (error) {
    console.error(`❌ Error counting ${collectionName}:`, error.code, error.message);
    return 0;
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
export const saveEvent = async (eventData, userId, userName) => {
  try {
    const docRef = await addDoc(collection(db, 'events'), {
      ...eventData,
      createdBy: userId,
      createdByName: userName,
      createdAt: serverTimestamp(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...eventData, createdBy: userId, createdByName: userName };
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

// ==================== USER MANAGEMENT (RBAC) ====================

/**
 * Get user by UID
 * @param {string} uid - User ID
 * @returns {Promise<object|null>} - User data or null
 */
export const getUserByUid = async (uid) => {
  return await getDocument('users', uid);
};

/**
 * Get all users (ADMIN only)
 * @returns {Promise<Array>} - Array of users
 */
export const getAllUsers = async () => {
  return await getAllDocuments('users');
};

/**
 * Update user role (ADMIN only)
 * @param {string} uid - User ID
 * @param {string} newRole - New role (SECRETARIAT or ADMIN)
 * @returns {Promise<void>}
 */
export const updateUserRole = async (uid, newRole) => {
  if (!['SECRETARIAT', 'ADMIN'].includes(newRole)) {
    throw new Error('Can only assign SECRETARIAT or ADMIN roles');
  }

  await updateDoc(doc(db, 'users', uid), {
    role: newRole,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Update user status (ADMIN only)
 * @param {string} uid - User ID
 * @param {string} status - Status (Active or Inactive)
 * @returns {Promise<void>}
 */
export const updateUserStatus = async (uid, status) => {
  if (!['Active', 'Inactive'].includes(status)) {
    throw new Error('Status must be Active or Inactive');
  }

  await updateDoc(doc(db, 'users', uid), {
    status: status,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Create a new user document (called after Firebase Auth user creation)
 * @param {string} uid - Firebase Auth UID
 * @param {object} userData - User data
 * @returns {Promise<void>}
 */
export const createUserDocument = async (uid, userData) => {
  await setDoc(doc(db, 'users', uid), {
    uid,
    email: userData.email,
    displayName: userData.displayName || userData.email?.split('@')[0] || 'User',
    role: userData.role || 'USER',
    employeeId: userData.employeeId || null,
    department: userData.department || null,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userData.createdBy || null,
    lastLogin: null,
  });
};

/**
 * Batch create user documents in Firestore
 * @param {Array} users - Array of user objects with uid, email, displayName, role
 * @param {string} createdBy - UID of the ADMIN creating the accounts
 * @returns {Promise<{successful: Array, failed: Array}>}
 */
export const batchCreateUserDocuments = async (users, createdBy) => {
  const successful = [];
  const failed = [];

  for (const user of users) {
    try {
      await createUserDocument(user.uid, {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdBy,
      });
      successful.push(user);
    } catch (error) {
      failed.push({
        ...user,
        error: error.message,
      });
    }
  }

  return { successful, failed };
};


