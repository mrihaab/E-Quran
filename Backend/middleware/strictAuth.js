/**
 * STRICT ROLE-BASED AUTHENTICATION MIDDLEWARE
 * 
 * Rules:
 * 1. ROLE does NOT grant access
 * 2. ONLY approvalStatus = 'approved' grants access
 * 3. Each portal accepts ONLY its own role
 * 4. Wrong portal login = immediate rejection
 * 5. Google login must also respect approval system
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'equran-secret-key-change-in-production';

/**
 * Log login attempt for security audit
 */
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

/**
 * Check if user has approved status
 * Returns { allowed: boolean, reason: string, code: string }
 */
async function checkApprovalStatus(userId) {
  const [users] = await db.query(
    'SELECT approval_status, role, is_suspended FROM users WHERE id = ?',
    [userId]
  );
  
  if (users.length === 0) {
    return { allowed: false, reason: 'User not found', code: 'USER_NOT_FOUND' };
  }
  
  const user = users[0];
  
  // Check suspended first
  if (user.is_suspended) {
    return { 
      allowed: false, 
      reason: 'Your account has been suspended. Contact support.',
      code: 'ACCOUNT_SUSPENDED',
      status: 'suspended'
    };
  }
  
  // Check approval status
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
      
    case 'rejected':
      // Get rejection reason
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

/**
 * STRICT ROLE VERIFICATION
 * Rejects login if user tries wrong portal
 */
async function verifyRoleForPortal(email, expectedRole, ipAddress, userAgent) {
  const [users] = await db.query(
    'SELECT id, role, approval_status, is_suspended FROM users WHERE email = ?',
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
  
  // CRITICAL: Check if user is trying wrong portal
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
  
  // Check approval status
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
  
  // All checks passed
  return {
    valid: true,
    userId: user.id,
    role: user.role,
    approvalStatus: user.approval_status
  };
}

/**
 * Middleware: Verify Token + Approval Status
 * Use this for ALL protected routes
 */
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
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check approval status from database (token might be stale)
    db.query('SELECT approval_status, is_suspended FROM users WHERE id = ?', [decoded.id])
      .then(([users]) => {
        if (users.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'User not found.',
            code: 'USER_NOT_FOUND'
          });
        }
        
        const user = users[0];
        
        if (user.is_suspended) {
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
        
        // Add approval status to req.user
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

/**
 * Middleware: Require Specific Role
 * Use AFTER verifyTokenAndApproval
 */
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

/**
 * Middleware: Check if user is accessing their own resource
 * Prevents URL manipulation (e.g., /api/student/123/data accessed by student 456)
 */
function requireOwnership(paramName = 'userId') {
  return (req, res, next) => {
    const resourceUserId = parseInt(req.params[paramName]);
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;
    
    // Admins can access any resource
    if (requestingUserRole === 'admin') {
      return next();
    }
    
    // Users can only access their own resources
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

/**
 * Helper: Check parent-child relationship
 * Used for parent dashboard APIs
 */
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
