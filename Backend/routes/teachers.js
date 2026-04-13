const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

// ==================== TEACHER DISCOVERY ====================
router.get('/', teacherController.getTeachers);
router.get('/:teacherId', teacherController.getTeacherById);

module.exports = router;
