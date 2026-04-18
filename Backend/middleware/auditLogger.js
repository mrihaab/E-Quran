const logger = require('../utils/logger');
const auditFallbackBuffer = [];
const MAX_AUDIT_BUFFER_SIZE = 200;

function pushToAuditFallbackBuffer(payload) {
  if (auditFallbackBuffer.length >= MAX_AUDIT_BUFFER_SIZE) {
    auditFallbackBuffer.shift();
  }
  auditFallbackBuffer.push(payload);
}

function warnAuditFailure(error) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[AUDIT_LOG_FAILURE]', error?.message || 'Unknown audit logging failure');
  }
}

function logAuditEvent(req, event = {}) {
  try {
    const payload = {
      userId: req?.user?.id || null,
      role: req?.user?.role || null,
      action: event.action || 'unknown_action',
      status: event.status || 'failed',
      route: req?.originalUrl || null,
      method: req?.method || null,
      ip: req?.ip || null,
      timestamp: new Date(),
      metadata: event.metadata || {}
    };

    setImmediate(() => {
      try {
        logger.info('AUDIT_EVENT', payload);
      } catch (error) {
        pushToAuditFallbackBuffer(payload);
        warnAuditFailure(error);
        // Intentionally swallow logging errors to avoid blocking request flow.
      }
    });
  } catch (error) {
    const fallbackPayload = {
      userId: req?.user?.id || null,
      role: req?.user?.role || null,
      action: event?.action || 'unknown_action',
      status: event?.status || 'failed',
      route: req?.originalUrl || null,
      method: req?.method || null,
      ip: req?.ip || null,
      timestamp: new Date(),
      metadata: event?.metadata || {}
    };
    pushToAuditFallbackBuffer(fallbackPayload);
    warnAuditFailure(error);
    // Intentionally swallow audit errors to keep behavior non-blocking.
  }
}

module.exports = {
  logAuditEvent
};
