const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables.');
  process.exit(1);
}

/**
 * Generate short-lived access token (15 minutes)
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name || user.name || user.fullName || ''
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generate long-lived refresh token (7 days)
 */
function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT and load fresh user state from database on every request.
 * Rejects suspended / deleted accounts even if their token is still valid.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
      code: 'NO_TOKEN'
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    logger.warn(`Invalid token: ${error.message}`);
    return res.status(403).json({
      success: false,
      message: 'Invalid or malformed token.',
      code: 'INVALID_TOKEN'
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, role, status, is_deleted FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0 || rows[0].is_deleted) {
      return res.status(401).json({
        success: false,
        message: 'Account not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = rows[0];

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = { ...decoded, role: user.role };
    next();
  } catch (dbError) {
    logger.error('Database error in verifyToken:', dbError);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      code: 'AUTH_DB_ERROR'
    });
  }
}

/**
 * Role-based access control — use after verifyToken
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`Role denied: ${req.user.role} tried ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires role: ${roles.join(' or ')}.`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  requireRole,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};
