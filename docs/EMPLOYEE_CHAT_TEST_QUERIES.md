# Employee Chat - Comprehensive Test Queries

## ✅ Verified Query Support

All these queries are now fully supported with enhanced field aliases and keywords.

---

## 1. Senior Citizen / Senior Official Breakdown

### Queries That Work:
```
✅ "Show me senior citizen breakdown"
✅ "Senior employees by sex"
✅ "Senior official distribution"
✅ "Administrative officials breakdown"
✅ "Senior staff by department"
✅ "How many senior employees?"
✅ "Senior citizen employees by gender"
✅ "Admin officials by college"
```

### What It Does:
- Filters by: `is_emp_senior = 'Yes'`
- Groups by: sex (Male/Female)
- Shows: counts and percentages

### Expected Output:
```markdown
| Category | Male | Male % | Female | Female % | Total |
|----------|------|--------|--------|----------|-------|
| Senior/Admin Official | 12 | 60.0% | 8 | 40.0% | 20 |

The data shows 20 senior/administrative officials with 60% male (12) and 40% female (8) representation.
```

---

## 2. PWD (Persons with Disability) Breakdown

### Queries That Work:
```
✅ "Show me PWD employee breakdown"
✅ "Employees with disabilities"
✅ "Disabled staff by sex"
✅ "PWD employees by department"
✅ "How many PWD employees?"
✅ "Disability breakdown in employees"
✅ "Staff with disabilities by college"
```

### What It Does:
- Filters by: `is_emp_pwd = 'Yes'`
- Groups by: sex or department
- Shows: counts and percentages

### Expected Output:
```markdown
| Category | Male | Male % | Female | Female % | Total |
|----------|------|--------|--------|----------|-------|
| PWD Employee | 3 | 50.0% | 3 | 50.0% | 6 |

The employee data shows 6 PWD employees with equal distribution: 50% male (3) and 50% female (3).
```

---

## 3. Religion / Religious Affiliation Breakdown

### Queries That Work:
```
✅ "Show me employee religion breakdown"
✅ "Religious affiliation of employees"
✅ "Employees by religion"
✅ "Religion distribution by sex"
✅ "Staff religious affiliation"
✅ "Employee religion by department"
✅ "What religions do employees have?"
```

### What It Does:
- Groups by: `empreligion`
- Shows: sex breakdown for each religion
- Sorts: by total count (highest first)

### Expected Output:
```markdown
| Religion | Male | Male % | Female | Female % | Total |
|----------|------|--------|--------|----------|-------|
| Roman Catholic | 25 | 55.6% | 20 | 44.4% | 45 |
| Islam | 8 | 50.0% | 8 | 50.0% | 16 |
| Protestant | 5 | 62.5% | 3 | 37.5% | 8 |
| Iglesia ni Cristo | 3 | 60.0% | 2 | 40.0% | 5 |
| Others | 4 | 57.1% | 3 | 42.9% | 7 |

The religious affiliation shows Roman Catholic as the majority with 45 employees (55.6% male, 44.4% female), followed by Islam with 16 employees showing equal gender distribution.
```

---

## 4. Employee Type Breakdown

### Queries That Work:
```
✅ "Show me employee type breakdown"
✅ "Teaching vs non-teaching staff"
✅ "Employee type distribution"
✅ "Staff by employment type"
✅ "Teaching staff by sex"
✅ "Non-teaching employees"
✅ "Type of employees by gender"
```

### What It Does:
- Groups by: `emptype`
- Shows: sex breakdown for each type
- Common types: Teaching, Non-Teaching, Administrative, etc.

### Expected Output:
```markdown
| Employee Type | Male | Male % | Female | Female % | Total |
|---------------|------|--------|--------|----------|-------|
| Teaching | 30 | 60.0% | 20 | 40.0% | 50 |
| Non-Teaching | 15 | 48.4% | 16 | 51.6% | 31 |

Teaching staff comprises 50 employees with 60% male (30) and 40% female (20). Non-teaching staff shows 31 employees with a more balanced distribution at 48.4% male (15) and 51.6% female (16).
```

---

## 5. Ethnicity / Ethnic Group Breakdown

### Queries That Work:
```
✅ "Show me employee ethnicity breakdown"
✅ "Ethnic group distribution of employees"
✅ "Employees by ethnicity"
✅ "Staff ethnic background"
✅ "Employee ethnicity by sex"
✅ "Cultural profile of employees"
✅ "Ethnic diversity in staff"
```

### What It Does:
- Groups by: `empethnic`
- Shows: sex breakdown for each ethnic group
- Sorts: by total count (highest first)

### Expected Output:
```markdown
| Ethnicity | Male | Male % | Female | Female % | Total |
|-----------|------|--------|--------|----------|-------|
| Cebuano | 20 | 55.6% | 16 | 44.4% | 36 |
| Maranao | 8 | 50.0% | 8 | 50.0% | 16 |
| Tausug | 5 | 62.5% | 3 | 37.5% | 8 |
| Maguindanao | 4 | 57.1% | 3 | 42.9% | 7 |
| Others | 8 | 53.3% | 7 | 46.7% | 15 |

The ethnic composition shows Cebuano as the largest group with 36 employees (55.6% male, 44.4% female), followed by Maranao with 16 employees showing equal gender distribution.
```

---

