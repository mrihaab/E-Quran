const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');
const upload = require('../utils/upload');

// ==================== UPLOAD ENDPOINTS ====================

// Upload Profile Image
router.post('/profile', verifyToken, authGuard, approvalMiddleware, upload.single('image'), uploadController.uploadProfile);

// Upload Teacher Document
router.post('/document', verifyToken, authGuard, approvalMiddleware, upload.single('document'), uploadController.uploadDocument);

module.exports = router;
