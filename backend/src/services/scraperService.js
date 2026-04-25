const axios = require('axios');

/**
 * Scrapes a URL and extracts raw text content by removing HTML tags, scripts, and styles.
 * @param {string} url - The URL to scrape
 * @returns {Promise<string>} - The extracted raw text
 */
const scrapeUrl = async (url) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10 second timeout
        });

        const html = response.data;
        if (typeof html !== 'string') {
            throw new Error('Response is not HTML/text');
        }

        // Extremely simple HTML stripper to save tokens for the LLM
        let text = html;
        
        // Remove script tags and their content
        text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
        // Remove style tags and their content
        text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
        // Remove all HTML tags
        text = text.replace(/<[^>]+>/g, ' ');
        // Replace multiple spaces and newlines with a single space/newline
        text = text.replace(/\s+/g, ' ').trim();

        // Limit the text to avoid overloading the LLM token limit (approx 20,000 characters is plenty for a recipe)
        return text.substring(0, 20000);
    } catch (error) {
        console.error('Scraping Error:', error.message);
        throw new Error('Failed to extract content from the provided URL');
    }
};

module.exports = {
    scrapeUrl
};
