// State management
let fineTunedModel = null;
let trainingScripts = [];

// Backend configuration
// Prefer backend wrapper endpoints; fall back to direct Tinker only if provided
const BACKEND_BASE = window.BACKEND_BASE || localStorage.getItem('backendBase') || 'http://localhost:8000/api';
const TINKER_TUNE_ENDPOINT = window.TINKER_TUNE_ENDPOINT || `${BACKEND_BASE}/tune`;
const TINKER_CHAT_ENDPOINT = window.TINKER_CHAT_ENDPOINT || `${BACKEND_BASE}/chat`;
const TINKER_API_ENDPOINT = '';
const TINKER_API_KEY = '';

// DOM Elements
const fineTuneSection = document.getElementById('fine-tune-section');
const chatSection = document.getElementById('chat-section');
const settingsSection = document.getElementById('settings-section');
const fineTuneBtn = document.getElementById('fine-tune-btn');
const backBtn = document.getElementById('back-btn');
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const statusMessage = document.getElementById('status-message');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings (localStorage or URL params)
    loadTinkerConfigFromStorage();

    // Event Listeners
    fineTuneBtn.addEventListener('click', handleFineTune);
    backBtn.addEventListener('click', () => switchSection('fine-tune'));
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    const saveBtn = document.getElementById('save-settings-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveTinkerSettings);
    }

    const settingsBtn = document.getElementById('settings-btn');
    const settingsFromChatBtn = document.getElementById('settings-from-chat-btn');
    const backToTuneBtn = document.getElementById('back-to-tune-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => switchSection('settings'));
    if (settingsFromChatBtn) settingsFromChatBtn.addEventListener('click', () => switchSection('settings'));
    if (backToTuneBtn) backToTuneBtn.addEventListener('click', () => switchSection('fine-tune'));
});

// Persist/load Tinker config
function loadTinkerConfigFromStorage() {
    const backend = localStorage.getItem('backendBase');
    const tune = localStorage.getItem('tinkerTune');
    const chat = localStorage.getItem('tinkerChat');
    const key = localStorage.getItem('tinkerKey');
    if (backend) window.BACKEND_BASE = backend;
    if (tune) window.TINKER_TUNE_ENDPOINT = tune;
    if (chat) window.TINKER_CHAT_ENDPOINT = chat;
    if (key) window.TINKER_API_KEY = key;

    const backendEl = document.getElementById('backend-base');
    const tuneEl = document.getElementById('tinker-tune');
    const chatEl = document.getElementById('tinker-chat');
    const keyEl = document.getElementById('tinker-key');
    if (backendEl && backend) backendEl.value = backend;
    if (tuneEl && tune) tuneEl.value = tune;
    if (chatEl && chat) chatEl.value = chat;
    if (keyEl && key) keyEl.value = key;
}

function saveTinkerSettings() {
    const backend = document.getElementById('backend-base')?.value?.trim();
    const tune = document.getElementById('tinker-tune')?.value?.trim();
    const chat = document.getElementById('tinker-chat')?.value?.trim();
    const key = document.getElementById('tinker-key')?.value?.trim();
    if (backend) localStorage.setItem('backendBase', backend);
    if (tune) localStorage.setItem('tinkerTune', tune);
    if (chat) localStorage.setItem('tinkerChat', chat);
    if (key) localStorage.setItem('tinkerKey', key);
    if (backend) window.BACKEND_BASE = backend;
    if (tune) window.TINKER_TUNE_ENDPOINT = tune;
    if (chat) window.TINKER_CHAT_ENDPOINT = chat;
    if (key) window.TINKER_API_KEY = key;
    showStatus('success', 'Settings saved.');
}

// Switch between sections
function switchSection(section) {
    [fineTuneSection, chatSection, settingsSection].forEach(s => s && s.classList.remove('active'));
    if (section === 'fine-tune') {
        fineTuneSection && fineTuneSection.classList.add('active');
    } else if (section === 'chat') {
        chatSection && chatSection.classList.add('active');
    } else if (section === 'settings') {
        settingsSection && settingsSection.classList.add('active');
    }
}

// Handle fine-tuning
async function handleFineTune() {
    // Read JSON from single textarea
    const raw = document.getElementById('training-jsonl').value.trim();
    if (!raw) {
        showStatus('error', 'Please paste your training data in JSONL.');
        return;
    }

    let items;
    try {
        items = parseJSONL(raw);
    } catch (e) {
        showStatus('error', e.message || 'Invalid JSONL. Please check your lines.');
        return;
    }

    // Normalize into an array of strings for the demo model
    trainingScripts = normalizeTrainingData(items);
    if (!Array.isArray(trainingScripts) || trainingScripts.length === 0) {
        showStatus('error', 'Parsed training data is empty.');
        return;
    }

    // Show loading status
    showStatus('loading', 'Fine-tuning model... This may take a moment.');
    fineTuneBtn.disabled = true;

    try {
        const endpoint = window.TINKER_TUNE_ENDPOINT || window.TINKER_API_ENDPOINT || TINKER_TUNE_ENDPOINT || TINKER_API_ENDPOINT;
        if (endpoint) {
            const apiRes = await feedTrainingDataToTinker({ rawJsonl: raw, items, normalized: trainingScripts });
            // Store details from API
            fineTunedModel = {
                trainingScripts,
                timestamp: new Date().toISOString(),
                ready: true,
                id: apiRes?.run_id || apiRes?.model_id || apiRes?.id || null,
                apiResponse: apiRes
            };
        } else {
            // Fallback to local simulation if endpoint not configured
            await simulateFineTuning(trainingScripts);
        }
        
        // Show success message
        showStatus('success', 'Model fine-tuned successfully! You can now chat with your customized model.');
        
        // Switch to chat section after a delay
        setTimeout(() => {
            switchSection('chat');
            // Reset chat if needed
            resetChat();
        }, 2000);
        
    } catch (error) {
        showStatus('error', 'Fine-tuning failed. Please try again.');
        console.error('Fine-tuning error:', error);
    } finally {
        fineTuneBtn.disabled = false;
    }
}

