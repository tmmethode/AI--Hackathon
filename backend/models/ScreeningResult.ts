import mongoose, { Document, Schema } from "mongoose";

export type ScreeningResultRecommendation =
  | "Strong Reject"
  | "Reject"
  | "Consider"
  | "Shortlist"
  | "Strong Shortlist";

export interface IScreeningResultCriterionAssessment {
  label: string;
  weightPct: number;
  score: number;
  weightedScore: number;
  summary?: string;
  evidence: string[];
}

export interface IScreeningResult extends Document {
  _id: mongoose.Types.ObjectId;
  run: mongoose.Types.ObjectId;
  applicantEmail: string;
  fullName: string;
  candidateRank?: number;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  criterionAssessments: IScreeningResultCriterionAssessment[];
  criticalRequirementGap: boolean;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: ScreeningResultRecommendation;
  summaryExplanation: string;
  createdAt: Date;
  updatedAt: Date;
}

const RECOMMENDATION_VALUES: ScreeningResultRecommendation[] = [
  "Strong Reject",
  "Reject",
  "Consider",
  "Shortlist",
  "Strong Shortlist",
];

const CriterionAssessmentSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    weightPct: { type: Number, required: true, min: 0, max: 100 },
    score: { type: Number, required: true, min: 0, max: 100 },
    weightedScore: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, default: "" },
    evidence: { type: [String], default: [] },
  },
  { _id: false }
);

const ScreeningResultSchema: Schema = new Schema(
  {
    run: { type: Schema.Types.ObjectId, ref: "ScreeningRun", required: true, index: true },
    applicantEmail: { type: String, required: true, trim: true, lowercase: true },
    fullName: { type: String, default: "" },
    candidateRank: { type: Number, min: 1, index: true },
    matchScore: { type: Number, required: true, min: 0, max: 100, index: true },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    skillsScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    experienceScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    educationScore: { type: Number, default: 0, min: 0, max: 100 },
    relevanceScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    criterionAssessments: { type: [CriterionAssessmentSchema], default: [] },
    criticalRequirementGap: { type: Boolean, default: false },
    strengths: { type: [String], default: [] },
    gapsOrRisks: { type: [String], default: [] },
    finalRecommendation: {
      type: String,
      enum: RECOMMENDATION_VALUES,
      required: true,
      default: "Consider",
    },
    summaryExplanation: { type: String, default: "" },
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

ScreeningResultSchema.index({ run: 1, applicantEmail: 1 }, { unique: true });
ScreeningResultSchema.index({
  run: 1,
  matchScore: -1,
  skillsScore: -1,
  experienceScore: -1,
  relevanceScore: -1,
  confidenceScore: -1,
});

const ScreeningResult = mongoose.model<IScreeningResult>("ScreeningResult", ScreeningResultSchema);

export default ScreeningResult;
