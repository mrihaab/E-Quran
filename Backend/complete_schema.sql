-- ============================================================
-- E-Quran Academy — Complete Database Schema (Professional Auth)
-- ============================================================

CREATE DATABASE IF NOT EXISTS equran_academy;
USE equran_academy;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255), -- Nullable for Google OAuth users
  phone VARCHAR(30),
  role ENUM('student', 'teacher', 'parent', 'admin') NOT NULL DEFAULT 'student',
  gender ENUM('male', 'female', 'other'),
  address TEXT,
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  is_verified TINYINT(1) DEFAULT 0,
  is_approved TINYINT(1) DEFAULT 1, -- For admin approval workflow (0=pending, 1=approved)
  is_deleted TINYINT(1) DEFAULT 0,
  verification_token VARCHAR(255) DEFAULT NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expiry DATETIME DEFAULT NULL,
  google_id VARCHAR(255) DEFAULT NULL UNIQUE,
  profile_image VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (role),
  INDEX (google_id),
  INDEX (status)
);

-- ==================== REFRESH TOKENS TABLE ====================
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

-- ==================== OTP VERIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT DEFAULT 0,
  is_used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (otp)
);

-- ==================== ADMIN APPROVAL REQUESTS TABLE ====================
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

-- ==================== PASSWORD RESET TOKENS TABLE ====================
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

-- ==================== PREDEFINED ADmins ====================
-- Insert the 3 predefined admin emails if they don't exist
-- These will get auto-approved admin access
INSERT INTO users (full_name, email, password_hash, role, is_verified, is_approved, status, profile_image) VALUES
('System Admin 1', 'orhanuppal@gmail.com', 'PREDEFINED_ADMIN', 'admin', 1, 1, 'active', 'https://ui-avatars.com/api/?name=Admin+1&background=0D8ABC&color=fff'),
('System Admin 2', 'mrihaab6@gmail.com', 'PREDEFINED_ADMIN', 'admin', 1, 1, 'active', 'https://ui-avatars.com/api/?name=Admin+2&background=0D8ABC&color=fff'),
('System Admin 3', 'm.bilalirshad469@gmail.com', 'PREDEFINED_ADMIN', 'admin', 1, 1, 'active', 'https://ui-avatars.com/api/?name=Admin+3&background=0D8ABC&color=fff')
ON DUPLICATE KEY UPDATE role = 'admin', is_approved = 1, status = 'active';

-- ==================== OTHER REQUIRED TABLES ====================

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  student_id VARCHAR(50) UNIQUE,
  enrollment_year INT,
  level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (student_id)
);

CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  teacher_id VARCHAR(50) UNIQUE,
  specialization VARCHAR(100),
  years_experience INT DEFAULT 0,
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (teacher_id)
);

CREATE TABLE IF NOT EXISTS parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  parent_id VARCHAR(50) UNIQUE,
  occupation VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (parent_id)
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  admin_level ENUM('super', 'regular') DEFAULT 'regular',
  permissions JSON,
  last_login DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert admin records for predefined admins
INSERT INTO admins (user_id, admin_level)
SELECT u.id, 'super' FROM users u WHERE u.email IN ('orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com')
AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.user_id = u.id);

SELECT 'Database schema created successfully with professional auth system!' as status;
