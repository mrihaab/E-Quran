/**
 * TEACHER DOCUMENT UPLOAD CONTROLLER
 * 
 * Handles:
 * - Uploading CNIC
 * - Uploading Profile Photo
 * - Uploading Resume
 * - Uploading Certificates
 * - Viewing uploaded documents
 * - Replacing old documents
 */

const db = require('../config/db');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');
const { 
  deleteOldDocument, 
  getRelativePath, 
  validateUploadedFile 
} = require('../middleware/fileUpload');

// ============================================
// UPLOAD DOCUMENT
// ============================================

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    // Validate the uploaded file
    const validation = validateUploadedFile(req.file);
    if (!validation.valid) {
      throw new ApiError(400, validation.error);
    }

    const userId = req.user.id;
    const documentType = req.body.documentType;
    const isAdminUpload = req.user.role === 'admin';
    const targetTeacherId = parseInt(req.body.teacherId) || userId;

    // Validate document type
    const validTypes = ['cnic', 'profile_photo', 'resume', 'certificate'];
    if (!validTypes.includes(documentType)) {
      throw new ApiError(400, 'Invalid document type');
    }

    // Get column name for this document type
    const columnMap = {
      'cnic': 'cnic_url',
      'profile_photo': 'profile_photo_url',
      'resume': 'resume_url',
      'certificate': 'certificate_url'
    };

    const columnName = columnMap[documentType];

    // Delete old document if exists
    await deleteOldDocument(targetTeacherId, documentType);

    // Get relative path for database
    const relativePath = getRelativePath(req.file.path);

    // Update database
    const [existing] = await db.query(
      'SELECT id FROM teacher_verification_documents WHERE user_id = ?',
      [targetTeacherId]
    );

    if (existing.length === 0) {
      // Insert new record
      await db.query(
        `INSERT INTO teacher_verification_documents (user_id, ${columnName}) VALUES (?, ?)`,
        [targetTeacherId, relativePath]
      );
    } else {
      // Update existing record
      await db.query(
        `UPDATE teacher_verification_documents SET ${columnName} = ? WHERE user_id = ?`,
        [relativePath, targetTeacherId]
      );
    }

    logger.info(`Document uploaded: ${documentType} for teacher ${targetTeacherId} by ${isAdminUpload ? 'admin' : 'teacher'} ${userId}`);

    sendResponse(res, 200, {
      documentType,
      filePath: relativePath,
      originalName: req.file.originalname,
      size: req.file.size
    }, 'Document uploaded successfully');

  } catch (error) {
    next(error);
  }
};

// ============================================
// UPLOAD MULTIPLE DOCUMENTS
// ============================================

