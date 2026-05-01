/**
 * Strict role-based authentication middleware.
 *
 * Rules:
 *   1. Each portal only accepts its own role.
 *   2. Suspended / inactive accounts are always rejected.
 *   3. Admin accounts must also have is_approved = 1.
 *   4. Every failed attempt is logged to login_attempts.
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// ==================== HELPERS ====================

/**
 * Insert a row in login_attempts for security auditing.
 * Failures here are swallowed so they never break the auth flow.
 */
async function logLoginAttempt(email, roleAttempted, actualRole, ipAddress, userAgent, status) {
  try {
    await db.query(
      `INSERT INTO login_attempts (email, role_attempted, actual_role, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, roleAttempted, actualRole || 'none', ipAddress || null, userAgent || null, status]
    );
  } catch (err) {
    logger.error('logLoginAttempt failed:', err.message);
  }
}

/**
 * Check whether a user is allowed to proceed based on account state.
 * Uses the canonical schema columns: `status` and `is_approved`.
 *
 * @returns {{ allowed: boolean, reason?: string, code?: string, accountStatus?: string }}
 */
async function checkApprovalStatus(userId) {
  const [rows] = await db.query(
    'SELECT role, status, is_approved FROM users WHERE id = ? AND is_deleted = 0',
    [userId]
  );

  if (rows.length === 0) {
    return { allowed: false, reason: 'User not found.', code: 'USER_NOT_FOUND' };
  }

  const user = rows[0];

  if (user.status === 'suspended') {
    return {
      allowed: false,
      reason: 'Your account has been suspended. Please contact support.',
      code: 'ACCOUNT_SUSPENDED',
      accountStatus: 'suspended'
    };
  }

  if (user.status !== 'active') {
    return {
      allowed: false,
      reason: 'Your account is not active.',
      code: 'ACCOUNT_INACTIVE',
      accountStatus: user.status
    };
  }

  // Admin-specific approval gate
  if (user.role === 'admin' && !user.is_approved) {
    return {
      allowed: false,
      reason: 'Your admin account is pending approval.',
      code: 'PENDING_APPROVAL',
      accountStatus: 'pending'
    };
  }

  return { allowed: true, accountStatus: 'active' };
}

/**
 * Pre-login check: verify the user exists, belongs to the expected role,
 * and the account is in a state that allows login.
 *
 * @returns {{ valid: boolean, userId?: number, role?: string, ... }}
 */
async function verifyRoleForPortal(email, expectedRole, ipAddress, userAgent) {
  const [rows] = await db.query(
    'SELECT id, role, status, is_approved FROM users WHERE email = ? AND is_deleted = 0',
    [email]
  );

  if (rows.length === 0) {
    await logLoginAttempt(email, expectedRole, 'none', ipAddress, userAgent, 'failed_not_found');
    return { valid: false, code: 'USER_NOT_FOUND', message: 'Account not found. Please register first.' };
  }

  const user = rows[0];

  if (user.role !== expectedRole) {
    await logLoginAttempt(email, expectedRole, user.role, ipAddress, userAgent, 'failed_wrong_portal');
    logger.warn(`Wrong portal: ${email} is '${user.role}' but tried '${expectedRole}' portal`);
    return {
      valid: false,
      code: 'WRONG_PORTAL',
      message: `You are registered as a ${user.role}. Please use the correct login portal.`
    };
  }

  const approvalCheck = await checkApprovalStatus(user.id);
  if (!approvalCheck.allowed) {
    await logLoginAttempt(email, expectedRole, user.role, ipAddress, userAgent, `failed_${approvalCheck.code?.toLowerCase() || 'blocked'}`);
    return {
      valid: false,
      code: approvalCheck.code,
      message: approvalCheck.reason,
      status: approvalCheck.accountStatus
    };
  }

  return { valid: true, userId: user.id, role: user.role };
}

// ==================== MIDDLEWARE ====================

/**
 * verifyTokenAndApproval
 *
 * Use this on routes that need a valid JWT AND an active/approved account.
 * Does a live DB lookup on every request so stale tokens can't bypass suspensions.
 */
function verifyTokenAndApproval(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided.', code: 'NO_TOKEN' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Access token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token.', code: 'INVALID_TOKEN' });
  }

  checkApprovalStatus(decoded.id)
    .then((check) => {
      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          message: check.reason,
          code: check.code,
          accountStatus: check.accountStatus
        });
      }
      req.user = decoded;
      next();
    })
    .catch((err) => {
      logger.error('verifyTokenAndApproval DB error:', err);
      res.status(500).json({ success: false, message: 'Internal authentication error.', code: 'AUTH_ERROR' });
    });
}

/**
 * requireRole — use after verifyToken or verifyTokenAndApproval
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.', code: 'AUTH_REQUIRED' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Role denied: ${req.user.role} → ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
        code: 'ROLE_MISMATCH'
      });
    }
    next();
  };
}

/**
 * requireOwnership — prevents URL-manipulation attacks
 * Admins bypass ownership checks.
 */
function requireOwnership(paramName = 'userId') {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();
    const resourceId = parseInt(req.params[paramName], 10);
    if (resourceId !== req.user.id) {
      logger.warn(`Ownership violation: user ${req.user.id} → resource ${resourceId}`);
      return res.status(403).json({
        success: false,
        message: 'You can only access your own data.',
        code: 'OWNERSHIP_VIOLATION'
      });
    }
    next();
  };
}

/**
 * verifyParentChildRelationship — helper for parent dashboard APIs
 */
async function verifyParentChildRelationship(parentId, studentId) {
  const [links] = await db.query(
    'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ? AND is_active = 1',
    [parentId, studentId]
  );
  return links.length > 0;
}

module.exports = {
  verifyRoleForPortal,
  checkApprovalStatus,
  verifyTokenAndApproval,
  requireRole,
  requireOwnership,
  verifyParentChildRelationship,
  logLoginAttempt
};
