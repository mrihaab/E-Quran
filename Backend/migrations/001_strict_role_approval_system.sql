-- ============================================================
-- E-Quran Academy — Strict Role & Approval System Migration
-- Run this in phpMyAdmin or MySQL CLI after the base schema
-- ============================================================

USE equran_academy;

-- ============================================================
-- 1. ADD approval_status COLUMN TO users TABLE
-- ============================================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending', 'approved', 'rejected', 'suspended') 
DEFAULT 'pending' 
AFTER role;

-- Add index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_approval_status ON users(approval_status);

-- Update existing users to approved (for backward compatibility during migration)
-- This ensures existing users don't get locked out after migration
UPDATE users SET approval_status = 'approved' WHERE role = 'admin';
UPDATE users SET approval_status = 'approved' WHERE role = 'student' AND created_at < NOW() - INTERVAL 1 DAY;
UPDATE users SET approval_status = 'approved' WHERE role = 'parent' AND created_at < NOW() - INTERVAL 1 DAY;
-- Teachers remain pending for admin review
UPDATE users SET approval_status = 'pending' WHERE role = 'teacher' AND (approval_status IS NULL OR approval_status = 'pending');

-- ============================================================
-- 2. TEACHER VERIFICATION DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_verification_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  cnic_url VARCHAR(500) DEFAULT NULL,
  profile_photo_url VARCHAR(500) DEFAULT NULL,
  resume_url VARCHAR(500) DEFAULT NULL,
  certificate_url VARCHAR(500) DEFAULT NULL,
  additional_docs JSON DEFAULT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id)
);

-- ============================================================
-- 3. TEACHER APPROVAL HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_approval_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('approved', 'rejected', 'suspended', 'reactivated') NOT NULL,
  reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (teacher_id),
  INDEX (admin_id)
);

-- ============================================================
-- 4. PARENT INVITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  parent_email VARCHAR(150) NOT NULL,
  parent_phone VARCHAR(30) DEFAULT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  relation_type ENUM('father', 'mother', 'guardian') DEFAULT 'father',
  status ENUM('pending', 'accepted', 'expired', 'revoked') DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (student_id),
  INDEX (token),
  INDEX (parent_email),
  INDEX (status)
);

-- ============================================================
-- 5. PARENT-STUDENT LINKS TABLE (Secure many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_student_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NOT NULL,
  student_id INT NOT NULL,
  relation_type ENUM('father', 'mother', 'guardian') DEFAULT 'father',
  is_primary TINYINT(1) DEFAULT 1,
  linked_by ENUM('system', 'admin', 'invitation') DEFAULT 'system',
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_parent_student (parent_id, student_id),
  INDEX (parent_id),
  INDEX (student_id)
);

-- ============================================================
-- 6. ADD SOFT DELETE COLUMNS TO EXISTING TABLES
-- ============================================================

-- Add is_deleted to classes table for soft delete
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INT DEFAULT NULL;

-- Add is_deleted to enrollments table for soft delete
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- ============================================================
-- 8. UPDATE EXISTING TABLES (Users)
-- ============================================================

-- Add rejection_reason to users table for rejected accounts
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL 
AFTER approval_status;

-- Add admin_notes for internal admin comments
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL 
AFTER rejection_reason;

-- Add reviewed_at timestamp
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL 
AFTER admin_notes;

