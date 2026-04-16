import { Route, Post, Body, Tags, Get, Request } from 'tsoa';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { 
  IUserResponse, 
  RefreshTokenRequest, 
  ProfileResponse 
} from '../interfaces/auth';
import { authenticateToken } from '../middleware/auth';

@Tags('Protected Authentication')
@Route('auth')
export class ProtectedAuthController {
  
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

  @Get('me')
  public async getProfile(@Request() req: any): Promise<ProfileResponse> {
    try {
      // Extract user from authenticated request
      const userId = req.user?._id || req.user?.userId || req.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        user: this.convertUserToResponse(user),
        message: 'Profile retrieved successfully'
      };
    } catch (error) {
      throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  @Post('refresh')
  public async refreshToken(@Body() requestBody: RefreshTokenRequest): Promise<any> {
    try {
      const { userId } = requestBody;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const token = this.generateToken(user._id.toString());

      return {
        user: this.convertUserToResponse(user),
        token,
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
