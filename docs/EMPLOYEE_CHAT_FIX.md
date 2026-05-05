# Employee Chat Query Fix - Field Mapping Issue

## Problem Identified

### Issue 1: Wrong Field Names in Backend Parser
When querying employee data with ambiguous fields like "religion" or "ethnicity", the system was using **student fields** instead of **employee fields**:

- ❌ Query: "Show me employee religion breakdown"
- ❌ Detected: `collection: 'employee_information'` ✓ (correct)
- ❌ But used: `groupField: 'studreligion'` ❌ (student field)
- ✅ Should use: `groupField: 'empreligion'` ✓ (employee field)

### Issue 2: Wrong Boolean Field Names in Computed Data
The computed data was showing `_pwd?` instead of `is_emp_pwd`:

```
📤 Computed data being sent to backend:
Dataset: Employee Information
Total Records in scope: 0
EXACT COUNTS:
_pwd?:           ❌ WRONG - should be "is_emp_pwd"
Total: 0
```

---

## Root Causes

### Cause 1: Missing Employee Field Mappings in Backend
The backend LLM parser (`/api/parse-intent.js` and `/backend/server.js`) had **NO employee field mappings** in the system prompt. It only knew about student fields:
- `studethnic` (student ethnicity)
- `studreligion` (student religion)
- `studgender` (student gender)

### Cause 2: Missing Employee Data Normalization
The frontend `aiService.js` normalized `student_enrollment` and `events` data but **NOT** `employee_information` data. This caused:
- Old field names (e.g., `_pwd?`, `special_needs`) not being converted to new names (`is_emp_pwd`)
- Boolean values not being normalized to "Yes"/"No" format

---

## Solutions Implemented

### Fix 1: Updated Backend Parse-Intent Prompts

Updated **both** backend parse-intent prompts with complete employee field mappings:

#### Files Updated:
1. ✅ `project-gia/api/parse-intent.js` (Vercel serverless function)
2. ✅ `project-gia/backend/server.js` (Local backend server)

#### Changes Made to Backend:

#### 1. Added Employee Boolean Fields
```javascript
## Boolean fields (employee_information) — always use value "Yes":
- "is_emp_pwd" — PWD employee (disabled employee, employee with disability)
- "is_emp_senior" — Senior/Administrative Official (senior citizen, admin official)
```

#### 2. Added Employee Grouping Fields
```javascript
## Grouping fields (employee_information):
- "empgender" — employee sex/gender
- "emptype" — employee type (teaching, non-teaching, permanent, contractual)
- "emp_plantilla" — plantilla position
- "empsalary_grade" — salary grade / income
- "empethnic" — employee ethnicity
- "empreligion" — employee religion
- "deptcoll" — department/college
- "deptcode" — department code
```

#### 3. Added Critical Rules for Employee Queries
```javascript
3. For employee queries (mentions employee/staff/faculty/instructor/professor/personnel/teacher/worker):
   - Set collection = "employee_information"
   - Use employee fields (empgender, empethnic, empreligion, emptype, etc.) NOT student fields
   - CRITICAL: If query mentions "employee" + "religion" → use "empreligion" (NOT "studreligion")
   - CRITICAL: If query mentions "employee" + "ethnicity" → use "empethnic" (NOT "studethnic")
   - CRITICAL: If query mentions "employee" + "gender/sex" → use "empgender" (NOT "studgender")
```

#### 4. Added Example Employee Queries
```javascript
- "Show me employee religion breakdown" → {"collection": "employee_information", "groupField": "empreligion", "wantsSexBreakdown": true, "wantsAll": true}
- "What's the ethnicity distribution of employees?" → {"collection": "employee_information", "groupField": "empethnic", "wantsSexBreakdown": true, "wantsAll": true}
- "Show me PWD employees" → {"collection": "employee_information", "andFilters": [{"field": "is_emp_pwd", "value": "Yes"}], "wantsSexBreakdown": true}
- "How many senior employees?" → {"collection": "employee_information", "andFilters": [{"field": "is_emp_senior", "value": "Yes"}], "wantsSexBreakdown": true}
```

### Fix 2: Added Employee Data Normalization

Updated `project-gia/src/services/aiService.js` to normalize employee data:

#### File Updated:
3. ✅ `project-gia/src/services/aiService.js` (Frontend service)

#### Changes Made to Frontend:

Added employee data normalization in the `computeAnswer` function:

```javascript
: collection === 'employee_information'
  ? rawDocs.map(r => ({
    ...r,
    empId: r.empId || r.employee_id || 'N/A',
    empgender: r.empgender || r.sex || r.gender || 'Unknown',
    emptype: r.emptype || r.employee_type || 'Not Specified',
    emp_plantilla: r.emp_plantilla || r.plantilla_position || 'Not Specified',
    empsalary_grade: r.empsalary_grade || r.salary_grade || r.income_order || 'Not Specified',
    empethnic: r.empethnic || r.ethnicity || 'Not Specified',
    empreligion: r.empreligion || r.religion || 'Not Specified',
    is_emp_pwd: nb(r.is_emp_pwd ?? r['_pwd?'] ?? r.special_needs),
    is_emp_senior: nb(r.is_emp_senior ?? r.administrative_officials),
    deptcoll: r.deptcoll || r.department || 'Not Specified',
    deptcode: r.deptcode || r.department_code || 'Not Specified',
  }))
```

