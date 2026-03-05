// src/services/aiService.js

const API_URL = '/api/chat';

// Map of keywords that relate to each collection
const COLLECTION_KEYWORDS = {
  attendance: ['attendance', 'absent', 'present', 'attended', 'missing', 'show up', 'class attendance'],
  employee_information: ['employee', 'staff', 'faculty', 'teacher', 'instructor', 'professor', 'worker', 'personnel', 'hire', 'hired'],
  events: ['event', 'activity', 'activities', 'program', 'seminar', 'workshop', 'conference', 'celebration'],
  student_engagement: ['engagement', 'engaged', 'participation', 'participate', 'involved', 'involvement', 'club', 'org', 'standing', 'academic', 'lister', 'scholarship', 'organization', 'publication'],
  student_enrollment: ['enrollment', 'enrolled', 'enroll', 'admission', 'admitted', 'registered', 'registration', 'student count', 'student population', 'college', 'program', 'year level', 'ip', 'pwd', 'solo parent', '4ps', 'ofw', 'working student'],
};

// Fields to cross-tabulate with sex per collection
const CROSS_TAB_FIELDS = {
  student_engagement: ['academic_standing', 'scholarship_status', 'organizations', 'publication', 'student_council'],
  student_enrollment: ['college', 'program', 'year_level', '_4ps_beneficiary', '_pwd', '_solo_parent', '_ip_member', '_ofw_dependent', '_working_student', '_first_generation', '_international_student'],
  employee_information: ['department', 'position', 'employment_type'],
  attendance: ['event', 'status'],
};

// Which collections should be grouped by academic year before cross-tabbing
const ACADEMIC_YEAR_FIELD = {
  student_enrollment: 'academicYear',
  student_engagement: 'academicYear',
  employee_information: 'academicYear',
};

/**
 * Generate a cross-tabulation of sex vs a field for a given set of documents
 */
const generateCrossTab = (documents, groupField, sexField = 'sex') => {
  const sexValues = [...new Set(documents.map(d => d[sexField]).filter(Boolean))].sort();
  const groupValues = [...new Set(documents.map(d => d[groupField]).filter(Boolean))].sort();

  if (groupValues.length === 0 || sexValues.length === 0) return '';

  const counts = {};
  groupValues.forEach(g => {
    counts[g] = {};
    sexValues.forEach(s => (counts[g][s] = 0));
    counts[g]['Total'] = 0;
  });

  documents.forEach(doc => {
    const group = doc[groupField];
    const sex = doc[sexField];
    if (group && sex && counts[group]) {
      counts[group][sex] = (counts[group][sex] || 0) + 1;
      counts[group]['Total']++;
    }
  });

  const headers = [groupField, ...sexValues, 'Total'];
  let table = '| ' + headers.join(' | ') + ' |\n';
  table += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

  groupValues.forEach(g => {
    const row = [g, ...sexValues.map(s => counts[g][s] || 0), counts[g]['Total']];
    table += '| ' + row.join(' | ') + ' |\n';
  });

  const totals = sexValues.map(s =>
    groupValues.reduce((sum, g) => sum + (counts[g][s] || 0), 0)
  );
  const grandTotal = totals.reduce((a, b) => a + b, 0);
  table += '| **Total** | ' + totals.join(' | ') + ' | ' + grandTotal + ' |\n';

  return table;
};

/**
 * Generate cross-tabs grouped by academic year
 * For each academic year, generates a breakdown table per cross-tab field
 */
const generateYearlyBreakdowns = (documents, crossTabFields, sexField, yearField) => {
  let output = '';

  // Get all academic years sorted
  const years = [...new Set(documents.map(d => d[yearField]).filter(Boolean))].sort();

  years.forEach(year => {
    const yearDocs = documents.filter(d => d[yearField] === year);
    output += `\n--- Academic Year: ${year} (${yearDocs.length} records) ---\n`;

    crossTabFields.forEach(field => {
      const fieldExists = yearDocs.some(d => d[field] !== undefined && d[field] !== null && d[field] !== '');
      if (fieldExists) {
        output += `\n**Breakdown by ${field} (${year}):**\n`;
        output += generateCrossTab(yearDocs, field, sexField);
      }
    });
  });

  // Also add an ALL-YEARS combined summary
  output += `\n--- All Academic Years Combined (${documents.length} total records) ---\n`;
  crossTabFields.forEach(field => {
    const fieldExists = documents.some(d => d[field] !== undefined && d[field] !== null && d[field] !== '');
    if (fieldExists) {
      output += `\n**Overall Breakdown by ${field} (All Years):**\n`;
      output += generateCrossTab(documents, field, sexField);
    }
  });

  return output;
};

/**
 * Prepares database data for AI analysis
 */
