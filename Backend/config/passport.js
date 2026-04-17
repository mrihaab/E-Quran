const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
const logger = require('../utils/logger');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ? AND is_deleted = 0', [id]);
    done(null, users[0] || null);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const googleId = profile.id;
          const fullName = profile.displayName;
          const profileImage = profile.photos[0]?.value || null;
          // Get role from request (set by middleware in auth.js)
          const role = req.oauthRole || null;
          console.log('=== GOOGLE OAUTH CALLBACK ===');
          console.log('Extracted role from store:', role);

          // Check if user exists with this Google ID
          let [users] = await db.query(
            'SELECT * FROM users WHERE google_id = ?',
            [googleId]
          );

          if (users.length > 0) {
            // User exists, update profile image if changed
            if (profileImage && users[0].profile_image !== profileImage) {
              await db.query(
                'UPDATE users SET profile_image = ? WHERE id = ?',
                [profileImage, users[0].id]
              );
            }
            logger.info(`Google login: Existing user ${email}`);
            return done(null, users[0]);
          }

          // Check if user exists with this email (not Google linked)
          [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
          );

          if (users.length > 0) {
            // Link Google account to existing user
            await db.query(
              'UPDATE users SET google_id = ?, is_verified = 1, profile_image = COALESCE(?, profile_image) WHERE id = ?',
              [googleId, profileImage, users[0].id]
            );
            
            const [updated] = await db.query('SELECT * FROM users WHERE id = ?', [users[0].id]);
            logger.info(`Google login: Linked to existing user ${email}`);
            return done(null, updated[0]);
          }

          // New user - create with pending role selection (or use provided role)
          // Store temp user data with role if provided
          const tempUser = {
            googleId,
            email,
            fullName,
            profileImage,
            isNewUser: true,
            is_verified: 1,
            role: role, // May be null if no role selected yet
          };

          logger.info(`Google login: New user ${email}, role: ${role || 'not selected yet'}`);
          return done(null, tempUser);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
  logger.info('Google OAuth strategy initialized');
} else {
  logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET missing');
}

module.exports = passport;
