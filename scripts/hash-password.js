import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl._writeToOutput = () => {};
rl.question('New admin password: ', (password) => {
  rl.close();
  process.stdout.write('\n');
  if (!password || password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exitCode = 1;
    return;
  }
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = crypto.randomBytes(16);
  const digest = crypto.scryptSync(password, salt, 64, { N, r, p, maxmem: 32 * 1024 * 1024 });
  console.log(`ADMIN_PASSWORD_HASH=scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${digest.toString('hex')}`);
});
