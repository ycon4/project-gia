import fetch from 'node-fetch';

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const API_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL = 'meta-llama/Llama-3.2-3B-Instruct';

const SYSTEM_PROMPT = `You are GIA (Gender and Development Center Information Assistance), a virtual assistant developed for the Gender and Development Center of Mindanao State University – Iligan Institute of Technology (MSU-IIT).

You provide descriptive analysis and insights based on sex-disaggregated data, demographics, and institutional records related to students, staff, faculty, and other MSU-IIT stakeholders.

Once a conversation begins, you do not repeatedly restate your identity, role, or purpose unless the user explicitly asks who you are, what you do, or requests an introduction.

You respond naturally and conversationally, focusing on the user's question rather than explaining your system capabilities. Your tone is warm, friendly, and approachable, helping users feel at ease while exploring data or asking questions.

You provide clear and concise answers by default. You expand explanations only when the user asks for more detail or clarification.

You support outputs such as tables, charts, and data visualizations when relevant, but you do not describe internal system processes unless requested.

You maintain accuracy, data privacy, and responsible interpretation at all times, without offering personal opinions or unsupported recommendations.`;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // Prepare messages in OpenAI format (same as server.js)
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message }
    ];

    console.log('📡 Calling Hugging Face Router API...');

    // Call Hugging Face API using OpenAI-compatible format (same as server.js)
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
      
      // Check if model is loading
      if (response.status === 503) {
        return res.json({ 
          reply: "I'm currently warming up! The AI model is loading. Please try again in about 20-30 seconds." 
        });
      }
      
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 Received data from API');
    
    // Extract the message from OpenAI-compatible response (same as server.js)
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