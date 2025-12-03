/**
 * SpeakCoach - Speech Analyzer Module
 * Handles transcription and AI-powered feedback analysis
 */

const SpeechAnalyzer = (function() {
    'use strict';

    // API endpoints (serverless functions)
    const API_BASE = '/api';

    /**
     * Transcribe audio using Whisper API
     * @param {Blob} audioBlob - Audio data to transcribe
     * @returns {Promise<{ success: boolean, transcript?: string, error?: string }>}
     */
    async function transcribeAudio(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch(`${API_BASE}/transcribe`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                transcript: data.transcript
            };
        } catch (error) {
            console.error('Transcription error:', error);
            return {
                success: false,
                error: error.message || 'Failed to transcribe audio'
            };
        }
    }

    /**
     * Analyze transcript using GPT
     * @param {string} transcript - Speech transcript
     * @param {string} topic - The topic the user was responding to
     * @returns {Promise<{ success: boolean, feedback?: Object, error?: string }>}
     */
    async function analyzeTranscript(transcript, topic) {
        try {
            const response = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ transcript, topic })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                feedback: data.feedback
            };
        } catch (error) {
            console.error('Analysis error:', error);
            return {
                success: false,
                error: error.message || 'Failed to analyze speech'
            };
        }
    }

    /**
     * Full analysis pipeline: transcribe + analyze
     * @param {Blob} audioBlob - Audio data
     * @param {string} topic - The topic
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<{ success: boolean, transcript?: string, feedback?: Object, error?: string }>}
     */
    async function analyzeRecording(audioBlob, topic, onProgress = () => {}) {
        // Step 1: Transcribe
        onProgress('Transcribing your speech...');
        const transcriptResult = await transcribeAudio(audioBlob);

        if (!transcriptResult.success) {
            return {
                success: false,
                error: transcriptResult.error
            };
        }

        // Step 2: Analyze
        onProgress('Analyzing for feedback...');
        const analysisResult = await analyzeTranscript(transcriptResult.transcript, topic);

        if (!analysisResult.success) {
            return {
                success: false,
                transcript: transcriptResult.transcript,
                error: analysisResult.error
            };
        }

        return {
            success: true,
            transcript: transcriptResult.transcript,
            feedback: analysisResult.feedback
        };
    }

    /**
     * Validate feedback object structure
     * @param {Object} feedback
     * @returns {boolean}
     */
    function validateFeedback(feedback) {
        if (!feedback) return false;

        const requiredFields = [
            'main_point',
            'structure',
            'fillers',
            'long_sentences',
            'suggested_rewrite'
        ];

        return requiredFields.every(field => feedback.hasOwnProperty(field));
    }

    /**
     * Create fallback feedback when API fails
     * @param {string} transcript
     * @returns {Object}
     */
    function createFallbackFeedback(transcript) {
        // Basic local analysis as fallback
        const words = transcript ? transcript.split(/\s+/) : [];
        const sentences = transcript ? transcript.split(/[.!?]+/).filter(s => s.trim()) : [];

        // Count fillers locally
        const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so'];
        const foundFillers = [];
        const lowerTranscript = (transcript || '').toLowerCase();

        fillerWords.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = lowerTranscript.match(regex);
            if (matches) {
                foundFillers.push(...Array(matches.length).fill(filler));
            }
        });

        // Find long sentences
        const longSentences = sentences
            .filter(s => s.split(/\s+/).length > 20)
            .slice(0, 3);

        return {
            main_point: "Unable to analyze - please try again",
            structure: {
                has_clear_claim: false,
                has_supporting_reason: false,
                has_example: false,
                pattern_detected: "unclear"
            },
            fillers: {
                count: foundFillers.length,
                words: [...new Set(foundFillers)]
            },
            long_sentences: {
                count: longSentences.length,
                examples: longSentences
            },
            suggested_rewrite: "Unable to generate rewrite - please try again"
        };
    }

    // Public API
    return {
        transcribeAudio,
        analyzeTranscript,
        analyzeRecording,
        validateFeedback,
        createFallbackFeedback
    };
})();

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeechAnalyzer;
}
