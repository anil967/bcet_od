import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './src/server/api.js';
import { protectAdminPageRequest } from './src/server/adminAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: true,
    port: 5173,
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
        server.middlewares.use(async (req, res, next) => {
          const requestPath = req.url ? req.url.split('?')[0] : '';
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
            } catch (err) {
              console.error('Middleware API error:', err);
              res.statusCode = 500;
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
