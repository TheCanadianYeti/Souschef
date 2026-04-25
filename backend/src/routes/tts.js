const express = require('express');
const { generateSpeech } = require('../services/elevenLabsService');
const { authenticate, optionalAuth } = require('../middleware');

const router = express.Router();

// @route   POST /api/tts/generate
// @desc    Generate audio from text using ElevenLabs
// @access  Private (or Optional Auth for hackathon)
router.post('/generate', optionalAuth, async (req, res, next) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }

        const audioBuffer = await generateSpeech(text);

        if (!audioBuffer) {
            // If TTS is mocked/fails to return buffer
            return res.status(503).json({
                success: false,
                message: 'TTS service unavailable or API key missing'
            });
        }

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });

        res.send(audioBuffer);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
