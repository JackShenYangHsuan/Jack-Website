// API Configuration
const API_URL = 'http://localhost:3001/api';

// DOM Elements - Input Section
const form = document.getElementById('quote-form');
const youtubeInput = document.getElementById('youtube-url');
const generateBtn = document.getElementById('generate-btn');
const inputSection = document.querySelector('.input-section');

// DOM Elements - Quote Selection
const quoteSelectionSection = document.getElementById('quote-selection-section');
const quoteList = document.getElementById('quote-list');
const selectionCounter = document.getElementById('selection-counter');
const backToUrlBtn = document.getElementById('back-to-url-btn');
const nextToStyleBtn = document.getElementById('next-to-style-btn');

// DOM Elements - Style Selection
const styleSelectionSection = document.getElementById('style-selection-section');
const styleOptions = document.getElementById('style-options');
const backToQuotesBtn = document.getElementById('back-to-quotes-btn');
const generateCardsBtn = document.getElementById('generate-cards-btn');

// DOM Elements - Loading, Error, Results
const loadingSection = document.getElementById('loading-section');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const resultsSection = document.getElementById('results-section');
const gallery = document.getElementById('gallery');
const processingTimeEl = document.getElementById('processing-time');
const downloadAllBtn = document.getElementById('download-all-btn');
const loadingText = document.getElementById('loading-text');

// State Management
const state = {
    currentStep: 1, // 1: URL Input, 2: Quote Selection, 3: Style Selection, 4: Results
    youtubeUrl: '',
    extractedQuotes: [],
    selectedQuoteIndices: new Set(),
    selectedStyle: '',
    generatedImages: [],
    processingTime: ''
};

/**
 * Validate YouTube URL format
 */
function validateYouTubeUrl(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
}

/**
 * Navigate to a specific step
 */
function showStep(stepNumber) {
    // Hide all sections
    inputSection.parentElement.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show the appropriate section
    switch (stepNumber) {
        case 1:
            inputSection.parentElement.querySelector('.input-section').parentElement.style.display = 'block';
            break;
        case 2:
            quoteSelectionSection.classList.remove('hidden');
            break;
        case 3:
            styleSelectionSection.classList.remove('hidden');
            break;
        case 4:
            resultsSection.classList.remove('hidden');
            break;
    }

    state.currentStep = stepNumber;
}

/**
 * Extract quotes from YouTube URL (Step 1 API call)
 */
async function extractQuotes(youtubeUrl) {
    try {
        loadingSection.classList.remove('hidden');
        loadingText.textContent = 'Extracting transcript and finding quotes...';
        generateBtn.disabled = true;

        const response = await fetch(`${API_URL}/extract-quotes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ youtubeUrl })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to extract quotes');
        }

        if (!data.success) {
            throw new Error(data.error || 'Quote extraction failed');
        }

        return data.data.quotes;

    } catch (error) {
        console.error('Error extracting quotes:', error);

        let errorMsg = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
            errorMsg = 'Unable to connect to the server. Make sure the backend is running on localhost:3001';
        }

        throw new Error(errorMsg);
    } finally {
        loadingSection.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

/**
 * Generate quote cards from selected quotes and style (Step 2 API call)
 */
async function generateCards(selectedQuotes, selectedStyle) {
    try {
        loadingSection.classList.remove('hidden');
        loadingText.textContent = 'Generating your quote cards with DALL-E 3...';

        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ selectedQuotes, selectedStyle })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate cards');
        }

        if (!data.success) {
            throw new Error(data.error || 'Card generation failed');
        }

        return {
            images: data.data.images,
            processingTime: data.data.processingTime
        };

    } catch (error) {
        console.error('Error generating cards:', error);
        throw error;
    } finally {
        loadingSection.classList.add('hidden');
    }
}

/**
 * Render quote selection screen
 */
function renderQuoteSelection(quotes) {
    quoteList.innerHTML = '';

    quotes.forEach((quote, index) => {
        const quoteItem = document.createElement('div');
        quoteItem.className = 'quote-item';
        quoteItem.dataset.index = index;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `quote-${index}`;
        checkbox.value = index;

        const quoteText = document.createElement('div');
        quoteText.className = 'quote-text';
        quoteText.textContent = quote;

        const quoteNumber = document.createElement('div');
        quoteNumber.className = 'quote-number';
        quoteNumber.textContent = `#${index + 1}`;

        quoteItem.appendChild(checkbox);
        quoteItem.appendChild(quoteNumber);
        quoteItem.appendChild(quoteText);

        // Make the whole item clickable
        quoteItem.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            handleQuoteSelection(index, checkbox.checked);
        });

        checkbox.addEventListener('change', (e) => {
            handleQuoteSelection(index, e.target.checked);
        });

        quoteList.appendChild(quoteItem);
    });

    updateSelectionCounter();
}

