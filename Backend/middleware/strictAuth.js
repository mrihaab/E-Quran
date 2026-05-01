/**
 * STRICT ROLE-BASED AUTHENTICATION MIDDLEWARE
 *
 * Rules:
 * 1. ONLY approval_status = 'approved' grants access
 * 2. Each portal accepts ONLY its own role
 * 3. Wrong portal login = immediate rejection
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../utils/logger');
const { getJwtSecret } = require('./auth');

async function logLoginAttempt(email, roleAttempted, actualRole, ipAddress, userAgent, status) {
  try {
    await db.query(
      `INSERT INTO login_attempts (email, role_attempted, actual_role, ip_address, user_agent, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, roleAttempted, actualRole || 'none', ipAddress, userAgent, status]
    );
  } catch (err) {
    logger.error('Failed to log login attempt:', err.message);
  }
}

async function checkApprovalStatus(userId) {
  const [users] = await db.query(
    'SELECT approval_status, role, status FROM users WHERE id = ? AND is_deleted = 0',
    [userId]
  );

  if (users.length === 0) {
    return { allowed: false, reason: 'User not found', code: 'USER_NOT_FOUND' };
  }

  const user = users[0];

  if (user.status === 'suspended') {
    return {
      allowed: false,
      reason: 'Your account has been suspended. Contact support.',
      code: 'ACCOUNT_SUSPENDED',
      status: 'suspended'
    };
  }

  switch (user.approval_status) {
    case 'approved':
      return { allowed: true, status: 'approved' };

    case 'pending':
      return {
        allowed: false,
        reason: `Your ${user.role} account is pending admin approval. Please wait for verification.`,
        code: 'PENDING_APPROVAL',
        status: 'pending',
        role: user.role
      };

    case 'rejected': {
      const [details] = await db.query(
        'SELECT rejection_reason FROM users WHERE id = ?',
        [userId]
      );
      return {
        allowed: false,
        reason: 'Your application was not approved.',
        code: 'APPLICATION_REJECTED',
        status: 'rejected',
        rejectionReason: details[0]?.rejection_reason || 'No reason provided'
      };
    }

    case 'suspended':
      return {
        allowed: false,
        reason: 'Your account has been suspended. Contact admin support.',
        code: 'ACCOUNT_SUSPENDED',
        status: 'suspended'
      };

    default:
      return {
        allowed: false,
        reason: 'Account status unknown. Contact support.',
        code: 'UNKNOWN_STATUS'
      };
  }
}

async function verifyRoleForPortal(email, expectedRole, ipAddress, userAgent) {
  const [users] = await db.query(
    'SELECT id, role, approval_status, status FROM users WHERE email = ? AND is_deleted = 0',
    [email]
  );

  if (users.length === 0) {
    await logLoginAttempt(email, expectedRole, 'none', ipAddress, userAgent, 'failed_invalid_cred');
    return {
      valid: false,
      code: 'USER_NOT_FOUND',
      message: 'Account not found. Please register first.'
    };
  }

  const user = users[0];

  if (user.role !== expectedRole) {
    await logLoginAttempt(email, expectedRole, user.role, ipAddress, userAgent, 'failed_wrong_portal');
    logger.warn(`Wrong portal access attempt: ${email} tried ${expectedRole} portal but is ${user.role}`);
    return {
      valid: false,
      code: 'WRONG_PORTAL',
      message: 'You are not authorized to access this portal.',
      actualRole: user.role,
      expectedRole: expectedRole
    };
  }

  const approvalCheck = await checkApprovalStatus(user.id);

  if (!approvalCheck.allowed) {
    await logLoginAttempt(email, expectedRole, user.role, ipAddress, userAgent,
      approvalCheck.status === 'suspended' ? 'failed_suspended' : 'failed_not_approved'
    );
    return {
      valid: false,
      code: approvalCheck.code,
      message: approvalCheck.reason,
      status: approvalCheck.status,
      rejectionReason: approvalCheck.rejectionReason
    };
  }

  return {
    valid: true,
    userId: user.id,
    role: user.role,
    approvalStatus: user.approval_status
  };
}

function verifyTokenAndApproval(req, res, next) {
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

    db.query('SELECT approval_status, status FROM users WHERE id = ? AND is_deleted = 0', [decoded.id])
      .then(([users]) => {
        if (users.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'User not found.',
            code: 'USER_NOT_FOUND'
          });
        }

        const user = users[0];

        if (user.status === 'suspended') {
          return res.status(403).json({
            success: false,
            message: 'Your account has been suspended.',
            code: 'ACCOUNT_SUSPENDED'
          });
        }

        if (user.approval_status !== 'approved') {
          return res.status(403).json({
            success: false,
            message: 'Your account is not approved.',
            code: 'NOT_APPROVED',
            approvalStatus: user.approval_status
          });
        }

        req.user = {
          ...decoded,
          approvalStatus: user.approval_status
        };

        next();
      })
      .catch(err => {
        logger.error('Error checking approval status:', err);
        return res.status(500).json({
          success: false,
          message: 'Error verifying account status.',
          code: 'STATUS_CHECK_ERROR'
        });
      });

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

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Role mismatch: ${req.user.role} tried to access ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
        code: 'ROLE_MISMATCH'
      });
    }

    next();
  };
}

function requireOwnership(paramName = 'userId') {
  return (req, res, next) => {
    const resourceUserId = parseInt(req.params[paramName]);
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    if (requestingUserRole === 'admin') {
      return next();
    }

    if (resourceUserId !== requestingUserId) {
      logger.warn(`Ownership violation: User ${requestingUserId} tried to access resource of user ${resourceUserId}`);
      return res.status(403).json({
        success: false,
        message: 'You can only access your own data.',
        code: 'OWNERSHIP_VIOLATION'
      });
    }

    next();
  };
}

async function verifyParentChildRelationship(parentId, studentId) {
  const [links] = await db.query(
    `SELECT id FROM parent_student_links 
     WHERE parent_id = ? AND student_id = ? AND is_active = 1`,
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
