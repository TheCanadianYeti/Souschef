require('dotenv').config();

const config = {
    // Server
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    appUrl: process.env.APP_URL || 'http://localhost:3001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Database
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        name: process.env.DB_NAME || 'mise_db',
        user: process.env.DB_USER || 'mise_user',
        password: process.env.DB_PASSWORD || '',
        pool: {
            max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
            min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
            acquire: 30000,
            idle: 10000
        }
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret_change_in_production',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    },

    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    },

    // Auth0 (Optional)
    auth0: {
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_AUDIENCE
    },

    // Claude API
    claude: {
        apiKey: process.env.CLAUDE_API_KEY,
        apiUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages',
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'
    },

    // ElevenLabs API
    elevenlabs: {
        apiKey: process.env.ELEVENLABS_API_KEY,
        apiUrl: 'https://api.elevenlabs.io/v1'
    },

    // Instacart API
    instacart: {
        apiKey: process.env.INSTACART_API_KEY,
        apiSecret: process.env.INSTACART_API_SECRET,
        merchantId: process.env.INSTACART_MERCHANT_ID
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
        aiMaxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || 10
    },

    // CORS
    cors: {
        origins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(',')
    },

    // File Upload
    upload: {
        maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 50 * 1024 * 1024,
        dir: process.env.UPLOAD_DIR || './uploads'
    }
};

module.exports = config;