// src/services/aiService.js
// Architecture: JavaScript computes exact numbers, AI only writes the response.
// Conversation history is passed to the backend for context awareness.

const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api/chat'
  : '/api/chat';

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
  'csm': 'College of Science and Mathematics',
  'coe': 'College of Engineering',
  'ccs': 'College of Computer Studies',
  'chs': 'College of Health Sciences',
  'cass': 'College of Arts and Social Sciences',
  'college of social sciences': 'College of Arts and Social Sciences',
  'ceba': 'College of Economics, Business, and Accountancy',
  'college of economics': 'College of Economics, Business, and Accountancy',
  'ced': 'College of Education',
};

const FIELD_ALIASES = {
  'college': 'college',
  'program': 'program',
  'course': 'program',
  'year level': 'year_level',
  'academic standing': 'academic_standing',
  'standing': 'academic_standing',
  'lister': 'academic_standing',
  'scholarship': 'scholarship_status',
  'organization': 'organizations',
  'org': 'organizations',
  'publication': 'publication',
  'student council': 'student_council',
  'employee type': 'employee_type',
  'employment type': 'employee_type',
  'plantilla': 'plantilla_position',
  'special needs': 'special_needs',
  'ethnicity': 'ethnicity',
  'religion': 'religion',
  'income': 'income_order',
  '4ps': '_4ps_beneficiary?',
  'pwd': '_pwd?',
  'solo parent': '_solo_parent?',
  'ip member': '_ip_member?',
  'indigenous': '_ip_member?',
  'ofw': '_ofw_dependent?',
  'working student': '_working_student?',
  'first generation': '_first_generation?',
  'international': '_international_student?',
  'sector': 'sector',
};

