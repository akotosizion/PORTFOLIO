/**
 * Portfolio AI Chatbot — Gemini-style Inline Chat
 * Connects to chat-api.php → Google Gemini API
 */

(function () {
  'use strict';

  // ── Configuration ──
  let API_URL = '/.netlify/functions/chat-api';
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'file:') {
      API_URL = 'http://localhost:3000/.netlify/functions/chat-api';
    } else if (
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      window.location.port !== '3000' &&
      window.location.port !== '8888'
    ) {
      API_URL = 'http://localhost:3000/.netlify/functions/chat-api';
    }
  }
  const WELCOME_MESSAGE = "Hey there! 👋 I'm Zion's AI assistant. Ask me anything about his skills, projects, or experience!";
  const MAX_MESSAGES_PER_SESSION = 30;

  // ── State ──
  let isLoading = false;
  let messageCount = 0;
  let conversationHistory = [];
  let hasShownWelcome = false;

  // ── DOM References ──
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');

  // ── Initialize ──
  function init() {
    if (!chatInput || !chatSend || !chatMessages) return;

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';

      // Toggle send button active state
      if (chatInput.value.trim()) {
        chatSend.classList.add('has-input');
      } else {
        chatSend.classList.remove('has-input');
      }
    });

    // Show welcome on first focus
    chatInput.addEventListener('focus', () => {
      if (!hasShownWelcome) {
        hasShownWelcome = true;
        chatMessages.classList.add('has-messages');
        addBotMessage(WELCOME_MESSAGE);
      }
    });
  }

  // ── Send Message ──
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || isLoading) return;

    if (messageCount >= MAX_MESSAGES_PER_SESSION) {
      addBotMessage("You've reached the message limit for this session. Please refresh the page to start a new conversation! 😊");
      return;
    }

    // Ensure messages area is visible
    chatMessages.classList.add('has-messages');

    // Add user message to UI
    addUserMessage(text);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatSend.classList.remove('has-input');
    messageCount++;

    // Show typing indicator
    const typingEl = showTypingIndicator();
    isLoading = true;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: conversationHistory
        })
      });

      const data = await response.json();
      removeTypingIndicator(typingEl);

      if (data.error) {
        addBotMessage("Sorry, I'm having trouble connecting right now. Please try again in a moment! 🔄");
        console.error('Chatbot API error:', data.error);
      } else {
        // Update conversation history
        conversationHistory.push({ role: 'user', text: text });
        conversationHistory.push({ role: 'model', text: data.reply });

        // Keep history manageable (last 10 exchanges)
        if (conversationHistory.length > 20) {
          conversationHistory = conversationHistory.slice(-20);
        }

        addBotMessage(data.reply);
      }
    } catch (err) {
      removeTypingIndicator(typingEl);
      addBotMessage("Oops! Couldn't reach the server. Please try again in a moment! 🔧");
      console.error('Chatbot fetch error:', err);
    }

    isLoading = false;
  }

  // ── Add User Message Bubble ──
  function addUserMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg chat-msg-user';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-user';
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
  }

  // ── Add Bot Message Bubble ──
  function addBotMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg chat-msg-bot';

    const avatar = document.createElement('div');
    avatar.className = 'chat-bot-avatar';
    avatar.innerHTML = `<svg width="18" height="18" viewBox="0 0 16 16" fill="#58a6ff"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg>`;

    const content = document.createElement('div');
    content.className = 'chat-bubble chat-bubble-bot';
    content.innerHTML = formatMessage(text);

    wrapper.appendChild(avatar);
    wrapper.appendChild(content);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
  }

  // ── Format Message (basic markdown) ──
  function formatMessage(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  // ── Typing Indicator ──
  function showTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg chat-msg-bot chat-typing-wrapper';

    const avatar = document.createElement('div');
    avatar.className = 'chat-bot-avatar';
    avatar.innerHTML = `<svg width="18" height="18" viewBox="0 0 16 16" fill="#58a6ff"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg>`;

    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';

    wrapper.appendChild(avatar);
    wrapper.appendChild(typing);
    chatMessages.appendChild(wrapper);
    scrollToBottom();

    return wrapper;
  }

  function removeTypingIndicator(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  // ── Scroll to Bottom ──
  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  // ── Start ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
