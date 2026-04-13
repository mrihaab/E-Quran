const db = require('../config/db');
const { getPaginatedRes } = require('../utils/paginate');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * SUBMIT A REVIEW
 */
exports.createReview = async (req, res, next) => {
  try {
    const { teacher_id, rating, comment } = req.body;
    const student_id = req.user.id;

    if (!teacher_id || !rating) throw new ApiError(400, 'Teacher ID and rating are required.');
    if (rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5.');

    // Check if teacher exists
    const [teachers] = await db.query('SELECT user_id FROM teachers WHERE user_id = ? AND is_deleted = 0', [teacher_id]);
    if (teachers.length === 0) throw new ApiError(404, 'Teacher not found.');

    // Check duplicate
    const [existing] = await db.query(
      'SELECT id FROM reviews WHERE student_id = ? AND teacher_id = ? AND is_deleted = 0',
      [student_id, teacher_id]
    );
    if (existing.length > 0) throw new ApiError(400, 'You have already reviewed this teacher.');

    // Insert review
    await db.query(
      'INSERT INTO reviews (student_id, teacher_id, rating, comment) VALUES (?, ?, ?, ?)',
      [student_id, teacher_id, rating, comment || null]
    );

    // Recalculate average rating
    const [stats] = await db.query(
      'SELECT AVG(rating) as avgRating FROM reviews WHERE teacher_id = ? AND is_deleted = 0',
      [teacher_id]
    );
    
    await db.query(
      'UPDATE teachers SET rating = ? WHERE user_id = ?',
      [stats[0].avgRating || rating, teacher_id]
    );

    sendResponse(res, 201, {}, 'Review submitted successfully!');
  } catch (error) {
    next(error);
  }
};

/**
 * GET REVIEWS FOR A TEACHER (Paginated)
 */
exports.getTeacherReviews = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const teacher_id = req.params.teacherId;

    const query = `
       SELECT r.*, u.full_name as student_name, u.profile_image as student_image 
       FROM reviews r
       JOIN users u ON r.student_id = u.id
       WHERE r.teacher_id = ? AND r.is_deleted = 0
       ORDER BY r.created_at DESC
    `;

    const result = await getPaginatedRes(query, [teacher_id], page, limit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};
