const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'equran-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'equran-refresh-secret-key-change-in-production';

/**
 * Generate Access Token (Short-lived)
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.full_name || user.fullName
  };
  
  // Include additional fields for Google OAuth temp tokens
  if (user.googleId) payload.googleId = user.googleId;
  if (user.fullName) payload.fullName = user.fullName;
  if (user.profileImage) payload.profileImage = user.profileImage;
  if (user.isNewUser !== undefined) payload.isNewUser = user.isNewUser;
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Generate Refresh Token (Long-lived)
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token middleware.
// Responsibility: authenticate token and attach decoded identity to req.user.
// Non-responsibilities: no req.user normalization, no approval policy enforcement.
// Downstream middleware (e.g., authGuard / future approvalMiddleware) handles those layers.
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.',
      code: 'NO_TOKEN'
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

// Role-based access control middleware
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
  JWT_SECRET,
  JWT_REFRESH_SECRET
};
