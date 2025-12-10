const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import services
const youtubeService = require('./services/youtubeService');
const openaiService = require('./services/openaiService');
const dalleService = require('./services/dalleService');
const imageService = require('./services/imageService');

// Import utilities
const { validateYouTubeUrlMiddleware } = require('./utils/validation');
const { generateLimiter, apiLimiter } = require('./utils/rateLimiter');
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files from parent directory
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));

// Apply general API rate limiter to all /api routes
app.use('/api', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'YouTube Quote Card Generator API'
  });
});

/**
 * Extract quotes from YouTube URL (Step 1 of workflow)
 * POST /api/extract-quotes
 * Body: { youtubeUrl: string }
 * Response: { success: boolean, data: { quotes: string[] } }
 */
app.post('/api/extract-quotes', generateLimiter, validateYouTubeUrlMiddleware, async (req, res) => {
  const startTime = Date.now();

  try {
    // Extract YouTube URL from request body
    const { youtubeUrl } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        error: 'YouTube URL is required'
      });
    }

    console.log(`\n========================================`);
    console.log(`Extracting quotes from: ${youtubeUrl}`);
    console.log(`========================================\n`);

    // Step 1: Extract transcript from YouTube video
    console.log('Step 1: Extracting transcript...');
    const transcript = await youtubeService.extractTranscript(youtubeUrl);

    // Step 2: Extract 10 quotes using GPT-4
    console.log('\nStep 2: Extracting 10 quotes with GPT-4...');
    const quotes = await openaiService.extractQuotes(transcript);

    // Calculate processing time
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✓ Quote extraction complete in ${processingTime} seconds`);
    console.log(`  - Quotes extracted: ${quotes.length}`);
    console.log(`========================================\n`);

    // Return success response
    res.json({
      success: true,
      data: {
        quotes,
        processingTime: `${processingTime}s`
      }
    });

  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error(`\n✗ Error after ${processingTime} seconds:`);
    console.error(error.message);
    console.error(`========================================\n`);

    // Determine appropriate HTTP status code
    let statusCode = 500;
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      statusCode = 400; // Bad Request
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      statusCode = 429; // Too Many Requests
    } else if (error.message.includes('API key')) {
      statusCode = 401; // Unauthorized
    }

    res.status(statusCode).json({
      success: false,
      error: error.message,
      processingTime: `${processingTime}s`
    });
  }
});

/**
 * Generate quote cards from selected quotes and style
 * POST /api/generate
 * Body: { selectedQuotes: string[], selectedStyle: string }
 * Response: { success: boolean, data: { quotes: string[], images: string[] } }
 */
app.post('/api/generate', generateLimiter, async (req, res) => {
  const startTime = Date.now();

  try {
    // Extract parameters from request body
    const { selectedQuotes, selectedStyle } = req.body;

    // Validate selectedQuotes
    if (!selectedQuotes || !Array.isArray(selectedQuotes)) {
      return res.status(400).json({
        success: false,
        error: 'selectedQuotes must be an array'
      });
    }

    if (selectedQuotes.length < 3 || selectedQuotes.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'You must select between 3 and 5 quotes'
      });
    }

    // Validate all quotes are non-empty strings
    const invalidQuotes = selectedQuotes.filter(q => !q || typeof q !== 'string' || q.trim().length === 0);
    if (invalidQuotes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'All selected quotes must be non-empty strings'
      });
    }

    // Validate selectedStyle
    const validStyles = ['Modern Minimal', 'Bold Gradient', 'Dark Mode Elegant', 'Magazine Style', 'Tech Startup'];
    if (!selectedStyle || !validStyles.includes(selectedStyle)) {
      return res.status(400).json({
        success: false,
        error: `selectedStyle must be one of: ${validStyles.join(', ')}`
      });
    }

    console.log(`\n========================================`);
    console.log(`Generating quote cards`);
    console.log(`  - Quotes: ${selectedQuotes.length}`);
    console.log(`  - Style: ${selectedStyle}`);
    console.log(`========================================\n`);

    // Step 1: Generate quote cards using DALL-E 3 with selected style (parallel)
    console.log('Step 1: Generating quote cards with DALL-E 3...');
    const imageUrls = await dalleService.generateAllCards(selectedQuotes, selectedStyle);

    // Step 2: Download and process images (resize to 1080x1080)
    console.log('\nStep 2: Processing images...');
    const imageBuffers = await imageService.processMultipleImages(imageUrls);

    // Step 3: Convert to base64 for frontend display
    console.log('\nStep 3: Converting to base64...');
    const base64Images = imageService.buffersToBase64(imageBuffers);

    // Calculate processing time
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✓ Processing complete in ${processingTime} seconds`);
    console.log(`  - Quotes used: ${selectedQuotes.length}`);
    console.log(`  - Images generated: ${base64Images.length}`);
    console.log(`========================================\n`);

    // Return success response
    res.json({
      success: true,
      data: {
        quotes: selectedQuotes,
        images: base64Images,
        processingTime: `${processingTime}s`
      }
    });

  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error(`\n✗ Error after ${processingTime} seconds:`);
    console.error(error.message);
    console.error(`========================================\n`);

    // Determine appropriate HTTP status code
    let statusCode = 500;
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      statusCode = 400; // Bad Request
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      statusCode = 429; // Too Many Requests
    } else if (error.message.includes('API key')) {
      statusCode = 401; // Unauthorized
    }

    res.status(statusCode).json({
      success: false,
      error: error.message,
      processingTime: `${processingTime}s`
    });
  }
});

/**
 * Get available design styles
 * GET /api/styles
 */
app.get('/api/styles', (req, res) => {
  const styles = dalleService.getDesignStyles();
  res.json({
    success: true,
    data: styles
  });
});

/**
 * 404 handler for unknown routes
 */
app.use(notFoundHandler);

/**
 * Global error handler
 */
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 YouTube Quote Card Generator API`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\nReady to generate quote cards!\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});
