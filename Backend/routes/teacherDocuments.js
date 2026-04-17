/**
 * TEACHER DOCUMENT UPLOAD ROUTES
 * 
 * Secure document upload and management
 */

const express = require('express');
const router = express.Router();
const teacherDocumentController = require('../controllers/teacherDocumentController');
const { verifyTokenAndApproval, requireRole } = require('../middleware/strictAuth');
const { uploadTeacherDocs, canUploadDocuments, canViewDocument } = require('../middleware/fileUpload');

// ============================================
// DOCUMENT UPLOAD
// ============================================

// Single document upload (for teachers)
router.post(
  '/upload',
  verifyTokenAndApproval,
  requireRole('teacher', 'admin'),
  canUploadDocuments,
  uploadTeacherDocs.single('document'),
  teacherDocumentController.uploadDocument
);

// Multiple documents upload
router.post(
  '/upload-multiple',
  verifyTokenAndApproval,
  requireRole('teacher', 'admin'),
  uploadTeacherDocs.array('documents', 4),
  teacherDocumentController.uploadMultipleDocuments
);

// ============================================
// DOCUMENT VIEWING
// ============================================

// Get my documents (teacher view)
router.get(
  '/my-documents',
  verifyTokenAndApproval,
  requireRole('teacher'),
  teacherDocumentController.getMyDocuments
);

// Check document completeness status
router.get(
  '/status',
  verifyTokenAndApproval,
  requireRole('teacher'),
  teacherDocumentController.checkDocumentStatus
);

// ============================================
// DOCUMENT MANAGEMENT
// ============================================

// Delete a document
router.delete(
  '/:documentType',
  verifyTokenAndApproval,
  requireRole('teacher'),
  teacherDocumentController.deleteDocument
);

module.exports = router;
