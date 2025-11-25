// Vercel Serverless Function for Conversation management
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

async function getOrCreatePersona() {
    // Check for existing personas
    const personas = await tavusRequest('/personas', 'GET');

    // Look for our automation intake persona
    if (personas.data && personas.data.length > 0) {
        const existingPersona = personas.data.find(p =>
            p.persona_name && p.persona_name.includes('Jack')
        );
        if (existingPersona) {
            return existingPersona.persona_id;
        }
    }

    // Create new persona if none exists
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

    return response.persona_id;
}

export default async function handler(req, res) {
    // Enable CORS
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
        const { name, user_email } = req.body;

        // Get or create persona
        const personaId = await getOrCreatePersona();
        console.log('Using persona:', personaId);

        // Create conversation
        const response = await tavusRequest('/conversations', 'POST', {
            persona_id: personaId,
            conversation_name: name || `Intake - ${new Date().toISOString()}`,
            properties: {
                max_call_duration: 300, // 5 minutes max
                participant_left_timeout: 30,
                enable_recording: true,  // Record both user and bot audio
                apply_greenscreen: false
            },
            custom_greeting: `Hi! I'm Jack. Thanks for taking the time to chat with me today. I'm here to learn about your work and see if there are any tasks I can help automate for you. What's your role?`
        });

        console.log('Created conversation:', response.conversation_id);

        return res.json({
            conversation_id: response.conversation_id,
            conversation_url: response.conversation_url
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        return res.status(500).json({ error: error.message });
    }
}
