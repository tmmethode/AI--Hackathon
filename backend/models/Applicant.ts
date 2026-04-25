import mongoose, { Document, Schema } from 'mongoose';

export type ApplicantSource =
  | 'umurava-platform'
  | 'pdf-upload'
  | 'csv-import'
  | 'paste-links';

export type IngestStatus = 'parsed' | 'pending' | 'failed';

// Spec-defined controlled vocabularies (Talent Profile Schema §3.2 / §3.7)
export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export const LANGUAGE_PROFICIENCIES = ['Basic', 'Conversational', 'Fluent', 'Native'] as const;
export const AVAILABILITY_STATUSES = ['Available', 'Open to Opportunities', 'Not Available'] as const;
export const AVAILABILITY_TYPES = ['Full-time', 'Part-time', 'Contract'] as const;

// Date-format regexes per spec.
//   YYYY-MM  (work experience, projects, certifications) — also accepts "Present" for endDate.
//   YYYY-MM-DD (availability.startDate).
export const DATE_YYYY_MM_REGEX = /^(\d{4}-(0[1-9]|1[0-2])(-\d{2})?|Present)$/i;
export const DATE_YYYY_MM_DD_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

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
  // Required by the schema since the Talent Profile Schema §3.1 update.
  // Legacy documents that pre-date this change may still have these missing.
  headline: string;
  bio?: string;
  location: string;

  skills: ISkill[];
  languages: ILanguage[];
  experience: IExperience[];
  education: IEducation[];
  certifications: ICertification[];
  projects: IProject[];

  // Required by the schema since the Talent Profile Schema §3.7 update.
  availability: IAvailability;
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

const CURRENT_YEAR = new Date().getFullYear();

function requiresStructuredProfile(applicant: Pick<IApplicant, 'ingestStatus'> | null | undefined) {
  return applicant?.ingestStatus === 'parsed';
}

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    level: {
      type: String,
      trim: true,
      enum: { values: [...SKILL_LEVELS, ''], message: 'Skill level must be one of Beginner, Intermediate, Advanced, Expert.' },
    },
    yearsOfExperience: { type: Number, min: 0, max: 80 },
  },
  { _id: false }
);

const LanguageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    proficiency: {
      type: String,
      trim: true,
      enum: { values: [...LANGUAGE_PROFICIENCIES, ''], message: 'Language proficiency must be one of Basic, Conversational, Fluent, Native.' },
    },
  },
  { _id: false }
);

const ExperienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    startDate: { type: String, trim: true, match: [DATE_YYYY_MM_REGEX, 'experience.startDate must be YYYY-MM.'] },
    endDate: { type: String, trim: true, match: [DATE_YYYY_MM_REGEX, 'experience.endDate must be YYYY-MM or "Present".'] },
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
    startYear: { type: Number, min: 1950, max: CURRENT_YEAR + 10 },
    endYear: { type: Number, min: 1950, max: CURRENT_YEAR + 10 },
  },
  { _id: false }
);

const CertificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, trim: true },
    issueDate: { type: String, trim: true, match: [DATE_YYYY_MM_REGEX, 'certifications.issueDate must be YYYY-MM.'] },
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
    startDate: { type: String, trim: true, match: [DATE_YYYY_MM_REGEX, 'projects.startDate must be YYYY-MM.'] },
    endDate: { type: String, trim: true, match: [DATE_YYYY_MM_REGEX, 'projects.endDate must be YYYY-MM or "Present".'] },
  },
  { _id: false }
);

const AvailabilitySchema = new Schema(
  {
    status: {
      type: String,
      required: [true, 'availability.status is required.'],
      trim: true,
      enum: { values: [...AVAILABILITY_STATUSES], message: 'availability.status must be one of Available, Open to Opportunities, Not Available.' },
    },
    type: {
      type: String,
      required: [true, 'availability.type is required.'],
      trim: true,
      enum: { values: [...AVAILABILITY_TYPES], message: 'availability.type must be one of Full-time, Part-time, Contract.' },
    },
    startDate: { type: String, trim: true, match: [DATE_YYYY_MM_DD_REGEX, 'availability.startDate must be YYYY-MM-DD.'] },
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
    headline: {
      type: String,
      trim: true,
      required: [function (this: IApplicant) {
        return requiresStructuredProfile(this);
      }, 'headline is required per Talent Profile Schema §3.1.'],
    },
    bio: { type: String, trim: true },
    location: {
      type: String,
      trim: true,
      required: [function (this: IApplicant) {
        return requiresStructuredProfile(this);
      }, 'location is required per Talent Profile Schema §3.1.'],
    },

    skills: {
      type: [SkillSchema],
      default: [],
      validate: {
        validator: function (this: IApplicant, arr: unknown) {
          return !requiresStructuredProfile(this) || (Array.isArray(arr) && arr.length > 0);
        },
        message: 'At least one skill is required per Talent Profile Schema §3.2.',
      },
    },
    languages: { type: [LanguageSchema], default: [] },
    experience: {
      type: [ExperienceSchema],
      default: [],
      validate: {
        validator: function (this: IApplicant, arr: unknown) {
          return !requiresStructuredProfile(this) || (Array.isArray(arr) && arr.length > 0);
        },
        message: 'At least one experience entry is required per Talent Profile Schema §3.3.',
      },
    },
    education: {
      type: [EducationSchema],
      default: [],
      validate: {
        validator: function (this: IApplicant, arr: unknown) {
          return !requiresStructuredProfile(this) || (Array.isArray(arr) && arr.length > 0);
        },
        message: 'At least one education entry is required per Talent Profile Schema §3.4.',
      },
    },
    certifications: { type: [CertificationSchema], default: [] },
    projects: {
      type: [ProjectSchema],
      default: [],
      validate: {
        validator: function (this: IApplicant, arr: unknown) {
          return !requiresStructuredProfile(this) || (Array.isArray(arr) && arr.length > 0);
        },
        message: 'At least one project is required per Talent Profile Schema §3.6.',
      },
    },

    availability: {
      type: AvailabilitySchema,
      required: [function (this: IApplicant) {
        return requiresStructuredProfile(this);
      }, 'availability is required per Talent Profile Schema §3.7.'],
    },
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
