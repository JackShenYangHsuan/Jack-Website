require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;
const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_API_BASE = 'https://tavusapi.com/v2';

// Data file for storing persona ID
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Read data file
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { personaId: null, conversations: [] };
    }
}

// Helper: Write data file
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Helper: Make Tavus API request
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

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        tavusConfigured: !!TAVUS_API_KEY
    });
});

// Check if persona exists
app.get('/api/persona', (req, res) => {
    const data = readData();
    res.json({
        hasPersona: !!data.personaId,
        personaId: data.personaId
    });
});

// List available replicas
app.get('/api/replicas', async (req, res) => {
    try {
        const response = await tavusRequest('/replicas', 'GET');
        res.json(response);
    } catch (error) {
        console.error('Error fetching replicas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create persona
app.post('/api/create-persona', async (req, res) => {
    try {
        // Use Jack Shen's replica
        const replicaId = 'r52ee62ac932'; // Jack Shen November 17 2025
        console.log('Using replica:', replicaId);

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

        const data = readData();
        data.personaId = response.persona_id;
        writeData(data);

        console.log('Created persona:', response.persona_id);
        res.json({ success: true, personaId: response.persona_id });
    } catch (error) {
        console.error('Error creating persona:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create conversation
app.post('/api/create-conversation', async (req, res) => {
    try {
        const data = readData();
        const { name, user_email } = req.body;

        if (!data.personaId) {
            return res.status(400).json({ error: 'No persona exists. Create one first.' });
        }

        const response = await tavusRequest('/conversations', 'POST', {
            persona_id: data.personaId,
            conversation_name: name || `Intake - ${new Date().toISOString()}`,
            properties: {
                max_call_duration: 300, // 5 minutes max
                participant_left_timeout: 30,
                enable_recording: false,
                apply_greenscreen: false
            },
            custom_greeting: `Hi! I'm Jack. Thanks for taking the time to chat with me today. I'm here to learn about your work and see if there are any tasks I can help automate for you. What's your role?`
        });

        // Store conversation in data
        data.conversations.push({
            id: response.conversation_id,
            userEmail: user_email,
            createdAt: new Date().toISOString()
        });
        writeData(data);

        console.log('Created conversation:', response.conversation_id);
        res.json({
            conversation_id: response.conversation_id,
            conversation_url: response.conversation_url
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: error.message });
    }
});

// End conversation helper function
async function endConversationById(conversationId) {
    await tavusRequest(`/conversations/${conversationId}`, 'DELETE');

    // Remove from stored data
    const data = readData();
    data.conversations = data.conversations.filter(c => c.id !== conversationId);
    writeData(data);

    console.log('Ended conversation:', conversationId);
}

// End conversation (DELETE method)
app.delete('/api/end-conversation/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        await endConversationById(conversationId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error ending conversation:', error);
        res.status(500).json({ error: error.message });
    }
});

// End conversation (POST method - for sendBeacon compatibility)
app.post('/api/end-conversation/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        await endConversationById(conversationId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error ending conversation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all conversations
app.get('/api/conversations', (req, res) => {
    const data = readData();
    res.json({ conversations: data.conversations });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║        Replica Intake Backend Server                       ║
╠════════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: ${PORT}                                              ║
║  Tavus API: ${TAVUS_API_KEY ? 'Configured' : 'NOT CONFIGURED'}                                ║
╚════════════════════════════════════════════════════════════╝
    `);
});
