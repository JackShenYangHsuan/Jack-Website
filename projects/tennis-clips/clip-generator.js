/**
 * Clip Generator - Uses FFmpeg.wasm to extract video clips
 * Falls back to simple video sharing on mobile when FFmpeg isn't available
 */

class ClipGenerator {
    constructor() {
        this.ffmpeg = null;
        this.loaded = false;
        this.loadFailed = false;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    /**
     * Check if FFmpeg.wasm can work in this environment
     */
    canUseFFmpeg() {
        // SharedArrayBuffer is required for FFmpeg.wasm
        return typeof SharedArrayBuffer !== 'undefined' && !this.loadFailed;
    }

    /**
     * Load FFmpeg.wasm
     */
    async load() {
        if (this.loaded) return true;
        if (this.loadFailed) return false;

        // Check for SharedArrayBuffer support (required for FFmpeg.wasm)
        if (typeof SharedArrayBuffer === 'undefined') {
            console.warn('SharedArrayBuffer not available - FFmpeg.wasm requires cross-origin isolation headers');
            this.loadFailed = true;
            return false;
        }

        try {
            const { FFmpeg } = FFmpegWASM;
            const { fetchFile } = FFmpegUtil;

            this.ffmpeg = new FFmpeg();
            this.fetchFile = fetchFile;

            // Load FFmpeg core with timeout for slow mobile connections
            const loadPromise = this.ffmpeg.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm'
            });

            // 30 second timeout for loading
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('FFmpeg load timeout')), 30000)
            );

            await Promise.race([loadPromise, timeoutPromise]);

            this.loaded = true;
            console.log('FFmpeg loaded');
            return true;
        } catch (error) {
            console.error('FFmpeg load failed:', error);
            this.loadFailed = true;
            return false;
        }
    }

    /**
     * Extract a clip from the video
     * Falls back to sharing original file if FFmpeg isn't available
     */
    async extractClip(videoFile, startTime, endTime, onProgress) {
        // Try to load FFmpeg
        const ffmpegAvailable = await this.load();

        if (!ffmpegAvailable) {
            // Fallback: return the original file with clip metadata
            // The share dialog will share the full video (user can trim in Photos app)
            console.log('FFmpeg not available, using fallback');
            if (onProgress) onProgress(100);
            return {
                blob: videoFile,
                isFallback: true,
                startTime,
                endTime,
                message: 'Clip trimming not available. Sharing full video - you can trim it in Photos.'
            };
        }

        const inputFileName = 'input.mp4';
        const outputFileName = 'output.mp4';

        try {
            // Write input file to FFmpeg virtual filesystem
            const videoData = await this.fetchFile(videoFile);
            await this.ffmpeg.writeFile(inputFileName, videoData);

            // Set up progress handler
            if (onProgress) {
                this.ffmpeg.on('progress', ({ progress }) => {
                    onProgress(Math.round(progress * 100));
                });
            }

            // Calculate duration
            const duration = endTime - startTime;

            // Run FFmpeg to extract clip - use copy codecs on mobile for faster processing
            const ffmpegArgs = this.isMobile
                ? [
                    '-ss', startTime.toString(),
                    '-i', inputFileName,
                    '-t', duration.toString(),
                    '-c', 'copy',
                    '-movflags', '+faststart',
                    outputFileName
                ]
                : [
                    '-i', inputFileName,
                    '-ss', startTime.toString(),
                    '-t', duration.toString(),
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-movflags', '+faststart',
                    '-preset', 'ultrafast',
                    outputFileName
                ];

            await this.ffmpeg.exec(ffmpegArgs);

            // Read output file
            const outputData = await this.ffmpeg.readFile(outputFileName);

            // Clean up
            await this.ffmpeg.deleteFile(inputFileName);
            await this.ffmpeg.deleteFile(outputFileName);

            // Create blob
            const blob = new Blob([outputData], { type: 'video/mp4' });
            return { blob, isFallback: false };

        } catch (error) {
            console.error('Clip extraction failed:', error);

            // On failure, fall back to original file
            if (onProgress) onProgress(100);
            return {
                blob: videoFile,
                isFallback: true,
                startTime,
                endTime,
                message: 'Clip extraction failed. Sharing full video.'
            };
        }
    }

    /**
     * Download clip as file
     * Accepts either a blob directly or an object { blob, isFallback }
     */
    downloadClip(clipResult, filename = 'tennis-highlight.mp4') {
        const blob = clipResult.blob || clipResult;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Share clip using Web Share API (for mobile camera roll save)
     * Accepts either a blob directly or an object { blob, isFallback, message }
     */
    async shareClip(clipResult, filename = 'tennis-highlight.mp4') {
        // Handle both blob and { blob, isFallback } formats
        const blob = clipResult.blob || clipResult;
        const isFallback = clipResult.isFallback || false;
        const message = clipResult.message || '';

        // Show warning if using fallback
        if (isFallback && message) {
            alert(message);
        }

        if (!navigator.canShare) {
            // Fallback to download
            this.downloadClip(blob, filename);
            return false;
        }

        const file = new File([blob], filename, { type: 'video/mp4' });

        if (navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Tennis Highlight',
                    text: isFallback
                        ? 'Tennis video (trim in Photos app)'
                        : 'Check out this tennis highlight!'
                });
                return true;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                    // Fallback to download
                    this.downloadClip(blob, filename);
                }
                return false;
            }
        } else {
            // Fallback to download
            this.downloadClip(blob, filename);
            return false;
        }
    }

    /**
     * Create a preview URL for a clip (without full extraction)
     * Uses MediaSource for seeking
     */
    createPreviewUrl(videoFile, startTime, endTime) {
        const url = URL.createObjectURL(videoFile);
        return {
            url,
            startTime,
            endTime,
            cleanup: () => URL.revokeObjectURL(url)
        };
    }
}

// Export for use in app.js
window.ClipGenerator = ClipGenerator;
