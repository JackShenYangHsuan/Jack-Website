/**
 * Authentication Middleware
 * JWT token verification for protected routes
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token and attach user info to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      error: {
        message: 'Access token required',
        status: 401
      }
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          message: 'Token expired',
          status: 401
        }
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: {
          message: 'Invalid token',
          status: 403
        }
      });
    }

    return res.status(500).json({
      error: {
        message: 'Failed to authenticate token',
        status: 500
      }
    });
  }
};

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} JWT token
 */
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

module.exports = {
  authenticateToken,
  generateToken
};
