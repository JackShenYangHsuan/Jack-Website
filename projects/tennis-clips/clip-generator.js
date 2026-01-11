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
        // Also check that the FFmpeg globals are available
        return typeof SharedArrayBuffer !== 'undefined' &&
               typeof FFmpegWASM !== 'undefined' &&
               typeof FFmpegUtil !== 'undefined' &&
               !this.loadFailed;
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

        // Check if FFmpeg globals are available
        if (typeof FFmpegWASM === 'undefined' || typeof FFmpegUtil === 'undefined') {
            console.warn('FFmpeg libraries not loaded');
            this.loadFailed = true;
            return false;
        }

        try {
            const { FFmpeg } = FFmpegWASM;
            const { fetchFile } = FFmpegUtil;

            this.ffmpeg = new FFmpeg();
            this.fetchFile = fetchFile;

            // Load FFmpeg core with timeout for slow mobile connections
            // Version must match @ffmpeg/ffmpeg version loaded in index.html
            const loadPromise = this.ffmpeg.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
                classWorkerURL: 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/umd/814.ffmpeg.js'
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
        try {
            const blob = clipResult.blob || clipResult;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            // Clean up after a short delay to ensure download starts
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Download failed:', error);
            throw new Error('Failed to download clip: ' + error.message);
        }
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

        // Log fallback status for debugging
        if (isFallback) {
            console.log('Using fallback mode:', message);
        }

        // Check if Web Share API with files is available
        if (!navigator.canShare) {
            console.log('Web Share API not available, downloading instead');
            this.downloadClip(blob, filename);
            return false;
        }

        try {
            // Convert to proper File object if needed
            // Handle both File and Blob inputs
            let file;
            if (blob instanceof File) {
                // Already a File, but may need to rename
                file = new File([blob], filename, { type: blob.type || 'video/mp4' });
            } else {
                file = new File([blob], filename, { type: 'video/mp4' });
            }

            // Check if can share files
            if (!navigator.canShare({ files: [file] })) {
                console.log('Cannot share files on this device, downloading instead');
                this.downloadClip(blob, filename);
                return false;
            }

            // Attempt share
            await navigator.share({
                files: [file],
                title: 'Tennis Highlight',
                text: isFallback
                    ? 'Tennis video (you can trim it in Photos)'
                    : 'Check out this tennis highlight!'
            });
            return true;

        } catch (error) {
            // User cancelled - not an error
            if (error.name === 'AbortError') {
                console.log('Share cancelled by user');
                return false;
            }

            // Other errors - fall back to download
            console.error('Share failed:', error);
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
