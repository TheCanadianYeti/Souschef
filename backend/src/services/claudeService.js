const axios = require('axios');
const config = require('../config');

/**
 * Parse raw text from an image or URL into a structured recipe JSON using Claude API
 * @param {string} rawText - The text extracted from Vision API or scraped from a URL
 * @returns {Promise<Object>} - Structured recipe data
 */
const parseRecipeText = async (rawText) => {
    if (!config.claude.apiKey) {
        throw new Error('CLAUDE_API_KEY is not configured');
    }

    const prompt = `
        You are an expert chef and data scientist. Convert the following raw text extracted from a recipe photo into a clean, structured JSON format.
        
        Raw Text:
        """
        ${rawText}
        """

        The output MUST be a valid JSON object with the following structure:
        {
            "title": "String",
            "description": "String",
            "servings": Number,
            "prepTime": Number (in minutes),
            "cookTime": Number (in minutes),
            "difficulty": "Easy" | "Medium" | "Hard" | "Expert",
            "ingredients": [
                { "name": "String", "quantity": "String", "unit": "String", "dietaryFlags": ["String"], "notes": "String" }
            ],
            "steps": [
                { "stepNumber": Number, "instruction": "String", "durationSeconds": Number, "notes": "String" }
            ],
            "tags": ["String"]
        }

        Requirements:
        1. If a value is missing, provide a reasonable default or null.
        2. Ensure ingredients and steps are parsed accurately from the text.
        3. Infer dietary flags (e.g., vegan, gluten-free) if possible.
        4. Return ONLY the JSON object.
    `;

    try {
        const response = await axios.post(
            config.claude.apiUrl,
            {
                model: config.claude.model,
                max_tokens: 4000,
                messages: [
                    { role: 'user', content: prompt }
                ]
            },
            {
                headers: {
                    'x-api-key': config.claude.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                }
            }
        );

        // Claude returns a text response, we need to extract the JSON part
        const content = response.data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('Failed to parse JSON from Claude response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Claude API Error:', error.response?.data || error.message);
        throw new Error('Failed to parse recipe with AI');
    }
};

module.exports = {
    parseRecipeText
};
