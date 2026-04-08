const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==================== GET ALL TEACHERS ====================
router.get('/', async (req, res) => {
  try {
    const { subject, search } = req.query;

    let query = `
      SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, u.gender,
             t.teacher_id, t.qualification, t.subject, t.years_experience, t.salary,
             t.rating, t.expertise, t.availability, t.languages
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      WHERE u.role = 'teacher' AND u.status = 'active'
    `;
    const params = [];

    if (subject && subject !== 'all') {
      query += ' AND t.subject = ?';
      params.push(subject);
    }

    if (search) {
      query += ' AND (u.full_name LIKE ? OR t.subject LIKE ? OR t.expertise LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.rating DESC';

    const [teachers] = await db.query(query, params);

    const formatted = teachers.map(t => ({
      id: t.id,
      name: t.full_name,
      email: t.email,
      phone: t.phone,
      image: t.profile_image,
      gender: t.gender,
      teacherId: t.teacher_id,
      qualification: t.qualification,
      subject: t.subject,
      experience: `${t.years_experience} years`,
      yearsExperience: t.years_experience,
      salary: t.salary,
      rating: parseFloat(t.rating) || 0,
      expertise: t.expertise,
      availability: t.availability,
      languages: t.languages ? t.languages.split(', ') : []
    }));

    res.json({ teachers: formatted });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers.' });
  }
});

// ==================== GET SINGLE TEACHER ====================
router.get('/:teacherId', async (req, res) => {
  try {
    const [teachers] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, u.gender,
              t.teacher_id, t.qualification, t.subject, t.years_experience, t.salary,
              t.rating, t.expertise, t.availability, t.languages
       FROM users u
       JOIN teachers t ON u.id = t.user_id
       WHERE u.id = ? AND u.role = 'teacher'`,
      [req.params.teacherId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    const t = teachers[0];
    res.json({
      id: t.id,
      name: t.full_name,
      email: t.email,
      phone: t.phone,
      image: t.profile_image,
      gender: t.gender,
      teacherId: t.teacher_id,
      qualification: t.qualification,
      subject: t.subject,
      experience: `${t.years_experience} years`,
      yearsExperience: t.years_experience,
      salary: t.salary,
      rating: parseFloat(t.rating) || 0,
      expertise: t.expertise,
      availability: t.availability,
      languages: t.languages ? t.languages.split(', ') : []
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher.' });
  }
});

module.exports = router;
