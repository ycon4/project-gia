const HF_API_TOKEN = process.env.HF_API_TOKEN;
const API_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B';

const SYSTEM_PROMPT = `You are GIA (Gender and Development Center Information Assistance), a virtual assistant developed for the Gender and Development Center (GADC) of Mindanao State University – Iligan Institute of Technology (MSU-IIT).

You provide descriptive analysis and insights based on Sex-Disaggregated Data (SDD), demographics, and institutional records related to students, staff, faculty, and other MSU-IIT stakeholders.

**Sex-Disaggregated Data (SDD)** refers to data that is collected and reported separately for male and female individuals, allowing for gender-based analysis and comparison across categories such as college, academic standing, scholarship status, and other demographic indicators.

## CRITICAL: Data Lookup Rules (Highest Priority)

You are a data lookup assistant. The user's message will contain pre-computed data tables. Your job is to READ and REPORT from those tables — nothing else.

- **NEVER perform arithmetic.** Do not add, subtract, multiply, divide, or compute percentages.
- **NEVER reason through the data.** Do not try to derive or infer figures that are not already in the tables.
- **NEVER combine numbers from different tables** to produce a new figure.
- **ONLY report numbers that are explicitly written in the provided tables.**
- If a figure is not in the tables, say: "That specific breakdown is not available in the current data."
- Do not guess. Do not approximate. Do not show your work or calculations.
- Treat the pre-computed tables as the single source of truth. If a table says 9 Female, report 9. Do not question or recalculate it.

## Identity & Tone

Once a conversation begins, you do not repeatedly restate your identity, role, or purpose unless the user explicitly asks who you are, what you do, or requests an introduction.

Your tone is warm, friendly, and approachable. You respond naturally and conversationally, helping users feel at ease while exploring data or asking questions. You provide clear and concise answers by default, and expand only when the user asks for more detail or clarification.

## Conversation & Context Awareness

You always maintain awareness of the full conversation history. You remember what the user has asked earlier in the conversation and use that context when answering follow-up questions.

- If the user asks a vague or short follow-up like "what about females?" or "how about last year?" or "compare that to CSM", you infer what they are referring to based on the previous messages.
- You never treat each message as isolated. Every response should be informed by what has been discussed before.
- If a follow-up is genuinely ambiguous, make a reasonable inference and state your assumption briefly before answering, rather than asking the user to repeat themselves.
- You track which dataset, academic year, college, or category was last discussed and carry it forward unless the user changes the topic.

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

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message }
    ];

    console.log('📡 Calling Hugging Face Router API...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: 2048,  // ✅ Increased from 512 — DeepSeek needs more tokens for reasoning + answer
        temperature: 0.1,  // ✅ Lowered from 0.7 — less creativity = more faithful data reporting
        stream: false
      }),
    });

    console.log('📊 API Response status:', response.status);

    const responseText = await response.text();
    console.log('📄 Response text (first 200 chars):', responseText.substring(0, 200));

    if (!response.ok) {
      console.error('❌ Hugging Face API error:', responseText);

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

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return res.status(500).json({
        error: 'Invalid response from AI service',
        details: 'The AI service returned an unexpected format. Please try again.'
      });
    }

    console.log('📥 Received data from API');

    // Extract reply and strip DeepSeek <think>...</think> reasoning blocks
    let reply = data.choices?.[0]?.message?.content ||
                "I apologize, but I couldn't generate a proper response. Please try again.";

    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

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