/**
 * SpeakCoach - Live Hints Module
 * Provides real-time feedback during speech recording
 */

const LiveHints = (function() {
    'use strict';

    let isEnabled = false;
    let lastHintTime = 0;
    let currentTranscript = '';
    let hintCallback = null;

    // Rate limiting - minimum 5 seconds between hints
    const HINT_COOLDOWN = 5000;

    // Filler words to detect
    const FILLER_WORDS = [
        'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically',
        'actually', 'literally', 'so', 'well', 'right', 'okay so',
        'i mean', 'sort of', 'kind of'
    ];

    // Hint messages
    const HINTS = {
        filler: {
            icon: '🔇',
            text: 'Try to avoid filler words'
        },
        longSentence: {
            icon: '✂️',
            text: 'Consider shortening this thought'
        },
        noPoint: {
            icon: '🎯',
            text: 'State your main point'
        },
        addExample: {
            icon: '💡',
            text: 'Add a specific example'
        },
        rambling: {
            icon: '⏱️',
            text: 'Wrap up this point'
        }
    };

    /**
     * Enable live hints
     * @param {Function} callback - Called when a hint should be shown
     */
    function enable(callback) {
        isEnabled = true;
        hintCallback = callback;
        currentTranscript = '';
        lastHintTime = 0;
    }

    /**
     * Disable live hints
     */
    function disable() {
        isEnabled = false;
        hintCallback = null;
        currentTranscript = '';
    }

    /**
     * Check if hints are enabled
     * @returns {boolean}
     */
    function getIsEnabled() {
        return isEnabled;
    }

    /**
     * Process new transcript text and potentially show hints
     * @param {string} newText - New transcript text to analyze
     */
    function processTranscript(newText) {
        if (!isEnabled || !hintCallback) return;

        currentTranscript = newText;
        const hint = detectHint(currentTranscript);

        if (hint && canShowHint()) {
            lastHintTime = Date.now();
            hintCallback(hint);
        }
    }

    /**
     * Check if enough time has passed to show another hint
     * @returns {boolean}
     */
    function canShowHint() {
        return Date.now() - lastHintTime >= HINT_COOLDOWN;
    }

    /**
     * Analyze transcript and detect which hint to show (if any)
     * @param {string} transcript
     * @returns {{ icon: string, text: string }|null}
     */
    function detectHint(transcript) {
        if (!transcript || transcript.length < 10) return null;

        const lowerTranscript = transcript.toLowerCase();
        const words = lowerTranscript.split(/\s+/);
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());

        // Check for filler words (high priority)
        const recentWords = words.slice(-20).join(' ');
        for (const filler of FILLER_WORDS) {
            if (recentWords.includes(filler)) {
                // Only hint if filler appears multiple times recently
                const regex = new RegExp(filler, 'gi');
                const matches = recentWords.match(regex);
                if (matches && matches.length >= 2) {
                    return HINTS.filler;
                }
            }
        }

        // Check for long sentences (> 25 words without punctuation)
        const lastSentence = sentences[sentences.length - 1] || '';
        const lastSentenceWords = lastSentence.split(/\s+/).filter(w => w);
        if (lastSentenceWords.length > 25) {
            return HINTS.longSentence;
        }

        // Check for rambling (> 50 words without clear structure)
        if (words.length > 50 && sentences.length <= 1) {
            return HINTS.noPoint;
        }

        // Check if making claims without examples
        const claimWords = ['believe', 'think', 'should', 'must', 'always', 'never'];
        const exampleWords = ['for example', 'for instance', 'such as', 'like when', 'one time'];

        const hasClaimWords = claimWords.some(word => lowerTranscript.includes(word));
        const hasExampleWords = exampleWords.some(phrase => lowerTranscript.includes(phrase));

        if (hasClaimWords && !hasExampleWords && words.length > 40) {
            return HINTS.addExample;
        }

        return null;
    }

    /**
     * Count filler words in transcript
     * @param {string} transcript
     * @returns {{ count: number, words: string[] }}
     */
    function countFillers(transcript) {
        if (!transcript) return { count: 0, words: [] };

        const lowerTranscript = transcript.toLowerCase();
        const foundFillers = [];

        for (const filler of FILLER_WORDS) {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = transcript.match(regex);
            if (matches) {
                foundFillers.push(...matches.map(m => m.toLowerCase()));
            }
        }

        // Count occurrences of each filler
        const fillerCounts = {};
        foundFillers.forEach(filler => {
            fillerCounts[filler] = (fillerCounts[filler] || 0) + 1;
        });

        return {
            count: foundFillers.length,
            words: Object.keys(fillerCounts)
        };
    }

    /**
     * Reset state
     */
    function reset() {
        currentTranscript = '';
        lastHintTime = 0;
    }

    // Public API
    return {
        enable,
        disable,
        getIsEnabled,
        processTranscript,
        detectHint,
        countFillers,
        reset,
        FILLER_WORDS
    };
})();

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveHints;
}
