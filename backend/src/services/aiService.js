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

/**
 * Process a voice command from the user during cooking mode
 * @param {string} commandText - The user's spoken command
 * @param {Object} recipeData - The current recipe being cooked
 * @param {number} currentStepIndex - The index of the current step
 * @returns {Promise<Object>} - Action to take and text to speak back
 */
const processChefCommand = async (commandText, recipeData, currentStepIndex) => {
    if (!config.gemma.apiKey) {
        throw new Error('GEMMA_API_KEY is not configured');
    }

    const currentStep = recipeData.steps[currentStepIndex];

    const prompt = `
        You are "Chef", an AI voice assistant helping a user cook a recipe.
        The user is currently on step ${currentStepIndex + 1}: "${currentStep ? currentStep.instruction : 'None'}"
        
        Recipe context:
        Title: ${recipeData.title}
        Ingredients: ${JSON.stringify(recipeData.ingredients)}
        Steps: ${JSON.stringify(recipeData.steps)}

        The user just said: "${commandText}"

        Your job is to determine what action the user interface should take, and what you should say back to the user.
        Valid actions:
        - "NEXT_STEP": If they want to move to the next step.
        - "PREVIOUS_STEP": If they want to go back.
        - "REPEAT": If they want you to read the current step again.
        - "ANSWER": If they asked a question (e.g. "how much sugar?").
        - "UNKNOWN": If you don't understand the command.

        For the "replyText", keep it conversational, very brief (1-2 sentences max), helpful, and direct.

        Output MUST be a valid JSON object:
        {
            "action": "NEXT_STEP" | "PREVIOUS_STEP" | "REPEAT" | "ANSWER" | "UNKNOWN",
            "replyText": "String"
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
        const jsonString = content.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Gemini API Error processing command:', error.response?.data || error.message);
        throw new Error('Failed to process voice command with AI');
    }
};

module.exports = {
    parseRecipeText,
    processChefCommand
};
