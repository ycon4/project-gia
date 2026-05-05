# Employee Fields Update - May 4, 2026

## Summary
Updated all employee-related components to use new standardized field names.

## Field Name Changes

### Old → New Mapping

| Old Field Name | New Field Name | Description |
|---|---|---|
| `employee_id` | `empId` | Employee ID |
| `sex` | `empgender` | Employee gender/sex |
| - | `preferred_pronouns` | Preferred pronouns (NEW) |
| `employee_type` | `emptype` | Employment type (Teaching/Non-Teaching) |
| `plantilla_position` | `emp_plantilla` | Plantilla position |
| `income` / `income_order` | `empsalary_grade` | Salary grade/income category |
| `ethnicity` | `empethnic` | Ethnicity |
| `religion` | `empreligion` | Religion |
| `administrative_officials` | `is_emp_senior` | Senior/leadership position |
| `special_needs` | `is_emp_pwd` | Person with Disability (PWD) |
| `place_of_birth` | ❌ REMOVED | No longer tracked |
| - | `deptcoll` | Department/College (NEW) |
| - | `deptcode` | Department code (NEW) |

## Files Updated

### 1. ExcelUploadEmployment.jsx
**Changes:**
- Updated `expected` array with new column names
- Updated data mapping to use new field names
- Updated error message to show new column names

**Excel Header Requirements:**
```
empId, empgender, preferred_pronouns, emptype, emp_plantilla, 
empsalary_grade, empethnic, empreligion, is_emp_senior, 
is_emp_pwd, deptcoll, deptcode
```

### 2. EmployeeVisuals.jsx
**Changes:**
- Updated all field references in `getSDD()` function
- Changed `sex` → `empgender` throughout
- Changed `plantilla_position` → `emp_plantilla`
- Changed `income_order` → `empsalary_grade`
- Changed `college` → `deptcoll`
- Changed `employee_type` → `emptype`
- Changed `administrative_officials` → `is_emp_senior`
- Changed `ethnicity` → `empethnic`
- Changed `religion` → `empreligion`
- Changed `special_needs` → `is_emp_pwd`
- Updated summary stats to use new field names
- Updated chart titles and descriptions

**Chart Changes:**
- "Administrative Officials" → Now shows "Senior" vs "Regular" employees
- "Vulnerability / Special Needs" → Now "PWD (Persons with Disability)"
- Summary stat "IP / Vulnerable" → Now "PWD"

### 3. aiService.js
**Changes:**
- Updated `FIELD_ALIASES` mapping for employee fields
- Updated `FIELD_TO_COLLECTION` mapping
- Added `empgender` to sex field detection logic

**New Query Support:**
- "Show me employees by department"
- "How many senior employees?"
- "PWD employees breakdown"
- "Salary grade distribution"
- "Plantilla vs non-plantilla"

## Migration Notes

### For Existing Data
⚠️ **Important:** Existing employee records in Firebase still use old field names. You have two options:

**Option 1: Re-upload Data**
- Export existing data
- Update Excel headers to new names
- Re-upload using the updated component

**Option 2: Data Migration Script**
- Create a script to rename fields in Firebase
- Update all documents in `employee_information` collection

### For New Data
- Use the new Excel template with updated headers
- All new uploads will use the new field names

## Testing Checklist

- [ ] Upload new employee data with new headers
- [ ] Verify all charts render correctly
- [ ] Test employee queries in chat
- [ ] Check summary statistics
- [ ] Verify SDD breakdowns
- [ ] Test filtering by department/college
- [ ] Test PWD tracking
- [ ] Test senior employee queries

## Benefits

1. **Consistency:** Field names now follow a consistent pattern (`emp` prefix)
2. **Clarity:** More descriptive names (e.g., `is_emp_senior` vs `administrative_officials`)
3. **Extensibility:** Easier to add new employee fields
4. **Maintainability:** Clearer code with standardized naming

## Related Documentation

- [Excel Upload Guide](./CHAT_SETUP_GUIDE.md)
- [AI Service Guide](./AI_PROCESSING_GUIDE.md)
- [Column Audit](./COLUMN_AUDIT.md)
