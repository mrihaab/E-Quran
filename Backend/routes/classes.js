const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, requireRole } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');

// ----------------------
// PUBLIC ROUTES (NO AUTH)
// ----------------------
// TODO: Consider splitting public/protected routes in future refactor.
router.get('/', classController.getClasses);
router.get('/:classId', classController.getClassById);

// ----------------------
// PROTECTED ROUTES (AUTH + APPROVAL REQUIRED)
// ----------------------
// Middleware order: verifyToken -> authGuard -> approvalMiddleware
router.get('/teacher/:teacherId', verifyToken, authGuard, approvalMiddleware, classController.getClassesByTeacher);

// ==================== MANAGEMENT ====================
router.post('/', verifyToken, authGuard, approvalMiddleware, requireRole('teacher', 'admin'), classController.createClass);
router.put('/:classId', verifyToken, authGuard, approvalMiddleware, requireRole('teacher', 'admin'), classController.updateClass);
router.delete('/:classId', verifyToken, authGuard, approvalMiddleware, requireRole('teacher', 'admin'), classController.deleteClass);

module.exports = router;
