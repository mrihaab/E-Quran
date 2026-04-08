const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// ==================== GET USER PROFILE ====================
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Get base user info
    const [users] = await db.query(
      'SELECT id, full_name, email, phone, role, gender, address, status, profile_image, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];
    let roleData = null;

    // Get role-specific data
    if (user.role === 'student') {
      const [students] = await db.query('SELECT * FROM students WHERE user_id = ?', [userId]);
      roleData = students[0] || null;
    } else if (user.role === 'teacher') {
      const [teachers] = await db.query('SELECT * FROM teachers WHERE user_id = ?', [userId]);
      roleData = teachers[0] || null;
    } else if (user.role === 'parent') {
      const [parents] = await db.query('SELECT * FROM parents WHERE user_id = ?', [userId]);
      roleData = parents[0] || null;
    } else if (user.role === 'admin') {
      const [admins] = await db.query('SELECT * FROM admins WHERE user_id = ?', [userId]);
      roleData = admins[0] || null;
    }

    res.json({
      id: user.id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      address: user.address,
      status: user.status,
      profileImage: user.profile_image,
      createdAt: user.created_at,
      roleDetails: roleData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// ==================== UPDATE USER PROFILE ====================
router.put('/:userId', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Ensure user can only update their own profile (unless admin)
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only update your own profile.' });
    }

    const { fullName, phone, gender, address, profileImage } = req.body;

    const updates = [];
    const values = [];

    if (fullName) { updates.push('full_name = ?'); values.push(fullName); }
    if (phone) { updates.push('phone = ?'); values.push(phone); }
    if (gender) { updates.push('gender = ?'); values.push(gender); }
    if (address) { updates.push('address = ?'); values.push(address); }
    if (profileImage) { updates.push('profile_image = ?'); values.push(profileImage); }

    if (updates.length > 0) {
      values.push(userId);
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // Update role-specific data
    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const role = users[0].role;

    if (role === 'student') {
      const { course, level } = req.body;
      if (course || level) {
        const studentUpdates = [];
        const studentValues = [];
        if (course) { studentUpdates.push('course = ?'); studentValues.push(course); }
        if (level) { studentUpdates.push('level = ?'); studentValues.push(level); }
        studentValues.push(userId);
        await db.query(`UPDATE students SET ${studentUpdates.join(', ')} WHERE user_id = ?`, studentValues);
      }
    } else if (role === 'teacher') {
      const { qualification, subject, yearsOfExperience, expertise, availability, languages } = req.body;
      const teacherUpdates = [];
      const teacherValues = [];
      if (qualification) { teacherUpdates.push('qualification = ?'); teacherValues.push(qualification); }
      if (subject) { teacherUpdates.push('subject = ?'); teacherValues.push(subject); }
      if (yearsOfExperience !== undefined) { teacherUpdates.push('years_experience = ?'); teacherValues.push(yearsOfExperience); }
      if (expertise) { teacherUpdates.push('expertise = ?'); teacherValues.push(expertise); }
      if (availability) { teacherUpdates.push('availability = ?'); teacherValues.push(availability); }
      if (languages) { teacherUpdates.push('languages = ?'); teacherValues.push(languages); }
      if (teacherUpdates.length > 0) {
        teacherValues.push(userId);
        await db.query(`UPDATE teachers SET ${teacherUpdates.join(', ')} WHERE user_id = ?`, teacherValues);
      }
    }

    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ==================== CHANGE PASSWORD ====================
router.put('/:userId/password', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'You can only change your own password.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    // Verify current password
    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

module.exports = router;