const FIELD_TO_COLLECTION = {
  college: 'student_enrollment',
  program: 'student_enrollment',
  year_level: 'student_enrollment',
  '_4ps_beneficiary?': 'student_enrollment',
  '_pwd?': 'student_enrollment',
  '_solo_parent?': 'student_enrollment',
  '_ip_member?': 'student_enrollment',
  '_ofw_dependent?': 'student_enrollment',
  '_working_student?': 'student_enrollment',
  '_first_generation?': 'student_enrollment',
  '_international_student?': 'student_enrollment',
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
// QUERY PARSER
// ─────────────────────────────────────────────────────────────

const parseQuery = (message) => {
  const lower = message.toLowerCase();

  const intent = {
    collection: null,
    groupField: null,
    filterValue: null,
    academicYears: [],
    wantsSexBreakdown: false,
    wantsAll: false,
    wantsComparison: false,
  };

  // Extract ALL academic years
  const yearMatches = lower.matchAll(/20\d\d[-–]20\d\d/g);
  for (const match of yearMatches) {
    intent.academicYears.push(match[0].replace('–', '-'));
  }

  // Detect comparison intent
  if (intent.academicYears.length > 1 ||
      lower.includes('compare') || lower.includes('versus') ||
      lower.includes(' vs ') || lower.includes('compared to') ||
      lower.includes('difference between')) {
    intent.wantsComparison = true;
  }

  // Detect sex breakdown
  if (lower.includes('male') || lower.includes('female') || lower.includes('sex') ||
      lower.includes('gender') || lower.includes('distribution') || lower.includes('breakdown')) {
    intent.wantsSexBreakdown = true;
  }

  // Detect "all" request
  if (lower.includes('all college') || lower.includes('each college') ||
      lower.includes('all program') || lower.includes('per college') ||
      lower.includes('by college') || lower.includes('by program') ||
      lower.includes('all year')) {
    intent.wantsAll = true;
  }

  // Detect collection
  if (lower.includes('enrollment') || lower.includes('enrolled') || lower.includes('college') ||
      lower.includes('program') || lower.includes('course') || lower.includes('year level') ||
      lower.includes('4ps') || lower.includes('pwd') || lower.includes('solo parent') ||
      lower.includes('ofw') || lower.includes('working student') || lower.includes('ip member')) {
    intent.collection = 'student_enrollment';
  } else if (lower.includes('engagement') || lower.includes('standing') || lower.includes('lister') ||
             lower.includes('scholarship') || lower.includes('organization') || lower.includes('publication') ||
             lower.includes('student council')) {
    intent.collection = 'student_engagement';
  } else if (lower.includes('employee') || lower.includes('staff') || lower.includes('faculty') ||
             lower.includes('instructor') || lower.includes('professor') || lower.includes('personnel')) {
    intent.collection = 'employee_information';
  } else if (lower.includes('attendance') || lower.includes('attended') || lower.includes('present')) {
    intent.collection = 'attendance';
  } else if (lower.includes('event') || lower.includes('seminar') || lower.includes('workshop')) {
    intent.collection = 'events';
  }

  // Detect group field
  for (const [alias, field] of Object.entries(FIELD_ALIASES)) {
    if (lower.includes(alias)) {
      intent.groupField = field;
      if (!intent.collection && FIELD_TO_COLLECTION[field]) {
        intent.collection = FIELD_TO_COLLECTION[field];
      }
      break;
    }
  }

  // Boolean Yes/No fields — filter to "Yes" records and show sex breakdown
  const BOOLEAN_FIELDS = [
    '_pwd?', '_4ps_beneficiary?', '_solo_parent?', '_ip_member?',
    '_ofw_dependent?', '_working_student?', '_first_generation?', '_international_student?'
  ];
  if (intent.groupField && BOOLEAN_FIELDS.includes(intent.groupField)) {
    intent.filterValue = 'Yes';
    intent.wantsSexBreakdown = true;
  }

  // Detect college filter
  for (const [alias, fullName] of Object.entries(COLLEGE_ALIASES)) {
    if (lower.includes(alias)) {
      intent.filterValue = fullName;
      intent.groupField = intent.groupField || 'college';
      intent.collection = intent.collection || 'student_enrollment';
      break;
    }
  }

  // Default group field for enrollment
  if (!intent.groupField && intent.collection === 'student_enrollment') {
    intent.groupField = 'college';
    intent.wantsAll = true;
  }

  return intent;
};

// ─────────────────────────────────────────────────────────────
// DATA COMPUTER
// ─────────────────────────────────────────────────────────────

const computeForDocs = (docs, groupField, filterValue, wantsSexBreakdown, sexField) => {
  let filtered = docs;
  if (filterValue && groupField) {
    filtered = docs.filter(d => {
      const val = d[groupField];
      if (val === undefined || val === null) return false;
      return val.toString().trim().toLowerCase() === filterValue.toString().trim().toLowerCase();
    });
  }

  const result = { totalRecords: filtered.length, data: {} };

  const BOOLEAN_FIELD_LABELS = {
    '_pwd?': 'PWD Students',
    '_4ps_beneficiary?': '4Ps Beneficiary Students',
    '_solo_parent?': 'Solo Parent Students',
    '_ip_member?': 'IP Member Students',
    '_ofw_dependent?': 'OFW Dependent Students',
    '_working_student?': 'Working Students',
    '_first_generation?': 'First Generation Students',
    '_international_student?': 'International Students',
  };
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
      result.data[key] = { ...sexCounts, Total: filtered.length };
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
        result.data[groupVal] = { ...sexCounts, Total: groupDocs.length };
      } else {
        result.data[groupVal] = { Total: groupDocs.length };
      }
    });
  }

  return result;
};

