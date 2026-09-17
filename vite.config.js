import { defineConfig } from 'vite';
import path from 'path';
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
        adminLogin: path.join(__dirname, 'admin/login.html'),
        adminDashboard: path.join(__dirname, 'admin/dashboard.html'),
      },
    },
  },
  plugins: [
    {
      name: 'mongodb-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (protectAdminPageRequest(req, res)) return;
          const requestPath = req.url ? req.url.split('?')[0] : '';
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
    }
  ]
});
