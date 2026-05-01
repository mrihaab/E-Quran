-- ============================================================
-- E-Quran Academy — Unified Database Schema
-- Version: 2.0
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
  approval_status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  gender ENUM('male', 'female', 'other') DEFAULT NULL,
  address TEXT DEFAULT NULL,
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  verification_token VARCHAR(255) DEFAULT NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expiry DATETIME DEFAULT NULL,
  google_id VARCHAR(255) DEFAULT NULL UNIQUE,
  profile_image VARCHAR(500) DEFAULT NULL,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_approval_status (approval_status),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_google_id (google_id)
);

-- ==================== REFRESH TOKENS ====================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  device_info VARCHAR(255) DEFAULT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- ==================== OTP VERIFICATIONS ====================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(255) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
);

-- ==================== PASSWORD RESET TOKENS ====================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
);

-- ==================== ADMIN APPROVAL REQUESTS ====================
CREATE TABLE IF NOT EXISTS admin_approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(150) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  request_reason TEXT DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_email (email)
);

-- ==================== ROLE-SPECIFIC TABLES ====================

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  date_of_birth DATE DEFAULT NULL,
  course VARCHAR(100) DEFAULT NULL,
  enrollment_year INT DEFAULT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
  guardian_name VARCHAR(100) DEFAULT NULL,
  guardian_email VARCHAR(150) DEFAULT NULL,
  guardian_phone VARCHAR(30) DEFAULT NULL,
  guardian_relation ENUM('father', 'mother', 'guardian', 'other') DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
);

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
  bio TEXT DEFAULT NULL,
  cnic_number VARCHAR(20) DEFAULT NULL,
  is_verified_teacher TINYINT(1) NOT NULL DEFAULT 0,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  verified_by INT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_teacher_id (teacher_id)
);

CREATE TABLE IF NOT EXISTS parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  parent_id VARCHAR(50) NOT NULL UNIQUE,
  occupation VARCHAR(100) DEFAULT NULL,
  child_name VARCHAR(100) DEFAULT NULL,
  relationship ENUM('father', 'mother', 'guardian') DEFAULT 'father',
  child_class VARCHAR(50) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_parent_id (parent_id)
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  admin_id VARCHAR(50) DEFAULT NULL UNIQUE,
  admin_level ENUM('super', 'regular') NOT NULL DEFAULT 'regular',
  role_position VARCHAR(100) DEFAULT NULL,
  department VARCHAR(100) DEFAULT NULL,
  access_level ENUM('low', 'medium', 'high', 'full') NOT NULL DEFAULT 'medium',
  permissions JSON DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  office_address TEXT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== TEACHER VERIFICATION DOCUMENTS ====================
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
  INDEX idx_user_id (user_id)
);

-- ==================== TEACHER APPROVAL HISTORY ====================
CREATE TABLE IF NOT EXISTS teacher_approval_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('approved', 'rejected', 'suspended', 'reactivated') NOT NULL,
  reason TEXT DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_admin_id (admin_id)
);

-- ==================== CLASSES ====================
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  teacher_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
  schedule VARCHAR(200) DEFAULT NULL,
  capacity INT NOT NULL DEFAULT 20,
  enrolled_count INT NOT NULL DEFAULT 0,
  platform VARCHAR(100) DEFAULT 'Zoom',
  status ENUM('Active', 'Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  deleted_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_status (status)
);

-- ==================== COURSE CONTENT ====================

CREATE TABLE IF NOT EXISTS modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  INDEX idx_class_id (class_id),
  INDEX idx_is_deleted (is_deleted)
);

CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content_type ENUM('video', 'document', 'quiz', 'text') NOT NULL DEFAULT 'text',
  content_url VARCHAR(500) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_module_id (module_id),
  INDEX idx_is_deleted (is_deleted)
);

-- ==================== ENROLLMENTS ====================
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  status ENUM('active', 'completed', 'dropped') NOT NULL DEFAULT 'active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, class_id),
  INDEX idx_student_id (student_id),
  INDEX idx_class_id (class_id),
  INDEX idx_is_deleted (is_deleted)
);

-- ==================== MESSAGES ====================
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
  INDEX idx_sender_id (sender_id),
  INDEX idx_receiver_id (receiver_id),
  INDEX idx_is_deleted (is_deleted)
);

-- ==================== PAYMENTS ====================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payer_id INT NOT NULL,
  payee_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('Credit Card', 'Bank Transfer', 'Wallet', 'JazzCash', 'EasyPaisa', 'Stripe') NOT NULL DEFAULT 'Bank Transfer',
  notes TEXT DEFAULT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(255) DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payer_id (payer_id),
  INDEX idx_payee_id (payee_id),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted)
);

