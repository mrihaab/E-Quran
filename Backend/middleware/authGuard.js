/**
AUTH ARCHITECTURE LAYERS:

1. Authentication Layer:
   verifyToken / strictAuth -> validates identity

2. Identity Layer:
   authGuard -> normalizes req.user only

3. Policy Layer (future):
   approvalMiddleware -> enforces account approval

4. Access Control Layer:
   roleMiddleware / ownershipMiddleware

IMPORTANT:
authGuard MUST remain stateless and side-effect free.
*/
const VALID_APPROVAL_STATUSES = new Set(['approved', 'pending', 'rejected', 'suspended']);
const { logAuditEvent } = require('./auditLogger');

/*
IMPORTANT:
approval_status is the primary source of truth.
is_approved is legacy compatibility only and will be phased out.
No enforcement should depend on is_approved in new logic.
*/
function getApprovalStatus(user) {
  if (!user || typeof user !== 'object') return 'pending';

  if (user.approval_status !== undefined && user.approval_status !== null) {
    const status = String(user.approval_status).toLowerCase();
    return VALID_APPROVAL_STATUSES.has(status) ? status : 'pending';
  }

  if (user.is_approved === true) {
    return 'approved';
  }

  return 'pending';
}

function normalizeUser(user) {
  const safeUser = user && typeof user === 'object' ? user : {};

  return {
    ...safeUser,
    id: safeUser.id ?? safeUser.user_id ?? safeUser.userId ?? safeUser.uid ?? safeUser.UserID ?? null,
    role: safeUser.role ?? null,
    approvalStatus: getApprovalStatus(safeUser)
  };
}

function authGuard(req, res, next) {
  try {
    // If req.user is missing, the authentication layer did not provide auth context.
    if (!req.user || typeof req.user !== 'object') {
      logAuditEvent(req, {
        action: 'auth_context_missing',
        status: 'failed',
        metadata: { code: 'AUTH_REQUIRED' }
      });
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - missing auth context',
        code: 'AUTH_REQUIRED'
      });
    }

    // authGuard only normalizes identity; it does not enforce approval or authorization.
    // If approval status cannot be inferred, normalization defaults to "pending".
    req.user = normalizeUser(req.user);
    logAuditEvent(req, {
      action: 'identity_normalized',
      status: 'success',
      metadata: { approvalStatus: req.user.approvalStatus }
    });
    return next();
  } catch (_) {
    return res.status(401).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_GUARD_ERROR'
    });
  }
}

module.exports = authGuard;
module.exports.authGuard = authGuard;
module.exports.normalizeUser = normalizeUser;
