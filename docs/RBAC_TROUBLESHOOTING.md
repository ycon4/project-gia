# RBAC Troubleshooting Guide

## Issue: "I set my role to SUPER_ADMIN but nothing happened"

### Quick Checklist:

1. **Did you refresh the page?**
   - After changing the role in Firestore, refresh your browser (F5 or Cmd+R)
   - The real-time listener should update automatically, but a refresh ensures it

2. **Check the Debug Panel**
   - Look at the bottom-right corner of your screen
   - You should see a purple debug panel showing:
     - Your current role
     - Your permissions
     - Loading status
   
3. **Check the Sidebar**
   - When sidebar is expanded, you should see your role badge under "MSU-IIT GADC"
   - Colors:
     - Purple = SUPER_ADMIN
     - Blue = ADMIN
     - Gray = USER

4. **Check Browser Console**
   - Open DevTools (F12)
   - Look for any errors in the Console tab
   - Look for Firestore connection messages

---

## Common Issues & Solutions

### Issue 1: Role shows as "USER" even after changing to "SUPER_ADMIN"

**Possible Causes:**
- You edited the wrong user document
- You edited Firebase Authentication instead of Firestore
- Browser cache issue

**Solution:**
1. Open Firebase Console
2. Go to **Firestore Database** (NOT Authentication)
3. Find the `users` collection
4. Find YOUR user document (match by email)
5. Verify the `role` field says exactly: `SUPER_ADMIN` (case-sensitive!)
6. Hard refresh your browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue 2: Debug panel shows "Loading Role..." forever

**Possible Causes:**
- Firestore connection issue
- User document doesn't exist
- Firestore rules blocking read access

**Solution:**
1. Check browser console for errors
2. Verify you're logged in (check top-right profile)
3. Check Firestore rules allow reading `users` collection:
   ```javascript
   match /users/{userId} {
     allow read: if request.auth != null;
   }
   ```

### Issue 3: Role shows correctly but UI doesn't change

**Expected Behavior:**
Right now, the role system is working but **the UI hasn't been fully integrated yet**. 

What SHOULD work:
- ✅ Role badge in sidebar
- ✅ Role badge in profile menu
- ✅ Debug panel showing permissions

What DOESN'T work yet:
- ❌ EventsPage doesn't filter by role
- ❌ DistributionPage doesn't hide features
- ❌ No User Management page

**This is normal!** The infrastructure is ready, but we need to integrate it into each page.

### Issue 4: "Cannot read properties of undefined (reading 'role')"

**Possible Causes:**
- RoleProvider not wrapping the component
- Using useRole outside of RoleProvider

**Solution:**
- Verify App.jsx has `<RoleProvider user={user}>` wrapping everything
- Check that you're not calling `useRole()` in a component outside the provider

### Issue 5: Firestore permission denied errors

**Possible Causes:**
- Firestore Security Rules are too restrictive
- User not authenticated

**Solution:**
For development, temporarily use permissive rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **WARNING**: Don't use this in production! It allows any authenticated user to do anything.

---

## Verification Steps

### Step 1: Verify Firestore Document

1. Open Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find your user document
4. Verify it looks like this:

```json
{
  "uid": "abc123...",
  "email": "your-email@example.com",
  "displayName": "Your Name",
  "role": "SUPER_ADMIN",  ← Must be exactly this
  "status": "Active",
  "createdAt": "2026-05-06T...",
  "updatedAt": "2026-05-06T...",
  "lastLogin": "2026-05-06T..."
}
```

### Step 2: Verify App is Running

```bash
cd project-gia
npm run dev
```

Should show:
```
VITE v... ready in ... ms
➜  Local:   http://localhost:5173/
```

### Step 3: Verify Login

1. Open http://localhost:5173
2. Log in with your credentials
3. Check top-right corner - should show your profile

### Step 4: Verify Role Loading

1. Look at bottom-right corner - Debug panel should appear
2. Check the role field - should say "SUPER_ADMIN"
3. Check permissions - all should show green checkmarks (✓)

### Step 5: Verify Real-Time Updates

1. Keep your app open
2. Go to Firestore Console
3. Change your role to "USER"
4. Watch the debug panel - should update within 1-2 seconds
5. Change back to "SUPER_ADMIN"
6. Should update again automatically

---

## Debug Commands

### Check if RoleContext is loaded:
Open browser console and run:
```javascript
// This should show the RoleProvider in the React tree
document.querySelector('[data-role-debugger]')
```

### Check Firestore connection:
```javascript
// In browser console
console.log('Firestore connected:', window.firebase !== undefined)
```

### Force re-fetch role:
1. Log out
2. Log back in
3. Role should be fetched fresh from Firestore

---

## Still Not Working?

### Collect Debug Info:

1. **Browser Console Errors:**
   - Open DevTools (F12)
   - Go to Console tab
   - Copy any red error messages

2. **Network Tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Filter by "firestore"
   - Check if requests are succeeding (status 200)

3. **Firestore Document:**
   - Screenshot your user document from Firestore Console
   - Verify the role field value

4. **Debug Panel:**
   - Screenshot the debug panel from bottom-right corner

### Contact Info:
Share the above information and I can help diagnose the issue!

---

## Quick Test Script

Run this in your browser console to test the role system:

```javascript
// Test 1: Check if user is logged in
console.log('User:', firebase.auth().currentUser?.email);

// Test 2: Check Firestore connection
firebase.firestore().collection('users').doc(firebase.auth().currentUser?.uid).get()
  .then(doc => {
    console.log('User document:', doc.data());
    console.log('Role:', doc.data()?.role);
  })
  .catch(err => console.error('Error:', err));

// Test 3: Check RoleContext
// (This only works if you have React DevTools installed)
```

---

## Expected Timeline

- **Immediate**: Role badge appears in sidebar and profile
- **Immediate**: Debug panel shows correct role and permissions
- **Next**: EventsPage filters events by role (needs implementation)
- **Next**: DistributionPage hides features for USER (needs implementation)
- **Next**: User Management page for SUPER_ADMIN (needs implementation)

---

## Remove Debug Panel

Once you've verified everything works, remove the debug panel:

In `src/App.jsx`, remove this line:
```javascript
{!isRegisterMode && <RoleDebugger />}
```
