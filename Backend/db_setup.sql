-- ============================================================
-- E-Quran Academy — Full Database Schema
-- Run this in phpMyAdmin or MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS equran_academy;
USE equran_academy;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('student', 'teacher', 'parent', 'admin') NOT NULL DEFAULT 'student',
  gender ENUM('male', 'female', 'other'),
  address TEXT,
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  profile_image VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== ROLE-SPECIFIC TABLES ====================

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  date_of_birth DATE,
  course VARCHAR(100),
  enrollment_year INT,
  level VARCHAR(50) DEFAULT 'Beginner',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  teacher_id VARCHAR(50) NOT NULL UNIQUE,
  qualification TEXT,
  subject VARCHAR(100),
  years_experience INT DEFAULT 0,
  salary DECIMAL(10, 2),
  rating DECIMAL(3, 2) DEFAULT 0.00,
  expertise VARCHAR(200),
  availability VARCHAR(200),
  languages VARCHAR(200),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  parent_id VARCHAR(50) NOT NULL UNIQUE,
  child_name VARCHAR(100),
  relationship ENUM('father', 'mother', 'guardian') DEFAULT 'father',
  child_class VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  admin_id VARCHAR(50) NOT NULL UNIQUE,
  role_position VARCHAR(100),
  department VARCHAR(100),
  access_level ENUM('low', 'medium', 'high', 'full') DEFAULT 'medium',
  office_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== CLASSES TABLE ====================

CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  teacher_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  schedule VARCHAR(200),
  capacity INT DEFAULT 20,
  enrolled_count INT DEFAULT 0,
  platform VARCHAR(100) DEFAULT 'Zoom',
  status ENUM('Active', 'Scheduled', 'Completed', 'Cancelled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== ENROLLMENTS TABLE ====================

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, class_id)
);

-- ==================== MESSAGES TABLE ====================

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== PAYMENTS TABLE ====================

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payer_id INT NOT NULL,
  payee_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('Credit Card', 'Bank Transfer', 'Wallet') DEFAULT 'Credit Card',
  notes TEXT,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== COURSES TABLE ====================

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  description TEXT,
  instructor_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==================== CONTACT MESSAGES TABLE ====================

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied') DEFAULT 'new',
  email_sent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== NOTIFICATIONS TABLE ====================

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== SETTINGS TABLE ====================

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  notification_preferences JSON,
  privacy_settings JSON,
  teaching_preferences JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin account (password: admin123 — hashed with bcrypt)
-- The hash below corresponds to 'admin123'
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, profile_image) VALUES
('Super Admin', 'admin@equran.com', '$2a$10$xVqYLGEMBm3YNhALMYOWQeHpx06E9EvFns.gPyKTlQejFdbTqwLb2', '+1 000 000 0000', 'admin', 'male', 'active', 'https://picsum.photos/seed/admin/100/100');

INSERT INTO admins (user_id, admin_id, role_position, department, access_level, office_address) VALUES
(1, 'ADM001', 'Super Admin', 'IT', 'full', 'E-Quran Academy HQ');

-- Sample Teachers
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, profile_image) VALUES
('Sheikh Ahmed Al-Mansouri', 'ahmed.teacher@equran.com', '$2a$10$xVqYLGEMBm3YNhALMYOWQeHpx06E9EvFns.gPyKTlQejFdbTqwLb2', '+1 111 111 1111', 'teacher', 'male', 'active', 'https://picsum.photos/seed/teacher1/100/100'),
('Ustazah Fatima Khan', 'fatima.teacher@equran.com', '$2a$10$xVqYLGEMBm3YNhALMYOWQeHpx06E9EvFns.gPyKTlQejFdbTqwLb2', '+1 222 222 2222', 'teacher', 'female', 'active', 'https://picsum.photos/seed/teacher2/100/100'),
('Sheikh Rashid Al-Makki', 'rashid.teacher@equran.com', '$2a$10$xVqYLGEMBm3YNhALMYOWQeHpx06E9EvFns.gPyKTlQejFdbTqwLb2', '+1 333 333 3333', 'teacher', 'male', 'active', 'https://picsum.photos/seed/teacher3/100/100'),
('Ustazah Aisha Mohamed', 'aisha.teacher@equran.com', '$2a$10$xVqYLGEMBm3YNhALMYOWQeHpx06E9EvFns.gPyKTlQejFdbTqwLb2', '+1 444 444 4444', 'teacher', 'female', 'active', 'https://picsum.photos/seed/teacher4/100/100');