-- ==================== COURSES ====================
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
  description TEXT DEFAULT NULL,
  instructor_id INT DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_is_deleted (is_deleted)
);

-- ==================== CONTACT MESSAGES ====================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied') NOT NULL DEFAULT 'new',
  email_sent TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted)
);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_is_deleted (is_deleted)
);

-- ==================== SETTINGS ====================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  notification_preferences JSON DEFAULT NULL,
  privacy_settings JSON DEFAULT NULL,
  teaching_preferences JSON DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_is_deleted (is_deleted)
);

-- ==================== REVIEWS ====================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  student_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (student_id, teacher_id),
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_is_deleted (is_deleted)
);

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_token (token),
  INDEX idx_parent_email (parent_email),
  INDEX idx_status (status)
);

-- ==================== PARENT-STUDENT LINKS ====================
CREATE TABLE IF NOT EXISTS parent_student_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NOT NULL,
  student_id INT NOT NULL,
  relation_type ENUM('father', 'mother', 'guardian') NOT NULL DEFAULT 'father',
  is_primary TINYINT(1) NOT NULL DEFAULT 1,
  linked_by ENUM('system', 'admin', 'invitation') NOT NULL DEFAULT 'system',
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_parent_student (parent_id, student_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_student_id (student_id)
);

-- ==================== LOGIN AUDIT ====================
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  role_attempted ENUM('student', 'teacher', 'parent', 'admin') NOT NULL,
  actual_role ENUM('student', 'teacher', 'parent', 'admin', 'none') NOT NULL DEFAULT 'none',
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  status ENUM('success', 'failed_wrong_portal', 'failed_invalid_cred', 'failed_not_approved', 'failed_suspended') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
);

-- ==================== SEED DATA ====================

-- Admin account (password: admin123)
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, approval_status, is_verified, profile_image) VALUES
('Super Admin', 'admin@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 000 000 0000', 'admin', 'male', 'active', 'approved', 1, 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff')
ON DUPLICATE KEY UPDATE role = 'admin', approval_status = 'approved';

INSERT INTO admins (user_id, admin_id, admin_level, role_position, department, access_level, office_address)
SELECT id, 'ADM001', 'super', 'Super Admin', 'IT', 'full', 'E-Quran Academy HQ'
FROM users WHERE email = 'admin@equran.com'
ON DUPLICATE KEY UPDATE admin_level = 'super';

-- Sample Teachers
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, approval_status, is_verified, profile_image) VALUES
('Sheikh Ahmed Al-Mansouri', 'ahmed.teacher@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 111 111 1111', 'teacher', 'male', 'active', 'approved', 1, 'https://ui-avatars.com/api/?name=Ahmed+Al-Mansouri&background=2E7D32&color=fff'),
('Ustazah Fatima Khan', 'fatima.teacher@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 222 222 2222', 'teacher', 'female', 'active', 'approved', 1, 'https://ui-avatars.com/api/?name=Fatima+Khan&background=7B1FA2&color=fff'),
('Sheikh Rashid Al-Makki', 'rashid.teacher@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 333 333 3333', 'teacher', 'male', 'active', 'approved', 1, 'https://ui-avatars.com/api/?name=Rashid+Al-Makki&background=1565C0&color=fff'),
('Ustazah Aisha Mohamed', 'aisha.teacher@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 444 444 4444', 'teacher', 'female', 'active', 'approved', 1, 'https://ui-avatars.com/api/?name=Aisha+Mohamed&background=C62828&color=fff')
ON DUPLICATE KEY UPDATE approval_status = 'approved';

INSERT INTO teachers (user_id, teacher_id, qualification, subject, years_experience, salary, rating, expertise, availability, languages, is_verified_teacher)
SELECT u.id, t.teacher_id, t.qualification, t.subject, t.years_experience, t.salary, t.rating, t.expertise, t.availability, t.languages, 1
FROM (SELECT 'ahmed.teacher@equran.com' AS email, 'TEA001' AS teacher_id, 'PhD in Tajweed Sciences' AS qualification, 'Tajweed' AS subject, 15 AS years_experience, 5000.00 AS salary, 4.80 AS rating, 'Tajweed & Qira''at' AS expertise, 'Mon-Fri, 9AM-5PM' AS availability, 'Arabic, English' AS languages
UNION ALL SELECT 'fatima.teacher@equran.com', 'TEA002', 'Certified Hafiza, M.A. Islamic Studies', 'Quran Memorization', 12, 4500.00, 4.90, 'Hifz (Memorization)', 'Tue-Sat, 10AM-6PM', 'Arabic, Urdu'
UNION ALL SELECT 'rashid.teacher@equran.com', 'TEA003', 'Master in Islamic Jurisprudence', 'Islamic Studies', 20, 5500.00, 4.70, 'Islamic Studies', 'Mon-Wed, 2PM-8PM', 'Arabic, English, Malay'
UNION ALL SELECT 'aisha.teacher@equran.com', 'TEA004', 'B.A. Arabic Language & Literature', 'Arabic Language', 10, 4000.00, 4.80, 'Arabic Language', 'Thu-Sun, 11AM-7PM', 'Arabic, English, French') t
JOIN users u ON u.email = t.email
ON DUPLICATE KEY UPDATE qualification = t.qualification;

