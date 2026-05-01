-- ============================================================
-- E-Quran Academy — Canonical Database Schema
-- ============================================================
-- This is the single source of truth for the database schema.
-- It is idempotent (safe to re-run) and merges what was previously
-- spread across:
--   - db_setup.sql
--   - complete_schema.sql
--   - simple_setup.sql
--   - final_setup.sql
--   - create_missing_tables.sql
--   - setup_predefined_admins.sql
--   - migrations/001_strict_role_approval_system.sql
--
-- Apply in order:
--   1. 000_initial_schema.sql   (this file — base tables)
--   2. 001_strict_role_approval_system.sql  (role/approval extensions)
--   3. 002_seed_data.sql        (optional sample data for development)
-- ============================================================

CREATE DATABASE IF NOT EXISTS equran_academy
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE equran_academy;

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) DEFAULT NULL,           -- nullable for Google OAuth users
  phone VARCHAR(30) DEFAULT NULL,
  role ENUM('student','teacher','parent','admin') NOT NULL DEFAULT 'student',
  gender ENUM('male','female','other') DEFAULT NULL,
  address TEXT,
  status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_approved TINYINT(1) NOT NULL DEFAULT 1,         -- 0 = pending admin approval
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  verification_token VARCHAR(255) DEFAULT NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expiry DATETIME DEFAULT NULL,
  google_id VARCHAR(255) DEFAULT NULL UNIQUE,
  profile_image VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status),
  INDEX idx_users_is_deleted (is_deleted),
  INDEX idx_users_google_id (google_id)
) ENGINE=InnoDB;

-- ==================== AUTH SUPPORT TABLES ====================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  device_info VARCHAR(255) DEFAULT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_tokens_user (user_id),
  INDEX idx_refresh_tokens_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(255) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_email (email),
  INDEX idx_otp_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pwreset_email (email),
  INDEX idx_pwreset_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(150) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  request_reason TEXT,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  rejection_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_admin_req_status (status),
  INDEX idx_admin_req_email (email)
) ENGINE=InnoDB;

-- ==================== ROLE-SPECIFIC TABLES ====================
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  date_of_birth DATE DEFAULT NULL,
  course VARCHAR(100) DEFAULT NULL,
  enrollment_year INT DEFAULT NULL,
  level ENUM('Beginner','Intermediate','Advanced') DEFAULT 'Beginner',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_students_student_id (student_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  teacher_id VARCHAR(50) NOT NULL UNIQUE,
  qualification TEXT,
  subject VARCHAR(100) DEFAULT NULL,
  years_experience INT NOT NULL DEFAULT 0,
  salary DECIMAL(10,2) DEFAULT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  expertise VARCHAR(200) DEFAULT NULL,
  availability VARCHAR(200) DEFAULT NULL,
  languages VARCHAR(200) DEFAULT NULL,
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teachers_teacher_id (teacher_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  parent_id VARCHAR(50) NOT NULL UNIQUE,
  occupation VARCHAR(100) DEFAULT NULL,
  child_name VARCHAR(100) DEFAULT NULL,
  relationship ENUM('father','mother','guardian') DEFAULT NULL,
  child_class VARCHAR(50) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_parents_parent_id (parent_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  admin_level ENUM('super','regular','pending') NOT NULL DEFAULT 'regular',
  permissions JSON,
  last_login DATETIME DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==================== CLASSES & COURSE CONTENT ====================
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  teacher_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  level ENUM('Beginner','Intermediate','Advanced') DEFAULT 'Beginner',
  schedule VARCHAR(200) DEFAULT NULL,
  capacity INT NOT NULL DEFAULT 20,
  enrolled_count INT NOT NULL DEFAULT 0,
  platform VARCHAR(100) NOT NULL DEFAULT 'Zoom',
  status ENUM('Active','Scheduled','Completed','Cancelled') NOT NULL DEFAULT 'Active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_classes_teacher (teacher_id),
  INDEX idx_classes_is_deleted (is_deleted)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  INDEX idx_modules_class (class_id),
  INDEX idx_modules_is_deleted (is_deleted)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content_type ENUM('video','document','quiz','text') NOT NULL DEFAULT 'text',
  content_url VARCHAR(500) DEFAULT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_lessons_module (module_id),
  INDEX idx_lessons_is_deleted (is_deleted)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  level ENUM('Beginner','Intermediate','Advanced') DEFAULT 'Beginner',
  description TEXT,
  instructor_id INT DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_courses_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- ==================== ENROLLMENTS ====================
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  status ENUM('active','completed','dropped') NOT NULL DEFAULT 'active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, class_id),
  INDEX idx_enrollments_student (student_id),
  INDEX idx_enrollments_class (class_id),
  INDEX idx_enrollments_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- ==================== MESSAGING ====================
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_receiver (receiver_id),
  INDEX idx_messages_is_deleted (is_deleted),
  INDEX idx_messages_pair (sender_id, receiver_id, created_at)
) ENGINE=InnoDB;

-- ==================== PAYMENTS ====================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payer_id INT NOT NULL,
  payee_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_method ENUM('Credit Card','Bank Transfer','Wallet','JazzCash','EasyPaisa','Stripe') NOT NULL DEFAULT 'Bank Transfer',
  notes TEXT,
  stripe_session_id VARCHAR(255) DEFAULT NULL,
  status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payments_payer (payer_id),
  INDEX idx_payments_payee (payee_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- ==================== CONTACT MESSAGES ====================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  email_sent TINYINT(1) NOT NULL DEFAULT 0,
  admin_notes TEXT,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_status (status),
  INDEX idx_contact_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_is_read (is_read),
  INDEX idx_notif_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- ==================== SETTINGS ====================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  notification_preferences JSON,
  privacy_settings JSON,
  teaching_preferences JSON,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==================== REVIEWS ====================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  student_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (student_id, teacher_id),
  INDEX idx_reviews_teacher (teacher_id),
  INDEX idx_reviews_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- ==================== PREDEFINED ADMINS ====================
-- Bootstraps the 3 system admins. Safe to re-run; uses ON DUPLICATE KEY.
INSERT INTO users
  (full_name, email, password_hash, role, is_verified, is_approved, status, profile_image)
VALUES
  ('System Admin 1', 'orhanuppal@gmail.com',      'PREDEFINED_ADMIN', 'admin', 1, 1, 'active',
   'https://ui-avatars.com/api/?name=System+Admin+1&background=0D8ABC&color=fff'),
  ('System Admin 2', 'mrihaab6@gmail.com',         'PREDEFINED_ADMIN', 'admin', 1, 1, 'active',
   'https://ui-avatars.com/api/?name=System+Admin+2&background=0D8ABC&color=fff'),
  ('System Admin 3', 'm.bilalirshad469@gmail.com', 'PREDEFINED_ADMIN', 'admin', 1, 1, 'active',
   'https://ui-avatars.com/api/?name=System+Admin+3&background=0D8ABC&color=fff')
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  is_verified = VALUES(is_verified),
  is_approved = VALUES(is_approved),
  status = VALUES(status);

INSERT INTO admins (user_id, admin_level, permissions)
SELECT u.id, 'super', JSON_OBJECT('all', TRUE)
FROM users u
WHERE u.email IN ('orhanuppal@gmail.com','mrihaab6@gmail.com','m.bilalirshad469@gmail.com')
  AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.user_id = u.id);

SELECT 'Initial schema applied successfully' AS status;
