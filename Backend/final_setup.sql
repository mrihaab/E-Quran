-- ============================================================
-- COMPLETE DATABASE SETUP - E-Quran Academy
-- Run this in phpMyAdmin SQL tab
-- ============================================================

USE equran_academy;

-- ==================== STEP 1: CREATE TABLES ====================

-- Create refresh_tokens table
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

-- Create password_reset_tokens table
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

-- Create admin_approval_requests table
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

-- ==================== STEP 2: ADD COLUMNS ====================

-- Check and add is_approved column
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'is_approved' AND table_schema = 'equran_academy');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE users ADD COLUMN is_approved TINYINT(1) DEFAULT 1', 
                   'SELECT "Column exists" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set default for existing users
UPDATE users SET is_approved = 1 WHERE is_approved IS NULL;

-- ==================== STEP 3: DELETE EXISTING (FOR CLEAN SLATE) ====================

-- Delete existing predefined admin records to avoid conflicts
DELETE FROM admins WHERE user_id IN (
    SELECT id FROM users WHERE email IN ('orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com')
);

-- Delete existing predefined users
DELETE FROM users WHERE email IN ('orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com');

-- ==================== STEP 4: INSERT PREDEFINED ADMINS ====================

-- Insert predefined admin 1
INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, status, is_verified, is_approved, profile_image, google_id) 
VALUES ('System Admin 1', 'orhanuppal@gmail.com', '$2a$10$PredefinedAdminPasswordHash', NULL, 'admin', NULL, NULL, 'active', 1, 1, 'https://ui-avatars.com/api/?name=Admin+1&background=0D8ABC&color=fff', NULL);

-- Insert predefined admin 2
INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, status, is_verified, is_approved, profile_image, google_id) 
VALUES ('System Admin 2', 'mrihaab6@gmail.com', '$2a$10$PredefinedAdminPasswordHash', NULL, 'admin', NULL, NULL, 'active', 1, 1, 'https://ui-avatars.com/api/?name=Admin+2&background=0D8ABC&color=fff', NULL);

-- Insert predefined admin 3
INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, status, is_verified, is_approved, profile_image, google_id) 
VALUES ('System Admin 3', 'm.bilalirshad469@gmail.com', '$2a$10$PredefinedAdminPasswordHash', NULL, 'admin', NULL, NULL, 'active', 1, 1, 'https://ui-avatars.com/api/?name=Admin+3&background=0D8ABC&color=fff', NULL);

-- ==================== STEP 5: CREATE ADMIN RECORDS ====================

-- Get admin IDs
SET @admin1 = (SELECT id FROM users WHERE email = 'orhanuppal@gmail.com');
SET @admin2 = (SELECT id FROM users WHERE email = 'mrihaab6@gmail.com');
SET @admin3 = (SELECT id FROM users WHERE email = 'm.bilalirshad469@gmail.com');

-- Create admin records
INSERT INTO admins (user_id, admin_level, permissions) VALUES (@admin1, 'super', '{"all": true}');
INSERT INTO admins (user_id, admin_level, permissions) VALUES (@admin2, 'super', '{"all": true}');
INSERT INTO admins (user_id, admin_level, permissions) VALUES (@admin3, 'super', '{"all": true}');

-- ==================== STEP 6: VERIFY ====================

SELECT id, email, full_name, role, is_verified, is_approved, status 
FROM users 
WHERE email IN ('orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com');

SELECT 'Setup complete!' as message;