This normalization:
- ✅ Converts legacy field names to new standardized names
- ✅ Normalizes boolean fields (`_pwd?` → `is_emp_pwd`, `special_needs` → `is_emp_pwd`)
- ✅ Converts boolean values to "Yes"/"No" format
- ✅ Provides fallback values for missing data

---
```javascript
## Boolean fields (employee_information) — always use value "Yes":
- "is_emp_pwd" — PWD employee (disabled employee, employee with disability)
- "is_emp_senior" — Senior/Administrative Official (senior citizen, admin official)
```

#### 2. Added Employee Grouping Fields
```javascript
## Grouping fields (employee_information):
- "empgender" — employee sex/gender
- "emptype" — employee type (teaching, non-teaching, permanent, contractual)
- "emp_plantilla" — plantilla position
- "empsalary_grade" — salary grade / income
- "empethnic" — employee ethnicity
- "empreligion" — employee religion
- "deptcoll" — department/college
- "deptcode" — department code
```

#### 3. Added Critical Rules for Employee Queries
```javascript
3. For employee queries (mentions employee/staff/faculty/instructor/professor/personnel/teacher/worker):
   - Set collection = "employee_information"
   - Use employee fields (empgender, empethnic, empreligion, emptype, etc.) NOT student fields
   - CRITICAL: If query mentions "employee" + "religion" → use "empreligion" (NOT "studreligion")
   - CRITICAL: If query mentions "employee" + "ethnicity" → use "empethnic" (NOT "studethnic")
   - CRITICAL: If query mentions "employee" + "gender/sex" → use "empgender" (NOT "studgender")
```

#### 4. Added Example Employee Queries
```javascript
- "Show me employee religion breakdown" → {"collection": "employee_information", "groupField": "empreligion", "wantsSexBreakdown": true, "wantsAll": true}
- "What's the ethnicity distribution of employees?" → {"collection": "employee_information", "groupField": "empethnic", "wantsSexBreakdown": true, "wantsAll": true}
- "Show me PWD employees" → {"collection": "employee_information", "andFilters": [{"field": "is_emp_pwd", "value": "Yes"}], "wantsSexBreakdown": true}
- "How many senior employees?" → {"collection": "employee_information", "andFilters": [{"field": "is_emp_senior", "value": "Yes"}], "wantsSexBreakdown": true}
```

---

## Testing Instructions

### Step 1: Restart Backend Server
The backend server needs to be restarted to load the updated prompt:

```bash
cd project-gia/backend
node server.js
```

### Step 2: Hard Refresh Browser
Clear the frontend cache:
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### Step 3: Test Employee Queries

Try these queries in the chat interface:

#### Religion Breakdown
```
Show me employee religion breakdown
```
**Expected Result:**
- Collection: `employee_information` ✓
- Group Field: `empreligion` ✓
- Should show: Roman Catholic, Islam, Protestant breakdown

#### Ethnicity Breakdown
```
What's the ethnicity distribution of employees?
```
**Expected Result:**
- Collection: `employee_information` ✓
- Group Field: `empethnic` ✓
- Should show: Bisaya, Maranao, Cebuano, Ilocano breakdown

#### PWD Employees
```
Show me PWD employees
```
**Expected Result:**
- Collection: `employee_information` ✓
- And Filters: `[{field: 'is_emp_pwd', value: 'Yes'}]` ✓

#### Senior/Admin Officials
```
How many senior employees?
```
**Expected Result:**
- Collection: `employee_information` ✓
- And Filters: `[{field: 'is_emp_senior', value: 'Yes'}]` ✓

#### Employee Type
```
Show me teaching vs non-teaching employees
```
**Expected Result:**
- Collection: `employee_information` ✓
- Group Field: `emptype` ✓

#### Gender Breakdown
```
Show me employee gender breakdown
```
**Expected Result:**
- Collection: `employee_information` ✓
- Group Field: `empgender` ✓

---

## Verification Checklist

- [ ] Backend server restarted
- [ ] Browser hard refreshed
- [ ] Religion query uses `empreligion` (not `studreligion`)
- [ ] Ethnicity query uses `empethnic` (not `studethnic`)
- [ ] Gender query uses `empgender` (not `studgender`)
- [ ] PWD query uses `is_emp_pwd` boolean filter
- [ ] Senior query uses `is_emp_senior` boolean filter
- [ ] All queries return actual data (not "Unknown")

---

## Data Verification

Your Excel file has **40 employee records** with:
- ✅ Religion data: Roman Catholic, Islam, Protestant
- ✅ Ethnicity data: Bisaya, Maranao, Cebuano, Ilocano
- ✅ Gender data: Male, Female
- ✅ Employee type data: Teaching, Non-Teaching

All queries should now return proper breakdowns instead of "Unknown: 40".

---

## Related Files

- `project-gia/api/parse-intent.js` - Vercel serverless function (✅ updated with employee field mappings)
- `project-gia/backend/server.js` - Local backend server (✅ updated with employee field mappings)
- `project-gia/src/services/aiService.js` - Frontend service (✅ updated with employee data normalization)
- `project-gia/src/components/excel_upload/ExcelUploadEmployment.jsx` - Employee upload (already supports all fields)

---

## Status

✅ **FIXED** - Backend LLM parser now has complete employee field mappings
✅ **FIXED** - Frontend now normalizes employee data and boolean fields
⏳ **TESTING REQUIRED** - User needs to restart backend and hard refresh browser to test queries
