/**
 * SpeakCoach - Transcription API
 * Serverless function for Whisper speech-to-text
 */

const formidable = require('formidable');
const fs = require('fs');
const FormData = require('form-data');

// Disable body parsing, we'll use formidable
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse multipart form data
        const form = formidable({
            maxFileSize: 10 * 1024 * 1024, // 10MB max
        });

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve([fields, files]);
            });
        });

        // Get the audio file
        const audioFile = files.audio?.[0] || files.audio;
        if (!audioFile) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        // Check for API key
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('OPENAI_API_KEY not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Prepare form data for Whisper API
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioFile.filepath), {
            filename: audioFile.originalFilename || 'recording.webm',
            contentType: audioFile.mimetype || 'audio/webm',
        });
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
        formData.append('response_format', 'json');

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
        try {
            fs.unlinkSync(audioFile.filepath);
        } catch (e) {
            // Ignore cleanup errors
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Whisper API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Transcription failed',
                details: errorText
            });
        }

        const data = await response.json();

        return res.status(200).json({
            transcript: data.text,
            success: true
        });

    } catch (error) {
        console.error('Transcription error:', error);
        return res.status(500).json({
            error: 'Transcription failed',
            details: error.message
        });
    }
}
