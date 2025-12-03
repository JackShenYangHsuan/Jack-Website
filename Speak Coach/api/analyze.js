/**
 * SpeakCoach - Analysis API
 * Serverless function for GPT-powered speech feedback
 */

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { transcript, topic } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'No transcript provided' });
        }

        if (!topic) {
            return res.status(400).json({ error: 'No topic provided' });
        }

        // Check for API key
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('OPENAI_API_KEY not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Build the analysis prompt
        const systemPrompt = `You are a speech coach analyzing a short (30-60 second) spoken response.
Your job is to provide constructive, actionable feedback to help the speaker improve clarity, structure, and delivery.

Analyze the transcript and respond with ONLY valid JSON matching this exact structure:
{
  "main_point": "One sentence summary of what the speaker argued or explained",
  "structure": {
    "has_clear_claim": true or false,
    "has_supporting_reason": true or false,
    "has_example": true or false,
    "pattern_detected": "claim-reason-example" or "setup-action-result" or "problem-solution" or "unclear"
  },
  "fillers": {
    "count": number,
    "words": ["um", "like", etc - unique filler words found]
  },
  "long_sentences": {
    "count": number,
    "examples": ["First long sentence text...", "Second long sentence..."] (max 3, sentences over 20 words)
  },
  "suggested_rewrite": "A concise 20-second version (roughly 50-60 words) that improves on their response"
}

Be encouraging but honest. Focus on specific improvements.`;

        const userPrompt = `TOPIC the speaker was responding to:
"""
${topic}
"""

TRANSCRIPT of their speech:
"""
${transcript}
"""

Analyze this speech and return the JSON feedback.`;

        // Call OpenAI GPT API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GPT API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Analysis failed',
                details: errorText
            });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({ error: 'No response from AI' });
        }

        // Parse the JSON response
        let feedback;
        try {
            feedback = JSON.parse(content);
        } catch (parseError) {
            console.error('Failed to parse GPT response:', content);
            return res.status(500).json({
                error: 'Failed to parse AI response',
                raw: content
            });
        }

        // Validate required fields
        const requiredFields = ['main_point', 'structure', 'fillers', 'long_sentences', 'suggested_rewrite'];
        for (const field of requiredFields) {
            if (!feedback.hasOwnProperty(field)) {
                console.error(`Missing field in response: ${field}`);
                // Add default value for missing field
                feedback[field] = getDefaultValue(field);
            }
        }

        return res.status(200).json({
            feedback,
            success: true
        });

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({
            error: 'Analysis failed',
            details: error.message
        });
    }
}

/**
 * Get default value for missing feedback field
 */
function getDefaultValue(field) {
    const defaults = {
        main_point: 'Unable to determine main point',
        structure: {
            has_clear_claim: false,
            has_supporting_reason: false,
            has_example: false,
            pattern_detected: 'unclear'
        },
        fillers: { count: 0, words: [] },
        long_sentences: { count: 0, examples: [] },
        suggested_rewrite: 'Unable to generate suggestion'
    };
    return defaults[field] || null;
}
