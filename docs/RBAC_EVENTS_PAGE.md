# RBAC Integration: Events Page

## Implementation Date
May 6, 2026

## Overview
The Events Page now has role-based access control that filters events and restricts actions based on user roles.

---

## Role-Based Features

### 👤 USER Role
**Can See:**
- ✅ Only events they created
- ✅ Create new events
- ✅ Edit their own events
- ✅ Delete their own events

**Cannot See:**
- ❌ Events created by other users
- ❌ Edit/delete buttons on others' events

**User Experience:**
- Clean, personal event management
- No clutter from other users' events
- Full control over own events

---

### 👨‍💼 ADMIN Role
**Can See:**
- ✅ ALL events (from all users)
- ✅ Creator name on each event
- ✅ Create new events
- ✅ Edit ANY event
- ✅ Delete ANY event

**User Experience:**
- Full visibility of all events
- Can manage events created by others
- See who created each event

---

### 👑 SUPER_ADMIN Role
**Can See:**
- ✅ Same as ADMIN (all events, full control)
- ✅ Plus user management features (in other pages)

---

## Technical Implementation

### Changes Made

1. **Event Filtering by Role**
   ```javascript
   const visibleEvents = useMemo(() => {
     return filterEventsByRole(events);
   }, [events, filterEventsByRole]);
   ```

2. **Create Button Permission**
   ```javascript
   {hasPermission(Permission.EVENT_CREATE) && (
     <button onClick={openCreate}>New Event</button>
   )}
   ```

3. **Edit/Delete Permission Checks**
   ```javascript
   {canModifyEvent(event.createdBy) && <EditButton />}
   {canDeleteEvent(event.createdBy) && <DeleteButton />}
   ```

4. **Creator Name Display** (ADMIN/SUPER_ADMIN only)
   ```javascript
   {event.createdByName && role !== 'USER' && (
     <p>Created by {event.createdByName}</p>
   )}
   ```

### Permissions Used

| Permission | Description | USER | ADMIN | SUPER_ADMIN |
|------------|-------------|------|-------|-------------|
| `EVENT_VIEW_OWN` | View own events | ✅ | ✅ | ✅ |
| `EVENT_VIEW_ALL` | View all events | ❌ | ✅ | ✅ |
| `EVENT_CREATE` | Create new events | ✅ | ✅ | ✅ |
| `EVENT_EDIT_OWN` | Edit own events | ✅ | ✅ | ✅ |
| `EVENT_EDIT_ALL` | Edit any event | ❌ | ✅ | ✅ |
| `EVENT_DELETE_OWN` | Delete own events | ✅ | ✅ | ✅ |
| `EVENT_DELETE_ALL` | Delete any event | ❌ | ✅ | ✅ |

---

## Event Ownership

### How It Works:
When a user creates an event, the system automatically adds:
```javascript
{
  createdBy: "user-uid-123",
  createdByName: "John Doe",
  // ... other event fields
}
```

### Filtering Logic:
- **USER**: `events.filter(e => e.createdBy === currentUser.uid)`
- **ADMIN/SUPER_ADMIN**: `events` (no filter, see all)

---

## Testing Guide

### Test as USER
1. Set role to "USER" in debug panel
2. Create an event → Should succeed
3. **Verify:**
   - ✅ Only see your own events in the list
   - ✅ Can edit/delete your events
   - ❌ Don't see events created by others
   - ❌ No creator names shown