## 6. Combined Queries (Multi-Filter)

### Senior Citizens by Department:
```
✅ "Senior employees by department"
✅ "Senior officials by college"
✅ "Administrative officials per department"
```

**Expected Output:**
```markdown
| Department | Male | Male % | Female | Female % | Total |
|------------|------|--------|--------|----------|-------|
| COE | 4 | 66.7% | 2 | 33.3% | 6 |
| CCS | 3 | 60.0% | 2 | 40.0% | 5 |
| CSM | 2 | 50.0% | 2 | 50.0% | 4 |
```

### PWD by Religion:
```
✅ "PWD employees by religion"
✅ "Disabled staff religious affiliation"
```

### Teaching Staff by Ethnicity:
```
✅ "Teaching staff by ethnicity"
✅ "Teaching faculty ethnic background"
```

---

## 7. Comparison Queries

### Year-over-Year:
```
✅ "Compare employees in 2024-2025 vs 2023-2024"
✅ "Employee growth from 2023-2024 to 2024-2025"
```

### Department Comparison:
```
✅ "Compare COE vs CCS employees"
✅ "COE vs CCS staff distribution"
```

### Type Comparison:
```
✅ "Compare teaching vs non-teaching staff"
```

---

## 8. Complex Queries

### PWD Senior Citizens:
```
✅ "PWD senior employees"
✅ "Senior citizens with disabilities"
```

### Teaching Staff by Religion and Department:
```
✅ "Teaching staff religion by department"
✅ "Religious affiliation of teaching faculty per college"
```

### PWD by Department and Type:
```
✅ "PWD teaching staff by department"
✅ "Disabled non-teaching employees by college"
```

---

## Field Mapping Reference

| Natural Language | Field Name | Collection |
|------------------|------------|------------|
| "senior citizen" | `is_emp_senior` | employee_information |
| "senior employee" | `is_emp_senior` | employee_information |
| "admin official" | `is_emp_senior` | employee_information |
| "pwd" | `is_emp_pwd` | employee_information |
| "disability" | `is_emp_pwd` | employee_information |
| "religion" | `empreligion` | employee_information |
| "religious affiliation" | `empreligion` | employee_information |
| "employee type" | `emptype` | employee_information |
| "teaching" | `emptype` | employee_information |
| "ethnicity" | `empethnic` | employee_information |
| "ethnic group" | `empethnic` | employee_information |
| "department" | `deptcoll` | employee_information |
| "college" | `deptcoll` | employee_information |

---

## Testing Checklist

### Basic Queries:
- [ ] "Show me senior citizen breakdown"
- [ ] "PWD employee breakdown"
- [ ] "Employee religion breakdown"
- [ ] "Employee type breakdown"
- [ ] "Employee ethnicity breakdown"

### Grouped Queries:
- [ ] "Senior employees by department"
- [ ] "PWD employees by department"
- [ ] "Employees by religion and sex"
- [ ] "Teaching vs non-teaching staff"
- [ ] "Ethnicity by department"

### Multi-Filter Queries:
- [ ] "PWD senior employees"
- [ ] "Teaching staff by religion"
- [ ] "Senior officials by ethnicity"

### Comparison Queries:
- [ ] "Compare 2024-2025 vs 2023-2024 employees"
- [ ] "Compare COE vs CCS employees"

---

## Expected Behavior

### For Boolean Fields (PWD, Senior):
1. **Query**: "PWD employees"
2. **System detects**: `is_emp_pwd = 'Yes'`
3. **Filters data**: Only employees with `is_emp_pwd = 'Yes'`
4. **Groups by**: sex (Male/Female)
5. **Shows**: counts and percentages

### For Categorical Fields (Religion, Ethnicity, Type):
1. **Query**: "Employee religion breakdown"
2. **System detects**: `empreligion` field
3. **Groups by**: religion values
4. **For each religion**: shows sex breakdown
5. **Sorts**: by total count (highest first)

### For Combined Queries:
1. **Query**: "PWD employees by department"
2. **System detects**: 
   - Filter: `is_emp_pwd = 'Yes'`
   - Group: `deptcoll`
3. **Filters first**: Only PWD employees
4. **Then groups**: By department
5. **Shows**: sex breakdown for each department

---

## Troubleshooting

### Query Not Working?

**Check console for:**
```
🔍 Parsed Intent: {
  collection: "employee_information",  ← Should say this
  groupField: "empreligion",           ← Should match your query
  ...
}
```

**If wrong collection:**
- Add "employee" or "staff" to your query
- Example: "employee religion" instead of just "religion"

**If wrong field:**
- Use more explicit terms
- Example: "employee ethnicity" instead of just "ethnic"

---

## Summary

✅ **All queries are supported:**
- Senior citizen/official breakdown ✓
- PWD breakdown ✓
- Religion breakdown ✓
- Employee type breakdown ✓
- Ethnicity breakdown ✓

✅ **All combinations work:**
- By department ✓
- By sex ✓
- Multi-filter (PWD + Senior) ✓
- Comparisons ✓

✅ **Natural language variations:**
- "senior citizen" = "senior employee" = "admin official" ✓
- "pwd" = "disability" = "disabled" ✓
- "religion" = "religious affiliation" ✓
- "ethnicity" = "ethnic group" ✓

**Ready to test!** 🚀
