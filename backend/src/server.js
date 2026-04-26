require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { pool } = require('./database');
const { runMigrations } = require('./database/migrations');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware');

const app = express();

// CORS configuration - Relaxed for hackathon deployment
app.use(cors({
    origin: (origin, callback) => {
        // Allow if: no origin (local/mobile), matches CORS_ORIGINS, or for hackathon, just allow all while debugging
        const allowedOrigins = config.cors.origins;
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            // Still allow vercel previews and other common hackathon patterns
            callback(null, true); 
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security middleware - Relaxed for local hackathon development
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false // Disable CSP for local dev to avoid blocking localhost requests
}));

// Body parsing - Increased limits for AI/Recipe data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    }
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Stricter rate limit for AI-related endpoints
const aiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.aiMaxRequests,
    message: {
        success: false,
        message: 'AI request limit exceeded, please try again later.',
        code: 'AI_RATE_LIMIT_EXCEEDED'
    }
});

app.use('/api/recipes/capture', aiLimiter);
app.use('/api/recipes/from-url', aiLimiter);
app.use('/api/cook/:recipeId/ask', aiLimiter);

// Global Debug Logger
app.use((req, res, next) => {
    console.log(`[DEBUG] ${new Date().toISOString()} ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('[DEBUG] Body:', JSON.stringify(req.body).substring(0, 100));
    }
    next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Mise API',
        version: '1.0.0',
        documentation: '/api/health'
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server — HTTP listener starts first so non-DB routes (TTS, assistant, health) always work.
const startServer = async () => {
    // Always start listening first
    app.listen(config.port, () => {
        console.log(`[DEBUG] Server listening on port ${config.port}`);
        console.log(`[DEBUG] Environment: ${config.nodeEnv}`);
        console.log(`[DEBUG] API available at ${config.appUrl}/api`);
        console.log(`[DEBUG] TTS endpoint: POST ${config.appUrl}/api/tts/generate`);
        console.log(`[DEBUG] Assistant endpoint: POST ${config.appUrl}/api/assistant/command`);
    });

    // DB connection is non-blocking — routes that don't need it still work
    try {
        await pool.query('SELECT NOW()');
        console.log('[DB] Database connection established');
        await runMigrations();
        console.log('[DB] Migrations complete');
    } catch (error) {
        console.warn('[DB] WARNING: PostgreSQL unavailable — DB-backed routes will fail, but TTS/AI/health routes are still active.');
        console.warn('[DB] To enable DB: run docker-compose up -d postgres');
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

module.exports = app;