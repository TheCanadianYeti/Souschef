const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Recipe = require('../models/Recipe');
const { query } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// @route   POST /api/cook/:recipeId/start
// @desc    Start a cooking session for a recipe
// @access  Private
router.post('/:recipeId/start',
    authenticate,
    param('recipeId').isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Invalid recipe ID', 400, 'VALIDATION_ERROR');
            }

            const recipe = await Recipe.findById(req.params.recipeId);
            if (!recipe) {
                throw new AppError('Recipe not found', 404, 'RECIPE_NOT_FOUND');
            }

            // Create cooking session
            const sessionId = uuidv4();
            const result = await query(
                `INSERT INTO cooking_sessions (id, user_id, recipe_id, current_step, started_at)
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [sessionId, req.user.id, req.params.recipeId, 0]
            );

            const session = result.rows[0];

            res.status(201).json({
                success: true,
                data: {
                    sessionId: session.id,
                    recipeId: session.recipe_id,
                    userId: session.user_id,
                    currentStep: session.current_step,
                    startedAt: session.started_at,
                    recipe: {
                        id: recipe.id,
                        title: recipe.title,
                        cookTime: recipe.cook_time,
                        prepTime: recipe.prep_time,
                        servings: recipe.servings,
                        ingredients: recipe.ingredients,
                        steps: recipe.steps
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/cook/session/:sessionId
// @desc    Get current cooking session state
// @access  Private
router.get('/session/:sessionId',
    authenticate,
    param('sessionId').isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Invalid session ID', 400, 'VALIDATION_ERROR');
            }

            const result = await query(
                `SELECT cs.*, r.title as recipe_title, r.cook_time, r.prep_time, r.servings
                 FROM cooking_sessions cs
                 JOIN recipes r ON cs.recipe_id = r.id
                 WHERE cs.id = $1 AND cs.user_id = $2`,
                [req.params.sessionId, req.user.id]
            );

            if (result.rows.length === 0) {
                throw new AppError('Cooking session not found', 404, 'SESSION_NOT_FOUND');
            }

            const session = result.rows[0];

            // Get full recipe data
            const recipe = await Recipe.findById(session.recipe_id);

            res.json({
                success: true,
                data: {
                    sessionId: session.id,
                    currentStep: session.current_step,
                    startedAt: session.started_at,
                    completedAt: session.completed_at,
                    recipe: {
                        id: recipe.id,
                        title: recipe.title,
                        cookTime: recipe.cook_time,
                        prepTime: recipe.prep_time,
                        servings: recipe.servings,
                        ingredients: recipe.ingredients,
                        steps: recipe.steps
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   PATCH /api/cook/session/:sessionId/step
// @desc    Update current step in cooking session
// @access  Private
router.patch('/session/:sessionId/step',
    authenticate,
    param('sessionId').isUUID(),
    body('step').isInt({ min: 0 }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const { step } = req.body;

            // Verify session exists and belongs to user
            const sessionCheck = await query(
                'SELECT * FROM cooking_sessions WHERE id = $1 AND user_id = $2',
                [req.params.sessionId, req.user.id]
            );

            if (sessionCheck.rows.length === 0) {
                throw new AppError('Cooking session not found', 404, 'SESSION_NOT_FOUND');
            }

            // Update current step
            const result = await query(
                `UPDATE cooking_sessions 
                 SET current_step = $1 
                 WHERE id = $2 AND user_id = $3
                 RETURNING *`,
                [step, req.params.sessionId, req.user.id]
            );

            const session = result.rows[0];

            // Get recipe for current step
            const recipe = await Recipe.findById(session.recipe_id);
            const currentStepData = recipe.steps.find(s => s.step_number === step);

            res.json({
                success: true,
                data: {
                    sessionId: session.id,
                    currentStep: session.current_step,
                    currentStepData: currentStepData || null
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/cook/:recipeId/ask
// @desc    Ask a question during cooking (AI Q&A)
// @access  Private
// Note: This is a placeholder - actual implementation would use Claude API
router.post('/:recipeId/ask',
    authenticate,
    param('recipeId').isUUID(),
    body('question').notEmpty().trim(),
    body('currentStep').optional().isInt({ min: 0 }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const recipe = await Recipe.findById(req.params.recipeId);
            if (!recipe) {
                throw new AppError('Recipe not found', 404, 'RECIPE_NOT_FOUND');
            }

            const { question, currentStep } = req.body;

            // This would send to Claude API with recipe context
            // For now, return a placeholder response

            const mockResponses = [
                "Based on the recipe, you should cook until golden brown, about 3-4 minutes per side.",
                "The texture should be tender but not mushy. Try pressing gently - it should spring back slightly.",
                "Yes, you can substitute butter for oil in equal amounts.",
                "Make sure your pan is hot enough - a drop of water should sizzle and evaporate immediately."
            ];

            const answer = mockResponses[Math.floor(Math.random() * mockResponses.length)];

            res.json({
                success: true,
                data: {
                    recipeId: req.params.recipeId,
                    recipeTitle: recipe.title,
                    currentStep: currentStep || null,
                    question,
                    answer,
                    // In production, this would include audio URL from ElevenLabs
                    audioUrl: null
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/cook/session/:sessionId/complete
// @desc    Mark cooking session as complete with optional rating
// @access  Private
router.post('/session/:sessionId/complete',
    authenticate,
    param('sessionId').isUUID(),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('notes').optional().trim(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const { rating, notes } = req.body;

            // Update session
            const result = await query(
                `UPDATE cooking_sessions 
                 SET completed_at = CURRENT_TIMESTAMP, rating = $1, notes = $2
                 WHERE id = $3 AND user_id = $4
                 RETURNING *`,
                [rating, notes, req.params.sessionId, req.user.id]
            );

            if (result.rows.length === 0) {
                throw new AppError('Cooking session not found', 404, 'SESSION_NOT_FOUND');
            }

            const session = result.rows[0];

            // If rating provided, create or update recipe rating
            if (rating) {
                await query(
                    `INSERT INTO recipe_ratings (user_id, recipe_id, rating, notes, created_at)
                     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                     ON CONFLICT (user_id, recipe_id) 
                     DO UPDATE SET rating = EXCLUDED.rating, notes = EXCLUDED.notes, updated_at = CURRENT_TIMESTAMP`,
                    [req.user.id, session.recipe_id, rating, notes || null]
                );
            }

            res.json({
                success: true,
                data: {
                    sessionId: session.id,
                    recipeId: session.recipe_id,
                    completedAt: session.completed_at,
                    rating: session.rating,
                    notes: session.notes
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/cook/history
// @desc    Get user's cooking history
// @access  Private
router.get('/history',
    authenticate,
    async (req, res, next) => {
        try {
            const { limit, offset } = req.query;

            const result = await query(
                `SELECT cs.*, r.title as recipe_title, r.image_url as recipe_image
                 FROM cooking_sessions cs
                 JOIN recipes r ON cs.recipe_id = r.id
                 WHERE cs.user_id = $1 AND cs.completed_at IS NOT NULL
                 ORDER BY cs.completed_at DESC
                 LIMIT $2 OFFSET $3`,
                [req.user.id, parseInt(limit) || 20, parseInt(offset) || 0]
            );

            const countResult = await query(
                `SELECT COUNT(*) FROM cooking_sessions 
                 WHERE user_id = $1 AND completed_at IS NOT NULL`,
                [req.user.id]
            );

            res.json({
                success: true,
                data: {
                    sessions: result.rows.map(session => ({
                        sessionId: session.id,
                        recipeId: session.recipe_id,
                        recipeTitle: session.recipe_title,
                        recipeImage: session.recipe_image,
                        startedAt: session.started_at,
                        completedAt: session.completed_at,
                        rating: session.rating,
                        notes: session.notes
                    })),
                    total: parseInt(countResult.rows[0].count, 10),
                    limit: parseInt(limit) || 20,
                    offset: parseInt(offset) || 0
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/cook/session/:sessionId/timers
// @desc    Get active timers for current cooking session
// @access  Private
router.get('/session/:sessionId/timers',
    authenticate,
    param('sessionId').isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Invalid session ID', 400, 'VALIDATION_ERROR');
            }

            // Verify session exists
            const sessionCheck = await query(
                'SELECT * FROM cooking_sessions WHERE id = $1 AND user_id = $2',
                [req.params.sessionId, req.user.id]
            );

            if (sessionCheck.rows.length === 0) {
                throw new AppError('Cooking session not found', 404, 'SESSION_NOT_FOUND');
            }

            // Get recipe and current step
            const session = sessionCheck.rows[0];
            const recipe = await Recipe.findById(session.recipe_id);
            const currentStep = recipe.steps.find(s => s.step_number === session.current_step);

            // Extract timers from current and upcoming steps
            const timers = [];
            for (let i = session.current_step; i <= recipe.steps.length; i++) {
                const step = recipe.steps.find(s => s.step_number === i);
                if (step && step.duration_seconds > 0) {
                    timers.push({
                        stepNumber: step.step_number,
                        instruction: step.instruction,
                        duration: step.duration_seconds,
                        label: `Step ${step.step_number}: ${step.instruction.substring(0, 50)}...`
                    });
                }
            }

            res.json({
                success: true,
                data: {
                    sessionId: req.params.sessionId,
                    currentStep: session.current_step,
                    timers
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;