// TSOA-compatible interfaces for authentication

export type UserRole = 'recruiter' | 'admin' | 'applicant';

export interface IUserResponse {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  googleId?: string;
  isEmailVerified: boolean;
  profilePicture?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUserResponse;
  token: string;
  message: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface RefreshTokenRequest {
  userId: string;
}

export interface ProfileResponse {
  user: IUserResponse;
  message: string;
}
