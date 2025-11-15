const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Design style templates for visual diversity
const DESIGN_STYLES = [
  {
    name: 'Modern Minimal',
    prompt: 'modern minimal white background, clean sans-serif typography, elegant spacing, subtle geometric accents'
  },
  {
    name: 'Bold Gradient',
    prompt: 'bold colorful gradient background (purple to pink to orange), white text, dynamic modern design, vibrant and eye-catching'
  },
  {
    name: 'Dark Mode Elegant',
    prompt: 'elegant dark mode with deep navy or black background, gold or teal accent colors, sophisticated typography, premium feel'
  },
  {
    name: 'Magazine Style',
    prompt: 'magazine-style layout, editorial design, bold serif fonts, professional photography aesthetic, high-end publication look'
  },
  {
    name: 'Tech Startup',
    prompt: 'tech/startup aesthetic, bright background with accent colors (blue, green), modern sans-serif, clean and professional'
  }
];

/**
 * Generate a single quote card using DALL-E 3
 * @param {string} quote - The quote text
 * @param {string} styleName - Name of the design style to use (e.g., 'Modern Minimal')
 * @param {number} cardNumber - Card number for logging purposes
 * @returns {Promise<string>} - URL of the generated image
 */
async function generateQuoteCard(quote, styleName, cardNumber = 1) {
  try {
    // Validate inputs
    if (!quote || typeof quote !== 'string') {
      throw new Error('Invalid quote provided');
    }

    // Get the design style by name
    const style = DESIGN_STYLES.find(s => s.name === styleName);
    if (!style) {
      throw new Error(`Invalid style name: ${styleName}`);
    }

    // Truncate quote if too long for DALL-E prompt
    const maxQuoteLength = 200;
    const truncatedQuote = quote.length > maxQuoteLength
      ? quote.substring(0, maxQuoteLength) + '...'
      : quote;

    // Build the DALL-E prompt
    const dallePrompt = `Create an Instagram quote card (square format, 1024x1024) with this exact text: "${truncatedQuote}"

Design requirements:
- Style: ${style.prompt}
- The quote text must be the primary focus and clearly readable
- Professional, Instagram-optimized design
- High contrast between text and background for maximum readability
- Balanced composition with proper negative space
- Modern, shareable aesthetic suitable for social media
- Text should be integrated beautifully into the design
- Do not add any other text, watermarks, or elements besides the quote

Create a visually stunning quote card that people will want to share.`;

    console.log(`Generating quote card ${cardNumber} with DALL-E 3 (${style.name})...`);

    // Call DALL-E 3 API
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: dallePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard', // Options: 'standard' or 'hd'
      style: 'vivid' // Options: 'vivid' or 'natural'
    });

    // Extract image URL
    const imageUrl = response.data[0].url;

    if (!imageUrl) {
      throw new Error('DALL-E 3 did not return an image URL');
    }

    console.log(`✓ Quote card ${cardNumber} generated successfully`);
    return imageUrl;

  } catch (error) {
    console.error(`Error generating quote card ${cardNumber}:`, error.message);

    if (error.message.includes('billing') || error.message.includes('quota')) {
      throw new Error('OpenAI API quota exceeded or billing issue');
    } else if (error.message.includes('content_policy')) {
      throw new Error('Quote content violates OpenAI content policy');
    } else if (error.message.includes('rate_limit')) {
      throw new Error('DALL-E API rate limit exceeded. Please wait a moment.');
    } else {
      throw new Error(`DALL-E generation failed: ${error.message}`);
    }
  }
}

/**
 * Generate all quote cards in parallel with consistent style
 * @param {Array<string>} quotes - Array of quotes (3-5 items)
 * @param {string} styleName - Name of the design style to use for all cards
 * @returns {Promise<Array<string>>} - Array of image URLs
 */
async function generateAllCards(quotes, styleName) {
  try {
    if (!Array.isArray(quotes) || quotes.length === 0) {
      throw new Error('No quotes provided');
    }

    if (quotes.length < 3 || quotes.length > 5) {
      throw new Error('Must provide 3-5 quotes');
    }

    if (!styleName) {
      throw new Error('Style name is required');
    }

    // Validate style exists
    const validStyles = DESIGN_STYLES.map(s => s.name);
    if (!validStyles.includes(styleName)) {
      throw new Error(`Invalid style: ${styleName}. Must be one of: ${validStyles.join(', ')}`);
    }

    console.log(`\nGenerating ${quotes.length} quote cards in parallel with "${styleName}" style...`);

    // Generate all cards in parallel using Promise.all with the same style
    const imagePromises = quotes.map((quote, index) =>
      generateQuoteCard(quote, styleName, index + 1)
        .catch(error => {
          console.error(`Failed to generate card ${index + 1}:`, error.message);
          return null; // Return null for failed cards instead of failing entire batch
        })
    );

    const imageUrls = await Promise.all(imagePromises);

    // Filter out any failed cards (null values)
    const successfulImages = imageUrls.filter(url => url !== null);

    if (successfulImages.length === 0) {
      throw new Error('All DALL-E image generations failed');
    }

    if (successfulImages.length < imageUrls.length) {
      console.warn(`⚠ Only ${successfulImages.length}/${imageUrls.length} cards generated successfully`);
    } else {
      console.log(`✓ All ${successfulImages.length} quote cards generated successfully`);
    }

    return successfulImages;

  } catch (error) {
    console.error('Error in generateAllCards:', error.message);
    throw error;
  }
}

/**
 * Get available design styles
 * @returns {Array<Object>} - Array of design style objects
 */
function getDesignStyles() {
  return DESIGN_STYLES.map((style, index) => ({
    index,
    name: style.name
  }));
}

module.exports = {
  generateQuoteCard,
  generateAllCards,
  getDesignStyles
};
