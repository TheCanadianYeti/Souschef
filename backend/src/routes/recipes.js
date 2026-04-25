const express = require('express');
const { body, param, validationResult } = require('express-validator');
const multer = require('multer');
const { detectTextFromBuffer } = require('../services/googleCloudService');
const { parseRecipeText } = require('../services/aiService');
const { scrapeUrl } = require('../services/scraperService');
const { authenticate, optionalAuth, AppError } = require('../middleware');
const db = require('../database');

const router = express.Router();

// Multer config for memory storage (since we upload buffer directly to GCP Vision)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } 
});

/**
 * Placeholder for saving a parsed recipe to PostgreSQL
 * Postgres is currently not running, so this function contains the exact SQL queries
 * but is bypassed to prevent ECONNREFUSED errors for the hackathon.
 */
const saveRecipeToDb = async (parsedRecipe, userId) => {
    // TODO: When postgres is running, uncomment this block to save real data
    /*
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // 1. Insert Recipe
        const recipeResult = await client.query(`
            INSERT INTO recipes (
                user_id, title, description, source_type, source_url, 
                servings, cook_time, prep_time, difficulty, tags
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [
            userId, 
            parsedRecipe.title, 
            parsedRecipe.description, 
            parsedRecipe.sourceType || null,
            parsedRecipe.sourceUrl || null,
            parsedRecipe.servings || 1, 
            parsedRecipe.cookTime || 0, 
            parsedRecipe.prepTime || 0, 
            parsedRecipe.difficulty || 'Medium', 
            parsedRecipe.tags || []
        ]);
        
        const recipeId = recipeResult.rows[0].id;
        parsedRecipe.id = recipeId;

        // 2. Insert Ingredients
        if (parsedRecipe.ingredients && parsedRecipe.ingredients.length > 0) {
            for (let i = 0; i < parsedRecipe.ingredients.length; i++) {
                const ing = parsedRecipe.ingredients[i];
                await client.query(`
                    INSERT INTO ingredients (
                        recipe_id, name, quantity, unit, dietary_flags, order_index
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    recipeId, ing.name, ing.quantity, ing.unit, ing.dietaryFlags || [], i
                ]);
            }
        }

        // 3. Insert Steps
        if (parsedRecipe.steps && parsedRecipe.steps.length > 0) {
            for (let i = 0; i < parsedRecipe.steps.length; i++) {
                const step = parsedRecipe.steps[i];
                await client.query(`
                    INSERT INTO cooking_steps (
                        recipe_id, step_number, instruction, duration_seconds, order_index
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [
                    recipeId, step.stepNumber || (i + 1), step.instruction, step.durationSeconds || 0, i
                ]);
            }
        }

        await client.query('COMMIT');
        return parsedRecipe;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    */

    // Placeholder mock data pass:
    parsedRecipe.id = require('crypto').randomUUID();
    return parsedRecipe;
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

            // 2. Parse text into structured recipe using Claude
            const parsedRecipe = await parseRecipeText(extractedText);

            // Since we aren't using a bucket, we don't have a permanent image URL
            // You can use a placeholder or leave it blank
            // 3. Save to database (Placeholder logic)
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
            const savedRecipe = await saveRecipeToDb(parsedRecipe, userId);

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
// Note: This is a placeholder - actual implementation would use Claude API
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

            // 2. Parse text into structured recipe using Gemma
            const parsedRecipe = await parseRecipeText(extractedText);
            
            parsedRecipe.sourceType = 'url';
            parsedRecipe.sourceUrl = url;

            // 3. Save to database (Placeholder logic)
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
            const savedRecipe = await saveRecipeToDb(parsedRecipe, userId);

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

module.exports = router;