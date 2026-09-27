import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config();

// Ensure Node.js can resolve MongoDB Atlas SRV records when the local DNS resolver (e.g. 127.0.0.1) rejects SRV queries
try {
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || currentServers.every((s) => s.startsWith('127.') || s === '::1')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'odyssey';
const collectionName = process.env.MONGODB_COLLECTION || 'student registration';
const ideaSubmissionsCollectionName = process.env.MONGODB_IDEA_SUBMISSIONS_COLLECTION || 'idea_submissions';

const clientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  family: 4,
};

let client = null;
let clientPromise = null;

export async function getDbClient() {
  if (!uri || uri.includes('<') || uri.startsWith('******')) {
    throw new Error('MONGODB_URI is missing or contains an unresolved placeholder');
  }

  if (!clientPromise) {
    client = new MongoClient(uri, clientOptions);
    clientPromise = client.connect().catch(async (error) => {
      clientPromise = null;
      // If querySrv ECONNREFUSED occurs, fallback to public DNS resolvers and retry
      if (error?.code === 'ECONNREFUSED' && error?.syscall === 'querySrv') {
        try {
          dns.setServers(['8.8.8.8', '1.1.1.1']);
          client = new MongoClient(uri, clientOptions);
          clientPromise = client.connect().catch((retryErr) => {
            clientPromise = null;
            throw retryErr;
          });
          return await clientPromise;
        } catch {
          throw error;
        }
      }
      throw error;
    });
  }
  return clientPromise;
}

export async function getCollection() {
  const connectedClient = await getDbClient();
  return connectedClient.db(dbName).collection(collectionName);
}

export async function getIdeaSubmissionsCollection() {
  const connectedClient = await getDbClient();
  const collection = connectedClient.db(dbName).collection(ideaSubmissionsCollectionName);
  await collection.createIndex({ registrationId: 1 }, { unique: true });
  return collection;
}

export function generateRegId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/I/1 to avoid confusion
  let id = 'OD';
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function checkTeamNameExists(teamName) {
  const normalized = String(teamName || '').trim();
  if (!normalized || normalized.length < 3) return false;
  const col = await getCollection();
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existing = await col.findOne(
    { teamName: { $regex: new RegExp(`^${escaped}$`, 'i') } },
    { projection: { _id: 1, teamName: 1 } }
  );
  return Boolean(existing);
}

export async function saveRegistration(registrationData) {
  const col = await getCollection();

  // Enforce unique team name (case-insensitive check)
  const normalizedTeamName = String(registrationData.teamName || '').trim();
  if (normalizedTeamName) {
    const escaped = normalizedTeamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await col.findOne(
      { teamName: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      { projection: { _id: 1, teamName: 1 } }
    );
    if (existing) {
      const err = new Error('This team name is already taken. Please choose another.');
      err.statusCode = 409;
      throw err;
    }
  }

  const regId = generateRegId();
  const doc = {
    ...registrationData,
    teamName: normalizedTeamName,
    regId,
    registeredAt: new Date().toISOString(),
    status: 'pending_verification',
  };
  const result = await col.insertOne(doc);
  return {
    success: true,
    regId,
    insertedId: result.insertedId.toString(),
    message: 'Registration successfully recorded in Odyssey database',
  };
}

export async function checkConnection() {
  try {
    const connectedClient = await getDbClient();
    await connectedClient.db(dbName).command({ ping: 1 });
    return {
      connected: true,
      database: dbName,
      collection: collectionName,
    };
  } catch (error) {
    console.error('[MongoDB Error] Ping failed:', error);
    return {
      connected: false,
      error: error.message,
    };
  }
}
