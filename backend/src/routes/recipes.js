const express = require('express');
const { body, param, validationResult } = require('express-validator');
const multer = require('axios');
const Recipe = require('../models/Recipe');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');

const router = express.Router();

// Validation rules for recipe creation/update
const recipeValidation = [
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('sourceUrl').optional().isURL(),
    body('sourceType').optional().isIn(['video', 'photo', 'url', 'manual']),
    body('servings').optional().isInt({ min: 1 }),
    body('cookTime').optional().isInt({ min: 0 }),
    body('prepTime').optional().isInt({ min: 0 }),
    body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard', 'Expert']),
    body('tags').optional().isArray(),
    body('tags.*').isString(),
    body('imageUrl').optional().isURL(),
    body('ingredients').optional().isArray(),
    body('ingredients.*.name').notEmpty().trim(),
    body('ingredients.*.quantity').optional().isString(),
    body('ingredients.*.unit').optional().isString(),
    body('ingredients.*.dietaryFlags').optional().isArray(),
    body('steps').optional().isArray(),
    body('steps.*.instruction').notEmpty().trim(),
    body('steps.*.stepNumber').isInt({ min: 1 }),
    body('steps.*.durationSeconds').optional().isInt({ min: 0 })
];

// Helper to format recipe response
const formatRecipeResponse = (recipe) => {
    if (!recipe) return null;
    return {
        id: recipe.id,
        userId: recipe.user_id,
        title: recipe.title,
        description: recipe.description,
        sourceUrl: recipe.source_url,
        sourceType: recipe.source_type,
        servings: recipe.servings,
        cookTime: recipe.cook_time,
        prepTime: recipe.prep_time,
        difficulty: recipe.difficulty,
        tags: recipe.tags,
        imageUrl: recipe.image_url,
        originalRecipeId: recipe.original_recipe_id,
        version: recipe.version,
        isPublic: recipe.is_public,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || []
    };
};

