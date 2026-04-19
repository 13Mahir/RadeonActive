// server/index.ts
// IMPORTANT: dotenv/config MUST be the first import in ESM to ensure
// process.env is populated before any other module reads it at load time.
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

import { initDatabase } from './db/database.js';
import transactionRoutes from './routes/transactions.js';
import analyticsRoutes from './routes/analytics.js';
import casesRoutes from './routes/cases.js';
import ingestRoutes from './routes/ingest.js';
import authRoutes from './routes/auth.js';          // NEW — added in Section 3
import usersRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import citizensRoutes from './routes/citizens.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    system: 'DBT Intelligence System'
  });
});

// Routes
app.use('/api/auth', authRoutes);
 app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/citizens', citizensRoutes);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message });
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`\n🛡️  DBT Intelligence System Backend`);
    console.log(`📡 API running on http://localhost:${PORT}`);
    console.log(`💾 Database: ${process.env.DB_PATH || './server/data/dbt.db'}`);
    console.log(`\nAll routes initialized. Run npm run dev to start full stack.`);
  });
}

start();
