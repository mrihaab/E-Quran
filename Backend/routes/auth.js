const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/db');
const { generateToken } = require('../middleware/auth');

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, role, gender, address } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [userResult] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, profile_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        email,
        passwordHash,
        phone || null,
        role,
        gender || null,
        address || null,
        `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100`
      ]
    );

    const userId = userResult.insertId;

    // Insert role-specific data
    if (role === 'student') {
      const { studentId, dateOfBirth, course, enrollmentYear } = req.body;
      await db.query(
        `INSERT INTO students (user_id, student_id, date_of_birth, course, enrollment_year, level)
         VALUES (?, ?, ?, ?, ?, 'Beginner')`,
        [userId, studentId || `STU${userId}`, dateOfBirth || null, course || null, enrollmentYear || new Date().getFullYear()]
      );
    } else if (role === 'teacher') {
      const { teacherId, qualification, subject, yearsOfExperience, salary } = req.body;
      await db.query(
        `INSERT INTO teachers (user_id, teacher_id, qualification, subject, years_experience, salary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, teacherId || `TEA${userId}`, qualification || null, subject || null, yearsOfExperience || 0, salary || null]
      );
    } else if (role === 'parent') {
      const { parentId, childName, relationship, childClass } = req.body;
      await db.query(
        `INSERT INTO parents (user_id, parent_id, child_name, relationship, child_class)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, parentId || `PAR${userId}`, childName || null, relationship || 'father', childClass || null]
      );
    } else if (role === 'admin') {
      const { adminId, rolePosition, department, accessLevel, officeAddress } = req.body;
      await db.query(
        `INSERT INTO admins (user_id, admin_id, role_position, department, access_level, office_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, adminId || `ADM${userId}`, rolePosition || null, department || null, accessLevel || 'medium', officeAddress || null]
      );
    }

    // Create default settings for the user
    await db.query(
      `INSERT INTO settings (user_id, notification_preferences, privacy_settings)
       VALUES (?, ?, ?)`,
      [
        userId,
        JSON.stringify({ classReminders: true, assignments: true, messages: true, announcements: false, weeklyReport: true }),
        JSON.stringify({ profileVisibility: 'private', showActivityStatus: true, allowMessages: true })
      ]
    );

    // Get full user data
    const [users] = await db.query('SELECT id, full_name, email, role, phone, profile_image, created_at FROM users WHERE id = ?', [userId]);
    const user = users[0];

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful!',
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profile_image
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email
    const [users] = await db.query(
      'SELECT id, full_name, email, password_hash, role, phone, status, profile_image FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profile_image
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
