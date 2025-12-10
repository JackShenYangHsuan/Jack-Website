/**
 * Auto-Processing Routes
 * API routes for managing automatic email processing
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const emailPoller = require('../services/emailPoller');

/**
 * POST /api/auto-process/start
 * Start automatic email processing for the current user
 */
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { openaiApiKey } = req.body;

    if (!openaiApiKey) {
      return res.status(400).json({
        error: {
          message: 'OpenAI API key required',
          status: 400
        }
      });
    }

    // Check if already polling
    if (emailPoller.isPolling(userId)) {
      return res.json({
        message: 'Auto-processing already active',
        status: emailPoller.getPollingStatus(userId)
      });
    }

    // Start polling
    emailPoller.startPolling(userId, openaiApiKey);

    res.json({
      message: 'Auto-processing started successfully',
      status: emailPoller.getPollingStatus(userId)
    });

  } catch (error) {
    console.error('Start auto-processing error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to start auto-processing',
        status: 500
      }
    });
  }
});

/**
 * POST /api/auto-process/stop
 * Stop automatic email processing for the current user
 */
router.post('/stop', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    emailPoller.stopPolling(userId);

    res.json({
      message: 'Auto-processing stopped successfully'
    });

  } catch (error) {
    console.error('Stop auto-processing error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to stop auto-processing',
        status: 500
      }
    });
  }
});

/**
 * GET /api/auto-process/status
 * Get auto-processing status for the current user
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = emailPoller.getPollingStatus(userId);

    res.json({
      isActive: status !== null,
      status: status
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get status',
        status: 500
      }
    });
  }
});

module.exports = router;
