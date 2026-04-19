// TSOA-compatible interfaces for authentication

export type UserRole = 'recruiter' | 'admin' | 'applicant';
export type ThemePreference = 'light' | 'dark' | 'system';
export type LanguagePreference = 'en' | 'fr' | 'rw';

export interface NotificationPreferences {
  screening: boolean;
  applicants: boolean;
  export: boolean;
  system: boolean;
}

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
  department?: string;
  location?: string;
  bio?: string;
  notificationPreferences?: NotificationPreferences;
  themePreference?: ThemePreference;
  languagePreference?: LanguagePreference;
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

export interface UpdateProfileRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  department?: string;
  location?: string;
  bio?: string;
  profilePicture?: string;
}

export interface UpdatePreferencesRequest {
  notificationPreferences?: NotificationPreferences;
  themePreference?: ThemePreference;
  languagePreference?: LanguagePreference;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileResponse {
  user: IUserResponse;
  message: string;
}
