require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const DEV_ONLY_JWT_SECRET = 'dev-only-equran-access-secret-change-before-production';
const DEV_ONLY_REFRESH_SECRET = 'dev-only-equran-refresh-secret-change-before-production';

function getSecret(name, fallback) {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  if (isProduction) {
    throw new Error(`${name} must be configured in production.`);
  }

  return fallback;
}

function parseEmailAllowlist(value = '') {
  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

const predefinedAdminEmails = parseEmailAllowlist(process.env.PREDEFINED_ADMIN_EMAILS);

function isPredefinedAdmin(email) {
  if (!email) {
    return false;
  }

  return predefinedAdminEmails.includes(email.toLowerCase().trim());
}

module.exports = {
  JWT_SECRET: getSecret('JWT_SECRET', DEV_ONLY_JWT_SECRET),
  JWT_REFRESH_SECRET: getSecret('JWT_REFRESH_SECRET', DEV_ONLY_REFRESH_SECRET),
  predefinedAdminEmails,
  isPredefinedAdmin
};
