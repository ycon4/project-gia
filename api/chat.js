import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'qwen/qwen3-32b';

// ─── Load prompt from backend/prompt.txt ────────────────────
// api/chat.js is one level up from backend/, so we go ../backend/prompt.txt
const PROMPT_FILE = join(process.cwd(), 'backend', 'prompt.txt');
const SYSTEM_PROMPT = existsSync(PROMPT_FILE)
  ? readFileSync(PROMPT_FILE, 'utf-8').trim()
  : 'You are GIA, a helpful assistant for MSU-IIT GADC.';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: payload,
    }, 3, 3000);

    console.log('📊 API Response status:', response.status);
    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ Groq API error:', responseText);
      if (response.status === 503 || response.status === 500) {
        return res.status(200).json({ reply: "I'm currently unavailable due to high server demand. Please try again in 20–30 seconds." });
      }
      if (response.status === 429) {
        return res.status(200).json({ reply: "I've hit the rate limit for requests. Please wait a moment and try again." });
      }
      if (response.status === 413) {
        return res.status(200).json({ reply: "The request was too large to process. Please try a more specific question." });
      }
      return res.status(500).json({ error: `API error: ${response.status}`, details: responseText.substring(0, 500) });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    let reply = data.choices?.[0]?.message?.content ||
                "I apologize, but I couldn't generate a proper response. Please try again.";

    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    console.log('✅ Sending reply:', reply.substring(0, 100) + '...');
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('💥 Error:', error);
    return res.status(500).json({ error: 'Failed to process your message.', details: error.message });
  }
}