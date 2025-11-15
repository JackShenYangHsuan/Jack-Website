const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract impactful quotes from video transcript using GPT-4
 * @param {string} transcript - Full video transcript
 * @returns {Promise<Array<string>>} - Array of 10 quotes
 */
async function extractQuotes(transcript) {
  try {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is empty');
    }

    // Truncate transcript if too long (GPT-4 context limit)
    const maxLength = 12000; // Conservative limit for GPT-4
    const processedTranscript = transcript.length > maxLength
      ? transcript.substring(0, maxLength) + '...'
      : transcript;

    console.log('Sending transcript to GPT-4 for quote extraction...');

    // Create the prompt for GPT-4
    const systemPrompt = `You are an expert content curator specializing in extracting impactful, shareable quotes from video transcripts. Your task is to identify exactly 10 quotes that are:

1. Self-contained and understandable without additional context
2. Impactful, memorable, or thought-provoking
3. Suitable length for a social media quote card (15-100 words)
4. Diverse in topic/theme across the selections
5. Free from filler words and clean for presentation
6. Ranked by impact/shareability (most impactful first)

Return ONLY a JSON object with this exact structure:
{
  "quotes": ["quote 1", "quote 2", "quote 3", "quote 4", "quote 5", "quote 6", "quote 7", "quote 8", "quote 9", "quote 10"]
}

Do not include any other text or explanation.`;

    const userPrompt = `Extract exactly 10 impactful quotes from this video transcript:\n\n${processedTranscript}`;

    // Call OpenAI Chat API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Parse the response
    const content = response.choices[0].message.content;

    // Extract JSON from the response (it might have extra text)
    let parsed;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse JSON:', content);
      throw new Error('Invalid JSON response from GPT-4');
    }

    if (!parsed.quotes || !Array.isArray(parsed.quotes)) {
      throw new Error('Invalid response format from GPT-4');
    }

    // Validate quotes array
    const quotes = parsed.quotes.filter(q =>
      q && typeof q === 'string' && q.trim().length > 0
    );

    if (quotes.length < 10) {
      throw new Error(`GPT-4 returned fewer than 10 quotes (got ${quotes.length})`);
    }

    // Return exactly 10 quotes
    const finalQuotes = quotes.slice(0, 10);

    console.log(`✓ Extracted ${finalQuotes.length} quotes from transcript`);
    finalQuotes.forEach((quote, index) => {
      console.log(`  ${index + 1}. "${quote.substring(0, 50)}..."`);
    });

    return finalQuotes;

  } catch (error) {
    console.error('Error extracting quotes with GPT-4:', error.message);

    if (error.message.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing');
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`Failed to extract quotes: ${error.message}`);
    }
  }
}

/**
 * Test OpenAI API connection
 * @returns {Promise<boolean>} - True if connection successful
 */
async function testConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });

    return response && response.choices && response.choices.length > 0;
  } catch (error) {
    console.error('OpenAI connection test failed:', error.message);
    return false;
  }
}

module.exports = {
  extractQuotes,
  testConnection
};
