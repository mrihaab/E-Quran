const { logAuditEvent } = require('./auditLogger');

function approvalMiddleware(req, res, next) {
  const approvalStatus = req?.user?.approvalStatus;

  if (approvalStatus !== 'approved') {
    logAuditEvent(req, {
      action: 'approval_denied',
      status: 'failed',
      metadata: { approvalStatus: approvalStatus || null }
    });
    return res.status(403).json({
      success: false,
      message: 'Account not approved',
      code: 'ACCOUNT_NOT_APPROVED'
    });
  }

  return next();
}

module.exports = approvalMiddleware;
