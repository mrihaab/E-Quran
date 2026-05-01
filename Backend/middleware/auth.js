const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
require('dotenv').config();

// ---------- Secret resolution ----------
const isProd = process.env.NODE_ENV === 'production';
const FALLBACK_ACCESS = 'equran-dev-access-secret-do-not-use-in-prod';
const FALLBACK_REFRESH = 'equran-dev-refresh-secret-do-not-use-in-prod';

const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_ACCESS;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || FALLBACK_REFRESH;
const ACCESS_TTL = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (isProd && (JWT_SECRET === FALLBACK_ACCESS || JWT_REFRESH_SECRET === FALLBACK_REFRESH)) {
  // Refuse to run in production with default secrets — this is a hard
  // security boundary, not a warning.
  // eslint-disable-next-line no-console
  console.error('FATAL: JWT_SECRET / JWT_REFRESH_SECRET must be set in production.');
  process.exit(1);
}
if (!isProd && (JWT_SECRET === FALLBACK_ACCESS || JWT_REFRESH_SECRET === FALLBACK_REFRESH)) {
  logger.warn('JWT secrets not set — using insecure development fallbacks. Set JWT_SECRET / JWT_REFRESH_SECRET in your .env.');
}

/**
 * Generate Access Token (Short-lived).
 * Carries the minimum claims the rest of the API needs.
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.full_name || user.fullName,
  };

  // Optional fields (used by Google OAuth temp tokens)
  if (user.googleId) payload.googleId = user.googleId;
  if (user.fullName) payload.fullName = user.fullName;
  if (user.profileImage) payload.profileImage = user.profileImage;
  if (user.isNewUser !== undefined) payload.isNewUser = user.isNewUser;

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
}

/**
 * Generate Refresh Token (Long-lived). Only carries the user id.
 */
function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

/**
 * Verify a refresh token signature and return the decoded payload, or
 * null if the token is invalid/expired. Use alongside a DB lookup.
 */
function verifyRefreshTokenSignature(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware — require a valid access token.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

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
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    logger.warn(`Invalid token attempt: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed token.',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Optional auth — populate req.user if a valid token is present, but
 * never reject the request.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (_) {
    // ignore — treat as anonymous
  }
  return next();
}

/**
 * Role-based access control middleware.
 */
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
      logger.warn(`Unauthorized role access: ${req.user.role} -> ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${roles.join(', ')}].`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }
    return next();
  };
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyRefreshTokenSignature,
  verifyToken,
  optionalAuth,
  requireRole,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TTL,
  REFRESH_TTL,
};
