const express = require('express');
const { body, param, validationResult } = require('express-validator');
const GroceryList = require('../models/GroceryList');
const Recipe = require('../models/Recipe');
const { query } = require('../database');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/grocery/list
// @desc    Get user's current grocery list
// @access  Private
router.get('/list',
    authenticate,
    async (req, res, next) => {
        try {
            const list = await GroceryList.getOrCreateForUser(req.user.id);
            const listWithItems = await GroceryList.getWithItems(list.id);

            res.json({
                success: true,
                data: listWithItems
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/grocery/list
// @desc    Create a new grocery list
// @access  Private
router.post('/list',
    authenticate,
    body('name').optional().trim(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const { name } = req.body;
            const list = await GroceryList.create(req.user.id, name || 'My Grocery List');

            res.status(201).json({
                success: true,
                data: list
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/grocery/list/:listId
// @desc    Update grocery list name
// @access  Private
router.put('/list/:listId',
    authenticate,
    param('listId').isUUID(),
    body('name').notEmpty().trim(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const list = await GroceryList.findById(req.params.listId);
            if (!list) {
                throw new AppError('Grocery list not found', 404, 'LIST_NOT_FOUND');
            }

            // Check ownership
            if (list.user_id !== req.user.id) {
                throw new AppError('Not authorized to update this list', 403, 'FORBIDDEN');
            }

            const updatedList = await GroceryList.update(req.params.listId, {
                name: req.body.name
            });

            res.json({
                success: true,
                data: updatedList
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/grocery/list/:listId
// @desc    Delete/deactivate a grocery list
// @access  Private
router.delete('/list/:listId',
    authenticate,
    param('listId').isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Invalid list ID', 400, 'VALIDATION_ERROR');
            }

            const list = await GroceryList.findById(req.params.listId);
            if (!list) {
                throw new AppError('Grocery list not found', 404, 'LIST_NOT_FOUND');
            }

            // Check ownership
            if (list.user_id !== req.user.id) {
                throw new AppError('Not authorized to delete this list', 403, 'FORBIDDEN');
            }

            await GroceryList.delete(req.params.listId);

            res.json({
                success: true,
                message: 'Grocery list deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/grocery/add-from-recipe
// @desc    Add recipe ingredients to grocery list
// @access  Private
router.post('/add-from-recipe',
    authenticate,
    body('recipeId').isUUID(),
    body('listId').optional().isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const { recipeId, listId } = req.body;

            // Verify recipe exists
            const recipe = await Recipe.findById(recipeId);
            if (!recipe) {
                throw new AppError('Recipe not found', 404, 'RECIPE_NOT_FOUND');
            }

            // Get or create grocery list
            let list;
            if (listId) {
                list = await GroceryList.findById(listId);
                if (!list) {
                    throw new AppError('Grocery list not found', 404, 'LIST_NOT_FOUND');
                }
                if (list.user_id !== req.user.id) {
                    throw new AppError('Not authorized to use this list', 403, 'FORBIDDEN');
                }
            } else {
                list = await GroceryList.getOrCreateForUser(req.user.id);
            }

            // Add ingredients from recipe
            const addedItems = await GroceryList.addItemsFromRecipe(list.id, recipeId);

            res.json({
                success: true,
                data: {
                    listId: list.id,
                    recipeId,
                    recipeTitle: recipe.title,
                    addedItems,
                    itemsAdded: addedItems.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/grocery/list/:listId/items
// @desc    Add custom item to grocery list
// @access  Private
router.post('/list/:listId/items',
    authenticate,
    param('listId').isUUID(),
    body('name').notEmpty().trim(),
    body('quantity').optional().isString(),
    body('unit').optional().isString(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const list = await GroceryList.findById(req.params.listId);
            if (!list) {
                throw new AppError('Grocery list not found', 404, 'LIST_NOT_FOUND');
            }

            // Check ownership
            if (list.user_id !== req.user.id) {
                throw new AppError('Not authorized to modify this list', 403, 'FORBIDDEN');
            }

            const { name, quantity, unit } = req.body;

            const item = await GroceryList.addItem(req.params.listId, {
                name,
                quantity,
                unit
            });

            if (!item) {
                return res.status(409).json({
                    success: false,
                    message: 'Item already exists in list',
                    code: 'ITEM_EXISTS'
                });
            }

            res.status(201).json({
                success: true,
                data: item
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   PATCH /api/grocery/items/:itemId
// @desc    Update grocery list item (check off, update quantity)
// @access  Private
router.patch('/items/:itemId',
    authenticate,
    param('itemId').isUUID(),
    body('is_checked').optional().isBoolean(),
    body('quantity').optional().isString(),
    body('name').optional().trim(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            // Get item to verify ownership
            const itemResult = await query(
                'SELECT * FROM grocery_list_items WHERE id = $1',
                [req.params.itemId]
            );

            if (itemResult.rows.length === 0) {
                throw new AppError('Item not found', 404, 'ITEM_NOT_FOUND');
            }

            const item = itemResult.rows[0];

            // Verify list ownership
            const listResult = await query(
                'SELECT * FROM grocery_lists WHERE id = $1 AND user_id = $2',
                [item.grocery_list_id, req.user.id]
            );

            if (listResult.rows.length === 0) {
                throw new AppError('Not authorized to modify this item', 403, 'FORBIDDEN');
            }

            const { is_checked, quantity, name } = req.body;

            await GroceryList.updateItem(req.params.itemId, {
                is_checked,
                quantity,
                name
            });

            res.json({
                success: true,
                message: 'Item updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/grocery/items/:itemId
// @desc    Remove item from grocery list
// @access  Private
router.delete('/items/:itemId',
    authenticate,
    param('itemId').isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Invalid item ID', 400, 'VALIDATION_ERROR');
            }

            // Get item to verify ownership
            const itemResult = await query(
                'SELECT * FROM grocery_list_items WHERE id = $1',
                [req.params.itemId]
            );

            if (itemResult.rows.length === 0) {
                throw new AppError('Item not found', 404, 'ITEM_NOT_FOUND');
            }

            const item = itemResult.rows[0];

            // Verify list ownership
            const listResult = await query(
                'SELECT * FROM grocery_lists WHERE id = $1 AND user_id = $2',
                [item.grocery_list_id, req.user.id]
            );

            if (listResult.rows.length === 0) {
                throw new AppError('Not authorized to modify this item', 403, 'FORBIDDEN');
            }

            await GroceryList.removeItem(req.params.itemId);

            res.json({
                success: true,
                message: 'Item removed successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/grocery/clear-checked
// @desc    Remove all checked items from grocery list
// @access  Private
router.post('/clear-checked',
    authenticate,
    body('listId').optional().isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const { listId } = req.body;

            let list;
            if (listId) {
                list = await GroceryList.findById(listId);
                if (!list) {
                    throw new AppError('Grocery list not found', 404, 'LIST_NOT_FOUND');
                }
                if (list.user_id !== req.user.id) {
                    throw new AppError('Not authorized', 403, 'FORBIDDEN');
                }
            } else {
                list = await GroceryList.getOrCreateForUser(req.user.id);
            }

            await GroceryList.clearCheckedItems(list.id);

            res.json({
                success: true,
                message: 'Checked items cleared successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/grocery/checkout
// @desc    Generate Instacart checkout link
// @access  Private
// Note: This is a placeholder - actual implementation would use Instacart API
router.post('/checkout',
    authenticate,
    body('listId').optional().isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
            }

            const { listId } = req.body;

            let list;
            if (listId) {
                list = await GroceryList.findById(listId);
                if (!list) {
                    throw new AppError('Grocery list not found', 404, 'LIST_NOT_FOUND');
                }
                if (list.user_id !== req.user.id) {
                    throw new AppError('Not authorized', 403, 'FORBIDDEN');
                }
            } else {
                list = await GroceryList.getOrCreateForUser(req.user.id);
            }

            const listWithItems = await GroceryList.getWithItems(list.id);

            // Filter to unchecked items only
            const itemsToOrder = listWithItems.items.filter(item => !item.is_checked);

            if (itemsToOrder.length === 0) {
                return res.json({
                    success: true,
                    message: 'No items to order',
                    data: {
                        instacartUrl: null,
                        itemCount: 0
                    }
                });
            }

            // In production, this would:
            // 1. Map ingredients to Instacart products
            // 2. Create a pre-filled cart via Instacart API
            // 3. Return a deep link URL

            // For now, return a placeholder URL
            const instacartUrl = `https://www.instacart.com/store?search=${encodeURIComponent(
                itemsToOrder.map(item => item.name).join(', ')
            )}`;

            res.json({
                success: true,
                data: {
                    instacartUrl,
                    itemCount: itemsToOrder.length,
                    items: itemsToOrder,
                    message: 'Redirect to Instacart to complete your order'
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/grocery/instacart/products
// @desc    Search for Instacart products matching an ingredient
// @access  Private
// Note: This is a placeholder - actual implementation would use Instacart API
router.get('/instacart/products',
    authenticate,
    async (req, res, next) => {
        try {
            const { query: searchQuery, limit } = req.query;

            if (!searchQuery) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            // In production, this would query Instacart API
            // For now, return mock data
            const mockProducts = [
                {
                    id: 'instacart_1',
                    name: `${searchQuery} - Brand A`,
                    price: 4.99,
                    unit: 'each',
                    inStock: true
                },
                {
                    id: 'instacart_2',
                    name: `${searchQuery} - Brand B (Organic)`,
                    price: 6.99,
                    unit: 'each',
                    inStock: true
                }
            ];

            res.json({
                success: true,
                data: mockProducts.slice(0, parseInt(limit) || 10)
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;