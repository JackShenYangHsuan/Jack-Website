/**
 * SpeakCoach - Main Application
 * Handles state management, screen transitions, and event bindings
 */

const SpeakCoachApp = (function() {
    'use strict';

    // ==========================================================================
    // Application State
    // ==========================================================================
    const state = {
        currentScreen: 'landing',
        currentTopic: null,       // { text: string, category: string }
        audioBlob: null,
        transcript: null,
        feedback: null,
        hintsEnabled: false,
        isRecording: false
    };

    // ==========================================================================
    // DOM Elements Cache
    // ==========================================================================
    const elements = {};

    function cacheElements() {
        // Screens
        elements.screenLanding = document.getElementById('screen-landing');
        elements.screenTopic = document.getElementById('screen-topic');
        elements.screenRecording = document.getElementById('screen-recording');
        elements.screenFeedback = document.getElementById('screen-feedback');
        elements.screenError = document.getElementById('screen-error');

        // Landing
        elements.btnStartPractice = document.getElementById('btn-start-practice');

        // Topic
        elements.topicCategory = document.getElementById('topic-category');
        elements.topicText = document.getElementById('topic-text');
        elements.btnDifferentTopic = document.getElementById('btn-different-topic');
        elements.toggleHints = document.getElementById('toggle-hints');
        elements.btnStartSpeaking = document.getElementById('btn-start-speaking');

        // Recording
        elements.timerContainer = document.getElementById('timer-container');
        elements.timerProgress = document.getElementById('timer-progress');
        elements.timerDisplay = document.getElementById('timer-display');
        elements.micIndicator = document.getElementById('mic-indicator');
        elements.recordingStatus = document.getElementById('recording-status');
        elements.btnStopRecording = document.getElementById('btn-stop-recording');
        elements.hintToast = document.getElementById('hint-toast');
        elements.hintText = document.getElementById('hint-text');

        // Feedback
        elements.feedbackMainPoint = document.getElementById('feedback-main-point');
        elements.feedbackStructure = document.getElementById('feedback-structure');
        elements.feedbackStructureSection = document.getElementById('feedback-structure-section');
        elements.fillerCount = document.getElementById('filler-count');
        elements.feedbackFillers = document.getElementById('feedback-fillers');
        elements.feedbackFillersSection = document.getElementById('feedback-fillers-section');
        elements.longSentenceCount = document.getElementById('long-sentence-count');
        elements.feedbackLongSentences = document.getElementById('feedback-long-sentences');
        elements.feedbackLongSection = document.getElementById('feedback-long-section');
        elements.feedbackRewrite = document.getElementById('feedback-rewrite');
        elements.btnTryAgain = document.getElementById('btn-try-again');
        elements.btnNewTopic = document.getElementById('btn-new-topic');

        // Loading
        elements.loadingOverlay = document.getElementById('loading-overlay');
        elements.loadingText = document.getElementById('loading-text');

        // Error
        elements.errorTitle = document.getElementById('error-title');
        elements.errorDescription = document.getElementById('error-description');
        elements.btnErrorRetry = document.getElementById('btn-error-retry');
    }

    // ==========================================================================
    // Screen Management
    // ==========================================================================
    function showScreen(screenName) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) {
            // Small delay to allow CSS transition
            requestAnimationFrame(() => {
                targetScreen.classList.add('active');
            });
        }

        state.currentScreen = screenName;
    }

    function showLoading(text = 'Loading...') {
        elements.loadingText.textContent = text;
        elements.loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        elements.loadingOverlay.style.display = 'none';
    }

    function showError(title, description) {
        elements.errorTitle.textContent = title;
        elements.errorDescription.textContent = description;
        showScreen('error');
    }

    // ==========================================================================
    // Topic Screen
    // ==========================================================================
    function loadNewTopic() {
        const topic = TopicGenerator.getRandomTopic();
        state.currentTopic = topic;

        elements.topicCategory.textContent = TopicGenerator.formatCategoryName(topic.category);
        elements.topicText.textContent = topic.text;
    }

    // ==========================================================================
    // Recording Screen
    // ==========================================================================
    async function startRecording() {
        // Request microphone permission first
        showLoading('Requesting microphone access...');

        const hasPermission = await AudioRecorder.requestMicrophonePermission();
        hideLoading();

        if (!hasPermission) {
            showError(
                'Microphone Access Required',
                'Please allow microphone access in your browser settings to use SpeakCoach.'
            );
            return;
        }

        // Show recording screen
        showScreen('recording');
        state.isRecording = true;

        // Reset timer display
        updateTimerDisplay(AudioRecorder.MAX_DURATION, 0);

        // Enable live hints if toggled
        if (state.hintsEnabled) {
            LiveHints.enable(showHint);
        }

        // Start recording
        const started = await AudioRecorder.startRecording({
            onTimeUpdate: (seconds, progress) => {
                updateTimerDisplay(seconds, progress);
            },
            onComplete: (audioBlob) => {
                handleRecordingComplete(audioBlob);
            },
            onError: (error) => {
                showError('Recording Error', error.message);
            }
        });

        if (!started) {
            showError(
                'Recording Failed',
                'Unable to start recording. Please refresh and try again.'
            );
        }
    }

    function updateTimerDisplay(seconds, progress) {
        // Update time text
        elements.timerDisplay.textContent = AudioRecorder.formatTime(seconds);

        // Update circular progress
        // SVG circle with r=45 has circumference of ~283
        const circumference = 2 * Math.PI * 45;
        const offset = circumference * (1 - progress);
        elements.timerProgress.style.strokeDashoffset = offset;

        // Change color when time is running low
        if (seconds <= 10) {
            elements.timerProgress.style.stroke = 'var(--color-error)';
            elements.timerContainer.classList.add('recording');
        } else {
            elements.timerProgress.style.stroke = 'var(--color-primary)';
            elements.timerContainer.classList.remove('recording');
        }
    }

    function stopRecording() {
        const result = AudioRecorder.stopRecording();
        state.isRecording = false;

        // Disable live hints
        LiveHints.disable();

        // Check if recording was too short
        if (result.tooShort) {
            showError(
                'Recording Too Short',
                `Please speak for at least ${AudioRecorder.MIN_DURATION} seconds to get meaningful feedback.`
            );
            return;
        }
    }

    async function handleRecordingComplete(audioBlob) {
        state.audioBlob = audioBlob;
        state.isRecording = false;

        // Show loading and analyze
        showLoading('Analyzing your speech...');

        const result = await SpeechAnalyzer.analyzeRecording(
            audioBlob,
            state.currentTopic.text,
            (progressText) => {
                elements.loadingText.textContent = progressText;
            }
        );

        hideLoading();

        if (result.success && result.feedback) {
            state.transcript = result.transcript;
            state.feedback = result.feedback;
            displayFeedback(result.feedback);
            showScreen('feedback');
        } else {
            // Use fallback analysis if API fails
            const fallbackFeedback = SpeechAnalyzer.createFallbackFeedback(result.transcript);
            state.transcript = result.transcript;
            state.feedback = fallbackFeedback;
            displayFeedback(fallbackFeedback);
            showScreen('feedback');
        }
    }

    // ==========================================================================
    // Live Hints
    // ==========================================================================
    let hintTimeout = null;

    function showHint(hint) {
        // Clear any existing timeout
        if (hintTimeout) {
            clearTimeout(hintTimeout);
        }

        // Update hint content
        elements.hintText.textContent = hint.text;

        // Show the toast
        elements.hintToast.classList.add('show');

        // Auto-hide after 3 seconds
        hintTimeout = setTimeout(() => {
            hideHint();
        }, 3000);
    }

    function hideHint() {
        elements.hintToast.classList.remove('show');
    }

    // ==========================================================================
    // Feedback Display
    // ==========================================================================
    function displayFeedback(feedback) {
        // Main Point
        elements.feedbackMainPoint.textContent = feedback.main_point || 'No main point detected';

        // Structure
        displayStructure(feedback.structure);

        // Fillers
        displayFillers(feedback.fillers);

        // Long Sentences
        displayLongSentences(feedback.long_sentences);

        // Suggested Rewrite
        elements.feedbackRewrite.textContent = feedback.suggested_rewrite || 'No suggestion available';
    }

    function displayStructure(structure) {
        if (!structure) {
            elements.feedbackStructure.innerHTML = '<p class="text-muted">Unable to analyze structure</p>';
            return;
        }

        const items = [
            { label: 'Clear claim/thesis', pass: structure.has_clear_claim },
            { label: 'Supporting reason', pass: structure.has_supporting_reason },
            { label: 'Concrete example', pass: structure.has_example }
        ];

        const html = items.map(item => `
            <div class="structure-item ${item.pass ? 'pass' : 'fail'}">
                <span>${item.pass ? '✓' : '⚠️'}</span>
                <span>${item.label}</span>
            </div>
        `).join('');

        const pattern = structure.pattern_detected || 'unclear';
        const patternLabel = `<p class="text-muted mt-sm" style="font-size: var(--font-size-xs);">Pattern: ${pattern}</p>`;

        elements.feedbackStructure.innerHTML = html + patternLabel;

        // Update section border color based on score
        const score = items.filter(i => i.pass).length;
        if (score >= 2) {
            elements.feedbackStructureSection.classList.add('success');
            elements.feedbackStructureSection.classList.remove('warning');
        } else {
            elements.feedbackStructureSection.classList.add('warning');
            elements.feedbackStructureSection.classList.remove('success');
        }
    }

    function displayFillers(fillers) {
        if (!fillers) {
            elements.fillerCount.textContent = '0';
            elements.feedbackFillers.innerHTML = '<p class="text-muted">No filler words detected</p>';
            return;
        }

        elements.fillerCount.textContent = fillers.count || 0;

        if (fillers.words && fillers.words.length > 0) {
            const html = fillers.words.map(word =>
                `<span class="filler-word">${word}</span>`
            ).join('');
            elements.feedbackFillers.innerHTML = html;
        } else {
            elements.feedbackFillers.innerHTML = '<p class="text-muted">No filler words detected</p>';
        }

        // Update section styling based on count
        const count = fillers.count || 0;
        if (count === 0) {
            elements.feedbackFillersSection.classList.add('success');
            elements.feedbackFillersSection.classList.remove('warning', 'error');
        } else if (count <= 3) {
            elements.feedbackFillersSection.classList.add('warning');
            elements.feedbackFillersSection.classList.remove('success', 'error');
        } else {
            elements.feedbackFillersSection.classList.add('error');
            elements.feedbackFillersSection.classList.remove('success', 'warning');
        }
    }

    function displayLongSentences(longSentences) {
        if (!longSentences) {
            elements.longSentenceCount.textContent = '0';
            elements.feedbackLongSentences.innerHTML = '<p class="text-muted">All sentences were concise</p>';
            return;
        }

        elements.longSentenceCount.textContent = longSentences.count || 0;

        if (longSentences.examples && longSentences.examples.length > 0) {
            const html = longSentences.examples.map((sentence, i) => `
                <p class="text-secondary" style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-xs);">
                    "${sentence.substring(0, 100)}${sentence.length > 100 ? '...' : ''}"
                </p>
            `).join('');
            elements.feedbackLongSentences.innerHTML = html;
        } else {
            elements.feedbackLongSentences.innerHTML = '<p class="text-muted">All sentences were concise</p>';
        }

        // Update section styling
        const count = longSentences.count || 0;
        if (count === 0) {
            elements.feedbackLongSection.classList.add('success');
            elements.feedbackLongSection.classList.remove('warning');
        } else {
            elements.feedbackLongSection.classList.add('warning');
            elements.feedbackLongSection.classList.remove('success');
        }
    }

    // ==========================================================================
    // Session Management
    // ==========================================================================
    function resetSession() {
        state.audioBlob = null;
        state.transcript = null;
        state.feedback = null;
        AudioRecorder.cleanup();
        LiveHints.reset();
    }

    function tryAgain() {
        resetSession();
        startRecording();
    }

    function newTopic() {
        resetSession();
        loadNewTopic();
        showScreen('topic');
    }

    // ==========================================================================
    // Event Binding
    // ==========================================================================
    function bindEvents() {
        // Landing screen
        elements.btnStartPractice.addEventListener('click', () => {
            loadNewTopic();
            showScreen('topic');
        });

        // Topic screen
        elements.btnDifferentTopic.addEventListener('click', loadNewTopic);

        elements.toggleHints.addEventListener('change', (e) => {
            state.hintsEnabled = e.target.checked;
        });

        elements.btnStartSpeaking.addEventListener('click', startRecording);

        // Recording screen
        elements.btnStopRecording.addEventListener('click', stopRecording);

        // Feedback screen
        elements.btnTryAgain.addEventListener('click', tryAgain);
        elements.btnNewTopic.addEventListener('click', newTopic);

        // Error screen
        elements.btnErrorRetry.addEventListener('click', () => {
            showScreen('landing');
        });

        // Handle page visibility change (pause/resume)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.isRecording) {
                // Optionally pause recording when tab is hidden
                console.log('Tab hidden while recording');
            }
        });

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            AudioRecorder.releaseMicrophone();
        });
    }

    // ==========================================================================
    // Initialization
    // ==========================================================================
    function init() {
        cacheElements();
        bindEvents();

        // Show landing screen
        showScreen('landing');

        console.log('SpeakCoach initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API (for debugging)
    return {
        getState: () => ({ ...state }),
        showScreen,
        loadNewTopic
    };
})();
