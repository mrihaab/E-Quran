-- ============================================================
-- E-Quran Academy — Unified Authoritative Database Schema
-- Version: 2.0.0
-- Run this file ONCE on a fresh database. It is idempotent.
-- ============================================================

CREATE DATABASE IF NOT EXISTS equran_academy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE equran_academy;

-- ==================== CORE USER TABLE ====================
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(100)  NOT NULL,
  email           VARCHAR(150)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  DEFAULT NULL,        -- NULL = Google-only account
  phone           VARCHAR(30)   DEFAULT NULL,
  role            ENUM('student','teacher','parent','admin') NOT NULL DEFAULT 'student',
  gender          ENUM('male','female','other')       DEFAULT NULL,
  address         TEXT          DEFAULT NULL,
  profile_image   VARCHAR(500)  DEFAULT NULL,

  -- Account state
  status          ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  is_verified     TINYINT(1)    NOT NULL DEFAULT 0,
  is_approved     TINYINT(1)    NOT NULL DEFAULT 1,  -- 0 = pending (admins only)
  is_deleted      TINYINT(1)    NOT NULL DEFAULT 0,

  -- Security tokens (stored as hashed values or NULL when not active)
  google_id           VARCHAR(255)  DEFAULT NULL UNIQUE,
  verification_token  VARCHAR(255)  DEFAULT NULL,
  reset_token         VARCHAR(255)  DEFAULT NULL,
  reset_token_expiry  DATETIME      DEFAULT NULL,

  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email   (email),
  INDEX idx_role    (role),
  INDEX idx_status  (status),
  INDEX idx_google  (google_id),
  INDEX idx_deleted (is_deleted)
);

-- ==================== REFRESH TOKENS ====================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  token       VARCHAR(500) NOT NULL UNIQUE,
  device_info VARCHAR(255) DEFAULT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token   (token),
  INDEX idx_user    (user_id),
  INDEX idx_expires (expires_at)
);

-- ==================== OTP VERIFICATIONS ====================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(150) NOT NULL,
  otp        VARCHAR(10)  NOT NULL,
  attempts   INT          NOT NULL DEFAULT 0,
  expires_at DATETIME     NOT NULL,
  is_used    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_email   (email),
  INDEX idx_expires (expires_at)
);

-- ==================== PASSWORD RESET TOKENS ====================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(150) NOT NULL,
  otp        VARCHAR(10)  NOT NULL,
  attempts   INT          NOT NULL DEFAULT 0,
  expires_at DATETIME     NOT NULL,
  is_used    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_email   (email),
  INDEX idx_expires (expires_at)
);

-- ==================== ADMIN APPROVAL REQUESTS ====================
CREATE TABLE IF NOT EXISTS admin_approval_requests (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT          NOT NULL,
  email            VARCHAR(150) NOT NULL,
  full_name        VARCHAR(100) NOT NULL,
  request_reason   TEXT         DEFAULT NULL,
  status           ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT         DEFAULT NULL,
  requested_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  reviewed_at      DATETIME     DEFAULT NULL,
  reviewed_by      INT          DEFAULT NULL,

  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_email  (email)
);

-- ==================== ROLE-SPECIFIC PROFILE TABLES ====================

CREATE TABLE IF NOT EXISTS students (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL UNIQUE,
  student_id      VARCHAR(50)  NOT NULL UNIQUE,
  date_of_birth   DATE         DEFAULT NULL,
  course          VARCHAR(100) DEFAULT NULL,
  enrollment_year INT          DEFAULT NULL,
  level           ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
);

CREATE TABLE IF NOT EXISTS teachers (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT            NOT NULL UNIQUE,
  teacher_id       VARCHAR(50)    NOT NULL UNIQUE,
  qualification    TEXT           DEFAULT NULL,
  subject          VARCHAR(100)   DEFAULT NULL,
  specialization   VARCHAR(100)   DEFAULT NULL,
  years_experience INT            NOT NULL DEFAULT 0,
  salary           DECIMAL(10,2)  DEFAULT NULL,
  rating           DECIMAL(3,2)   NOT NULL DEFAULT 0.00,
  bio              TEXT           DEFAULT NULL,
  expertise        VARCHAR(200)   DEFAULT NULL,
  availability     VARCHAR(200)   DEFAULT NULL,
  languages        VARCHAR(200)   DEFAULT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher_id (teacher_id)
);

