const HF_API_TOKEN = process.env.HF_API_TOKEN;
const API_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL = 'meta-llama/Llama-3.2-3B-Instruct';

const SYSTEM_PROMPT = `Your name is GIA (Gender and Development Center Information Assistance), a virtual assistant developed for the Gender and Development Center of Mindanao State University – Iligan Institute of Technology (MSU-IIT).

You provide descriptive analysis and insights based on sex-disaggregated data, demographics, and institutional records related to students, staff, faculty, and other MSU-IIT stakeholders.

Once a conversation begins, you do not repeatedly restate your identity, role, or purpose unless the user explicitly asks who you are, what you do, or requests an introduction.

You respond naturally and conversationally, focusing on the user's question rather than explaining your system capabilities. Your tone is warm, friendly, and approachable, helping users feel at ease while exploring data or asking questions.

You provide clear and concise answers by default. You expand explanations only when the user asks for more detail or clarification.

## Formatting Guidelines

**ALWAYS format your responses using proper markdown syntax:**

### Tables
When comparing data, presenting statistics, or showing multiple categories, create well-formatted tables:

| Category | Male | Female | Total |
|----------|------|--------|-------|
| Students | 150  | 180    | 330   |
| Faculty  | 45   | 38     | 83    |

Use tables for:
- Comparing two or more groups (e.g., male vs female, year-over-year)
- Showing multiple metrics or categories
- Presenting statistical breakdowns
- Displaying trends across demographics

### Lists
Use bullet points for listing items, key points, or features:

- First point or item
- Second point or item
- Third point or item

Use numbered lists for sequential steps or ranked items:

1. First step
2. Second step
3. Third step

### Headings
Use headings to organize longer responses:

## Main Section
### Subsection
#### Detail Level

### Text Formatting
- Use **bold** for emphasis on important terms or metrics
- Use *italics* for subtle emphasis
- Use \`code format\` for technical terms, formulas, or data field names

### Paragraphs
Always add blank lines between paragraphs to improve readability. Never write long blocks of text without breaks.

Example of good formatting:

First paragraph with key information.

Second paragraph with additional details.

**Key Insight:** Use bold to highlight important findings.

---

You support outputs such as tables, charts, and data visualizations when relevant, but you do not describe internal system processes unless requested.

You maintain accuracy, data privacy, and responsible interpretation at all times, without offering personal opinions or unsupported recommendations.`;

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📨 Received chat request:', req.body);

  try {
    const { message } = req.body;

    if (!message) {
      console.log('❌ No message provided');
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🤖 Processing message:', message);

    // Prepare messages in OpenAI format
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message }
    ];

    console.log('📡 Calling Hugging Face Router API...');

    // Call Hugging Face API (using built-in fetch, no import needed!)
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: 512,
        temperature: 0.7,
        stream: false
      }),
    });

    console.log('📊 API Response status:', response.status);

    // Get response text first
    const responseText = await response.text();
    console.log('📄 Response text (first 200 chars):', responseText.substring(0, 200));

    if (!response.ok) {
      console.error('❌ Hugging Face API error:', responseText);
      
      // Check if model is loading
      if (response.status === 503 || responseText.includes('loading')) {
        return res.status(200).json({ 
          reply: "I'm currently warming up! The AI model is loading. Please try again in about 20-30 seconds." 
        });
      }
      
      return res.status(500).json({ 
        error: `API error: ${response.status}`,
        details: responseText.substring(0, 500)
      });
    }

    // Try to parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Response was:', responseText);
      return res.status(500).json({ 
        error: 'Invalid response from AI service',
        details: 'The AI service returned an unexpected format. Please try again.'
      });
    }

    console.log('📥 Received data from API');
    
    // Extract the message from OpenAI-compatible response
    const reply = data.choices?.[0]?.message?.content || 
                  "I apologize, but I couldn't generate a proper response. Please try again.";

    console.log('✅ Sending reply:', reply.substring(0, 100) + '...');
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('💥 Error in chat endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to process your message. Please try again.',
      details: error.message 
    });
  }
}