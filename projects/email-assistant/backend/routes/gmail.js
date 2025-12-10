/**
 * Gmail Routes
 * Endpoints for interacting with Gmail API (labels, etc.)
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const gmailService = require('../services/gmailService');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/gmail/labels
 * Get all Gmail labels for the user
 */
router.get('/labels', async (req, res) => {
  try {
    const labels = await gmailService.listLabels(req.user.id);

    res.json({
      labels: labels.map(label => ({
        id: label.id,
        name: label.name,
        type: label.type
      }))
    });
  } catch (error) {
    console.error('List labels error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch Gmail labels',
        status: 500,
        details: error.message
      }
    });
  }
});

/**
 * POST /api/gmail/labels
 * Create a new Gmail label
 */
router.post('/labels', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: {
          message: 'Label name is required',
          status: 400
        }
      });
    }

    const label = await gmailService.createLabel(req.user.id, name);

    res.status(201).json({
      message: 'Label created successfully',
      label: {
        id: label.id,
        name: label.name
      }
    });
  } catch (error) {
    console.error('Create label error:', error);

    // Handle duplicate label error
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({
        error: {
          message: 'A label with this name already exists',
          status: 409
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to create Gmail label',
        status: 500,
        details: error.message
      }
    });
  }
});

module.exports = router;
