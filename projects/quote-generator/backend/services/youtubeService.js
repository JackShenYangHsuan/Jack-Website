const { Innertube } = require('youtubei.js');

/**
 * Extract video ID from various YouTube URL formats
 * @param {string} url - YouTube video URL
 * @returns {string|null} - Video ID or null if invalid
 */
function extractVideoId(url) {
  try {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting video ID:', error);
    return null;
  }
}

/**
 * Extract transcript from YouTube video using youtubei.js
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<string>} - Transcript text
 */
async function extractTranscript(videoUrl) {
  try {
    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }

    console.log(`Extracting transcript for video ID: ${videoId}`);

    // Initialize Innertube client
    const youtube = await Innertube.create();

    // Get video info
    const info = await youtube.getInfo(videoId);

    // Get transcript
    const transcriptData = await info.getTranscript();

    if (!transcriptData || !transcriptData.transcript) {
      throw new Error('No transcript available for this video');
    }

    // Extract transcript content
    const segments = transcriptData.transcript.content.body.initial_segments;

    if (!segments || segments.length === 0) {
      throw new Error('Transcript is empty');
    }

    // Combine all transcript segments into a single text
    const fullTranscript = segments
      .map(segment => segment.snippet.text)
      .filter(text => text) // Remove empty segments
      .join(' ')
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    if (fullTranscript.length === 0) {
      throw new Error('Transcript is empty');
    }

    console.log(`✓ Transcript extracted successfully (${fullTranscript.length} characters)`);
    return fullTranscript;

  } catch (error) {
    console.error('Error extracting transcript:', error.message);

    // Provide more specific error messages
    if (error.message.includes('No transcript available') || error.message.includes('Transcript is empty')) {
      throw new Error('No transcript available for this video. Please try a video with captions enabled.');
    } else if (error.message.includes('Invalid YouTube URL')) {
      throw new Error('Invalid YouTube URL format. Please provide a valid YouTube video link.');
    } else if (error.message.includes('Video unavailable')) {
      throw new Error('This video is unavailable or private.');
    } else {
      throw new Error(`Failed to extract transcript: ${error.message}`);
    }
  }
}

/**
 * Get video metadata (optional - for future use)
 * @param {string} videoUrl - YouTube video URL
 * @returns {Object} - Video metadata
 */
function getVideoMetadata(videoUrl) {
  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    return null;
  }

  return {
    videoId,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`
  };
}

module.exports = {
  extractTranscript,
  extractVideoId,
  getVideoMetadata
};
