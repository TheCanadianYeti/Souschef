const { Pool } = require('pg');
const config = require('../config');

// Support both DATABASE_URL (Vercel Postgres) and individual config vars (local dev)
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Required for Vercel/Neon Postgres
        max: config.database.pool.max,
        min: config.database.pool.min,
        connectionTimeoutMillis: config.database.pool.acquire,
        idleTimeoutMillis: config.database.pool.idle
    }
    : {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
        max: config.database.pool.max,
        min: config.database.pool.min,
        connectionTimeoutMillis: config.database.pool.acquire,
        idleTimeoutMillis: config.database.pool.idle
    };

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// Get a client from the pool for transactions
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    // Monkey patch the release method to clear our timeout
    client.release = () => {
        clearTimeout(timeout);
        release();
    };

    return client;
};

module.exports = {
    query,
    getClient,
    pool
};