-- Add reviewed_by (admin who processed the approval)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reviewed_by INT DEFAULT NULL,
ADD FOREIGN KEY IF NOT EXISTS (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 9. UPDATE EXISTING ROLE TABLES
-- ============================================================

-- Add guardian_contact to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(150) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(30) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS guardian_relation ENUM('father', 'mother', 'guardian', 'other') DEFAULT NULL;

-- Add is_verified_teacher flag to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS is_verified_teacher TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cnic_number VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS verified_by INT DEFAULT NULL,
ADD FOREIGN KEY IF NOT EXISTS (verified_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 10. LOGIN AUDIT TABLE (For security tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  role_attempted ENUM('student', 'teacher', 'parent', 'admin') NOT NULL,
  actual_role ENUM('student', 'teacher', 'parent', 'admin', 'none') DEFAULT 'none',
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT,
  status ENUM('success', 'failed_wrong_portal', 'failed_invalid_cred', 'failed_not_approved', 'failed_suspended') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (created_at),
  INDEX (status)
);

-- ============================================================
-- 11. ROLE-SPECIFIC VIEWS (For easier querying)
-- ============================================================

-- View: Pending Teachers for Admin Review
CREATE OR REPLACE VIEW pending_teachers AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.phone,
  u.gender,
  u.created_at,
  u.approval_status,
  u.admin_notes,
  t.teacher_id,
  t.qualification,
  t.years_experience,
  t.subject,
  t.cnic_number,
  tvd.cnic_url,
  tvd.profile_photo_url,
  tvd.resume_url,
  tvd.certificate_url
FROM users u
JOIN teachers t ON u.id = t.user_id
LEFT JOIN teacher_verification_documents tvd ON u.id = tvd.user_id
WHERE u.role = 'teacher' 
  AND u.approval_status = 'pending'
  AND u.is_deleted = 0;

-- View: Approved Teachers with Documents
CREATE OR REPLACE VIEW approved_teachers AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.phone,
  u.status,
  u.approval_status,
  t.teacher_id,
  t.qualification,
  t.years_experience,
  t.subject,
  t.rating,
  t.is_verified_teacher,
  t.verified_at,
  tvd.profile_photo_url
FROM users u
JOIN teachers t ON u.id = t.user_id
LEFT JOIN teacher_verification_documents tvd ON u.id = tvd.user_id
WHERE u.role = 'teacher' 
  AND u.approval_status = 'approved'
  AND u.is_deleted = 0;

-- View: Students with Pending Parent Invitations
CREATE OR REPLACE VIEW students_pending_parent_invite AS
SELECT 
  u.id AS student_id,
  u.full_name AS student_name,
  u.email AS student_email,
  s.student_id AS student_roll_number,
  s.guardian_name,
  s.guardian_email,
  s.guardian_phone,
  pi.id AS invitation_id,
  pi.token,
  pi.status AS invitation_status,
  pi.expires_at
FROM users u
JOIN students s ON u.id = s.user_id
LEFT JOIN parent_invitations pi ON u.id = pi.student_id AND pi.status = 'pending'
WHERE u.role = 'student'
  AND u.approval_status = 'approved'
  AND u.is_deleted = 0
  AND (s.guardian_email IS NOT NULL OR s.guardian_phone IS NOT NULL);

-- View: Parents with Linked Students
CREATE OR REPLACE VIEW parent_student_relationships AS
SELECT 
  psl.id AS link_id,
  p.id AS parent_id,
  pu.full_name AS parent_name,
  pu.email AS parent_email,
  pu.phone AS parent_phone,
  s.id AS student_id,
  su.full_name AS student_name,
  su.email AS student_email,
  s.student_id AS student_roll_number,
  psl.relation_type,
  psl.is_primary,
  psl.linked_at,
  psl.is_active
FROM parent_student_links psl
JOIN users p ON psl.parent_id = p.id
JOIN parents p_tbl ON p.id = p_tbl.user_id
JOIN users pu ON p.id = pu.id
JOIN users s ON psl.student_id = s.id
JOIN students s_tbl ON s.id = s_tbl.user_id
JOIN users su ON s.id = su.id
WHERE psl.is_active = 1;

-- ============================================================
-- 10. STORED PROCEDURES (For complex operations)
-- ============================================================

DELIMITER //

-- Procedure: Process Teacher Approval
CREATE PROCEDURE IF NOT EXISTS ProcessTeacherApproval(
  IN p_teacher_id INT,
  IN p_admin_id INT,
  IN p_action VARCHAR(20),
  IN p_reason TEXT,
  IN p_admin_notes TEXT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Update user approval status
  UPDATE users 
  SET approval_status = p_action,
      rejection_reason = CASE WHEN p_action = 'rejected' THEN p_reason ELSE NULL END,
      admin_notes = p_admin_notes,
      reviewed_at = NOW(),
      reviewed_by = p_admin_id
  WHERE id = p_teacher_id;
  
  -- Update teacher verification status if approved
  IF p_action = 'approved' THEN
    UPDATE teachers 
    SET is_verified_teacher = 1,
        verified_at = NOW(),
        verified_by = p_admin_id
    WHERE user_id = p_teacher_id;
  END IF;
  
  -- Record in history
  INSERT INTO teacher_approval_history (
    teacher_id, admin_id, action, reason, admin_notes
  ) VALUES (
    p_teacher_id, p_admin_id, p_action, p_reason, p_admin_notes
  );
  
  COMMIT;
END //

-- Procedure: Link Parent to Student
CREATE PROCEDURE IF NOT EXISTS LinkParentToStudent(
  IN p_parent_id INT,
  IN p_student_id INT,
  IN p_relation_type VARCHAR(20),
  IN p_linked_by VARCHAR(20)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Insert or update link
  INSERT INTO parent_student_links (
    parent_id, student_id, relation_type, linked_by
  ) VALUES (
    p_parent_id, p_student_id, p_relation_type, p_linked_by
  )
  ON DUPLICATE KEY UPDATE
    relation_type = p_relation_type,
    is_active = 1,
    linked_at = NOW();
  
  -- Update student's guardian info if not set
  UPDATE students s
  JOIN users pu ON pu.id = p_parent_id
  SET s.guardian_name = COALESCE(s.guardian_name, pu.full_name),
      s.guardian_email = COALESCE(s.guardian_email, pu.email),
      s.guardian_phone = COALESCE(s.guardian_phone, pu.phone),
      s.guardian_relation = p_relation_type
  WHERE s.user_id = p_student_id;
  
  COMMIT;
END //

DELIMITER ;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
