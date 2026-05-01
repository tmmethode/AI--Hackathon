import mongoose, { Document, Schema } from "mongoose";

export type ScreeningRunStatus = "queued" | "running" | "completed" | "partial" | "failed";

export interface IScreeningRunFilters {
  ingestStatus?: "parsed" | "pending" | "failed";
}

export interface IScreeningRun extends Document {
  _id: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  jobTitle: string;
  runName: string;
  status: ScreeningRunStatus;
  shortlistCount: number;
  requestedApplicants: number;
  processedApplicants: number;
  scoredApplicants: number;
  failedApplicants: number;
  processedChunks: number;
  failedChunks: number;
  chunkSize: number;
  instructions?: string;
  temperature?: number;
  applicantIds?: string[];
  applicantEmails?: string[];
  filters?: IScreeningRunFilters;
  geminiModel?: string;
  failureReasons: string[];
  error?: string;
  shortlistDocument?: mongoose.Types.ObjectId;
  screeningStartedAt?: Date;
  screeningCompletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningRunFiltersSchema = new Schema(
  {
    ingestStatus: {
      type: String,
      enum: ["parsed", "pending", "failed"],
    },
  },
  { _id: false }
);

const ScreeningRunSchema: Schema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    jobTitle: { type: String, required: true, trim: true },
    runName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "partial", "failed"],
      required: true,
      default: "queued",
      index: true,
    },
    shortlistCount: { type: Number, required: true, min: 1 },
    requestedApplicants: { type: Number, required: true, min: 0 },
    processedApplicants: { type: Number, default: 0, min: 0 },
    scoredApplicants: { type: Number, default: 0, min: 0 },
    failedApplicants: { type: Number, default: 0, min: 0 },
    processedChunks: { type: Number, default: 0, min: 0 },
    failedChunks: { type: Number, default: 0, min: 0 },
    chunkSize: { type: Number, required: true, min: 1 },
    instructions: { type: String, default: "" },
    temperature: { type: Number },
    applicantIds: { type: [String], default: [] },
    applicantEmails: { type: [String], default: [] },
    filters: { type: ScreeningRunFiltersSchema, default: undefined },
    geminiModel: { type: String, default: "" },
    failureReasons: { type: [String], default: [] },
    error: { type: String, trim: true },
    shortlistDocument: { type: Schema.Types.ObjectId, ref: "Shortlist" },
    screeningStartedAt: { type: Date },
    screeningCompletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
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

ScreeningRunSchema.index({ createdBy: 1, createdAt: -1 });
ScreeningRunSchema.index({ status: 1, createdAt: -1 });

const ScreeningRun = mongoose.model<IScreeningRun>("ScreeningRun", ScreeningRunSchema);

export default ScreeningRun;
