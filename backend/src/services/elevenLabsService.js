const axios = require('axios');

// Simple in-memory cache to save credits and prevent redundant API calls
const audioCache = new Map();

/**
 * Generate Speech from Text (TTS) using ElevenLabs API
 * Uses the "known good format" with direct axios calls.
 * 
 * @param {string} text - The text to synthesize
 * @returns {Buffer|null} - Audio buffer, or null if key is missing
 */
const generateSpeech = async (text) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
        console.warn("ELEVENLABS_API_KEY is not set or is a placeholder. TTS will be mocked.");
        return null;
    }

    // Check cache first to save credits and ensure stability
    const cacheKey = `${text}_${process.env.ELEVENLABS_VOICE_ID || 'default'}`;
    if (audioCache.has(cacheKey)) {
        console.log(`[ElevenLabs] Serving from cache: "${text.substring(0, 20)}..."`);
        return audioCache.get(cacheKey);
    }

    try {
        const voiceId = process.env.ELEVENLABS_VOICE_ID || "CwhRBWXzGAHq8TQ4Fs17";
        console.log(`[ElevenLabs] Using static voice ID: ${voiceId}`);

        console.log(`[ElevenLabs] Generating speech for text: "${text.substring(0, 30)}..."`);
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
            {
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            },
            {
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'accept': 'audio/mpeg'
                },
                responseType: 'arraybuffer',
                timeout: 10000 
            }
        );

        console.log(`[ElevenLabs] Successfully generated audio: ${response.data.byteLength} bytes.`);
        const buffer = Buffer.from(response.data);
        audioCache.set(cacheKey, buffer);
        return buffer;
    } catch (error) {
        console.error("--- ELEVENLABS API ERROR ---");
        if (error.response) {
            const status = error.response.status;
            console.error(`Status: ${status}`);
            
            const data = error.response.data;
            let errorMsg = '';
            
            if (data instanceof ArrayBuffer || Buffer.isBuffer(data)) {
                errorMsg = Buffer.from(data).toString();
            } else {
                errorMsg = JSON.stringify(data, null, 2);
            }
            
            console.error('Error Body:', errorMsg);
            
            // Special handling for unusual activity detection
            if (errorMsg.includes('unusual_activity')) {
                console.error("CRITICAL: ElevenLabs has detected unusual activity and blocked this request. Your API key or IP may be restricted.");
            }

            // Special handling for permission errors
            if (errorMsg.includes('missing_permissions')) {
                console.error("CRITICAL: Your ElevenLabs API key is missing required permissions (scopes). Please ensure it has 'tts_write' and 'voices_read' access.");
            }

            if (status === 401) {
                console.error("Authentication failed. Check your ELEVENLABS_API_KEY.");
            } else if (status === 402) {
                console.error("Quota exceeded or subscription required.");
            }
        } else {
            console.error('Error Message:', error.message);
        }
        throw error;
    }
};

module.exports = {
    generateSpeech
};
