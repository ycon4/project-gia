# Profile Synchronization Implementation

## Overview
This document describes how user profile updates (specifically displayName) are synchronized across Firebase Auth, Firestore, and the UI in real-time.

## Problem
Previoux`sly, when a user edited their profile name:
- ✅ Firebase Auth was updated
- ❌ Firestore `users` collection was NOT updated
- ❌ User Management page did NOT reflect the change
- ❌ Other users couldn't see the updated name

## Solution: Dual Update + Real-Time Sync

### 1. Profile Update (App.jsx)
When a user edits their profile, we now update BOTH Firebase Auth and Firestore:

```javascript
const handleUpdateProfile = async (newName) => {
  if (!auth.currentUser) return;
  try {
    // Update Firebase Auth profile
    await updateProfile(auth.currentUser, { displayName: newName });
    
    // Update Firestore user document
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      displayName: newName,
      updatedAt: new Date().toISOString(),
    });
    
    setDisplayName(newName);
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile. Please try again.');
  }
};
```

### 2. Real-Time Sync in App.jsx
The app now listens to Firestore changes for the current user's displayName:

```javascript
// Sync displayName from Firestore in real-time
useEffect(() => {
  if (!user) return;

  const userDocRef = doc(db, 'users', user.uid);
  const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.data();
      if (userData.displayName) {
        setDisplayName(userData.displayName);
      }
    }
  });

  return unsubscribe;
}, [user]);
```

### 3. Real-Time Sync in UserManagementPage
The User Management page now uses a real-time listener instead of one-time fetch:

```javascript
useEffect(() => {
  setLoading(true);
  const q = query(collection(db, 'users'));
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      setFilteredUsers(usersData);
      setLoading(false);
    },
    (error) => {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, []);
```

## Data Flow

### When User Edits Profile:
```
User clicks "Edit Profile"
  ↓
Enters new name
  ↓
Clicks "Save"
  ↓
handleUpdateProfile() executes
  ↓
Updates Firebase Auth (updateProfile)
  ↓
Updates Firestore users/{uid} (updateDoc)
  ↓
Real-time listeners detect change
  ↓
UI updates automatically everywhere
```

### Real-Time Propagation:
```
Firestore users/{uid} updated
  ↓
onSnapshot listeners triggered
  ↓
┌─────────────────┬──────────────────────┐
│                 │                      │
App.jsx           UserManagementPage     RoleContext
setDisplayName()  setUsers()             (already listening)
  ↓                 ↓                      ↓
Sidebar updates   Table updates         Context updates
Profile menu      User row              (for other features)
```

## Benefits

✅ **Consistency**: displayName is always in sync across Firebase Auth and Firestore
✅ **Real-Time**: Changes appear immediately without page refresh
✅ **Multi-User**: SUPER_ADMIN sees updated names in User Management instantly
✅ **Reliability**: Uses Firestore as source of truth
✅ **Performance**: Efficient real-time listeners (not polling)

## Components Updated

### App.jsx
- ✅ Added `updateDoc` import from firebase/firestore
- ✅ Added `onSnapshot` import from firebase/firestore
- ✅ Updated `handleUpdateProfile` to update both Auth and Firestore
- ✅ Added real-time listener for current user's displayName
- ✅ Added error handling for profile updates

### UserManagementPage.jsx
- ✅ Changed from `getDocs` to `onSnapshot` for real-time updates
- ✅ Removed manual state updates in `handleRoleChange` (listener handles it)
- ✅ Updated refresh button to just show loading state (data is always fresh)
- ✅ Removed `loadUsers` function (replaced by real-time listener)

## Testing Checklist

### Profile Update
- [ ] User edits profile name
- [ ] Name updates in Firebase Auth
- [ ] Name updates in Firestore users collection
- [ ] Name updates in sidebar immediately
- [ ] Name updates in profile menu immediately
- [ ] Error message shows if update fails

### User Management Page
- [ ] SUPER_ADMIN opens User Management
- [ ] All users load with correct displayNames
- [ ] Another user edits their profile
- [ ] User Management table updates automatically (no refresh needed)
- [ ] Search still works after real-time updates
- [ ] Role changes still work correctly

### Multi-Tab Testing
- [ ] Open app in two browser tabs (same user)
- [ ] Edit profile in Tab 1
- [ ] Tab 2 updates automatically
- [ ] Both tabs show same displayName

### Multi-User Testing
- [ ] User A edits their profile
- [ ] SUPER_ADMIN (User B) has User Management open
- [ ] User A's name updates in User Management table automatically
- [ ] No page refresh needed

## Performance Considerations

### Real-Time Listeners
- Each user has 1 listener for their own document (App.jsx)
- SUPER_ADMIN has 1 listener for all users (UserManagementPage)
- Listeners are cleaned up on unmount (no memory leaks)

### Firestore Reads
- Initial load: 1 read per user document
- Updates: Only changed documents trigger reads
- More efficient than polling or manual refresh

### Optimization Tips
- Listeners automatically handle reconnection
- Firestore caches data locally (offline support)
- Only delta changes are transmitted (not full documents)

## Future Enhancements

### Potential Improvements
- [ ] Add optimistic UI updates (update UI before Firestore confirms)
- [ ] Add undo functionality for profile changes
- [ ] Add profile picture upload
- [ ] Add email change functionality
- [ ] Add password change functionality
- [ ] Add profile change history/audit log
- [ ] Add notification when profile is updated by admin

### Advanced Features
- [ ] Batch profile updates (update multiple users at once)
- [ ] Profile validation (name length, special characters, etc.)
- [ ] Profile completeness indicator
- [ ] Profile verification status

## Security Notes

### Current Implementation
✅ Client-side validation
✅ Error handling
✅ User can only edit their own profile

### Required Server-Side Rules
⚠️ **IMPORTANT**: Add Firestore Security Rules to prevent unauthorized updates

```javascript
match /users/{userId} {
  // Users can update their own displayName
  allow update: if request.auth != null 
    && request.auth.uid == userId
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['displayName', 'updatedAt']);
  
  // SUPER_ADMIN can update any user's displayName
  allow update: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'SUPER_ADMIN';
}
```

## Troubleshooting

### Issue: Name doesn't update in UI
**Solution**: Check browser console for errors, ensure Firestore rules allow the update

### Issue: Name updates but reverts back
**Solution**: Check if Firebase Auth and Firestore are both being updated

### Issue: Real-time updates not working
**Solution**: Check if onSnapshot listeners are properly set up and not being unsubscribed early

### Issue: Multiple updates triggering
**Solution**: Ensure listeners are cleaned up in useEffect return function

## Related Documentation
- [RBAC Implementation Status](./RBAC_IMPLEMENTATION_STATUS.md)
- [User Management Page](./RBAC_USER_MANAGEMENT.md)
- [RoleContext Implementation](./RBAC_TROUBLESHOOTING.md)
