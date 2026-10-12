import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const foodDistDir = path.join(distDir, 'food');
const cafeClientDir = path.join(rootDir, 'ODYSSEY_Caffae', 'dist', 'client');
const cafeServerEntry = path.join(rootDir, 'ODYSSEY_Caffae', 'dist', 'server', 'server.js');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function bundle() {
  console.log('[Bundle] Copying cafe client build to dist/food...');
  copyDirRecursive(cafeClientDir, foodDistDir);

  // Copy public assets if available
  const cafePublicDir = path.join(rootDir, 'ODYSSEY_Caffae', 'public');
  if (fs.existsSync(cafePublicDir)) {
    copyDirRecursive(cafePublicDir, foodDistDir);
  }

  // Prerender food pages
  if (fs.existsSync(cafeServerEntry)) {
    console.log('[Bundle] Pre-rendering static HTML for food routes...');
    try {
      const serverModule = await import(pathToFileURL(cafeServerEntry).href);
      const routes = [
        { path: '/food/', file: path.join(foodDistDir, 'index.html') },
        { path: '/food/track', file: path.join(foodDistDir, 'track', 'index.html') },
        { path: '/food/admin', file: path.join(foodDistDir, 'admin', 'index.html') },
        { path: '/food/admin/menu', file: path.join(foodDistDir, 'admin', 'menu', 'index.html') },
        { path: '/food/admin/summary', file: path.join(foodDistDir, 'admin', 'summary', 'index.html') },
      ];

      for (const route of routes) {
        try {
          const req = new Request(`http://localhost${route.path}`);
          const res = await serverModule.default.fetch(req);
          if (res.status === 200) {
            const html = await res.text();
            fs.mkdirSync(path.dirname(route.file), { recursive: true });
            fs.writeFileSync(route.file, html, 'utf-8');
            console.log(`[Bundle] Rendered ${route.path} -> ${path.relative(rootDir, route.file)}`);
          }
        } catch (err) {
          console.warn(`[Bundle] Could not pre-render ${route.path}:`, err.message);
        }
      }
    } catch (err) {
      console.warn('[Bundle] Failed to import server entry for pre-rendering:', err.message);
    }
  }

  console.log('[Bundle] Successfully bundled ODYSSEY_Caffae into dist/food!');
}

bundle().catch((err) => {
  console.error('[Bundle Error]:', err);
  process.exit(1);
});
