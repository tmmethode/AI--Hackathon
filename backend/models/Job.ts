import mongoose, { Document, Schema } from 'mongoose';

export type JobStatus = 'Active' | 'Draft' | 'Closed';
export type LocationPolicy = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'principal';
export type EducationLevel =
  | 'none'
  | 'hs'
  | 'associate'
  | 'bs'
  | 'ms'
  | 'mba'
  | 'phd'
  | 'professional';

export interface IWeightCriterion {
  id: string;
  label: string;
  value: number;
}

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  hiringManager: mongoose.Types.ObjectId;
  location: string;
  locationPolicy: LocationPolicy;
  employmentType: EmploymentType;
  salaryBand?: string;

  description: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications?: string;

  coreHardSkills: string[];
  preferredSkills: string[];
  coreSoftSkills: string[];

  experienceYears: number;
  seniorityLevel: SeniorityLevel;
  educationLevel: EducationLevel;

  weightCriteria: IWeightCriterion[];

  status: JobStatus;
  applicantsCount: number;

  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WeightCriterionSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const JobSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    hiringManager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: { type: String, required: true, trim: true },
    locationPolicy: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      default: 'remote',
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'],
      default: 'full-time',
      required: true,
    },
    salaryBand: { type: String, trim: true },

    description: { type: String, required: true, trim: true },
    responsibilities: { type: String, required: true, trim: true },
    mustHaveQualifications: { type: String, required: true, trim: true },
    niceToHaveQualifications: { type: String, trim: true },

    coreHardSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    coreSoftSkills: { type: [String], default: [] },

    experienceYears: { type: Number, default: 0, min: 0 },
    seniorityLevel: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead', 'manager', 'principal'],
      default: 'mid',
      required: true,
    },
    educationLevel: {
      type: String,
      enum: ['none', 'hs', 'associate', 'bs', 'ms', 'mba', 'phd', 'professional'],
      default: 'bs',
      required: true,
    },

    weightCriteria: {
      type: [WeightCriterionSchema],
      validate: {
        validator: function (value: IWeightCriterion[]) {
          if (!value || value.length === 0) return true;
          const total = value.reduce((sum, c) => sum + (c.value || 0), 0);
          return total === 100;
        },
        message: 'Weight criteria must sum to exactly 100%',
      },
      default: [],
    },

    status: {
      type: String,
      enum: ['Active', 'Draft', 'Closed'],
      default: 'Draft',
      required: true,
    },
    applicantsCount: { type: Number, default: 0, min: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ status: 1 });
JobSchema.index({ createdBy: 1 });
JobSchema.index({ hiringManager: 1 });

const Job = mongoose.model<IJob>('Job', JobSchema);

export default Job;