const computeAnswer = (intent, dbData) => {
  const { collection, groupField, filterValue, academicYears, wantsSexBreakdown, wantsComparison } = intent;

  if (!collection || !dbData[collection]) {
    return { error: 'Could not determine which dataset to use for this question.' };
  }

  const allDocs = dbData[collection];
  const displayName = COLLECTION_DISPLAY_NAMES[collection] || collection;
  const sexField = allDocs[0]?.sex !== undefined ? 'sex'
    : allDocs[0]?.gender !== undefined ? 'gender'
    : null;

  if (wantsComparison && academicYears.length > 0) {
    let yearsToUse = academicYears;
    if (academicYears.length === 1) {
      yearsToUse = [...new Set(allDocs.map(d => d.academicYear).filter(Boolean))].sort();
    }

    const yearResults = {};
    yearsToUse.forEach(year => {
      const yearDocs = allDocs.filter(d => d.academicYear === year);
      if (yearDocs.length > 0) {
        yearResults[year] = computeForDocs(yearDocs, groupField, filterValue, wantsSexBreakdown, sexField);
      }
    });

    return { collection: displayName, isComparison: true, groupField, filterValue, sexField, yearResults };
  }

  let docs = allDocs;
  if (academicYears.length === 1) {
    const filtered = allDocs.filter(d => d.academicYear === academicYears[0]);
    docs = filtered.length > 0 ? filtered : allDocs;
  }

  const computed = computeForDocs(docs, groupField, filterValue, wantsSexBreakdown, sexField);

  return {
    collection: displayName,
    academicYear: academicYears[0] || 'All Years',
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

  if (result.isComparison) {
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
    text += `\nEXACT COUNTS:\n`;

    Object.entries(result.data).forEach(([category, counts]) => {
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
// POST-PROCESSING — strip interpretive / opinion sentences
// ─────────────────────────────────────────────────────────────

const INTERPRETIVE_PATTERNS = [
  /[^.!?]*\bthis (suggests?|indicates?|implies?|may indicate|may suggest|could suggest|could indicate|points? to)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bthis (disparity|difference|gap|distribution|pattern|trend)\b[^.!?]*(suggests?|indicates?|implies?|reflects?|shows?|means?)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\b(may|might|could|can)\b[^.!?]*(suggest|indicate|imply|reflect|mean|be due to|be attributed)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bit is (worth noting|notable|interesting|important to note)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bthis (could|may|might) be (a point of interest|attributed to|due to|related to|reflective of)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\b(further (analysis|study|research|investigation)|future (analysis|study|research))\b[^.!?]*[.!?]/gi,
  /[^.!?]*\b(initiatives? aimed at|efforts? to promote|programs? to address)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bthis (finding|result|data|number|figure|statistic)\b[^.!?]*(suggests?|indicates?|implies?)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bthis distribution highlights\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bhighlights the importance of\b[^.!?]*[.!?]/gi,
  /[^.!?]*\b(can|may|might) (influence|affect|impact)\b[^.!?]*(resource allocation|institutional|strategies|support|policies)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\b(resource allocation|institutional strategies|academic support|gender (equality|representation|balance))\b[^.!?]*(is important|are important|should be|must be|need to)\b[^.!?]*[.!?]/gi,
  /[^.!?]*\bunderstanding (gender|this|the) (representation|distribution|data|pattern)\b[^.!?]*[.!?]/gi,
  // Strip meta-commentary openers
  /^[^.!?\n]*\b(here'?s?|below is|the following|i('ve| have) prepared|based on the (data|computed|provided))[^.!?]*[.!?]\s*/gi,
  // Strip meta-commentary closers
  /[^.!?]*\b(this (response|table|analysis|summary) (uses?|provides?|presents?|follows?|includes?))[^.!?]*[.!?]\s*$/gi,
  /[^.!?]*\b(as shown (above|in the table|below)|as you can see|in summary|to summarize|in conclusion|overall,)[^.!?]*[.!?]\s*$/gi,
  /[^.!?]*\b(proper markdown|key metrics (in )?bold|clear (and )?concise)\b[^.!?]*[.!?]\s*$/gi,
];

const stripInterpretiveSentences = (text) => {
  let cleaned = text;
  for (const pattern of INTERPRETIVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
};

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT — accepts conversation history
// ─────────────────────────────────────────────────────────────

export const analyzeWithAI = async (userMessage, dbData, history = []) => {
  try {
    const intent = parseQuery(userMessage);
    const computedResult = computeAnswer(intent, dbData);
    const computedText = formatResultForAI(computedResult);

    const enrichedMessage = `${computedText}

USER QUESTION: ${userMessage}

INSTRUCTIONS:
- Use ONLY the numbers from the COMPUTED DATA section above. Do not recalculate, modify, or derive any figure.
- Do NOT open with any preamble, greeting, or meta-commentary (e.g. "Here's a summary", "Based on the data", "Sure!", "Below is").
- Do NOT close with any remark about formatting, methodology, or how the response was written.
- Begin your response immediately with the data or analysis — the first word should be substantive.
- End your response when the data has been fully presented — no closing sentences.
- Use proper markdown formatting (tables, bold, paragraphs).
- For descriptive analysis: open with total count and scope, present a markdown table, then describe in paragraph form using only the numbers given.
- For comparisons: present a markdown table first with groups as rows and years/categories as columns, then a short paragraph per group using only the numbers given.
- Use clean college abbreviations (CSM, COE, CCS, CHS, CASS, CEBA, CED).
- Never expose internal field names or collection names.
`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: enrichedMessage,
        history,
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    if (data.reply) return stripInterpretiveSentences(data.reply);
    throw new Error('No reply in response');

  } catch (error) {
    console.error('❌ Error calling AI service:', error);
    throw error;
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

export const extractRelevantData = (userMessage, dbData) => dbData;

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