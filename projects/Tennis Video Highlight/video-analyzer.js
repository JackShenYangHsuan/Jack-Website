/**
 * Video Analyzer - Extracts frames and sends to AI for analysis
 */

class VideoAnalyzer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.frameInterval = 0.5; // Extract 2 frames per second for better detection
        this.frames = [];
        this.analysisResults = [];
    }

    /**
     * Extract frames from video at regular intervals
     */
    async extractFrames(videoElement, onProgress) {
        return new Promise((resolve, reject) => {
            this.frames = [];
            const video = videoElement;
            const duration = video.duration;
            const totalFrames = Math.floor(duration / this.frameInterval);

            // Set canvas size to match video (scaled down for efficiency)
            const maxWidth = 640;
            const scale = Math.min(1, maxWidth / video.videoWidth);
            this.canvas.width = video.videoWidth * scale;
            this.canvas.height = video.videoHeight * scale;

            let currentFrame = 0;

            const captureFrame = () => {
                if (currentFrame >= totalFrames) {
                    resolve(this.frames);
                    return;
                }

                const timestamp = currentFrame * this.frameInterval;
                video.currentTime = timestamp;
            };

            video.onseeked = () => {
                // Draw frame to canvas
                this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

                // Get base64 image (JPEG for smaller size)
                const imageData = this.canvas.toDataURL('image/jpeg', 0.7);

                this.frames.push({
                    index: currentFrame,
                    timestamp: currentFrame * this.frameInterval,
                    imageData: imageData
                });

                currentFrame++;

                if (onProgress) {
                    onProgress({
                        current: currentFrame,
                        total: totalFrames,
                        phase: 'extracting'
                    });
                }

                // Continue to next frame
                captureFrame();
            };

            video.onerror = reject;

            // Start extraction
            captureFrame();
        });
    }

    /**
     * Analyze frames using the API
     */
    async analyzeFrames(frames, onProgress) {
        this.analysisResults = [];
        const batchSize = 5; // Process 5 frames at a time
        const batches = [];

        // Split into batches
        for (let i = 0; i < frames.length; i += batchSize) {
            batches.push(frames.slice(i, i + batchSize));
        }

        let processedCount = 0;

        for (const batch of batches) {
            try {
                const results = await this.analyzeBatch(batch);
                this.analysisResults.push(...results);

                processedCount += batch.length;

                if (onProgress) {
                    onProgress({
                        current: processedCount,
                        total: frames.length,
                        phase: 'analyzing'
                    });
                }
            } catch (error) {
                console.error('Batch analysis failed:', error);
                // Add placeholder results for failed batch
                batch.forEach(frame => {
                    this.analysisResults.push({
                        ...frame,
                        actionIntensity: 0,
                        isActivePlay: false,
                        error: error.message
                    });
                });
            }
        }

        return this.analysisResults;
    }

    /**
     * Analyze a batch of frames via API
     */
    async analyzeBatch(frames) {
        const response = await fetch('/api/tennis-analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                frames: frames.map(f => ({
                    index: f.index,
                    timestamp: f.timestamp,
                    imageData: f.imageData
                }))
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Analysis failed');
        }

        const results = await response.json();

        // Merge results with frame data
        return frames.map((frame, i) => ({
            ...frame,
            ...results[i]
        }));
    }

    /**
     * Apply temporal smoothing - fill gaps in detection
     * If frames before AND after show activity, assume middle frames are active too
     */
    applyTemporalSmoothing(results) {
        const smoothed = [...results];
        const windowSize = 2; // Look 2 frames before/after

        for (let i = windowSize; i < results.length - windowSize; i++) {
            if (!smoothed[i].isActivePlay) {
                // Check if surrounded by active frames
                let activeBefore = 0;
                let activeAfter = 0;

                for (let j = 1; j <= windowSize; j++) {
                    if (smoothed[i - j].isActivePlay) activeBefore++;
                    if (smoothed[i + j].isActivePlay) activeAfter++;
                }

                // If majority of surrounding frames are active, mark this as active
                if (activeBefore >= 1 && activeAfter >= 1) {
                    smoothed[i] = {
                        ...smoothed[i],
                        isActivePlay: true,
                        playerEngaged: true,
                        smoothed: true // Mark as filled by smoothing
                    };
                }
            }
        }

        return smoothed;
    }

    /**
     * Detect highlights from analysis results
     * Looks for segments where active rally is happening for 2+ seconds
     */
    detectHighlights(analysisResults, options = {}) {
        const {
            minDuration = 2 // seconds - active rally for 2+ seconds = highlight
        } = options;

        // Skip temporal smoothing - use stricter activeRally detection instead
        const smoothedResults = analysisResults;

        const highlights = [];
        let currentHighlight = null;

        // Track consecutive idle frames to require a real gap between highlights
        let idleCount = 0;
        const minGapFrames = 3; // Require 3 idle frames (1.5s at 0.5s sampling) to end highlight

        for (const frame of smoothedResults) {
            // Only count activeRally=true as highlight-worthy (stricter than playerEngaged)
            const isActiveRally = frame.activeRally === true;

            if (isActiveRally) {
                idleCount = 0; // Reset idle counter
                if (!currentHighlight) {
                    currentHighlight = {
                        startTime: frame.timestamp,
                        startIndex: frame.index,
                        frames: [frame],
                        ballInAirCount: frame.activeRally ? 1 : 0
                    };
                } else {
                    currentHighlight.frames.push(frame);
                    if (frame.activeRally) {
                        currentHighlight.ballInAirCount++; // Count active rally frames
                    }
                }
            } else {
                idleCount++;

                // Only end highlight after enough consecutive idle frames
                if (currentHighlight && idleCount >= minGapFrames) {
                    const lastActiveFrame = currentHighlight.frames[currentHighlight.frames.length - 1];
                    currentHighlight.endTime = lastActiveFrame.timestamp + this.frameInterval;
                    currentHighlight.endIndex = lastActiveFrame.index;
                    currentHighlight.duration = currentHighlight.endTime - currentHighlight.startTime;

                    // Only keep highlights that meet minimum duration
                    if (currentHighlight.duration >= minDuration) {
                        // Calculate intensity based on rally detection rate
                        const rallyRatio = currentHighlight.ballInAirCount / currentHighlight.frames.length;
                        currentHighlight.avgIntensity = Math.max(5, Math.round(rallyRatio * 10));

                        // Get thumbnail from middle frame
                        const midIndex = Math.floor(currentHighlight.frames.length / 2);
                        currentHighlight.thumbnail = currentHighlight.frames[midIndex].imageData;

                        highlights.push(currentHighlight);
                    }

                    currentHighlight = null;
                }
            }
        }

        // Handle case where video ends during a highlight
        if (currentHighlight) {
            const lastFrame = currentHighlight.frames[currentHighlight.frames.length - 1];
            currentHighlight.endTime = lastFrame.timestamp + this.frameInterval;
            currentHighlight.endIndex = lastFrame.index;
            currentHighlight.duration = currentHighlight.endTime - currentHighlight.startTime;

            if (currentHighlight.duration >= minDuration) {
                const ballAirRatio = currentHighlight.ballInAirCount / currentHighlight.frames.length;
                currentHighlight.avgIntensity = Math.round(ballAirRatio * 10);

                const midIndex = Math.floor(currentHighlight.frames.length / 2);
                currentHighlight.thumbnail = currentHighlight.frames[midIndex].imageData;

                highlights.push(currentHighlight);
            }
        }

        return highlights;
    }

    /**
     * Get all analysis results (for debug view)
     */
    getAnalysisResults() {
        return this.analysisResults;
    }

    /**
     * Format timestamp as MM:SS
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Export for use in app.js
window.VideoAnalyzer = VideoAnalyzer;
