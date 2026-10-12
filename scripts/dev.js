import { spawn } from 'child_process';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const cafeDir = path.resolve(rootDir, 'ODYSSEY_Caffae');

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════');
console.log('\x1b[33m%s\x1b[0m', '   ODYSSEY PLATFORM (Main & Food Cafe) Dev Server');
console.log('\x1b[32m%s\x1b[0m', '   Main Site : http://localhost:5173/');
console.log('\x1b[35m%s\x1b[0m', '   Food Court: http://localhost:5173/food/ (proxied to 5180)');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════\n');

function prefixStream(stream, prefix, colorCode) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim().length > 0) {
        console.log(`\x1b[${colorCode}m${prefix}\x1b[0m ${line}`);
      }
    }
  });
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

let mainProcess = null;
let cafeProcess = null;

async function start() {
  const is5173Used = await isPortInUse(5173);
  if (is5173Used) {
    console.log('\x1b[36m[ODYSSEY]\x1b[0m Main Vite server already active on port 5173.');
  } else {
    mainProcess = spawn(npxCmd, ['vite', '--host', '--port', '5173'], {
      cwd: rootDir,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    prefixStream(mainProcess.stdout, '[ODYSSEY]', '36');
    prefixStream(mainProcess.stderr, '[ODYSSEY:ERR]', '31');
  }

  const is5180Used = await isPortInUse(5180);
  if (is5180Used) {
    console.log('\x1b[35m[CAFFE]\x1b[0m OdysseyBite Cafe server already active on port 5180.');
  } else {
    cafeProcess = spawn(npmCmd, ['run', 'dev'], {
      cwd: cafeDir,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    prefixStream(cafeProcess.stdout, '[CAFFE]', '35');
    prefixStream(cafeProcess.stderr, '[CAFFE:ERR]', '31');
  }
}

function killChild(child) {
  if (!child || child.killed) return;
  if (isWin && child.pid) {
    try {
      spawn('taskkill', ['/pid', child.pid.toString(), '/T', '/F']);
    } catch {}
  } else {
    try {
      child.kill('SIGINT');
    } catch {}
  }
}

function cleanup() {
  console.log('\nShutting down dev servers...');
  killChild(mainProcess);
  killChild(cafeProcess);
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  killChild(mainProcess);
  killChild(cafeProcess);
});

start();
