// src/services/aiService.js
// Architecture: JavaScript computes exact numbers, AI only narrates.
// Conversation history is passed to the backend for context awareness.

const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api/chat'
  : '/api/chat';

const PARSE_INTENT_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api/parse-intent'
  : '/api/parse-intent';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

// Strips commas and normalises whitespace so minor punctuation differences
// (e.g. Oxford comma, extra spaces) don't cause false zero results.
const simplifyStr = s =>
  s.toString().trim().toLowerCase().replace(/[,;.]/g, '').replace(/\s+/g, ' ').trim();

// ─────────────────────────────────────────────────────────────
// COLLECTION CONFIG
// ─────────────────────────────────────────────────────────────

const COLLECTION_DISPLAY_NAMES = {
  student_enrollment: 'Student Enrollment',
  student_engagement: 'Student Engagement',
  employee_information: 'Employee Information',
  attendance: 'Attendance',
  events: 'Events',
};

const COLLEGE_ALIASES = {
  'college of science and mathematics': 'College of Science and Mathematics',
  'csm': 'College of Science and Mathematics',
  'college of engineering': 'College of Engineering',
  'coe': 'College of Engineering',
  'engineering': 'College of Engineering',
  'college of computer studies': 'College of Computer Studies',
  'ccs': 'College of Computer Studies',
  'computer studies': 'College of Computer Studies',
  'college of health sciences': 'College of Health Sciences',
  'chs': 'College of Health Sciences',
  'health sciences': 'College of Health Sciences',
  'college of arts and social sciences': 'College of Arts and Social Sciences',
  'cass': 'College of Arts and Social Sciences',
  'arts and social sciences': 'College of Arts and Social Sciences',
  'college of social sciences': 'College of Arts and Social Sciences',
  'college of economics, business, and accountancy': 'College of Economics, Business, and Accountancy',
  'ceba': 'College of Economics, Business, and Accountancy',
  'economics': 'College of Economics, Business, and Accountancy',
  'business': 'College of Economics, Business, and Accountancy',
  'accountancy': 'College of Economics, Business, and Accountancy',
  'college of education': 'College of Education',
  'ced': 'College of Education',
  'education': 'College of Education',
};

// Maps a stored college value (any casing, abbreviation, or minor punctuation variant)
// to the canonical full name used in COLLEGE_ALIASES values.
const canonicalizeCollege = (val) => {
  if (!val) return 'Not Specified';
  const lower = simplifyStr(val); // strip punctuation + lowercase
  // Direct alias key match (handles abbreviations like 'ceba', 'csm', etc.)
  for (const [alias, canonical] of Object.entries(COLLEGE_ALIASES)) {
    if (simplifyStr(alias) === lower) return canonical;
  }
  return val; // return as-is if no alias found (already a canonical name)
};

const FIELD_ALIASES = {
  'college': 'stud_college',
  'program': 'stud_program',
  'course': 'stud_program',
  'degree': 'stud_program',
  'year level': 'stud_yrlevel',
  'year': 'stud_yrlevel',
  'level': 'stud_yrlevel',
  'academic standing': 'academic_standing',
  'standing': 'academic_standing',
  'lister': 'academic_standing',
  'dean': 'academic_standing',
  'honor': 'academic_standing',
  'scholarship': 'scholarship_status',
  'scholar': 'scholarship_status',
  'organization': 'organizations',
  'org': 'organizations',
  'club': 'organizations',
  'publication': 'publication',
  'student council': 'student_council',
  'council': 'student_council',
  'employee type': 'employee_type',
  'employment type': 'employee_type',
  'plantilla': 'plantilla_position',
  'position': 'plantilla_position',
  'special needs': 'special_needs',
  'ethnicity': 'studethnic',
  'religion': 'studreligion',
  'income': 'income_order',
  'pwd': '_pwd?',
  'disability': '_pwd?',
  'disabled': '_pwd?',
  'solo parent': '_solo_parent?',
  'single parent': '_solo_parent?',
  'has solo parent': '_solo_parent?',
  'have solo parent': '_solo_parent?',
  'with solo parent': '_solo_parent?',
  'ip member': '_ip_member?',
  'ip': '_ip_member?',
  'lumad': '_ip_member?',
  'working student': '_working_student?',
  'working': '_working_student?',
  'first generation': 'is_first_gen_learner',
  '1st generation': 'is_first_gen_learner',
  '1st gen': 'is_first_gen_learner',
  'firstgen': 'is_first_gen_learner',
  'first gen learner': 'is_first_gen_learner',
  '1st gen learner': 'is_first_gen_learner',
  'indigenous': 'is_indigenous',
  'child lgbtq': 'is_child_lgbtq',
  'lgbtq': 'is_child_lgbtq',
  'child pdl': 'is_child_pdl',
  'pdl': 'is_child_pdl',
  'child solo parent': 'is_child_solo_parent',
  'sector': 'sector',
};

