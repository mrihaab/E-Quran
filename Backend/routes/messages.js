const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');

// ==================== MESSAGING ROUTES ====================
// ----------------------
// PROTECTED ROUTES (AUTH + APPROVAL REQUIRED)
// ----------------------
// Middleware order: verifyToken -> authGuard -> approvalMiddleware
// Send a message
router.post('/', verifyToken, authGuard, approvalMiddleware, messageController.sendMessage);

// Get all conversations for the logged-in user (no param needed)
router.get('/conversations', verifyToken, authGuard, approvalMiddleware, messageController.getConversations);

// Get conversation with a specific partner
router.get('/:partnerId', verifyToken, authGuard, approvalMiddleware, messageController.getMessages);

// Mark all messages from a partner as read
router.put('/:partnerId/read', verifyToken, authGuard, approvalMiddleware, messageController.markRead);

// Delete a message
router.delete('/:messageId', verifyToken, authGuard, approvalMiddleware, messageController.deleteMessage);

module.exports = router;
