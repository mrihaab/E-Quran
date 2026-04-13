const db = require('../config/db');

/**
 * Upload Profile Image
 */
exports.uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const userId = req.user.id;
    const imageUrl = `/uploads/${req.file.filename}`;

    await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [imageUrl, userId]);

    res.json({
      message: 'Profile image updated successfully.',
      imageUrl
    });
  } catch (error) {
    console.error('Upload profile error:', error);
    res.status(500).json({ error: 'Failed to upload profile image.' });
  }
};

/**
 * Upload Teacher Document
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Only teachers can upload documents
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can upload certification documents.' });
    }

    const userId = req.user.id;
    const docUrl = `/uploads/${req.file.filename}`;

    // Update teacher qualification or a new documents column (currently using qualification as text)
    // For now, let's just return the URL so the UI can handle it or we can add it to a 'documents' table if needed later.
    
    res.json({
      message: 'Document uploaded successfully.',
      documentUrl: docUrl
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
};
