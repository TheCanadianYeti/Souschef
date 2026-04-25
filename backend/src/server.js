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

// Body parsing
app.use(express.json({ limit: config.upload.maxSize }));
app.use(express.urlencoded({ extended: true, limit: config.upload.maxSize }));

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
            console.log(`Server running on port ${config.port}`);
            console.log(`Environment: ${config.nodeEnv}`);
            console.log(`API available at ${config.appUrl}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
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