# Employee Chat Implementation Plan

## Current Status Assessment

### ✅ What's Already Working

The chat system (`aiService.js`) **already has employee support built in**! Here's what's in place:

1. **Field Aliases** (lines 145-165):
   - All employee fields are mapped: `empId`, `empgender`, `emptype`, `emp_plantilla`, `empsalary_grade`, `empethnic`, `empreligion`, `is_emp_senior`, `is_emp_pwd`, `deptcoll`, `deptcode`
   - Natural language aliases work: "employee gender" → `empgender`, "salary grade" → `empsalary_grade`, etc.

2. **Collection Detection** (line 367):
   - Keywords trigger employee collection: `employee`, `staff`, `faculty`, `instructor`, `professor`, `personnel`, `teacher`, `worker`

3. **Field-to-Collection Mapping** (lines 195-210):
   - All employee fields correctly map to `employee_information` collection

4. **Sex Field Detection** (line 1002):
   - System automatically detects `empgender` for sex-disaggregated data (SDD)

### 🔍 What Needs Testing

The infrastructure is there, but we need to verify it works with actual employee data queries.

---

## Test Queries to Verify

### Basic Queries (Should Work Now)

1. **Total Employee Count**
   - "How many employees do we have?"
   - "Show me total staff count"
   - Expected: Total count with optional sex breakdown

2. **SDD Breakdown by Employee Type**
   - "Show me the SDD breakdown of employees"
   - "Male and female employees"
   - "Employee distribution by sex"
   - Expected: Table with Male/Female counts and percentages

3. **Employee Type Distribution**
   - "Teaching vs non-teaching staff"
   - "Show me employee types"
   - Expected: Breakdown by `emptype` field

4. **Salary Grade Distribution**
   - "Salary grade distribution"
   - "Show me employees by salary grade"
   - Expected: Grouped by `empsalary_grade` with SDD

5. **Department/College Distribution**
   - "Employees by department"
   - "Faculty by college"
   - Expected: Grouped by `deptcoll` with SDD

6. **PWD Employees**
   - "Show me PWD employees"
   - "How many employees with disabilities?"
   - Expected: Filtered by `is_emp_pwd = 'Yes'` with SDD

7. **Senior/Admin Officials**
   - "Show me senior employees"
   - "Administrative officials"
   - Expected: Filtered by `is_emp_senior = 'Yes'` with SDD

8. **Ethnicity Distribution**
   - "Employee ethnicity breakdown"
   - "Cultural profile of employees"
   - Expected: Grouped by `empethnic` with SDD

9. **Religion Distribution**
   - "Religious affiliation of employees"
   - "Employee religion breakdown"
   - Expected: Grouped by `empreligion` with SDD

10. **Plantilla Positions**
    - "Show me plantilla employees"
    - "Permanent positions"
    - Expected: Filtered by `emp_plantilla` (not null/N/A)

### Advanced Queries (Multi-Filter)

11. **PWD in Specific Department**
    - "PWD employees in College of Engineering"
    - "Show me disabled staff in CCS"
    - Expected: Intersection of `is_emp_pwd='Yes'` AND `deptcoll='College of Computer Studies'`

12. **Senior Officials by Department**
    - "Senior employees by college"
    - "Administrative officials per department"
    - Expected: Filtered by `is_emp_senior='Yes'`, grouped by `deptcoll`

13. **Teaching Faculty by Department**
    - "Teaching staff by college"
    - "Faculty distribution across departments"
    - Expected: Filtered by `emptype` containing "teaching", grouped by `deptcoll`

### Comparison Queries

14. **Year-over-Year Comparison**
    - "Compare employees in 2024-2025 vs 2023-2024"
    - Expected: Side-by-side comparison across academic years

15. **Department Comparison**
    - "Compare employees in COE vs CCS"
    - Expected: Side-by-side comparison of two departments

---

## Potential Issues & Fixes

### Issue 1: Academic Year Format
**Problem**: Employee data uses academic year format (e.g., "2024-2025"), not semester-based like students.

**Current Code** (line 1012-1020):
```javascript
// If semester was detected without year, find latest year with that semester
if (intent.semester && academicYears.length === 0) {
  const yearsWithSemester = allYears.filter(y => y.includes(intent.semester));
  if (yearsWithSemester.length > 0) {
    academicYears.push(yearsWithSemester[yearsWithSemester.length - 1]);
  }
}
```

**Status**: ✅ Should work fine - employee queries won't trigger semester detection

### Issue 2: Data Normalization
**Problem**: Employee data doesn't need the same normalization as student data.

**Current Code** (lines 988-1003):
```javascript
const allDocs = collection === 'student_enrollment'
  ? rawDocs.map(r => ({ /* normalize student fields */ }))
  : collection === 'events'
    ? rawDocs.map(r => ({ /* normalize event fields */ }))
    : rawDocs; // Employee data passes through unchanged
```

**Status**: ✅ Employee data is used as-is (no normalization needed)

### Issue 3: Sex Field Detection
**Current Code** (lines 1005-1010):
```javascript
const sexField = collection === 'events'
  ? 'sex'
  : allDocs[0]?.studgender !== undefined ? 'studgender'
    : allDocs[0]?.empgender !== undefined ? 'empgender' // ✅ Employee support
      : allDocs[0]?.sex !== undefined ? 'sex'
        : allDocs[0]?.gender !== undefined ? 'gender'
          : null;
```

**Status**: ✅ Correctly detects `empgender` for employees

### Issue 4: Boolean Fields
**Problem**: Employee boolean fields (`is_emp_pwd`, `is_emp_senior`) are not in the `BOOLEAN_FIELD_LABELS` map.

