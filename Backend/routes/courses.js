const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==================== GET ALL COURSES ====================
router.get('/', async (req, res) => {
  try {
    const [courses] = await db.query(
      `SELECT c.*, u.full_name as instructor_name
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       ORDER BY c.created_at DESC`
    );

    const formatted = courses.map(c => ({
      id: c.id,
      name: c.name,
      level: c.level,
      description: c.description,
      instructor: c.instructor_name || 'TBA',
      instructorId: c.instructor_id
    }));

    res.json({ courses: formatted });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

module.exports = router;
