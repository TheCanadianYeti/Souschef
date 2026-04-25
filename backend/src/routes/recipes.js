const express = require('express');
const { body, param, validationResult } = require('express-validator');
const multer = require('multer');
const { detectTextFromBuffer } = require('../services/googleCloudService');
const { parseRecipeText } = require('../services/aiService');
const { scrapeUrl } = require('../services/scraperService');
const { authenticate, optionalAuth, AppError } = require('../middleware');
const db = require('../database');
const router = express.Router();

const GET_SMART_IMAGE = (title = '', tags = []) => {
    const combined = (title + ' ' + tags.join(' ')).toLowerCase();
    
    // Priority 1: High-quality curated library for common categories
    const library = [
        { key: 'shrimp', url: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b' },
        { key: 'seafood', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2' },
        { key: 'chicken', url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d' },
        { key: 'pasta', url: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856' },
        { key: 'steak', url: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c' },
        { key: 'beef', url: 'https://images.unsplash.com/photo-1558030006-450675393462' },
        { key: 'salmon', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288' },
        { key: 'salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd' },
        { key: 'dessert', url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e' },
        { key: 'breakfast', url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8' },
        { key: 'egg', url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8' },
        { key: 'soup', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd' },
        { key: 'burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd' },
        { key: 'pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591' },
        { key: 'noodle', url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841' },
        { key: 'rice', url: 'https://images.unsplash.com/photo-1512058560366-cd2429598632' },
        { key: 'pork', url: 'https://images.unsplash.com/photo-1544025162-d76694265947' }
    ];

    for (const item of library) {
        if (combined.includes(item.key)) {
            return `${item.url}?auto=format&fit=crop&w=800&q=80`;
        }
    }

    // Priority 2: If no library match, use a dynamic search with a much more aggressive query
    const searchTerms = [...tags, title.split(' ').pop()].filter(Boolean).slice(0, 3).join(',');
    const randomSeed = Math.floor(Math.random() * 1000000);
    return `https://loremflickr.com/800/600/food,${encodeURIComponent(searchTerms)}/all?lock=${randomSeed}`;
};

// Multer config for memory storage (since we upload buffer directly to GCP Vision)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } 
});

/**
 * Save a recipe to the database with all its components
 */
const saveRecipeToDb = async (userId, parsedRecipe) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const uniqueSeed = Date.now() + Math.random();
        const smartImage = GET_SMART_IMAGE(parsedRecipe.title, parsedRecipe.tags);
        const finalImageUrl = parsedRecipe.image_url || (smartImage.includes('?') ? `${smartImage}&unique=${uniqueSeed}` : `${smartImage}?unique=${uniqueSeed}`);

        // Insert Recipe
        const recipeRes = await client.query(
            `INSERT INTO recipes (
                user_id, title, description, source_url, source_type, 
                servings, cook_time, prep_time, difficulty, tags, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [
                userId,
                parsedRecipe.title || 'Imported Recipe',
                parsedRecipe.description || '',
                parsedRecipe.sourceUrl || parsedRecipe.source_url || null,
                parsedRecipe.sourceType || parsedRecipe.source_type || 'photo',
                parsedRecipe.servings || 2,
                parsedRecipe.cookTime || parsedRecipe.cook_time || 0,
                parsedRecipe.prepTime || parsedRecipe.prep_time || 0,
                parsedRecipe.difficulty || 'Medium',
                parsedRecipe.tags || [],
                finalImageUrl
            ]
        );

        const recipe = recipeRes.rows[0];
        const recipeId = recipe.id;

        // 2. Insert ingredients
        const ingredients = parsedRecipe.ingredients || [];
        const savedIngredients = [];
        for (let i = 0; i < ingredients.length; i++) {
            const ing = ingredients[i];
            const ingRes = await client.query(
                `INSERT INTO ingredients (recipe_id, name, quantity, unit, dietary_flags, order_index)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [recipeId, ing.name, String(ing.quantity ?? '1'), ing.unit || '', ing.dietaryFlags || ing.dietary_flags || [], i]
            );
            savedIngredients.push(ingRes.rows[0]);
        }

        // 3. Insert steps
        const steps = parsedRecipe.steps || [];
        const savedSteps = [];
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepRes = await client.query(
                `INSERT INTO cooking_steps (recipe_id, step_number, instruction, duration_seconds, order_index)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [recipeId, step.stepNumber || step.step_number || (i + 1), step.instruction, step.durationSeconds || step.duration_seconds || 0, i]
            );
            savedSteps.push(stepRes.rows[0]);
        }

        await client.query('COMMIT');
        console.log(`[DB] Recipe "${recipe.title}" saved successfully with id: ${recipeId}`);

        return {
            ...recipe,
            ingredients: savedIngredients,
            steps: savedSteps
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[DB] Failed to save recipe to database:', error);
        // Fallback to in-memory if DB fails? No, better to let it fail so user knows DB is broken.
        // But for hackathon, maybe keep a fallback?
        // Actually, user explicitly wants to fix the "mock" issue, so let's fail properly.
        throw error;
    } finally {
        client.release();
    }
};


// @route   POST /api/recipes/capture
// @desc    Capture recipe from image upload (AI parsing)
// @access  Private
router.post('/capture',
    optionalAuth,
    upload.single('photo'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                throw new AppError('No photo uploaded', 400, 'BAD_REQUEST');
            }

            // 1. Extract text directly from the uploaded file buffer
            const extractedText = await detectTextFromBuffer(req.file.buffer);
            
            if (!extractedText) {
                throw new AppError('No text could be detected in the image', 422, 'UNPROCESSABLE_ENTITY');
            }

            // 2. Parse text into structured recipe using Gemma 4
            const parsedRecipe = await parseRecipeText(extractedText);

            // Since we aren't using a bucket, we don't have a permanent image URL
            // You can use a placeholder or leave it blank
            // 3. Save to database (Placeholder logic)
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
            const savedRecipe = await saveRecipeToDb(userId, parsedRecipe);

            res.json({
                success: true,
                message: 'Recipe captured and parsed successfully',
                data: savedRecipe
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/recipes/from-url
// @desc    Extract recipe from URL (AI parsing)
// @access  Private
// Note: This is a placeholder - actual implementation would use Gemma 4 26B A4B IT
router.post('/from-url',
    optionalAuth,
    body('url').isURL(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Valid URL is required', 400, 'VALIDATION_ERROR');
            }

            const { url } = req.body;

            // 1. Scrape the URL
            const extractedText = await scrapeUrl(url);

            if (!extractedText || extractedText.length < 50) {
                throw new AppError('Could not extract meaningful text from this URL', 422, 'UNPROCESSABLE_ENTITY');
            }

            // 2. Parse text into structured recipe using Gemma 4
            const parsedRecipe = await parseRecipeText(extractedText);
            
            parsedRecipe.sourceType = 'url';
            parsedRecipe.sourceUrl = url;

            // 3. Save to database (Placeholder logic)
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
            const savedRecipe = await saveRecipeToDb(userId, parsedRecipe);

            res.json({
                success: true,
                message: 'Recipe extracted and parsed successfully',
                data: savedRecipe
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/recipes
// @desc    Get all recipes for current user
// @access  Private
router.get('/',
    optionalAuth,
    async (req, res, next) => {
        try {
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
            const result = await db.query(
                'SELECT * FROM recipes WHERE user_id = $1 OR is_public = true ORDER BY created_at DESC',
                [userId]
            );
            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/recipes/:id
// @desc    Get recipe by ID with ingredients and steps
// @access  Private
router.get('/:id',
    optionalAuth,
    async (req, res, next) => {
        try {
            const { id } = req.params;
            
            // Validate UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                throw new AppError('Invalid recipe ID format', 400, 'BAD_REQUEST');
            }

            const recipeResult = await db.query('SELECT * FROM recipes WHERE id = $1', [id]);
            
            if (recipeResult.rows.length === 0) {
                throw new AppError('Recipe not found', 404, 'NOT_FOUND');
            }

            const recipe = recipeResult.rows[0];

            // Fetch ingredients
            const ingResult = await db.query(
                'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY order_index ASC',
                [id]
            );

            // Fetch steps
            const stepResult = await db.query(
                'SELECT * FROM cooking_steps WHERE recipe_id = $1 ORDER BY step_number ASC',
                [id]
            );

            res.json({
                success: true,
                data: {
                    ...recipe,
                    ingredients: ingResult.rows,
                    steps: stepResult.rows
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/recipes/:id
// @desc    Delete a recipe
// @access  Private
router.delete('/:id',
    optionalAuth,
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

            // Delete the recipe. Ingredients and steps will be deleted by CASCADE if set up, 
            // otherwise we handle it here.
            const result = await db.query(
                'DELETE FROM recipes WHERE id = $1 AND (user_id = $2 OR user_id = \'00000000-0000-0000-0000-000000000000\') RETURNING id',
                [id, userId]
            );

            if (result.rows.length === 0) {
                throw new AppError('Recipe not found or unauthorized', 404, 'NOT_FOUND');
            }

            console.log(`[DB] Recipe ${id} deleted.`);
            res.json({
                success: true,
                message: 'Recipe deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;