const { logAuditEvent } = require('./auditLogger');

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const role = req?.user?.role;

    if (!role || !roles.includes(role)) {
      logAuditEvent(req, {
        action: 'role_denied',
        status: 'failed',
        metadata: { role: role || null, allowedRoles: roles }
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient role',
        code: 'ROLE_FORBIDDEN'
      });
    }

    return next();
  };
}

module.exports = {
  requireRole
};
