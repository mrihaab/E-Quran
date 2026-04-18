const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');

// ==================== REVIEW ROUTES ====================
// TODO: Consider splitting public/protected routes in future refactor.
//
// ----------------------
// PROTECTED ROUTES (AUTH + APPROVAL REQUIRED)
// ----------------------
// Middleware order: verifyToken -> authGuard -> approvalMiddleware
// Submit a review (Only students can review)
router.post('/', verifyToken, authGuard, approvalMiddleware, requireRole('student'), reviewController.createReview);

// ----------------------
// PUBLIC ROUTES (NO AUTH)
// ----------------------
// Get reviews for a teacher (Public endpoint)
router.get('/teacher/:teacherId', reviewController.getTeacherReviews);

module.exports = router;
