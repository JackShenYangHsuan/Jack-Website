// Vercel Serverless Function for ending conversations
const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_API_BASE = 'https://tavusapi.com/v2';

async function tavusRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'x-api-key': TAVUS_API_KEY,
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${TAVUS_API_BASE}${endpoint}`, options);

    // For GET requests that return 404, return null instead of throwing
    if (method === 'GET' && response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Tavus API error: ${response.status} - ${errorText}`);
        throw new Error(`Tavus API error: ${response.status}`);
    }

    return response.json();
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Accept both DELETE and POST (POST for sendBeacon compatibility)
    if (req.method !== 'DELETE' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id: conversationId } = req.query;

        if (!conversationId) {
            return res.status(400).json({ error: 'Conversation ID required' });
        }

        // First, try to get conversation details including recording URL
        let conversationDetails = null;
        let recordingUrl = null;

        try {
            conversationDetails = await tavusRequest(`/conversations/${conversationId}`, 'GET');
            console.log('Conversation details:', JSON.stringify(conversationDetails, null, 2));

            // Extract recording URL from conversation details
            recordingUrl = conversationDetails?.recording_url
                || conversationDetails?.video_url
                || conversationDetails?.recording?.url
                || null;
        } catch (e) {
            console.warn('Could not fetch conversation details:', e.message);
        }

        // End the conversation
        try {
            await tavusRequest(`/conversations/${conversationId}`, 'DELETE');
            console.log('Ended conversation:', conversationId);
        } catch (e) {
            // Conversation might already be ended
            console.warn('Could not end conversation (may already be ended):', e.message);
        }

        // Return success with recording URL if available
        return res.json({
            success: true,
            recordingUrl: recordingUrl,
            conversationDetails: conversationDetails
        });
    } catch (error) {
        console.error('Error ending conversation:', error);
        return res.status(500).json({ error: error.message });
    }
}