const FIELD_TO_COLLECTION = {
  stud_college: 'student_enrollment',
  stud_program: 'student_enrollment',
  stud_yrlevel: 'student_enrollment',
  studethnic: 'student_enrollment',
  studreligion: 'student_enrollment',
  studid: 'student_enrollment',
  studgender: 'student_enrollment',
  '_pwd?': 'student_enrollment',
  '_solo_parent?': 'student_enrollment',
  '_ip_member?': 'student_enrollment',
  '_working_student?': 'student_enrollment',
  is_first_gen_learner: 'student_enrollment',
  is_indigenous: 'student_enrollment',
  is_pwd: 'student_enrollment',
  is_child_lgbtq: 'student_enrollment',
  is_child_pdl: 'student_enrollment',
  is_child_solo_parent: 'student_enrollment',
  income_PSA_category: 'student_enrollment',
  academic_standing: 'student_engagement',
  scholarship_status: 'student_engagement',
  organizations: 'student_engagement',
  publication: 'student_engagement',
  student_council: 'student_engagement',
  employee_type: 'employee_information',
  plantilla_position: 'employee_information',
  special_needs: 'employee_information',
  ethnicity: 'employee_information',
  religion: 'employee_information',
  income_order: 'employee_information',
  sector: 'attendance',
  office_college: 'attendance',
};

// ─────────────────────────────────────────────────────────────
// BOOLEAN FIELD METADATA  (module-level so all functions share it)
// ─────────────────────────────────────────────────────────────

const BOOLEAN_FIELD_LABELS = {
  '_pwd?':               'PWD',
  '_solo_parent?':       'Has Solo Parent',
  '_ip_member?':         'IP Member',
  '_working_student?':   'Working Student',
  is_first_gen_learner:  'First-Generation Learner',
  is_indigenous:         'Indigenous',
  is_pwd:                'PWD',
  is_child_lgbtq:        'Child of LGBTQ+',
  is_child_pdl:          'Child of PDL',
  is_child_solo_parent:  'Child of Solo Parent',
};

// Maps natural-language keywords → boolean enrollment field names.
// Used to detect ALL conditions in one pass (multi-filter support).
const BOOLEAN_FIELD_ALIASES_MAP = {
  'pwd':                '_pwd?',
  'disability':         '_pwd?',
  'disabled':           '_pwd?',
  'solo parent':        '_solo_parent?',
  'single parent':      '_solo_parent?',
  'has solo parent':    '_solo_parent?',
  'have solo parent':   '_solo_parent?',
  'with solo parent':   '_solo_parent?',
  'ip member':          '_ip_member?',
  'ip':                 '_ip_member?',
  'lumad':              '_ip_member?',
  'working student':    '_working_student?',
  'first generation':   'is_first_gen_learner',
  '1st generation':     'is_first_gen_learner',
  '1st gen':            'is_first_gen_learner',
  'firstgen':           'is_first_gen_learner',
  'first gen learner':  'is_first_gen_learner',
  '1st gen learner':    'is_first_gen_learner',
  'indigenous':         'is_indigenous',
  'child lgbtq':        'is_child_lgbtq',
  'lgbtq':              'is_child_lgbtq',
  'child pdl':          'is_child_pdl',
  'pdl':                'is_child_pdl',
  'child solo parent':  'is_child_solo_parent',
};

// ─────────────────────────────────────────────────────────────
// CONVERSATIONAL DETECTION
// Words that suggest the message is just chat, not a data query
// ─────────────────────────────────────────────────────────────

const CONVERSATIONAL_PATTERNS = [
  /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup|yo)\b/i,
  /^(thanks|thank you|thank u|ty|thx|cheers)\b/i,
  /^(ok|okay|got it|i see|noted|alright|sure|cool|nice|great|perfect|awesome)\b/i,
  /^(bye|goodbye|see you|see ya|ciao|take care)\b/i,
  /^(who are you|what are you|what can you do|what is gia|introduce yourself)\b/i,
  /^(help|what can i ask|how do i use|what do you know)\b/i,
];

const DATA_KEYWORDS = [
  'enrollment', 'enrolled', 'enroll', 'college', 'program', 'course', 'degree',
  'year level', 'year', 'standing', 'lister', 'dean', 'honor', 'scholarship', 'scholar',
  'organization', 'org', 'club', 'publication', 'council',
  'employee', 'staff', 'faculty', 'instructor', 'professor', 'personnel', 'teacher',
  'attendance', 'attended', 'present', 'absent',
  'event', 'seminar', 'workshop', 'training',
  'pwd', 'disability', 'solo parent', 'single parent',
  'working student', 'first generation', '1st generation', '1st gen', 'first gen learner',
  'indigenous', 'lumad', 'ip member', 'lgbtq', 'pdl', 'child pdl', 'child lgbtq',
  'male', 'female', 'sex', 'gender', 'distribution', 'breakdown',
  'compare', 'comparison', 'versus', ' vs ', 'compared to', 'difference',
  'how many', 'count', 'total', 'number of', 'data', 'record', 'statistic',
  'how much', 'what is the', 'give me', 'show me', 'tell me',
  'csm', 'coe', 'ccs', 'chs', 'cass', 'ceba', 'ced',
  'engineering', 'computer', 'health', 'education', 'economics', 'business', 'science',
  'student', 'students', 'graduates', 'undergraduate',
  '2020', '2021', '2022', '2023', '2024', '2025', '2026',
  'percent', 'percentage', '%', 'ratio', 'proportion',
  'analyze', 'analyse', 'analysis', 'report', 'summary', 'overview',
];

