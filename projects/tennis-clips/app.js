/**
 * Tennis Video Highlight - Main App
 */

class TennisHighlightApp {
    constructor() {
        this.videoFile = null;
        this.videoUrl = null;
        this.analyzer = new VideoAnalyzer();
        this.clipGenerator = new ClipGenerator();
        this.highlights = [];
        this.currentHighlight = null;

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        // Sections
        this.uploadSection = document.getElementById('upload-section');
        this.previewSection = document.getElementById('preview-section');
        this.progressSection = document.getElementById('progress-section');
        this.resultsSection = document.getElementById('results-section');
        this.analysisSection = document.getElementById('analysis-section');

        // Upload
        this.uploadArea = document.getElementById('upload-area');
        this.videoInput = document.getElementById('video-input');

        // Preview
        this.videoPlayer = document.getElementById('video-player');
        this.videoDuration = document.getElementById('video-duration');
        this.videoSize = document.getElementById('video-size');
        this.durationSelect = document.getElementById('duration-select');
        this.analyzeBtn = document.getElementById('analyze-btn');

        // Progress
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');

        // Results
        this.resultsSummary = document.getElementById('results-summary');
        this.highlightsList = document.getElementById('highlights-list');
        this.viewAnalysisBtn = document.getElementById('view-analysis-btn');
        this.newVideoBtn = document.getElementById('new-video-btn');

        // Analysis
        this.analysisGrid = document.getElementById('analysis-grid');
        this.backToResultsBtn = document.getElementById('back-to-results-btn');

        // Modal
        this.clipModal = document.getElementById('clip-modal');
        this.modalClose = document.getElementById('modal-close');
        this.clipPreview = document.getElementById('clip-preview');
        this.clipStart = document.getElementById('clip-start');
        this.clipEnd = document.getElementById('clip-end');
        this.downloadClipBtn = document.getElementById('download-clip-btn');
    }

    initEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => {
            this.videoInput.click();
        });

        // File input change
        this.videoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleVideoSelect(e.target.files[0]);
            }
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleVideoSelect(e.dataTransfer.files[0]);
            }
        });

        // Analyze button
        this.analyzeBtn.addEventListener('click', () => {
            this.analyzeVideo();
        });

        // View analysis button
        this.viewAnalysisBtn.addEventListener('click', () => {
            this.showAnalysisView();
        });

        // Back to results button
        this.backToResultsBtn.addEventListener('click', () => {
            this.showResultsView();
        });

        // New video button
        this.newVideoBtn.addEventListener('click', () => {
            this.reset();
        });

        // Modal close
        this.modalClose.addEventListener('click', () => {
            this.closeModal();
        });

        this.clipModal.addEventListener('click', (e) => {
            if (e.target === this.clipModal) {
                this.closeModal();
            }
        });

        // Download clip button
        this.downloadClipBtn.addEventListener('click', () => {
            this.downloadCurrentClip();
        });
    }

    handleVideoSelect(file) {
        if (!file.type.startsWith('video/')) {
            alert('Please select a video file');
            return;
        }

        // Warn about large files on mobile (memory constraints)
        const sizeMB = file.size / (1024 * 1024);
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && sizeMB > 100) {
            if (!confirm(`This video is ${sizeMB.toFixed(0)}MB. Large videos may cause issues on mobile devices. Continue anyway?`)) {
                return;
            }
        }

        this.videoFile = file;

        // Clean up previous video URL
        if (this.videoUrl) {
            URL.revokeObjectURL(this.videoUrl);
        }

        this.videoUrl = URL.createObjectURL(file);
        this.videoPlayer.src = this.videoUrl;

        // Wait for metadata to load
        this.videoPlayer.onloadedmetadata = () => {
            const duration = this.videoPlayer.duration;
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

            this.videoDuration.textContent = `Duration: ${VideoAnalyzer.formatTime(duration)}`;
            this.videoSize.textContent = `Size: ${sizeMB} MB`;

            this.showSection('preview');
        };
    }

    async analyzeVideo() {
        this.showSection('progress');
        this.updateProgress(0, 'Extracting frames...');

        try {
            // Extract frames
            const frames = await this.analyzer.extractFrames(
                this.videoPlayer,
                (progress) => {
                    const percent = Math.round((progress.current / progress.total) * 50);
                    this.updateProgress(percent, `Extracting frame ${progress.current}/${progress.total}...`);
                }
            );

            this.updateProgress(50, 'Analyzing frames with AI...');

            // Analyze frames
            const analysisResults = await this.analyzer.analyzeFrames(
                frames,
                (progress) => {
                    const percent = 50 + Math.round((progress.current / progress.total) * 45);
                    this.updateProgress(percent, `Analyzing frame ${progress.current}/${progress.total}...`);
                }
            );

            this.updateProgress(95, 'Detecting highlights...');

            // Detect highlights with user-selected duration
            const minDuration = parseInt(this.durationSelect.value) || 2;
            this.highlights = this.analyzer.detectHighlights(analysisResults, { minDuration });

            this.updateProgress(100, 'Complete!');

            // Show results after a brief delay
            setTimeout(() => {
                this.showResults();
            }, 500);

        } catch (error) {
            console.error('Analysis failed:', error);
            alert(`Analysis failed: ${error.message}`);
            this.showSection('preview');
        }
    }

    updateProgress(percent, text) {
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = text;
    }

    showResults() {
        this.showSection('results');

        const highlightCount = this.highlights.length;
        const totalDuration = this.highlights.reduce((sum, h) => sum + h.duration, 0);

        // Clear existing content
        this.highlightsList.replaceChildren();

        if (highlightCount === 0) {
            this.resultsSummary.textContent = 'No highlights detected. Try a video with more tennis action!';

            const noHighlights = document.createElement('div');
            noHighlights.className = 'no-highlights';

            const icon = document.createElement('div');
            icon.className = 'no-highlights-icon';
            icon.textContent = '🎾';

            const msg1 = document.createElement('p');
            msg1.textContent = 'No highlights found';

            const msg2 = document.createElement('p');
            msg2.textContent = 'Videos with active rallies (3+ shots) work best';

            noHighlights.appendChild(icon);
            noHighlights.appendChild(msg1);
            noHighlights.appendChild(msg2);
            this.highlightsList.appendChild(noHighlights);
        } else {
            this.resultsSummary.textContent =
                `Found ${highlightCount} highlight${highlightCount > 1 ? 's' : ''} (${Math.round(totalDuration)}s total)`;

            this.highlights.forEach((highlight, index) => {
                const card = this.createHighlightCard(highlight, index);
                this.highlightsList.appendChild(card);
            });
        }
    }

    createHighlightCard(highlight, index) {
        const card = document.createElement('div');
        card.className = 'highlight-card';
        card.dataset.index = index;

        const thumbnail = document.createElement('img');
        thumbnail.className = 'highlight-thumbnail';
        thumbnail.src = highlight.thumbnail;
        thumbnail.alt = `Highlight ${index + 1}`;

        const info = document.createElement('div');
        info.className = 'highlight-info';

        const time = document.createElement('div');
        time.className = 'highlight-time';
        time.textContent = `${VideoAnalyzer.formatTime(highlight.startTime)} - ${VideoAnalyzer.formatTime(highlight.endTime)}`;

        const duration = document.createElement('div');
        duration.className = 'highlight-duration';
        duration.textContent = `${highlight.duration.toFixed(1)}s duration`;

        info.appendChild(time);
        info.appendChild(duration);

        const score = document.createElement('div');
        score.className = 'highlight-score';

        const badge = document.createElement('div');
        badge.className = `score-badge ${highlight.avgIntensity >= 8 ? 'score-high' : 'score-medium'}`;
        badge.textContent = highlight.avgIntensity;

        const label = document.createElement('span');
        label.className = 'score-label';
        label.textContent = 'Intensity';

        score.appendChild(badge);
        score.appendChild(label);

        card.appendChild(thumbnail);
        card.appendChild(info);
        card.appendChild(score);

        card.addEventListener('click', () => {
            this.openHighlightModal(highlight);
        });

        return card;
    }

    showAnalysisView() {
        this.showSection('analysis');

        const results = this.analyzer.getAnalysisResults();

        // Clear and rebuild using DOM methods
        this.analysisGrid.replaceChildren();

        results.forEach(frame => {
            const card = this.createFrameCard(frame);
            this.analysisGrid.appendChild(card);
        });
    }

    createFrameCard(frame) {
        // Highlight if active rally or player engaged
        const isActive = frame.activeRally || frame.playerEngaged || frame.isActivePlay;

        const card = document.createElement('div');
        card.className = `frame-card ${isActive ? 'highlight' : ''}`;

        const img = document.createElement('img');
        img.className = 'frame-image';
        img.src = frame.imageData;
        img.alt = `Frame at ${frame.timestamp}s`;

        const info = document.createElement('div');
        info.className = 'frame-info';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'frame-time';
        timeSpan.textContent = VideoAnalyzer.formatTime(frame.timestamp);

        // Show status based on detection
        const statusSpan = document.createElement('span');
        if (frame.activeRally) {
            statusSpan.className = 'frame-score very-high';
            statusSpan.textContent = '🎾';
            statusSpan.title = 'Active rally';
        } else if (frame.playerEngaged) {
            statusSpan.className = 'frame-score high';
            statusSpan.textContent = '🏃';
            statusSpan.title = 'Player engaged';
        } else if (frame.smoothed) {
            statusSpan.className = 'frame-score medium';
            statusSpan.textContent = '~';
            statusSpan.title = 'Smoothed (filled gap)';
        } else {
            statusSpan.className = 'frame-score low';
            statusSpan.textContent = '—';
            statusSpan.title = 'Idle';
        }

        info.appendChild(timeSpan);
        info.appendChild(statusSpan);

        card.appendChild(img);
        card.appendChild(info);

        return card;
    }

    getScoreClass(score) {
        if (score >= 8) return 'very-high';
        if (score >= 6) return 'high';
        if (score >= 4) return 'medium';
        return 'low';
    }

    showResultsView() {
        this.showSection('results');
    }

    openHighlightModal(highlight) {
        this.currentHighlight = highlight;

        // Set video to highlight start
        this.clipPreview.src = this.videoUrl;
        this.clipPreview.currentTime = highlight.startTime;

        // Set time inputs
        this.clipStart.value = highlight.startTime.toFixed(1);
        this.clipEnd.value = highlight.endTime.toFixed(1);

        // Show modal and prevent body scroll on mobile
        this.clipModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Auto-pause at end time
        this.clipPreview.ontimeupdate = () => {
            if (this.clipPreview.currentTime >= parseFloat(this.clipEnd.value)) {
                this.clipPreview.pause();
            }
        };
    }

    closeModal() {
        this.clipModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.clipPreview.pause();
        this.clipPreview.src = '';
        this.currentHighlight = null;
    }

    async downloadCurrentClip() {
        if (!this.currentHighlight || !this.videoFile) return;

        const startTime = parseFloat(this.clipStart.value);
        const endTime = parseFloat(this.clipEnd.value);

        this.downloadClipBtn.disabled = true;
        this.downloadClipBtn.textContent = 'Loading...';

        try {
            const clipResult = await this.clipGenerator.extractClip(
                this.videoFile,
                startTime,
                endTime,
                (progress) => {
                    this.downloadClipBtn.textContent = `Processing ${progress}%`;
                }
            );

            const filename = `tennis-highlight-${VideoAnalyzer.formatTime(startTime).replace(':', '-')}.mp4`;

            // Try to share (for mobile) or download
            await this.clipGenerator.shareClip(clipResult, filename);

            this.downloadClipBtn.textContent = 'Download Clip';
            this.downloadClipBtn.disabled = false;

        } catch (error) {
            console.error('Clip download failed:', error);
            alert(`Failed to create clip: ${error.message}`);
            this.downloadClipBtn.textContent = 'Download Clip';
            this.downloadClipBtn.disabled = false;
        }
    }

    showSection(section) {
        // Hide all sections
        this.uploadSection.classList.add('hidden');
        this.previewSection.classList.add('hidden');
        this.progressSection.classList.add('hidden');
        this.resultsSection.classList.add('hidden');
        this.analysisSection.classList.add('hidden');

        // Show requested section
        switch (section) {
            case 'upload':
                this.uploadSection.classList.remove('hidden');
                break;
            case 'preview':
                this.previewSection.classList.remove('hidden');
                break;
            case 'progress':
                this.progressSection.classList.remove('hidden');
                break;
            case 'results':
                this.resultsSection.classList.remove('hidden');
                break;
            case 'analysis':
                this.analysisSection.classList.remove('hidden');
                break;
        }
    }

    reset() {
        // Clean up
        if (this.videoUrl) {
            URL.revokeObjectURL(this.videoUrl);
            this.videoUrl = null;
        }
        this.videoFile = null;
        this.highlights = [];
        this.currentHighlight = null;

        // Reset UI
        this.videoInput.value = '';
        this.videoPlayer.src = '';
        this.highlightsList.replaceChildren();
        this.analysisGrid.replaceChildren();

        this.showSection('upload');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TennisHighlightApp();
});
