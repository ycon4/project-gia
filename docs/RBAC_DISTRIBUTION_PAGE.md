# RBAC Integration: Distribution Page

## Implementation Date
May 6, 2026

## Overview
The Distribution Page now has role-based access control that restricts what users can see and do based on their role.

---

## Role-Based Features

### 👤 USER Role
**Can See:**
- ✅ Visuals tab (charts and graphs)
- ✅ Print button
- ✅ Academic year selector

**Cannot See:**
- ❌ "Data Sheet" tab (hidden completely)
- ❌ Import button (upload Excel files)
- ❌ Modify Period button (edit academic year)
- ❌ Delete Period button (delete data)

**User Experience:**
- Clean, simple interface focused on data visualization
- No clutter from administrative buttons
- Can still print visualizations for reports

---

### 👨‍💼 ADMIN Role
**Can See:**
- ✅ Visuals tab
- ✅ Data Sheet tab (full dataset table)
- ✅ Print button
- ✅ Import button (upload Excel files)
- ✅ Modify Period button
- ✅ Delete Period button
- ✅ Academic year selector

**User Experience:**
- Full access to all data management features
- Can import new data
- Can modify and delete academic periods
- Can view raw datasets in table format

---

### 👑 SUPER_ADMIN Role
**Can See:**
- ✅ Everything ADMIN can see
- ✅ Plus user management features (in other pages)

**User Experience:**
- Same as ADMIN for Distribution Page
- Additional user management capabilities system-wide

---

## Technical Implementation

### Changes Made

1. **Added RBAC Import**
   ```javascript
   import { useRole, Permission } from '../contexts/RoleContext.jsx';
   ```

2. **Added useRole Hook**
   ```javascript
   const { hasPermission } = useRole();
   ```

3. **Conditional Tab Rendering**
   ```javascript
   {[
     { id: 'visuals', label: 'Visuals' },
     ...(hasPermission(Permission.DATA_VIEW_DATASETS) 
       ? [{ id: 'table', label: 'Data Sheet' }] 
       : []),
   ].map(tab => ...)}
   ```

4. **Conditional Button Rendering**
   ```javascript
   {hasPermission(Permission.DATA_IMPORT) && UploadButton}
   {hasPermission(Permission.DATA_MODIFY) && <ModifyButton />}
   {hasPermission(Permission.DATA_DELETE) && <DeleteButton />}
   ```

### Permissions Used

| Permission | Description | USER | ADMIN | SUPER_ADMIN |
|------------|-------------|------|-------|-------------|
| `DATA_VIEW_VISUALS` | View charts/graphs | ✅ | ✅ | ✅ |
| `DATA_VIEW_DATASETS` | View raw data table | ❌ | ✅ | ✅ |
| `DATA_IMPORT` | Upload Excel files | ❌ | ✅ | ✅ |
| `DATA_MODIFY` | Modify academic periods | ❌ | ✅ | ✅ |
| `DATA_DELETE` | Delete academic periods | ❌ | ✅ | ✅ |

---

## Testing Guide

### Test as USER
1. Use the debug panel to set your role to "USER"
2. Go to Distribution page
3. **Verify:**
   - ✅ Only "Visuals" tab is visible
   - ✅ No "Data Sheet" tab
   - ✅ No Import button
   - ✅ No Modify/Delete buttons
   - ✅ Print button still works

### Test as ADMIN
1. Use the debug panel to set your role to "ADMIN"
2. Go to Distribution page
3. **Verify:**
   - ✅ Both "Visuals" and "Data Sheet" tabs visible
   - ✅ Import button appears
   - ✅ Modify and Delete buttons appear
   - ✅ Can switch between tabs
   - ✅ Can view raw data table

### Test as SUPER_ADMIN
1. Use the debug panel to set your role to "SUPER_ADMIN"
2. Go to Distribution page
3. **Verify:**
   - ✅ Same as ADMIN (all features visible)

---

## User Experience Comparison

