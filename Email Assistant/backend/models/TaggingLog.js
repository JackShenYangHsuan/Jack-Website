/**
 * TaggingLog Model
 * Handles database operations for tagging_logs table
 */

const db = require('../config/database');

class TaggingLog {
  /**
   * Create a new tagging log entry
   * @param {string} userId - User's UUID
   * @param {string} emailId - Gmail email ID
   * @param {string} appliedLabel - Label that was applied
   * @param {string} matchedRuleId - UUID of the matched rule
   * @param {number} confidenceScore - AI confidence score (0-1)
   * @returns {object} Created log entry
   */
  static async create(userId, emailId, appliedLabel, matchedRuleId, confidenceScore) {
    const query = `
      INSERT INTO tagging_logs (user_id, email_id, applied_label, matched_rule_id, confidence_score)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, email_id, applied_label, matched_rule_id, confidence_score, timestamp
    `;

    const result = await db.query(query, [
      userId,
      emailId,
      appliedLabel,
      matchedRuleId,
      confidenceScore
    ]);

    return result.rows[0];
  }

  /**
   * Find all logs for a user
   * @param {string} userId - User's UUID
   * @param {number} limit - Maximum number of logs to return
   * @param {number} offset - Number of logs to skip
   * @returns {array} Array of log objects
   */
  static async findByUserId(userId, limit = 100, offset = 0) {
    const query = `
      SELECT tl.id, tl.user_id, tl.email_id, tl.applied_label,
             tl.matched_rule_id, tl.confidence_score, tl.timestamp,
             r.rule_description
      FROM tagging_logs tl
      LEFT JOIN rules r ON tl.matched_rule_id = r.id
      WHERE tl.user_id = $1
      ORDER BY tl.timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Find logs for a specific email
   * @param {string} emailId - Gmail email ID
   * @returns {array} Array of log objects
   */
  static async findByEmailId(emailId) {
    const query = `
      SELECT tl.id, tl.user_id, tl.email_id, tl.applied_label,
             tl.matched_rule_id, tl.confidence_score, tl.timestamp,
             r.rule_description
      FROM tagging_logs tl
      LEFT JOIN rules r ON tl.matched_rule_id = r.id
      WHERE tl.email_id = $1
      ORDER BY tl.timestamp DESC
    `;

    const result = await db.query(query, [emailId]);
    return result.rows;
  }

  /**
   * Find logs for a specific rule
   * @param {string} ruleId - Rule's UUID
   * @param {number} limit - Maximum number of logs to return
   * @returns {array} Array of log objects
   */
  static async findByRuleId(ruleId, limit = 100) {
    const query = `
      SELECT id, user_id, email_id, applied_label, matched_rule_id,
             confidence_score, timestamp
      FROM tagging_logs
      WHERE matched_rule_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await db.query(query, [ruleId, limit]);
    return result.rows;
  }

  /**
   * Get tagging statistics for a user
   * @param {string} userId - User's UUID
   * @returns {object} Statistics object with counts and averages
   */
  static async getStats(userId) {
    const query = `
      SELECT
        COUNT(*) as total_tagged,
        COUNT(DISTINCT email_id) as unique_emails,
        AVG(confidence_score) as avg_confidence,
        MIN(timestamp) as first_tag,
        MAX(timestamp) as last_tag
      FROM tagging_logs
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get tagging statistics by label
   * @param {string} userId - User's UUID
   * @returns {array} Array of label statistics
   */
  static async getStatsByLabel(userId) {
    const query = `
      SELECT
        applied_label,
        COUNT(*) as count,
        AVG(confidence_score) as avg_confidence
      FROM tagging_logs
      WHERE user_id = $1
      GROUP BY applied_label
      ORDER BY count DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Delete logs older than a specific date
   * @param {string} userId - User's UUID
   * @param {Date} beforeDate - Delete logs before this date
   * @returns {number} Number of deleted logs
   */
  static async deleteOldLogs(userId, beforeDate) {
    const query = `
      DELETE FROM tagging_logs
      WHERE user_id = $1 AND timestamp < $2
    `;

    const result = await db.query(query, [userId, beforeDate]);
    return result.rowCount;
  }

  /**
   * Check if an email has already been tagged
   * @param {string} emailId - Gmail email ID
   * @returns {boolean} True if email has been tagged before
   */
  static async isEmailTagged(emailId) {
    const query = `
      SELECT id
      FROM tagging_logs
      WHERE email_id = $1
      LIMIT 1
    `;

    const result = await db.query(query, [emailId]);
    return result.rows.length > 0;
  }
}

module.exports = TaggingLog;
