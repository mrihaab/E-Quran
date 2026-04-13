const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ==================== CLASS DISCOVERY ====================
router.get('/', classController.getClasses);
router.get('/:classId', classController.getClassById);
router.get('/teacher/:teacherId', verifyToken, classController.getClassesByTeacher);

// ==================== MANAGEMENT ====================
router.post('/', verifyToken, requireRole('teacher', 'admin'), classController.createClass);
router.put('/:classId', verifyToken, requireRole('teacher', 'admin'), classController.updateClass);
router.delete('/:classId', verifyToken, requireRole('teacher', 'admin'), classController.deleteClass);

module.exports = router;
