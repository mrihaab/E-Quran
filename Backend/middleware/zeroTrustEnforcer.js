function zeroTrustEnforcer(req, res, next) {
  const report = req && req.__zeroTrustReport ? req.__zeroTrustReport : null;

  // Fail-open safety: if zeroTrustGuard did not attach a report, do not block.
  if (!report || typeof report !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ZERO_TRUST_ENFORCER]', 'Missing zero-trust report, allowing request.');
    }
    return next();
  }

  // Only enforce for protected routes.
  if (report.isProtectedRoute !== true) {
    return next();
  }

  const hasCriticalViolation = report.missingAuthMiddleware
    || report.missingApprovalMiddleware
    || report.missingRoleMiddleware
    || report.invalidMiddlewareOrder
    || report.ownershipViolationDetected;

  if (hasCriticalViolation) {
    return res.status(403).json({
      success: false,
      message: 'Security policy violation detected',
      code: 'ZERO_TRUST_VIOLATION',
      details: report
    });
  }

  // STRICT_MODE = true -> switch to fail-closed enforcement.
  return next();
}

module.exports = zeroTrustEnforcer;
