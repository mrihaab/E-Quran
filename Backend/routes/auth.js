const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const crypto = require('crypto');

const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and identity management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password, role]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [student, teacher, parent, admin] }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and get tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post('/refresh', authController.refreshToken);

router.post('/logout', authController.logout);
router.post('/logout-all', verifyToken, authController.logoutAll);

// OTP Verification
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

// Email Verification
router.post('/verify-email', authController.verifyEmail);

// Forgot Password
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);

// Admin Approval Workflow
router.get('/admin/requests', verifyToken, authController.getPendingAdminRequests);
router.post('/admin/requests/:requestId/approve', verifyToken, authController.approveAdminRequest);
router.post('/admin/requests/:requestId/reject', verifyToken, authController.rejectAdminRequest);

// Ephemeral state store for OAuth role passing (TTL-managed)
const oauthRoleStore = new Map();

function cleanOAuthStore() {
  const TEN_MINUTES = 10 * 60 * 1000;
  for (const [key, value] of oauthRoleStore) {
    if (Date.now() - value.timestamp > TEN_MINUTES) {
      oauthRoleStore.delete(key);
    }
  }
}

// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google',
    (req, res, next) => {
      let role = null;
      if (req.query.state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(req.query.state));
          role = stateData.role || null;
        } catch (e) {
          // Invalid state parameter, proceed without role
        }
      }
      const stateToken = crypto.randomBytes(16).toString('hex');
      if (role) {
        oauthRoleStore.set(stateToken, { role, timestamp: Date.now() });
        cleanOAuthStore();
      }
      req._oauthState = stateToken;
      next();
    },
    (req, res, next) => {
      const auth = passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        state: req._oauthState
      });
      auth(req, res, next);
    }
  );

  router.get('/google/callback',
    (req, res, next) => {
      const state = req.query.state;
      if (state && oauthRoleStore.has(state)) {
        const data = oauthRoleStore.get(state);
        req.oauthRole = data.role;
        oauthRoleStore.delete(state);
      }
      next();
    },
    passport.authenticate('google', {
      failureRedirect: '/api/auth/google/failure',
      session: false
    }),
    authController.googleCallback
  );

  router.get('/google/failure', (req, res) => {
    res.status(401).json({
      success: false,
      message: 'Google authentication failed.',
      code: 'GOOGLE_AUTH_FAILED'
    });
  });

  router.post('/google/complete', authController.completeGoogleRegistration);
} else {
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google authentication is not configured.',
      code: 'GOOGLE_AUTH_NOT_CONFIGURED'
    });
  });
}

module.exports = router;