// @route   POST /api/recipes
// @desc    Create a new recipe
// @access  Private
router.post('/',
    authenticate,
    recipeValidation,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const {
                title, description, sourceUrl, sourceType, servings,
                cookTime, prepTime, difficulty, tags, imageUrl,
                ingredients, steps
            } = req.body;

            const recipe = await Recipe.create({
                userId: req.user.id,
                title,
                description,
                sourceUrl,
                sourceType: sourceType || 'manual',
                servings,
                cookTime,
                prepTime,
                difficulty,
                tags,
                imageUrl,
                ingredients: ingredients?.map(ing => ({
                    name: ing.name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    dietaryFlags: ing.dietaryFlags,
                    notes: ing.notes
                })),
                steps: steps?.map((step, index) => ({
                    stepNumber: step.stepNumber || index + 1,
                    instruction: step.instruction,
                    durationSeconds: step.durationSeconds,
                    notes: step.notes,
                    imageUrls: step.imageUrls,
                    equipmentNeeded: step.equipmentNeeded
                }))
            });

            res.status(201).json({
                success: true,
                data: formatRecipeResponse(recipe)
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/recipes
// @desc    Get user's recipes with optional filtering
// @access  Private
router.get('/',
    authenticate,
    async (req, res, next) => {
        try {
            const { limit, offset, tags, search } = req.query;
            const tagArray = tags ? tags.split(',') : [];

            const result = await Recipe.findByUser(req.user.id, {
                limit: parseInt(limit) || 50,
                offset: parseInt(offset) || 0,
                tags: tagArray,
                search: search || ''
            });

            res.json({
                success: true,
                data: {
                    recipes: result.recipes.map(formatRecipeResponse),
                    total: result.total,
                    limit: result.limit,
                    offset: result.offset
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/recipes/public
// @desc    Get public recipes
// @access  Public
router.get('/public',
    async (req, res, next) => {
        try {
            const { limit, offset, tags, search } = req.query;
            const tagArray = tags ? tags.split(',') : [];

            const recipes = await Recipe.getPublicRecipes({
                limit: parseInt(limit) || 20,
                offset: parseInt(offset) || 0,
                tags: tagArray,
                search: search || ''
            });

            res.json({
                success: true,
                data: recipes.map(formatRecipeResponse)
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/recipes/:id
// @desc    Get a specific recipe by ID
// @access  Public (if recipe is public or owned by authenticated user)
router.get('/:id',
    param('id').isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Invalid recipe ID', 400, 'VALIDATION_ERROR');
            }

            const recipe = await Recipe.findById(req.params.id);
            if (!recipe) {
                throw new AppError('Recipe not found', 404, 'RECIPE_NOT_FOUND');
            }

            // Check access - public recipes or owned by authenticated user
            // For now, allow access to all recipes (adjust based on your auth needs)

            res.json({
                success: true,
                data: formatRecipeResponse(recipe)
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/recipes/:id
// @desc    Update a recipe
// @access  Private (owner only)
router.put('/:id',
    authenticate,
    param('id').isUUID(),
    recipeValidation,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const recipe = await Recipe.findById(req.params.id);
            if (!recipe) {
                throw new AppError('Recipe not found', 404, 'RECIPE_NOT_FOUND');
            }

            // Check ownership
            if (recipe.user_id !== req.user.id) {
                throw new AppError('Not authorized to update this recipe', 403, 'FORBIDDEN');
            }

            const {
                title, description, sourceUrl, sourceType, servings,
                cookTime, prepTime, difficulty, tags, imageUrl, isPublic,
                ingredients, steps
            } = req.body;

            // Update recipe fields
            const updatedRecipe = await Recipe.update(req.params.id, {
                title, description, sourceUrl, sourceType, servings,
                cookTime, prepTime, difficulty, tags, imageUrl, isPublic
            });

            // Update ingredients if provided
            if (ingredients) {
                await Recipe.updateIngredients(req.params.id, ingredients.map(ing => ({
                    name: ing.name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    dietaryFlags: ing.dietaryFlags,
                    notes: ing.notes
                })));
            }

            // Update steps if provided
            if (steps) {
                await Recipe.updateSteps(req.params.id, steps.map((step, index) => ({
                    stepNumber: step.stepNumber || index + 1,
                    instruction: step.instruction,
                    durationSeconds: step.durationSeconds,
                    notes: step.notes,
                    imageUrls: step.imageUrls,
                    equipmentNeeded: step.equipmentNeeded
                })));
            }

            // Fetch fresh data
            const freshRecipe = await Recipe.findById(req.params.id);

            res.json({
                success: true,
                data: formatRecipeResponse(freshRecipe)
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/recipes/:id
// @desc    Delete a recipe
// @access  Private (owner only)
router.delete('/:id',
    authenticate,
    param('id').isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Invalid recipe ID', 400, 'VALIDATION_ERROR');
            }

            const recipe = await Recipe.findById(req.params.id);
            if (!recipe) {
                throw new AppError('Recipe not found', 404, 'RECIPE_NOT_FOUND');
            }

            // Check ownership
            if (recipe.user_id !== req.user.id) {
                throw new AppError('Not authorized to delete this recipe', 403, 'FORBIDDEN');
            }

            await Recipe.delete(req.params.id);

            res.json({
                success: true,
                message: 'Recipe deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/recipes/:id/fork
// @desc    Create a copy of a recipe
// @access  Private
router.post('/:id/fork',
    authenticate,
    param('id').isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Invalid recipe ID', 400, 'VALIDATION_ERROR');
            }

            const forkedRecipe = await Recipe.fork(req.params.id, req.user.id);

            res.status(201).json({
                success: true,
                data: formatRecipeResponse(forkedRecipe)
            });
        } catch (error) {
            if (error.message === 'Recipe not found') {
                throw new AppError('Recipe not found', 404, 'RECIPE_NOT_FOUND');
            }
            next(error);
        }
    }
);

// @route   POST /api/recipes/capture
// @desc    Capture recipe from video/image upload (AI parsing)
// @access  Private
// Note: This is a placeholder - actual implementation would use Claude API
router.post('/capture',
    authenticate,
    async (req, res, next) => {
        try {
            // This endpoint would handle file uploads via multer
            // and send to Claude API for parsing
            // For now, return a placeholder response

            res.json({
                success: true,
                message: 'Recipe capture endpoint - AI integration pending',
                data: {
                    title: 'Parsed Recipe Title',
                    description: 'AI-parsed description',
                    sourceType: 'video',
                    servings: 4,
                    cookTime: 30,
                    prepTime: 15,
                    difficulty: 'Medium',
                    tags: ['AI-Generated'],
                    ingredients: [
                        { name: 'Ingredient 1', quantity: '1', unit: 'cup', dietaryFlags: [] },
                        { name: 'Ingredient 2', quantity: '2', unit: 'tbsp', dietaryFlags: [] }
                    ],
                    steps: [
                        { stepNumber: 1, instruction: 'Step 1 instruction', durationSeconds: 300 },
                        { stepNumber: 2, instruction: 'Step 2 instruction', durationSeconds: 600 }
                    ]
                }
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
    authenticate,
    body('url').isURL(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Valid URL is required', 400, 'VALIDATION_ERROR');
            }

            const { url } = req.body;

            // This endpoint would scrape the URL and send to Claude API for parsing
            // For now, return a placeholder response

            res.json({
                success: true,
                message: 'URL extraction endpoint - AI integration pending',
                data: {
                    title: 'Parsed Recipe from URL',
                    description: `Recipe extracted from ${url}`,
                    sourceType: 'url',
                    sourceUrl: url,
                    servings: 4,
                    cookTime: 30,
                    prepTime: 15,
                    difficulty: 'Medium',
                    tags: ['URL-Extracted'],
                    ingredients: [
                        { name: 'Ingredient 1', quantity: '1', unit: 'cup', dietaryFlags: [] },
                        { name: 'Ingredient 2', quantity: '2', unit: 'tbsp', dietaryFlags: [] }
                    ],
                    steps: [
                        { stepNumber: 1, instruction: 'Step 1 instruction', durationSeconds: 300 },
                        { stepNumber: 2, instruction: 'Step 2 instruction', durationSeconds: 600 }
                    ]
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;