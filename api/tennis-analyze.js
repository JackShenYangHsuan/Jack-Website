/**
 * Vercel API Route - Analyze tennis video frames using OpenRouter GPT-4o
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'openai/gpt-4o';

const ANALYSIS_PROMPT = `Analyze this tennis video frame to detect ACTIVE RALLY play.
IGNORE balls lying on the ground (practice balls).
Focus on: player stance, body position, whether they're actively hitting.

Respond with ONLY JSON (no markdown):

{
  "activeRally": boolean,
  "playerEngaged": boolean,
  "confidence": number,
  "description": string
}

Where:
- activeRally: TRUE if players are actively hitting/rallying (ball being exchanged). Look for: player in hitting stance, racket making contact, dynamic body position, focused attention on incoming ball
- playerEngaged: TRUE if player is in ready position, moving to ball, or mid-swing (not standing idle or walking)
- confidence: 0.0-1.0 how confident you are this is active play
- description: Brief description (5-10 words)

Look at body language, not ball position. Players in motion = engaged.`;

export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { frames } = req.body;

        if (!frames || !Array.isArray(frames)) {
            return res.status(400).json({ error: 'Invalid request: frames array required' });
        }

        // Analyze each frame
        const results = await Promise.all(
            frames.map(frame => analyzeFrame(frame))
        );

        return res.status(200).json(results);

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({
            error: 'Analysis failed',
            message: error.message
        });
    }
}

async function analyzeFrame(frame) {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://jackshen.co',
                'X-Title': 'Tennis Video Highlight'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: ANALYSIS_PROMPT
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: frame.imageData
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 150,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'OpenRouter API error');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        // Parse JSON response
        let analysis;
        try {
            // Remove markdown code blocks if present
            const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
            analysis = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('Failed to parse AI response:', content);
            analysis = { activeRally: false, playerEngaged: false, confidence: 0, description: 'Parse error' };
        }

        const confidence = Math.min(1, Math.max(0, analysis.confidence || 0));

        return {
            index: frame.index,
            timestamp: frame.timestamp,
            activeRally: analysis.activeRally || false,
            playerEngaged: analysis.playerEngaged || false,
            confidence: confidence,
            // Map to old fields for compatibility
            isActivePlay: analysis.activeRally || (analysis.playerEngaged && confidence >= 0.6),
            actionIntensity: analysis.activeRally ? 9 : (analysis.playerEngaged ? 7 : 2),
            description: analysis.description || ''
        };

    } catch (error) {
        console.error(`Frame ${frame.index} analysis failed:`, error);
        return {
            index: frame.index,
            timestamp: frame.timestamp,
            activeRally: false,
            playerEngaged: false,
            confidence: 0,
            isActivePlay: false,
            actionIntensity: 1,
            description: 'Analysis error',
            error: error.message
        };
    }
}
