-- ============================================================
-- E-Quran Academy — Refresh Token Rotation Support
-- ============================================================
-- Adds a `revoked_at` column so refresh tokens can be revoked without
-- being hard-deleted (preserves an audit trail and allows the
-- refresh-rotation flow to detect reuse of an already-rotated token).
-- ============================================================

USE equran_academy;

-- ADD COLUMN IF NOT EXISTS is supported by MySQL 8.0.29+ and MariaDB
-- 10.5+. For broader portability, fall back to information_schema.
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'refresh_tokens'
    AND COLUMN_NAME  = 'revoked_at'
);
SET @stmt := IF(@col_exists = 0,
  'ALTER TABLE refresh_tokens ADD COLUMN revoked_at DATETIME DEFAULT NULL AFTER expires_at',
  'SELECT 1');
PREPARE addcol FROM @stmt;
EXECUTE addcol;
DEALLOCATE PREPARE addcol;

SELECT 'refresh_tokens.revoked_at ready' AS status;
