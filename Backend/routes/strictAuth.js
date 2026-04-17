/**
 * STRICT AUTHENTICATION ROUTES
 * 
 * Implements role-specific login endpoints
 */

const express = require('express');
const router = express.Router();
const strictAuthController = require('../controllers/strictAuthController');
const { verifyTokenAndApproval } = require('../middleware/strictAuth');

// ============================================
// ROLE-SPECIFIC LOGIN ENDPOINTS
// ============================================

// Student Login Portal
router.post('/login/student', strictAuthController.loginStudent);

// Teacher Login Portal  
router.post('/login/teacher', strictAuthController.loginTeacher);

// Parent Login Portal
router.post('/login/parent', strictAuthController.loginParent);

// Admin Login Portal
router.post('/login/admin', strictAuthController.loginAdmin);

// ============================================
// REGISTRATION
// ============================================

router.post('/register', strictAuthController.registerWithApproval);

// ============================================
// STATUS CHECK (for frontend redirects)
// ============================================

router.get('/status', verifyTokenAndApproval, strictAuthController.checkStatus);

module.exports = router;
