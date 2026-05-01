-- ============================================================
-- E-Quran Academy — Authoritative Database Schema
-- Run this in phpMyAdmin or MySQL CLI to set up the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS equran_academy
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE equran_academy;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  role ENUM('student', 'teacher', 'parent', 'admin') NOT NULL DEFAULT 'student',
  approval_status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'approved',
  gender ENUM('male', 'female', 'other') DEFAULT NULL,
  address TEXT DEFAULT NULL,
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_approved TINYINT(1) NOT NULL DEFAULT 1,
  is_suspended TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  verification_token VARCHAR(255) DEFAULT NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expiry DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  google_id VARCHAR(255) DEFAULT NULL UNIQUE,
  profile_image VARCHAR(500) DEFAULT NULL,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_approval (approval_status),
  INDEX idx_google_id (google_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== REFRESH TOKENS TABLE ====================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  device_info VARCHAR(255) DEFAULT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== OTP VERIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(255) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PASSWORD RESET TOKENS TABLE ====================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ADMIN APPROVAL REQUESTS ====================
CREATE TABLE IF NOT EXISTS admin_approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(150) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  request_reason TEXT DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ROLE-SPECIFIC TABLES ====================

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  date_of_birth DATE DEFAULT NULL,
  course VARCHAR(100) DEFAULT NULL,
  enrollment_year INT DEFAULT NULL,
  level VARCHAR(50) NOT NULL DEFAULT 'Beginner',
  guardian_name VARCHAR(100) DEFAULT NULL,
  guardian_email VARCHAR(150) DEFAULT NULL,
  guardian_phone VARCHAR(30) DEFAULT NULL,
  guardian_relation ENUM('father', 'mother', 'guardian', 'other') DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  teacher_id VARCHAR(50) NOT NULL UNIQUE,
  qualification TEXT DEFAULT NULL,
  subject VARCHAR(100) DEFAULT NULL,
  years_experience INT NOT NULL DEFAULT 0,
  salary DECIMAL(10, 2) DEFAULT NULL,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  expertise VARCHAR(200) DEFAULT NULL,
  availability VARCHAR(200) DEFAULT NULL,
  languages VARCHAR(200) DEFAULT NULL,
  is_verified_teacher TINYINT(1) NOT NULL DEFAULT 0,
  cnic_number VARCHAR(20) DEFAULT NULL,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  verified_by INT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_teacher_id (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  parent_id VARCHAR(50) NOT NULL UNIQUE,
  child_name VARCHAR(100) DEFAULT NULL,
  relationship ENUM('father', 'mother', 'guardian') DEFAULT 'father',
  child_class VARCHAR(50) DEFAULT NULL,
  occupation VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  admin_level ENUM('super', 'regular', 'pending') NOT NULL DEFAULT 'regular',
  permissions JSON DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== CLASSES TABLE ====================
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  teacher_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
  schedule VARCHAR(200) DEFAULT NULL,
  capacity INT NOT NULL DEFAULT 20,
  enrolled_count INT NOT NULL DEFAULT 0,
  platform VARCHAR(100) NOT NULL DEFAULT 'Zoom',
  status ENUM('Active', 'Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  deleted_by INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== COURSE CONTENT (MODULES & LESSONS) ====================
CREATE TABLE IF NOT EXISTS modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  INDEX idx_class_id (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content_type ENUM('video', 'document', 'quiz', 'text') NOT NULL DEFAULT 'text',
  content_url VARCHAR(500) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_module_id (module_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ENROLLMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  status ENUM('active', 'completed', 'dropped') NOT NULL DEFAULT 'active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, class_id),
  INDEX idx_student_id (student_id),
  INDEX idx_class_id (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MESSAGES TABLE ====================
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payer_id INT NOT NULL,
  payee_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('Credit Card', 'Bank Transfer', 'Wallet', 'JazzCash', 'EasyPaisa', 'Stripe') NOT NULL DEFAULT 'Bank Transfer',
  stripe_session_id VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payer (payer_id),
  INDEX idx_payee (payee_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== COURSES TABLE ====================
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
  description TEXT DEFAULT NULL,
  instructor_id INT DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_instructor (instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== CONTACT MESSAGES TABLE ====================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
  admin_notes TEXT DEFAULT NULL,
  replied_by INT DEFAULT NULL,
  replied_at DATETIME DEFAULT NULL,
  email_sent TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== NOTIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  notification_preferences JSON DEFAULT NULL,
  privacy_settings JSON DEFAULT NULL,
  teaching_preferences JSON DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== REVIEWS TABLE ====================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  student_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (student_id, teacher_id),
  INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TEACHER VERIFICATION DOCUMENTS ====================
CREATE TABLE IF NOT EXISTS teacher_verification_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  cnic_url VARCHAR(500) DEFAULT NULL,
  profile_photo_url VARCHAR(500) DEFAULT NULL,
  resume_url VARCHAR(500) DEFAULT NULL,
  certificate_url VARCHAR(500) DEFAULT NULL,
  additional_docs JSON DEFAULT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TEACHER APPROVAL HISTORY ====================
CREATE TABLE IF NOT EXISTS teacher_approval_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('approved', 'rejected', 'suspended', 'reactivated') NOT NULL,
  reason TEXT DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher (teacher_id),
  INDEX idx_admin (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PARENT INVITATIONS ====================
CREATE TABLE IF NOT EXISTS parent_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  parent_email VARCHAR(150) NOT NULL,
  parent_phone VARCHAR(30) DEFAULT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  relation_type ENUM('father', 'mother', 'guardian') NOT NULL DEFAULT 'father',
  status ENUM('pending', 'accepted', 'expired', 'revoked') NOT NULL DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_token (token),
  INDEX idx_email (parent_email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PARENT-STUDENT LINKS ====================
CREATE TABLE IF NOT EXISTS parent_student_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NOT NULL,
  student_id INT NOT NULL,
  relation_type ENUM('father', 'mother', 'guardian') NOT NULL DEFAULT 'father',
  is_primary TINYINT(1) NOT NULL DEFAULT 1,
  linked_by ENUM('system', 'admin', 'invitation') NOT NULL DEFAULT 'system',
  linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_parent_student (parent_id, student_id),
  INDEX idx_parent (parent_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== LOGIN AUDIT TABLE ====================
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  role_attempted ENUM('student', 'teacher', 'parent', 'admin') NOT NULL,
  actual_role ENUM('student', 'teacher', 'parent', 'admin', 'none') DEFAULT 'none',
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  status ENUM('success', 'failed_wrong_portal', 'failed_invalid_cred', 'failed_not_approved', 'failed_suspended') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin account (password: admin123 — hashed with bcrypt)
INSERT INTO users (full_name, email, password_hash, phone, role, approval_status, gender, status, is_verified, is_approved, profile_image) VALUES
('Super Admin', 'admin@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 000 000 0000', 'admin', 'approved', 'male', 'active', 1, 1, 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff')
ON DUPLICATE KEY UPDATE role = 'admin', is_approved = 1;

INSERT INTO admins (user_id, admin_level, permissions) VALUES
(1, 'super', '{}')
ON DUPLICATE KEY UPDATE admin_level = 'super';

-- Predefined admin accounts
INSERT INTO users (full_name, email, password_hash, role, approval_status, is_verified, is_approved, status, profile_image) VALUES
('System Admin', 'orhanuppal@gmail.com', 'PREDEFINED_ADMIN', 'admin', 'approved', 1, 1, 'active', 'https://ui-avatars.com/api/?name=System+Admin&background=0D8ABC&color=fff'),
('System Admin 2', 'mrihaab6@gmail.com', 'PREDEFINED_ADMIN', 'admin', 'approved', 1, 1, 'active', 'https://ui-avatars.com/api/?name=System+Admin+2&background=0D8ABC&color=fff'),
('System Admin 3', 'm.bilalirshad469@gmail.com', 'PREDEFINED_ADMIN', 'admin', 'approved', 1, 1, 'active', 'https://ui-avatars.com/api/?name=System+Admin+3&background=0D8ABC&color=fff')
ON DUPLICATE KEY UPDATE role = 'admin', is_approved = 1, status = 'active', approval_status = 'approved';

-- Sample Teachers (password: admin123)
INSERT INTO users (full_name, email, password_hash, phone, role, approval_status, gender, status, is_verified, is_approved, profile_image) VALUES
('Sheikh Ahmed Al-Mansouri', 'ahmed.teacher@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 111 111 1111', 'teacher', 'approved', 'male', 'active', 1, 1, 'https://ui-avatars.com/api/?name=Sheikh+Ahmed&background=2e7d32&color=fff'),
('Ustazah Fatima Khan', 'fatima.teacher@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 222 222 2222', 'teacher', 'approved', 'female', 'active', 1, 1, 'https://ui-avatars.com/api/?name=Ustazah+Fatima&background=2e7d32&color=fff'),
('Sheikh Rashid Al-Makki', 'rashid.teacher@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 333 333 3333', 'teacher', 'approved', 'male', 'active', 1, 1, 'https://ui-avatars.com/api/?name=Sheikh+Rashid&background=2e7d32&color=fff'),
('Ustazah Aisha Mohamed', 'aisha.teacher@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 444 444 4444', 'teacher', 'approved', 'female', 'active', 1, 1, 'https://ui-avatars.com/api/?name=Ustazah+Aisha&background=2e7d32&color=fff')
ON DUPLICATE KEY UPDATE status = 'active';

INSERT INTO teachers (user_id, teacher_id, qualification, subject, years_experience, salary, rating, expertise, availability, languages) VALUES
(5, 'TEA001', 'PhD in Tajweed Sciences', 'Tajweed', 15, 5000.00, 4.80, 'Tajweed & Qira''at', 'Mon-Fri, 9AM-5PM', 'Arabic, English'),
(6, 'TEA002', 'Certified Hafiza, M.A. Islamic Studies', 'Quran Memorization', 12, 4500.00, 4.90, 'Hifz (Memorization)', 'Tue-Sat, 10AM-6PM', 'Arabic, Urdu'),
(7, 'TEA003', 'Master in Islamic Jurisprudence', 'Islamic Studies', 20, 5500.00, 4.70, 'Islamic Studies', 'Mon-Wed, 2PM-8PM', 'Arabic, English, Malay'),
(8, 'TEA004', 'B.A. Arabic Language & Literature', 'Arabic Language', 10, 4000.00, 4.80, 'Arabic Language', 'Thu-Sun, 11AM-7PM', 'Arabic, English, French')
ON DUPLICATE KEY UPDATE qualification = VALUES(qualification);

-- Sample Student (password: admin123)
INSERT INTO users (full_name, email, password_hash, phone, role, approval_status, gender, status, is_verified, is_approved, profile_image) VALUES
('Ahmed Khan', 'student@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 555 555 5555', 'student', 'approved', 'male', 'active', 1, 1, 'https://ui-avatars.com/api/?name=Ahmed+Khan&background=1976d2&color=fff')
ON DUPLICATE KEY UPDATE status = 'active';

INSERT INTO students (user_id, student_id, date_of_birth, course, enrollment_year, level) VALUES
(9, 'STU001', '2000-05-15', 'Tajweed Mastery', 2024, 'Intermediate')
ON DUPLICATE KEY UPDATE course = VALUES(course);

-- Sample Parent (password: admin123)
INSERT INTO users (full_name, email, password_hash, phone, role, approval_status, gender, status, is_verified, is_approved, profile_image) VALUES
('Omar Khalid', 'parent@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 666 666 6666', 'parent', 'approved', 'male', 'active', 1, 1, 'https://ui-avatars.com/api/?name=Omar+Khalid&background=ff9800&color=fff')
ON DUPLICATE KEY UPDATE status = 'active';

INSERT INTO parents (user_id, parent_id, child_name, relationship, child_class) VALUES
(10, 'PAR001', 'Hassan Omar', 'father', 'Grade 5')
ON DUPLICATE KEY UPDATE child_name = VALUES(child_name);

-- Sample Courses
INSERT INTO courses (name, level, description, instructor_id) VALUES
('Tajweed Mastery', 'Intermediate', 'Master the rules of Tajweed and perfect your Quran recitation with expert guidance.', 5),
('Hifz Fast Track', 'Advanced', 'Accelerated Quran memorization program with proven techniques and daily revision.', 6),
('Arabic Language Basics', 'Beginner', 'Learn the fundamentals of Arabic language to understand the Quran in its original text.', 8),
('Islamic Studies', 'Intermediate', 'Comprehensive study of Islamic history, Fiqh, Aqeedah, and Seerah.', 7)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Sample Classes
INSERT INTO classes (name, teacher_id, subject, level, schedule, capacity, enrolled_count, platform, status) VALUES
('Tajweed Essentials', 5, 'Tajweed', 'Beginner', 'Daily at 10:00 AM', 20, 1, 'Zoom', 'Active'),
('Quran Memorization', 6, 'Quran Memorization', 'Intermediate', 'Mon-Wed at 4:00 PM', 15, 0, 'Portal Meet', 'Active'),
('Arabic Language 101', 8, 'Arabic Language', 'Beginner', 'Tue-Thu at 2:00 PM', 20, 0, 'Private Link', 'Active'),
('Islamic Studies Advanced', 7, 'Islamic Studies', 'Advanced', 'Sun 2:00 PM', 15, 0, 'Zoom', 'Scheduled')
ON DUPLICATE KEY UPDATE schedule = VALUES(schedule);

-- Enroll sample student
INSERT INTO enrollments (student_id, class_id, status) VALUES
(9, 1, 'active')
ON DUPLICATE KEY UPDATE status = 'active';

-- Sample Messages
INSERT INTO messages (sender_id, receiver_id, content) VALUES
(5, 9, 'As-salamu alaykum, Ahmed. Ready for today''s session?'),
(9, 5, 'Wa Alaykumu s-salam, Sheikh. Yes, I am ready.');

-- Settings for seed users
INSERT INTO settings (user_id, notification_preferences, privacy_settings) VALUES
(1, '{}', '{}'), (5, '{}', '{}'), (6, '{}', '{}'), (7, '{}', '{}'),
(8, '{}', '{}'), (9, '{}', '{}'), (10, '{}', '{}')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

SELECT 'E-Quran Academy database setup complete!' AS status;
