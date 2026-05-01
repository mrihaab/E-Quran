const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables.');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    logger.warn('Using insecure default JWT secrets for development ONLY.');
  }
}

const getJwtSecret = () => JWT_SECRET || 'dev-only-equran-secret-key-not-for-production';
const getJwtRefreshSecret = () => JWT_REFRESH_SECRET || 'dev-only-equran-refresh-secret-key-not-for-production';

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.full_name || user.fullName
  };

  if (user.googleId) payload.googleId = user.googleId;
  if (user.fullName) payload.fullName = user.fullName;
  if (user.profileImage) payload.profileImage = user.profileImage;
  if (user.isNewUser !== undefined) payload.isNewUser = user.isNewUser;

  return jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' });
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    getJwtRefreshSecret(),
    { expiresIn: '7d' }
  );
}

/**
 * Core token verification - validates JWT and checks user status in DB.
 * Enforces approval_status globally so unapproved users cannot access any protected route.
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

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const [users] = await db.query(
      'SELECT id, role, approval_status, status, is_deleted FROM users WHERE id = ? AND is_deleted = 0',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deleted.',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    if (user.approval_status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.approval_status}. Please wait for admin approval.`,
        code: 'NOT_APPROVED',
        approvalStatus: user.approval_status
      });
    }

    req.user = {
      ...decoded,
      approvalStatus: user.approval_status,
      status: user.status
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    logger.warn(`Invalid token attempt: ${error.message}`);
    return res.status(403).json({
      success: false,
      message: 'Invalid or malformed token.',
      code: 'INVALID_TOKEN'
    });
  }
}

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
      logger.warn(`Unauthorized role access: ${req.user.role} tried to access ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${roles.join(', ')}] roles.`,
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
  getJwtSecret,
  getJwtRefreshSecret
};
