const express = require('express');
const authRoutes = require('./auth');
const recipeRoutes = require('./recipes');
const cookingRoutes = require('./cooking');
const groceryRoutes = require('./grocery');
const ttsRoutes = require('./tts');
const assistantRoutes = require('./assistant');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'souschef API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/recipes', recipeRoutes);
router.use('/cook', cookingRoutes);
router.use('/grocery', groceryRoutes);
router.use('/tts', ttsRoutes);
router.use('/assistant', assistantRoutes);

module.exports = router;