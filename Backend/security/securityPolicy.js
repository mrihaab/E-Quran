const SECURITY_POLICY = {
  publicRoutes: [
    { path: '/api/auth', type: 'prefix' },
    { path: '/api/login', type: 'exact' },
    { path: '/api/register', type: 'exact' },
    { path: '/api/otp/*', type: 'wildcard' },
    { path: '/api/oauth/*', type: 'wildcard' },
    { path: '/api/password-reset', type: 'prefix' }
  ],
  protectedRoutes: [
    { path: '/api/admin', type: 'prefix' },
    { path: '/api/users', type: 'prefix' },
    { path: '/api/dashboard', type: 'prefix' },
    { path: '/api/classes', type: 'prefix' },
    { path: '/api/courses', type: 'prefix' },
    { path: '/api/enrollments', type: 'prefix' },
    { path: '/api/messages', type: 'prefix' },
    { path: '/api/notifications', type: 'prefix' },
    { path: '/api/payments', type: 'prefix' },
    { path: '/api/reviews', type: 'prefix' },
    { path: '/api/settings', type: 'prefix' },
    { path: '/api/upload', type: 'prefix' }
  ]
};

module.exports = {
  SECURITY_POLICY
};
