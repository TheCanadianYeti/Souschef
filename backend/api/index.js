require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Point dotenv/config at the backend folder when running as a serverless function
const config = require('../src/config');
const { pool } = require('../src/database');
const { runMigrations } = require('../src/database/migrations');
const routes = require('../src/routes');
const { errorHandler, notFound } = require('../src/middleware');

const app = express();

// CORS - Not needed when on same domain, but kept for safety
app.use(cors({ origin: true, credentials: true }));

// Security & utility middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging in development only
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Mount all API routes at the root (Vercel strips /api prefix via rewrite)
app.use('/', routes);

// Errors
app.use(notFound);
app.use(errorHandler);

// Auto-run migrations on cold start
(async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('[DB] Connected');
        await runMigrations();
        console.log('[DB] Migrations complete');
    } catch (e) {
        console.warn('[DB] No database available:', e.message);
    }
})();

// Export for Vercel serverless
module.exports = app;
