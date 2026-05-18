import { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Permission definitions
export const Permission = {
  // Chat permissions
  CHAT_ACCESS: 'chat:access',

  // Data distribution permissions
  DATA_VIEW_VISUALS: 'data:view:visuals',
  DATA_VIEW_DATASETS: 'data:view:datasets',
  DATA_IMPORT: 'data:import',
  DATA_DELETE: 'data:delete',
  DATA_MODIFY: 'data:modify',

  // Event permissions
  EVENT_VIEW_OWN: 'event:view:own',
  EVENT_VIEW_ALL: 'event:view:all',
  EVENT_VIEW_SUBMITTED: 'event:view:submitted', // New: View only submitted events
  EVENT_CREATE: 'event:create',
  EVENT_EDIT_OWN: 'event:edit:own',
  EVENT_EDIT_ALL: 'event:edit:all',
  EVENT_DELETE_OWN: 'event:delete:own',
  EVENT_DELETE_ALL: 'event:delete:all',
  EVENT_SUBMIT: 'event:submit', // New: Submit drafts for admin review
  EVENT_WITHDRAW: 'event:withdraw', // New: Withdraw submitted events back to draft

  // User management permissions
  USER_MANAGEMENT: 'user:management',
  USER_CREATE: 'user:create',
  USER_ASSIGN_ROLE: 'user:assign:role',
};

// Role permission mapping
const ROLE_PERMISSIONS = {
  USER: [
    Permission.CHAT_ACCESS,
    Permission.DATA_VIEW_VISUALS,
    Permission.EVENT_VIEW_OWN,
    Permission.EVENT_CREATE,
    Permission.EVENT_EDIT_OWN,
    Permission.EVENT_DELETE_OWN,
  ],
  SECRETARIAT: [
    Permission.CHAT_ACCESS,
    Permission.DATA_VIEW_VISUALS,
    Permission.DATA_VIEW_DATASETS,
    Permission.DATA_IMPORT,
    Permission.DATA_DELETE,
    Permission.DATA_MODIFY,
    Permission.EVENT_VIEW_ALL, // Can see all their own events (draft + submitted)
    Permission.EVENT_CREATE,
    Permission.EVENT_EDIT_ALL,
    Permission.EVENT_DELETE_ALL,
    Permission.EVENT_SUBMIT, // Can submit drafts
    Permission.EVENT_WITHDRAW, // Can withdraw submitted events
  ],
  ADMIN: [
    Permission.CHAT_ACCESS,
    Permission.DATA_VIEW_VISUALS,
    Permission.DATA_VIEW_DATASETS,
    Permission.DATA_IMPORT,
    Permission.DATA_DELETE,
    Permission.DATA_MODIFY,
    Permission.EVENT_VIEW_SUBMITTED, // Only see submitted events from secretariat
    Permission.EVENT_VIEW_ALL, // Can see all events (including their own drafts)
    Permission.EVENT_CREATE,
    Permission.EVENT_EDIT_ALL,
    Permission.EVENT_DELETE_ALL,
    Permission.USER_MANAGEMENT,
    Permission.USER_CREATE,
    Permission.USER_ASSIGN_ROLE,
  ],
};

const RoleContext = createContext(null);

export function RoleProvider({ children, user }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState('Active');

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      setUserStatus('Active');
      return;
    }

    setLoading(true);

    // Set up real-time listener for user document
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          console.log('🔍 Current user role data:', {
            uid: user.uid,
            email: user.email,
            rawRole: userData.role,
            roleType: typeof userData.role,
            allUserData: userData
          });
          setRole(userData.role || 'SECRETARIAT');
          setUserStatus(userData.status || 'Active');

          // Update last login timestamp ONLY if it's been more than 1 minute
          const lastLogin = userData.lastLogin ? new Date(userData.lastLogin).getTime() : 0;
          const now = Date.now();
          const oneMinute = 60 * 1000;

          if (now - lastLogin > oneMinute) {
            try {
              await setDoc(userDocRef, {
                lastLogin: new Date().toISOString(),
              }, { merge: true });
            } catch (err) {
              console.warn('Could not update lastLogin:', err);
            }
          }
        } else {
          // User document doesn't exist - create default SECRETARIAT role
          const defaultUserData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'SECRETARIAT', // Default to SECRETARIAT instead of USER
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: null,
            lastLogin: new Date().toISOString(),
          };

          try {
            await setDoc(userDocRef, defaultUserData);
            setRole('SECRETARIAT');
            setUserStatus('Active');
          } catch (err) {
            console.error('Error creating user document:', err);
            setRole('SECRETARIAT'); // Fallback to SECRETARIAT role
            setUserStatus('Active');
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user document:', error);
        setRole('SECRETARIAT'); // Fallback to SECRETARIAT role on error
        setUserStatus('Active');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
  };

  // Check if user can access a specific page
  const canAccessPage = (page) => {
    if (!role) return false;

    const pagePermissions = {
      chat: Permission.CHAT_ACCESS,
      data: Permission.DATA_VIEW_VISUALS,
      events: Permission.EVENT_VIEW_OWN,
      users: Permission.USER_MANAGEMENT,
    };

    return hasPermission(pagePermissions[page]);
  };

  // Check if user can modify a specific event
  const canModifyEvent = (eventCreatorId) => {
    if (!role || !user) return false;

    // SECRETARIAT and ADMIN can modify any event
    if (role === 'SECRETARIAT' || role === 'ADMIN') {
      return true;
    }

    // USER can only modify their own events
    if (role === 'USER') {
      return user.uid === eventCreatorId;
    }

    return false;
  };

  // Check if user can delete a specific event
  const canDeleteEvent = (eventCreatorId) => {
    return canModifyEvent(eventCreatorId); // Same logic as modify
  };

  // Filter events based on role
  const filterEventsByRole = (events) => {
    if (!role || !user) return [];

    // ADMIN sees:
    // - All submitted events from secretariat (or events without submissionStatus - backward compatibility)
    // - All their own events (draft + submitted)
    if (role === 'ADMIN') {
      return events.filter(event => {
        // Treat events without submissionStatus as submitted (backward compatibility)
        const isSubmitted = event.submissionStatus === 'submitted' || !event.submissionStatus;

        // Show submitted events from others
        if (isSubmitted && event.createdBy !== user.uid) {
          return true;
        }
        // Show all own events
        if (event.createdBy === user.uid) {
          return true;
        }
        return false;
      });
    }

    // SECRETARIAT sees all their own events (draft + submitted)
    if (role === 'SECRETARIAT') {
      return events.filter(event => event.createdBy === user.uid);
    }

    // USER sees only their own events
    if (role === 'USER') {
      return events.filter(event => event.createdBy === user.uid);
    }

    return [];
  };

  // Check if user can submit/withdraw events
  const canSubmitEvent = (eventCreatorId) => {
    if (!role || !user) return false;
    return (role === 'SECRETARIAT' || role === 'ADMIN') && user.uid === eventCreatorId;
  };

  const value = {
    role,
    loading,
    userStatus,
    hasPermission,
    canAccessPage,
    canModifyEvent,
    canDeleteEvent,
    canSubmitEvent,
    filterEventsByRole,
    isActive: userStatus === 'Active',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === null) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