-- Sample Student
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, approval_status, is_verified, profile_image) VALUES
('Ahmed Khan', 'student@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 555 555 5555', 'student', 'male', 'active', 'approved', 1, 'https://ui-avatars.com/api/?name=Ahmed+Khan&background=FF6F00&color=fff')
ON DUPLICATE KEY UPDATE approval_status = 'approved';

INSERT INTO students (user_id, student_id, date_of_birth, course, enrollment_year, level)
SELECT id, 'STU001', '2000-05-15', 'Tajweed Mastery', 2024, 'Intermediate'
FROM users WHERE email = 'student@equran.com'
ON DUPLICATE KEY UPDATE course = 'Tajweed Mastery';

-- Sample Parent
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, approval_status, is_verified, profile_image) VALUES
('Omar Khalid', 'parent@equran.com', '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq', '+1 666 666 6666', 'parent', 'male', 'active', 'approved', 1, 'https://ui-avatars.com/api/?name=Omar+Khalid&background=00695C&color=fff')
ON DUPLICATE KEY UPDATE approval_status = 'approved';

INSERT INTO parents (user_id, parent_id, child_name, relationship, child_class)
SELECT id, 'PAR001', 'Hassan Omar', 'father', 'Grade 5'
FROM users WHERE email = 'parent@equran.com'
ON DUPLICATE KEY UPDATE child_name = 'Hassan Omar';

-- Sample Courses
INSERT INTO courses (name, level, description, instructor_id) VALUES
('Tajweed Mastery', 'Intermediate', 'Master the rules of Tajweed and perfect your Quran recitation with expert guidance.', (SELECT id FROM users WHERE email = 'ahmed.teacher@equran.com' LIMIT 1)),
('Hifz Fast Track', 'Advanced', 'Accelerated Quran memorization program with proven techniques and daily revision.', (SELECT id FROM users WHERE email = 'fatima.teacher@equran.com' LIMIT 1)),
('Arabic Language Basics', 'Beginner', 'Learn the fundamentals of Arabic language to understand the Quran in its original text.', (SELECT id FROM users WHERE email = 'aisha.teacher@equran.com' LIMIT 1)),
('Islamic Studies', 'Intermediate', 'Comprehensive study of Islamic history, Fiqh, Aqeedah, and Seerah.', (SELECT id FROM users WHERE email = 'rashid.teacher@equran.com' LIMIT 1))
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Sample Classes
INSERT INTO classes (name, teacher_id, subject, level, schedule, capacity, enrolled_count, platform, status) VALUES
('Tajweed Essentials', (SELECT id FROM users WHERE email = 'ahmed.teacher@equran.com'), 'Tajweed', 'Beginner', 'Daily at 10:00 AM', 20, 8, 'Zoom', 'Active'),
('Quran Memorization', (SELECT id FROM users WHERE email = 'fatima.teacher@equran.com'), 'Quran Memorization', 'Intermediate', 'Mon-Wed at 4:00 PM', 15, 5, 'Portal Meet', 'Active'),
('Arabic Language 101', (SELECT id FROM users WHERE email = 'aisha.teacher@equran.com'), 'Arabic Language', 'Beginner', 'Tue-Thu at 2:00 PM', 20, 10, 'Private Link', 'Active'),
('Islamic Studies Advanced', (SELECT id FROM users WHERE email = 'rashid.teacher@equran.com'), 'Islamic Studies', 'Advanced', 'Sun 2:00 PM', 15, 7, 'Zoom', 'Scheduled');

-- Settings for seed users
INSERT INTO settings (user_id, notification_preferences, privacy_settings)
SELECT id, '{}', '{}' FROM users WHERE email IN ('admin@equran.com', 'ahmed.teacher@equran.com', 'fatima.teacher@equran.com', 'rashid.teacher@equran.com', 'aisha.teacher@equran.com', 'student@equran.com', 'parent@equran.com')
ON DUPLICATE KEY UPDATE notification_preferences = notification_preferences;

SELECT 'Database schema created successfully!' AS status;
