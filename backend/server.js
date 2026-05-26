import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 3001;

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Load system prompt from prompt.txt ─────────────────────
const PROMPT_FILE = join(__dirname, 'prompt.txt');
const SYSTEM_PROMPT = existsSync(PROMPT_FILE)
  ? readFileSync(PROMPT_FILE, 'utf-8').trim()
  : 'You are GIA, a helpful assistant for MSU-IIT GADC.';
console.log(existsSync(PROMPT_FILE)
  ? '📄 System prompt loaded from prompt.txt'
  : '⚠️  prompt.txt not found, using fallback prompt');
console.log(`🤖 Model: ${MODEL}`);

// ─── Retry helper ────────────────────────────────────────────
const fetchWithRetry = async (url, options, retries = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;

    const status = response.status;
    console.warn(`⚠️ Attempt ${attempt}/${retries} failed with status ${status}`);

    if (status >= 400 && status < 500 && status !== 429) return response;
    if (attempt === retries) return response;

    const wait = status === 429 ? delayMs * 2 : delayMs;
    console.log(`⏳ Waiting ${wait / 1000}s before retry...`);
    await new Promise(r => setTimeout(r, wait));
  }
};

// ─── Chat endpoint ───────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  console.log('📨 Received chat request');

  try {
    const { message, history = [] } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Keep last 6 turns (3 exchanges). Truncate assistant replies so large
    // table responses from previous queries don't blow up the payload.
    const trimmedHistory = history.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.role === 'assistant' && msg.content.length > 500
        ? msg.content.substring(0, 500) + '…'
        : msg.content,
    }));

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...trimmedHistory,
      { role: 'user', content: message }
    ];

    const payload = JSON.stringify({ model: MODEL, messages, max_tokens: 1024, temperature: 0.1, stream: false });
    console.log(`📡 Calling API — ${messages.length} messages, payload: ${(payload.length / 1024).toFixed(1)} KB`);

    const response = await fetchWithRetry(
      API_URL,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      },
      3,
      3000
    );

    console.log('📊 API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error:', errorText);

      if (response.status === 503 || response.status === 500) {
        return res.json({ reply: "I'm currently unavailable due to high server demand. Please try again in 20–30 seconds." });
      }
      if (response.status === 429) {
        return res.json({ reply: "I've hit the rate limit for requests. Please wait a moment and try again." });
      }
      if (response.status === 413) {
        return res.json({ reply: "The request was too large to process. Please try a more specific question." });
      }

      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    let reply = data.choices?.[0]?.message?.content ||
      "I apologize, but I couldn't generate a proper response. Please try again.";

    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    console.log('✅ Sending reply:', reply.substring(0, 100) + '...');
    res.json({ reply });

  } catch (error) {
    console.error('💥 Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process your message. Please try again.', details: error.message });
  }
});

