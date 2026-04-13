const db = require('../config/db');
const { getPaginatedRes } = require('../utils/paginate');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * GET ALL TEACHERS (Advanced Search, Filtering & Pagination)
 */
exports.getTeachers = async (req, res, next) => {
  try {
    const { 
      subject, 
      search, 
      minRating, 
      minExperience, 
      sortBy, 
      gender,
      page,
      limit
    } = req.query;

    let query = `
      SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, u.gender, u.created_at,
             t.teacher_id, t.qualification, t.subject, t.years_experience, t.salary,
             t.rating, t.expertise, t.availability, t.languages
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      WHERE u.role = 'teacher' AND u.status = 'active' AND u.is_deleted = 0
    `;
    const params = [];

    if (subject && subject !== 'all') {
      query += ' AND t.subject = ?';
      params.push(subject);
    }

    if (gender) {
      query += ' AND u.gender = ?';
      params.push(gender);
    }

    if (minRating) {
      query += ' AND t.rating >= ?';
      params.push(parseFloat(minRating));
    }

    if (minExperience) {
      query += ' AND t.years_experience >= ?';
      params.push(parseInt(minExperience));
    }

    if (search) {
      query += ' AND (u.full_name LIKE ? OR t.subject LIKE ? OR t.expertise LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Sorting
    if (sortBy === 'newest') {
      query += ' ORDER BY u.created_at DESC';
    } else if (sortBy === 'experience') {
      query += ' ORDER BY t.years_experience DESC';
    } else {
      query += ' ORDER BY t.rating DESC';
    }

    const { data, metadata } = await getPaginatedRes(query, params, page, limit);

    const formatted = data.map(t => ({
      id: t.id,
      name: t.full_name,
      email: t.email,
      phone: t.phone,
      image: t.profile_image,
      gender: t.gender,
      teacherId: t.teacher_id,
      qualification: t.qualification,
      subject: t.subject,
      yearsExperience: t.years_experience,
      rating: parseFloat(t.rating) || 0,
      expertise: t.expertise,
      availability: t.availability,
      languages: t.languages ? t.languages.split(', ') : [],
      createdAt: t.created_at
    }));

    sendResponse(res, 200, { teachers: formatted, metadata });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE TEACHER
 */
exports.getTeacherById = async (req, res, next) => {
  try {
    const [teachers] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, u.gender,
              t.teacher_id, t.qualification, t.subject, t.years_experience, t.salary,
              t.rating, t.expertise, t.availability, t.languages
       FROM users u
       JOIN teachers t ON u.id = t.user_id
       WHERE u.id = ? AND u.role = 'teacher' AND u.is_deleted = 0`,
      [req.params.teacherId]
    );

    if (teachers.length === 0) throw new ApiError(404, 'Teacher not found.');

    const t = teachers[0];
    const formatted = {
      id: t.id,
      name: t.full_name,
      email: t.email,
      image: t.profile_image,
      gender: t.gender,
      teacherId: t.teacher_id,
      qualification: t.qualification,
      subject: t.subject,
      yearsExperience: t.years_experience,
      rating: parseFloat(t.rating) || 0,
      expertise: t.expertise,
      availability: t.availability,
      languages: t.languages ? t.languages.split(', ') : []
    };

    sendResponse(res, 200, formatted);
  } catch (error) {
    next(error);
  }
};
