const { pool } = require('./index');

const migrations = [
    // Users table
    {
        name: 'create_users_table',
        up: `
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                display_name VARCHAR(255),
                avatar_url TEXT,
                dietary_restrictions TEXT[],
                preferences JSONB DEFAULT '{}',
                auth0_id VARCHAR(255) UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
        `,
        down: 'DROP TABLE IF EXISTS users CASCADE;'
    },

    // Refresh tokens table
    {
        name: 'create_refresh_tokens_table',
        up: `
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                revoked_at TIMESTAMP WITH TIME ZONE
            );
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
        `,
        down: 'DROP TABLE IF EXISTS refresh_tokens CASCADE;'
    },

    // Recipes table
    {
        name: 'create_recipes_table',
        up: `
            CREATE TABLE IF NOT EXISTS recipes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                source_url TEXT,
                source_type VARCHAR(50) CHECK (source_type IN ('video', 'photo', 'url', 'manual')),
                servings INTEGER DEFAULT 1,
                cook_time INTEGER,
                prep_time INTEGER,
                difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Expert')),
                tags TEXT[],
                image_url TEXT,
                original_recipe_id UUID REFERENCES recipes(id),
                version INTEGER DEFAULT 1,
                is_public BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
            CREATE INDEX IF NOT EXISTS idx_recipes_original_recipe_id ON recipes(original_recipe_id);
            CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
            CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public);
        `,
        down: 'DROP TABLE IF EXISTS recipes CASCADE;'
    },

    // Ingredients table
    {
        name: 'create_ingredients_table',
        up: `
            CREATE TABLE IF NOT EXISTS ingredients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                quantity VARCHAR(50),
                unit VARCHAR(50),
                dietary_flags TEXT[],
                notes TEXT,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
        `,
        down: 'DROP TABLE IF EXISTS ingredients CASCADE;'
    },

    // Cooking steps table
    {
        name: 'create_cooking_steps_table',
        up: `
            CREATE TABLE IF NOT EXISTS cooking_steps (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                step_number INTEGER NOT NULL,
                instruction TEXT NOT NULL,
                duration_seconds INTEGER DEFAULT 0,
                notes TEXT,
                image_urls TEXT[],
                equipment_needed TEXT[],
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_cooking_steps_recipe_id ON cooking_steps(recipe_id);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_cooking_steps_recipe_step ON cooking_steps(recipe_id, step_number);
        `,
        down: 'DROP TABLE IF EXISTS cooking_steps CASCADE;'
    },

    // Recipe collections table
    {
        name: 'create_recipe_collections_table',
        up: `
            CREATE TABLE IF NOT EXISTS recipe_collections (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_recipe_collections_user_id ON recipe_collections(user_id);
        `,
        down: 'DROP TABLE IF EXISTS recipe_collections CASCADE;'
    },

    // Recipe collection items (join table)
    {
        name: 'create_recipe_collection_items_table',
        up: `
            CREATE TABLE IF NOT EXISTS recipe_collection_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                collection_id UUID NOT NULL REFERENCES recipe_collections(id) ON DELETE CASCADE,
                recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(collection_id, recipe_id)
            );
            CREATE INDEX IF NOT EXISTS idx_recipe_collection_items_collection_id ON recipe_collection_items(collection_id);
            CREATE INDEX IF NOT EXISTS idx_recipe_collection_items_recipe_id ON recipe_collection_items(recipe_id);
        `,
        down: 'DROP TABLE IF EXISTS recipe_collection_items CASCADE;'
    },

    // Recipe ratings table
    {
        name: 'create_recipe_ratings_table',
        up: `
            CREATE TABLE IF NOT EXISTS recipe_ratings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, recipe_id)
            );
            CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON recipe_ratings(user_id);
            CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
        `,
        down: 'DROP TABLE IF EXISTS recipe_ratings CASCADE;'
    },

    // Cooking sessions table
    {
        name: 'create_cooking_sessions_table',
        up: `
            CREATE TABLE IF NOT EXISTS cooking_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                current_step INTEGER DEFAULT 0,
                started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP WITH TIME ZONE,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                notes TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_cooking_sessions_user_id ON cooking_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_cooking_sessions_recipe_id ON cooking_sessions(recipe_id);
        `,
        down: 'DROP TABLE IF EXISTS cooking_sessions CASCADE;'
    },

    // Grocery lists table
    {
        name: 'create_grocery_lists_table',
        up: `
            CREATE TABLE IF NOT EXISTS grocery_lists (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) DEFAULT 'My Grocery List',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON grocery_lists(user_id);
        `,
        down: 'DROP TABLE IF EXISTS grocery_lists CASCADE;'
    },

    // Grocery list items table
    {
        name: 'create_grocery_list_items_table',
        up: `
            CREATE TABLE IF NOT EXISTS grocery_list_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
                recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
                ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
                name VARCHAR(255) NOT NULL,
                quantity VARCHAR(50),
                unit VARCHAR(50),
                is_checked BOOLEAN DEFAULT false,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_grocery_list_items_grocery_list_id ON grocery_list_items(grocery_list_id);
            CREATE INDEX IF NOT EXISTS idx_grocery_list_items_recipe_id ON grocery_list_items(recipe_id);
            CREATE INDEX IF NOT EXISTS idx_grocery_list_items_ingredient_id ON grocery_list_items(ingredient_id);
        `,
        down: 'DROP TABLE IF EXISTS grocery_list_items CASCADE;'
    },

    // Recipe version history table
    {
        name: 'create_recipe_version_history_table',
        up: `
            CREATE TABLE IF NOT EXISTS recipe_version_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                version INTEGER NOT NULL,
                changes JSONB,
                changed_by UUID REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_recipe_version_history_recipe_id ON recipe_version_history(recipe_id);
        `,
        down: 'DROP TABLE IF EXISTS recipe_version_history CASCADE;'
    }
];

// Function to run migrations
const runMigrations = async () => {
    console.log('Running database migrations...');

    // Create migrations tracking table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Get already executed migrations
    const { rows: executedMigrations } = await pool.query('SELECT name FROM migrations');
    const executedNames = new Set(executedMigrations.map(row => row.name));

    // Run pending migrations
    for (const migration of migrations) {
        if (!executedNames.has(migration.name)) {
            console.log(`Running migration: ${migration.name}`);
            try {
                await pool.query(migration.up);
                await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
                console.log(`Migration ${migration.name} completed successfully`);
            } catch (error) {
                console.error(`Migration ${migration.name} failed:`, error);
                throw error;
            }
        }
    }

    console.log('All migrations completed successfully');
};

// Function to rollback migrations
const rollbackMigrations = async (count = 1) => {
    console.log(`Rolling back ${count} migration(s)...`);

    const { rows } = await pool.query(
        'SELECT name FROM migrations ORDER BY id DESC LIMIT $1',
        [count]
    );

    for (const row of rows) {
        const migration = migrations.find(m => m.name === row.name);
        if (migration) {
            console.log(`Rolling back: ${migration.name}`);
            await pool.query(migration.down);
            await pool.query('DELETE FROM migrations WHERE name = $1', [migration.name]);
            console.log(`Rolled back: ${migration.name}`);
        }
    }

    console.log('Rollback completed');
};

module.exports = {
    runMigrations,
    rollbackMigrations,
    migrations
};