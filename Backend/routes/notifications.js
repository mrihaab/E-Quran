const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

// ==================== NOTIFICATION ROUTES ====================

// Get all notifications
router.get('/', verifyToken, notificationController.getNotifications);

// Mark as read
router.put('/:id/read', verifyToken, notificationController.markAsRead);

// Mark all as read
router.put('/mark-all-read', verifyToken, notificationController.markAllRead);

module.exports = router;
