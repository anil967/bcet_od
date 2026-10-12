import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './src/server/api.js';
import { protectAdminPageRequest } from './src/server/adminAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.mpeg': 'audio/mpeg'
};

function proxyToFoodServer(req, res) {
  const foodPort = process.env.FOOD_PORT || 5180;
  const options = {
    hostname: '127.0.0.1',
    port: foodPort,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${foodPort}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[Food Proxy Error]:', err.message);
    res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head><title>Odyssey Cafe - Connecting</title></head>
        <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center;">
          <h2 style="color: #f59e0b;">OdysseyBite Cafe Service Connecting...</h2>
          <p>Please make sure the Odyssey Caffae service is running on port ${foodPort}.</p>
          <p><a href="/" style="color: #38bdf8;">&larr; Back to Odyssey Main Site</a></p>
        </body>
      </html>
    `);
  });

  req.pipe(proxyReq);
}

const server = http.createServer(async (req, res) => {
  if (protectAdminPageRequest(req, res)) return;

  const requestPath = req.url ? req.url.split('?')[0] : '';
  if (requestPath === '/project-submission' || requestPath === '/project-submission/' || requestPath.startsWith('/api/project-submissions')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // Handle Food / Cafe routes
  if (requestPath === '/food') {
    res.writeHead(302, { Location: '/food/' });
    res.end();
    return;
  }
  if (requestPath.startsWith('/food/')) {
    proxyToFoodServer(req, res);
    return;
  }

  // Handle API routes
  if (req.url && req.url.startsWith('/api/')) {
    try {
      const handled = await handleApiRequest(req, res);
      if (handled) return;
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'API route not found' }));
      return;
    } catch (err) {
      console.error('[Server Error] API handler failed:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
      return;
    }
  }

  // Serve static files from dist in production
  let reqPath = requestPath;
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(DIST_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexFile = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexFile, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