### Before RBAC
```
┌─────────────────────────────────────┐
│ Distribution Page                   │
├─────────────────────────────────────┤
│ [Visuals] [Data Sheet]              │ ← Everyone sees both tabs
│ [Print] [Import] [Modify] [Delete]  │ ← Everyone sees all buttons
└─────────────────────────────────────┘
```

### After RBAC (USER Role)
```
┌─────────────────────────────────────┐
│ Distribution Page                   │
├─────────────────────────────────────┤
│ [Visuals]                           │ ← Only Visuals tab
│ [Print]                             │ ← Only Print button
└─────────────────────────────────────┘
```

### After RBAC (ADMIN/SUPER_ADMIN Role)
```
┌─────────────────────────────────────┐
│ Distribution Page                   │
├─────────────────────────────────────┤
│ [Visuals] [Data Sheet]              │ ← Both tabs visible
│ [Print] [Import] [Modify] [Delete]  │ ← All buttons visible
└─────────────────────────────────────┘
```

---

## Security Notes

### Client-Side Protection
- ✅ UI elements are hidden based on permissions
- ✅ Buttons don't render if user lacks permission
- ✅ Tabs are conditionally displayed

### Server-Side Protection (TODO)
- ⚠️ **IMPORTANT**: Client-side checks are for UX only!
- ⚠️ **MUST** add Firestore Security Rules to enforce permissions at database level
- ⚠️ A tech-savvy user could bypass UI restrictions without server-side rules

### Recommended Firestore Rules
```javascript
match /student_enrollment/{docId} {
  allow read: if request.auth != null;
  allow write: if getUserRole() in ['ADMIN', 'SUPER_ADMIN'];
}

match /employee_information/{docId} {
  allow read: if request.auth != null;
  allow write: if getUserRole() in ['ADMIN', 'SUPER_ADMIN'];
}
```

---

## Benefits

### For Users (USER Role)
- 🎯 **Focused Interface**: Only see what they need (visualizations)
- 🚫 **No Confusion**: Administrative buttons don't clutter the UI
- 📊 **Easy Access**: Quick access to charts and graphs
- 🖨️ **Print Capability**: Can still print reports

### For Administrators (ADMIN/SUPER_ADMIN)
- 🔧 **Full Control**: Access to all data management features
- 📥 **Data Import**: Can upload new datasets
- ✏️ **Data Modification**: Can edit academic periods
- 🗑️ **Data Deletion**: Can remove old data
- 📋 **Raw Data Access**: Can view and analyze raw datasets

### For the Organization
- 🔒 **Data Protection**: Sensitive data operations restricted to admins
- 👥 **User Management**: Clear separation of roles and responsibilities
- 📈 **Scalability**: Easy to add more roles or permissions in the future
- 🎨 **Better UX**: Each role sees an interface tailored to their needs

---

## Next Steps

1. **Test thoroughly** with different roles
2. **Implement Firestore Security Rules** (CRITICAL!)
3. **Integrate RBAC into EventsPage** (next priority)
4. **Create UserManagementPage** for SUPER_ADMIN
5. **Add audit logging** for data modifications

---

## Troubleshooting

### Issue: USER can still see Data Sheet tab
**Solution**: Check that the user's role in Firestore is exactly `"USER"` (case-sensitive)

### Issue: ADMIN cannot see Import button
**Solution**: Verify the user's role is `"ADMIN"` or `"SUPER_ADMIN"` in Firestore

### Issue: Buttons appear then disappear
**Solution**: This is normal - the role loads asynchronously. The loading state should be brief.

### Issue: Changes don't take effect
**Solution**: Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)

---

## Code Locations

- **Main File**: `project-gia/src/pages/DistributionPage.jsx`
- **RBAC Context**: `project-gia/src/contexts/RoleContext.jsx`
- **Permissions**: Defined in `RoleContext.jsx` as `Permission` enum
- **Role Provider**: Wraps the app in `App.jsx`

---

## Related Documentation

- [RBAC Implementation Status](./RBAC_IMPLEMENTATION_STATUS.md)
- [RBAC Troubleshooting Guide](./RBAC_TROUBLESHOOTING.md)
- [RBAC Design Document](../.kiro/specs/rbac-system/design.md)
