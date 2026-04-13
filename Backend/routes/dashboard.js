const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');

// ==================== STUDENT DASHBOARD STATS ====================
router.get('/student', verifyToken, async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. Next Class
    const [nextClass] = await db.query(
      `SELECT c.name, c.schedule, u.full_name as teacher
       FROM enrollments e
       JOIN classes c ON e.class_id = c.id
       JOIN users u ON c.teacher_id = u.id
       WHERE e.student_id = ? AND c.status = 'Active' AND e.is_deleted = 0 AND c.is_deleted = 0
       LIMIT 1`,
      [studentId]
    );

    // 2. Attendance (Mock for now)
    const attendance = 95;

    // 3. Lessons Completed
    const [completed] = await db.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND status = 'completed' AND is_deleted = 0",
      [studentId]
    );

    // 4. Performance Trends (Mock)
    const performanceData = [
      { name: 'Week 1', value: 65 },
      { name: 'Week 2', value: 70 },
      { name: 'Week 3', value: 75.4 },
      { name: 'Week 4', value: 82 },
      { name: 'Week 5', value: 78 },
      { name: 'Week 6', value: 85 }
    ];

    sendResponse(res, 200, {
      nextClass: nextClass[0] || null,
      attendance,
      lessonsCompleted: completed[0].count,
      performanceData,
      currentLevel: 'Intermediate'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== TEACHER DASHBOARD STATS ====================
router.get('/teacher', verifyToken, async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // 1. Active Students Count
    const [students] = await db.query(
      `SELECT COUNT(DISTINCT e.student_id) as count
       FROM classes c
       JOIN enrollments e ON c.id = e.class_id
       WHERE c.teacher_id = ? AND c.is_deleted = 0 AND e.is_deleted = 0`,
      [teacherId]
    );

    // 2. Classes This Week
    const [classes] = await db.query(
      "SELECT COUNT(*) as count FROM classes WHERE teacher_id = ? AND status = 'Active' AND is_deleted = 0",
      [teacherId]
    );

    // 3. Avg Performance (Mock)
    const avgPerformance = 87;

    // 4. Subject Distribution
    const [distribution] = await db.query(
      `SELECT subject as name, COUNT(*) as value
       FROM classes
       WHERE teacher_id = ? AND is_deleted = 0
       GROUP BY subject`,
      [teacherId]
    );

    // 5. Upcoming Classes List
    const [upcoming] = await db.query(
      `SELECT name as class, schedule as time, enrolled_count as students, level
       FROM classes
       WHERE teacher_id = ? AND status = 'Active' AND is_deleted = 0
       LIMIT 4`,
      [teacherId]
    );

    sendResponse(res, 200, {
      activeStudents: students[0].count,
      classesThisWeek: classes[0].count,
      avgPerformance,
      distribution: distribution.length > 0 ? distribution : [{ name: 'N/A', value: 1 }],
      upcomingClasses: upcoming,
      performanceData: [
        { name: 'Week 1', value: 82 },
        { name: 'Week 2', value: 85 },
        { name: 'Week 3', value: 87.2 },
        { name: 'Week 4', value: 89 },
        { name: 'Week 5', value: 86 },
        { name: 'Week 6', value: 90 }
      ]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
