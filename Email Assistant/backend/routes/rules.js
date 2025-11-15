/**
 * Rules Routes
 * CRUD operations for tagging rules
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/rules
 * Get all rules for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, label_name, rule_description, priority, is_active,
              label_bg_color, label_text_color, rule_type, created_at, updated_at
       FROM rules
       WHERE user_id = $1
       ORDER BY rule_type ASC, priority DESC, created_at DESC`,
      [req.user.id]
    );

    res.json({
      rules: result.rows
    });
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch rules',
        status: 500
      }
    });
  }
});

/**
 * GET /api/rules/:id
 * Get a specific rule by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, label_name, rule_description, priority, is_active,
              label_bg_color, label_text_color, rule_type, created_at, updated_at
       FROM rules
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Rule not found',
          status: 404
        }
      });
    }

    res.json({
      rule: result.rows[0]
    });
  } catch (error) {
    console.error('Get rule error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch rule',
        status: 500
      }
    });
  }
});

/**
 * POST /api/rules
 * Create a new tagging rule
 */
router.post('/', async (req, res) => {
  try {
    const {
      label_name,
      rule_description,
      priority = 5,
      is_active = true,
      label_bg_color,
      label_text_color,
      rule_type = 'received'
    } = req.body;

    // Validation
    if (!label_name || !rule_description) {
      return res.status(400).json({
        error: {
          message: 'Label name and rule description are required',
          status: 400
        }
      });
    }

    if (priority < 1 || priority > 10) {
      return res.status(400).json({
        error: {
          message: 'Priority must be between 1 and 10',
          status: 400
        }
      });
    }

    if (!['sent', 'received'].includes(rule_type)) {
      return res.status(400).json({
        error: {
          message: 'Rule type must be either "sent" or "received"',
          status: 400
        }
      });
    }

    // Check for duplicate rule (now includes rule_type)
    const duplicate = await db.query(
      'SELECT id FROM rules WHERE user_id = $1 AND label_name = $2 AND rule_description = $3 AND rule_type = $4',
      [req.user.id, label_name, rule_description, rule_type]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        error: {
          message: 'A rule with this label, description, and type already exists',
          status: 409
        }
      });
    }

    // Insert new rule with color information and rule_type
    const result = await db.query(
      `INSERT INTO rules (user_id, label_name, rule_description, priority, is_active, label_bg_color, label_text_color, rule_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, label_name, rule_description, priority, is_active, label_bg_color, label_text_color, rule_type, created_at, updated_at`,
      [req.user.id, label_name, rule_description, priority, is_active, label_bg_color || null, label_text_color || null, rule_type]
    );

    res.status(201).json({
      message: 'Rule created successfully',
      rule: result.rows[0]
    });
  } catch (error) {
    console.error('Create rule error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to create rule',
        status: 500
      }
    });
  }
});

/**
 * PUT /api/rules/:id
 * Update an existing rule
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { label_name, rule_description, priority, is_active, label_bg_color, label_text_color, rule_type } = req.body;

    // Check if rule exists and belongs to user
    const existing = await db.query(
      'SELECT id FROM rules WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Rule not found',
          status: 404
        }
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (label_name !== undefined) {
      updates.push(`label_name = $${paramCount++}`);
      values.push(label_name);
    }

    if (rule_description !== undefined) {
      updates.push(`rule_description = $${paramCount++}`);
      values.push(rule_description);
    }

    if (priority !== undefined) {
      if (priority < 1 || priority > 10) {
        return res.status(400).json({
          error: {
            message: 'Priority must be between 1 and 10',
            status: 400
          }
        });
      }
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (label_bg_color !== undefined) {
      updates.push(`label_bg_color = $${paramCount++}`);
      values.push(label_bg_color || null);
    }

    if (label_text_color !== undefined) {
      updates.push(`label_text_color = $${paramCount++}`);
      values.push(label_text_color || null);
    }

    if (rule_type !== undefined) {
      if (!['sent', 'received'].includes(rule_type)) {
        return res.status(400).json({
          error: {
            message: 'Rule type must be either "sent" or "received"',
            status: 400
          }
        });
      }
      updates.push(`rule_type = $${paramCount++}`);
      values.push(rule_type);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: {
          message: 'No fields to update',
          status: 400
        }
      });
    }

    // Add id and user_id for WHERE clause
    values.push(id, req.user.id);

    const result = await db.query(
      `UPDATE rules SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING id, label_name, rule_description, priority, is_active, label_bg_color, label_text_color, rule_type, created_at, updated_at`,
      values
    );

    res.json({
      message: 'Rule updated successfully',
      rule: result.rows[0]
    });
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to update rule',
        status: 500
      }
    });
  }
});

/**
 * DELETE /api/rules/:id
 * Delete a rule
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM rules WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Rule not found',
          status: 404
        }
      });
    }

    res.json({
      message: 'Rule deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete rule',
        status: 500
      }
    });
  }
});

module.exports = router;