const isConversational = (message) => {
  const lower = message.toLowerCase().trim();
  // Check explicit conversational patterns first
  if (CONVERSATIONAL_PATTERNS.some(p => p.test(lower))) return true;
  // Check if any data keyword is present
  return !DATA_KEYWORDS.some(kw => lower.includes(kw));
};

// ─────────────────────────────────────────────────────────────
// QUERY PARSER
// ─────────────────────────────────────────────────────────────

const parseQuery = (message) => {
  const lower = message.toLowerCase();

  const intent = {
    collection: null,
    groupField: null,
    filterValue: null,
    filterValues: [],
    andFilters: [],   // multi-condition AND filters [{field, value}, ...]
    academicYears: [],
    wantsSexBreakdown: false,
    wantsAll: false,
    wantsComparison: false,
    isConversational: false,
  };

  // ── Conversational check ───────────────────────────────────
  if (isConversational(message)) {
    intent.isConversational = true;
    return intent;
  }

  // ── Extract ALL academic years ─────────────────────────────
  const yearMatches = lower.matchAll(/20\d\d[-–]20\d\d/g);
  for (const match of yearMatches) {
    intent.academicYears.push(match[0].replace('–', '-'));
  }

  // ── Comparison intent ──────────────────────────────────────
  if (intent.academicYears.length > 1 ||
      /\bcompare\b|\bversus\b|\bvs\b|\bcompared to\b|\bdifference between\b|\bcontrast\b/i.test(lower)) {
    intent.wantsComparison = true;
  }

  // ── Sex breakdown intent ───────────────────────────────────
  // Triggered by gender keywords OR any breakdown/analysis request
  if (/\bmale\b|\bfemale\b|\bsex\b|\bgender\b|\bdistribution\b|\bbreakdown\b|\bby sex\b|\bper sex\b/i.test(lower)) {
    intent.wantsSexBreakdown = true;
  }

  // ── "All" intent ───────────────────────────────────────────
  if (/\ball college|\beach college|\ball program|\bper college|\bby college|\bby program|\ball year|\bevery college|\bevery program/i.test(lower)) {
    intent.wantsAll = true;
  }

  // ── Collection detection ───────────────────────────────────
  // Employee/faculty/staff
  if (/\bemployee|\bstaff|\bfaculty|\binstructor|\bprofessor|\bpersonnel|\bteacher|\bworker/i.test(lower)) {
    intent.collection = 'employee_information';
  }
  // Engagement (checked before enrollment to avoid overlap on shared words)
  else if (/\bengagement|\bacademic standing|\bstanding|\blister|\bdean.?s list|\bhonor|\bscholarship|\bscholar|\borganization|\bpublication|\bstudent council/i.test(lower)) {
    intent.collection = 'student_engagement';
  }
  // Attendance
  else if (/\battendance|\battended|\bpresent|\babsent/i.test(lower)) {
    intent.collection = 'attendance';
  }
  // Events
  else if (/\bevent|\bseminar|\bworkshop|\btraining|\bsymposium/i.test(lower)) {
    intent.collection = 'events';
  }
  // Enrollment — broadest, catches natural phrases like "how many students in COE"
  else if (/\benrollment|\benrolled|\benroll|\bcollege|\bprogram|\bcourse|\bdegree|\bstudent|\bundergraduate|\byear level|\bpwd|\bsolo parent|\bworking student|\bfirst gen|\bindigenous|\blgbtq|\bpdl/i.test(lower)) {
    intent.collection = 'student_enrollment';
  }

  // ── Field detection ────────────────────────────────────────
  for (const [alias, field] of Object.entries(FIELD_ALIASES)) {
    if (lower.includes(alias)) {
      intent.groupField = field;
      if (!intent.collection && FIELD_TO_COLLECTION[field]) {
        intent.collection = FIELD_TO_COLLECTION[field];
      }
      break;
    }
  }

  // ── Multi-condition boolean detection ─────────────────────
  // Scan ALL boolean aliases in one pass so cross-field questions
  // like "PWD students in CEBA with solo parent households" work.
  // Short single-word aliases that need word-boundary matching to avoid
  // false positives inside longer words (e.g. 'ip' inside 'script').
  // Multi-word aliases (e.g. 'solo parent') use includes() so plurals still match.
  const WORD_BOUNDARY_ALIASES = new Set(['ip', 'pwd', 'pdl']);
  const detectedBooleans = new Set();
  for (const [alias, field] of Object.entries(BOOLEAN_FIELD_ALIASES_MAP)) {
    let matched;
    if (WORD_BOUNDARY_ALIASES.has(alias)) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matched = new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
    } else {
      matched = lower.includes(alias);
    }
    if (matched) detectedBooleans.add(field);
  }
  for (const field of detectedBooleans) {
    intent.andFilters.push({ field, value: 'Yes' });
    intent.collection = intent.collection || 'student_enrollment';
    intent.wantsSexBreakdown = true;
  }

  // Backward-compat: single boolean → also set groupField/filterValue
  // so the old single-filter path still works for simple queries.
  const BOOLEAN_FIELD_KEYS = new Set(Object.values(BOOLEAN_FIELD_ALIASES_MAP));
  if (intent.groupField && BOOLEAN_FIELD_KEYS.has(intent.groupField)) {
    intent.filterValue = 'Yes';
    intent.wantsSexBreakdown = true;
  }

  // ── College detection — collect ALL mentioned colleges ─────
  for (const [alias, fullName] of Object.entries(COLLEGE_ALIASES)) {
    if (lower.includes(alias)) {
      if (!intent.filterValues.includes(fullName)) {
        intent.filterValues.push(fullName);
      }
      intent.collection = intent.collection || 'student_enrollment';
    }
  }

  // Single college → normal filter; also add to andFilters when combined with boolean conditions
  if (intent.filterValues.length === 1) {
    intent.filterValue = intent.filterValues[0];
    intent.groupField = intent.groupField || 'stud_college';
    if (intent.andFilters.length > 0) {
      intent.andFilters.push({ field: 'stud_college', value: intent.filterValues[0] });
    }
  }
  // Multiple colleges → comparison mode
  else if (intent.filterValues.length > 1) {
    intent.wantsComparison = true;
    intent.groupField = intent.groupField || 'stud_college';
  }

  // ── Default group field for enrollment ────────────────────
  if (!intent.groupField && intent.collection === 'student_enrollment') {
    intent.groupField = 'stud_college';
    intent.wantsAll = true;
  }

  // ── Default sex breakdown for any breakdown/analysis request
  if (/\bbreakdown|\banalysis|\banalyze|\banalyse|\bdistribution|\breport|\bsummary|\boverview/i.test(lower)) {
    intent.wantsSexBreakdown = true;
  }

  return intent;
};