// Parse JSONL string into array of JS values
function parseJSONL(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const out = [];
    const errors = [];
    for (let i = 0; i < lines.length; i++) {
        try {
            out.push(JSON.parse(lines[i]));
        } catch (e) {
            errors.push(`Line ${i + 1}: ${e.message}`);
        }
    }
    if (errors.length) {
        const preview = errors.slice(0, 3).join(' | ');
        throw new Error(`Invalid JSONL. ${preview}`);
    }
    return out;
}

// Convert parsed JSONL array into an array of strings (for demo purposes)
function normalizeTrainingData(data) {
    if (Array.isArray(data)) {
        // If array of strings, return as-is; else stringify each item
        if (data.every(item => typeof item === 'string')) return data;
        return data.map(item => typeof item === 'string' ? item : JSON.stringify(item));
    }
    // If object with common keys
    if (data && typeof data === 'object') {
        if (Array.isArray(data.scripts)) return normalizeTrainingData(data.scripts);
        if (Array.isArray(data.training_data)) return normalizeTrainingData(data.training_data);
        // Fallback: single stringified object
        return [JSON.stringify(data)];
    }
    return [];
}

// Build Authorization headers for Tinker
function tinkerHeaders() {
    const apiKey = window.TINKER_API_KEY || TINKER_API_KEY || null;
    return {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    };
}

// Send training data to Tinker API
async function feedTrainingDataToTinker({ rawJsonl, items, normalized }) {
    const endpoint = window.TINKER_TUNE_ENDPOINT || TINKER_TUNE_ENDPOINT;

    const payload = {
        jsonl: rawJsonl,
    };

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Tinker API ${res.status}: ${errText}`);
    }

    if (contentType.includes('application/json')) {
        const data = await res.json();
        return data;
    }
    return { ok: true, raw: await res.text() };
}

// Simulate fine-tuning process
function simulateFineTuning(scripts) {
    return new Promise((resolve) => {
        // Store the training data
        fineTunedModel = {
            trainingScripts: scripts,
            timestamp: new Date().toISOString(),
            ready: true
        };
        
        // Simulate processing time
        setTimeout(resolve, 2000);
    });
}

// Show status message
function showStatus(type, message) {
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
}

// Send message in chat
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    if (!fineTunedModel || !fineTunedModel.ready) {
        alert('Please fine-tune the model first!');
        return;
    }
    
    // Add user message to chat
    addMessage('user', message);
    
    // Clear input
    userInput.value = '';
    
    // Disable send button temporarily
    sendBtn.disabled = true;
    
    // Get AI response
    try {
        const response = await getAIResponse(message);
        addMessage('bot', response);
    } catch (error) {
        addMessage('bot', 'Sorry, I encountered an error. Please try again.');
        console.error('Chat error:', error);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Add message to chat
function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Get AI response (uses Tinker if configured)
async function getAIResponse(userMessage) {
    const chatEndpoint = window.TINKER_CHAT_ENDPOINT || TINKER_CHAT_ENDPOINT || '';
    if (chatEndpoint) {
        const resp = await chatWithTinker({ message: userMessage, runId: fineTunedModel?.id });
        return resp;
    }

    // Fallback demo behavior
    await new Promise(resolve => setTimeout(resolve, 800));
    const responses = [
        `Based on the fine-tuning data, I understand your request about "${userMessage}". Let me help you with that.`,
        `Interesting question! According to the training scripts provided, here's what I can tell you...`,
        `I've been trained on your specific data, so I can provide a customized response to "${userMessage}".`,
        `Great question! My fine-tuned knowledge allows me to address this specifically for your use case.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Call Tinker chat/inference API
async function chatWithTinker({ message, runId }) {
    const endpoint = window.TINKER_CHAT_ENDPOINT || TINKER_CHAT_ENDPOINT;
    if (!endpoint) throw new Error('TINKER_CHAT_ENDPOINT not configured');

    if (!runId) {
        throw new Error('Model is not ready yet. Please wait for fine-tuning to complete.');
    }

    const payload = { message, run_id: runId };

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Tinker Chat ${res.status}: ${errText}`);
    }

    if (contentType.includes('application/json')) {
        const data = await res.json();
        return data.response || data.answer || data.output || JSON.stringify(data);
    }
    return await res.text();
}

// Reset chat
function resetChat() {
    // Keep only the initial bot message
    chatMessages.innerHTML = `
        <div class="message bot-message">
            <div class="message-content">
                Hello! I'm your fine-tuned AI assistant. How can I help you today?
            </div>
        </div>
    `;
}

// Add real API integration here
// Example:
/*
async function getAIResponse(userMessage) {
    const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: JSON.stringify({
            message: userMessage,
            model: fineTunedModel.id,
            training_data: fineTunedModel.trainingScripts
        })
    });
    
    const data = await response.json();
    return data.response;
}
*/
