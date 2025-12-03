/**
 * SpeakCoach - Local Development Server
 * Serves static files and handles API endpoints
 */

require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware - CORS with explicit options
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// ==========================================================================
// API: Transcribe
// ==========================================================================
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    console.log('📝 Transcription request received');

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('❌ OPENAI_API_KEY not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Get the uploaded file path
        const audioPath = req.file.path;

        // Rename to have proper extension (Whisper needs this)
        const newPath = audioPath + '.webm';
        fs.renameSync(audioPath, newPath);

        // Prepare form data for Whisper API using file stream
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(newPath), {
            filename: 'recording.webm',
            contentType: 'audio/webm',
        });
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        console.log('🔄 Sending to Whisper API...');

        // Call OpenAI Whisper API
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...formData.getHeaders(),
            },
            body: formData,
        });

        // Clean up temp file
        fs.unlinkSync(newPath);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Whisper API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Transcription failed',
                details: errorText
            });
        }

        const data = await response.json();
        console.log('✅ Transcription complete:', data.text.substring(0, 50) + '...');

        return res.json({
            transcript: data.text,
            success: true
        });

    } catch (error) {
        console.error('❌ Transcription error:', error);
        // Clean up temp files on error (both original and renamed)
        if (req.file && req.file.path) {
            const originalPath = req.file.path;
            const renamedPath = originalPath + '.webm';
            if (fs.existsSync(renamedPath)) {
                fs.unlinkSync(renamedPath);
            } else if (fs.existsSync(originalPath)) {
                fs.unlinkSync(originalPath);
            }
        }
        return res.status(500).json({
            error: 'Transcription failed',
            details: error.message
        });
    }
});

// ==========================================================================
// API: Analyze
// ==========================================================================
app.post('/api/analyze', async (req, res) => {
    console.log('🔍 Analysis request received');

    try {
        const { transcript, topic } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'No transcript provided' });
        }

        if (!topic) {
            return res.status(400).json({ error: 'No topic provided' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('❌ OPENAI_API_KEY not configured');
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

        console.log('🔄 Sending to GPT API...');

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
            console.error('❌ GPT API error:', response.status, errorText);
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
            console.error('❌ Failed to parse GPT response:', content);
            return res.status(500).json({
                error: 'Failed to parse AI response',
                raw: content
            });
        }

        console.log('✅ Analysis complete');

        return res.json({
            feedback,
            success: true
        });

    } catch (error) {
        console.error('❌ Analysis error:', error);
        return res.status(500).json({
            error: 'Analysis failed',
            details: error.message
        });
    }
});

// ==========================================================================
// Start Server
// ==========================================================================
app.listen(PORT, () => {
    console.log('');
    console.log('🎤 SpeakCoach Development Server');
    console.log('================================');
    console.log(`📍 http://localhost:${PORT}`);
    console.log('');
    console.log('API Key:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
    console.log('');
});