INSERT INTO teachers (user_id, teacher_id, qualification, subject, years_experience, salary, rating, expertise, availability, languages) VALUES
(2, 'TEA001', 'PhD in Tajweed Sciences', 'Tajweed', 15, 5000.00, 4.80, 'Tajweed & Qira''at', 'Mon-Fri, 9AM-5PM', 'Arabic, English'),
(3, 'TEA002', 'Certified Hafiza, M.A. Islamic Studies', 'Quran Memorization', 12, 4500.00, 4.90, 'Hifz (Memorization)', 'Tue-Sat, 10AM-6PM', 'Arabic, Urdu'),
(4, 'TEA003', 'Master in Islamic Jurisprudence', 'Islamic Studies', 20, 5500.00, 4.70, 'Islamic Studies', 'Mon-Wed, 2PM-8PM', 'Arabic, English, Malay'),
(5, 'TEA004', 'B.A. Arabic Language & Literature', 'Arabic Language', 10, 4000.00, 4.80, 'Arabic Language', 'Thu-Sun, 11AM-7PM', 'Arabic, English, French');

-- Sample Student
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, profile_image) VALUES
('Ahmed Khan', 'student@equran.com', '$2a$10$xVqYLGEMBm3YNhALMYOWQeHpx06E9EvFns.gPyKTlQejFdbTqwLb2', '+1 555 555 5555', 'student', 'male', 'active', 'https://picsum.photos/seed/ahmed/100/100');

INSERT INTO students (user_id, student_id, date_of_birth, course, enrollment_year, level) VALUES
(6, 'STU001', '2000-05-15', 'Tajweed Mastery', 2024, 'Intermediate');

-- Sample Parent
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, profile_image) VALUES
('Omar Khalid', 'parent@equran.com', '$2a$10$xVqYLGEMBm3YNhALMYOWQeHpx06E9EvFns.gPyKTlQejFdbTqwLb2', '+1 666 666 6666', 'parent', 'male', 'active', 'https://picsum.photos/seed/parent/100/100');

INSERT INTO parents (user_id, parent_id, child_name, relationship, child_class) VALUES
(7, 'PAR001', 'Hassan Omar', 'father', 'Grade 5');

-- Sample Courses
INSERT INTO courses (name, level, description, instructor_id) VALUES
('Tajweed Mastery', 'Intermediate', 'Master the rules of Tajweed and perfect your Quran recitation with expert guidance.', 2),
('Hifz Fast Track', 'Advanced', 'Accelerated Quran memorization program with proven techniques and daily revision.', 3),
('Arabic Language Basics', 'Beginner', 'Learn the fundamentals of Arabic language to understand the Quran in its original text.', 5),
('Islamic Studies', 'Intermediate', 'Comprehensive study of Islamic history, Fiqh, Aqeedah, and Seerah.', 4);

-- Sample Classes
INSERT INTO classes (name, teacher_id, subject, level, schedule, capacity, enrolled_count, platform, status) VALUES
('Tajweed Essentials', 2, 'Tajweed', 'Beginner', 'Daily at 10:00 AM', 20, 8, 'Zoom', 'Active'),
('Quran Memorization', 3, 'Quran Memorization', 'Intermediate', 'Mon-Wed at 4:00 PM', 15, 5, 'Portal Meet', 'Active'),
('Arabic Language 101', 5, 'Arabic Language', 'Beginner', 'Tue-Thu at 2:00 PM', 20, 10, 'Private Link', 'Active'),
('Islamic Studies Advanced', 4, 'Islamic Studies', 'Advanced', 'Sun 2:00 PM', 15, 7, 'Zoom', 'Scheduled');

-- Enroll sample student in first class
INSERT INTO enrollments (student_id, class_id, status) VALUES
(6, 1, 'active');

-- Sample Messages
INSERT INTO messages (sender_id, receiver_id, content) VALUES
(2, 6, 'As-salamu alaykum, Ahmed. Ready for today''s session?'),
(6, 2, 'Wa Alaykumu s-salam, Sheikh. Yes, I am ready.');