CREATE TABLE IF NOT EXISTS parents (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT         NOT NULL UNIQUE,
  parent_id    VARCHAR(50) NOT NULL UNIQUE,
  occupation   VARCHAR(100) DEFAULT NULL,
  child_name   VARCHAR(100) DEFAULT NULL,
  relationship ENUM('father','mother','guardian') DEFAULT 'father',
  child_class  VARCHAR(50)  DEFAULT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_parent_id (parent_id)
);

CREATE TABLE IF NOT EXISTS admins (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT         NOT NULL UNIQUE,
  admin_level  ENUM('super','regular','pending') NOT NULL DEFAULT 'regular',
  permissions  JSON        DEFAULT NULL,
  last_login   DATETIME    DEFAULT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== PARENT-STUDENT LINKS ====================
CREATE TABLE IF NOT EXISTS parent_student_links (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  parent_id  INT       NOT NULL,
  student_id INT       NOT NULL,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_parent_student (parent_id, student_id),
  INDEX idx_parent  (parent_id),
  INDEX idx_student (student_id)
);

-- ==================== PARENT INVITATIONS ====================
CREATE TABLE IF NOT EXISTS parent_invitations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT          NOT NULL,
  parent_email VARCHAR(150) NOT NULL,
  token        VARCHAR(255) NOT NULL UNIQUE,
  status       ENUM('pending','accepted','expired') NOT NULL DEFAULT 'pending',
  expires_at   DATETIME     NOT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token      (token),
  INDEX idx_student_id (student_id),
  INDEX idx_expires    (expires_at)
);

-- ==================== CLASSES ====================
CREATE TABLE IF NOT EXISTS classes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  teacher_id     INT          NOT NULL,
  subject        VARCHAR(100) NOT NULL,
  level          ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
  schedule       VARCHAR(200) DEFAULT NULL,
  capacity       INT          NOT NULL DEFAULT 20,
  enrolled_count INT          NOT NULL DEFAULT 0,
  platform       VARCHAR(100) DEFAULT 'Zoom',
  status         ENUM('Active','Scheduled','Completed','Cancelled') NOT NULL DEFAULT 'Active',
  is_deleted     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher  (teacher_id),
  INDEX idx_status   (status),
  INDEX idx_deleted  (is_deleted)
);

-- ==================== COURSE CONTENT ====================

CREATE TABLE IF NOT EXISTS modules (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  class_id    INT          NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT         DEFAULT NULL,
  order_index INT          NOT NULL DEFAULT 0,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  INDEX idx_class   (class_id),
  INDEX idx_deleted (is_deleted)
);

CREATE TABLE IF NOT EXISTS lessons (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  module_id    INT          NOT NULL,
  title        VARCHAR(200) NOT NULL,
  content_type ENUM('video','document','quiz','text') NOT NULL DEFAULT 'text',
  content_url  VARCHAR(500) DEFAULT NULL,
  description  TEXT         DEFAULT NULL,
  order_index  INT          NOT NULL DEFAULT 0,
  is_deleted   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_module  (module_id),
  INDEX idx_deleted (is_deleted)
);

-- ==================== ENROLLMENTS ====================
CREATE TABLE IF NOT EXISTS enrollments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT       NOT NULL,
  class_id   INT       NOT NULL,
  status     ENUM('active','completed','dropped') NOT NULL DEFAULT 'active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY uq_enrollment (student_id, class_id),
  INDEX idx_student (student_id),
  INDEX idx_class   (class_id),
  INDEX idx_deleted (is_deleted)
);

-- ==================== MESSAGES ====================
CREATE TABLE IF NOT EXISTS messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  sender_id   INT       NOT NULL,
  receiver_id INT       NOT NULL,
  content     TEXT      NOT NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted  TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender   (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_deleted  (is_deleted),
  INDEX idx_read     (is_read)
);

