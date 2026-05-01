const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
const logger = require('../utils/logger');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ? AND is_deleted = 0', [id]);
    done(null, users[0] || null);
  } catch (error) {
    done(error, null);
  }
});

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
          const role = req.oauthRole || null;

          let [users] = await db.query(
            'SELECT * FROM users WHERE google_id = ? AND is_deleted = 0',
            [googleId]
          );

          if (users.length > 0) {
            if (profileImage && users[0].profile_image !== profileImage) {
              await db.query(
                'UPDATE users SET profile_image = ? WHERE id = ?',
                [profileImage, users[0].id]
              );
            }
            logger.info(`Google login: Existing user ${email}`);
            return done(null, users[0]);
          }

          [users] = await db.query(
            'SELECT * FROM users WHERE email = ? AND is_deleted = 0',
            [email]
          );

          if (users.length > 0) {
            await db.query(
              'UPDATE users SET google_id = ?, is_verified = 1, profile_image = COALESCE(?, profile_image) WHERE id = ?',
              [googleId, profileImage, users[0].id]
            );

            const [updated] = await db.query('SELECT * FROM users WHERE id = ?', [users[0].id]);
            logger.info(`Google login: Linked to existing user ${email}`);
            return done(null, updated[0]);
          }

          const tempUser = {
            googleId,
            email,
            fullName,
            profileImage,
            isNewUser: true,
            is_verified: 1,
            role: role,
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
