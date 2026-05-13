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
  // ── EMPLOYEE INFORMATION (CHECK FIRST) ─────────────────────
  // Employee fields are checked FIRST to take precedence over student fields
  'employee id': 'empId',
  'emp id': 'empId',
  'staff id': 'empId',
  'employee gender': 'empgender',
  'employee sex': 'empgender',
  'emp gender': 'empgender',
  'emp sex': 'empgender',
  'staff gender': 'empgender',
  'staff sex': 'empgender',
  'employee type': 'emptype',
  'employment type': 'emptype',
  'emp type': 'emptype',
  'staff type': 'emptype',
  'type of employee': 'emptype',
  'plantilla': 'emp_plantilla',
  'plantilla position': 'emp_plantilla',
  'permanent position': 'emp_plantilla',
  'salary grade': 'empsalary_grade',
  'income': 'empsalary_grade',
  'salary': 'empsalary_grade',
  'grade': 'empsalary_grade',
  'employee ethnicity': 'empethnic',
  'emp ethnicity': 'empethnic',
  'staff ethnicity': 'empethnic',
  'employee religion': 'empreligion',
  'emp religion': 'empreligion',
  'staff religion': 'empreligion',
  'senior': 'is_emp_senior',
  'senior employee': 'is_emp_senior',
  'senior citizen': 'is_emp_senior',
  'senior staff': 'is_emp_senior',
  'administrative official': 'is_emp_senior',
  'admin official': 'is_emp_senior',
  'employee pwd': 'is_emp_pwd',
  'staff pwd': 'is_emp_pwd',
  'department': 'deptcoll',
  'employee department': 'deptcoll',
  'staff department': 'deptcoll',
  'dept college': 'deptcoll',
  'department code': 'deptcode',
  'dept code': 'deptcode',

  // ── STUDENT ENROLLMENT ──────────────────────────────────────
  'college': 'stud_college',
  'program': 'stud_program',
  'course': 'stud_program',
  'degree': 'stud_program',
  'year level': 'stud_yrlevel',
  'level': 'stud_yrlevel',
  'student gender': 'studgender',
  'student sex': 'studgender',
  'preferred pronouns': 'preferred_pronouns',
  'legal status': 'studlegstatus',
  'student ethnicity': 'studethnic',
  'student religion': 'studreligion',
  'country': 'currentadd_country',
  'current country': 'currentadd_country',
  'province': 'currentadd_prov',
  'current province': 'currentadd_prov',
  'indigenous group': 'indigenous_group',
  'ip group': 'indigenous_group',
  'tribe': 'indigenous_group',
  'disability type': 'pwd_aspect',
  'disability aspect': 'pwd_aspect',
  'pwd type': 'pwd_aspect',
  'student pwd': 'is_pwd',
  'student disability': 'is_pwd',
  'solo parent': 'is_child_solo_parent',
  'single parent': 'is_child_solo_parent',

  // ── AMBIGUOUS FIELDS (default to employee when collection is detected) ──
  'ethnicity': 'empethnic',        // Defaults to employee
  'ethnic group': 'empethnic',     // Defaults to employee
  'ethnic': 'empethnic',           // Defaults to employee
  'religion': 'empreligion',       // Defaults to employee
  'religious affiliation': 'empreligion', // Defaults to employee
  'gender': 'empgender',           // Defaults to employee
  'sex': 'empgender',              // Defaults to employee
  'pwd': 'is_emp_pwd',             // Defaults to employee
  'disability': 'is_emp_pwd',      // Defaults to employee
  'disabled': 'is_emp_pwd',        // Defaults to employee
  'pronouns': 'preferred_pronouns',

  // ── EVENTS ──────────────────────────────────────────────────
  'event type': 'eventType',
  'type': 'eventType',
  'event mode': 'mode',
  'mode': 'mode',
  'venue': 'venue',
  'location': 'venue',
  'place': 'venue',
  'organizer': 'organizer',
  'organized by': 'organizer',
  'event status': 'status',
  'status': 'status',
  'target group': 'targetGroup',
  'target': 'targetGroup',
  'participants': 'targetParticipants',
  'target participants': 'targetParticipants',
  'budget': 'budget',
  'funding': 'fundingSource',
  'funding source': 'fundingSource',
  'partner agencies': 'partnerAgencies',
  'partners': 'partnerAgencies',
  'gad mandate': 'gadMandate',
  'mandate': 'gadMandate',
  'has solo parent': 'is_child_solo_parent',
  'have solo parent': 'is_child_solo_parent',
  'with solo parent': 'is_child_solo_parent',
  'ip member': '_ip_member?',
  'ip': '_ip_member?',
  'lumad': '_ip_member?',
  'working student': '_working_student?',
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

  // ── ATTENDANCE ──────────────────────────────────────────────
  'sector': 'sector',
};

