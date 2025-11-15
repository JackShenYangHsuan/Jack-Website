/**
 * Email Processing Routes
 * Endpoints for triggering email processing and viewing stats
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const emailProcessor = require('../services/emailProcessor');

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/process/initial
 * Process initial batch of emails (last 30 days)
 */
router.post('/initial', async (req, res) => {
  try {
    const { openaiApiKey, maxEmails = 100 } = req.body;

    if (!openaiApiKey) {
      return res.status(400).json({
        error: {
          message: 'OpenAI API key is required',
          status: 400
        }
      });
    }

    // Trigger initial processing (this can take a while)
    const result = await emailProcessor.processInitialEmails(
      req.user.id,
      openaiApiKey,
      maxEmails
    );

    res.json(result);

  } catch (error) {
    console.error('Initial processing error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process initial emails',
        status: 500,
        details: error.message
      }
    });
  }
});

/**
 * POST /api/process/email/:emailId
 * Process a single email
 */
router.post('/email/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { openaiApiKey } = req.body;

    if (!openaiApiKey) {
      return res.status(400).json({
        error: {
          message: 'OpenAI API key is required',
          status: 400
        }
      });
    }

    const result = await emailProcessor.processEmailWithRetry(
      req.user.id,
      emailId,
      openaiApiKey
    );

    res.json(result);

  } catch (error) {
    console.error('Email processing error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process email',
        status: 500,
        details: error.message
      }
    });
  }
});

/**
 * POST /api/process/batch
 * Process multiple emails in batch
 */
router.post('/batch', async (req, res) => {
  try {
    const { emailIds, openaiApiKey } = req.body;

    if (!emailIds || !Array.isArray(emailIds)) {
      return res.status(400).json({
        error: {
          message: 'emailIds array is required',
          status: 400
        }
      });
    }

    if (!openaiApiKey) {
      return res.status(400).json({
        error: {
          message: 'OpenAI API key is required',
          status: 400
        }
      });
    }

    const result = await emailProcessor.processBatch(
      req.user.id,
      emailIds,
      openaiApiKey
    );

    res.json(result);

  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process batch',
        status: 500,
        details: error.message
      }
    });
  }
});

/**
 * GET /api/process/stats
 * Get tagging statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await emailProcessor.getTaggingStats(
      req.user.id,
      parseInt(days)
    );

    res.json(stats);

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch statistics',
        status: 500
      }
    });
  }
});

/**
 * POST /api/process/test
 * Test rules against recent emails (dry-run mode - doesn't apply labels)
 */
router.post('/test', async (req, res) => {
  try {
    const { openaiApiKey, maxEmails = 10 } = req.body;

    if (!openaiApiKey) {
      return res.status(400).json({
        error: {
          message: 'OpenAI API key is required',
          status: 400
        }
      });
    }

    // Test rules without applying labels
    const result = await emailProcessor.testRules(
      req.user.id,
      openaiApiKey,
      maxEmails
    );

    res.json(result);

  } catch (error) {
    console.error('Test rules error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to test rules',
        status: 500,
        details: error.message
      }
    });
  }
});

/**
 * POST /api/process/thread/:threadId
 * Re-evaluate and process an entire email thread
 */
router.post('/thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { openaiApiKey } = req.body;

    if (!openaiApiKey) {
      return res.status(400).json({
        error: {
          message: 'OpenAI API key is required',
          status: 400
        }
      });
    }

    const result = await emailProcessor.processThread(
      req.user.id,
      threadId,
      openaiApiKey
    );

    res.json(result);

  } catch (error) {
    console.error('Thread processing error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process thread',
        status: 500,
        details: error.message
      }
    });
  }
});

module.exports = router;