// ─────────────────────────────────────────────────────────────
// DATA COMPUTER
// ─────────────────────────────────────────────────────────────

const computeForDocs = (docs, groupField, filterValue, wantsSexBreakdown, sexField) => {
  let filtered = docs;
  if (filterValue && groupField) {
    const needle = simplifyStr(filterValue);
    filtered = docs.filter(d => {
      const val = d[groupField];
      if (val === undefined || val === null) return false;
      return simplifyStr(val) === needle;
    });
  }

  const result = { totalRecords: filtered.length, data: {} };

  const displayKey = (filterValue === 'Yes' && BOOLEAN_FIELD_LABELS[groupField])
    ? BOOLEAN_FIELD_LABELS[groupField]
    : filterValue || 'Total';

  if (!groupField || filterValue) {
    const key = displayKey;
    if (wantsSexBreakdown && sexField) {
      const sexCounts = {};
      filtered.forEach(d => {
        const s = d[sexField] || 'Unknown';
        sexCounts[s] = (sexCounts[s] || 0) + 1;
      });
      const total = filtered.length;
      const out = {};
      Object.entries(sexCounts).forEach(([sex, count]) => {
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
        out[sex] = count;
        out[`${sex} %`] = `${pct}%`;
      });
      result.data[key] = { ...out, Total: total };
    } else {
      result.data[key] = { Total: filtered.length };
    }
  } else {
    const grouped = {};
    filtered.forEach(d => {
      const groupVal = d[groupField] || 'Unknown';
      if (!grouped[groupVal]) grouped[groupVal] = [];
      grouped[groupVal].push(d);
    });

    Object.entries(grouped).forEach(([groupVal, groupDocs]) => {
      if (wantsSexBreakdown && sexField) {
        const sexCounts = {};
        groupDocs.forEach(d => {
          const s = d[sexField] || 'Unknown';
          sexCounts[s] = (sexCounts[s] || 0) + 1;
        });
        const total = groupDocs.length;
        const out = {};
        Object.entries(sexCounts).forEach(([sex, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          out[sex] = count;
          out[`${sex} %`] = `${pct}%`;
        });
        result.data[groupVal] = { ...out, Total: total };
      } else {
        result.data[groupVal] = { Total: groupDocs.length };
      }
    });
  }

  return result;
};

// Applies multiple AND conditions and returns counts (with optional sex breakdown).
const computeMultiFilter = (docs, andFilters, wantsSexBreakdown, sexField) => {
  const filtered = docs.filter(d =>
    andFilters.every(({ field, value }) => {
      const val = d[field];
      if (val === undefined || val === null) return false;
      return simplifyStr(String(val)) === simplifyStr(value);
    })
  );

  // Build a human-readable label: abbreviate college, use labels for boolean fields
  const label = andFilters.map(({ field, value }) => {
    if (field === 'stud_college') {
      // Find the shortest alias (abbreviation) for this college
      const abbrev = Object.entries(COLLEGE_ALIASES)
        .find(([a, n]) => n === value && a.length <= 4);
      return abbrev ? abbrev[0].toUpperCase() : value;
    }
    return BOOLEAN_FIELD_LABELS[field] || field;
  }).join(' + ');

  const total = filtered.length;
  const result = { totalRecords: total, data: {} };

  if (wantsSexBreakdown && sexField) {
    const sexCounts = {};
    filtered.forEach(d => {
      const s = d[sexField] || 'Unknown';
      sexCounts[s] = (sexCounts[s] || 0) + 1;
    });
    const out = {};
    Object.entries(sexCounts).forEach(([sex, count]) => {
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
      out[sex] = count;
      out[`${sex} %`] = `${pct}%`;
    });
    result.data[label] = { ...out, Total: total };
  } else {
    result.data[label] = { Total: total };
  }

  return result;
};

const computeAnswer = (intent, dbData) => {
  const {
    collection, groupField, filterValue, filterValues,
    academicYears, wantsSexBreakdown, wantsComparison, wantsAll,
  } = intent;

  if (!collection || !dbData[collection]) {
    return { error: 'Could not determine which dataset to use for this question.' };
  }

  const rawDocs = dbData[collection];

  // Converts any truthy representation (boolean true, "true", "1", "y") to "Yes"/"No" string.
  // Needed because old records may store booleans instead of "Yes"/"No" strings.
  const nb = v => (v === 'Yes' || v === true || v === 'yes' || v === 'true' || v === '1' || v === 1) ? 'Yes' : 'No';

  // Normalize student_enrollment records so old (pre-2026) and new field names both resolve
  const allDocs = collection === 'student_enrollment'
    ? rawDocs.map(r => ({
        ...r,
        stud_college:         canonicalizeCollege(r.stud_college || r.college),
        stud_program:         r.stud_program          || r.program         || 'Not Specified',
        stud_yrlevel:         r.stud_yrlevel          || r.year_level      || 'Not Specified',
        studethnic:           r.studethnic            || r.ethnicity       || 'Not Specified',
        studreligion:         r.studreligion          || r.religion        || 'Not Specified',
        studid:               r.studid                || r.student_id      || 'N/A',
        studgender:           r.studgender            || r.sex             || 'Unknown',
        currentadd_prov:      r.currentadd_prov       || r.place_of_origin || 'Not Specified',
        is_first_gen_learner: nb(r.is_first_gen_learner ?? r['_first_generation?']),
        '_pwd?':              nb(r['_pwd?'] ?? r.is_pwd),
        '_solo_parent?':      nb(r['_solo_parent?'] ?? r.is_solo_parent),
        '_ip_member?':        nb(r['_ip_member?'] ?? r.is_ip_member),
        '_working_student?':  nb(r['_working_student?'] ?? r.is_working_student),
      }))
    : rawDocs;

  const displayName = COLLECTION_DISPLAY_NAMES[collection] || collection;
  const sexField = allDocs[0]?.studgender !== undefined ? 'studgender'
    : allDocs[0]?.sex !== undefined ? 'sex'
    : allDocs[0]?.gender !== undefined ? 'gender'
    : null;

  // Default to most recent AY when none specified — prevents mixing records
  // across academic years (data sheet always scopes to one AY, GIA should too)
  const allYears = [...new Set(allDocs.map(d => d.academicYear).filter(Boolean))].sort();
  const latestYear = allYears[allYears.length - 1] ?? null;
  const resolvedYears = academicYears.length > 0
    ? academicYears
    : (latestYear ? [latestYear] : []);

  // ── Multi-condition AND filter (cross-field intersection) ─────
  // Triggered when the query mentions 2+ conditions simultaneously
  // e.g. "PWD students in CEBA who are also solo parents"
  const { andFilters = [] } = intent;
  if (andFilters.length >= 1) {
    // Year-by-year comparison with multi-filter
    if (wantsComparison && academicYears.length > 0) {
      const yearsToUse = academicYears.length === 1
        ? [...new Set(allDocs.map(d => d.academicYear).filter(Boolean))].sort()
        : academicYears;
      const yearResults = {};
      yearsToUse.forEach(year => {
        const yearDocs = allDocs.filter(d => d.academicYear === year);
        if (yearDocs.length > 0) {
          yearResults[year] = computeMultiFilter(yearDocs, andFilters, wantsSexBreakdown, sexField);
        }
      });
      return { collection: displayName, isComparison: true, isCollegeComparison: false, isMultiFilter: true, andFilters, sexField, yearResults };
    }

    // Single period multi-filter
    let docs = allDocs;
    if (resolvedYears.length === 1) {
      const ay = allDocs.filter(d => d.academicYear === resolvedYears[0]);
      docs = ay.length > 0 ? ay : allDocs;
    }

    // College breakdown: user asked "from what colleges" / "by college" / "per college"
    const wantsCollegeGrouping = groupField === 'stud_college' || wantsAll;
    if (wantsCollegeGrouping) {
      const colleges = [...new Set(docs.map(d => d.stud_college).filter(Boolean))].sort();
      const collegeResults = {};
      let grandTotal = 0;
      colleges.forEach(college => {
        const collegeDocs = docs.filter(d => d.stud_college === college);
        const c = computeMultiFilter(collegeDocs, andFilters, wantsSexBreakdown, sexField);
        if (c.totalRecords > 0) {
          collegeResults[college] = c;
          grandTotal += c.totalRecords;
        }
      });
      return {
        collection: displayName,
        academicYear: resolvedYears[0] || 'All Years',
        isMultiFilter: true,
        isGroupedByCollege: true,
        andFilters,
        sexField,
        grandTotal,
        collegeResults,
      };
    }

    const computed = computeMultiFilter(docs, andFilters, wantsSexBreakdown, sexField);
    return {
      collection: displayName,
      academicYear: resolvedYears[0] || 'All Years',
      isComparison: false,
      isMultiFilter: true,
      andFilters,
      sexField,
      totalRecords: computed.totalRecords,
      data: computed.data,
    };
  }

  // ── Multi-college comparison ───────────────────────────────
  if (wantsComparison && filterValues.length > 1) {
    const collegeResults = {};
    filterValues.forEach(collegeName => {
      let docs = allDocs;
      if (resolvedYears.length === 1) {
        const filtered = allDocs.filter(d => d.academicYear === resolvedYears[0]);
        docs = filtered.length > 0 ? filtered : allDocs;
      }
      const computed = computeForDocs(docs, 'stud_college', collegeName, wantsSexBreakdown, sexField);
      collegeResults[collegeName] = computed;
    });

    return {
      collection: displayName,
      academicYear: resolvedYears[0] || 'All Years',
      isComparison: true,
      isCollegeComparison: true,
      groupField,
      filterValues,
      sexField,
      collegeResults,
    };
  }

  // ── Year-by-year comparison ────────────────────────────────
  if (wantsComparison && resolvedYears.length > 0) {
    const yearsToUse = resolvedYears.length === 1
      ? allYears
      : resolvedYears;
    const yearResults = {};
    yearsToUse.forEach(year => {
      const yearDocs = allDocs.filter(d => d.academicYear === year);
      if (yearDocs.length > 0) {
        yearResults[year] = computeForDocs(yearDocs, groupField, filterValue, wantsSexBreakdown, sexField);
      }
    });
    return { collection: displayName, isComparison: true, isCollegeComparison: false, groupField, filterValue, sexField, yearResults };
  }

  // ── Single query ───────────────────────────────────────────
  let docs = allDocs;
  if (resolvedYears.length === 1) {
    const filtered = allDocs.filter(d => d.academicYear === resolvedYears[0]);
    docs = filtered.length > 0 ? filtered : allDocs;
  }

  const computed = computeForDocs(docs, groupField, filterValue, wantsSexBreakdown, sexField);

  return {
    collection: displayName,
    academicYear: resolvedYears[0] || 'All Years',
    isComparison: false,
    groupField,
    filterValue,
    sexField,
    totalRecords: computed.totalRecords,
    data: computed.data,
  };
};

// ─────────────────────────────────────────────────────────────
// RESULT FORMATTER
// ─────────────────────────────────────────────────────────────

const formatResultForAI = (result) => {
  if (result.error) return `DATA ERROR: ${result.error}`;

  let text = `=== COMPUTED DATA (100% ACCURATE — DO NOT MODIFY THESE NUMBERS) ===\n\n`;
  text += `Dataset: ${result.collection}\n`;

  if (result.isMultiFilter && result.isGroupedByCollege) {
    const filterLabel = result.andFilters
      .map(({ field }) => BOOLEAN_FIELD_LABELS[field] || field)
      .join(' + ');
    text += `Academic Year: ${result.academicYear}\n`;
    text += `Filter: ${filterLabel}\n`;
    text += `Grand Total matching both conditions: ${result.grandTotal}\n\n`;
    text += `BREAKDOWN BY COLLEGE (sorted highest to lowest):\n`;
    Object.entries(result.collegeResults)
      .sort(([, a], [, b]) => b.totalRecords - a.totalRecords)
      .forEach(([college, collegeData]) => {
        text += `\n${college}:\n`;
        Object.entries(collegeData.data).forEach(([, counts]) => {
          Object.entries(counts).forEach(([key, val]) => {
            text += `  ${key}: ${val}\n`;
          });
        });
      });
  } else if (result.isComparison && result.isCollegeComparison) {
    text += `Mode: College-by-College Comparison\n`;
    text += `Academic Year: ${result.academicYear}\n\n`;
    Object.entries(result.collegeResults)
      .sort(([, a], [, b]) => b.totalRecords - a.totalRecords)
      .forEach(([college, collegeData]) => {
        text += `--- ${college} (${collegeData.totalRecords} records) ---\n`;
        Object.entries(collegeData.data).forEach(([category, counts]) => {
          text += `  ${category}:\n`;
          Object.entries(counts).forEach(([key, val]) => {
            text += `    ${key}: ${val}\n`;
          });
        });
        text += `\n`;
      });
  } else if (result.isComparison) {
    text += `Mode: Year-by-Year Comparison\n`;
    if (result.filterValue) text += `Filter: ${result.groupField} = "${result.filterValue}"\n`;
    text += `\n`;
    Object.entries(result.yearResults).forEach(([year, yearData]) => {
      text += `--- Academic Year: ${year} (${yearData.totalRecords} records) ---\n`;
      Object.entries(yearData.data).forEach(([category, counts]) => {
        text += `  ${category}:\n`;
        Object.entries(counts).forEach(([key, val]) => {
          text += `    ${key}: ${val}\n`;
        });
      });
      text += `\n`;
    });
  } else {
    text += `Academic Year: ${result.academicYear}\n`;
    text += `Total Records in scope: ${result.totalRecords}\n`;
    if (result.filterValue) text += `Filter: ${result.groupField} = "${result.filterValue}"\n`;
    text += `\nEXACT COUNTS (sorted highest to lowest total):\n`;
    Object.entries(result.data)
      .sort(([, a], [, b]) => (b.Total || 0) - (a.Total || 0))
      .forEach(([category, counts]) => {
        text += `\n${category}:\n`;
        Object.entries(counts).forEach(([key, val]) => {
          text += `  ${key}: ${val}\n`;
        });
      });
  }

  text += `\n=== END OF COMPUTED DATA ===\n`;
  return text;
};

// ─────────────────────────────────────────────────────────────
// POST-PROCESSING — strip interpretive sentences
// ─────────────────────────────────────────────────────────────

const INTERPRETIVE_PATTERNS = [
  /[^.!?]*\bthis (suggests?|indicates?|implies?|may indicate|may suggest|could suggest|could indicate|points? to)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bthis (disparity|difference|gap|distribution|pattern|trend)\b[^.!?]*(suggests?|indicates?|implies?|reflects?|shows?|means?)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\b(may|might|could|can)\b[^.!?]*(suggest|indicate|imply|reflect|mean|be due to|be attributed)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bit is (worth noting|notable|interesting|important to note)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\b(further (analysis|study|research|investigation))\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bthis distribution highlights\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bhighlights the importance of\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bunderstanding (gender|this|the) (representation|distribution|data|pattern)\b[^.!?]*[.!?]/gi,
  /^[^.!?\n]*\b(here'?s?|below is|the following|i('ve| have) prepared|based on the (data|computed|provided))[^.!?]*[.!?]\s*/gi,
  /[^.!?]*\b(as shown (above|in the table|below)|as you can see|in summary|to summarize|in conclusion|overall,)[^.!?]*[.!?]\s*$/gi,
];

