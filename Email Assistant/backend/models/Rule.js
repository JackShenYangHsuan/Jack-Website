/**
 * Rule Model
 * Handles database operations for rules table
 */

const db = require('../config/database');

class Rule {
  /**
   * Create a new tagging rule
   * @param {string} userId - User's UUID
   * @param {string} labelName - Gmail label name to apply
   * @param {string} ruleDescription - Natural language rule description
   * @param {number} priority - Rule priority (1-10)
   * @returns {object} Created rule object
   */
  static async create(userId, labelName, ruleDescription, priority = 5) {
    const query = `
      INSERT INTO rules (user_id, label_name, rule_description, priority, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, user_id, label_name, rule_description, priority, is_active, created_at, updated_at
    `;

    const result = await db.query(query, [userId, labelName, ruleDescription, priority]);
    return result.rows[0];
  }

  /**
   * Find all rules for a user
   * @param {string} userId - User's UUID
   * @param {boolean} activeOnly - If true, only return active rules
   * @returns {array} Array of rule objects
   */
  static async findByUserId(userId, activeOnly = false) {
    let query = `
      SELECT id, user_id, label_name, rule_description, priority, is_active, created_at, updated_at
      FROM rules
      WHERE user_id = $1
    `;

    if (activeOnly) {
      query += ' AND is_active = true';
    }

    query += ' ORDER BY priority DESC, created_at ASC';

    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Find rule by ID
   * @param {string} ruleId - Rule's UUID
   * @returns {object|null} Rule object or null if not found
   */
  static async findById(ruleId) {
    const query = `
      SELECT id, user_id, label_name, rule_description, priority, is_active, created_at, updated_at
      FROM rules
      WHERE id = $1
    `;

    const result = await db.query(query, [ruleId]);
    return result.rows[0] || null;
  }

  /**
   * Update a rule
   * @param {string} ruleId - Rule's UUID
   * @param {object} updates - Object containing fields to update
   * @returns {object} Updated rule object
   */
  static async update(ruleId, updates) {
    const allowedFields = ['label_name', 'rule_description', 'priority', 'is_active'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic SET clause
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(ruleId);

    const query = `
      UPDATE rules
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, user_id, label_name, rule_description, priority, is_active, created_at, updated_at
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a rule
   * @param {string} ruleId - Rule's UUID
   * @returns {boolean} True if deleted successfully
   */
  static async delete(ruleId) {
    const query = `DELETE FROM rules WHERE id = $1`;
    const result = await db.query(query, [ruleId]);
    return result.rowCount > 0;
  }

  /**
   * Toggle rule active status
   * @param {string} ruleId - Rule's UUID
   * @param {boolean} isActive - New active status
   * @returns {object} Updated rule object
   */
  static async toggleActive(ruleId, isActive) {
    const query = `
      UPDATE rules
      SET is_active = $1
      WHERE id = $2
      RETURNING id, user_id, label_name, rule_description, priority, is_active, created_at, updated_at
    `;

    const result = await db.query(query, [isActive, ruleId]);
    return result.rows[0];
  }

  /**
   * Check if a duplicate rule exists (same user, label, and description)
   * @param {string} userId - User's UUID
   * @param {string} labelName - Gmail label name
   * @param {string} ruleDescription - Rule description
   * @returns {boolean} True if duplicate exists
   */
  static async isDuplicate(userId, labelName, ruleDescription) {
    const query = `
      SELECT id
      FROM rules
      WHERE user_id = $1 AND label_name = $2 AND rule_description = $3
    `;

    const result = await db.query(query, [userId, labelName, ruleDescription]);
    return result.rows.length > 0;
  }

  /**
   * Get count of rules for a user
   * @param {string} userId - User's UUID
   * @returns {number} Number of rules
   */
  static async getCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM rules
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Rule;
