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

        await tavusRequest(`/conversations/${conversationId}`, 'DELETE');
        console.log('Ended conversation:', conversationId);

        return res.json({ success: true });
    } catch (error) {
        console.error('Error ending conversation:', error);
        return res.status(500).json({ error: error.message });
    }
}
