const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// ==================== ENROLL STUDENT IN CLASS ====================
router.post('/', verifyToken, async (req, res) => {
  try {
    const { classId } = req.body;
    const studentId = req.user.id;

    if (!classId) {
      return res.status(400).json({ error: 'classId is required.' });
    }

    // Check class exists and has capacity
    const [classes] = await db.query('SELECT * FROM classes WHERE id = ?', [classId]);
    if (classes.length === 0) return res.status(404).json({ error: 'Class not found.' });

    const cls = classes[0];
    if (cls.enrolled_count >= cls.capacity) {
      return res.status(400).json({ error: 'Class is full.' });
    }

    // Check if already enrolled
    const [existing] = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ?',
      [studentId, classId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this class.' });
    }

    // Create enrollment
    await db.query(
      'INSERT INTO enrollments (student_id, class_id, status) VALUES (?, ?, ?)',
      [studentId, classId, 'active']
    );

    // Update enrolled count
    await db.query('UPDATE classes SET enrolled_count = enrolled_count + 1 WHERE id = ?', [classId]);

    res.status(201).json({ message: 'Enrolled successfully.' });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Failed to enroll.' });
  }
});

// ==================== GET STUDENT'S ENROLLED CLASSES ====================
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const [enrollments] = await db.query(
      `SELECT e.*, c.name, c.subject, c.level, c.schedule, c.platform, c.status as classStatus,
              u.full_name as teacher_name
       FROM enrollments e
       JOIN classes c ON e.class_id = c.id
       JOIN users u ON c.teacher_id = u.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [req.params.studentId]
    );

    const formatted = enrollments.map(e => ({
      enrollmentId: e.id,
      classId: e.class_id,
      className: e.name,
      subject: e.subject,
      level: e.level,
      schedule: e.schedule,
      platform: e.platform,
      teacher: e.teacher_name,
      status: e.status,
      classStatus: e.classStatus,
      enrolledAt: e.enrolled_at
    }));

    res.json({ classes: formatted });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrolled classes.' });
  }
});

// ==================== GET CLASS ENROLLEES (for teacher) ====================
router.get('/class/:classId', verifyToken, async (req, res) => {
  try {
    const [enrollments] = await db.query(
      `SELECT e.*, u.full_name, u.email, u.profile_image
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.class_id = ?
       ORDER BY e.enrolled_at DESC`,
      [req.params.classId]
    );

    const formatted = enrollments.map(e => ({
      enrollmentId: e.id,
      studentId: e.student_id,
      studentName: e.full_name,
      email: e.email,
      profileImage: e.profile_image,
      status: e.status,
      enrolledAt: e.enrolled_at
    }));

    res.json({ students: formatted });
  } catch (error) {
    console.error('Get class enrollees error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollees.' });
  }
});

// ==================== UNENROLL ====================
router.delete('/:enrollmentId', verifyToken, async (req, res) => {
  try {
    const [enrollments] = await db.query('SELECT * FROM enrollments WHERE id = ?', [req.params.enrollmentId]);
    if (enrollments.length === 0) return res.status(404).json({ error: 'Enrollment not found.' });

    const enrollment = enrollments[0];

    await db.query('DELETE FROM enrollments WHERE id = ?', [req.params.enrollmentId]);
    await db.query('UPDATE classes SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE id = ?', [enrollment.class_id]);

    res.json({ message: 'Unenrolled successfully.' });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ error: 'Failed to unenroll.' });
  }
});

module.exports = router;
