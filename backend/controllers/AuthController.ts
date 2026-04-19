import { Route, Post, Patch, Body, Tags, Get, Security, Request, Path } from 'tsoa';
import { HttpError } from '../utils/HttpError';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';
import {
  IUserResponse,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  GoogleAuthRequest,
  RefreshTokenRequest,
  UpdateProfileRequest,
  UpdatePreferencesRequest,
  ChangePasswordRequest,
  ProfileResponse,
  AdminUpdateUserRequest,
  ResetUserPasswordRequest,
  UserListResponse,
} from '../interfaces/auth';

@Tags('Authentication')
@Route('auth')
export class AuthController {
  private normalizeOptional(value?: string): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '';
  }

  private async ensureAdminUserCountSafe(userId: string, nextRole?: string): Promise<void> {
    if (nextRole === undefined || nextRole === 'admin') {
      return;
    }

    const user = await User.findById(userId).select('role');
    if (!user || user.role !== 'admin') {
      return;
    }

    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new HttpError(400, 'At least one admin account must remain in the workspace');
    }
  }
  
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
      department: user.department,
      location: user.location,
      bio: user.bio,
      notificationPreferences: user.notificationPreferences,
      themePreference: user.themePreference,
      languagePreference: user.languagePreference,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  @Post('register')
  @Security('jwt', ['admin'])
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
      throw new HttpError(500, 'Registration failed');
    }
  }

  @Get('users')
  @Security('jwt', ['admin'])
  public async listUsers(): Promise<UserListResponse> {
    try {
      const users = await User.find().sort({ createdAt: -1 });

      return {
        users: users.map((user) => this.convertUserToResponse(user)),
        total: users.length,
        message: 'Users retrieved successfully',
      };
    } catch (error) {
      throw new HttpError(500, 'Failed to list users');
    }
  }

  @Patch('users/{id}')
  @Security('jwt', ['admin'])
  public async updateUser(
    @Request() req: any,
    @Path() id: string,
    @Body() requestBody: AdminUpdateUserRequest
  ): Promise<ProfileResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new HttpError(400, 'Invalid user id');
      }

      const actingUserId = req.user?._id || req.user?.userId || req.user?.id;
      const user = await User.findById(id);

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      if (typeof requestBody.email === 'string') {
        const normalizedEmail = requestBody.email.trim().toLowerCase();

        if (!normalizedEmail) {
          throw new HttpError(400, 'Email is required');
        }

        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });

        if (existingUser) {
          throw new HttpError(409, 'User with this email already exists');
        }

        user.email = normalizedEmail;
      }

      if (typeof requestBody.firstName === 'string') {
        const firstName = requestBody.firstName.trim();
        if (!firstName) {
          throw new HttpError(400, 'First name is required');
        }
        user.firstName = firstName;
      }

      if (typeof requestBody.lastName === 'string') {
        const lastName = requestBody.lastName.trim();
        if (!lastName) {
          throw new HttpError(400, 'Last name is required');
        }
        user.lastName = lastName;
      }

      if (typeof requestBody.role === 'string') {
        await this.ensureAdminUserCountSafe(user._id.toString(), requestBody.role);

        if (actingUserId && String(user._id) === String(actingUserId) && requestBody.role !== 'admin') {
          throw new HttpError(400, 'You cannot remove admin access from your current session');
        }

        user.role = requestBody.role;
      }

      if (typeof requestBody.phoneNumber === 'string') {
        user.phoneNumber = this.normalizeOptional(requestBody.phoneNumber) || undefined;
      }

      if (typeof requestBody.department === 'string') {
        user.department = this.normalizeOptional(requestBody.department) || undefined;
      }

      if (typeof requestBody.location === 'string') {
        user.location = this.normalizeOptional(requestBody.location) || undefined;
      }

      if (typeof requestBody.bio === 'string') {
        user.bio = this.normalizeOptional(requestBody.bio) || undefined;
      }

      if (typeof requestBody.profilePicture === 'string') {
        user.profilePicture = this.normalizeOptional(requestBody.profilePicture) || undefined;
      }

      if (typeof requestBody.isEmailVerified === 'boolean') {
        user.isEmailVerified = requestBody.isEmailVerified;
      }

      await user.save();

      return {
        user: this.convertUserToResponse(user),
        message: 'User updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to update user');
    }
  }

  @Post('users/{id}/reset-password')
  @Security('jwt', ['admin'])
  public async resetUserPassword(
    @Path() id: string,
    @Body() requestBody: ResetUserPasswordRequest
  ): Promise<{ message: string }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new HttpError(400, 'Invalid user id');
      }

      const { newPassword } = requestBody;
      if (!newPassword?.trim()) {
        throw new HttpError(400, 'New password is required');
      }

      if (newPassword.length < 8) {
        throw new HttpError(400, 'New password must be at least 8 characters long');
      }

      const user = await User.findById(id).select('+password');
      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      user.password = newPassword;
      await user.save();

      return {
        message: 'Password reset successfully',
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to reset password');
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
      throw new HttpError(500, 'Login failed');
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
      throw new HttpError(500, 'Failed to get profile');
    }
  }

  @Patch('me')
  @Security('jwt')
  public async updateProfile(
    @Request() req: any,
    @Body() requestBody: UpdateProfileRequest
  ): Promise<ProfileResponse> {
    try {
      const userId = req.user?._id || req.user?.userId || req.user?.id;

      if (!userId) {
        throw new HttpError(401, 'User not authenticated');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      if (typeof requestBody.email === 'string') {
        const normalizedEmail = requestBody.email.trim().toLowerCase();

        if (!normalizedEmail) {
          throw new HttpError(400, 'Email is required');
        }

        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });

        if (existingUser) {
          throw new HttpError(409, 'User with this email already exists');
        }

        if (user.email !== normalizedEmail) {
          user.email = normalizedEmail;
          user.isEmailVerified = false;
        }
      }

      if (typeof requestBody.firstName === 'string') {
        const firstName = requestBody.firstName.trim();
        if (!firstName) {
          throw new HttpError(400, 'First name is required');
        }
        user.firstName = firstName;
      }

      if (typeof requestBody.lastName === 'string') {
        const lastName = requestBody.lastName.trim();
        if (!lastName) {
          throw new HttpError(400, 'Last name is required');
        }
        user.lastName = lastName;
      }

      if (typeof requestBody.phoneNumber === 'string') {
        user.phoneNumber = this.normalizeOptional(requestBody.phoneNumber) || undefined;
      }

      if (typeof requestBody.department === 'string') {
        user.department = this.normalizeOptional(requestBody.department) || undefined;
      }

      if (typeof requestBody.location === 'string') {
        user.location = this.normalizeOptional(requestBody.location) || undefined;
      }

      if (typeof requestBody.bio === 'string') {
        user.bio = this.normalizeOptional(requestBody.bio) || undefined;
      }

      if (typeof requestBody.profilePicture === 'string') {
        user.profilePicture = this.normalizeOptional(requestBody.profilePicture) || undefined;
      }

      await user.save();

      return {
        user: this.convertUserToResponse(user),
        message: 'Profile updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to update profile');
    }
  }

  @Patch('me/preferences')
  @Security('jwt')
  public async updatePreferences(
    @Request() req: any,
    @Body() requestBody: UpdatePreferencesRequest
  ): Promise<ProfileResponse> {
    try {
      const userId = req.user?._id || req.user?.userId || req.user?.id;

      if (!userId) {
        throw new HttpError(401, 'User not authenticated');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      if (requestBody.notificationPreferences) {
        user.notificationPreferences = {
          screening: requestBody.notificationPreferences.screening ?? user.notificationPreferences.screening,
          applicants: requestBody.notificationPreferences.applicants ?? user.notificationPreferences.applicants,
          export: requestBody.notificationPreferences.export ?? user.notificationPreferences.export,
          system: requestBody.notificationPreferences.system ?? user.notificationPreferences.system,
        };
      }

      if (requestBody.themePreference) {
        user.themePreference = requestBody.themePreference;
      }

      if (requestBody.languagePreference) {
        user.languagePreference = requestBody.languagePreference;
      }

      await user.save();

      return {
        user: this.convertUserToResponse(user),
        message: 'Preferences updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to update preferences');
    }
  }

  @Post('me/password')
  @Security('jwt')
  public async changePassword(
    @Request() req: any,
    @Body() requestBody: ChangePasswordRequest
  ): Promise<{ message: string }> {
    try {
      const userId = req.user?._id || req.user?.userId || req.user?.id;

      if (!userId) {
        throw new HttpError(401, 'User not authenticated');
      }

      const { currentPassword, newPassword } = requestBody;

      if (!currentPassword?.trim() || !newPassword?.trim()) {
        throw new HttpError(400, 'Current password and new password are required');
      }

      if (newPassword.length < 8) {
        throw new HttpError(400, 'New password must be at least 8 characters long');
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      if (!user.password) {
        throw new HttpError(400, 'Password changes are unavailable for this account');
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new HttpError(401, 'Current password is incorrect');
      }

      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        throw new HttpError(400, 'New password must be different from the current password');
      }

      user.password = newPassword;
      await user.save();

      return {
        message: 'Password updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to update password');
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
      throw new HttpError(500, 'Token refresh failed');
    }
  }

  @Post('google')
  public async googleAuth(@Body() requestBody: GoogleAuthRequest): Promise<AuthResponse> {
    void requestBody;
    throw new HttpError(
      501,
      'Use the browser-based GET /auth/google flow for Google sign-in.'
    );
  }
}