-- ==================== PAYMENTS ====================
CREATE TABLE IF NOT EXISTS payments (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  payer_id       INT           NOT NULL,
  payee_id       INT           NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  payment_method ENUM('Credit Card','Bank Transfer','Wallet','JazzCash','EasyPaisa','Stripe') DEFAULT 'Bank Transfer',
  notes          TEXT          DEFAULT NULL,
  class_id       INT           DEFAULT NULL,
  stripe_session_id VARCHAR(255) DEFAULT NULL,
  status         ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  is_deleted     TINYINT(1)   NOT NULL DEFAULT 0,
  payment_date   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  INDEX idx_payer   (payer_id),
  INDEX idx_payee   (payee_id),
  INDEX idx_status  (status),
  INDEX idx_deleted (is_deleted),
  INDEX idx_date    (payment_date)
);

-- ==================== COURSES (catalog) ====================
CREATE TABLE IF NOT EXISTS courses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  level         ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
  description   TEXT         DEFAULT NULL,
  instructor_id INT          DEFAULT NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_deleted (is_deleted)
);

-- ==================== CONTACT MESSAGES ====================
CREATE TABLE IF NOT EXISTS contact_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  subject     VARCHAR(200) NOT NULL,
  message     TEXT         NOT NULL,
  status      ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  admin_notes TEXT         DEFAULT NULL,
  email_sent  TINYINT(1)   NOT NULL DEFAULT 0,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status  (status),
  INDEX idx_deleted (is_deleted)
);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT         DEFAULT NULL,
  type       ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  is_deleted TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user    (user_id),
  INDEX idx_read    (is_read),
  INDEX idx_deleted (is_deleted)
);

-- ==================== SETTINGS ====================
CREATE TABLE IF NOT EXISTS settings (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  user_id                  INT       NOT NULL UNIQUE,
  notification_preferences JSON      DEFAULT NULL,
  privacy_settings         JSON      DEFAULT NULL,
  teaching_preferences     JSON      DEFAULT NULL,
  is_deleted               TINYINT(1) NOT NULL DEFAULT 0,
  updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== REVIEWS ====================
CREATE TABLE IF NOT EXISTS reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT      NOT NULL,
  student_id INT      NOT NULL,
  rating     TINYINT  NOT NULL,
  comment    TEXT     DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_review   (student_id, teacher_id),
  INDEX idx_teacher (teacher_id),
  INDEX idx_deleted (is_deleted)
);

-- ==================== LOGIN ATTEMPTS (security audit) ====================
CREATE TABLE IF NOT EXISTS login_attempts (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(150) NOT NULL,
  role_attempted VARCHAR(50)  DEFAULT NULL,
  actual_role    VARCHAR(50)  DEFAULT NULL,
  ip_address     VARCHAR(45)  DEFAULT NULL,
  user_agent     TEXT         DEFAULT NULL,
  status         VARCHAR(50)  NOT NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_email  (email),
  INDEX idx_status (status),
  INDEX idx_date   (created_at)
);

-- ==================== TEACHER DOCUMENTS ====================
CREATE TABLE IF NOT EXISTS teacher_documents (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id    INT          NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  file_url      VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) DEFAULT NULL,
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  uploaded_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher (teacher_id),
  INDEX idx_status  (status)
);

-- ============================================================
-- SEED: Predefined super-admin accounts
-- These are Google-OAuth-only accounts (no password login).
-- ============================================================
INSERT INTO users (full_name, email, password_hash, role, is_verified, is_approved, status, profile_image)
VALUES
  ('System Admin 1', 'orhanuppal@gmail.com',       'PREDEFINED_ADMIN', 'admin', 1, 1, 'active', 'https://ui-avatars.com/api/?name=Admin+1&background=0D8ABC&color=fff'),
  ('System Admin 2', 'mrihaab6@gmail.com',          'PREDEFINED_ADMIN', 'admin', 1, 1, 'active', 'https://ui-avatars.com/api/?name=Admin+2&background=0D8ABC&color=fff'),
  ('System Admin 3', 'm.bilalirshad469@gmail.com',  'PREDEFINED_ADMIN', 'admin', 1, 1, 'active', 'https://ui-avatars.com/api/?name=Admin+3&background=0D8ABC&color=fff')
