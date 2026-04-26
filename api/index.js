require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Paths are relative to this file at project root /api/index.js
const config = require('../backend/src/config');
const { pool } = require('../backend/src/database');
const { runMigrations } = require('../backend/src/database/migrations');
const routes = require('../backend/src/routes');
const { errorHandler, notFound } = require('../backend/src/middleware');

const app = express();

// Open CORS for safety
app.use(cors({ origin: true, credentials: true }));

// Security & utility middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Mount at /api — Vercel passes the full path (e.g. /api/health) to this function
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Auto-run migrations on cold start
(async () => {
    try {
        await pool.query('SELECT NOW()');
        await runMigrations();
        console.log('[DB] Connected and migrations complete');
    } catch (e) {
        console.warn('[DB] No database available:', e.message);
    }
})();

// Export for Vercel serverless runtime
module.exports = app;
