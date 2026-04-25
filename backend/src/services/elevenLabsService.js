const { ElevenLabsClient } = require('elevenlabs');

/**
 * Service for interacting with ElevenLabs API
 */

// We initialize the client inside functions or pass the key to avoid crashing if it's missing on startup
let client = null;

const getClient = () => {
    if (!client) {
        if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
            console.warn("ELEVENLABS_API_KEY is not set or is a placeholder. TTS will be mocked.");
            return null;
        }
        client = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY
        });
    }
    return client;
};

/**
 * Generate Speech from Text (TTS)
 * @param {string} text - The text to synthesize
 * @returns {Buffer|null} - Audio buffer, or null if mocking
 */
const generateSpeech = async (text) => {
    const api = getClient();
    if (!api) {
        console.log(`[Mock TTS] Generating speech for: "${text}"`);
        // If no API key, return null (the frontend can choose to do nothing, or we just return an empty buffer)
        return null;
    }

    try {
        // Rachel voice ID (common default) or define another
        const voiceId = "21m00Tcm4TlvDq8ikWAM"; 

        const audioStream = await api.textToSpeech.convert(voiceId, {
            text: text,
            model_id: "eleven_turbo_v2_5", // Fast, conversational model
            output_format: "mp3_44100_128",
        });

        // Convert Node.js readable stream to buffer
        const chunks = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (error) {
        console.error("ElevenLabs TTS Error:", error);
        throw error;
    }
};

module.exports = {
    generateSpeech
};