const stripInterpretiveSentences = (text) => {
  let cleaned = text;
  for (const pattern of INTERPRETIVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
};

// ─────────────────────────────────────────────────────────────
// FETCH WITH RETRY
// ─────────────────────────────────────────────────────────────

const fetchWithRetry = async (url, options, retries = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      const status = response.status;
      console.warn(`⚠️ Attempt ${attempt}/${retries} failed with status ${status}`);

      if (status >= 400 && status < 500 && status !== 429) return response;
      if (attempt === retries) return response;

      const wait = status === 429 ? delayMs * 2 : delayMs;
      console.log(`⏳ Waiting ${wait / 1000}s before retry...`);
      await new Promise(r => setTimeout(r, wait));

    } catch (networkError) {
      console.warn(`⚠️ Attempt ${attempt}/${retries} — network error:`, networkError.message);
      if (attempt === retries) throw networkError;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
};

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// LLM-BASED INTENT PARSER  (falls back to keyword matching)
// ─────────────────────────────────────────────────────────────

const parseQueryWithLLM = async (message) => {
  try {
    const res = await fetch(PARSE_INTENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`parse-intent ${res.status}`);
    const intent = await res.json();
    if (typeof intent.isConversational !== 'boolean') throw new Error('invalid shape');

    // Ensure arrays are always present
    intent.andFilters   = intent.andFilters   || [];
    intent.filterValues = intent.filterValues || [];
    intent.academicYears = intent.academicYears || [];

    // Single college + boolean filters → add college to andFilters so the
    // multi-filter engine intersects correctly (mirrors keyword-matching logic)
    if (intent.filterValues.length === 1 && intent.andFilters.length > 0) {
      if (!intent.andFilters.find(f => f.field === 'stud_college')) {
        intent.andFilters.push({ field: 'stud_college', value: intent.filterValues[0] });
      }
    }

    // Multiple colleges always means comparison
    if (intent.filterValues.length > 1) intent.wantsComparison = true;

    return intent;
  } catch (e) {
    console.warn('⚠️ LLM intent parsing failed, falling back to keyword matching:', e.message);
    return parseQuery(message);
  }
};

export const analyzeWithAI = async (userMessage, dbData, _history = []) => {
  try {
    const intent = await parseQueryWithLLM(userMessage);

    // ── Conversational — send directly, no data computation ──
    if (intent.isConversational) {
      // History is stored in Firebase for display only.
      // No history is sent to Groq — every request is stateless.
      const response = await fetchWithRetry(
        API_URL,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, history: [] }),
        },
        3, 3000
      );
      if (!response.ok) {
        if (response.status === 500 || response.status === 503)
          return { reply: "I'm currently unavailable due to high server demand. Please try again in 20–30 seconds.", chartData: null };
        if (response.status === 429)
          return { reply: "I've hit the rate limit for requests. Please wait a moment and try again.", chartData: null };
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return { reply: data.reply || "Hi there! How can I help you today?", chartData: null };
    }

    // ── Data query — compute then send to AI ─────────────────
    const computedResult = computeAnswer(intent, dbData);
    let computedText = formatResultForAI(computedResult);

    // Groq compound-beta has an 8192-token context window. Cap the computed
    // data at 8000 chars so the full payload stays well under the limit.
    const MAX_DATA_CHARS = 8000;
    if (computedText.length > MAX_DATA_CHARS) {
      computedText = computedText.substring(0, MAX_DATA_CHARS) +
        '\n[...data truncated for size — show only what is available above]\n=== END OF COMPUTED DATA ===';
    }

    const enrichedMessage = `${computedText}

USER QUESTION: ${userMessage}

INSTRUCTIONS:
- Use ONLY the numbers from the COMPUTED DATA section above.
- Present a markdown table first. Always. Use proper pipe | syntax with a header row, a separator row (---|---|---), and one data row per group. Never write values inline like "Male: 5, Female: 9" — every value must be in its own cell.
- Always add a narrative paragraph after the table. Walk through the numbers naturally in plain language.
- Never modify, recalculate, or derive any figure.
- Never open with a preamble or close with a summary remark.
- Use college abbreviations (CSM, COE, CCS, CHS, CASS, CEBA, CED).
- Never expose internal field names or collection names.
`;

    const response = await fetchWithRetry(
      API_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Data queries are self-contained (computed data provides full context),
        // so history is omitted to avoid exceeding Groq's request size limit.
        body: JSON.stringify({ message: enrichedMessage, history: [] }),
      },
      3, 3000
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 500 || status === 503)
        return { reply: "I'm currently unavailable due to high server demand. Please try again in 20–30 seconds.", chartData: null };
      if (status === 429)
        return { reply: "I've hit the rate limit for requests. Please wait a moment and try again.", chartData: null };
      throw new Error(`API error: ${status}`);
    }

    const data = await response.json();
    if (data.reply) return { reply: stripInterpretiveSentences(data.reply), chartData: computedResult.error ? null : computedResult };
    throw new Error('No reply in response');

  } catch (error) {
    console.error('❌ Error calling AI service:', error);
    return { reply: "I'm having trouble connecting to the server right now. Please check your connection and try again.", chartData: null };
  }
};

