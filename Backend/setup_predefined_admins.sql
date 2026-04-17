-- Setup Predefined Admins for E-Quran Academy
-- Run this in phpMyAdmin SQL tab

USE equran_academy;

-- Check if users exist and update/insert accordingly
-- Admin 1: orhanuppal@gmail.com
INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, status, is_verified, profile_image, google_id) 
VALUES ('System Admin 1', 'orhanuppal@gmail.com', '$2a$10$PredefinedAdminPasswordHash', NULL, 'admin', NULL, NULL, 'active', 1, 'https://ui-avatars.com/api/?name=Admin+1&background=0D8ABC&color=fff', NULL)
ON DUPLICATE KEY UPDATE 
    role = 'admin', 
    is_verified = 1, 
    status = 'active',
    full_name = 'System Admin 1';

-- Admin 2: mrihaab6@gmail.com  
INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, status, is_verified, profile_image, google_id)
VALUES ('System Admin 2', 'mrihaab6@gmail.com', '$2a$10$PredefinedAdminPasswordHash', NULL, 'admin', NULL, NULL, 'active', 1, 'https://ui-avatars.com/api/?name=Admin+2&background=0D8ABC&color=fff', NULL)
ON DUPLICATE KEY UPDATE 
    role = 'admin', 
    is_verified = 1, 
    status = 'active',
    full_name = 'System Admin 2';

-- Admin 3: m.bilalirshad469@gmail.com
INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, status, is_verified, profile_image, google_id)
VALUES ('System Admin 3', 'm.bilalirshad469@gmail.com', '$2a$10$PredefinedAdminPasswordHash', NULL, 'admin', NULL, NULL, 'active', 1, 'https://ui-avatars.com/api/?name=Admin+3&background=0D8ABC&color=fff', NULL)
ON DUPLICATE KEY UPDATE 
    role = 'admin', 
    is_verified = 1, 
    status = 'active',
    full_name = 'System Admin 3';

-- Get the IDs and create admin records
SET @admin1_id = (SELECT id FROM users WHERE email = 'orhanuppal@gmail.com');
SET @admin2_id = (SELECT id FROM users WHERE email = 'mrihaab6@gmail.com');
SET @admin3_id = (SELECT id FROM users WHERE email = 'm.bilalirshad469@gmail.com');

-- Insert admin records if not exist (avoiding duplicate key issues)
INSERT IGNORE INTO admins (user_id, admin_level, permissions)
VALUES 
    (@admin1_id, 'super', '{"all": true}'),
    (@admin2_id, 'super', '{"all": true}'),
    (@admin3_id, 'super', '{"all": true}');

-- Alternative: Update existing admin records
UPDATE admins SET admin_level = 'super', permissions = '{"all": true}' 
WHERE user_id IN (@admin1_id, @admin2_id, @admin3_id);

SELECT 'Predefined admins setup complete!' as status;
