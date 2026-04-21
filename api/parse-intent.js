const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const PARSE_INTENT_PROMPT = `You are an intent parser for GIA, a student data assistant for MSU-IIT GADC.
Read the user's question and return ONLY a single valid JSON object — no markdown, no explanation.

## Collections
- "student_enrollment" — student records, vulnerability groups (default for most questions)
- "student_engagement" — academic standing, scholarships, organizations, publications, student council
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
- "studethnic" — ethnicity
- "studreligion" — religion
- "currentadd_prov" — province / place of origin

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
2. For every boolean attribute mentioned, add {"field": <field>, "value": "Yes"} to andFilters.
3. If a specific college is mentioned: add its full name to filterValues. If only one college: also set filterValue.
4. If user asks "from what college", "which college", "by college", "per college" — set groupField = "stud_college".
5. If user asks for all colleges without naming one — set wantsAll = true and groupField = "stud_college".
6. Extract academic years matching YYYY-YYYY into academicYears array.
7. wantsSexBreakdown = true if: male/female/sex/gender/breakdown mentioned, OR any boolean filter is present.
8. wantsComparison = true if: multiple colleges, multiple years, or compare/versus/vs mentioned.
9. Default collection = "student_enrollment" for student questions.
10. For general enrollment questions with no specific filter: set wantsAll = true and groupField = "stud_college".
11. Return ONLY valid JSON. No extra text.`;

const fetchWithRetry = async (url, options, retries = 2, delayMs = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if (attempt === retries) return response;
    await new Promise(r => setTimeout(r, delayMs));
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const intent = JSON.parse(raw);
    return res.status(200).json(intent);
  } catch (err) {
    console.error('❌ parse-intent error:', err.message);
    return res.status(500).json({ error: 'parse-intent failed' });
  }
}
