import mongoose, { Document, Schema } from 'mongoose';

export type ApplicantSource =
  | 'umurava-platform'
  | 'pdf-upload'
  | 'csv-import'
  | 'paste-links';

export type IngestStatus = 'parsed' | 'pending' | 'failed';

export interface ISkill {
  name: string;
  level?: string;
  yearsOfExperience?: number;
}

export interface ILanguage {
  name: string;
  proficiency?: string;
}

export interface IExperience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
  isCurrent?: boolean;
}

export interface IEducation {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface ICertification {
  name: string;
  issuer?: string;
  issueDate?: string;
}

export interface IProject {
  name: string;
  description?: string;
  technologies?: string[];
  role?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface IAvailability {
  status?: string;
  type?: string;
  startDate?: string;
}

export interface ISocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface IApplicant extends Document {
  _id: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;

  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;

  skills: ISkill[];
  languages: ILanguage[];
  experience: IExperience[];
  education: IEducation[];
  certifications: ICertification[];
  projects: IProject[];

  availability?: IAvailability;
  socialLinks?: ISocialLinks;

  // Ingestion metadata
  source: ApplicantSource;
  ingestStatus: IngestStatus;
  ingestError?: string;
  sourceFileName?: string;
  sourceUrl?: string;
  rawPayload?: Record<string, any>;

  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, trim: true },
    yearsOfExperience: { type: Number, min: 0 },
  },
  { _id: false }
);

const LanguageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    proficiency: { type: String, trim: true },
  },
  { _id: false }
);

const ExperienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    description: { type: String, trim: true },
    technologies: { type: [String], default: [] },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: false }
);

const EducationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
  },
  { _id: false }
);

const CertificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, trim: true },
    issueDate: { type: String, trim: true },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    technologies: { type: [String], default: [] },
    role: { type: String, trim: true },
    link: { type: String, trim: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
  },
  { _id: false }
);

const AvailabilitySchema = new Schema(
  {
    status: { type: String, trim: true },
    type: { type: String, trim: true },
    startDate: { type: String, trim: true },
  },
  { _id: false }
);

const SocialLinksSchema = new Schema(
  {
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    portfolio: { type: String, trim: true },
  },
  { _id: false }
);

const ApplicantSchema: Schema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    headline: { type: String, trim: true },
    bio: { type: String, trim: true },
    location: { type: String, trim: true },

    skills: { type: [SkillSchema], default: [] },
    languages: { type: [LanguageSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },

    availability: { type: AvailabilitySchema },
    socialLinks: { type: SocialLinksSchema },

    source: {
      type: String,
      enum: ['umurava-platform', 'pdf-upload', 'csv-import', 'paste-links'],
      required: true,
    },
    ingestStatus: {
      type: String,
      enum: ['parsed', 'pending', 'failed'],
      default: 'parsed',
      required: true,
    },
    ingestError: { type: String, trim: true },
    sourceFileName: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    rawPayload: { type: Schema.Types.Mixed },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent duplicate applicants for the same job
ApplicantSchema.index({ job: 1, email: 1 }, { unique: true });
ApplicantSchema.index({ job: 1, source: 1 });
ApplicantSchema.index({ firstName: 'text', lastName: 'text', email: 'text', headline: 'text' });

const Applicant = mongoose.model<IApplicant>('Applicant', ApplicantSchema);

export default Applicant;
