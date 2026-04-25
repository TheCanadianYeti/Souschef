const axios = require('axios');
const config = require('../config');

/**
 * Parse raw text into structured recipe JSON using Google Gemini API
 * @param {string} rawText - The text extracted from Vision API
 * @returns {Promise<Object>} - Structured recipe data
 */
const parseRecipeText = async (rawText) => {
    if (!config.gemma.apiKey) {
        throw new Error('GEMMA_API_KEY is not configured');
    }

    const prompt = `
        Convert the following raw text from a recipe photo into a structured JSON format.
        
        Raw Text:
        """
        ${rawText}
        """

        Output MUST be a valid JSON object:
        {
            "title": "String",
            "description": "String",
            "servings": Number,
            "prepTime": Number,
            "cookTime": Number,
            "difficulty": "Easy" | "Medium" | "Hard",
            "ingredients": [
                { "name": "String", "quantity": "String", "unit": "String", "dietaryFlags": ["String"] }
            ],
            "steps": [
                { "stepNumber": Number, "instruction": "String", "durationSeconds": Number }
            ],
            "tags": ["String"]
        }

        Return ONLY the JSON.
    `;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemma.model}:generateContent?key=${config.gemma.apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: prompt }]
            }]
        });

        const content = response.data.candidates[0].content.parts[0].text;
        
        // Clean up the response (remove markdown code blocks if present)
        const jsonString = content.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        throw new Error('Failed to parse recipe with AI');
    }
};

module.exports = {
    parseRecipeText
};
