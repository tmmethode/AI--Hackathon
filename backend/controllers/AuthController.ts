import { Route, Post, Body, Tags, Get, Security, Request, HttpError } from 'tsoa';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import {
  IUserResponse,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  GoogleAuthRequest,
  RefreshTokenRequest,
  ProfileResponse,
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

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new HttpError(409, 'User with this email already exists');
      }

      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        phoneNumber,
        isEmailVerified: false,
      });

      await user.save();

      const token = this.generateToken(user._id.toString());

      return {
        user: this.convertUserToResponse(user),
        token,
        message: 'User registered successfully',
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(
        500,
        `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  @Post('login')
  public async login(@Body() requestBody: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = requestBody;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new HttpError(401, 'Invalid email or password');
      }

      if (!user.password) {
        throw new HttpError(400, 'Please login with Google');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new HttpError(401, 'Invalid email or password');
      }

      const token = this.generateToken(user._id.toString());

      return {
        user: this.convertUserToResponse(user),
        token,
        message: 'Login successful',
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  @Get('me')
  @Security('jwt')
  public async getProfile(@Request() req: any): Promise<ProfileResponse> {
    try {
      const userId = req.user?._id || req.user?.userId || req.user?.id;

      if (!userId) {
        throw new HttpError(401, 'User not authenticated');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      return {
        user: this.convertUserToResponse(user),
        message: 'Profile retrieved successfully',
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(
        500,
        `Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  @Post('refresh')
  @Security('jwt')
  public async refreshToken(
    @Request() req: any,
    @Body() requestBody?: RefreshTokenRequest
  ): Promise<AuthResponse> {
    try {
      const userId =
        req.user?._id ||
        req.user?.userId ||
        req.user?.id ||
        requestBody?.userId;

      if (!userId) {
        throw new HttpError(401, 'User not authenticated');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      const token = this.generateToken(user._id.toString());

      return {
        user: this.convertUserToResponse(user),
        token,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(
        500,
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
