// YT History Brain - Frontend Application

const API_BASE = '/api';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const syncBtn = document.getElementById('sync-btn');
const syncStatus = document.getElementById('sync-status');

// Stats elements
const statVideos = document.getElementById('stat-videos');
const statChunks = document.getElementById('stat-chunks');
const statCached = document.getElementById('stat-cached');

// State
let isLoading = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    setupEventListeners();
});

function setupEventListeners() {
    // Chat form submission
    chatForm.addEventListener('submit', handleSubmit);

    // File upload
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);

    // Sync button
    syncBtn.addEventListener('click', handleSync);

    // Example queries
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.dataset.query;
            chatInput.focus();
        });
    });
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();

        statVideos.textContent = data.total_videos;
        statChunks.textContent = data.total_chunks;
        statCached.textContent = data.transcripts_cached;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const question = chatInput.value.trim();
    if (!question || isLoading) return;

    // Clear welcome message on first query
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    // Add user message
    addMessage(question, 'user');
    chatInput.value = '';

    // Show loading
    isLoading = true;
    sendBtn.disabled = true;
    const loadingEl = addLoadingMessage();

    try {
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, n_results: 5 }),
        });

        const data = await response.json();

        // Remove loading message
        loadingEl.remove();

        // Add assistant response
        addMessage(data.answer, 'assistant', data.sources);
    } catch (error) {
        loadingEl.remove();
        addMessage('Sorry, there was an error processing your request.', 'assistant');
        console.error('Query error:', error);
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
    }
}

function addMessage(content, role, sources = []) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    let html = `<div class="message-content">${escapeHtml(content)}</div>`;

    if (sources && sources.length > 0) {
        html += `
            <div class="sources">
                <div class="sources-title">Sources</div>
                ${sources.map(s => `
                    <div class="source-item">
                        <a href="${s.url}" target="_blank">${escapeHtml(s.title)}</a>
                        <span class="source-channel">by ${escapeHtml(s.channel)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    messageEl.innerHTML = html;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoadingMessage() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'message assistant loading';
    loadingEl.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <span>Searching your YouTube history...</span>
    `;
    chatMessages.appendChild(loadingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingEl;
}

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/upload-history`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            syncStatus.textContent = `Uploaded: ${data.unique_videos} unique videos found`;
            syncStatus.style.color = 'var(--accent-green)';
        } else {
            syncStatus.textContent = `Error: ${data.detail}`;
            syncStatus.style.color = 'var(--accent-red)';
        }
    } catch (error) {
        syncStatus.textContent = 'Upload failed';
        syncStatus.style.color = 'var(--accent-red)';
        console.error('Upload error:', error);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload History';
        fileInput.value = '';
    }
}

async function handleSync() {
    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    syncStatus.textContent = 'Starting sync...';
    syncStatus.style.color = 'var(--text-secondary)';

    try {
        const response = await fetch(`${API_BASE}/sync`, {
            method: 'POST',
        });

        const data = await response.json();

        if (response.ok) {
            syncStatus.textContent = `Done: ${data.success} indexed, ${data.failed} failed`;
            syncStatus.style.color = 'var(--accent-green)';
            loadStats();
        } else {
            syncStatus.textContent = `Error: ${data.detail}`;
            syncStatus.style.color = 'var(--accent-red)';
        }
    } catch (error) {
        syncStatus.textContent = 'Sync failed';
        syncStatus.style.color = 'var(--accent-red)';
        console.error('Sync error:', error);
    } finally {
        syncBtn.disabled = false;
        syncBtn.textContent = 'Sync & Index';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
