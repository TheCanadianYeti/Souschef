const axios = require('axios');

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

    try {
        // 1. Fetch available voices to ensure we use one that works with your current plan
        console.log('[ElevenLabs] Fetching available voices...');
        const voicesResponse = await axios.get('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': apiKey }
        });

        if (!voicesResponse.data.voices || voicesResponse.data.voices.length === 0) {
            throw new Error('No voices found in this ElevenLabs account.');
        }

        const voice = voicesResponse.data.voices[0];
        const voiceId = voice.voice_id;
        console.log(`[ElevenLabs] Using voice: ${voice.name} (${voiceId})`);

        console.log(`[ElevenLabs] Generating speech for text: "${text.substring(0, 30)}..."`);

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
            {
                text: text,
                model_id: "eleven_multilingual_v2",
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
                timeout: 30000 
            }
        );

        console.log(`[ElevenLabs] Successfully generated audio: ${response.data.byteLength} bytes.`);
        return Buffer.from(response.data);
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
