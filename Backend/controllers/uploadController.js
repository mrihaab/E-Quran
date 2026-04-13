const db = require('../config/db');
const { ApiError } = require('../middleware/errorMiddleware');
const { sendResponse } = require('../utils/responseHandler');

/**
 * Upload Profile Image
 */
exports.uploadProfile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded.');
    }

    const userId = req.user.id;
    const imageUrl = `/uploads/${req.file.filename}`;

    await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [imageUrl, userId]);

    sendResponse(res, 200, { imageUrl }, 'Profile image updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Teacher Document
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded.');
    }

    // Only teachers can upload documents
    if (req.user.role !== 'teacher') {
      throw new ApiError(403, 'Only teachers can upload certification documents.');
    }

    const userId = req.user.id;
    const docUrl = `/uploads/${req.file.filename}`;

    sendResponse(res, 200, { documentUrl: docUrl }, 'Document uploaded successfully.');
  } catch (error) {
    next(error);
  }
};
