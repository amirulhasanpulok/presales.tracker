import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import routes from './routes.js';
import { initSchema, seedScopeCatalog, seedOEMCatalog, seedProductCatalog } from './db.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(express.json({ limit: '10mb' }));

const origin = process.env.CORS_ORIGIN;
if (origin) {
  app.use(cors({ origin: origin.split(','), credentials: true }));
}

// Lightweight request logging (production: pair with PM2 log aggregation).
app.use((req, res, next) => {
  const start = Date.now();
  req.requestId = req.get('x-request-id') || randomUUID();
  res.setHeader('x-request-id', req.requestId);
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.use('/api', routes);

// 404 + error handler
app.use('/api', (req, res) => res.status(404).json({ error: 'not_found', path: req.path }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'server_error' });
});

const port = Number(process.env.PORT || 4000);

const OFFICIAL_PATTERN = /^(?!dev-insecure-secret-change-me$)(?!$).{16,}$/;
if (!OFFICIAL_PATTERN.test(process.env.JWT_SECRET || '')) {
  console.error('Aborting startup: JWT_SECRET is missing, too short, or set to the development fallback.');
  console.error('Refusing to run a production API with an insecure signing secret. Set JWT_SECRET in server/.env.');
  process.exit(1);
}

async function start() {
  await initSchema();
  await seedScopeCatalog();
  await seedOEMCatalog();
  await seedProductCatalog();
  app.listen(port, '127.0.0.1', () => {
    console.log(`presales-api listening on http://127.0.0.1:${port} (db: ${process.env.PGDATABASE || 'presales'})`);
  });
}

start().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
