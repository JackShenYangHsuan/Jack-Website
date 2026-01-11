/**
 * Clip Generator - Uses FFmpeg.wasm to extract video clips
 */

class ClipGenerator {
    constructor() {
        this.ffmpeg = null;
        this.loaded = false;
    }

    /**
     * Load FFmpeg.wasm
     */
    async load() {
        if (this.loaded) return;

        const { FFmpeg } = FFmpegWASM;
        const { fetchFile } = FFmpegUtil;

        this.ffmpeg = new FFmpeg();
        this.fetchFile = fetchFile;

        // Load FFmpeg core
        await this.ffmpeg.load({
            coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
            wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm'
        });

        this.loaded = true;
        console.log('FFmpeg loaded');
    }

    /**
     * Extract a clip from the video
     */
    async extractClip(videoFile, startTime, endTime, onProgress) {
        if (!this.loaded) {
            await this.load();
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

            // Run FFmpeg to extract clip
            await this.ffmpeg.exec([
                '-i', inputFileName,
                '-ss', startTime.toString(),
                '-t', duration.toString(),
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-movflags', '+faststart',
                '-preset', 'ultrafast',
                outputFileName
            ]);

            // Read output file
            const outputData = await this.ffmpeg.readFile(outputFileName);

            // Clean up
            await this.ffmpeg.deleteFile(inputFileName);
            await this.ffmpeg.deleteFile(outputFileName);

            // Create blob URL
            const blob = new Blob([outputData], { type: 'video/mp4' });
            return blob;

        } catch (error) {
            console.error('Clip extraction failed:', error);
            throw error;
        }
    }

    /**
     * Download clip as file
     */
    downloadClip(blob, filename = 'tennis-highlight.mp4') {
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
     */
    async shareClip(blob, filename = 'tennis-highlight.mp4') {
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
                    text: 'Check out this tennis highlight!'
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
