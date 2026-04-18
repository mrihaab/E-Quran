const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');
const { requireOwnershipOrRole } = require('../middleware/ownershipMiddleware');

// ==================== GET SETTINGS ====================
router.get('/:userId', verifyToken, authGuard, approvalMiddleware, requireOwnershipOrRole({ paramKeys: ['userId'] }), async (req, res) => {
  try {
    const [settings] = await db.query('SELECT * FROM settings WHERE user_id = ?', [req.params.userId]);

    if (settings.length === 0) {
      // Return default settings
      return res.json({
        notificationPreferences: { classReminders: true, assignments: true, messages: true, announcements: false, weeklyReport: true },
        privacySettings: { profileVisibility: 'private', showActivityStatus: true, allowMessages: true },
        teachingPreferences: null
      });
    }

    const s = settings[0];
    res.json({
      notificationPreferences: s.notification_preferences || {},
      privacySettings: s.privacy_settings || {},
      teachingPreferences: s.teaching_preferences || null
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// ==================== UPDATE SETTINGS ====================
router.put('/:userId', verifyToken, authGuard, approvalMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only update your own settings.' });
    }

    const { notificationPreferences, privacySettings, teachingPreferences } = req.body;

    // Check if settings exist
    const [existing] = await db.query('SELECT id FROM settings WHERE user_id = ?', [userId]);

    if (existing.length === 0) {
      await db.query(
        'INSERT INTO settings (user_id, notification_preferences, privacy_settings, teaching_preferences) VALUES (?, ?, ?, ?)',
        [
          userId,
          JSON.stringify(notificationPreferences || {}),
          JSON.stringify(privacySettings || {}),
          JSON.stringify(teachingPreferences || null)
        ]
      );
    } else {
      const updates = [];
      const values = [];

      if (notificationPreferences) {
        updates.push('notification_preferences = ?');
        values.push(JSON.stringify(notificationPreferences));
      }
      if (privacySettings) {
        updates.push('privacy_settings = ?');
        values.push(JSON.stringify(privacySettings));
      }
      if (teachingPreferences !== undefined) {
        updates.push('teaching_preferences = ?');
        values.push(JSON.stringify(teachingPreferences));
      }

      if (updates.length > 0) {
        values.push(userId);
        await db.query(`UPDATE settings SET ${updates.join(', ')} WHERE user_id = ?`, values);
      }
    }

    res.json({ message: 'Settings updated successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

module.exports = router;
