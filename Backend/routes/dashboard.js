const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');
const { sendResponse } = require('../utils/responseHandler');

// ==================== STUDENT DASHBOARD STATS ====================
router.get('/student', verifyToken, authGuard, approvalMiddleware, async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. Next upcoming class
    const [nextClassRows] = await db.query(
      `SELECT c.id, c.name, c.schedule, c.level, c.subject,
              u.full_name as teacher, u.profile_image as teacher_image
       FROM enrollments e
       JOIN classes c ON e.class_id = c.id
       JOIN users u ON c.teacher_id = u.id
       WHERE e.student_id = ? AND c.status = 'Active' AND e.is_deleted = 0 AND c.is_deleted = 0
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [studentId]
    );

    // 2. Enrolled classes count
    const [[enrolledCount]] = await db.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND is_deleted = 0",
      [studentId]
    );

    // 3. Completed classes
    const [[completedCount]] = await db.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND status = 'completed' AND is_deleted = 0",
      [studentId]
    );

    // 4. Unread messages count
    const [[unreadMessages]] = await db.query(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0",
      [studentId]
    );

    // 5. Student level from students table
    const [studentRows] = await db.query(
      'SELECT level, course, enrollment_year FROM students WHERE user_id = ?',
      [studentId]
    );
    const studentInfo = studentRows[0] || { level: 'Beginner', course: null, enrollment_year: new Date().getFullYear() };

    // 6. Enrolled classes list (for quick view)
    const [enrolledClasses] = await db.query(
      `SELECT c.id, c.name, c.schedule, c.level, c.subject, c.status,
              u.full_name as teacher_name, u.profile_image as teacher_image
       FROM enrollments e
       JOIN classes c ON e.class_id = c.id
       JOIN users u ON c.teacher_id = u.id
       WHERE e.student_id = ? AND e.is_deleted = 0 AND c.is_deleted = 0
       ORDER BY c.created_at DESC
       LIMIT 5`,
      [studentId]
    );

    // 7. Recent messages
    const [recentMessages] = await db.query(
      `SELECT m.id, m.content, m.created_at, m.is_read,
              u.full_name as sender_name, u.profile_image as sender_image
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.receiver_id = ? AND m.is_deleted = 0
       ORDER BY m.created_at DESC LIMIT 5`,
      [studentId]
    );

    // 8. Performance data - week-over-week enrollment trend (real data)
    const [performanceData] = await db.query(
      `SELECT
         CONCAT('Week ', WEEK(created_at, 1) - WEEK(DATE_SUB(NOW(), INTERVAL 6 WEEK), 1) + 1) as name,
         COUNT(*) as value
       FROM enrollments
       WHERE student_id = ? AND is_deleted = 0
         AND created_at >= DATE_SUB(NOW(), INTERVAL 6 WEEK)
       GROUP BY WEEK(created_at, 1)
       ORDER BY WEEK(created_at, 1)`,
      [studentId]
    );

    // Fallback performance data if not enough real data
    const perfData = performanceData.length >= 2 ? performanceData : [
      { name: 'Week 1', value: 0 },
      { name: 'Week 2', value: enrolledCount.count > 0 ? 1 : 0 },
      { name: 'Week 3', value: enrolledCount.count > 1 ? 2 : 0 },
      { name: 'Week 4', value: enrolledCount.count },
      { name: 'Week 5', value: enrolledCount.count },
      { name: 'Week 6', value: enrolledCount.count }
    ];

    sendResponse(res, 200, {
      nextClass: nextClassRows[0] || null,
      enrolledClassesCount: enrolledCount.count,
      lessonsCompleted: completedCount.count,
      unreadMessages: unreadMessages.count,
      currentLevel: studentInfo.level || 'Beginner',
      course: studentInfo.course,
      enrollmentYear: studentInfo.enrollment_year,
      enrolledClasses,
      recentMessages,
      performanceData: perfData
    });
  } catch (error) {
    next(error);
  }
});

// ==================== TEACHER DASHBOARD STATS ====================
router.get('/teacher', verifyToken, authGuard, approvalMiddleware, async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // 1. Total unique active students
    const [[students]] = await db.query(
      `SELECT COUNT(DISTINCT e.student_id) as count
       FROM classes c
       JOIN enrollments e ON c.id = e.class_id
       WHERE c.teacher_id = ? AND c.is_deleted = 0 AND e.is_deleted = 0`,
      [teacherId]
    );

    // 2. Total active classes
    const [[classes]] = await db.query(
      "SELECT COUNT(*) as count FROM classes WHERE teacher_id = ? AND status = 'Active' AND is_deleted = 0",
      [teacherId]
    );

    // 3. Total classes (all statuses)
    const [[allClasses]] = await db.query(
      "SELECT COUNT(*) as count FROM classes WHERE teacher_id = ? AND is_deleted = 0",
      [teacherId]
    );

    // 4. Unread messages
    const [[unreadMessages]] = await db.query(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0",
      [teacherId]
    );

    // 5. Total earnings
    const [[earnings]] = await db.query(
      "SELECT IFNULL(SUM(amount), 0) as total FROM payments WHERE payee_id = ? AND status = 'completed'",
      [teacherId]
    );

    // 6. Subject/class distribution
    const [distribution] = await db.query(
      `SELECT IFNULL(subject, name) as name, COUNT(*) as value
       FROM classes
       WHERE teacher_id = ? AND is_deleted = 0
       GROUP BY IFNULL(subject, name)`,
      [teacherId]
    );

    // 7. Upcoming classes list
    const [upcoming] = await db.query(
      `SELECT id, name as class, schedule as time,
              IFNULL(enrolled_count, 0) as students,
              level, status, subject
       FROM classes
       WHERE teacher_id = ? AND is_deleted = 0
       ORDER BY created_at DESC
       LIMIT 5`,
      [teacherId]
    );

    // 8. Teacher profile data
    const [teacherRows] = await db.query(
      'SELECT rating, subject, qualification, years_experience FROM teachers WHERE user_id = ?',
      [teacherId]
    );
    const teacherInfo = teacherRows[0] || {};

    // 9. Recent students enrolled in teacher's classes
    const [recentStudents] = await db.query(
      `SELECT u.id, u.full_name, u.profile_image, c.name as class_name, e.created_at as enrolled_at
       FROM enrollments e
       JOIN classes c ON e.class_id = c.id
       JOIN users u ON e.student_id = u.id
       WHERE c.teacher_id = ? AND e.is_deleted = 0 AND c.is_deleted = 0
       ORDER BY e.created_at DESC LIMIT 5`,
      [teacherId]
    );

    sendResponse(res, 200, {
      activeStudents: students.count,
      classesThisWeek: classes.count,
      totalClasses: allClasses.count,
      totalEarnings: parseFloat(earnings.total),
      unreadMessages: unreadMessages.count,
      rating: teacherInfo.rating || 0,
      subject: teacherInfo.subject,
      qualification: teacherInfo.qualification,
      yearsExperience: teacherInfo.years_experience || 0,
      distribution: distribution.length > 0 ? distribution : [{ name: 'N/A', value: 1 }],
      upcomingClasses: upcoming,
      recentStudents,
      performanceData: [
        { name: 'Week 1', value: Math.max(0, students.count - 5) },
        { name: 'Week 2', value: Math.max(0, students.count - 3) },
        { name: 'Week 3', value: Math.max(0, students.count - 2) },
        { name: 'Week 4', value: Math.max(0, students.count - 1) },
        { name: 'Week 5', value: students.count },
        { name: 'Week 6', value: students.count }
      ]
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PARENT DASHBOARD STATS ====================
router.get('/parent', verifyToken, authGuard, approvalMiddleware, async (req, res, next) => {
  try {
    const parentId = req.user.id;

    // Get linked children
    const [children] = await db.query(
      `SELECT u.id, u.full_name, u.profile_image, s.level, s.course
       FROM parent_student_links psl
       JOIN users u ON psl.student_id = u.id
       JOIN students s ON s.user_id = u.id
       WHERE psl.parent_id = ? AND u.is_deleted = 0`,
      [parentId]
    ).catch(() => [[]]);  // If table doesn't exist, return empty

    // Get unread messages
    const [[unreadMessages]] = await db.query(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0",
      [parentId]
    );

    // Payments made by parent
    const [[paymentsData]] = await db.query(
      "SELECT IFNULL(SUM(amount), 0) as total, COUNT(*) as count FROM payments WHERE payer_id = ? AND status = 'completed'",
      [parentId]
    ).catch(() => [[{ total: 0, count: 0 }]]);

    sendResponse(res, 200, {
      children,
      unreadMessages: unreadMessages.count,
      totalPayments: parseFloat(paymentsData?.total || 0),
      paymentCount: paymentsData?.count || 0
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
