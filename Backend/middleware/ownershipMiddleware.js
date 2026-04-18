const { resolveOwnershipId } = require('./ownershipResolver');
const { logAuditEvent } = require('./auditLogger');

function requireOwnershipOrRole(options = {}) {
  const adminRole = options.adminRole || 'admin';

  return (req, res, next) => {
    const userRole = req?.user?.role;
    const userId = req?.user?.id;

    if (userRole === adminRole) {
      return next();
    }

    if (userId === undefined || userId === null) {
      logAuditEvent(req, {
        action: 'ownership_denied',
        status: 'failed',
        metadata: { reason: 'missing_user_id' }
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied: not resource owner',
        code: 'OWNERSHIP_FORBIDDEN'
      });
    }

    const ownerParam = resolveOwnershipId(req);

    if (ownerParam === undefined || ownerParam === null) {
      logAuditEvent(req, {
        action: 'ownership_denied',
        status: 'failed',
        metadata: { reason: 'missing_owner_param' }
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied: not resource owner',
        code: 'OWNERSHIP_FORBIDDEN'
      });
    }

    if (String(userId) !== String(ownerParam)) {
      logAuditEvent(req, {
        action: 'ownership_denied',
        status: 'failed',
        metadata: { userId: String(userId), ownerId: String(ownerParam) }
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied: not resource owner',
        code: 'OWNERSHIP_FORBIDDEN'
      });
    }

    return next();
  };
}

module.exports = {
  requireOwnershipOrRole
};
