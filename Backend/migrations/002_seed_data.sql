-- ============================================================
-- E-Quran Academy — Optional Development Seed Data
-- ============================================================
-- Only run this for local development. Do NOT run in production.
-- All sample passwords are bcrypt('admin123') for convenience.
-- ============================================================

USE equran_academy;

SET @SAMPLE_PWD := '$2a$10$8J7Nl8UOz9EKD4A08VoGtO1CriWJQDDWRexqrO41b.dRCJNYlrQjq';

-- ==================== SUPER ADMIN ====================
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, is_verified, is_approved, profile_image)
VALUES ('Super Admin', 'admin@equran.com', @SAMPLE_PWD, '+1 000 000 0000', 'admin', 'male', 'active', 1, 1, 'https://picsum.photos/seed/admin/100/100')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO admins (user_id, admin_level, permissions)
SELECT id, 'super', JSON_OBJECT('all', TRUE)
FROM users WHERE email = 'admin@equran.com'
  AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.user_id = users.id);

-- ==================== TEACHERS ====================
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, is_verified, is_approved, profile_image)
VALUES
  ('Sheikh Ahmed Al-Mansouri', 'ahmed.teacher@equran.com',  @SAMPLE_PWD, '+1 111 111 1111', 'teacher', 'male',   'active', 1, 1, 'https://picsum.photos/seed/teacher1/100/100'),
  ('Ustazah Fatima Khan',      'fatima.teacher@equran.com', @SAMPLE_PWD, '+1 222 222 2222', 'teacher', 'female', 'active', 1, 1, 'https://picsum.photos/seed/teacher2/100/100'),
  ('Sheikh Rashid Al-Makki',   'rashid.teacher@equran.com', @SAMPLE_PWD, '+1 333 333 3333', 'teacher', 'male',   'active', 1, 1, 'https://picsum.photos/seed/teacher3/100/100'),
  ('Ustazah Aisha Mohamed',    'aisha.teacher@equran.com',  @SAMPLE_PWD, '+1 444 444 4444', 'teacher', 'female', 'active', 1, 1, 'https://picsum.photos/seed/teacher4/100/100')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO teachers (user_id, teacher_id, qualification, subject, years_experience, salary, rating, expertise, availability, languages)
SELECT u.id, CONCAT('TEA', LPAD(u.id, 3, '0')), q.qualification, q.subject, q.years_experience, q.salary, q.rating, q.expertise, q.availability, q.languages
FROM users u
JOIN (
  SELECT 'ahmed.teacher@equran.com'  AS email, 'PhD in Tajweed Sciences'                  AS qualification, 'Tajweed'             AS subject, 15 AS years_experience, 5000.00 AS salary, 4.80 AS rating, 'Tajweed & Qira''at'   AS expertise, 'Mon-Fri, 9AM-5PM'  AS availability, 'Arabic, English'         AS languages UNION ALL
  SELECT 'fatima.teacher@equran.com',                'Certified Hafiza, M.A. Islamic Studies',  'Quran Memorization',                12,                     4500.00,           4.90,         'Hifz (Memorization)',                'Tue-Sat, 10AM-6PM',                'Arabic, Urdu' UNION ALL
  SELECT 'rashid.teacher@equran.com',                'Master in Islamic Jurisprudence',         'Islamic Studies',                  20,                     5500.00,           4.70,         'Islamic Studies',                    'Mon-Wed, 2PM-8PM',                 'Arabic, English, Malay' UNION ALL
  SELECT 'aisha.teacher@equran.com',                 'B.A. Arabic Language & Literature',       'Arabic Language',                  10,                     4000.00,           4.80,         'Arabic Language',                    'Thu-Sun, 11AM-7PM',                'Arabic, English, French'
) q ON q.email = u.email
WHERE NOT EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = u.id);

-- ==================== STUDENT ====================
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, is_verified, is_approved, profile_image)
VALUES ('Ahmed Khan', 'student@equran.com', @SAMPLE_PWD, '+1 555 555 5555', 'student', 'male', 'active', 1, 1, 'https://picsum.photos/seed/ahmed/100/100')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO students (user_id, student_id, date_of_birth, course, enrollment_year, level)
SELECT id, 'STU001', '2000-05-15', 'Tajweed Mastery', 2024, 'Intermediate'
FROM users WHERE email = 'student@equran.com'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = users.id);

