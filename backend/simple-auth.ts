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
app.post('/auth/register', async (req: express.Request, res: express.Response) => {
  try {
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
        role: user.role
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
        role: user.role
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
        role: user.role
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
