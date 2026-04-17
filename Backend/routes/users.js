const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// ==================== USER DIRECTORY / SEARCH ====================
router.get('/search', verifyToken, userController.searchUsers);
router.get('/directory', verifyToken, userController.searchUsers);

// ==================== ADMIN ONLY ====================
router.get('/admin/all', verifyToken, userController.getAllUsers);

// ==================== PROFILE MANAGEMENT ====================
router.get('/:userId', verifyToken, userController.getProfile);
router.put('/:userId', verifyToken, userController.updateProfile);

// ==================== SECURITY ====================
router.put('/:userId/password', verifyToken, userController.changePassword);

module.exports = router;