-- ==================== PARENT ====================
INSERT INTO users (full_name, email, password_hash, phone, role, gender, status, is_verified, is_approved, profile_image)
VALUES ('Omar Khalid', 'parent@equran.com', @SAMPLE_PWD, '+1 666 666 6666', 'parent', 'male', 'active', 1, 1, 'https://picsum.photos/seed/parent/100/100')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO parents (user_id, parent_id, child_name, relationship, child_class)
SELECT id, 'PAR001', 'Hassan Omar', 'father', 'Grade 5'
FROM users WHERE email = 'parent@equran.com'
  AND NOT EXISTS (SELECT 1 FROM parents p WHERE p.user_id = users.id);

-- ==================== COURSES & CLASSES ====================
INSERT IGNORE INTO courses (name, level, description, instructor_id)
SELECT * FROM (
  SELECT 'Tajweed Mastery'         AS name, 'Intermediate' AS level, 'Master the rules of Tajweed and perfect your Quran recitation with expert guidance.'           AS description, (SELECT id FROM users WHERE email='ahmed.teacher@equran.com')  AS instructor_id UNION ALL
  SELECT 'Hifz Fast Track',                  'Advanced',                'Accelerated Quran memorization program with proven techniques and daily revision.',                                                  (SELECT id FROM users WHERE email='fatima.teacher@equran.com') UNION ALL
  SELECT 'Arabic Language Basics',           'Beginner',                'Learn the fundamentals of Arabic language to understand the Quran in its original text.',                                          (SELECT id FROM users WHERE email='aisha.teacher@equran.com') UNION ALL
  SELECT 'Islamic Studies',                  'Intermediate',            'Comprehensive study of Islamic history, Fiqh, Aqeedah, and Seerah.',                                                                  (SELECT id FROM users WHERE email='rashid.teacher@equran.com')
) c;

INSERT IGNORE INTO classes (name, teacher_id, subject, level, schedule, capacity, enrolled_count, platform, status)
SELECT * FROM (
  SELECT 'Tajweed Essentials'      AS name, (SELECT id FROM users WHERE email='ahmed.teacher@equran.com')  AS teacher_id, 'Tajweed'             AS subject, 'Beginner'    AS level, 'Daily at 10:00 AM'      AS schedule, 20 AS capacity, 8 AS enrolled_count, 'Zoom'         AS platform, 'Active'    AS status UNION ALL
  SELECT 'Quran Memorization',                (SELECT id FROM users WHERE email='fatima.teacher@equran.com'),               'Quran Memorization',             'Intermediate',           'Mon-Wed at 4:00 PM',                15,             5,                'Portal Meet',          'Active' UNION ALL
  SELECT 'Arabic Language 101',               (SELECT id FROM users WHERE email='aisha.teacher@equran.com'),                'Arabic Language',                'Beginner',               'Tue-Thu at 2:00 PM',                20,             10,               'Private Link',         'Active' UNION ALL
  SELECT 'Islamic Studies Advanced',          (SELECT id FROM users WHERE email='rashid.teacher@equran.com'),               'Islamic Studies',                'Advanced',               'Sun 2:00 PM',                       15,             7,                'Zoom',                 'Scheduled'
) cls;

INSERT IGNORE INTO enrollments (student_id, class_id, status)
SELECT (SELECT id FROM users WHERE email='student@equran.com'),
       (SELECT id FROM classes WHERE name='Tajweed Essentials' LIMIT 1),
       'active';

INSERT IGNORE INTO messages (sender_id, receiver_id, content) VALUES
  ((SELECT id FROM users WHERE email='ahmed.teacher@equran.com'), (SELECT id FROM users WHERE email='student@equran.com'), 'As-salamu alaykum, Ahmed. Ready for today''s session?'),
  ((SELECT id FROM users WHERE email='student@equran.com'),       (SELECT id FROM users WHERE email='ahmed.teacher@equran.com'), 'Wa Alaykumu s-salam, Sheikh. Yes, I am ready.');

SELECT 'Development seed data applied' AS status;
