import { ObjectId } from 'mongodb';
import { saveRegistration, checkConnection, getCollection, generateRegId } from './db.js';
import {
  authenticateAdmin,
  expiredSessionCookie,
  loginAdmin,
  logoutAdmin,
  sessionCookie,
} from './adminAuth.js';

async function readJsonBody(req, maxBytes = 1024 * 1024) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > maxBytes) throw Object.assign(new Error('Payload too large'), { statusCode: 413 });
  }
  try {
    return JSON.parse(body);
  } catch {
    throw Object.assign(new Error('Invalid JSON payload'), { statusCode: 400 });
  }
}

function requireAdmin(req, res) {
  if (authenticateAdmin(req)) return true;
  res.statusCode = 401;
  res.end(JSON.stringify({ success: false, message: 'Admin authentication required' }));
  return false;
}

export async function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Set CORS and JSON headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (pathname.startsWith('/api/admin/')) res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req, 16 * 1024);
      const session = loginAdmin(payload.username, payload.password);
      if (!session) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, message: 'Invalid admin credentials' }));
        return true;
      }
      res.setHeader('Set-Cookie', sessionCookie(session.token));
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, username: session.username }));
    } catch (err) {
      res.statusCode = err.statusCode || 503;
      res.end(JSON.stringify({ success: false, message: err.statusCode ? err.message : 'Admin authentication is not configured' }));
    }
    return true;
  }

  if (pathname === '/api/admin/session' && req.method === 'GET') {
    const session = authenticateAdmin(req);
    res.statusCode = session ? 200 : 401;
    res.end(JSON.stringify(session ? { authenticated: true, username: session.username } : { authenticated: false }));
    return true;
  }

  if (pathname === '/api/admin/logout' && req.method === 'POST') {
    logoutAdmin(req);
    res.setHeader('Set-Cookie', expiredSessionCookie());
    res.statusCode = 204;
    res.end();
    return true;
  }

  if (pathname === '/api/admin/registrations' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return true;
    try {
      const registrations = await (await getCollection()).find({}).sort({ registeredAt: -1 }).toArray();
      const serialised = registrations.map((registration) => ({
        ...registration,
        _id: registration._id?.toString(),
      }));
      res.statusCode = 200;
      res.end(JSON.stringify({ registrations: serialised }));
    } catch (err) {
      console.error('[API Error] /api/admin/registrations failed:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, message: 'Unable to load registrations' }));
    }
    return true;
  }

  const statusMatch = pathname.match(/^\/api\/admin\/registrations\/([^/]+)\/status$/);
  if (statusMatch && req.method === 'PATCH') {
    if (!requireAdmin(req, res)) return true;
    const allowedStatuses = new Set(['pending_verification', 'verified', 'rejected']);
    try {
      const { status } = await readJsonBody(req, 16 * 1024);
      if (!allowedStatuses.has(status)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: 'Invalid payment status' }));
        return true;
      }
      if (!ObjectId.isValid(statusMatch[1])) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: 'Invalid registration identifier' }));
        return true;
      }
      const result = await (await getCollection()).updateOne(
        { _id: new ObjectId(statusMatch[1]) },
        { $set: { status } },
      );
      if (result.matchedCount !== 1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Registration not found' }));
        return true;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, status }));
    } catch (err) {
      res.statusCode = err.statusCode || 500;
      res.end(JSON.stringify({ success: false, message: err.statusCode ? err.message : 'Unable to update payment status' }));
    }
    return true;
  }

  // Bulk Import registrations
  if (pathname === '/api/admin/registrations/import' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return true;
    try {
      const payload = await readJsonBody(req, 15 * 1024 * 1024); // up to 15MB
      const items = Array.isArray(payload?.items) ? payload.items : [];
      if (items.length === 0) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: 'No registrations provided for import' }));
        return true;
      }

      const preparedDocs = items.map((raw) => {
        const teamSize = Number(raw.teamSize) || (Array.isArray(raw.members) ? raw.members.length + 1 : 1);
        return {
          teamName: String(raw.teamName || 'Imported Team').trim(),
          leaderName: String(raw.leaderName || '').trim(),
          leaderPhone: String(raw.leaderPhone || '').trim(),
          leaderEmail: String(raw.leaderEmail || '').trim(),
          institution: String(raw.institution || raw.college || 'Not Specified').trim(),
          teamSize,
          members: Array.isArray(raw.members) ? raw.members : [],
          accommodation: String(raw.accommodation || 'No').trim(),
          problemStatement: raw.problemStatement || raw.track || '',
          regId: raw.regId || generateRegId(),
          status: raw.status || raw.paymentStatus || 'pending_verification',
          registeredAt: raw.registeredAt || new Date().toISOString(),
          imported: true,
          importedAt: new Date().toISOString(),
          notes: raw.notes || 'Imported via Smart Import',
        };
      });

      const col = await getCollection();
      const result = await col.insertMany(preparedDocs);
      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        count: result.insertedCount,
        message: `Successfully imported ${result.insertedCount} registrations`,
      }));
    } catch (err) {
      console.error('[API Error] Import failed:', err);
      res.statusCode = err.statusCode || 500;
      res.end(JSON.stringify({ success: false, message: err.message || 'Import failed' }));
    }
    return true;
  }

  // Delete registration (single)
  const deleteMatch = pathname.match(/^\/api\/admin\/registrations\/([^/]+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return true;
    try {
      if (!ObjectId.isValid(deleteMatch[1])) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: 'Invalid registration identifier' }));
        return true;
      }
      const result = await (await getCollection()).deleteOne({ _id: new ObjectId(deleteMatch[1]) });
      if (result.deletedCount !== 1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Registration not found' }));
        return true;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, message: 'Registration deleted successfully' }));
    } catch (err) {
      res.statusCode = err.statusCode || 500;
      res.end(JSON.stringify({ success: false, message: err.message || 'Unable to delete registration' }));
    }
    return true;
  }

  // Health check endpoint
  if (pathname === '/api/health' && req.method === 'GET') {
    try {
      const status = await checkConnection();
      res.statusCode = status.connected ? 200 : 503;
      res.end(JSON.stringify({
        status: status.connected ? 'ok' : 'degraded',
        mongodb: status
      }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ status: 'error', message: err.message }));
    }
    return true;
  }

  // Registration endpoint
  if (pathname === '/api/register' && req.method === 'POST') {
    try {
      try {
        const payload = await readJsonBody(req, 20 * 1024 * 1024);

        // Basic validation
        if (!payload.teamName || !payload.leaderName || !payload.leaderPhone || !payload.leaderEmail) {
          res.statusCode = 400;
          res.end(JSON.stringify({
            success: false,
            message: 'Missing required team or leader information'
          }));
          return true;
        }

        const teamSize = Number(payload.teamSize);
        if (![3, 4, 5].includes(teamSize) || !Array.isArray(payload.members) || payload.members.length !== teamSize - 1) {
          res.statusCode = 400;
          res.end(JSON.stringify({
            success: false,
            message: 'Team size must be 3, 4, or 5 members, including the team leader'
          }));
          return true;
        }

        const paymentSlip = payload.paymentSlip;
        const isJpgPaymentSlip = paymentSlip
          && typeof paymentSlip.fileName === 'string'
          && /\.(jpg|jpeg)$/i.test(paymentSlip.fileName)
          && paymentSlip.fileType === 'image/jpeg'
          && typeof paymentSlip.dataUrl === 'string'
          && paymentSlip.dataUrl.startsWith('data:image/jpeg;base64,');
        if (!isJpgPaymentSlip) {
          res.statusCode = 400;
          res.end(JSON.stringify({
            success: false,
            message: 'A JPG payment slip is required'
          }));
          return true;
        }

        // Save to MongoDB Atlas
        const result = await saveRegistration(payload);
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (err) {
        if (err.statusCode) {
          res.statusCode = err.statusCode;
          res.end(JSON.stringify({ success: false, message: err.message }));
          return true;
        }
        throw err;
      }
    } catch (err) {
      console.error('[API Error] /api/register failed:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        message: err.message || 'Internal server error while saving to database'
      }));
    }
    return true;
  }

  return false;
}
