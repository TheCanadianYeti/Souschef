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

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('Database connection established');
        
        // Run migrations
        await runMigrations();

        // Start listening
        app.listen(config.port, () => {
            console.log(`[DEBUG] Server listening on port ${config.port}`);
            console.log(`[DEBUG] Environment: ${config.nodeEnv}`);
            console.log(`[DEBUG] API available at ${config.appUrl}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        console.log('HINT: Ensure PostgreSQL is running. Run: docker-compose up -d postgres');
        process.exit(1);
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