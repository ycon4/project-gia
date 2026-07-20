// Quick test to verify Groq API key works
import fetch from 'node-fetch';
import 'dotenv/config';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

console.log('🔑 API Key:', GROQ_API_KEY ? `${GROQ_API_KEY.substring(0, 10)}...` : 'NOT FOUND');
console.log('📡 Testing Groq API...\n');

async function testGroq() {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: [{ role: 'user', content: 'Say hello in one sentence!' }],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! Groq API is working!');
      console.log('🤖 Response:', data.choices[0].message.content);
      console.log('\n✨ Your Groq setup is correct!');
    } else {
      console.error('❌ FAILED! Groq API error:');
      console.error(JSON.stringify(data, null, 2));

      if (response.status === 401) {
        console.log('\n💡 Fix: Your API key is invalid or expired.');
        console.log('   Get a new key from: https://console.groq.com/keys');
      } else if (response.status === 429) {
        console.log('\n💡 Fix: Rate limit exceeded. Wait 60 seconds and try again.');
      } else if (response.status === 503) {
        console.log('\n💡 Fix: Groq servers are busy. Wait 30 seconds and try again.');
      }
    }
  } catch (error) {
    console.error('💥 Network error:', error.message);
    console.log('\n💡 Fix: Check your internet connection.');
  }
}

testGroq();
