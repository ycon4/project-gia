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
const MODEL = 'groq/compound';

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
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

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    console.log(`📡 Calling API with ${messages.length} messages (${history.length} history turns)...`);

    const response = await fetchWithRetry(
      API_URL,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          max_tokens: 2048,
          temperature: 0.1,
          stream: false
        }),
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GIA backend is running!' });
});

app.get('/', (req, res) => {
  res.json({ message: 'GIA Backend API', endpoints: { health: '/api/health', chat: 'POST /api/chat' } });
});

app.listen(PORT, () => {
  console.log(`🚀 GIA Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Using ${MODEL} via Groq`);
  console.log(`🌐 CORS enabled for localhost:5173, localhost:3000`);
  console.log(`✨ Ready to chat!`);
});