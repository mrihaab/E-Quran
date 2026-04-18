const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Apply admin protection to all routes in this file
router.use(verifyToken, authGuard, approvalMiddleware, requireRole(['admin']));

// ==================== USER MANAGEMENT ====================
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUser);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

// ==================== ANALYTICS & REPORTING ====================
router.get('/stats', adminController.getStats);
router.get('/reports', adminController.generateReport);

module.exports = router;