// ─────────────────────────────────────────────────────────────
// LEGACY EXPORTS
// ─────────────────────────────────────────────────────────────

export const prepareDataContext = (dbData) => {
  let context = '=== MSU-IIT GADC DATABASE OVERVIEW ===\n\n';
  for (const [col, docs] of Object.entries(dbData)) {
    const name = COLLECTION_DISPLAY_NAMES[col] || col;
    context += `${name}: ${docs.length} records\n`;
  }
  return context;
};

export const extractRelevantData = (_userMessage, dbData) => dbData;

export const generateMarkdownTable = (data, fields) => {
  if (!data || data.length === 0) return '';
  let table = '| ' + fields.join(' | ') + ' |\n';
  table += '| ' + fields.map(() => '---').join(' | ') + ' |\n';
  data.slice(0, 10).forEach(row => {
    const values = fields.map(field => {
      const value = row[field];
      if (value === undefined || value === null) return '-';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    table += '| ' + values.join(' | ') + ' |\n';
  });
  if (data.length > 10) table += `\n*Showing 10 of ${data.length} records*\n`;
  return table;
};

export const aggregateData = (data, groupByField, aggregateField = null, operation = 'count') => {
  const groups = {};
  data.forEach(doc => {
    const groupValue = doc[groupByField] || 'Unknown';
    if (!groups[groupValue]) groups[groupValue] = [];
    groups[groupValue].push(doc);
  });
  const results = {};
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    switch (operation) {
      case 'count': results[key] = group.length; break;
      case 'sum': results[key] = group.reduce((sum, doc) => sum + (doc[aggregateField] || 0), 0); break;
      case 'avg':
        const sum = group.reduce((s, doc) => s + (doc[aggregateField] || 0), 0);
        results[key] = sum / group.length; break;
      case 'min': results[key] = Math.min(...group.map(doc => doc[aggregateField] || Infinity)); break;
      case 'max': results[key] = Math.max(...group.map(doc => doc[aggregateField] || -Infinity)); break;
    }
  });
  return results;
};

export const formatAggregationTable = (aggregatedData, keyLabel = 'Category', valueLabel = 'Value') => {
  let table = `| ${keyLabel} | ${valueLabel} |\n`;
  table += '|---|---|\n';
  Object.entries(aggregatedData).forEach(([key, value]) => {
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
    table += `| ${key} | ${formattedValue} |\n`;
  });
  return table;
};

// Ycon was here