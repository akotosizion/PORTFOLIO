const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env if present
try {
  if (process.loadEnvFile && fs.existsSync('.env')) {
    process.loadEnvFile();
  }
} catch (err) {
  console.warn('Could not load .env file:', err.message);
}

const PORT = process.env.PORT || 3000;
const chatFunction = require('./netlify/functions/chat-api.js');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Handle Netlify function route
  if (pathname === '/.netlify/functions/chat-api' || pathname === '/netlify/functions/chat-api') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const event = {
          httpMethod: req.method,
          headers: req.headers,
          body: body,
        };
        const result = await chatFunction.handler(event);
        res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
        res.end(result.body || '');
      } catch (err) {
        console.error('Function error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Handle static files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Server running locally at http://localhost:${PORT}`);
  console.log(`📡 AI Chatbot endpoint: http://localhost:${PORT}/.netlify/functions/chat-api`);
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('your_groq_api_key')) {
    console.log(`⚠️  Notice: GROQ_API_KEY is not set in .env. Remember to add your key from https://console.groq.com/keys\n`);
  } else {
    console.log(`🔑 GROQ_API_KEY is configured.\n`);
  }
});

