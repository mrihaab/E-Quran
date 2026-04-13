const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Apply admin protection to all routes in this file
router.use(verifyToken, requireRole('admin'));

// ==================== USER MANAGEMENT ====================
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId', adminController.updateUser);

// ==================== ANALYTICS & REPORTING ====================
router.get('/stats', adminController.getStats);
router.get('/reports', adminController.generateReport);

module.exports = router;
