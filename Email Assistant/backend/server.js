/**
 * Gmail Auto-Tagger - Backend Server
 * Express API server for managing Gmail auto-tagging with AI-powered rules
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const rulesRoutes = require('./routes/rules');
const gmailRoutes = require('./routes/gmail');
const processingRoutes = require('./routes/processing');
const autoProcessingRoutes = require('./routes/autoProcessing');

// Import services
const aiMatcher = require('./services/aiMatcher');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'gmail-auto-tagger-backend'
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/process', processingRoutes);
app.use('/api/auto-process', autoProcessingRoutes);

// Cache management endpoint
app.post('/api/cache/clear', (req, res) => {
  try {
    aiMatcher.clearCache();
    const stats = aiMatcher.getCacheStats();
    res.json({
      success: true,
      message: 'AI matcher cache cleared successfully',
      stats
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Gmail webhook endpoint (for Pub/Sub push notifications)
app.post('/webhook/gmail', async (req, res) => {
  console.log('Gmail webhook received');

  // Acknowledge receipt immediately (Pub/Sub requires response within 10 seconds)
  res.status(200).send('OK');

  // Process the notification asynchronously
  try {
    const { message } = req.body;
    if (message && message.data) {
      const decodedData = Buffer.from(message.data, 'base64').toString();
      const notification = JSON.parse(decodedData);

      console.log('Gmail notification:', notification);

      // The notification contains the email address and historyId
      // We would need to:
      // 1. Find the user by email
      // 2. Get their OpenAI API key (from request or storage)
      // 3. Fetch new messages using history API
      // 4. Process each new message

      // Note: This is a simplified webhook handler
      // In production, you'd use the Gmail History API to efficiently
      // fetch only new/modified messages since the last historyId
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Don't throw - webhook already acknowledged
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`Gmail Auto-Tagger Backend Server`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('=================================');
});

module.exports = app;
