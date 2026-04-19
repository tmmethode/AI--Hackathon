import express from 'express';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import cors from 'cors';
import morgan from 'morgan';
import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

dotenv.config();

// Simple User schema for testing
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['recruiter', 'admin', 'applicant'], default: 'applicant' },
  phoneNumber: { type: String, default: null },
  department: { type: String, default: null },
  location: { type: String, default: null },
  bio: { type: String, default: null },
  profilePicture: { type: String, default: null },
  notificationPreferences: {
    screening: { type: Boolean, default: true },
    applicants: { type: Boolean, default: true },
    export: { type: Boolean, default: false },
    system: { type: Boolean, default: true }
  },
  themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  languagePreference: { type: String, enum: ['en', 'fr', 'rw'], default: 'en' },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const UserModel = mongoose.model('User', UserSchema);

const app = express();

// Connect to database
connectDatabase().then((result) => {
  if (!result.success) {
    console.error('Failed to connect to database:', result.error);
    process.exit(1);
  }
  console.log('Connected to MongoDB successfully');
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "capacitor://localhost", "http://localhost:8080"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(morgan('combined'));

// Helper function to generate JWT
function generateToken(userId: string): string {
  return (sign as any)(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') }
  );
}

// Middleware to verify JWT
const authenticateToken = (req: any, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is required',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
};

// Routes

// Register
app.post('/auth/register', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const currentUser = await UserModel.findById(req.user.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
        timestamp: new Date().toISOString()
      });
    }

    const { email, password, firstName, lastName, role = 'applicant' } = req.body;

    // Check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Registration failed',
        message: 'User with this email already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Create new user
    const user = new UserModel({
      email,
      password,
      firstName,
      lastName,
      role
    });

    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        department: user.department,
        location: user.location,
        bio: user.bio,
        profilePicture: user.profilePicture,
        notificationPreferences: user.notificationPreferences,
        themePreference: user.themePreference,
        languagePreference: user.languagePreference
      },
      token,
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Login
app.post('/auth/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        department: user.department,
        location: user.location,
        bio: user.bio,
        profilePicture: user.profilePicture,
        notificationPreferences: user.notificationPreferences,
        themePreference: user.themePreference,
        languagePreference: user.languagePreference
      },
      token,
      message: 'Login successful'
    });
  } catch (error) {
    res.status(401).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get profile (protected route)
app.get('/auth/me', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        department: user.department,
        location: user.location,
        bio: user.bio,
        profilePicture: user.profilePicture,
        notificationPreferences: user.notificationPreferences,
        themePreference: user.themePreference,
        languagePreference: user.languagePreference
      },
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get profile',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.patch('/auth/me', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
        timestamp: new Date().toISOString()
      });
    }

    const normalize = (value: unknown) => {
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : '';
    };

    if (typeof req.body.email === 'string') {
      const email = req.body.email.trim().toLowerCase();
      if (!email) {
        return res.status(400).json({
          error: 'Profile update failed',
          message: 'Email is required',
          timestamp: new Date().toISOString()
        });
      }

      const existingUser = await UserModel.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(409).json({
          error: 'Profile update failed',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString()
        });
      }

      user.email = email;
    }

    if (typeof req.body.firstName === 'string') {
      const firstName = req.body.firstName.trim();
      if (!firstName) {
        return res.status(400).json({
          error: 'Profile update failed',
          message: 'First name is required',
          timestamp: new Date().toISOString()
        });
      }
      user.firstName = firstName;
    }

    if (typeof req.body.lastName === 'string') {
      const lastName = req.body.lastName.trim();
      if (!lastName) {
        return res.status(400).json({
          error: 'Profile update failed',
          message: 'Last name is required',
          timestamp: new Date().toISOString()
        });
      }
      user.lastName = lastName;
    }

    if (typeof req.body.phoneNumber === 'string') {
      user.phoneNumber = normalize(req.body.phoneNumber) || null;
    }

    if (typeof req.body.department === 'string') {
      user.department = normalize(req.body.department) || null;
    }

    if (typeof req.body.location === 'string') {
      user.location = normalize(req.body.location) || null;
    }

    if (typeof req.body.bio === 'string') {
      user.bio = normalize(req.body.bio) || null;
    }

    if (typeof req.body.profilePicture === 'string') {
      user.profilePicture = normalize(req.body.profilePicture) || null;
    }

    await user.save();

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        department: user.department,
        location: user.location,
        bio: user.bio,
        profilePicture: user.profilePicture,
        notificationPreferences: user.notificationPreferences,
        themePreference: user.themePreference,
        languagePreference: user.languagePreference
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Profile update failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.patch('/auth/me/preferences', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
        timestamp: new Date().toISOString()
      });
    }

    if (req.body.notificationPreferences) {
      const currentPreferences = user.notificationPreferences || {
        screening: true,
        applicants: true,
        export: false,
        system: true
      };

      user.notificationPreferences = {
        screening: req.body.notificationPreferences.screening ?? currentPreferences.screening,
        applicants: req.body.notificationPreferences.applicants ?? currentPreferences.applicants,
        export: req.body.notificationPreferences.export ?? currentPreferences.export,
        system: req.body.notificationPreferences.system ?? currentPreferences.system
      };
    }

    if (typeof req.body.themePreference === 'string') {
      user.themePreference = req.body.themePreference;
    }

    if (typeof req.body.languagePreference === 'string') {
      user.languagePreference = req.body.languagePreference;
    }

    await user.save();

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        department: user.department,
        location: user.location,
        bio: user.bio,
        profilePicture: user.profilePicture,
        notificationPreferences: user.notificationPreferences,
        themePreference: user.themePreference,
        languagePreference: user.languagePreference
      },
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Preferences update failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/auth/me/password', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword?.trim() || !newPassword?.trim()) {
      return res.status(400).json({
        error: 'Password update failed',
        message: 'Current password and new password are required',
        timestamp: new Date().toISOString()
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password update failed',
        message: 'New password must be at least 8 characters long',
        timestamp: new Date().toISOString()
      });
    }

    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
        timestamp: new Date().toISOString()
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Password update failed',
        message: 'Current password is incorrect',
        timestamp: new Date().toISOString()
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'Password update failed',
        message: 'New password must be different from the current password',
        timestamp: new Date().toISOString()
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Password update failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Admin-only route example
app.get('/auth/admin-only', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      message: 'Admin access granted',
      data: 'This is admin-only content'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Simple Authentication API is running',
    endpoints: {
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      profile: 'GET /auth/me',
      adminOnly: 'GET /auth/admin-only'
    },
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Simple Auth API is running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- POST /auth/register - Register new user`);
  console.log(`- POST /auth/login - Login with email/password`);
  console.log(`- GET /auth/me - Get user profile (requires auth)`);
  console.log(`- GET /auth/admin-only - Admin-only route example`);
  console.log(`\nTest with curl:`);
  console.log(`curl -X POST http://localhost:${PORT}/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'`);
});

export default app;
