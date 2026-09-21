import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SESSION_COOKIE = 'odyssey_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();

function getCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!username || !passwordHash) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be configured');
  }
  return { username, passwordHash };
}

function parseCookies(req) {
  const cookies = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator > 0) {
      cookies[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return cookies;
}

function passwordMatches(password, storedHash) {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, costText, blockSizeText, parallelizationText, saltHex, digestHex] = parts;
  const cost = Number(costText);
  const blockSize = Number(blockSizeText);
  const parallelization = Number(parallelizationText);
  if (!Number.isInteger(cost) || !Number.isInteger(blockSize) || !Number.isInteger(parallelization)) return false;

  try {
    const expected = Buffer.from(digestHex, 'hex');
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: 32 * 1024 * 1024,
    });
    return expected.length > 0 && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
}

export function authenticateAdmin(req) {
  cleanupSessions();
  const token = parseCookies(req)[SESSION_COOKIE];
  const session = token ? sessions.get(token) : null;
  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return session;
}

export function loginAdmin(username, password) {
  const { username: configuredUsername, passwordHash } = getCredentials();
  const validUsername = typeof username === 'string'
    && username.length === configuredUsername.length
    && crypto.timingSafeEqual(Buffer.from(username), Buffer.from(configuredUsername));
  if (!validUsername || typeof password !== 'string' || !passwordMatches(password, passwordHash)) {
    return null;
  }

  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, {
    username: configuredUsername,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return { token, username: configuredUsername };
}

export function logoutAdmin(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
}

export function sessionCookie(token, maxAge = SESSION_TTL_MS / 1000) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

export function expiredSessionCookie() {
  return sessionCookie('', 0);
}

export function isAdminPageRequest(pathname) {
  const clean = (pathname || '').replace(/\/$/, '');
  return (
    clean === '/admin' ||
    clean === '/admin/login' ||
    clean === '/admin/login.html' ||
    clean === '/admin/dashboard' ||
    clean === '/admin/dashboard.html' ||
    clean === '/admin/ideas' ||
    clean === '/admin/ideas.html' ||
    clean === '/admin/idea-submissions' ||
    clean === '/admin/idea-submissions.html'
  );
}

export function protectAdminPageRequest(req, res) {
  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname.replace(/\/$/, '');
  if (!isAdminPageRequest(pathname)) return false;

  const session = authenticateAdmin(req);
  const isProtectedAdminPage = (
    pathname === '/admin/dashboard' ||
    pathname === '/admin/dashboard.html' ||
    pathname === '/admin/ideas' ||
    pathname === '/admin/ideas.html' ||
    pathname === '/admin/idea-submissions' ||
    pathname === '/admin/idea-submissions.html'
  );

  if (isProtectedAdminPage && !session) {
    res.writeHead(302, { Location: '/admin/login' });
    res.end();
    return true;
  }
  if ((pathname === '/admin/login' || pathname === '/admin/login.html' || pathname === '/admin') && session) {
    res.writeHead(302, { Location: '/admin/dashboard' });
    res.end();
    return true;
  }
  return false;
}

export function getAdminUsername() {
  return getCredentials().username;
}
