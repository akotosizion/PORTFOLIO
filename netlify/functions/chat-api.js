/**
 * Netlify Serverless Function — AI Chatbot Backend
 * Replaces chat-api.php — Connects to Groq API (Free Tier)
 * Uses Llama 3 model — fast, smart, and completely free
 */

const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an AI assistant embedded in John Zion G. Pabilando's portfolio website.
Your job is to answer questions about Zion in a friendly, professional tone.

## Personal Info
- Full Name: John Zion G. Pabilando
- Nickname: Zion/Gie/Ulo
- Pronouns: he/him
- Age: 21
- Birthday: December 11, 2004
- School: Guagua National Colleges
- Lives in: San Fernando, Pampanga, Philippines
- Education: BSIT (Bachelor of Science in Information Technology) Student
- Bio: Turning pixels into purposeful UI/UX experiences

## Skills & Technologies
- Python (built a Payroll System)
- PHP, HTML, CSS (built web games and applications)
- GDevelop (3D game development)
- UI/UX Design
- Web Development

## Projects
1. **Basic Payroll System with Loan Deduction**
   - Modular Python-based Payroll Management System
   - Handles employee records, salary computations, and tax deductions over a corporate year

2. **Rock Paper Scissors Game**
   - Interactive web-based game using PHP, HTML, and CSS
   - Published and deployed using Vercel
   - Leaderboard data and player rankings are handled in NeonDB

3. **3D Car Game**
   - Built with GDevelop (no-code game engine)
   - Features smooth controls, responsive gameplay
   - Event-based logic system

4. **Boarding House Finder**
   - Convennient website that is design for students who's struggling to find a boarding house
   - Database for user information was handled via vercel
   - Database for image upload was handled via cloudnary

## Social Links
- Facebook: facebook.com/zion.pabilando
- Instagram: @pzycho.zii
- LinkedIn: linkedin.com/in/zion-pabilando-1908853ba

## Credentials & Certifications
- Issued by: Certiport, a Pearson VUE business
- Adobe Certified Professional in Visual Design Using Adobe Photoshop
- IT Specialist - Networking

## Rules for Responding
- Always respond in a friendly, professional, and conversational tone
- If you don't know something about Zion, say so honestly
- Keep responses concise but helpful (2-4 sentences for simple questions)
- You can suggest the visitor connect on social media for more details
- If asked about topics unrelated to Zion, politely redirect the conversation
- Do not use markdown formatting — keep it plain text for chat`;

exports.handler = async function (event) {
  // Handle CORS preflight
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Only POST requests are allowed' }),
    };
  }

  // Get API key from environment variable
  const API_KEY = process.env.GROQ_API_KEY;
  if (!API_KEY) {
    console.error('GROQ_API_KEY environment variable is not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  let input;
  try {
    input = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!input || !input.message) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing "message" field' }),
    };
  }

  const userMessage = input.message.trim();
  const conversationHistory = input.history || [];

  if (!userMessage) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Message cannot be empty' }),
    };
  }

  // Build messages array for Groq API (OpenAI-compatible format)
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const msg of conversationHistory) {
    const role = msg.role === 'model' ? 'assistant' : 'user';
    messages.push({ role, content: msg.text });
  }

  messages.push({ role: 'user', content: userMessage });

  // Call Groq API
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || 'Unknown API error';
      console.error('Groq API error:', errorMsg);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI error: ' + errorMsg }),
      };
    }

    if (data.choices?.[0]?.message?.content) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ reply: data.choices[0].message.content }),
      };
    } else {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'No response generated.' }),
      };
    }
  } catch (err) {
    console.error('Fetch error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to connect to AI service' }),
    };
  }
};