/**
 * Handle quote selection
 */
function handleQuoteSelection(index, isSelected) {
    const quoteItem = document.querySelector(`.quote-item[data-index="${index}"]`);
    const checkbox = quoteItem.querySelector('input[type="checkbox"]');

    if (isSelected) {
        if (state.selectedQuoteIndices.size >= 5) {
            // Max 5 quotes
            checkbox.checked = false;
            return;
        }
        state.selectedQuoteIndices.add(index);
        quoteItem.classList.add('selected');
    } else {
        state.selectedQuoteIndices.delete(index);
        quoteItem.classList.remove('selected');
    }

    checkbox.checked = isSelected;
    updateSelectionCounter();
}

/**
 * Update selection counter and enable/disable Next button
 */
function updateSelectionCounter() {
    const count = state.selectedQuoteIndices.size;
    selectionCounter.textContent = `${count}/5 quotes selected`;

    // Enable Next button only if 3-5 quotes selected
    if (count >= 3 && count <= 5) {
        nextToStyleBtn.disabled = false;
        selectionCounter.style.color = 'var(--primary-color)';
    } else {
        nextToStyleBtn.disabled = true;
        if (count < 3) {
            selectionCounter.style.color = 'var(--text-secondary)';
        } else {
            selectionCounter.style.color = 'var(--error-color)';
        }
    }
}

/**
 * Handle style selection
 */
function setupStyleSelection() {
    const styleCards = document.querySelectorAll('.style-card');

    styleCards.forEach(card => {
        const radio = card.querySelector('input[type="radio"]');

        card.addEventListener('click', () => {
            // Deselect all cards
            styleCards.forEach(c => c.classList.remove('selected'));

            // Select this card
            card.classList.add('selected');
            radio.checked = true;

            state.selectedStyle = radio.value;

            // Enable generate button
            generateCardsBtn.disabled = false;
        });

        radio.addEventListener('change', () => {
            if (radio.checked) {
                styleCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                state.selectedStyle = radio.value;
                generateCardsBtn.disabled = false;
            }
        });
    });
}

/**
 * Show results
 */
