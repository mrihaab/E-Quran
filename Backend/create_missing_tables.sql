-- Create missing tables for E-Quran Academy
-- Run this in phpMyAdmin or MySQL CLI

USE equran_academy;

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

-- Create otp_verifications table
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

-- Check if users table needs google_id column
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'google_id' AND table_schema = 'equran_academy');
               
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL UNIQUE',
                   'SELECT "google_id column already exists" as message');
                   
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Missing tables created successfully!' as status;
