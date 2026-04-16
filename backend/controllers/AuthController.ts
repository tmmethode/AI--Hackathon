import { Route, Post, Body, Tags, Get, Query, Security, Request } from 'tsoa';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { 
  UserRole, 
  IUserResponse, 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  GoogleAuthRequest,
} from '../interfaces/auth';

@Tags('Authentication')
@Route('auth')
export class AuthController {
  
  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
  }

  private convertUserToResponse(user: IUser): IUserResponse {
    return {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      googleId: user.googleId,
      isEmailVerified: user.isEmailVerified,
      profilePicture: user.profilePicture,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  @Post('register')
  public async register(@Body() requestBody: RegisterRequest): Promise<AuthResponse> {
    try {
      const { email, password, firstName, lastName, role = 'applicant', phoneNumber } = requestBody;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        phoneNumber,
        isEmailVerified: false
      });

      await user.save();

      const token = this.generateToken(user._id.toString());

      return {
        user: this.convertUserToResponse(user),
        token,
        message: 'User registered successfully'
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  @Post('login')
  public async login(@Body() requestBody: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = requestBody;

      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user has password (Google OAuth users might not)
      if (!user.password) {
        throw new Error('Please login with Google');
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      const token = this.generateToken(user._id.toString());

      return {
        user: this.convertUserToResponse(user),
        token,
        message: 'Login successful'
      };
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  @Post('google')
  public async googleAuth(@Body() requestBody: GoogleAuthRequest): Promise<AuthResponse> {
    try {
      const { idToken } = requestBody;
      
      // For now, we'll simulate Google OAuth verification
      // In production, you'd verify the ID token with Google's API
      // This is a simplified version for demonstration
      
      // Mock Google user data - in production, decode the actual ID token
      const googleUser = {
        email: 'user@gmail.com', // This would come from the decoded token
        firstName: 'Google',
        lastName: 'User',
        googleId: 'google-user-id', // This would come from the decoded token
        profilePicture: 'https://lh3.googleusercontent.com/...'
      };

      // Find or create user
      let user = await User.findOne({ 
        $or: [
          { email: googleUser.email },
          { googleId: googleUser.googleId }
        ]
      });

      if (user) {
        // Update existing user with Google info if needed
        if (!user.googleId) {
          user.googleId = googleUser.googleId;
        }
        if (!user.profilePicture) {
          user.profilePicture = googleUser.profilePicture;
        }
        user.isEmailVerified = true;
        await user.save();
      } else {
        // Create new user from Google data
        user = new User({
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          googleId: googleUser.googleId,
          profilePicture: googleUser.profilePicture,
          isEmailVerified: true,
          role: 'applicant' // Default role for Google users
        });
        await user.save();
      }

      const token = this.generateToken(user._id.toString());

      return {
        user: this.convertUserToResponse(user),
        token,
        message: 'Google authentication successful'
      };
    } catch (error) {
      throw new Error(`Google authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
