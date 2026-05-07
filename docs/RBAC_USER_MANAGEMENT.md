# User Management Page - RBAC Implementation

## Overview
The User Management page allows SUPER_ADMIN users to view all registered users and assign roles (USER, ADMIN, SUPER_ADMIN) to them.

## Access Control
- **Visibility**: Only SUPER_ADMIN can see the "Users" navigation item in the sidebar
- **Permission Required**: `USER_MANAGEMENT`, `USER_ASSIGN_ROLE`
- **Route**: Accessed via `activeSection === 'users'`

## Features

### 1. User List Display
- Shows all users from the `users` collection in Firestore
- Displays user information:
  - Avatar (first letter of name/email)
  - Display name
  - Email address
  - Current role (with icon)
  - Status (Active/Inactive)
  - Last login date

### 2. Search Functionality
- Real-time search across:
  - Email addresses
  - Display names
  - User IDs (UIDs)
- Case-insensitive matching
- Instant filtering as you type

### 3. Statistics Dashboard
- **Total Users**: Count of all users in the system
- **Super Admins**: Count of users with SUPER_ADMIN role
- **Admins**: Count of users with ADMIN role
- **Users**: Count of users with USER role (or no role)

### 4. Role Assignment
- Three role buttons per user: USER, ADMIN, SUPER_ADMIN
- Current role is highlighted in purple (gia-600)
- Other roles are clickable to change
- Confirmation dialog before role change
- Updates Firestore immediately
- Updates local state for instant UI feedback

### 5. Visual Indicators
- **Role Icons**:
  - SUPER_ADMIN: ShieldCheck (purple)
  - ADMIN: Shield (blue)
  - USER: User (gray)
- **Role Badges**: Color-coded pills matching the role
- **Status Badges**: Green for Active, Red for Inactive
- **Loading States**: Spinner during data fetch and role updates

## Technical Implementation

### Data Loading
```javascript
// Load all users from Firestore on mount
useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  const q = query(collection(db, 'users'));
  const snapshot = await getDocs(q);
  const usersData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  setUsers(usersData);
};
```

### Role Assignment
```javascript
const handleRoleChange = async (userId, newRole) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
  
  // Update local state for instant UI feedback
  setUsers(prev =>
    prev.map(user =>
      user.id === userId
        ? { ...user, role: newRole }
        : user
    )
  );
};
```

### Search Implementation
```javascript
useEffect(() => {
  if (!searchTerm.trim()) {
    setFilteredUsers(users);
  } else {
    const term = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(user =>
        user.email?.toLowerCase().includes(term) ||
        user.displayName?.toLowerCase().includes(term) ||
        user.uid?.toLowerCase().includes(term)
      )
    );
  }
}, [searchTerm, users]);
```

## UI Components

### Table Structure
- **Header**: Gradient purple background (gia-600 to gia-700)
- **Columns**:
  1. User (avatar + name + email)
  2. Current Role (icon + badge)
  3. Status (Active/Inactive badge)
  4. Last Login (formatted date)
  5. Assign Role (3 action buttons)
- **Hover Effect**: Row highlights on hover
- **Responsive**: Horizontal scroll on small screens

### Empty States
- **No Users**: Shows UserCog icon with message
- **No Search Results**: Shows message with search term
- **Loading**: Shows centered spinner

## Security Considerations

### Client-Side Protection
✅ Navigation item only visible to SUPER_ADMIN
✅ Permission checks using `hasPermission(Permission.USER_MANAGEMENT)`
✅ Confirmation dialog before role changes

### Server-Side Protection (TODO)
⚠️ **CRITICAL**: Firestore Security Rules must be implemented to prevent unauthorized role changes
⚠️ Client-side checks are for UX only, not security

### Recommended Firestore Rules
```javascript
match /users/{userId} {
  // Only SUPER_ADMIN can update user roles
  allow update: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'SUPER_ADMIN'
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['role', 'updatedAt']);
  
  // SUPER_ADMIN can read all users
  allow read: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'SUPER_ADMIN';
}
```

## User Flow

1. **SUPER_ADMIN logs in**
   - Sees "Users" item in sidebar
   - Clicks to navigate to User Management page

2. **Page loads**
   - Fetches all users from Firestore
   - Displays statistics
   - Shows user table

3. **Search for user** (optional)
   - Types in search box
   - Table filters in real-time

4. **Assign role**
   - Clicks role button (USER/ADMIN/SUPER_ADMIN)
   - Confirms in dialog
   - Role updates in Firestore
   - UI updates immediately
   - Success message shown

5. **Refresh** (optional)
   - Clicks Refresh button
   - Reloads all users from Firestore

## Integration with RBAC System

### Permissions Used
- `Permission.USER_MANAGEMENT` - Access to user management page
- `Permission.USER_ASSIGN_ROLE` - Ability to change user roles

### Role Context Integration
```javascript
import { useRole, Permission } from '../contexts/RoleContext';

// In Sidebar component
if (role === 'SUPER_ADMIN') {
  navItems.push({ id: 'users', label: 'Users', icon: Users });
}
```

### Route Protection
```javascript
// In App.jsx
activeSection === 'users' ? (
  <main className="flex-1 overflow-y-auto">
    <UserManagementPage />
  </main>
) : (
  // ... other routes
)
```

## Future Enhancements

### Potential Features
- [ ] Bulk role assignment (select multiple users)
- [ ] User creation directly from this page
- [ ] User deactivation/activation toggle
- [ ] Export user list to CSV/Excel
- [ ] Filter by role (show only ADMINs, etc.)
- [ ] Sort by name, email, last login, etc.
- [ ] Pagination for large user lists (100+ users)
- [ ] User activity logs (who changed what role when)
- [ ] Email notifications when role changes
- [ ] Password reset functionality

### Performance Optimizations
- [ ] Implement pagination (load 50 users at a time)
- [ ] Add debouncing to search input
- [ ] Cache user list in memory
- [ ] Use real-time listener (onSnapshot) for live updates

## Testing Checklist

- [ ] Only SUPER_ADMIN can see Users navigation item
- [ ] Page loads all users correctly
- [ ] Search filters users by email, name, and UID
- [ ] Statistics show correct counts
- [ ] Role assignment updates Firestore
- [ ] Role assignment updates UI immediately
- [ ] Confirmation dialog appears before role change
- [ ] Loading states show during data fetch
- [ ] Error handling for failed role updates
- [ ] Refresh button reloads data
- [ ] Table is responsive on mobile
- [ ] Dark mode styling works correctly

## Files Modified/Created

### New Files
- `project-gia/src/pages/UserManagementPage.jsx` - Main user management component

### Modified Files
- `project-gia/src/App.jsx` - Added Users route and navigation item
- `project-gia/src/contexts/RoleContext.jsx` - Already had USER_MANAGEMENT permissions

## Dependencies
- Firestore: `collection`, `query`, `getDocs`, `doc`, `updateDoc`, `serverTimestamp`
- Lucide Icons: `Search`, `UserCog`, `Shield`, `ShieldCheck`, `User`, `Mail`, `Calendar`, `CheckCircle2`, `XCircle`, `Loader2`
- React: `useState`, `useEffect`
