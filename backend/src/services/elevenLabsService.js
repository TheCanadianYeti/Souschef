const { ElevenLabsClient } = require('elevenlabs');

/**
 * Service for interacting with ElevenLabs API
 */

// We initialize the client inside functions or pass the key to avoid crashing if it's missing on startup
let client = null;

const getClient = () => {
    if (!client) {
        console.log('Initializing ElevenLabs client...');
        if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
            console.warn("ELEVENLABS_API_KEY is not set or is a placeholder. TTS will be mocked.");
            return null;
        }
        console.log('ElevenLabs API Key found (first 5 chars):', process.env.ELEVENLABS_API_KEY.substring(0, 5));
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
    console.log(`TTS request received for text: "${text.substring(0, 30)}..."`);
    const api = getClient();
    if (!api) {
        console.log(`[Mock TTS] Generating speech for: "${text}"`);
        // If no API key, return null (the frontend can choose to do nothing, or we just return an empty buffer)
        return null;
    }

    try {
        const voiceId = "wWWn96OtTHu1sn8SRGEr"; 
        console.log(`[ElevenLabs] Using voice: ${voiceId} with multilingual-v2`);

        const audioStream = await api.textToSpeech.convert(voiceId, {
            text: text,
            model_id: "eleven_multilingual_v2", // Most compatible model
            output_format: "mp3_44100_128",
        });

        const chunks = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (error) {
        console.error("--- ELEVENLABS API ERROR ---");
        if (error.status === 402) {
            console.error("Status: 402 (Quota Exceeded / Subscription Required)");
            console.error("Hale's voice may require a paid ElevenLabs tier or more credits.");
        } else {
            console.error(`Status: ${error.status || 'Unknown'}`);
            console.error(`Message: ${error.message}`);
        }
        throw error;
    }
};

module.exports = {
    generateSpeech
};