export const prepareDataContext = (dbData) => {
  let context = "=== DATABASE OVERVIEW ===\n\n";

  for (const [col, documents] of Object.entries(dbData)) {
    context += `📊 Collection: ${col}\n`;
    context += `   Total Records: ${documents.length}\n`;

    if (documents.length > 0) {
      const sampleDoc = documents[0];
      const fields = Object.keys(sampleDoc).filter(key =>
        !['id', 'createdAt', 'updatedAt', 'uploadTimestamp', 'sourceFile'].includes(key)
      );
      context += `   Fields: ${fields.join(', ')}\n`;

      // Basic stats
      const stats = generateStats(documents, fields);
      if (stats) context += stats;

      // Determine sex field
      const sexField = fields.includes('sex') ? 'sex'
        : fields.includes('gender') ? 'gender'
        : null;

      const crossTabFields = (CROSS_TAB_FIELDS[col] || []).filter(f => fields.includes(f));
      const yearField = ACADEMIC_YEAR_FIELD[col];

      if (sexField && crossTabFields.length > 0) {
        context += `\n   === SEX DISTRIBUTION BREAKDOWNS ===\n`;

        if (yearField && fields.includes(yearField)) {
          // Group by academic year for more accurate breakdowns
          context += generateYearlyBreakdowns(documents, crossTabFields, sexField, yearField);
        } else {
          // No year field — just do flat cross-tabs
          crossTabFields.forEach(field => {
            context += `\n**Breakdown by ${field}:**\n`;
            context += generateCrossTab(documents, field, sexField);
          });
        }
      }

      context += '\n';
    }
  }

  return context;
};

/**
 * Generate basic statistics for a collection
 */
const generateStats = (documents, fields) => {
  let stats = '';

  fields.forEach(field => {
    const values = documents.map(doc => doc[field]).filter(v => v !== undefined && v !== null && v !== '');
    if (values.length === 0) return;

    const numericValues = values.filter(v => typeof v === 'number');
    if (numericValues.length > values.length * 0.5) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / numericValues.length;
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      stats += `   • ${field}: avg=${avg.toFixed(2)}, min=${min}, max=${max}\n`;
    } else {
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length <= 15) {
        const valueCounts = {};
        values.forEach(v => { valueCounts[v] = (valueCounts[v] || 0) + 1; });
        const sorted = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]);
        stats += `   • ${field}: ${sorted.map(([val, count]) => `${val}(${count})`).join(', ')}\n`;
      } else {
        stats += `   • ${field}: ${uniqueValues.length} unique values\n`;
      }
    }
  });

  return stats;
};

/**
 * Call your backend API with database context
 */
export const analyzeWithAI = async (userMessage, dbData) => {
  try {
    const dataContext = prepareDataContext(dbData);

    const enrichedMessage = `${dataContext}

=== USER QUESTION ===
${userMessage}

Please analyze the data above and answer the user's question accurately using the EXACT numbers from the breakdown tables provided. Do not estimate or guess. If the user asks about a specific academic year, use only that year's table. If no year is specified, use the combined all-years table. Use proper markdown formatting in your response.`;

    console.log('📤 Sending to AI:', enrichedMessage.substring(0, 300) + '...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: enrichedMessage })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();

    if (data.reply) {
      console.log('📥 Received AI response');
      return data.reply;
    } else {
      throw new Error('No reply in response');
    }

  } catch (error) {
    console.error('❌ Error calling AI service:', error);
    throw error;
  }
};

/**
 * Query specific data based on user intent using keyword matching
 */
export const extractRelevantData = (userMessage, dbData) => {
  const lowerMessage = userMessage.toLowerCase();
  const relevantData = {};

  Object.keys(dbData).forEach(collection => {
    const keywords = COLLECTION_KEYWORDS[collection] || [collection.toLowerCase()];
    const isRelevant = keywords.some(keyword => lowerMessage.includes(keyword));
    if (isRelevant) relevantData[collection] = dbData[collection];
  });

  if (Object.keys(relevantData).length === 0) {
    console.log('📂 No specific collection matched — returning all collections');
    return dbData;
  }

  console.log('📂 Matched collections:', Object.keys(relevantData).join(', '));
  return relevantData;
};

/**
 * Generate a summary table from data
 */
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

/**
 * Perform aggregation on data
 */
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
      case 'count':
        results[key] = group.length;
        break;
      case 'sum':
        results[key] = group.reduce((sum, doc) => sum + (doc[aggregateField] || 0), 0);
        break;
      case 'avg':
        const sum = group.reduce((s, doc) => s + (doc[aggregateField] || 0), 0);
        results[key] = sum / group.length;
        break;
      case 'min':
        results[key] = Math.min(...group.map(doc => doc[aggregateField] || Infinity));
        break;
      case 'max':
        results[key] = Math.max(...group.map(doc => doc[aggregateField] || -Infinity));
        break;
    }
  });

  return results;
};

/**
 * Format aggregated data as a markdown table
 */
export const formatAggregationTable = (aggregatedData, keyLabel = 'Category', valueLabel = 'Value') => {
  let table = `| ${keyLabel} | ${valueLabel} |\n`;
  table += '|---|---|\n';

  Object.entries(aggregatedData).forEach(([key, value]) => {
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
    table += `| ${key} | ${formattedValue} |\n`;
  });

  return table;
};