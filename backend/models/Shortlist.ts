import mongoose, { Document, Schema } from 'mongoose';

export type ShortlistRecommendation =
  | 'Strong Reject'
  | 'Reject'
  | 'Consider'
  | 'Shortlist'
  | 'Strong Shortlist';

export interface IShortlistResultEntry {
  candidateRank: number;
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  criticalRequirementGap: boolean;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: ShortlistRecommendation;
  summaryExplanation: string;
}

export interface IShortlistEntry {
  candidateRank: number;
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  criticalRequirementGap: boolean;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: ShortlistRecommendation;
  summaryExplanation: string;
}

export interface IShortlist extends Document {
  _id: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  jobTitle: string;
  department: string;
  runName: string;
  geminiModel: string;
  totalApplicants: number;
  shortlistCount: number;
  screeningResults: IShortlistResultEntry[];
  shortlist: IShortlistEntry[];
  instructions?: string;
  screeningStartedAt?: Date;
  screeningCompletedAt?: Date;
  screeningDurationSeconds?: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RECOMMENDATION_VALUES: ShortlistRecommendation[] = [
  'Strong Reject',
  'Reject',
  'Consider',
  'Shortlist',
  'Strong Shortlist',
];

const ShortlistResultEntrySchema: Schema = new Schema(
  {
    candidateRank: { type: Number, required: true, min: 1 },
    applicantEmail: { type: String, required: true, trim: true, lowercase: true },
    fullName: { type: String, default: '' },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    skillsScore: { type: Number, default: 0, min: 0, max: 100 },
    experienceScore: { type: Number, default: 0, min: 0, max: 100 },
    educationScore: { type: Number, default: 0, min: 0, max: 100 },
    relevanceScore: { type: Number, default: 0, min: 0, max: 100 },
    criticalRequirementGap: { type: Boolean, default: false },
    strengths: { type: [String], default: [] },
    gapsOrRisks: { type: [String], default: [] },
    finalRecommendation: {
      type: String,
      enum: RECOMMENDATION_VALUES,
      default: 'Consider',
      required: true,
    },
    summaryExplanation: { type: String, default: '' },
  },
  { _id: false }
);

const ShortlistEntrySchema: Schema = new Schema(
  {
    candidateRank: { type: Number, required: true, min: 1 },
    applicantEmail: { type: String, required: true, trim: true, lowercase: true },
    fullName: { type: String, default: '' },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    skillsScore: { type: Number, default: 0, min: 0, max: 100 },
    experienceScore: { type: Number, default: 0, min: 0, max: 100 },
    educationScore: { type: Number, default: 0, min: 0, max: 100 },
    relevanceScore: { type: Number, default: 0, min: 0, max: 100 },
    criticalRequirementGap: { type: Boolean, default: false },
    strengths: { type: [String], default: [] },
    gapsOrRisks: { type: [String], default: [] },
    finalRecommendation: {
      type: String,
      enum: RECOMMENDATION_VALUES,
      default: 'Consider',
      required: true,
    },
    summaryExplanation: { type: String, default: '' },
  },
  { _id: false }
);

const ShortlistSchema: Schema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    jobTitle: { type: String, required: true, trim: true },
    department: { type: String, default: '', trim: true },
    runName: { type: String, required: true, trim: true },
    geminiModel: { type: String, default: '' },
    totalApplicants: { type: Number, required: true, min: 0 },
    shortlistCount: { type: Number, required: true, min: 0 },
    screeningResults: { type: [ShortlistResultEntrySchema], default: [] },
    shortlist: { type: [ShortlistEntrySchema], default: [] },
    instructions: { type: String, default: '' },
    screeningStartedAt: { type: Date },
    screeningCompletedAt: { type: Date },
    screeningDurationSeconds: { type: Number, min: 0 },
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

ShortlistSchema.index({ job: 1, createdAt: -1 });
ShortlistSchema.index({ createdBy: 1, createdAt: -1 });

const Shortlist = mongoose.model<IShortlist>('Shortlist', ShortlistSchema);

export default Shortlist;
