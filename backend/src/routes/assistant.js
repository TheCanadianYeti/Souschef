const express = require('express');
const { processChefCommand } = require('../services/aiService');

const router = express.Router();

router.post('/command', async (req, res) => {
    try {
        const { commandText, recipeData, currentStepIndex } = req.body;
        
        if (!commandText || !recipeData || currentStepIndex === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await processChefCommand(commandText, recipeData, currentStepIndex);
        res.json(result);
    } catch (error) {
        console.error('Error processing command:', error);
        res.status(500).json({ error: 'Failed to process voice command' });
    }
});

module.exports = router;