### Test as ADMIN
1. Set role to "ADMIN" in debug panel
2. **Verify:**
   - ✅ See ALL events (yours + others')
   - ✅ See creator names on each event
   - ✅ Can edit ANY event
   - ✅ Can delete ANY event

### Test Event Ownership
1. As USER A: Create "Event A"
2. Switch to USER B (different account)
3. **Verify:**
   - ❌ USER B cannot see "Event A"
   - ❌ USER B cannot edit "Event A"
4. Switch to ADMIN
5. **Verify:**
   - ✅ ADMIN can see "Event A"
   - ✅ ADMIN can edit "Event A"
   - ✅ Shows "Created by User A"

---

## User Experience Comparison

### Before RBAC
```
All Users See:
├── Event 1 (by Admin)
├── Event 2 (by User A)
├── Event 3 (by User B)
└── Event 4 (by Admin)

Problem: Users see events they can't manage
```

### After RBAC (USER Role)
```
User A Sees:
└── Event 2 (by User A)  ← Only their own

User B Sees:
└── Event 3 (by User B)  ← Only their own

Clean, focused view!
```

### After RBAC (ADMIN Role)
```
Admin Sees:
├── Event 1 (by Admin)
├── Event 2 (by User A)  ← Can manage
├── Event 3 (by User B)  ← Can manage
└── Event 4 (by Admin)

Full visibility + control!
```

---

## Security Notes

### Client-Side Protection
- ✅ Events filtered by role before rendering
- ✅ Edit/delete buttons hidden based on ownership
- ✅ Create button shown only if permitted

### Server-Side Protection (TODO)
- ⚠️ **IMPORTANT**: Must add Firestore Security Rules!
- ⚠️ Client-side checks are for UX only

### Recommended Firestore Rules
```javascript
match /events/{eventId} {
  allow read: if request.auth != null;
  
  allow create: if request.auth != null && 
                  request.resource.data.createdBy == request.auth.uid;
  
  allow update, delete: if request.auth != null && (
    getUserRole() in ['ADMIN', 'SUPER_ADMIN'] ||
    resource.data.createdBy == request.auth.uid
  );
}
```

---

## Benefits

### For Users (USER Role)
- 🎯 **Focused View**: Only see their own events
- 🚫 **No Confusion**: Don't see irrelevant events
- ✏️ **Full Control**: Can manage their events
- 🔒 **Privacy**: Others can't see their events

### For Administrators (ADMIN/SUPER_ADMIN)
- 👁️ **Full Visibility**: See all events across the system
- 🔧 **Full Control**: Can edit/delete any event
- 👤 **Transparency**: See who created each event
- 📊 **Better Oversight**: Monitor all event activity

### For the Organization
- 🔒 **Data Isolation**: Users can't interfere with others' events
- 👥 **Clear Ownership**: Every event has a creator
- 📈 **Scalability**: Works with many users creating events
- 🎨 **Better UX**: Each role sees what they need

---

## Edge Cases Handled

### 1. Legacy Events (No createdBy)
**Problem**: Old events don't have `createdBy` field
**Solution**: 
- Visible to all users (backward compatibility)
- Or run migration script to assign ownership

### 2. Deleted User's Events
**Problem**: User account deleted, but events remain
**Solution**:
- Events still visible to ADMIN/SUPER_ADMIN
- Shows "Unknown User" or original name

### 3. Role Change During Session
**Problem**: User's role changes while viewing events
**Solution**:
- Real-time listener updates role
- Event list re-filters automatically
- UI updates without refresh

---

## Known Limitations

1. **No Firestore Security Rules Yet**
   - Client-side only (can be bypassed)
   - Must add server-side rules for production

2. **No Event Sharing**
   - Users can't share events with specific users
   - Future feature: Add collaborators

3. **No Event Transfer**
   - Can't transfer ownership to another user
   - Future feature: Transfer ownership

---

## Next Steps

1. ✅ **EventsPage RBAC**: Complete!
2. ✅ **DistributionPage RBAC**: Complete!
3. ⏳ **UserManagementPage**: Create SUPER_ADMIN interface
4. ⏳ **Firestore Security Rules**: CRITICAL for production
5. ⏳ **Audit Logging**: Track who does what
6. ⏳ **Event Migration**: Add `createdBy` to existing events

---

## Troubleshooting

### Issue: USER sees all events
**Solution**: Check that `createdBy` field exists on events

### Issue: ADMIN can't edit events
**Solution**: Verify role is exactly `"ADMIN"` or `"SUPER_ADMIN"` in Firestore

### Issue: Edit/delete buttons don't appear
**Solution**: Check that `event.createdBy` matches `auth.currentUser.uid`

### Issue: Creator name not showing
**Solution**: Ensure `createdByName` field is set when creating events

---

## Related Documentation

- [RBAC Implementation Status](./RBAC_IMPLEMENTATION_STATUS.md)
- [RBAC Distribution Page](./RBAC_DISTRIBUTION_PAGE.md)
- [RBAC Troubleshooting Guide](./RBAC_TROUBLESHOOTING.md)
- [RBAC Design Document](../.kiro/specs/rbac-system/design.md)