**Current Code** (lines 218-228):
```javascript
const BOOLEAN_FIELD_LABELS = {
  'is_pwd': 'PWD',
  'is_child_solo_parent': 'Child of Solo Parent',
  '_ip_member?': 'IP Member',
  '_working_student?': 'Working Student',
  is_first_gen_learner: 'First-Generation Learner',
  is_indigenous: 'Indigenous',
  is_child_lgbtq: 'Child of LGBTQ+',
  is_child_pdl: 'Child of PDL',
};
```

**Fix Needed**: ⚠️ Add employee boolean fields

---

## Required Code Changes

### Change 1: Add Employee Boolean Field Labels

**File**: `project-gia/src/services/aiService.js`
**Line**: 218-228

**Add**:
```javascript
const BOOLEAN_FIELD_LABELS = {
  // Student fields
  'is_pwd': 'PWD',
  'is_child_solo_parent': 'Child of Solo Parent',
  '_ip_member?': 'IP Member',
  '_working_student?': 'Working Student',
  is_first_gen_learner: 'First-Generation Learner',
  is_indigenous: 'Indigenous',
  is_child_lgbtq: 'Child of LGBTQ+',
  is_child_pdl: 'Child of PDL',
  
  // Employee fields
  'is_emp_pwd': 'PWD Employee',
  'is_emp_senior': 'Senior/Admin Official',
};
```

### Change 2: Add Employee Boolean Aliases

**File**: `project-gia/src/services/aiService.js`
**Line**: 232-253

**Add to existing map**:
```javascript
const BOOLEAN_FIELD_ALIASES_MAP = {
  // ... existing student aliases ...
  
  // Employee boolean aliases
  'pwd employee': 'is_emp_pwd',
  'employee pwd': 'is_emp_pwd',
  'disabled employee': 'is_emp_pwd',
  'employee disability': 'is_emp_pwd',
  'senior employee': 'is_emp_senior',
  'admin official': 'is_emp_senior',
  'administrative official': 'is_emp_senior',
  'senior official': 'is_emp_senior',
};
```

### Change 3: Update Example Questions in ChatPage

**File**: `project-gia/src/pages/ChatPage.jsx`
**Line**: 127-134

**Add employee examples**:
```javascript
const exampleQuestions = [
  "Male and female students enrolled in 2024-2025",
  "PWD students by college and gender",
  "Male and female students in CCS",
  "Students by province disaggregated by sex",
  "Compare male and female enrollment across colleges",
  "Events by type and participant gender",
  // NEW: Employee examples
  "Show me the SDD breakdown of employees",
  "Teaching vs non-teaching staff by sex",
  "PWD employees by department",
  "Senior officials distribution by college",
];
```

---

## Testing Checklist

### Phase 1: Basic Functionality
- [ ] Test: "How many employees do we have?"
- [ ] Test: "Show me the SDD breakdown of employees"
- [ ] Test: "Male and female employees"
- [ ] Test: "Teaching vs non-teaching staff"
- [ ] Test: "Employees by department"

### Phase 2: Filtering
- [ ] Test: "PWD employees"
- [ ] Test: "Senior employees"
- [ ] Test: "Plantilla employees"
- [ ] Test: "Employees by salary grade"
- [ ] Test: "Employee ethnicity breakdown"

### Phase 3: Multi-Filter
- [ ] Test: "PWD employees in COE"
- [ ] Test: "Senior officials by department"
- [ ] Test: "Teaching faculty in CCS"

### Phase 4: Comparisons
- [ ] Test: "Compare employees in 2024-2025 vs 2023-2024"
- [ ] Test: "Compare COE vs CCS employees"

### Phase 5: Edge Cases
- [ ] Test with empty employee data
- [ ] Test with missing fields
- [ ] Test with old vs new field names (if applicable)

---

## Expected Behavior

### Query: "Show me the SDD breakdown of employees"

**Expected Response**:
```markdown
| Category | Male | Male % | Female | Female % | Total |
|----------|------|--------|--------|----------|-------|
| Total    | 45   | 55.6%  | 36     | 44.4%    | 81    |

The employee data shows 81 total employees with a male majority at 55.6% (45 employees) compared to 44.4% female representation (36 employees).
```

### Query: "PWD employees by department"

**Expected Response**:
```markdown
| Department | Male | Male % | Female | Female % | Total |
|------------|------|--------|--------|----------|-------|
| COE        | 2    | 66.7%  | 1      | 33.3%    | 3     |
| CCS        | 1    | 50.0%  | 1      | 50.0%    | 2     |
| CSM        | 0    | 0.0%   | 1      | 100.0%   | 1     |

PWD employees are distributed across 3 departments, with COE having the highest count at 3 employees (2 male, 1 female).
```

---

## Summary

### ✅ Good News
The system **already supports employee queries**! The infrastructure is complete:
- Field mappings ✓
- Collection detection ✓
- Sex field detection ✓
- Multi-filter support ✓
- Comparison support ✓

### ⚠️ Minor Fixes Needed
1. Add employee boolean field labels (2 fields)
2. Add employee boolean aliases (8 aliases)
3. Update example questions in ChatPage (4 examples)

### 🧪 Next Steps
1. Apply the 3 code changes above
2. Test with actual employee data
3. Verify all 15 test queries work correctly
4. Adjust prompts/labels if needed

---

## Implementation Priority

**Priority 1 (Required)**:
- Add boolean field labels for `is_emp_pwd` and `is_emp_senior`
- Add boolean aliases for employee fields

**Priority 2 (Nice to Have)**:
- Update example questions in ChatPage
- Add more natural language aliases if needed

**Priority 3 (Future Enhancement)**:
- Add employee-specific chart types in ChatChart component
- Add employee-specific insights/analysis prompts