const FIELD_TO_COLLECTION = {
  stud_college: 'student_enrollment',
  stud_program: 'student_enrollment',
  stud_yrlevel: 'student_enrollment',
  studgender: 'student_enrollment',
  preferred_pronouns: 'student_enrollment',
  studlegstatus: 'student_enrollment',
  studethnic: 'student_enrollment',
  studreligion: 'student_enrollment',
  currentadd_country: 'student_enrollment',
  currentadd_prov: 'student_enrollment',
  indigenous_group: 'student_enrollment',
  pwd_aspect: 'student_enrollment',
  is_pwd: 'student_enrollment',
  is_child_solo_parent: 'student_enrollment',
  '_ip_member?': 'student_enrollment',
  '_working_student?': 'student_enrollment',
  is_first_gen_learner: 'student_enrollment',
  is_indigenous: 'student_enrollment',
  is_pwd: 'student_enrollment',
  is_child_lgbtq: 'student_enrollment',
  is_child_pdl: 'student_enrollment',
  is_child_solo_parent: 'student_enrollment',
  income_PSA_category: 'student_enrollment',
  empId: 'employee_information',
  empgender: 'employee_information',
  preferred_pronouns: 'employee_information',
  emptype: 'employee_information',
  emp_plantilla: 'employee_information',
  empsalary_grade: 'employee_information',
  empethnic: 'employee_information',
  empreligion: 'employee_information',
  is_emp_senior: 'employee_information',
  is_emp_pwd: 'employee_information',
  deptcoll: 'employee_information',
  deptcode: 'employee_information',
  sector: 'attendance',
  office_college: 'attendance',
  // ── EVENTS ──────────────────────────────────────────────────
  eventType: 'events',
  mode: 'events',
  venue: 'events',
  organizer: 'events',
  status: 'events',
  targetGroup: 'events',
  targetParticipants: 'events',
  budget: 'events',
  fundingSource: 'events',
  partnerAgencies: 'events',
  gadMandate: 'events',
};

// ─────────────────────────────────────────────────────────────
// BOOLEAN FIELD METADATA  (module-level so all functions share it)
// ─────────────────────────────────────────────────────────────

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