function showResults(quotes, images, processingTime) {
    resultsSection.classList.remove('hidden');
    errorSection.classList.add('hidden');

    processingTimeEl.textContent = `Generated in ${processingTime}`;
    state.generatedImages = images;

    gallery.innerHTML = '';

    images.forEach((imageData, index) => {
        const card = createQuoteCard(imageData, quotes[index], index);
        gallery.appendChild(card);
    });

    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Create a quote card element
 */
function createQuoteCard(imageData, quote, index) {
    const card = document.createElement('div');
    card.className = 'quote-card';

    const img = document.createElement('img');
    img.src = imageData;
    img.alt = `Quote card ${index + 1}`;
    img.className = 'quote-card-image';

    const actions = document.createElement('div');
    actions.className = 'quote-card-actions';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = `Download Card ${index + 1}`;
    downloadBtn.onclick = () => downloadImage(imageData, index);

    actions.appendChild(downloadBtn);
    card.appendChild(img);
    card.appendChild(actions);

    return card;
}

/**
 * Download a single image
 */
function downloadImage(imageData, index) {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `quote-card-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Download all images
 */
function downloadAllImages() {
    state.generatedImages.forEach((imageData, index) => {
        setTimeout(() => {
            downloadImage(imageData, index);
        }, index * 300);
    });
}

/**
 * Show error message
 */
function showError(message) {
    loadingSection.classList.add('hidden');
    errorSection.classList.remove('hidden');
    errorMessage.textContent = message;
}

// Event Listeners

/**
 * Handle form submission (Step 1: URL Input)
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const youtubeUrl = youtubeInput.value.trim();

    if (!youtubeUrl) {
        showError('Please enter a YouTube URL');
        return;
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
        showError('Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)');
        return;
    }

    try {
        state.youtubeUrl = youtubeUrl;

        // Extract 10 quotes
        const quotes = await extractQuotes(youtubeUrl);
        state.extractedQuotes = quotes;

        // Show quote selection screen
        renderQuoteSelection(quotes);
        inputSection.parentElement.querySelector('.input-section').classList.add('hidden');
        quoteSelectionSection.classList.remove('hidden');
        state.currentStep = 2;

    } catch (error) {
        showError(error.message);
    }
});

/**
 * Back to URL input
 */
backToUrlBtn.addEventListener('click', () => {
    quoteSelectionSection.classList.add('hidden');
    inputSection.parentElement.querySelector('.input-section').classList.remove('hidden');
    state.currentStep = 1;
});

/**
 * Next to style selection
 */
nextToStyleBtn.addEventListener('click', () => {
    if (state.selectedQuoteIndices.size >= 3 && state.selectedQuoteIndices.size <= 5) {
        quoteSelectionSection.classList.add('hidden');
        styleSelectionSection.classList.remove('hidden');
        state.currentStep = 3;
    }
});

/**
 * Back to quote selection
 */
backToQuotesBtn.addEventListener('click', () => {
    styleSelectionSection.classList.add('hidden');
    quoteSelectionSection.classList.remove('hidden');
    state.currentStep = 2;
});

/**
 * Generate cards
 */
generateCardsBtn.addEventListener('click', async () => {
    if (!state.selectedStyle) {
        showError('Please select a design style');
        return;
    }

    if (state.selectedQuoteIndices.size < 3 || state.selectedQuoteIndices.size > 5) {
        showError('Please select 3-5 quotes');
        return;
    }

    try {
        // Get selected quotes
        const selectedQuotes = Array.from(state.selectedQuoteIndices)
            .sort((a, b) => a - b)
            .map(index => state.extractedQuotes[index]);

        // Generate cards
        const { images, processingTime } = await generateCards(selectedQuotes, state.selectedStyle);

        // Hide style selection and show results
        styleSelectionSection.classList.add('hidden');
        showResults(selectedQuotes, images, processingTime);
        state.currentStep = 4;

    } catch (error) {
        showError(error.message);
    }
});

/**
 * Retry button
 */
retryBtn.addEventListener('click', () => {
    errorSection.classList.add('hidden');

    // Return to step 1
    quoteSelectionSection.classList.add('hidden');
    styleSelectionSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    inputSection.parentElement.querySelector('.input-section').classList.remove('hidden');

    state.currentStep = 1;
    state.selectedQuoteIndices.clear();
    state.selectedStyle = '';

    youtubeInput.focus();
});

/**
 * Download all button
 */
downloadAllBtn.addEventListener('click', () => {
    downloadAllImages();
});

/**
 * Clear error when typing
 */
youtubeInput.addEventListener('input', () => {
    if (!errorSection.classList.contains('hidden')) {
        errorSection.classList.add('hidden');
    }
});

// Initialize
setupStyleSelection();
console.log('YouTube Quote Card Generator v2.0 initialized');
console.log('API URL:', API_URL);
