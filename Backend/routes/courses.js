const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseContentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// MODULES
router.post('/modules', verifyToken, requireRole('teacher', 'admin'), courseController.createModule);
router.get('/classes/:classId/modules', verifyToken, courseController.getModulesByClass);
router.delete('/modules/:moduleId', verifyToken, requireRole('teacher', 'admin'), courseController.deleteModule);

// LESSONS
router.post('/lessons', verifyToken, requireRole('teacher', 'admin'), courseController.createLesson);
router.get('/modules/:moduleId/lessons', verifyToken, courseController.getLessonsByModule);
router.delete('/lessons/:lessonId', verifyToken, requireRole('teacher', 'admin'), courseController.deleteLesson);

module.exports = router;
