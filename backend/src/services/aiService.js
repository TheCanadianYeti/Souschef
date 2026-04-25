const axios = require('axios');
const config = require('../config');

/**
 * Parse raw text into structured recipe JSON using Gemma 4 API
 * @param {string} rawText - The text extracted from Vision API
 * @returns {Promise<Object>} - Structured recipe data
 */
const parseRecipeText = async (rawText) => {
    console.log(`[AI] Starting recipe parsing (Text length: ${rawText.length} chars)...`);
    
    if (!config.gemma.apiKey) {
        console.warn('[AI] GEMMA_API_KEY missing, using mock fallback.');
        return getMockParsedRecipe(rawText);
    }

    const prompt = `
        EXTRACT ALL INGREDIENTS AND STEPS from the following text (it might be a video transcript or a blog post).
        
        Source Text:
        """
        ${rawText}
        """

        If this is a transcript, the measurements might be spoken (e.g. "two cups" instead of "2 cups"). Convert them to standard format.
        
        Output MUST be a valid JSON object with this exact structure:
        {
            "title": "Recipe Title",
            "description": "Short description",
            "servings": 2,
            "prepTime": 10,
            "cookTime": 20,
            "difficulty": "Easy" | "Medium" | "Hard",
            "ingredients": [
                { "name": "Ingredient Name", "quantity": "Number", "unit": "Unit (e.g. grams, tbsp)", "dietaryFlags": [] }
            ],
            "steps": [
                { "stepNumber": 1, "instruction": "Step instruction", "durationSeconds": 60 }
            ],
            "tags": ["Tag1", "Tag2"],
            "visualKeyword": "A 2-3 word search term for an image (e.g. 'Creamy Tomato Soup')"
        }

        Be extremely thorough. List EVERY ingredient mentioned. 
        If duration is not mentioned for a step, use 0.
        Return ONLY the raw JSON.
    `;

    // Try Gemini models in order — gemma-4 first (configured), then current stable Gemini fallbacks.
    // gemini-1.5-flash / gemini-1.5-pro are removed from v1beta; use gemini-2.0-flash instead.
    const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
    ];
    
    for (const model of modelsToTry) {
        try {
            console.log(`[AI] Attempting extraction with model: ${model}`);
            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${config.gemma.apiKey}`;
            
            const response = await axios.post(url, {
                contents: [{
                    parts: [{ text: prompt }]
                }]
            }, { timeout: 30000 }); // 30s — Gemma 4 can be slow

            if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                const content = response.data.candidates[0].content.parts[0].text;
                const jsonString = content.replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(jsonString);
                console.log(`[AI] Successfully extracted ${parsed.ingredients?.length} ingredients.`);
                return parsed;
            }
        } catch (error) {
            console.error(`[AI] Model ${model} failed:`, error.response?.data?.error?.message || error.message);
            // Continue to next model
        }
    }

    console.error('[AI] All models failed, using mock fallback.');
    return getMockParsedRecipe(rawText);
};

/**
 * Helper to return a valid structured recipe when AI fails or key is missing
 */
const getMockParsedRecipe = (rawText) => {
    // Attempt to extract a title if possible from the first 50 chars
    const titleMatch = rawText.substring(0, 50).split('\n')[0] || "Imported Recipe";
    
    return {
        title: titleMatch.trim(),
        description: "Successfully imported from source. Structure approximated due to AI quota.",
        servings: 2,
        prepTime: 10,
        cookTime: 20,
        difficulty: "Medium",
        ingredients: [
            { name: "Placeholder Ingredient", quantity: "1", unit: "unit", dietaryFlags: [] }
        ],
        steps: [
            { stepNumber: 1, instruction: "Follow the instructions from the source URL or photo.", durationSeconds: 60 }
        ],
        tags: ["Imported"]
    };
};

/**
 * Process a voice command from the user during cooking mode
 * @param {string} commandText - The user's spoken command
 * @param {Object} recipeData - The current recipe being cooked
 * @param {number} currentStepIndex - The index of the current step
 * @returns {Promise<Object>} - Action to take and text to speak back
 */
const processChefCommand = async (commandText, recipeData, currentStepIndex) => {
    const currentStep = recipeData.steps[currentStepIndex];
    const normalizedInput = commandText.toLowerCase();

    // -- STRICT HEURISTIC ENGINE (Navigation & On-Screen Info Only) --
    
    // 1. Navigation
    if (normalizedInput.includes('next') || normalizedInput.includes('forward') || normalizedInput.includes('continue') || normalizedInput.includes('done')) {
        return { action: 'NEXT_STEP', replyText: "Next step." };
    }
    if (normalizedInput.includes('back') || normalizedInput.includes('previous') || normalizedInput.includes('last')) {
        return { action: 'PREVIOUS_STEP', replyText: "Going back." };
    }
    
    // 2. Repetition
    if (normalizedInput.includes('repeat') || normalizedInput.includes('say again') || normalizedInput.includes('what') || normalizedInput.trim() === '') {
        return { action: 'REPEAT', replyText: `Step ${currentStepIndex + 1}: ${currentStep.instruction}` };
    }
    
    // 3. Ingredient Lookup (On-screen info)
    for (const ing of recipeData.ingredients) {
        if (normalizedInput.includes(ing.name.toLowerCase())) {
            return { action: 'ANSWER', replyText: `${ing.quantity} ${ing.unit} of ${ing.name}.` };
        }
    }

    // 4. Default Fallback
    return { action: 'UNKNOWN', replyText: "I can help you go 'next', 'back', or tell you about ingredients." };
};

module.exports = {
    parseRecipeText,
    processChefCommand
};
