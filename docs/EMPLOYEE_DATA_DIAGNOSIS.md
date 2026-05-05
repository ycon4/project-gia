# Employee Data Diagnosis - "Unknown" Values

## Issue

Query: "employee ethnicity breakdown"
Result: All 39 employees show as "Unknown"

## Root Cause

The employee data in Firebase doesn't have the `empethnic` field populated with actual values.

---

## What's Happening

1. ✅ **Collection detected correctly**: `employee_information`
2. ✅ **Field detected correctly**: `empethnic` (not `studethnic`)
3. ✅ **Data loaded**: 39 employee records
4. ❌ **Problem**: All records have `empethnic = null/undefined/"Unknown"`

---

## How to Verify

### Step 1: Check Your Excel File

Open your employee Excel file and check the `empethnic` column:
- Does it have values? (e.g., "Cebuano", "Maranao", "Tausug")
- Or is it empty/blank?

### Step 2: Check Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select: `project-gia-v2`
3. Go to: Firestore Database
4. Click: `employee_information` collection
5. Open any document
6. Look for: `empethnic` field
7. Check: Does it have a value or is it null/empty?

### Step 3: Check Upload Headers

The upload expects this exact header (case-sensitive):
```
empethnic
```

**Common mistakes:**
- ❌ `ethnicity` (wrong - this is for students)
- ❌ `emp_ethnic` (wrong - underscore)
- ❌ `empEthnic` (wrong - capital E)
- ❌ `Empethnic` (wrong - capital E)
- ✅ `empethnic` (correct - all lowercase)

---

## Solution

### If Excel File Has Data But Upload Failed:

**Problem**: Header mismatch or data not uploaded correctly

**Fix**:
1. Check Excel headers match exactly:
   ```
   empId, empgender, preferred_pronouns, emptype, emp_plantilla, 
   empsalary_grade, empethnic, empreligion, is_emp_senior, is_emp_pwd, 
   deptcoll, deptcode
   ```

2. Re-upload the file:
   - Go to Distribution → Employee Info
   - Click upload button
   - Select your Excel file
   - Choose academic year
   - Upload

### If Excel File is Empty:

**Problem**: Source data doesn't have ethnicity information

**Fix**:
1. Add ethnicity data to your Excel file in the `empethnic` column
2. Common values:
   - Cebuano
   - Maranao
   - Tausug
   - Maguindanao
   - Sama
   - Yakan
   - Subanon
   - Higaonon
   - Others

3. Re-upload the file

---

## Test Other Fields

Try these queries to see which fields have data:

```
Show me employee type breakdown
```
Expected: Teaching, Non-Teaching, etc.

```
Show me employee religion breakdown
```
Expected: Roman Catholic, Islam, Protestant, etc.

```
Show me employees by department
```
Expected: COE, CCS, CSM, etc.

```
PWD employee breakdown
```
Expected: PWD Employee count

```
Senior citizen breakdown
```
Expected: Senior/Admin Official count

---

## Quick Diagnostic Query

Run this in browser console to see what fields have data:

```javascript
// Check what fields are populated in employee data
const employeeData = dbData.employee_information;
console.log('Sample employee record:', employeeData[0]);
console.log('Fields with data:');
Object.keys(employeeData[0]).forEach(key => {
  const values = [...new Set(employeeData.map(e => e[key]))].filter(Boolean);
  console.log(`  ${key}: ${values.length} unique values`);
  if (values.length > 0 && values.length <= 10) {
    console.log(`    Values: ${values.join(', ')}`);
  }
});
```

This will show you:
- Which fields exist
- Which fields have data
- What values are in each field

---

## Expected vs Actual

### Expected (with data):
```markdown
| Ethnicity | Male | Male % | Female | Female % | Total |
|-----------|------|--------|--------|----------|-------|
| Cebuano | 20 | 55.6% | 16 | 44.4% | 36 |
| Maranao | 8 | 50.0% | 8 | 50.0% | 16 |
```

### Actual (without data):
```markdown
| Ethnicity | Male | Male % | Female | Female % | Total |
|-----------|------|--------|--------|----------|-------|
| Unknown | 22 | 56.4% | 17 | 43.6% | 39 |
```

---

## Summary

✅ **Chat system is working correctly**
- Collection detection: ✓
- Field detection: ✓
- Data loading: ✓

❌ **Data issue**
- Employee records don't have `empethnic` values
- Need to check Excel file and re-upload with ethnicity data

**Next Step**: Check your Excel file's `empethnic` column and verify it has values.