// Maps natural-language keywords → boolean enrollment field names.
// Used to detect ALL conditions in one pass (multi-filter support).
const BOOLEAN_FIELD_ALIASES_MAP = {
  // Student fields
  'pwd': 'is_pwd',
  'disability': 'is_pwd',
  'disabled': 'is_pwd',
  'solo parent': 'is_child_solo_parent',
  'single parent': 'is_child_solo_parent',
  'has solo parent': 'is_child_solo_parent',
  'have solo parent': 'is_child_solo_parent',
  'with solo parent': 'is_child_solo_parent',
  'ip member': '_ip_member?',
  'ip': '_ip_member?',
  'lumad': '_ip_member?',
  'working student': '_working_student?',
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

  // Employee fields
  'pwd employee': 'is_emp_pwd',
  'employee pwd': 'is_emp_pwd',
  'disabled employee': 'is_emp_pwd',
  'employee disability': 'is_emp_pwd',
  'staff pwd': 'is_emp_pwd',
  'senior employee': 'is_emp_senior',
  'admin official': 'is_emp_senior',
  'administrative official': 'is_emp_senior',
  'senior official': 'is_emp_senior',
  'senior staff': 'is_emp_senior',
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

// Predictive / out-of-scope patterns — caught before data computation so GIA
// declines cleanly instead of computing data and then half-refusing.
const OUT_OF_SCOPE_PATTERNS = [
  // Predictive analytics
  /\b(project|projection|projections|forecast|forecasts|predict|prediction|predictions|estimate|estimates)\b/i,
  /\btrend(s)?\s+(into|for|through|until|up to|by)\s+20\d\d/i,
  /\b(future|upcoming)\s+(enrollment|students|count|number)/i,
  /\bin\s+20(2[6-9]|[3-9]\d)\b/i,
  /\bby\s+(the\s+)?(year\s+)?20(2[6-9]|[3-9]\d)\b/i,
  /\bfrom\s+20\d\d\s+(to|-)\s+20(2[6-9]|[3-9]\d)\b/i,

  // Administrative / procedural questions about MSU-IIT
  // Use non-adjacent patterns so intervening words (e.g. "freshman") don't break the match
  /\badmission(s)?\b/i,  // any mention of "admission" is administrative, not GADC data
  /\bhow\s+(do|can|does|to)\s+(i|you|one|students?)\s+(apply|enroll|register|qualify|get\s+in|be\s+admitted)\b/i,
  /\b(entrance|qualifying)\s+(exam|test|examination|criteria|requirement)\b/i,
  /\b(application)\s+(process|form|requirement|for\s+admission)\b/i,
  /\bapply\s+(for|to)\s+(msu-?iit|the\s+(university|school|institute|program|college))\b/i,
  /\b(tuition|fee|fees|financial\s+aid)\b/i,
  /\b(curriculum|syllabus|course\s+offering|subject\s+offering|academic\s+calendar)\b/i,
  /\b(grading\s+system|gpa\s+requirement|academic\s+policy)\b/i,
  /\b(dorm|dormitory|housing|accommodation|canteen|facilities)\b/i,
  /\bhow\s+(does|do|is)\s+(msu-?iit|the\s+(university|school|institute))\b/i,
  /\b(freshman|freshmen)\b/i,  // freshman questions are always admissions/procedural
];

const DATA_KEYWORDS = [
  'enrollment', 'enrolled', 'enroll', 'college', 'program', 'course', 'degree',
  'year level',
  'employee', 'staff', 'faculty', 'instructor', 'professor', 'personnel', 'teacher',
  'attendance', 'attended', 'present', 'absent',
  'event', 'seminar', 'workshop', 'training',
  'pwd', 'disability', 'solo parent', 'single parent',
  'working student', 'first generation', '1st generation', '1st gen', 'first gen learner',
  'indigenous', 'lumad', 'ip member', 'lgbtq', 'pdl', 'child pdl', 'child lgbtq',
  'male', 'female', 'sex', 'gender', 'distribution', 'breakdown',
  'province', 'country', 'location', 'region',
  'semester', '1st semester', '2nd semester', 'first semester', 'second semester',
  'compare', 'comparison', 'versus', ' vs ', 'compared to', 'difference',
  'how many', 'count', 'total', 'number of', 'data', 'record', 'statistic',
  'how much', 'what is the', 'give me', 'show me', 'tell me',
  'csm', 'coe', 'ccs', 'chs', 'cass', 'ceba', 'ced',
  'engineering', 'computer', 'health', 'education', 'economics', 'business', 'science',
  'student', 'students', 'graduates', 'undergraduate',
  '2020', '2021', '2022', '2023', '2024', '2025', '2026',
  'percent', 'percentage', '%', 'ratio', 'proportion',
  'analyze', 'analyse', 'analysis', 'report', 'summary', 'overview',
  // Employee-specific keywords
  'teaching', 'non-teaching', 'plantilla', 'salary grade', 'ethnicity', 'religion',
  'senior citizen', 'senior official', 'administrative', 'admin', 'department',
  'ethnic', 'religious', 'affiliation', 'type', 'permanent', 'contractual',
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

  // ── Extract ALL academic years (position-aware) ───────────
  // Pairs each semester mention with the nearest preceding base year,
  // so "2024-2025 1st semester, 2nd semester, and 2025-2026 1st semester"
  // correctly produces three distinct periods instead of duplicating one.
  const yearRegex = /20\d\d[-–]20\d\d/g;
  const semRegex = /(1st|first|2nd|second)\s*(?:semester|sem)/gi;

  const yearPositions = [];
  let _ym;
  while ((_ym = yearRegex.exec(lower)) !== null) {
    yearPositions.push({ year: _ym[0].replace('–', '-'), pos: _ym.index });
  }

  const semPositions = [];
  let _sm;
  while ((_sm = semRegex.exec(lower)) !== null) {
    const sem = /1|first/i.test(_sm[1]) ? '1st Semester' : '2nd Semester';
    semPositions.push({ sem, pos: _sm.index });
  }

  if (yearPositions.length > 0 && semPositions.length > 0) {
    // Pair each semester with the nearest year that appears before it
    for (const { sem, pos } of semPositions) {
      const precedingYear = [...yearPositions].reverse().find(y => y.pos <= pos);
      if (precedingYear) {
        const period = `${precedingYear.year} ${sem}`;
        if (!intent.academicYears.includes(period)) intent.academicYears.push(period);
      }
    }
  } else if (yearPositions.length > 0) {
    // Years mentioned but no semester — add the raw years
    for (const { year } of yearPositions) {
      if (!intent.academicYears.includes(year)) intent.academicYears.push(year);
    }
  }

  // Detect semester without year (will use latest year)
  if (intent.academicYears.length === 0 && semPositions.length > 0) {
    intent.semester = semPositions[0].sem;
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
  // Events — CHECK FIRST before generic "attendance" to catch event-specific queries
  // Keywords: event, seminar, workshop, training, symposium, conference, forum, webinar
  else if (/\bevent|\bseminar|\bworkshop|\btraining|\bsymposium|\bconference|\bforum|\bwebinar/i.test(lower)) {
    intent.collection = 'events';

    // Only extract event title if asking about a SPECIFIC event (not "all events")
    if (!/\ball events|\bevery event|\beach event|\bper event/i.test(lower)) {
      // Try to extract specific event title from the query
      // Remove common question words and extract the event name
      const eventTitleMatch = lower
        .replace(/how many (people|participants|attendees)?\s*(attended|registered|joined|participated in)?(\s+the)?/gi, '')
        .replace(/what('s| is) the (attendance|turnout|participation) (for|of|in)(\s+the)?/gi, '')
        .replace(/show me (the )?(attendance|participants|data) (for|of|in)(\s+the)?/gi, '')
        .replace(/what is the (male and female|sex|gender|sdd)?\s*(breakdown|distribution)?\s*(of|for|in)?(\s+the)?/gi, '')
        .replace(/\?/g, '')
        .trim();

      if (eventTitleMatch && eventTitleMatch.length > 3) {
        intent.eventTitle = eventTitleMatch;
        intent.wantsSexBreakdown = true; // Always show SDD for specific events
        console.log('📝 Extracted event title from query:', eventTitleMatch);
      }
    }
  }
  // Attendance — generic attendance queries (not event-specific)
  else if (/\battendance|\battended|\bpresent|\babsent/i.test(lower)) {
    intent.collection = 'attendance';
  }
  // Enrollment — broadest, catches natural phrases like "how many students in COE"
  else if (/\benrollment|\benrolled|\benroll|\bcollege|\bprogram|\bcourse|\bdegree|\bstudent|\bundergraduate|\byear level|\bpwd|\bsolo parent|\bworking student|\bfirst gen|\bindigenous|\blgbtq|\bpdl/i.test(lower)) {
    intent.collection = 'student_enrollment';
  }

  // ── Field detection ────────────────────────────────────────
  // IMPORTANT: Check collection first to use context-aware field mapping
  let potentialFields = [];
  for (const [alias, field] of Object.entries(FIELD_ALIASES)) {
    if (lower.includes(alias)) {
      potentialFields.push({ alias, field, priority: alias.length }); // Longer = more specific
    }
  }

  // Sort by priority (longer aliases first for specificity)
  potentialFields.sort((a, b) => b.priority - a.priority);

  // If collection is already detected, filter to matching fields
  if (intent.collection && potentialFields.length > 0) {
    const collectionFields = potentialFields.filter(pf =>
      FIELD_TO_COLLECTION[pf.field] === intent.collection
    );
    if (collectionFields.length > 0) {
      intent.groupField = collectionFields[0].field;
    } else {
      intent.groupField = potentialFields[0].field;
    }
  } else if (potentialFields.length > 0) {
    intent.groupField = potentialFields[0].field;
    if (!intent.collection && FIELD_TO_COLLECTION[intent.groupField]) {
      intent.collection = FIELD_TO_COLLECTION[intent.groupField];
    }
  }

  // Remap ambiguous employee-defaulting fields to student equivalents when
  // collection is already confirmed as student_enrollment (e.g. "students by ethnicity").
  if (intent.collection === 'student_enrollment') {
    const studentRemap = { empethnic: 'studethnic', empreligion: 'studreligion', empgender: 'studgender' };
    if (studentRemap[intent.groupField]) intent.groupField = studentRemap[intent.groupField];
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

  // ── Default group field for events ─────────────────────────
  if (!intent.groupField && intent.collection === 'events') {
    // Check if user wants sector breakdown per event (nested grouping)
    // Match various phrasings: "sector per event", "per event sector", "sector of each event", etc.
    if ((/\bsector/i.test(lower) && /\bper event|\beach event|\bby event|\bfor each event|\bfor every event/i.test(lower)) ||
      (/\bper event|\beach event/i.test(lower) && /\bsector/i.test(lower))) {
      intent.groupField = 'title'; // Primary: group by event
      intent.secondaryGroupField = 'sector'; // Secondary: group by sector within each event
      console.log('🔍 Detected nested grouping: sector per event');
    }
    // Check if user wants breakdown by sector only
    else if (/\bsector|\bby sector|\bper sector|\bsectors/i.test(lower)) {
      intent.groupField = 'sector'; // Group by sector
    }
    // Check if user wants breakdown by individual event (not by type)
    else if (/\bper event|\beach event|\bby event|\bfor each event|\bfor every event|\ball events/i.test(lower)) {
      intent.groupField = 'title'; // Group by individual event title
    } else {
      intent.groupField = 'eventType'; // Default: group by event type
    }
    intent.wantsAll = true;
  }

  // ── Default sex breakdown for any breakdown/analysis request
  if (/\bbreakdown|\banalysis|\banalyze|\banalyse|\bdistribution|\breport|\bsummary|\boverview|\bsdd|\bsex.disaggregated|\bgender|\bsex|\bmale|\bfemale|\bsector/i.test(lower)) {
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

  // Check if database is empty
  if (!rawDocs || rawDocs.length === 0) {
    console.log('⚠️ No data found for collection:', collection);
    console.log('📊 Available collections:', Object.keys(dbData));
    console.log('📊 Collection sizes:', Object.entries(dbData).map(([k, v]) => `${k}: ${v?.length || 0}`));
    return {
      error: 'No data available for this query. Please upload data first.',
      totalRecords: 0,
      data: {}
    };
  }

  // ── SPECIAL HANDLING FOR EVENTS ────────────────────────────
  // Events need to pull participant data from attendance collection
  if (collection === 'events' && wantsSexBreakdown) {
    const events = rawDocs.map(r => ({
      ...r,
      eventType: r.eventType || r.title || 'Not Specified',
      mode: r.mode || 'Not Specified',
      venue: r.venue || 'Not Specified',
      organizer: r.organizer || 'Not Specified',
      status: r.status || 'Active',
    }));

    const attendance = dbData.attendance || [];

    // ── CHECK IF SPECIFIC EVENT IS REQUESTED ────────────────
    if (intent.eventTitle) {
      // Try to find specific event by fuzzy matching title
      const searchTitle = simplifyStr(intent.eventTitle);
      console.log('🔍 Searching for event with title:', intent.eventTitle);
      console.log('🔍 Simplified search title:', searchTitle);
      console.log('🔍 Available events:', events.map(e => ({ id: e.id, title: e.title })));

      const matchedEvent = events.find(e => {
        const eventTitle = simplifyStr(e.title || '');
        const matches = eventTitle.includes(searchTitle) || searchTitle.includes(eventTitle);
        console.log(`  Checking "${e.title}" (simplified: "${eventTitle}") - Match: ${matches}`);
        return matches;
      });

      console.log('✅ Matched event:', matchedEvent ? matchedEvent.title : 'NONE');

      if (matchedEvent) {
        // Get attendance ONLY for this specific event
        const eventAttendees = attendance.filter(a => String(a.eventId) === String(matchedEvent.id));

        console.log(`📊 Event ID: ${matchedEvent.id}`);
        console.log(`📊 Total attendance records: ${attendance.length}`);
        console.log(`📊 Filtered attendees for this event: ${eventAttendees.length}`);

        // Calculate sex breakdown
        const sexCounts = {};
        eventAttendees.forEach(a => {
          const sex = a.sex || a.gender || 'Unknown';
          sexCounts[sex] = (sexCounts[sex] || 0) + 1;
        });

        // Calculate sector breakdown
        const sectorCounts = {};
        eventAttendees.forEach(a => {
          const sector = a.sector || 'Unknown';
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        });

        const total = eventAttendees.length;

        // Build SDD data
        const sddData = {};
        Object.entries(sexCounts).forEach(([sex, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          sddData[sex] = count;
          sddData[`${sex} %`] = `${pct}%`;
        });

        // Build sector data
        const sectorData = {};
        Object.entries(sectorCounts).forEach(([sector, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          sectorData[sector] = count;
          sectorData[`${sector} %`] = `${pct}%`;
        });

        return {
          collection: COLLECTION_DISPLAY_NAMES[collection] || collection,
          academicYear: 'All Years',
          isComparison: false,
          groupField: 'title',
          filterValue: matchedEvent.title,
          sexField: 'sex',
          totalRecords: total,
          data: {
            [matchedEvent.title]: { Total: total, ...sddData }
          },
          sectorBreakdown: sectorData,
          eventInfo: {
            title: matchedEvent.title,
            type: matchedEvent.eventType,
            date: matchedEvent.startDate,
            venue: matchedEvent.venue,
            mode: matchedEvent.mode,
            organizer: matchedEvent.organizer,
            status: matchedEvent.status,
          }
        };
      } else {
        // Event not found
        return {
          error: `Event "${intent.eventTitle}" not found. Please check the event name.`,
          totalRecords: 0,
          data: {}
        };
      }
    }

    // ── GENERAL EVENTS QUERY (group by type/title/sector) ────
    const result = { totalRecords: events.length, data: {} };

    // Special handling for sector grouping - group attendance by sector, not events
    if (groupField === 'sector') {
      const sectorGroups = {};

      // Group ALL attendance records by sector
      attendance.forEach(a => {
        const sector = a.sector || 'Unknown';
        if (!sectorGroups[sector]) {
          sectorGroups[sector] = [];
        }
        sectorGroups[sector].push(a);
      });

      // Compute sex breakdown for each sector
      Object.entries(sectorGroups).forEach(([sector, attendees]) => {
        const sexCounts = {};
        attendees.forEach(a => {
          const sex = a.sex || a.gender || 'Unknown';
          sexCounts[sex] = (sexCounts[sex] || 0) + 1;
        });

        const total = attendees.length;
        const out = {};
        Object.entries(sexCounts).forEach(([sex, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          out[sex] = count;
          out[`${sex} %`] = `${pct}%`;
        });
        result.data[sector] = { ...out, Total: total };
      });

      return {
        collection: COLLECTION_DISPLAY_NAMES[collection] || collection,
        academicYear: 'All Years',
        isComparison: false,
        groupField: 'sector',
        filterValue: null,
        sexField: 'sex',
        totalRecords: attendance.length,
        data: result.data,
      };
    }

    // Special handling for nested grouping (e.g., sector per event)
    if (intent.secondaryGroupField) {
      const nestedData = {};

      // First group by primary field (e.g., event title)
      events.forEach(event => {
        const primaryKey = event[groupField] || event.title || 'Unknown';
        const eventAttendees = attendance.filter(a => String(a.eventId) === String(event.id));

        if (eventAttendees.length === 0) return; // Skip events with no attendance

        // Then group by secondary field (e.g., sector)
        const secondaryGroups = {};
        eventAttendees.forEach(a => {
          const secondaryKey = a[intent.secondaryGroupField] || 'Unknown';
          if (!secondaryGroups[secondaryKey]) {
            secondaryGroups[secondaryKey] = [];
          }
          secondaryGroups[secondaryKey].push(a);
        });

        // Compute sex breakdown for each secondary group
        const secondaryData = {};
        Object.entries(secondaryGroups).forEach(([secondaryKey, attendees]) => {
          const sexCounts = {};
          attendees.forEach(a => {
            const sex = a.sex || a.gender || 'Unknown';
            sexCounts[sex] = (sexCounts[sex] || 0) + 1;
          });

          const total = attendees.length;
          const out = {};
          Object.entries(sexCounts).forEach(([sex, count]) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            out[sex] = count;
            out[`${sex} %`] = `${pct}%`;
          });
          secondaryData[secondaryKey] = { ...out, Total: total };
        });

        nestedData[primaryKey] = secondaryData;
      });

      return {
        collection: COLLECTION_DISPLAY_NAMES[collection] || collection,
        academicYear: 'All Years',
        isComparison: false,
        isNested: true,
        groupField: groupField,
        secondaryGroupField: intent.secondaryGroupField,
        filterValue: null,
        sexField: 'sex',
        totalRecords: events.length,
        data: nestedData,
      };
    }

    // Group events by eventType/title (or whatever groupField is set)
    const grouped = {};
    events.forEach(event => {
      const groupVal = event[groupField] || event.eventType || event.title || 'Unknown';
      if (!grouped[groupVal]) {
        grouped[groupVal] = { events: [], attendees: [] };
      }
      grouped[groupVal].events.push(event);

      // Find attendance records for this event
      const eventAttendees = attendance.filter(a => String(a.eventId) === String(event.id));
      grouped[groupVal].attendees.push(...eventAttendees);
    });

    // Compute sex breakdown for each group
    Object.entries(grouped).forEach(([groupVal, { events: groupEvents, attendees }]) => {
      const sexCounts = {};
      attendees.forEach(a => {
        const sex = a.sex || 'Unknown';
        sexCounts[sex] = (sexCounts[sex] || 0) + 1;
      });

      const total = attendees.length;
      const out = {};
      Object.entries(sexCounts).forEach(([sex, count]) => {
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
        out[sex] = count;
        out[`${sex} %`] = `${pct}%`;
      });
      result.data[groupVal] = { ...out, Total: total };
    });

    return {
      collection: COLLECTION_DISPLAY_NAMES[collection] || collection,
      academicYear: 'All Years',
      isComparison: false,
      groupField: groupField,
      filterValue: null,
      sexField: 'sex',
      totalRecords: events.length,
      data: result.data,
    };
  }

  // Converts any truthy representation (boolean true, "true", "1", "y") to "Yes"/"No" string.
  // Needed because old records may store booleans instead of "Yes"/"No" strings.
  const nb = v => (v === 'Yes' || v === true || v === 'yes' || v === 'true' || v === '1' || v === 1) ? 'Yes' : 'No';

  // Normalize student_enrollment records so old (pre-2026) and new field names both resolve
  const allDocs = collection === 'student_enrollment'
    ? rawDocs.map(r => ({
      ...r,
      stud_college: canonicalizeCollege(r.stud_college || r.college),
      stud_program: r.stud_program || r.program || 'Not Specified',
      stud_yrlevel: r.stud_yrlevel || r.year_level || 'Not Specified',
      studethnic: r.studethnic || r.ethnicity || 'Not Specified',
      studreligion: r.studreligion || r.religion || 'Not Specified',
      studid: r.studid || r.student_id || 'N/A',
      studgender: r.studgender || r.sex || 'Unknown',
      currentadd_prov: r.currentadd_prov || r.place_of_origin || 'Not Specified',
      is_first_gen_learner: nb(r.is_first_gen_learner ?? r['_first_generation?']),
      is_pwd: nb(r.is_pwd ?? r['_pwd?']),
      is_child_solo_parent: nb(r.is_child_solo_parent ?? r['_solo_parent?'] ?? r.is_solo_parent),
      '_ip_member?': nb(r['_ip_member?'] ?? r.is_ip_member),
      '_working_student?': nb(r['_working_student?'] ?? r.is_working_student),
    }))
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
      : collection === 'events'
        ? rawDocs.map(r => ({
          ...r,
          eventType: r.eventType || r.title || 'Not Specified',
          mode: r.mode || 'Not Specified',
          venue: r.venue || 'Not Specified',
          organizer: r.organizer || 'Not Specified',
          status: r.status || 'Active',
          targetGroup: r.targetGroup || 'Not Specified',
          targetParticipants: r.targetParticipants || 'Not Specified',
          fundingSource: r.fundingSource || 'Not Specified',
          partnerAgencies: r.partnerAgencies || 'Not Specified',
          gadMandate: r.gadMandate || 'Not Specified',
        }))
        : rawDocs;

  const displayName = COLLECTION_DISPLAY_NAMES[collection] || collection;
  const sexField = collection === 'events'
    ? 'sex' // Events use registration data with 'sex' field
    : allDocs[0]?.studgender !== undefined ? 'studgender' // Student enrollment
      : allDocs[0]?.empgender !== undefined ? 'empgender' // Employee information
        : allDocs[0]?.sex !== undefined ? 'sex'
          : allDocs[0]?.gender !== undefined ? 'gender'
            : null;

  // Default to most recent AY when none specified — prevents mixing records
  // across academic years (data sheet always scopes to one AY, GIA should too)
  const allYears = [...new Set(allDocs.map(d => d.academicYear).filter(Boolean))].sort();
  const latestYear = allYears[allYears.length - 1] ?? null;

  // If semester was detected without year, find latest year with that semester
  if (intent.semester && academicYears.length === 0) {
    const yearsWithSemester = allYears.filter(y => y.includes(intent.semester));
    if (yearsWithSemester.length > 0) {
      academicYears.push(yearsWithSemester[yearsWithSemester.length - 1]);
    }
  }

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
    // Scope docs to the resolved years (one semester, multiple semesters, etc.)
    // Use includes() so the filter works for any number of resolved years.
    let collegeDocs = allDocs;
    if (resolvedYears.length >= 1) {
      const filtered = allDocs.filter(d => resolvedYears.includes(d.academicYear));
      collegeDocs = filtered.length > 0 ? filtered : allDocs;
    }
    const collegeResults = {};
    filterValues.forEach(collegeName => {
      const computed = computeForDocs(collegeDocs, 'stud_college', collegeName, wantsSexBreakdown, sexField);
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
    // Expand bare years (e.g. "2024-2025") to all their semesters in the DB.
    // This handles queries like "from 2024-2025 to 2025-2026" where the user
    // didn't specify a semester — we include every semester that exists.
    const expandYears = (years) => {
      const out = [];
      for (const y of years) {
        if (/Semester|Summer/i.test(y)) {
          out.push(y); // already has semester suffix
        } else {
          const sems = allYears.filter(ay => ay.startsWith(y));
          sems.length > 0 ? out.push(...sems) : out.push(y);
        }
      }
      return [...new Set(out)];
    };

    const expanded = expandYears(resolvedYears);
    const yearsToUse = expanded.length === 1
      ? (() => {
          const baseYear = expanded[0].split(' ')[0];
          const sameBase = allYears.filter(y => y.startsWith(baseYear));
          return sameBase.length >= 2 ? sameBase : allYears;
        })()
      : expanded;
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

  // Handle nested data (e.g., sector breakdown per event)
  if (result.isNested) {
    text += `Academic Year: ${result.academicYear}\n`;
    text += `Mode: Nested Breakdown (${result.groupField} → ${result.secondaryGroupField})\n`;
    text += `Total Records in scope: ${result.totalRecords}\n\n`;

    Object.entries(result.data).forEach(([primaryKey, secondaryData]) => {
      text += `--- ${primaryKey} ---\n`;
      Object.entries(secondaryData)
        .sort(([, a], [, b]) => (b.Total || 0) - (a.Total || 0))
        .forEach(([secondaryKey, counts]) => {
          text += `  ${secondaryKey}:\n`;
          Object.entries(counts).forEach(([key, val]) => {
            text += `    ${key}: ${val}\n`;
          });
        });
      text += `\n`;
    });

    text += `=== END OF COMPUTED DATA ===\n`;
    return text;
  }

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
    intent.andFilters = intent.andFilters || [];
    intent.filterValues = intent.filterValues || [];
    intent.academicYears = intent.academicYears || [];

    // ── Sanitize LLM output ──────────────────────────────────
    // filterValues must only contain real college names — the LLM sometimes
    // stuffs ['male','female'] or other words in here.
    const validColleges = new Set(Object.values(COLLEGE_ALIASES));
    intent.filterValues = intent.filterValues.filter(v => validColleges.has(v));

    // Merge filterValue into filterValues when the LLM splits colleges between
    // the two fields (e.g. "COE vs CCS" → filterValue='COE', filterValues=['CCS']).
    // This ensures the comparison path always sees all colleges regardless of mention order.
    if (intent.filterValue && validColleges.has(intent.filterValue) && !intent.filterValues.includes(intent.filterValue)) {
      intent.filterValues.unshift(intent.filterValue);
    }
    // Deduplicate and clear singular filterValue when multiple colleges are present
    intent.filterValues = [...new Set(intent.filterValues)];
    if (intent.filterValues.length > 1) intent.filterValue = null;

    // Single college → always ensure filterValue and groupField are consistent
    if (intent.filterValues.length === 1) {
      intent.filterValue = intent.filterValue || intent.filterValues[0];
      // groupField must be stud_college whenever we're filtering by college
      // (LLM sometimes returns "studgender" here, which breaks the filter)
      intent.groupField = 'stud_college';
      if (intent.andFilters.length > 0 && !intent.andFilters.find(f => f.field === 'stud_college')) {
        intent.andFilters.push({ field: 'stud_college', value: intent.filterValues[0] });
      }
    }

    // Multiple colleges always means comparison
    if (intent.filterValues.length > 1) intent.wantsComparison = true;

    // Always supplement LLM academicYears with the keyword parser's position-aware
    // extraction. The LLM often misses implicit base-year references like
    // "1st sem, 2nd sem, and 2025-2026 1st sem" where "2nd sem" inherits the
    // prior year. The keyword parser handles this correctly, so we union both sets.
    const kwParsed = parseQuery(message);
    if (kwParsed.academicYears.length > 0) {
      const merged = [...new Set([...intent.academicYears, ...kwParsed.academicYears])];
      // Drop bare years (e.g. '2025-2026') when a semester-specific entry already
      // covers them (e.g. '2025-2026 1st Semester'). The LLM often returns the bare
      // year in addition to the full string, causing the year count to become 2 and
      // bypassing the single-year filter in computeAnswer.
      intent.academicYears = merged.filter(y => {
        if (/Semester|Summer/i.test(y)) return true;
        return !merged.some(other => /Semester|Summer/i.test(other) && other.startsWith(y));
      });
    }

    // Always use the keyword parser's andFilters — the LLM hallucinates boolean
    // conditions that aren't in the query (e.g. adding all student vulnerability
    // flags for a simple "by ethnicity" question). The keyword parser only fires
    // when the keyword is literally present in the message.
    intent.andFilters = kwParsed.andFilters;

    // Multiple academic years always means comparison (mirrors keyword-parser logic)
    if (intent.academicYears.length > 1) intent.wantsComparison = true;

    // ── Default group field for events (mirror keyword parser logic) ─────
    if (!intent.groupField && intent.collection === 'events') {
      intent.groupField = 'eventType';
      intent.wantsAll = true;
    }

    // If the LLM defaulted to employee_information but the keyword parser is confident
    // this is a student query (e.g. "students by ethnicity"), trust the keyword parser.
    // This happens because ambiguous words like "ethnicity" bias the LLM toward employee fields.
    if (intent.collection === 'employee_information' && kwParsed.collection === 'student_enrollment') {
      intent.collection = 'student_enrollment';
    }

    // Remap ambiguous employee-defaulting fields to student equivalents when
    // collection is student_enrollment (whether set by LLM or corrected above).
    if (intent.collection === 'student_enrollment') {
      const studentRemap = { empethnic: 'studethnic', empreligion: 'studreligion', empgender: 'studgender' };
      if (studentRemap[intent.groupField]) intent.groupField = studentRemap[intent.groupField];
    }

    return intent;
  } catch (e) {
    console.warn('⚠️ LLM intent parsing failed, falling back to keyword matching:', e.message);
    return parseQuery(message);
  }
};

export const analyzeWithAI = async (userMessage, dbData, _history = []) => {
  try {
    const intent = await parseQueryWithLLM(userMessage);

    // Debug logging: Show what the system understood from the query
    console.log('🔍 Parsed Intent:', {
      collection: intent.collection,
      groupField: intent.groupField,
      filterValue: intent.filterValue,
      filterValues: intent.filterValues,
      andFilters: intent.andFilters,
      academicYears: intent.academicYears,
      wantsSexBreakdown: intent.wantsSexBreakdown,
      wantsComparison: intent.wantsComparison,
      wantsAll: intent.wantsAll,
      isConversational: intent.isConversational,
    });

    // Debug: Show available data
    console.log('📊 Available data:', Object.entries(dbData).map(([k, v]) => `${k}: ${v?.length || 0} records`));

    // ── Out-of-scope — call API so GIA responds contextually to the specific topic ──
    if (OUT_OF_SCOPE_PATTERNS.some(p => p.test(userMessage))) {
      try {
        const declinePrompt = `SYSTEM INSTRUCTION: The user's message is outside GIA's scope. Do NOT answer the question. In one to two warm, natural sentences: acknowledge what they asked about by name, explain you're focused only on GADC data and Gender and Development topics at MSU-IIT, and offer to help with enrollment, employee info, events, or GAD programs instead. No table, no data, no bullet points.

USER QUESTION: ${userMessage}`;
        const declineRes = await fetchWithRetry(
          API_URL,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: declinePrompt, history: [] }) },
          2, 2000
        );
        if (declineRes?.ok) {
          const declineData = await declineRes.json();
          if (declineData.reply) return { reply: declineData.reply, chartData: null };
        }
      } catch (_) {}
      return { reply: "That's a bit outside what I cover — I'm focused on GADC data and Gender and Development topics at MSU-IIT. Anything about enrollment, employee info, or GAD programs I can help with?", chartData: null };
    }

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

    console.log('📤 Computed data being sent to backend:', computedText.substring(0, 500) + '...');

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
- Always start your response with a small italic header showing the academic period, exactly like this (fill in the actual value from "Academic Year" in the data above): *Academic Year: [value]*
- Present a markdown table immediately after that header. Always. Use proper pipe | syntax with a header row, a separator row (---|---|---), and one data row per group. Never write values inline like "Male: 5, Female: 9" — every value must be in its own cell.
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