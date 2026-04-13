const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../utils/upload');

// ==================== UPLOAD ENDPOINTS ====================

// Upload Profile Image
router.post('/profile', verifyToken, upload.single('image'), uploadController.uploadProfile);

// Upload Teacher Document
router.post('/document', verifyToken, upload.single('document'), uploadController.uploadDocument);

module.exports = router;
