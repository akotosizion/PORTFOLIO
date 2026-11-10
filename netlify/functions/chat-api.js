/**
 * Netlify Serverless Function — AI Chatbot Backend
 * Connects to Groq API (Free Tier) — LLaMA 3.3 model
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
   - Convenient website designed for students struggling to find a boarding house
   - Database for user information was handled via Vercel
   - Database for image upload was handled via Cloudinary

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

// Offline / Fallback knowledge base answers
function getLocalFallbackResponse(query) {
  const q = query.toLowerCase();

  if (q.includes('skill') || q.includes('stack') || q.includes('tech') || q.includes('language') || q.includes('tool')) {
    return "Zion is skilled in Python, PHP, HTML, CSS, JavaScript, and UI/UX Design. He also works with GDevelop for game development and Adobe Photoshop for visual design.";
  }

  if (q.includes('payroll')) {
    return "The Basic Payroll System with Loan Deduction is a modular Python-based management system that handles employee records, salary computations, and tax/loan deductions.";
  }

  if (q.includes('car') || (q.includes('game') && q.includes('3d'))) {
    return "Zion's 3D Car Game was built using GDevelop. It features smooth controls, responsive gameplay, and an event-based logic system. You can even play it live from the Projects section!";
  }

  if (q.includes('rock') || q.includes('paper') || q.includes('scissors') || q.includes('rps')) {
    return "The Rock Paper Scissors Game is an interactive web game built with PHP, HTML, and CSS, deployed on Vercel with player leaderboards handled via NeonDB.";
  }

  if (q.includes('boarding') || q.includes('house') || q.includes('finder')) {
    return "The Boarding House Finder is a web application designed to help students easily find accommodations. It handles user data via Vercel and photo uploads via Cloudinary.";
  }

  if (q.includes('how many') || q.includes('total') || q.includes('count') || q.includes('list') || q.includes('project') || q.includes('portfolio') || q.includes('work') || q.includes('built')) {
    return "Zion has built 4 featured projects:\n1. Basic Payroll System with Loan Deduction (Python)\n2. Rock Paper Scissors Game (PHP/CSS/HTML + NeonDB)\n3. 3D Car Game (GDevelop)\n4. Boarding House Finder (Vercel + Cloudinary)";
  }

  if (q.includes('cert') || q.includes('credential') || q.includes('license')) {
    return "Zion is certified through Certiport (Pearson VUE) as an Adobe Certified Professional in Visual Design Using Adobe Photoshop and an IT Specialist in Networking.";
  }

  if (q.includes('contact') || q.includes('reach') || q.includes('social') || q.includes('facebook') || q.includes('insta') || q.includes('linkedin') || q.includes('email')) {
    return "You can connect with Zion on LinkedIn (linkedin.com/in/zion-pabilando-1908853ba), Facebook (facebook.com/zion.pabilando), or Instagram (@pzycho.zii).";
  }

  if (q.includes('who') || q.includes('about') || q.includes('age') || q.includes('birthday') || q.includes('school') || q.includes('college') || q.includes('where') || q.includes('education')) {
    return "John Zion G. Pabilando (Zion) is a 21-year-old BSIT student at Guagua National Colleges, living in San Fernando, Pampanga. He specializes in UI/UX and web development.";
  }

  if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('sup') || q.includes('good morning') || q.includes('good afternoon')) {
    return "Hello! 👋 I'm Zion's AI assistant. Ask me anything about Zion's skills, projects, certifications, or how to reach him!";
  }

  return "Zion is a BSIT student and UI/UX developer from Pampanga, Philippines. You can ask me about his 4 projects (Payroll System, Rock Paper Scissors, 3D Car Game, and Boarding House Finder), his skills, or certifications!";
}

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

  // Check API key from environment variable
  let API_KEY = process.env.GROQ_API_KEY || '';
  API_KEY = API_KEY.trim().replace(/^["']|["']$/g, '');

  const isKeyMissingOrPlaceholder = !API_KEY || API_KEY === '' || API_KEY.includes('your_groq_api_key');

  if (isKeyMissingOrPlaceholder) {
    console.log('Notice: GROQ_API_KEY is not configured.');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: `⚠️ [Offline Mode — GROQ_API_KEY is not set]:\n\n${getLocalFallbackResponse(userMessage)}\n\n(Tip: Add your free Groq API key from console.groq.com to enable live AI chat!)`
      }),
    };
  }

  // Build messages array for Groq API (OpenAI-compatible format)
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const msg of conversationHistory) {
    const role = msg.role === 'model' ? 'assistant' : 'user';
    const content = (msg.text || msg.content || '').trim();
    if (content) {
      messages.push({ role, content });
    }
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
      const errorMsg = data?.error?.message || response.statusText || 'API error';
      console.error('Groq API error:', errorMsg);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reply: `⚠️ Groq AI Error (${errorMsg}):\n\n${getLocalFallbackResponse(userMessage)}`
        }),
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
        statusCode: 200,
        headers,
        body: JSON.stringify({ reply: getLocalFallbackResponse(userMessage) }),
      };
    }
  } catch (err) {
    console.error('Groq fetch error:', err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: `⚠️ Connection error to AI service (${err.message}):\n\n${getLocalFallbackResponse(userMessage)}`
      }),
    };
  }
};
