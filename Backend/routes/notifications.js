const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');

// ==================== NOTIFICATION ROUTES ====================
// ----------------------
// PROTECTED ROUTES (AUTH + APPROVAL REQUIRED)
// ----------------------
// Middleware order: verifyToken -> authGuard -> approvalMiddleware

// Get all notifications
router.get('/', verifyToken, authGuard, approvalMiddleware, notificationController.getNotifications);

// Mark as read
router.put('/:id/read', verifyToken, authGuard, approvalMiddleware, notificationController.markAsRead);

// Mark all as read
router.put('/mark-all-read', verifyToken, authGuard, approvalMiddleware, notificationController.markAllRead);

module.exports = router;
