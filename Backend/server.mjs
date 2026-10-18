// Local mock API, bound to loopback. No real users, OTP, uploads, or financial transactions.
import http from 'node:http';
import {
  MockDiagnosisProvider,
  MockLanguageService,
  CachedLanguageService,
  routeIntent,
} from './providers.mjs';
const language = new CachedLanguageService(new MockLanguageService());
const diagnosis = new MockDiagnosisProvider();
const supported = ['hi', 'en', 'pa', 'mr'];
export function createServer() {
  return http.createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(JSON.stringify(data));
    };
    const path = (req.url || '/').replace(/^\/api(?=\/|$)/, '') || '/';
    if (req.method === 'GET' && (path === '/health' || path === '/')) return send(200, { ok: true, mode: 'mock' });
    if (req.method !== 'POST') return send(404, { error: 'Not found' });
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 64000) return send(413, { error: 'Payload too large' });
      }
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return send(400, { error: 'Invalid JSON' });
      }
      if (!body || typeof body !== 'object' || Array.isArray(body))
        return send(400, { error: 'Object required' });
      if (path === '/intent') {
        if (typeof body.text !== 'string' || body.text.length > 1000)
          return send(400, { error: 'Text must be under 1000 characters' });
        return send(200, await routeIntent(body.text));
      }
      if (path === '/diagnose') {
        if (typeof body.crop !== 'string') return send(400, { error: 'Crop required' });
        return send(200, await diagnosis.predict(body));
      }
      if (path === '/translate') {
        if (
          typeof body.text !== 'string' ||
          body.text.length > 5000 ||
          !supported.includes(body.from) ||
          !supported.includes(body.to)
        )
          return send(400, { error: 'Invalid text or language' });
        return send(200, await language.translate(body.text, body.from, body.to));
      }
      send(404, { error: 'Not found' });
    } catch {
      send(500, { error: 'Request could not be processed' });
    }
  });
}
if (process.argv[1]?.endsWith('server.mjs')) {
  const port = Number(process.env.API_PORT || 8787);
  createServer().listen(port, '127.0.0.1', () => console.log(`Mock API http://127.0.0.1:${port}`));
}
const defaultServer = createServer();
export default function handler(req, res) {
  defaultServer.emit('request', req, res);
}

