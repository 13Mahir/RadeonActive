import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Initialize DB before importing routes
import { initDatabase } from './db/database.js';
import transactionRoutes from './routes/transactions.js';
import analyticsRoutes from './routes/analytics.js';
import casesRoutes from './routes/cases.js';
import ingestRoutes from './routes/ingest.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    system: 'DBT Intelligence System'
  });
});

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/ingest', ingestRoutes);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message });
});

// Start
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`\n🛡️  DBT Intelligence System Backend`);
    console.log(`📡 API running on http://localhost:${PORT}`);
    console.log(`💾 Database: ${process.env.DB_PATH || './server/data/dbt.db'}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/transactions`);
    console.log(`  GET  /api/analytics/summary`);
    console.log(`  GET  /api/analytics/district-heatmap`);
    console.log(`  GET  /api/cases`);
    console.log(`  POST /api/cases/:id/assign`);
    console.log(`  POST /api/cases/:id/status`);
    console.log(`  POST /api/cases/:id/verify`);
    console.log(`  POST /api/ingest/process`);
    console.log(`  GET  /api/ingest/status`);
  });
}

start();
