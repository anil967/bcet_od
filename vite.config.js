import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import net from 'net';
import { handleApiRequest } from './src/server/api.js';
import { protectAdminPageRequest } from './src/server/adminAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cafeProcess = null;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', (err) => resolve(err.code === 'EADDRINUSE'));
    s.once('listening', () => {
      s.close();
      resolve(false);
    });
    s.listen(port);
  });
}

function ensureCafeServerRunning() {
  isPortOpen(5180).then((inUse) => {
    if (!inUse && !cafeProcess) {
      console.log('\x1b[35m[Vite]\x1b[0m Auto-launching OdysseyBite Cafe server on port 5180...');
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      cafeProcess = spawn(npmCmd, ['run', 'dev'], {
        cwd: path.join(__dirname, 'ODYSSEY_Caffae'),
        shell: true,
        stdio: 'inherit',
      });
    }
  });
}

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/food': {
        target: 'http://localhost:5180',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            ensureCafeServerRunning();
            if (res && typeof res.writeHead === 'function' && !res.headersSent) {
              const url = req.url || '';
              if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.svg') || url.endsWith('.ico')) {
                res.writeHead(404);
                res.end();
                return;
              }
              if (url.includes('/api/')) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Cafe server starting...' }));
                return;
              }
              res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta http-equiv="refresh" content="2">
                    <title>Starting Cafe Server...</title>
                    <style>
                      body { font-family: system-ui, sans-serif; background: #0c121e; color: #f1c40f; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                      .card { background: #131c2e; padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(243, 156, 18, 0.3); max-width: 440px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                      .spinner { width: 36px; height: 36px; border: 3px solid rgba(243, 156, 18, 0.2); border-top-color: #f39c12; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem; }
                      @keyframes spin { to { transform: rotate(360deg); } }
                      h2 { margin: 0 0 0.5rem; font-size: 1.25rem; }
                      p { color: #94a3b8; font-size: 0.9rem; margin: 0; }
                    </style>
                  </head>
                  <body>
                    <div class="card">
                      <div class="spinner"></div>
                      <h2>Connecting to OdysseyBite Cafe...</h2>
                      <p>Cafe service is starting up. Page will refresh in 2 seconds.</p>
                    </div>
                  </body>
                </html>
              `);
            }
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.join(__dirname, 'index.html'),
        ideaSubmission: path.join(__dirname, 'idea_submission.html'),
        adminLogin: path.join(__dirname, 'admin/login.html'),
        adminDashboard: path.join(__dirname, 'admin/dashboard.html'),
        adminIdeas: path.join(__dirname, 'admin/ideas.html'),
      },
    },
  },
  plugins: [
    {
      name: 'mongodb-api-middleware',
      configureServer(server) {
        ensureCafeServerRunning();

        const cleanup = () => {
          if (cafeProcess && !cafeProcess.killed) {
            if (process.platform === 'win32' && cafeProcess.pid) {
              spawn('taskkill', ['/pid', cafeProcess.pid.toString(), '/T', '/F']);
            } else {
              cafeProcess.kill('SIGINT');
            }
          }
        };

        server.httpServer?.on('close', cleanup);
        process.on('exit', cleanup);
        server.middlewares.use(async (req, res, next) => {
          const requestPath = req.url ? req.url.split('?')[0] : '';
          if (requestPath === '/food') {
            res.writeHead(302, { Location: '/food/' });
            res.end();
            return;
          }
          if (requestPath === '/admin' || requestPath === '/admin/') {
            req.url = '/admin/login.html';
          } else if (requestPath === '/admin/login' || requestPath === '/admin/login/') {
            req.url = '/admin/login.html';
          } else if (requestPath === '/admin/dashboard' || requestPath === '/admin/dashboard/') {
            req.url = '/admin/dashboard.html';
          } else if (requestPath === '/admin/ideas' || requestPath === '/admin/ideas/' || requestPath === '/admin/idea-submissions' || requestPath === '/admin/idea-submissions/') {
            req.url = '/admin/ideas.html';
          }

          if (protectAdminPageRequest(req, res)) return;
          if (requestPath === '/project-submission' || requestPath === '/project-submission/' || requestPath.startsWith('/api/project-submissions')) {
            res.statusCode = 404;
            res.end('Not Found');
            return;
          }
          if (req.url && req.url.startsWith('/api/')) {
            try {
              const handled = await handleApiRequest(req, res);
              if (handled) return;
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'API route not found' }));
              return;
            } catch (err) {
              console.error('Middleware API error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }
          next();
        });
      }
    },
    {
      name: 'admin-route-generator',
      closeBundle() {
        const dist = path.join(__dirname, 'dist');
        const loginHtml = path.join(dist, 'admin', 'login.html');
        const dashboardHtml = path.join(dist, 'admin', 'dashboard.html');
        const ideasHtml = path.join(dist, 'admin', 'ideas.html');
        const loginDir = path.join(dist, 'admin', 'login');
        const dashboardDir = path.join(dist, 'admin', 'dashboard');
        const ideasDir = path.join(dist, 'admin', 'ideas');

        if (fs.existsSync(loginHtml)) {
          fs.mkdirSync(loginDir, { recursive: true });
          fs.copyFileSync(loginHtml, path.join(loginDir, 'index.html'));
        }
        if (fs.existsSync(dashboardHtml)) {
          fs.mkdirSync(dashboardDir, { recursive: true });
          fs.copyFileSync(dashboardHtml, path.join(dashboardDir, 'index.html'));
        }
        if (fs.existsSync(ideasHtml)) {
          fs.mkdirSync(ideasDir, { recursive: true });
          fs.copyFileSync(ideasHtml, path.join(ideasDir, 'index.html'));
        }
      }
    }
  ]
});
