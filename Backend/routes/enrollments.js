const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { verifyToken } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');
const { requireOwnershipOrRole } = require('../middleware/ownershipMiddleware');

// ==================== ENROLLMENT ROUTES ====================
router.post('/', verifyToken, authGuard, approvalMiddleware, enrollmentController.enroll);
router.get('/student/:studentId', verifyToken, authGuard, approvalMiddleware, requireOwnershipOrRole({ paramKeys: ['studentId'] }), enrollmentController.getStudentEnrollments);
router.get('/class/:classId', verifyToken, authGuard, approvalMiddleware, enrollmentController.getClassEnrollees);
router.delete('/:enrollmentId', verifyToken, authGuard, approvalMiddleware, enrollmentController.unenroll);

module.exports = router;
