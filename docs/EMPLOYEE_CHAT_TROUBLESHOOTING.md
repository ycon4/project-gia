# Employee Chat Troubleshooting Guide

## Issue: "No data available for this query"

### Step 1: Check if Employee Data is Uploaded

1. **Go to Distribution Page** → Select "Employee Info" dataset
2. **Check if you see any academic years** in the dropdown
3. **Check the record count** - should show "X records" if data exists

**If no data shows:**
- You need to upload employee data first
- Go to Distribution → Employee Info → Click the upload button
- Use the Excel template with these exact headers:
  ```
  empId, empgender, preferred_pronouns, emptype, emp_plantilla, 
  empsalary_grade, empethnic, empreligion, is_emp_senior, is_emp_pwd, 
  deptcoll, deptcode
  ```

### Step 2: Check Browser Console

Open browser console (F12) and look for these logs when you ask a query:

**Expected logs:**
```
🔍 Parsed Intent: {
  collection: "employee_information",
  groupField: "emptype",
  ...
}

📊 Available data: [
  "student_enrollment: 500 records",
  "employee_information: 81 records",  ← Should see this
  "events: 10 records",
  "attendance: 770 records"
]
```

**If you see:**
```
📊 Available data: [
  "student_enrollment: 500 records",
  "employee_information: 0 records",  ← Problem: No employee data
  ...
]
```
→ You need to upload employee data first

**If you see:**
```
⚠️ No data found for collection: employee_information
📊 Available collections: ["student_enrollment", "employee_information", "events", "attendance"]
📊 Collection sizes: ["student_enrollment: 500", "employee_information: 0", ...]
```
→ Employee collection exists but is empty

### Step 3: Verify Query Detection

Check if your query is being detected as an employee query:

**Good queries that should work:**
- "Show me the SDD breakdown of employees"
- "How many employees do we have?"
- "Male and female employees"
- "Teaching vs non-teaching staff"
- "Employees by department"

**Check the console for:**
```
🔍 Parsed Intent: {
  collection: "employee_information",  ← Should say this
  ...
}
```

**If it says something else:**
```
🔍 Parsed Intent: {
  collection: "student_enrollment",  ← Wrong collection
  ...
}
```
→ Try using more explicit keywords: "employee", "staff", "faculty"

### Step 4: Test with Simple Query

Try the simplest possible query:
```
"How many employees?"
```

**Expected behavior:**
1. Console shows: `collection: "employee_information"`
2. If data exists: Shows count with sex breakdown
3. If no data: Shows "No data available" message

### Step 5: Refresh Data

If you just uploaded employee data:
1. Click the **refresh icon** next to the record count in chat
2. Wait for "X records ready" message
3. Try your query again

---

## Common Issues & Solutions

### Issue: Query returns student data instead of employee data

**Symptoms:**
- Asked about "employees" but got student results
- Console shows `collection: "student_enrollment"`

**Solution:**
Use more explicit keywords:
- ❌ "Show me the breakdown" (too vague)
- ✅ "Show me the employee breakdown"
- ✅ "Show me staff distribution"
- ✅ "How many faculty members?"

### Issue: "Could not determine which dataset to use"

**Symptoms:**
- Query is too vague
- Console shows `collection: null`

**Solution:**
Be more specific:
- ❌ "Show me the data"
- ✅ "Show me employee data"
- ✅ "Show me staff by department"

### Issue: Query works but shows 0 results

**Symptoms:**
- Console shows correct collection
- Console shows `totalRecords: 0`
- But you know data exists

**Possible causes:**
1. **Academic year mismatch**: Query is looking for a specific year that doesn't exist
2. **Filter mismatch**: Query is filtering by a value that doesn't exist in data

**Solution:**
- Try without year: "Show me all employees" (not "employees in 2024-2025")
- Check your data: Go to Distribution → Employee Info → Data Sheet
- Verify the values match what you're querying

---

## Debug Checklist

- [ ] Employee data is uploaded (check Distribution page)
- [ ] Browser console is open (F12)
- [ ] Query uses employee keywords ("employee", "staff", "faculty")
- [ ] Console shows `collection: "employee_information"`
- [ ] Console shows `employee_information: X records` (X > 0)
- [ ] Data refresh button clicked if just uploaded
- [ ] Query is specific enough (not too vague)

---

## Test Queries (Copy & Paste)

Try these queries in order:

1. **Basic count:**
   ```
   How many employees do we have?
   ```

2. **SDD breakdown:**
   ```
   Show me the SDD breakdown of employees
   ```

3. **By type:**
   ```
   Teaching vs non-teaching staff
   ```

4. **By department:**
   ```
   Employees by department
   ```

5. **Filtered:**
   ```
   PWD employees
   ```

---

## Still Not Working?

If none of the above helps, provide these details:

1. **Query you tried:** (exact text)
2. **Console logs:** (copy the 🔍 Parsed Intent and 📊 Available data logs)
3. **Distribution page status:** (screenshot or description)
4. **Employee data status:** (how many records, which academic year)

This will help diagnose the exact issue.
