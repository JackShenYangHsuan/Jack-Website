/**
 * SpeakCoach - Audio Recorder Module
 * Handles microphone access and audio recording
 */

const AudioRecorder = (function() {
    'use strict';

    let mediaRecorder = null;
    let audioChunks = [];
    let stream = null;
    let isRecording = false;
    let timerInterval = null;
    let secondsRemaining = 60;
    let skipOnComplete = false; // Flag to prevent callback on too-short recordings

    // Callbacks
    let onTimeUpdate = null;
    let onRecordingComplete = null;
    let onError = null;

    // Constants
    const MAX_DURATION = 60; // seconds
    const MIN_DURATION = 10; // seconds
    const CIRCUMFERENCE = 2 * Math.PI * 45; // For SVG circle with r=45

    /**
     * Request microphone permission
     * @returns {Promise<boolean>}
     */
    async function requestMicrophonePermission() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            if (onError) {
                onError({
                    type: 'permission_denied',
                    message: 'Microphone access was denied. Please allow microphone access to use this feature.'
                });
            }
            return false;
        }
    }

    /**
     * Start recording audio
     * @param {Object} callbacks - Callback functions
     * @param {Function} callbacks.onTimeUpdate - Called every second with remaining time
     * @param {Function} callbacks.onComplete - Called when recording completes with audio Blob
     * @param {Function} callbacks.onError - Called on error
     * @returns {Promise<boolean>}
     */
    async function startRecording(callbacks = {}) {
        onTimeUpdate = callbacks.onTimeUpdate || null;
        onRecordingComplete = callbacks.onComplete || null;
        onError = callbacks.onError || null;

        // Request permission if we don't have a stream
        if (!stream) {
            const hasPermission = await requestMicrophonePermission();
            if (!hasPermission) return false;
        }

        try {
            audioChunks = [];
            secondsRemaining = MAX_DURATION;
            isRecording = true;
            skipOnComplete = false; // Reset flag for new recording

            // Determine the best supported MIME type
            const mimeType = getSupportedMimeType();

            mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                // Skip callback if recording was too short
                if (skipOnComplete) {
                    skipOnComplete = false;
                    return;
                }
                const audioBlob = new Blob(audioChunks, { type: mimeType });
                if (onRecordingComplete) {
                    onRecordingComplete(audioBlob);
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                if (onError) {
                    onError({
                        type: 'recording_error',
                        message: 'An error occurred while recording. Please try again.'
                    });
                }
            };

            // Start recording - collect data every second for potential streaming
            mediaRecorder.start(1000);

            // Start countdown timer
            startTimer();

            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            if (onError) {
                onError({
                    type: 'start_error',
                    message: 'Failed to start recording. Please try again.'
                });
            }
            return false;
        }
    }

    /**
     * Get supported MIME type for MediaRecorder
     * @returns {string}
     */
    function getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'audio/webm'; // Default fallback
    }

    /**
     * Start the countdown timer
     */
    function startTimer() {
        // Initial update
        if (onTimeUpdate) {
            onTimeUpdate(secondsRemaining, getProgress());
        }

        timerInterval = setInterval(() => {
            secondsRemaining--;

            if (onTimeUpdate) {
                onTimeUpdate(secondsRemaining, getProgress());
            }

            if (secondsRemaining <= 0) {
                stopRecording();
            }
        }, 1000);
    }

    /**
     * Get progress as a value from 0 to 1
     * @returns {number}
     */
    function getProgress() {
        return (MAX_DURATION - secondsRemaining) / MAX_DURATION;
    }

    /**
     * Get stroke-dashoffset for SVG circle
     * @returns {number}
     */
    function getStrokeDashoffset() {
        return CIRCUMFERENCE * (1 - getProgress());
    }

    /**
     * Stop recording
     * @returns {{ blob: Blob|null, duration: number, tooShort: boolean }}
     */
    function stopRecording() {
        clearInterval(timerInterval);
        timerInterval = null;

        const recordedDuration = MAX_DURATION - secondsRemaining;
        const tooShort = recordedDuration < MIN_DURATION;

        // Set flag to skip onComplete callback if recording is too short
        if (tooShort) {
            skipOnComplete = true;
        }

        if (mediaRecorder && mediaRecorder.state === 'recording') {
            isRecording = false;
            mediaRecorder.stop();
        }

        return {
            duration: recordedDuration,
            tooShort
        };
    }

    /**
     * Get the current audio stream (for live hints)
     * @returns {MediaStream|null}
     */
    function getStream() {
        return stream;
    }

    /**
     * Check if currently recording
     * @returns {boolean}
     */
    function getIsRecording() {
        return isRecording;
    }

    /**
     * Format seconds as MM:SS
     * @param {number} seconds
     * @returns {string}
     */
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Clean up resources
     */
    function cleanup() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }

        // Don't stop the stream here - we might want to reuse it
        // The stream will be stopped when the page unloads

        mediaRecorder = null;
        audioChunks = [];
        isRecording = false;
        skipOnComplete = false;
    }

    /**
     * Fully release microphone
     */
    function releaseMicrophone() {
        cleanup();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    // Public API
    return {
        requestMicrophonePermission,
        startRecording,
        stopRecording,
        getStream,
        getIsRecording,
        formatTime,
        cleanup,
        releaseMicrophone,
        MAX_DURATION,
        MIN_DURATION
    };
})();

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioRecorder;
}