exports.uploadMultipleDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'No files uploaded');
    }

    const userId = req.user.id;
    const targetTeacherId = parseInt(req.body.teacherId) || userId;
    const uploadedDocs = [];

    // Process each file
    for (const file of req.files) {
      // Validate file
      const validation = validateUploadedFile(file);
      if (!validation.valid) {
        logger.warn(`Skipping invalid file: ${file.originalname} - ${validation.error}`);
        continue;
      }

      // Extract document type from filename prefix
      const filenameParts = file.filename.split('-');
      const documentType = filenameParts[0];

      if (!['cnic', 'profile_photo', 'resume', 'certificate'].includes(documentType)) {
        continue;
      }

      // Get column name
      const columnMap = {
        'cnic': 'cnic_url',
        'profile_photo': 'profile_photo_url',
        'resume': 'resume_url',
        'certificate': 'certificate_url'
      };

      const columnName = columnMap[documentType];
      const relativePath = getRelativePath(file.path);

      // Update database
      const [existing] = await db.query(
        'SELECT id FROM teacher_verification_documents WHERE user_id = ?',
        [targetTeacherId]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO teacher_verification_documents (user_id, ${columnName}) VALUES (?, ?)`,
          [targetTeacherId, relativePath]
        );
      } else {
        await db.query(
          `UPDATE teacher_verification_documents SET ${columnName} = ? WHERE user_id = ?`,
          [relativePath, targetTeacherId]
        );
      }

      uploadedDocs.push({
        documentType,
        filePath: relativePath,
        originalName: file.originalname
      });

      logger.info(`Bulk upload: ${documentType} for teacher ${targetTeacherId}`);
    }

    sendResponse(res, 200, { uploadedDocuments: uploadedDocs }, 
      `${uploadedDocs.length} document(s) uploaded successfully`);

  } catch (error) {
    next(error);
  }
};

// ============================================
// GET MY DOCUMENTS (Teacher view)
// ============================================

exports.getMyDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [documents] = await db.query(
      `SELECT 
        cnic_url,
        profile_photo_url,
        resume_url,
        certificate_url,
        additional_docs,
        uploaded_at
      FROM teacher_verification_documents
      WHERE user_id = ?`,
      [userId]
    );

    if (documents.length === 0) {
      return sendResponse(res, 200, {
        documents: null,
        message: 'No documents uploaded yet'
      });
    }

    const docs = documents[0];

    // Build response with upload status for each document type
    const response = {
      cnic: {
        uploaded: !!docs.cnic_url,
        url: docs.cnic_url,
        uploadedAt: docs.uploaded_at
      },
      profilePhoto: {
        uploaded: !!docs.profile_photo_url,
        url: docs.profile_photo_url,
        uploadedAt: docs.uploaded_at
      },
      resume: {
        uploaded: !!docs.resume_url,
        url: docs.resume_url,
        uploadedAt: docs.uploaded_at
      },
      certificate: {
        uploaded: !!docs.certificate_url,
        url: docs.certificate_url,
        uploadedAt: docs.uploaded_at
      },
      additionalDocs: docs.additional_docs ? JSON.parse(docs.additional_docs) : null
    };

    sendResponse(res, 200, { documents: response });

  } catch (error) {
    next(error);
  }
};

// ============================================
// CHECK DOCUMENT COMPLETENESS
// ============================================

exports.checkDocumentStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [documents] = await db.query(
      `SELECT 
        cnic_url,
        profile_photo_url,
        resume_url,
        certificate_url
      FROM teacher_verification_documents
      WHERE user_id = ?`,
      [userId]
    );

    if (documents.length === 0) {
      return sendResponse(res, 200, {
        isComplete: false,
        missingDocuments: ['cnic', 'profile_photo', 'resume', 'certificate'],
        completionPercentage: 0
      });
    }

    const docs = documents[0];
    
    const requiredDocs = {
      cnic: !!docs.cnic_url,
      profilePhoto: !!docs.profile_photo_url,
      resume: !!docs.resume_url,
      certificate: !!docs.certificate_url
    };

    const missingDocs = Object.entries(requiredDocs)
      .filter(([_, present]) => !present)
      .map(([name]) => name);

    const completionPercentage = 
      ((4 - missingDocs.length) / 4) * 100;

    sendResponse(res, 200, {
      isComplete: missingDocs.length === 0,
      missingDocuments: missingDocs,
      completionPercentage: Math.round(completionPercentage),
      documents: requiredDocs
    });

  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE DOCUMENT
// ============================================

exports.deleteDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentType } = req.params;

    const columnMap = {
      'cnic': 'cnic_url',
      'profile_photo': 'profile_photo_url',
      'resume': 'resume_url',
      'certificate': 'certificate_url'
    };

    const columnName = columnMap[documentType];
    if (!columnName) {
      throw new ApiError(400, 'Invalid document type');
    }

    // Get current document path
    const [documents] = await db.query(
      `SELECT ${columnName} as doc_path FROM teacher_verification_documents WHERE user_id = ?`,
      [userId]
    );

    if (documents.length === 0 || !documents[0].doc_path) {
      throw new ApiError(404, 'Document not found');
    }

    // Delete file from filesystem
    const { getAbsolutePath } = require('../middleware/fileUpload');
    const absolutePath = getAbsolutePath(documents[0].doc_path);
    
    if (require('fs').existsSync(absolutePath)) {
      require('fs').unlinkSync(absolutePath);
    }

    // Clear database record
    await db.query(
      `UPDATE teacher_verification_documents SET ${columnName} = NULL WHERE user_id = ?`,
      [userId]
    );

    logger.info(`Document deleted: ${documentType} for teacher ${userId}`);

    sendResponse(res, 200, {}, 'Document deleted successfully');

  } catch (error) {
    next(error);
  }
};

module.exports = exports;
