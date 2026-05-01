const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'equran-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'equran-refresh-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.full_name || user.fullName,
  };

  if (user.googleId) payload.googleId = user.googleId;
  if (user.fullName) payload.fullName = user.fullName;
  if (user.profileImage) payload.profileImage = user.profileImage;
  if (user.isNewUser !== undefined) payload.isNewUser = user.isNewUser;

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

function verifyToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
      code: 'NO_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Invalid token: ${error.message} from ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'Invalid or malformed token.',
        code: 'INVALID_TOKEN',
      });
    }
    logger.error(`Token verification error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      code: 'TOKEN_ERROR',
    });
  }
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`Role denied: ${req.user.role} tried ${req.method} ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}.`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }
    next();
  };
}

function requireSelf(paramName = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }
    if (req.user.role === 'admin') return next();

    const resourceUserId = parseInt(req.params[paramName], 10);
    if (isNaN(resourceUserId) || resourceUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own resources.',
        code: 'OWNERSHIP_VIOLATION',
      });
    }
    next();
  };
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  optionalAuth,
  requireRole,
  requireSelf,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
};
