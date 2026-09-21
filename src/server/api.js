import { ObjectId } from 'mongodb';
import {
  saveRegistration,
  checkTeamNameExists,
  checkConnection,
  getCollection,
  getIdeaSubmissionsCollection,
  generateRegId,
} from './db.js';
import {
  authenticateAdmin,
  expiredSessionCookie,
  loginAdmin,
  logoutAdmin,
  sessionCookie,
} from './adminAuth.js';

const MAX_PRESENTATION_BYTES = 8 * 1024 * 1024;
const MAX_ABSTRACT_WORDS = 200;

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function cleanIdeaRegistration(registration) {
  return {
    registrationId: registration.regId,
    teamName: registration.teamName || '',
    leaderName: registration.leaderName || '',
    leaderEmail: registration.leaderEmail || '',
    institution: registration.institution || registration.college || '',
    theme: registration.problemStatement || registration.track || '',
  };
}

function validatePresentation(file) {
  if (!file || typeof file !== 'object') return 'A PPT or PPTX presentation is required';
  const fileName = String(file.fileName || '').trim();
  const dataUrl = String(file.dataUrl || '');
  if (!/\.pptx?$/i.test(fileName) || !/^data:application\/(vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation);base64,/i.test(dataUrl)) {
    return 'Only PPT and PPTX presentations are accepted';
  }
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return 'The presentation file could not be read';
  }
  if (buffer.length === 0 || buffer.length > MAX_PRESENTATION_BYTES) {
    return `The presentation must be smaller than ${MAX_PRESENTATION_BYTES / 1024 / 1024} MB`;
  }
  const isPpt = buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  const isPptx = buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  if (!isPpt && !isPptx) return 'The presentation content is not a valid PPT or PPTX file';
  return null;
}

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

  if (pathname === '/api/idea-submission/verify' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req, 16 * 1024);
      const registrationId = String(payload?.registrationId || '').trim().toUpperCase();
      if (!/^[A-Z0-9]{4,20}$/.test(registrationId)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: 'Enter a valid Registration ID' }));
        return true;
      }
      const registration = await (await getCollection()).findOne({ regId: registrationId });
      if (!registration) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Registration ID not found' }));
        return true;
      }
      const existing = await (await getIdeaSubmissionsCollection()).findOne({ registrationId });
      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        alreadySubmitted: Boolean(existing),
        registration: cleanIdeaRegistration(registration),
      }));
    } catch (err) {
      console.error('[API Error] Idea verification failed:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, message: 'Unable to verify the Registration ID' }));
    }
    return true;
  }

  if (pathname === '/api/idea-submission' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req, 12 * 1024 * 1024);
      const registrationId = String(payload?.registrationId || '').trim().toUpperCase();
      const projectTitle = String(payload?.projectTitle || '').trim();
      const abstract = String(payload?.abstract || '').trim().replace(/\s+/g, ' ');
      if (!/^[A-Z0-9]{4,20}$/.test(registrationId)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: 'Enter a valid Registration ID' }));
        return true;
      }
      if (projectTitle.length < 2 || projectTitle.length > 160) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: 'Project title must be between 2 and 160 characters' }));
        return true;
      }
      const wordCount = countWords(abstract);
      if (!wordCount || wordCount > MAX_ABSTRACT_WORDS) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: `Abstract must contain 1 to ${MAX_ABSTRACT_WORDS} words` }));
        return true;
      }
      const presentationError = validatePresentation(payload.presentation);
      if (presentationError) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: presentationError }));
        return true;
      }
      const registration = await (await getCollection()).findOne({ regId: registrationId });
      if (!registration) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Registration ID not found' }));
        return true;
      }
      const submissions = await getIdeaSubmissionsCollection();
      const existing = await submissions.findOne({ registrationId });
      if (existing) {
        res.statusCode = 409;
        res.end(JSON.stringify({ success: false, message: 'You have already submitted your idea.' }));
        return true;
      }
      const file = payload.presentation;
      const document = {
        ...cleanIdeaRegistration(registration),
        projectTitle,
        abstract,
        ppt: {
          fileName: String(file.fileName).trim(),
          fileSize: Buffer.from(file.dataUrl.slice(file.dataUrl.indexOf(',') + 1), 'base64').length,
          mimeType: String(file.fileType || ''),
          dataUrl: file.dataUrl,
        },
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'submitted',
      };
      await submissions.insertOne(document);
      res.statusCode = 201;
      res.end(JSON.stringify({
        success: true,
        submission: {
          registrationId: document.registrationId,
          teamName: document.teamName,
          projectTitle: document.projectTitle,
        },
      }));
    } catch (err) {
      if (err?.code === 11000) {
        res.statusCode = 409;
        res.end(JSON.stringify({ success: false, message: 'You have already submitted your idea.' }));
        return true;
      }
      console.error('[API Error] Idea submission failed:', err);
      res.statusCode = err.statusCode || 500;
      res.end(JSON.stringify({ success: false, message: err.statusCode ? err.message : 'Unable to save the idea submission' }));
    }
    return true;
  }

  if (pathname === '/api/admin/idea-submissions' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return true;
    try {
      const submissions = await (await getIdeaSubmissionsCollection()).find({}, {
        projection: { 'ppt.dataUrl': 0 },
      }).sort({ submittedAt: -1 }).toArray();
      res.statusCode = 200;
      res.end(JSON.stringify({ submissions: submissions.map((item) => ({ ...item, _id: item._id?.toString() })) }));
    } catch (err) {
      console.error('[API Error] Loading idea submissions failed:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, message: 'Unable to load idea submissions' }));
    }
    return true;
  }

  const ideaDownloadMatch = pathname.match(/^\/api\/admin\/idea-submissions\/([^/]+)\/download$/);
  if (ideaDownloadMatch && req.method === 'GET') {
    if (!requireAdmin(req, res)) return true;
    try {
      const submission = await (await getIdeaSubmissionsCollection()).findOne({ _id: new ObjectId(ideaDownloadMatch[1]) });
      if (!submission?.ppt?.dataUrl) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Presentation not found' }));
        return true;
      }
      const comma = submission.ppt.dataUrl.indexOf(',');
      const data = Buffer.from(submission.ppt.dataUrl.slice(comma + 1), 'base64');
      res.setHeader('Content-Type', submission.ppt.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${submission.ppt.fileName.replace(/[^a-z0-9._-]/gi, '_')}"`);
      res.statusCode = 200;
      res.end(data);
    } catch (err) {
      console.error('[API Error] Downloading idea presentation failed:', err);
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, message: 'Presentation not found' }));
    }
    return true;
  }

  const ideaDeleteMatch = pathname.match(/^\/api\/admin\/idea-submissions\/([^/]+)$/);
  if (ideaDeleteMatch && req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return true;
    if (!ObjectId.isValid(ideaDeleteMatch[1])) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, message: 'Invalid idea submission identifier' }));
      return true;
    }
    try {
      const result = await (await getIdeaSubmissionsCollection()).deleteOne({ _id: new ObjectId(ideaDeleteMatch[1]) });
      if (result.deletedCount !== 1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Idea submission not found' }));
        return true;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, message: 'Idea submission deleted successfully.' }));
    } catch (err) {
      console.error('[API Error] Deleting idea submission failed:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, message: 'Unable to delete idea submission' }));
    }
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
    const allowedStatuses = new Set(['pending_verification', 'verified', 'rejected', 'selected']);
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

  // Check if team name already exists
  if (pathname === '/api/check-team-name' && req.method === 'GET') {
    try {
      const nameParam = url.searchParams.get('name') || '';
      const exists = await checkTeamNameExists(nameParam);
      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        exists,
        teamName: nameParam.trim(),
        message: exists
          ? 'This team name is already taken'
          : 'Team name is available',
      }));
    } catch (err) {
      console.error('[API Error] /api/check-team-name failed:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, message: 'Unable to check team name' }));
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
