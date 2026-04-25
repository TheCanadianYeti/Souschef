const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');

/**
 * Scrapes a URL and extracts raw text content.
 * For YouTube URLs, it attempts to fetch the transcript.
 * 
 * @param {string} url - The URL to scrape
 * @returns {Promise<string>} - The extracted raw text
 */
const scrapeUrl = async (url) => {
    // Check if it's a YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
            console.log('[Scraper] Detected YouTube URL, fetching transcript...');
            const transcript = await YoutubeTranscript.fetchTranscript(url);
            const text = transcript.map(t => t.text).join(' ');
            console.log(`[Scraper] Successfully fetched YouTube transcript (${text.length} chars).`);
            return text;
        } catch (ytError) {
            console.warn('[Scraper] YouTube transcript fetch failed, falling back to HTML scraping:', ytError.message);
            // Fall back to standard scraping if transcript fails
        }
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000 
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

        // Limit the text to avoid overloading the LLM token limit
        return text.substring(0, 20000);
    } catch (error) {
        console.error('Scraping Error:', error.message);
        throw new Error('Failed to extract content from the provided URL');
    }
};

module.exports = {
    scrapeUrl
};
