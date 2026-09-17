import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'odyssey';
const collectionName = process.env.MONGODB_COLLECTION || 'student registration';

let client = null;
let clientPromise = null;

export async function getDbClient() {
  if (!uri || uri.includes('<') || uri.startsWith('******')) {
    throw new Error('MONGODB_URI is missing or contains an unresolved placeholder');
  }

  if (!clientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      family: 4,
    });
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

export async function getCollection() {
  const connectedClient = await getDbClient();
  return connectedClient.db(dbName).collection(collectionName);
}

export async function saveRegistration(registrationData) {
  const col = await getCollection();
  const doc = {
    ...registrationData,
    registeredAt: new Date().toISOString(),
    status: 'pending_verification',
  };
  const result = await col.insertOne(doc);
  return {
    success: true,
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
