const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseContentController');
const { verifyToken, requireRole } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');

// ----------------------
// PROTECTED ROUTES (AUTH + APPROVAL REQUIRED)
// ----------------------
// Middleware order: verifyToken -> authGuard -> approvalMiddleware
// MODULES
router.post('/modules', verifyToken, authGuard, approvalMiddleware, requireRole('teacher', 'admin'), courseController.createModule);
router.get('/classes/:classId/modules', verifyToken, authGuard, approvalMiddleware, courseController.getModulesByClass);
router.delete('/modules/:moduleId', verifyToken, authGuard, approvalMiddleware, requireRole('teacher', 'admin'), courseController.deleteModule);

// LESSONS
router.post('/lessons', verifyToken, authGuard, approvalMiddleware, requireRole('teacher', 'admin'), courseController.createLesson);
router.get('/modules/:moduleId/lessons', verifyToken, authGuard, approvalMiddleware, courseController.getLessonsByModule);
router.delete('/lessons/:lessonId', verifyToken, authGuard, approvalMiddleware, requireRole('teacher', 'admin'), courseController.deleteLesson);

module.exports = router;
