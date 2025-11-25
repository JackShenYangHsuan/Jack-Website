// Vercel Serverless Function for Persona management
const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_API_BASE = 'https://tavusapi.com/v2';

// In-memory storage (will reset on cold start - consider using a database for persistence)
let personaId = null;

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // Check if persona exists
        return res.json({
            hasPersona: !!personaId,
            personaId: personaId
        });
    }

    if (req.method === 'POST') {
        // Create persona
        try {
            const replicaId = 'r52ee62ac932'; // Jack Shen November 17 2025

            const response = await tavusRequest('/personas', 'POST', {
                persona_name: 'Jack - Automation Intake',
                system_prompt: `You are Jack, a friendly automation consultant. Your goal is to understand what repetitive tasks take up most of the user's time so you can help automate them.

Start by introducing yourself warmly and asking what their role is. Then ask them to describe the 3 things that take up most of their time at work.

For each task they mention:
1. Ask clarifying questions to understand the workflow
2. Identify which parts are repetitive or rule-based
3. Estimate how much time they spend on it weekly

Be conversational, empathetic, and encouraging. Take notes mentally of automation opportunities.

At the end, summarize what you learned and let them know you'll follow up via email with specific automation recommendations.

Keep responses concise (2-3 sentences max) to maintain natural conversation flow.`,
                context: 'Automation intake call to understand user workflows and identify automation opportunities.',
                default_replica_id: replicaId
            });

            personaId = response.persona_id;
            console.log('Created persona:', personaId);

            return res.json({ success: true, personaId: personaId });
        } catch (error) {
            console.error('Error creating persona:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
