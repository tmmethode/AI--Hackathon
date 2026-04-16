import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import User, { IUser } from '../models/User';

// Local Strategy for email/password login
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.password) {
          return done(null, false, { message: 'Please login with Google' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth Strategy (only configure if credentials are available)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({
            $or: [
              { googleId: profile.id },
              { email: profile.emails?.[0]?.value }
            ]
          });

          if (user) {
            // Update existing user with Google info if needed
            if (!user.googleId) {
              user.googleId = profile.id;
            }
            if (!user.profilePicture && profile.photos?.[0]?.value) {
              user.profilePicture = profile.photos[0].value;
            }
            user.isEmailVerified = true;
            await user.save();
          } else {
            // Create new user from Google profile
            user = new User({
              email: profile.emails?.[0]?.value,
              firstName: profile.name?.givenName || 'Google',
              lastName: profile.name?.familyName || 'User',
              googleId: profile.id,
              profilePicture: profile.photos?.[0]?.value,
              isEmailVerified: true,
              role: 'applicant' // Default role for Google users
            });
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth credentials not found. Google login will be disabled.');
}

// JWT Strategy for token-based authentication
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.userId);
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize and deserialize user for sessions
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
