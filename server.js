// Minimal custom Next.js server with Express and compression
require('dotenv').config();
const express = require('express');
const compression = require('compression');
const next = require('next');
const path = require('path');

const port = Number(process.env.PORT || 3054);
const dev = process.env.NODE_ENV !== 'production' ? true : false;
// Ensure NEXTAUTH_URL is set correctly in production to avoid localhost fallbacks
if (!process.env.NEXTAUTH_URL) {
  if (process.env.NODE_ENV === 'production') {
    process.env.NEXTAUTH_URL = 'https://sellonmap.com';
  } else {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
}

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Trust reverse proxy headers for correct protocol/host (e.g., when behind Nginx)
  server.set('trust proxy', true);

  server.use(compression());

  // Serve Next.js assets and public assets explicitly
  server.use('/_next/static', express.static(path.join(__dirname, '.next/static')));
  server.use(express.static(path.join(__dirname, 'public')));

  server.all('*', (req, res) => handle(req, res));

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port} (dev=${dev})`);
  });
}).catch((err) => {
  console.error('Error occurred starting server:', err);
  process.exit(1);
});


