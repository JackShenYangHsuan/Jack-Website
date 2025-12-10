/**
 * Validate YouTube URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
function validateYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=)[\w-]+/,
    /^(https?:\/\/)?(www\.)?(youtu\.be\/)[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/v\/[\w-]+/
  ];

  return patterns.some(pattern => pattern.test(url));
}

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 500); // Limit length
}

/**
 * Middleware to validate YouTube URL in request body
 */
function validateYouTubeUrlMiddleware(req, res, next) {
  const { youtubeUrl } = req.body;

  if (!youtubeUrl) {
    return res.status(400).json({
      success: false,
      error: 'YouTube URL is required in request body'
    });
  }

  if (!validateYouTubeUrl(youtubeUrl)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid YouTube URL format. Please provide a valid YouTube video link.'
    });
  }

  // Sanitize the URL
  req.body.youtubeUrl = sanitizeInput(youtubeUrl);

  next();
}

module.exports = {
  validateYouTubeUrl,
  sanitizeInput,
  validateYouTubeUrlMiddleware
};
