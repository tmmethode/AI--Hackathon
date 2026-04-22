import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'recruiter' | 'admin' | 'applicant';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
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
  notificationPreferences: {
    screening: boolean;
    applicants: boolean;
    export: boolean;
    system: boolean;
  };
  readNotificationIds: string[];
  themePreference: 'light' | 'dark' | 'system';
  languagePreference: 'en' | 'fr' | 'rw';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  __v?: number;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function(this: IUser) {
      return !this.googleId;
    },
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['recruiter', 'admin', 'applicant'],
    default: 'applicant',
    required: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100,
    default: null
  },
  location: {
    type: String,
    trim: true,
    maxlength: 120,
    default: null
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },
  notificationPreferences: {
    screening: { type: Boolean, default: true },
    applicants: { type: Boolean, default: true },
    export: { type: Boolean, default: false },
    system: { type: Boolean, default: true }
  },
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'light'
  },
  languagePreference: {
    type: String,
    enum: ['en', 'fr', 'rw'],
    default: 'en'
  },
  readNotificationIds: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: any) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
