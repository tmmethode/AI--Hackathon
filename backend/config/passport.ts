import 'dotenv/config';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
  VerifyCallback as GoogleVerifyCallback,
} from 'passport-google-oauth20';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import User, { IUser } from '../models/User';

export const hasGoogleOAuthConfig = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

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

// Only register Google OAuth when credentials are present so local/dev environments still boot cleanly.
if (hasGoogleOAuthConfig) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId as string,
        clientSecret: googleClientSecret as string,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        done: GoogleVerifyCallback
      ) => {
        void accessToken;
        void refreshToken;
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase().trim();
          if (!email) {
            return done(null, false, { message: 'Your Google account did not provide an email address.' });
          }

          let user = await User.findOne({ email });

          if (!user) {
            return done(null, false, {
              message: 'Ask an admin to create your account first, then return here to sign in with the same email.',
            });
          }

          if (user.googleId && user.googleId !== profile.id) {
            return done(null, false, {
              message: 'This workspace account is already linked to a different Google account.',
            });
          }

          if (!user.googleId) {
            user.googleId = profile.id;
          }
          if (!user.profilePicture && profile.photos?.[0]?.value) {
            user.profilePicture = profile.photos[0].value;
          }
          user.isEmailVerified = true;
          await user.save();

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
