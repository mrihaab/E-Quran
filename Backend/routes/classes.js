const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ==================== GET ALL CLASSES ====================
router.get('/', async (req, res) => {
  try {
    const [classes] = await db.query(
      `SELECT c.*, u.full_name as teacher_name
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       ORDER BY c.created_at DESC`
    );

    const formatted = classes.map(c => ({
      id: c.id,
      name: c.name,
      teacher: c.teacher_name,
      teacherId: c.teacher_id,
      subject: c.subject,
      level: c.level,
      schedule: c.schedule,
      capacity: c.capacity,
      enrolledCount: c.enrolled_count,
      platform: c.platform,
      status: c.status,
      createdAt: c.created_at
    }));

    res.json({ classes: formatted });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to fetch classes.' });
  }
});

// ==================== GET SINGLE CLASS ====================
router.get('/:classId', async (req, res) => {
  try {
    const [classes] = await db.query(
      `SELECT c.*, u.full_name as teacher_name
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.id = ?`,
      [req.params.classId]
    );

    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found.' });
    }

    const c = classes[0];
    res.json({
      id: c.id,
      name: c.name,
      teacher: c.teacher_name,
      teacherId: c.teacher_id,
      subject: c.subject,
      level: c.level,
      schedule: c.schedule,
      capacity: c.capacity,
      enrolledCount: c.enrolled_count,
      platform: c.platform,
      status: c.status
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Failed to fetch class.' });
  }
});

// ==================== CREATE CLASS (Teacher only) ====================
router.post('/', verifyToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { name, subject, level, schedule, capacity, platform } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ error: 'Class name and subject are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO classes (name, teacher_id, subject, level, schedule, capacity, platform)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, req.user.id, subject, level || 'Beginner', schedule || 'Not specified', capacity || 20, platform || 'Zoom']
    );

    res.status(201).json({
      message: 'Class created successfully.',
      classId: result.insertId
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class.' });
  }
});

// ==================== UPDATE CLASS ====================
router.put('/:classId', verifyToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { name, subject, level, schedule, capacity, platform, status } = req.body;
    const classId = req.params.classId;

    // Verify teacher owns this class (unless admin)
    if (req.user.role !== 'admin') {
      const [classes] = await db.query('SELECT teacher_id FROM classes WHERE id = ?', [classId]);
      if (classes.length === 0) return res.status(404).json({ error: 'Class not found.' });
      if (classes[0].teacher_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own classes.' });
    }

    const updates = [];
    const values = [];
    if (name) { updates.push('name = ?'); values.push(name); }
    if (subject) { updates.push('subject = ?'); values.push(subject); }
    if (level) { updates.push('level = ?'); values.push(level); }
    if (schedule) { updates.push('schedule = ?'); values.push(schedule); }
    if (capacity) { updates.push('capacity = ?'); values.push(capacity); }
    if (platform) { updates.push('platform = ?'); values.push(platform); }
    if (status) { updates.push('status = ?'); values.push(status); }

    if (updates.length > 0) {
      values.push(classId);
      await db.query(`UPDATE classes SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    res.json({ message: 'Class updated successfully.' });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Failed to update class.' });
  }
});

// ==================== DELETE CLASS ====================
router.delete('/:classId', verifyToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const classId = req.params.classId;

    if (req.user.role !== 'admin') {
      const [classes] = await db.query('SELECT teacher_id FROM classes WHERE id = ?', [classId]);
      if (classes.length === 0) return res.status(404).json({ error: 'Class not found.' });
      if (classes[0].teacher_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own classes.' });
    }

    await db.query('DELETE FROM classes WHERE id = ?', [classId]);
    res.json({ message: 'Class deleted successfully.' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class.' });
  }
});

// ==================== GET CLASSES BY TEACHER ====================
router.get('/teacher/:teacherId', verifyToken, async (req, res) => {
  try {
    const [classes] = await db.query(
      `SELECT c.*, u.full_name as teacher_name
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.teacher_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.teacherId]
    );

    const formatted = classes.map(c => ({
      id: c.id,
      name: c.name,
      teacher: c.teacher_name,
      teacherId: c.teacher_id,
      subject: c.subject,
      level: c.level,
      schedule: c.schedule,
      capacity: c.capacity,
      enrolledCount: c.enrolled_count,
      platform: c.platform,
      status: c.status
    }));

    res.json({ classes: formatted });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher classes.' });
  }
});

module.exports = router;
