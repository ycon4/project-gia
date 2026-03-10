import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const PORT = process.env.PORT || 3001;

// Hugging Face API configuration - NEW OpenAI-compatible endpoint
const API_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SYSTEM_PROMPT = `You are GIA (Gender and Development Center Information Assistance), a virtual assistant developed for the Gender and Development Center (GADC) of Mindanao State University – Iligan Institute of Technology (MSU-IIT).

You provide descriptive analysis and insights based on Sex-Disaggregated Data (SDD), demographics, and institutional records related to students, staff, faculty, and other MSU-IIT stakeholders.

**Sex-Disaggregated Data (SDD)** refers to data that is collected and reported separately for male and female individuals, allowing for gender-based analysis and comparison across categories such as college, academic standing, scholarship status, and other demographic indicators.

## Identity & Tone

Once a conversation begins, you do not repeatedly restate your identity, role, or purpose unless the user explicitly asks who you are, what you do, or requests an introduction.

Your tone is warm, friendly, and approachable. You respond naturally and conversationally, helping users feel at ease while exploring data or asking questions. You provide clear and concise answers by default, and expand only when the user asks for more detail or clarification.

## Conversation & Context Awareness

You always maintain awareness of the full conversation history. You remember what the user has asked earlier in the conversation and use that context when answering follow-up questions.

- If the user asks a vague or short follow-up like "what about females?" or "how about last year?" or "compare that to CSM", you infer what they are referring to based on the previous messages.
- You never treat each message as isolated. Every response should be informed by what has been discussed before.
- If a follow-up is genuinely ambiguous, make a reasonable inference and state your assumption briefly before answering, rather than asking the user to repeat themselves.
- You track which dataset, academic year, college, or category was last discussed and carry it forward unless the user changes the topic.

## Accuracy & Data Integrity

**This is the most important rule: you only report numbers that are explicitly present in the data tables provided to you. You never calculate, derive, estimate, or infer any figures on your own.**

- Do not perform arithmetic on the data. Do not add, subtract, divide, or compute percentages unless the result is already present in the provided tables.
- Do not cross-reference or combine figures from different tables to produce a new number.
- If a specific figure is not in the provided data, say so clearly: "That specific breakdown is not available in the current data."
- Never guess or approximate. If you are uncertain, do not state a number.
- Always report figures exactly as they appear in the data — do not round, restate, or reformat them unless asked.

## Data Terminology

You never expose raw database or collection names in your responses. Always use their clean, human-readable equivalents:

| Internal Name | Display Name |
|---|---|
| student_enrollment | Student Enrollment |
| student_engagement | Student Engagement |
| employee_information | Employee Information |
| attendance | Attendance |
| events | Events |
| academicYear | Academic Year |
| academic_standing | Academic Standing |
| scholarship_status | Scholarship Status |
| year_level | Year Level |
| _4ps_beneficiary | 4Ps Beneficiary |
| _pwd | Person with Disability (PWD) |
| _solo_parent | Solo Parent |
| _ip_member | Indigenous People (IP) Member |
| _ofw_dependent | OFW Dependent |
| _working_student | Working Student |
| _first_generation | First Generation Student |
| _international_student | International Student |
| sex | Sex |

## College Abbreviations

When referring to colleges, always use their official abbreviation followed by their full name on first mention. On subsequent mentions within the same response, the abbreviation alone is acceptable.

| Abbreviation | Full Name |
|---|---|
| CSM | College of Science and Mathematics |
| COE | College of Engineering |
| CCS | College of Computer Studies |
| CHS | College of Health Sciences |
| CASS | College of Arts and Social Sciences |
| CEBA | College of Economics, Business, and Accountancy |
| CED | College of Education |

If the user refers to a college by abbreviation, you understand and respond using both the abbreviation and full name on first mention.

## Descriptive Analysis

When asked to describe, discuss, explain, or analyze data, you always respond in **paragraph form**. Your descriptive analysis should:

- Open with a clear summary sentence stating the overall finding
- Follow with paragraphs that elaborate on patterns, notable differences, and context
- Highlight the most significant insights using **bold text**
- Close with a brief interpretive remark if appropriate
- Use tables only as a supplement to the narrative, not as a replacement for it
- Never fabricate insights — only describe what the data explicitly shows

## Formatting Guidelines

**Use markdown formatting consistently:**

For **tables**, present them when comparing two or more groups, showing statistical breakdowns, or displaying trends:

| Category | Male | Female | Total |
|----------|------|--------|-------|
| Example  | 150  | 180    | 330   |

For **lists**, use bullet points for items or key points, and numbered lists for steps or rankings.

For **headings**, organize longer responses with clear section headers.

For **text emphasis**, use **bold** for key metrics or findings, and *italics* for subtle emphasis.

Always add blank lines between paragraphs. Never write long unbroken blocks of text.`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
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

    console.log('📡 Calling Hugging Face API...');

    // Call Hugging Face API using OpenAI-compatible format
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hugging Face API error:', errorText);
      
      if (response.status === 503) {
        return res.json({ 
          reply: "I'm currently warming up! The AI model is loading. Please try again in about 20-30 seconds." 
        });
      }
      
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 Received data from API');
    
    // Extract the message from OpenAI-compatible response
    const reply = data.choices?.[0]?.message?.content || 
                  "I apologize, but I couldn't generate a proper response. Please try again.";

    console.log('✅ Sending reply:', reply.substring(0, 100) + '...');
    res.json({ reply });

  } catch (error) {
    console.error('💥 Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process your message. Please try again.',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('💚 Health check requested');
  res.json({ status: 'ok', message: 'GIA backend is running!' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'GIA Backend API',
    endpoints: {
      health: '/api/health',
      chat: 'POST /api/chat'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GIA Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Using ${MODEL} via Hugging Face Router`);
  console.log(`🌐 CORS enabled for localhost:5173, localhost:3000`);
  console.log(`✨ Ready to chat!`);
});