// ─── Intent parsing system prompt ───────────────────────────
const PARSE_INTENT_PROMPT = `You are an intent parser for GIA, a student data assistant for MSU-IIT GADC.
Read the user's question and return ONLY a single valid JSON object — no markdown, no explanation.

## Collections
- "student_enrollment" — student records, vulnerability groups (default for most questions)
- "employee_information" — faculty/staff records
- "attendance" — event attendance
- "events" — event records

## Boolean fields (student_enrollment) — always use value "Yes":
- "_pwd?" — Person with Disability (PWD, disabled)
- "_solo_parent?" — student has a solo parent
- "_ip_member?" — Indigenous People member / Lumad / IP
- "_working_student?" — working student
- "is_first_gen_learner" — first generation learner (1st gen, first-gen, first generation)
- "is_indigenous" — indigenous student
- "is_child_lgbtq" — child of LGBTQ+ person
- "is_child_pdl" — child of Person Deprived of Liberty (PDL)
- "is_child_solo_parent" — child of a solo parent

## Grouping fields (student_enrollment):
- "stud_college" — college
- "stud_program" — degree program / course
- "stud_yrlevel" — year level
- "studgender" — student sex/gender
- "studethnic" — student ethnicity
- "studreligion" — student religion
- "currentadd_prov" — province / place of origin

## Boolean fields (employee_information) — always use value "Yes":
- "is_emp_pwd" — PWD employee (disabled employee, employee with disability)
- "is_emp_senior" — Senior/Administrative Official (senior citizen, admin official)

## Grouping fields (employee_information):
- "empgender" — employee sex/gender
- "emptype" — employee type (teaching, non-teaching, permanent, contractual)
- "emp_plantilla" — plantilla position
- "empsalary_grade" — salary grade / income
- "empethnic" — employee ethnicity
- "empreligion" — employee religion
- "deptcoll" — department/college
- "deptcode" — department code

## College full names (use these exact strings in filterValue/filterValues):
- "College of Science and Mathematics" (CSM)
- "College of Engineering" (COE)
- "College of Computer Studies" (CCS)
- "College of Health Sciences" (CHS)
- "College of Arts and Social Sciences" (CASS)
- "College of Economics, Business, and Accountancy" (CEBA)
- "College of Education" (CED)

## JSON schema:
{
  "isConversational": boolean,
  "collection": string | null,
  "andFilters": [{ "field": string, "value": "Yes" }],
  "groupField": string | null,
  "filterValue": string | null,
  "filterValues": string[],
  "academicYears": string[],
  "wantsSexBreakdown": boolean,
  "wantsAll": boolean,
  "wantsComparison": boolean
}

## Rules:
1. isConversational = true ONLY for pure chat (greetings, thanks, "who are you"). Any data question = false.
2. For employee queries (mentions employee/staff/faculty/instructor/professor/personnel/teacher/worker):
   - Set collection = "employee_information"
   - Use employee fields (empgender, empethnic, empreligion, emptype, etc.) NOT student fields
   - CRITICAL: If query mentions "employee" + "religion" → use "empreligion" (NOT "studreligion")
   - CRITICAL: If query mentions "employee" + "ethnicity" → use "empethnic" (NOT "studethnic")
   - CRITICAL: If query mentions "employee" + "gender/sex" → use "empgender" (NOT "studgender")
   - CRITICAL (reverse): If query mentions "student/students" + "ethnicity" → collection = "student_enrollment", groupField = "studethnic"
   - CRITICAL (reverse): If query mentions "student/students" + "religion" → collection = "student_enrollment", groupField = "studreligion"
   - CRITICAL (reverse): If query mentions "student/students" + "gender/sex" → collection = "student_enrollment", groupField = "studgender"
3. For event-specific queries: if the query uses words like "attended", "attendees", "participants", "attendance for/of" followed by a named event — OR mentions a proper noun event name (e.g. "National Women's Month", "Gender Summit", "Orientation") — set collection = "events" and eventTitle = the extracted event name. Event names do NOT need to contain "seminar"/"workshop"/etc. Always set wantsSexBreakdown = true for event queries.
4. For every boolean attribute mentioned, add {"field": <field>, "value": "Yes"} to andFilters.
4. If a specific college is mentioned: add its full name to filterValues. If only one college: also set filterValue.
5. If user asks "from what college", "which college", "by college", "per college" — set groupField = "stud_college".
6. If user asks for all colleges without naming one — set wantsAll = true and groupField = "stud_college".
7. Extract academic years matching YYYY-YYYY into academicYears array.
8. wantsSexBreakdown = true if: male/female/sex/gender/breakdown mentioned, OR any boolean filter is present.
9. wantsComparison = true if: multiple colleges, multiple years, or compare/versus/vs mentioned.
10. Default collection = "student_enrollment" for student questions.
11. For general enrollment questions with no specific filter: set wantsAll = true and groupField = "stud_college".
12. Return ONLY valid JSON. No extra text.`;

// ─── Parse-intent endpoint ───────────────────────────────────
app.post('/api/parse-intent', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const payload = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: PARSE_INTENT_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: 0,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    });

    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: payload,
    }, 2, 2000);

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const intent = JSON.parse(raw);
    res.json(intent);
  } catch (err) {
    console.error('❌ parse-intent error:', err.message);
    res.status(500).json({ error: 'parse-intent failed' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'GIA backend is running!' });
});

app.get('/', (_req, res) => {
  res.json({ message: 'GIA Backend API', endpoints: { health: '/api/health', chat: 'POST /api/chat' } });
});

app.listen(PORT, () => {
  console.log(`🚀 GIA Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Using ${MODEL} via Groq`);
  console.log(`🌐 CORS enabled for localhost:5173, localhost:3000`);
  console.log(`✨ Ready to chat!`);
});