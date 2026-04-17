/**
 * SECURE FILE UPLOAD SYSTEM
 * 
 * Features:
 * - Multer configuration for secure uploads
 * - File type validation
 * - File size limits
 * - Secure filename generation
 * - Admin-only access control
 * - Document type restrictions
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Base upload directory - ensure this is OUTSIDE of public static serving
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

// Teacher documents directory
const TEACHER_DOCS_DIR = path.join(UPLOAD_BASE_DIR, 'teachers');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}
if (!fs.existsSync(TEACHER_DOCS_DIR)) {
  fs.mkdirSync(TEACHER_DOCS_DIR, { recursive: true });
}

/**
 * Generate secure random filename
 * Prevents filename-based attacks
 */
function generateSecureFilename(originalName) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  return `${timestamp}-${randomString}${extension}`;
}

/**
 * Validate file type
 */
function validateFileType(file, allowedTypes) {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;
  
  // Check both extension and mimetype
  const allowedExtensions = allowedTypes.map(type => type.toLowerCase());
  const allowedMimes = {
    '.jpg': ['image/jpeg', 'image/jpg'],
    '.jpeg': ['image/jpeg', 'image/jpg'],
    '.png': ['image/png'],
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}` };
  }
  
  // Additional MIME type check
  const expectedMimes = allowedMimes[extension] || [];
  if (expectedMimes.length > 0 && !expectedMimes.includes(mimeType)) {
    return { valid: false, error: 'File type does not match extension' };
  }
  
  return { valid: true };
}

/**
 * Create user-specific upload directory
 */
function ensureUserDirectory(userId) {
  const userDir = path.join(TEACHER_DOCS_DIR, userId.toString());
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

/**
 * Multer storage configuration for teacher documents
 */
const teacherDocsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use user-specific directory
    const userId = req.user.id;
    const userDir = ensureUserDirectory(userId);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename - original name is NEVER used
    const secureName = generateSecureFilename(file.originalname);
    
    // Add document type prefix for organization
    const docType = req.body.documentType || 'doc';
    const finalName = `${docType}-${secureName}`;
    
    cb(null, finalName);
  }
});

/**
 * File filter for teacher documents
 */
const teacherDocsFilter = (req, file, cb) => {
  // Map document types to allowed extensions
  const docType = req.body.documentType;
  
  const allowedTypesMap = {
    'cnic': ['.jpg', '.jpeg', '.png', '.pdf'],
    'profile_photo': ['.jpg', '.jpeg', '.png'],
    'resume': ['.pdf', '.doc', '.docx'],
    'certificate': ['.pdf', '.jpg', '.jpeg', '.png']
  };
  
  const allowedTypes = allowedTypesMap[docType] || ['.pdf', '.jpg', '.jpeg', '.png'];
  
  const validation = validateFileType(file, allowedTypes);
  
  if (!validation.valid) {
    logger.warn(`File upload rejected: ${validation.error}`);
    return cb(new Error(validation.error), false);
  }
  
  cb(null, true);
};

/**
 * Multer upload instance for teacher documents
 */
const uploadTeacherDocs = multer({
  storage: teacherDocsStorage,
  fileFilter: teacherDocsFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 4 // Max 4 files per upload
  }
});

/**
 * Middleware: Check if user can upload documents
 * - Teachers can upload their own documents
 * - Admins can upload for any teacher (during manual verification)
 */
function canUploadDocuments(req, res, next) {
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;
  const targetTeacherId = parseInt(req.params.teacherId || req.body.teacherId);
  
  // Admins can upload for any teacher
  if (requestingUserRole === 'admin') {
    return next();
  }
  
  // Teachers can only upload their own documents
  if (requestingUserRole === 'teacher' && targetTeacherId === requestingUserId) {
    return next();
  }
  
  logger.warn(`Unauthorized document upload attempt: User ${requestingUserId} (${requestingUserRole}) tried to upload for teacher ${targetTeacherId}`);
  
  return res.status(403).json({
    success: false,
    message: 'You can only upload your own verification documents',
    code: 'UNAUTHORIZED_UPLOAD'
  });
}

/**
 * Middleware: Serve document (Admin only or owner)
 * This protects uploaded documents from public access
 */
function canViewDocument(req, res, next) {
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;
  const requestedTeacherId = parseInt(req.params.teacherId);
  
  // Admins can view any document
  if (requestingUserRole === 'admin') {
    return next();
  }
  
  // Teachers can view their own documents only
  if (requestingUserRole === 'teacher' && requestedTeacherId === requestingUserId) {
    return next();
  }
  
  logger.warn(`Unauthorized document view attempt: User ${requestingUserId} (${requestingUserRole}) tried to view docs for teacher ${requestedTeacherId}`);
  
  return res.status(403).json({
    success: false,
    message: 'Access denied',
    code: 'UNAUTHORIZED_DOCUMENT_ACCESS'
  });
}

/**
 * Delete old document if it exists
 */
async function deleteOldDocument(userId, documentType) {
  try {
    const userDir = path.join(TEACHER_DOCS_DIR, userId.toString());
    
    if (!fs.existsSync(userDir)) {
      return;
    }
    
    // Find existing file of this type
    const files = fs.readdirSync(userDir);
    const prefix = `${documentType}-`;
    
    for (const file of files) {
      if (file.startsWith(prefix)) {
        const filePath = path.join(userDir, file);
        fs.unlinkSync(filePath);
        logger.info(`Deleted old document: ${filePath}`);
      }
    }
  } catch (error) {
    logger.error('Error deleting old document:', error);
  }
}

/**
 * Get relative path for database storage
 * (Stores relative path, not absolute)
 */
function getRelativePath(absolutePath) {
  return path.relative(UPLOAD_BASE_DIR, absolutePath);
}

/**
 * Get absolute path from relative path
 */
function getAbsolutePath(relativePath) {
  return path.join(UPLOAD_BASE_DIR, relativePath);
}

/**
 * Validate uploaded file (post-upload checks)
 */
function validateUploadedFile(file) {
  // Check file actually exists
  if (!fs.existsSync(file.path)) {
    return { valid: false, error: 'File upload failed' };
  }
  
  // Check file size (double-check)
  const stats = fs.statSync(file.path);
  if (stats.size > 10 * 1024 * 1024) {
    fs.unlinkSync(file.path); // Delete oversized file
    return { valid: false, error: 'File exceeds 10MB limit' };
  }
  
  // Check for empty files
  if (stats.size === 0) {
    fs.unlinkSync(file.path);
    return { valid: false, error: 'Uploaded file is empty' };
  }
  
  return { valid: true };
}

module.exports = {
  uploadTeacherDocs,
  canUploadDocuments,
  canViewDocument,
  deleteOldDocument,
  getRelativePath,
  getAbsolutePath,
  validateUploadedFile,
  TEACHER_DOCS_DIR,
  UPLOAD_BASE_DIR
};
