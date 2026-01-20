// src/services/aiService.js

const API_URL = 'http://localhost:3001/api/chat';

/**
 * Prepares database data for AI analysis
 * @param {Object} dbData - Database data organized by collection
 * @returns {string} - Formatted context for AI
 */
export const prepareDataContext = (dbData) => {
  let context = "=== DATABASE OVERVIEW ===\n\n";
  
  for (const [collection, documents] of Object.entries(dbData)) {
    context += `📊 Collection: ${collection}\n`;
    context += `   Records: ${documents.length}\n`;
    
    if (documents.length > 0) {
      // Get sample fields from first document
      const sampleDoc = documents[0];
      const fields = Object.keys(sampleDoc).filter(key => key !== 'id');
      context += `   Fields: ${fields.join(', ')}\n`;
      
      // Add statistics
      const stats = generateStats(documents, fields);
      if (stats) {
        context += stats;
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
    const values = documents.map(doc => doc[field]).filter(v => v !== undefined && v !== null);
    
    if (values.length === 0) return;
    
    // Check if numeric
    const numericValues = values.filter(v => typeof v === 'number');
    if (numericValues.length > values.length * 0.5) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / numericValues.length;
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      stats += `   • ${field}: avg=${avg.toFixed(2)}, min=${min}, max=${max}\n`;
    } else {
      // Categorical data
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length <= 10) {
        const valueCounts = {};
        values.forEach(v => {
          valueCounts[v] = (valueCounts[v] || 0) + 1;
        });
        stats += `   • ${field}: ${uniqueValues.length} unique values\n`;
        
        // Show top 3 most common
        const sorted = Object.entries(valueCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        if (sorted.length > 0) {
          stats += `     Top: ${sorted.map(([val, count]) => `${val}(${count})`).join(', ')}\n`;
        }
      }
    }
  });
  
  return stats;
};

/**
 * Call your backend API with database context
 * @param {string} userMessage - User's question
 * @param {Object} dbData - Database data
 * @returns {Promise<string>} - AI response
 */
export const analyzeWithAI = async (userMessage, dbData) => {
  try {
    // Prepare data context
    const dataContext = prepareDataContext(dbData);
    
    // Combine user message with data context
    const enrichedMessage = `${dataContext}

=== USER QUESTION ===
${userMessage}

Please analyze the data above and answer the user's question. Use tables, lists, and proper markdown formatting in your response.`;

    console.log('📤 Sending to AI:', enrichedMessage.substring(0, 200) + '...');

    // Call your backend API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: enrichedMessage
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

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
 * Query specific data based on user intent
 * @param {string} userMessage - User's question
 * @param {Object} dbData - Database data
 * @returns {Object} - Relevant filtered data
 */
export const extractRelevantData = (userMessage, dbData) => {
  const lowerMessage = userMessage.toLowerCase();
  const relevantData = {};
  
  // Check which collections are mentioned
  Object.keys(dbData).forEach(collection => {
    if (lowerMessage.includes(collection.toLowerCase())) {
      relevantData[collection] = dbData[collection];
    }
  });
  
  // If no specific collection mentioned, include all
  if (Object.keys(relevantData).length === 0) {
    return dbData;
  }
  
  return relevantData;
};

/**
 * Generate a summary table from data
 * @param {Array} data - Array of documents
 * @param {Array} fields - Fields to include
 * @returns {string} - Markdown table
 */
export const generateMarkdownTable = (data, fields) => {
  if (!data || data.length === 0) return '';
  
  // Header
  let table = '| ' + fields.join(' | ') + ' |\n';
  table += '| ' + fields.map(() => '---').join(' | ') + ' |\n';
  
  // Rows (limit to first 10 for readability)
  const limitedData = data.slice(0, 10);
  limitedData.forEach(row => {
    const values = fields.map(field => {
      const value = row[field];
      if (value === undefined || value === null) return '-';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    table += '| ' + values.join(' | ') + ' |\n';
  });
  
  if (data.length > 10) {
    table += `\n*Showing 10 of ${data.length} records*\n`;
  }
  
  return table;
};

/**
 * Perform aggregation on data
 * @param {Array} data - Array of documents
 * @param {string} groupByField - Field to group by
 * @param {string} aggregateField - Field to aggregate (optional for count)
 * @param {string} operation - 'count', 'sum', 'avg', 'min', 'max'
 * @returns {Object} - Aggregated results
 */
export const aggregateData = (data, groupByField, aggregateField = null, operation = 'count') => {
  const groups = {};
  
  data.forEach(doc => {
    const groupValue = doc[groupByField] || 'Unknown';
    if (!groups[groupValue]) {
      groups[groupValue] = [];
    }
    groups[groupValue].push(doc);
  });
  
  const results = {};
  
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    
    switch(operation) {
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
 * @param {Object} aggregatedData - Results from aggregateData
 * @param {string} keyLabel - Label for the grouping column
 * @param {string} valueLabel - Label for the value column
 * @returns {string} - Markdown table
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