const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');

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
 *         description: token refreshed
 */
router.post('/refresh', authController.refreshToken);

router.post('/logout', authController.logout);
router.post('/logout-all', verifyToken, authController.logoutAll);

// ==================== IDENTITY ====================
// ==================== OTP VERIFICATION ====================
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

// ==================== EMAIL VERIFICATION ====================
router.post('/verify-email', authController.verifyEmail);

// ==================== FORGOT PASSWORD WITH OTP ====================
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);

// ==================== ADMIN APPROVAL WORKFLOW ====================
router.get('/admin/requests', verifyToken, authController.getPendingAdminRequests);
router.post('/admin/requests/:requestId/approve', verifyToken, authController.approveAdminRequest);
router.post('/admin/requests/:requestId/reject', verifyToken, authController.rejectAdminRequest);

// Simple in-memory store for role during OAuth (cleared periodically)
const oauthRoleStore = new Map();

// ==================== GOOGLE OAUTH ====================
// Only enable if Google OAuth is configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Initiate Google OAuth - capture role from query and store it
  router.get('/google',
    (req, res, next) => {
      // Extract role from state parameter
      let role = null;
      if (req.query.state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(req.query.state));
          role = stateData.role || null;
        } catch (e) {
          console.log('Failed to parse state:', req.query.state);
        }
      }
      // Generate a state token and store role
      const stateToken = require('crypto').randomBytes(16).toString('hex');
      if (role) {
        oauthRoleStore.set(stateToken, { role, timestamp: Date.now() });
        console.log('Stored role for OAuth:', role, 'state:', stateToken);
        // Clean old entries (older than 10 minutes)
        for (const [key, value] of oauthRoleStore) {
          if (Date.now() - value.timestamp > 10 * 60 * 1000) {
            oauthRoleStore.delete(key);
          }
        }
      }
      // Store state token in req for passport to use
      req.session = req.session || {};
      req.session.oauthState = stateToken;
      next();
    },
    (req, res, next) => {
      // Manually pass state to passport
      const auth = passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account',
        state: req.session.oauthState
      });
      auth(req, res, next);
    }
  );

  // Google OAuth Callback - restore role from store
  router.get('/google/callback',
    (req, res, next) => {
      // Restore role from store using state returned by Google
      const state = req.query.state;
      console.log('Callback received state:', state);
      if (state && oauthRoleStore.has(state)) {
        const data = oauthRoleStore.get(state);
        req.oauthRole = data.role;
        oauthRoleStore.delete(state);
        console.log('Restored role from OAuth store:', data.role);
      }
      next();
    },
    passport.authenticate('google', { 
      failureRedirect: '/api/auth/google/failure',
      session: false 
    }),
    authController.googleCallback
  );

  // Google OAuth Failure
  router.get('/google/failure', (req, res) => {
    res.status(401).json({
      success: false,
      message: 'Google authentication failed.',
      code: 'GOOGLE_AUTH_FAILED'
    });
  });

  // Complete Google Registration (after role selection)
  router.post('/google/complete', authController.completeGoogleRegistration);
} else {
  // Return 503 if Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google authentication is not configured.',
      code: 'GOOGLE_AUTH_NOT_CONFIGURED'
    });
  });
}

module.exports = router;