ON DUPLICATE KEY UPDATE role = 'admin', is_approved = 1, status = 'active';

INSERT INTO admins (user_id, admin_level)
SELECT u.id, 'super'
FROM users u
WHERE u.email IN ('orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com')
  AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.user_id = u.id);

-- ============================================================
-- SEED: Demo data for development (comment out in production)
-- All demo passwords hash to: demo1234
-- ============================================================

-- Demo teacher
INSERT IGNORE INTO users (full_name, email, password_hash, phone, role, gender, status, is_verified, is_approved, profile_image)
VALUES ('Sheikh Ahmed Al-Mansouri', 'teacher@equran.com',
        '$2b$10$wJhMCi5jWp6r8A3T9zG4sOhZckrO/xW.TQyWHtAA7Ln9nkONVi6Fy',
        '+1 111 111 1111', 'teacher', 'male', 'active', 1, 1,
        'https://ui-avatars.com/api/?name=Sheikh+Ahmed&background=059669&color=fff');

INSERT IGNORE INTO teachers (user_id, teacher_id, qualification, subject, years_experience, salary, rating, expertise, availability, languages)
SELECT u.id, CONCAT('TEA', u.id), 'PhD in Tajweed Sciences', 'Tajweed', 15, 5000.00, 4.80,
       'Tajweed & Qiraat', 'Mon-Fri 9AM-5PM', 'Arabic, English'
FROM users u WHERE u.email = 'teacher@equran.com';

-- Demo student
INSERT IGNORE INTO users (full_name, email, password_hash, phone, role, gender, status, is_verified, is_approved, profile_image)
VALUES ('Ahmed Khan', 'student@equran.com',
        '$2b$10$wJhMCi5jWp6r8A3T9zG4sOhZckrO/xW.TQyWHtAA7Ln9nkONVi6Fy',
        '+1 555 555 5555', 'student', 'male', 'active', 1, 1,
        'https://ui-avatars.com/api/?name=Ahmed+Khan&background=7C3AED&color=fff');

INSERT IGNORE INTO students (user_id, student_id, enrollment_year, level)
SELECT u.id, CONCAT('STU', u.id), YEAR(NOW()), 'Intermediate'
FROM users u WHERE u.email = 'student@equran.com';

-- Demo parent
INSERT IGNORE INTO users (full_name, email, password_hash, phone, role, gender, status, is_verified, is_approved, profile_image)
VALUES ('Omar Khalid', 'parent@equran.com',
        '$2b$10$wJhMCi5jWp6r8A3T9zG4sOhZckrO/xW.TQyWHtAA7Ln9nkONVi6Fy',
        '+1 666 666 6666', 'parent', 'male', 'active', 1, 1,
        'https://ui-avatars.com/api/?name=Omar+Khalid&background=DC2626&color=fff');

INSERT IGNORE INTO parents (user_id, parent_id, relationship)
SELECT u.id, CONCAT('PAR', u.id), 'father'
FROM users u WHERE u.email = 'parent@equran.com';

-- Settings for demo users
INSERT IGNORE INTO settings (user_id, notification_preferences, privacy_settings)
SELECT id, '{}', '{}'
FROM users
WHERE email IN ('teacher@equran.com', 'student@equran.com', 'parent@equran.com');

-- Demo class
INSERT IGNORE INTO classes (name, teacher_id, subject, level, schedule, capacity, enrolled_count, platform, status)
SELECT 'Tajweed Essentials', u.id, 'Tajweed', 'Beginner', 'Daily 10:00 AM', 20, 1, 'Zoom', 'Active'
FROM users u WHERE u.email = 'teacher@equran.com';

-- Enroll demo student in demo class
INSERT IGNORE INTO enrollments (student_id, class_id, status)
SELECT s.id, c.id, 'active'
FROM users s, classes c
JOIN users t ON c.teacher_id = t.id
WHERE s.email = 'student@equran.com' AND t.email = 'teacher@equran.com';

SELECT 'E-Quran Academy schema v2.0 created successfully.' AS status;
