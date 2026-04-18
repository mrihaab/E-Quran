const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');
const { requireOwnershipOrRole } = require('../middleware/ownershipMiddleware');

// ==================== USER DIRECTORY / SEARCH ====================
router.get('/search', verifyToken, authGuard, approvalMiddleware, userController.searchUsers);
router.get('/directory', verifyToken, authGuard, approvalMiddleware, userController.searchUsers);

// ==================== ADMIN ONLY ====================
router.get('/admin/all', verifyToken, authGuard, approvalMiddleware, userController.getAllUsers);

// ==================== PROFILE MANAGEMENT ====================
router.get('/:userId', verifyToken, authGuard, approvalMiddleware, requireOwnershipOrRole({ paramKeys: ['userId'] }), userController.getProfile);
router.put('/:userId', verifyToken, authGuard, approvalMiddleware, userController.updateProfile);

// ==================== SECURITY ====================
router.put('/:userId/password', verifyToken, authGuard, approvalMiddleware, userController.changePassword);

module.exports = router;
