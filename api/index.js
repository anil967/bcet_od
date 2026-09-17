import { handleApiRequest } from '../src/server/api.js';

export default async function handler(req, res) {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: 'API route not found' }));
    }
  } catch (error) {
    console.error('[Vercel Serverless Function Error]', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: error.message || 'Internal Server Error' }));
  }
}
