-- ============================================================
-- SIMPLE DATABASE SETUP - E-Quran Academy
-- Run this in phpMyAdmin SQL tab
-- ============================================================

USE equran_academy;

-- ==================== STEP 1: CREATE TABLES ====================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  device_info VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (token),
  INDEX (user_id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) DEFAULT 0,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (otp)
);

CREATE TABLE IF NOT EXISTS admin_approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(150) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  request_reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  rejection_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX (status),
  INDEX (email)
);

-- ==================== STEP 2: ADD COLUMN (IGNORE IF EXISTS) ====================

-- Try to add is_approved column - will fail silently if exists
ALTER TABLE users ADD COLUMN is_approved TINYINT(1) DEFAULT 1;

-- Set default for existing users
UPDATE users SET is_approved = 1 WHERE is_approved IS NULL;

-- ==================== STEP 3: DELETE EXISTING PREDEFINED ADMINS ====================

DELETE FROM admin_approval_requests WHERE user_id IN (
    SELECT id FROM users WHERE email IN ('orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com')
);

DELETE FROM admins WHERE user_id IN (
    SELECT id FROM users WHERE email IN ('orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com')
);

DELETE FROM users WHERE email IN ('orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com');

-- ==================== STEP 4: INSERT PREDEFINED ADMINS ====================

INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, status, is_verified, is_approved, profile_image, google_id) 
VALUES ('System Admin 1', 'orhanuppal@gmail.com', '$2a$10$PredefinedAdminPasswordHash', NULL, 'admin', NULL, NULL, 'active', 1, 1, 'https://ui-avatars.com/api/?name=Admin+1&background=0D8ABC&color=fff', NULL);

INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, status, is_verified, is_approved, profile_image, google_id) 
VALUES ('System Admin 2', 'mrihaab6@gmail.com', '$2a$10$PredefinedAdminPasswordHash', NULL, 'admin', NULL, NULL, 'active', 1, 1, 'https://ui-avatars.com/api/?name=Admin+2&background=0D8ABC&color=fff', NULL);

INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, status, is_verified, is_approved, profile_image, google_id) 
VALUES ('System Admin 3', 'm.bilalirshad469@gmail.com', '$2a$10$PredefinedAdminPasswordHash', NULL, 'admin', NULL, NULL, 'active', 1, 1, 'https://ui-avatars.com/api/?name=Admin+3&background=0D8ABC&color=fff', NULL);

-- ==================== STEP 5: CREATE ADMIN RECORDS ====================

INSERT INTO admins (user_id, admin_level, permissions)
SELECT id, 'super', '{"all": true}' FROM users WHERE email = 'orhanuppal@gmail.com';

INSERT INTO admins (user_id, admin_level, permissions)
SELECT id, 'super', '{"all": true}' FROM users WHERE email = 'mrihaab6@gmail.com';

INSERT INTO admins (user_id, admin_level, permissions)
SELECT id, 'super', '{"all": true}' FROM users WHERE email = 'm.bilalirshad469@gmail.com';

-- ==================== STEP 6: VERIFY ====================

SELECT id, email, full_name, role, is_verified, is_approved, status 
FROM users 
WHERE email IN ('orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com');
