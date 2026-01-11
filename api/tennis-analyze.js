/**
 * Vercel API Route - Analyze tennis video frames using OpenRouter GPT-4o
 */

const OPENROUTER_API_KEY = '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';
const MODEL = 'openai/gpt-4o';

const ANALYSIS_PROMPT = `Analyze this tennis video frame and respond with ONLY a JSON object (no markdown, no explanation):

{
  "isActivePlay": boolean,
  "actionIntensity": number,
  "description": string
}

Where:
- isActivePlay: true if a rally/point is actively in progress (players hitting back and forth), false if between points, serving, or idle
- actionIntensity: 1-10 scale where:
  - 1-3: Idle, walking, between points
  - 4-6: Light activity, serving, setting up
  - 7-8: Active rally with good movement
  - 9-10: Intense rally, diving shots, fast exchanges
- description: Brief 5-10 word description of what's happening

Focus on detecting active rallies vs time between points. Look for player movement, ball in motion, and game intensity.`;

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
                'HTTP-Referer': 'https://jackshen.xyz',
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
            // Default values if parsing fails
            analysis = {
                isActivePlay: false,
                actionIntensity: 1,
                description: 'Unable to analyze frame'
            };
        }

        return {
            index: frame.index,
            timestamp: frame.timestamp,
            isActivePlay: analysis.isActivePlay || false,
            actionIntensity: Math.min(10, Math.max(1, analysis.actionIntensity || 1)),
            description: analysis.description || ''
        };

    } catch (error) {
        console.error(`Frame ${frame.index} analysis failed:`, error);
        return {
            index: frame.index,
            timestamp: frame.timestamp,
            isActivePlay: false,
            actionIntensity: 1,
            description: 'Analysis error',
            error: error.message
        };
    }
}
