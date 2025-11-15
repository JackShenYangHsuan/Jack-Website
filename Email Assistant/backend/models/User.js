/**
 * User Model
 * Handles database operations for users table
 */

const db = require('../config/database');
const crypto = require('crypto');

class User {
  /**
   * Create a new user
   * @param {string} email - User's Gmail email address
   * @param {string} gmailTokenEncrypted - Encrypted Gmail OAuth refresh token
   * @returns {object} Created user object
   */
  static async create(email, gmailTokenEncrypted) {
    const query = `
      INSERT INTO users (email, gmail_token_encrypted)
      VALUES ($1, $2)
      RETURNING id, email, created_at, updated_at
    `;

    const result = await db.query(query, [email, gmailTokenEncrypted]);
    return result.rows[0];
  }

  /**
   * Find user by email
   * @param {string} email - User's email address
   * @returns {object|null} User object or null if not found
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, email, gmail_token_encrypted, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {string} userId - User's UUID
   * @returns {object|null} User object or null if not found
   */
  static async findById(userId) {
    const query = `
      SELECT id, email, gmail_token_encrypted, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update user's encrypted Gmail token
   * @param {string} userId - User's UUID
   * @param {string} gmailTokenEncrypted - New encrypted Gmail token
   * @returns {object} Updated user object
   */
  static async updateGmailToken(userId, gmailTokenEncrypted) {
    const query = `
      UPDATE users
      SET gmail_token_encrypted = $1
      WHERE id = $2
      RETURNING id, email, created_at, updated_at
    `;

    const result = await db.query(query, [gmailTokenEncrypted, userId]);
    return result.rows[0];
  }

  /**
   * Delete user and all associated data (cascades to rules and logs)
   * @param {string} userId - User's UUID
   * @returns {boolean} True if deleted successfully
   */
  static async delete(userId) {
    const query = `DELETE FROM users WHERE id = $1`;
    const result = await db.query(query, [userId]);
    return result.rowCount > 0;
  }

  /**
   * Delete user by email
   * @param {string} email - User's email address
   * @returns {boolean} True if deleted successfully
   */
  static async deleteByEmail(email) {
    const query = `DELETE FROM users WHERE email = $1`;
    const result = await db.query(query, [email]);
    return result.rowCount > 0;
  }

  /**
   * Get all users (admin function, use sparingly)
   * @returns {array} Array of user objects
   */
  static async findAll() {
    const query = `
      SELECT id, email, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = User;
