const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ==================== REVIEW ROUTES ====================

// Submit a review (Only students can review)
router.post('/', verifyToken, requireRole('student'), reviewController.createReview);

// Get reviews for a teacher (Public/Authenticated)
router.get('/teacher/:teacherId', reviewController.getTeacherReviews);

module.exports = router;
