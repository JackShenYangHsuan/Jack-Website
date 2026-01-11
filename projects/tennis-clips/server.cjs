/**
 * Local development server - serves static files + API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3008;
require('dotenv').config();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'openai/gpt-4o';

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const ANALYSIS_PROMPT = `Analyze this tennis video frame to detect ACTIVE RALLY play.

IGNORE balls lying on the ground (practice balls). Focus ONLY on whether an active point/rally is happening.

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

CRITICAL DISTINCTION:
- Players standing/walking with balls scattered = NOT active rally (practice setup)
- Player in athletic stance, racket back, eyes tracking = ACTIVE rally
- Look at BODY LANGUAGE not just ball visibility`;

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
                            { type: 'text', text: ANALYSIS_PROMPT },
                            { type: 'image_url', image_url: { url: frame.imageData } }
                        ]
                    }
                ],
                max_tokens: 150,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenRouter error:', errorData);
            throw new Error(errorData.error?.message || 'OpenRouter API error');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        console.log(`Frame ${frame.index} response:`, content);

        // Parse JSON response
        let analysis;
        try {
            const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
            analysis = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('Failed to parse:', content);
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
            ballInAir: analysis.activeRally,
            playerHitting: analysis.playerEngaged,
            isActivePlay: analysis.activeRally || (analysis.playerEngaged && confidence >= 0.6),
            actionIntensity: analysis.activeRally ? 9 : (analysis.playerEngaged ? 7 : 2),
            description: analysis.description || ''
        };

    } catch (error) {
        console.error(`Frame ${frame.index} failed:`, error.message);
        return {
            index: frame.index,
            timestamp: frame.timestamp,
            isActivePlay: false,
            actionIntensity: 1,
            description: 'Error',
            error: error.message
        };
    }
}

async function handleAnalyzeRequest(req, res) {
    let body = '';

    req.on('data', chunk => { body += chunk; });

    req.on('end', async () => {
        try {
            const { frames } = JSON.parse(body);

            if (!frames || !Array.isArray(frames)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request: frames array required' }));
                return;
            }

            console.log(`Analyzing ${frames.length} frames...`);

            // Process frames sequentially to avoid rate limits
            const results = [];
            for (const frame of frames) {
                const result = await analyzeFrame(frame);
                results.push(result);
                console.log(`Frame ${frame.index}: rally=${result.activeRally}, engaged=${result.playerEngaged}, conf=${result.confidence} - ${result.description}`);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));

        } catch (error) {
            console.error('Request error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    });
}

function serveStaticFile(req, res) {
    let urlPath = req.url === '/' ? '/index.html' : req.url;
    // Strip /tennis-clips/ prefix for local development
    urlPath = urlPath.replace(/^\/tennis-clips\//, '/');
    const filePath = path.join(__dirname, urlPath);

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Required for SharedArrayBuffer (FFmpeg.wasm) - enables cross-origin isolation
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API route
    if (req.url === '/api/tennis-analyze' && req.method === 'POST') {
        handleAnalyzeRequest(req, res);
        return;
    }

    // Static files
    serveStaticFile(req, res);
});

server.listen(PORT, () => {
    console.log(`\n🎾 Tennis Video Highlight Server`);
    console.log(`   Running at http://localhost:${PORT}\n`);
});
