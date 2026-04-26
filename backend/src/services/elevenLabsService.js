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
        // Rachel (Standard voice) is usually available on all plans
        const preferredVoiceId = "21m00Tcm4TlvDq8ikWAM";
        let voiceId = preferredVoiceId;

        console.log(`[ElevenLabs] Attempting to use standard voice: ${voiceId}`);
        
        const generate = async (vId) => {
            return await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${vId}/stream`,
                {
                    text: text,
                    model_id: "eleven_monolingual_v1", // Faster and more compatible with basic plans
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
        };

        let response;
        try {
            response = await generate(voiceId);
        } catch (err) {
            // If the specific voice fails with 404 (Not Found), try to fallback to any available voice
            if (err.response && err.response.status === 404) {
                console.warn(`[ElevenLabs] Preferred voice ${voiceId} not found. Falling back to available voices...`);
                const voicesResponse = await axios.get('https://api.elevenlabs.io/v1/voices', {
                    headers: { 'xi-api-key': apiKey }
                });
                
                if (voicesResponse.data.voices && voicesResponse.data.voices.length > 0) {
                    const fallbackVoice = voicesResponse.data.voices[0];
                    voiceId = fallbackVoice.voice_id;
                    console.log(`[ElevenLabs] Falling back to voice: ${fallbackVoice.name} (${voiceId})`);
                    response = await generate(voiceId);
                } else {
                    throw new Error('No voices found in this ElevenLabs account.');
                }
            } else {
                throw err;
            }
        }

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
