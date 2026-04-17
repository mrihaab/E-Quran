/**
 * ADMIN APPROVAL ROUTES
 * 
 * Teacher verification and approval management
 */

const express = require('express');
const router = express.Router();
const adminApprovalController = require('../controllers/adminApprovalController');
const { verifyTokenAndApproval, requireRole } = require('../middleware/strictAuth');

// All routes require admin role and approved status
router.use(verifyTokenAndApproval);
router.use(requireRole('admin'));

// ============================================
// TEACHER APPROVAL MANAGEMENT
// ============================================

// Get pending teachers for review
router.get('/teachers/pending', adminApprovalController.getPendingTeachers);

// Get all teachers with filter
router.get('/teachers', adminApprovalController.getAllTeachers);

// Get approval statistics
router.get('/teachers/stats', adminApprovalController.getApprovalStats);

// Get single teacher details
router.get('/teachers/:teacherId', adminApprovalController.getTeacherDetails);

// Approve teacher
router.post('/teachers/:teacherId/approve', adminApprovalController.approveTeacher);

// Reject teacher
router.post('/teachers/:teacherId/reject', adminApprovalController.rejectTeacher);

// Suspend teacher
router.post('/teachers/:teacherId/suspend', adminApprovalController.suspendTeacher);

// Reactivate teacher
router.post('/teachers/:teacherId/reactivate', adminApprovalController.reactivateTeacher);

// Update admin notes
router.put('/teachers/:teacherId/notes', adminApprovalController.updateAdminNotes);

// View document info (URL only, actual file serving is protected)
router.get('/teachers/:teacherId/documents/:documentType', adminApprovalController.getTeacherDocument);

module.exports = router;
