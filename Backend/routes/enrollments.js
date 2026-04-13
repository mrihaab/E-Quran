const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { verifyToken } = require('../middleware/auth');

// ==================== ENROLLMENT ROUTES ====================
router.post('/', verifyToken, enrollmentController.enroll);
router.get('/student/:studentId', verifyToken, enrollmentController.getStudentEnrollments);
router.get('/class/:classId', verifyToken, enrollmentController.getClassEnrollees);
router.delete('/:enrollmentId', verifyToken, enrollmentController.unenroll);

module.exports = router;
