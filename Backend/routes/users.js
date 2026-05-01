const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/search', verifyToken, userController.searchUsers);
router.get('/directory', verifyToken, userController.searchUsers);

router.get('/admin/all', verifyToken, requireRole('admin'), userController.getAllUsers);

router.get('/:userId', verifyToken, userController.getProfile);
router.put('/:userId', verifyToken, userController.updateProfile);

router.put('/:userId/password', verifyToken, userController.changePassword);

module.exports = router;
