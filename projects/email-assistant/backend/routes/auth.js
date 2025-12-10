/**
 * Authentication Routes
 * Handles Gmail OAuth 2.0 flow and user authentication
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getAuthUrl, getTokens, revokeToken } = require('../config/gmail');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');
const db = require('../config/database');

/**
 * GET /auth/google
 * Initiate OAuth flow - redirect user to Google consent screen
 */
router.get('/google', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      error: {
        message: 'Failed to initiate authentication',
        status: 500
      }
    });
  }
});

/**
 * GET /auth/google/callback
 * Handle OAuth callback from Google - redirect to frontend with code
 */
router.get('/google/callback', (req, res) => {
  const { code, error } = req.query;

  if (error) {
    // OAuth error - redirect to frontend with error
    return res.redirect(`${process.env.FRONTEND_URL}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }

  // Redirect to frontend with authorization code
  res.redirect(`${process.env.FRONTEND_URL}?code=${code}`);
});

/**
 * POST /auth/google/callback
 * Handle OAuth callback - exchange code for tokens
 */
router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: {
          message: 'Authorization code required',
          status: 400
        }
      });
    }

    // Exchange code for tokens
    const tokens = await getTokens(code);

    if (!tokens.refresh_token) {
      return res.status(400).json({
        error: {
          message: 'No refresh token received. Please revoke access and try again.',
          status: 400
        }
      });
    }

    // Get user email from ID token (included in the token response)
    // Decode the ID token to get user info
    const idTokenDecoded = jwt.decode(tokens.id_token);

    if (!idTokenDecoded || !idTokenDecoded.email) {
      return res.status(400).json({
        error: {
          message: 'Failed to get user email from Google',
          status: 400
        }
      });
    }

    const email = idTokenDecoded.email;

    // Encrypt refresh token
    const encryptedToken = encrypt(JSON.stringify(tokens));

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    let userId;

    if (existingUser.rows.length > 0) {
      // Update existing user
      userId = existingUser.rows[0].id;
      await db.query(
        'UPDATE users SET gmail_token_encrypted = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [encryptedToken, userId]
      );
    } else {
      // Create new user
      const result = await db.query(
        'INSERT INTO users (email, gmail_token_encrypted) VALUES ($1, $2) RETURNING id',
        [email, encryptedToken]
      );
      userId = result.rows[0].id;
    }

    // Generate JWT token
    const jwtToken = generateToken(userId, email);

    res.json({
      token: jwtToken,
      user: {
        id: userId,
        email: email
      }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: {
        message: 'Authentication failed',
        status: 500,
        details: error.message
      }
    });
  }
});

/**
 * POST /auth/disconnect
 * Revoke Gmail access and delete user data
 */
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's encrypted tokens
    const result = await db.query(
      'SELECT gmail_token_encrypted FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    // Decrypt tokens
    const encryptedToken = result.rows[0].gmail_token_encrypted;
    const tokens = JSON.parse(decrypt(encryptedToken));

    // Revoke Gmail access
    try {
      await revokeToken(tokens.access_token);
    } catch (revokeError) {
      console.error('Error revoking token:', revokeError);
      // Continue with deletion even if revocation fails
    }

    // Delete user data (cascade will delete rules and logs)
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      message: 'Gmail access revoked and data deleted successfully'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to disconnect',
        status: 500
      }
    });
  }
});

/**
 * GET /auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    res.json({
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get user information',
        status: 500
      }
    });
  }
});

module.exports = router;
