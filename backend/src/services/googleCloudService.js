const axios = require('axios');
const config = require('../config');

/**
 * Detect text in an image buffer (direct from memory)
 * @param {Buffer} fileBuffer - The image file buffer from multer
 * @returns {Promise<string>} - The extracted text
 */
const detectTextFromBuffer = async (fileBuffer) => {
    if (!config.googleCloud.visionApiKey) {
        throw new Error('GCP_VISION_API_KEY is not configured');
    }

    // Convert the image buffer to a Base64 string
    const base64Image = fileBuffer.toString('base64');

    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${config.googleCloud.visionApiKey}`;
    
    const payload = {
        requests: [
            {
                image: {
                    content: base64Image
                },
                features: [
                    {
                        type: "DOCUMENT_TEXT_DETECTION"
                    }
                ]
            }
        ]
    };

    try {
        const response = await axios.post(visionUrl, payload);
        
        const annotations = response.data.responses[0]?.fullTextAnnotation;
        if (!annotations || !annotations.text) {
            return '';
        }
        
        return annotations.text;
    } catch (error) {
        console.error('Vision API Error:', error.response?.data || error.message);
        throw new Error('Failed to extract text from image');
    }
};

module.exports = {
    detectTextFromBuffer
};
