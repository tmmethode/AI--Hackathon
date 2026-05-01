import {
  Body,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import mongoose from 'mongoose';
import Shortlist, {
  IShortlist,
  IShortlistEntry,
  IShortlistResultEntry,
  IShortlistWeightCriterion,
  PipelineStatus,
  ShortlistRecommendation,
} from '../models/Shortlist';
import Job from '../models/Job';
import ScreeningResult from '../models/ScreeningResult';
import { IUser } from '../models/User';
import { HttpError } from '../utils/HttpError';

export interface ShortlistResultEntryDTO {
  candidateRank: number;
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  criterionAssessments?: ShortlistCriterionAssessmentDTO[];
  criticalRequirementGap: boolean;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: ShortlistRecommendation;
  summaryExplanation: string;
}

export interface ShortlistEntryDTO {
  candidateRank: number;
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  criterionAssessments?: ShortlistCriterionAssessmentDTO[];
  criticalRequirementGap: boolean;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: ShortlistRecommendation;
  summaryExplanation: string;
  pipelineStatus?: PipelineStatus;
}

export interface ShortlistWeightCriterionDTO {
  id: string;
  label: string;
  value: number;
}

export interface ShortlistCriterionAssessmentDTO {
  label: string;
  weightPct: number;
  score: number;
  weightedScore: number;
  summary?: string;
  evidence?: string[];
}

export interface ShortlistDTO {
  _id: string;
  job: string;
  jobTitle: string;
  runName: string;
  model: string;
  totalApplicants: number;
  shortlistCount: number;
  weightCriteria: ShortlistWeightCriterionDTO[];
  screeningResults: ShortlistResultEntryDTO[];
  shortlist: ShortlistEntryDTO[];
  instructions?: string;
  screeningStartedAt?: string;
  screeningCompletedAt?: string;
  screeningDurationSeconds?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShortlistSummaryDTO {
  _id: string;
  job: string;
  jobTitle: string;
  runName: string;
  model: string;
  totalApplicants: number;
  shortlistCount: number;
  topMatchScore: number;
  topCandidateName: string;
  screeningStartedAt?: string;
  screeningCompletedAt?: string;
  screeningDurationSeconds?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShortlistRequest {
  jobId: string;
  runName?: string;
  jobTitle: string;
  model?: string;
  totalApplicants: number;
  shortlistCount: number;
  weightCriteria?: ShortlistWeightCriterionDTO[];
  screeningResults: ShortlistResultEntryDTO[];
  shortlist: ShortlistEntryDTO[];
  instructions?: string;
  screeningStartedAt?: string;
  screeningCompletedAt?: string;
  screeningDurationSeconds?: number;
}

export interface ShortlistResponse {
  data: ShortlistDTO;
  message: string;
}

export interface ShortlistListResponse {
  data: ShortlistSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message: string;
}

export interface ShortlistSelectItemDTO {
  _id: string;
  runName: string;
  job: string;
  jobTitle: string;
  createdAt: string;
}

export interface ShortlistSelectResponse {
  data: ShortlistSelectItemDTO[];
  message: string;
}

export interface DeleteShortlistResponse {
  id: string;
  message: string;
}

export interface UpdateShortlistCandidateStatusRequest {
  status: 'shortlisted' | 'rejected' | 'interview' | 'exam' | 'assessment' | 'practical';
}

@Tags('Shortlists')
@Route('shortlists')
export class ShortlistController {
  private normalizeEmail(email?: string): string {
    return (email || '').trim().toLowerCase();
  }

  private extractRunSequence(runName?: string): number {
    const match = (runName || '').trim().match(/^RUN-(\d+)$/i);
    return match ? Number(match[1]) || 0 : 0;
  }

  private async buildUniqueRunName(): Promise<string> {
    const existingRuns = await Shortlist.find({}).select('runName').lean<{ runName: string }[]>();
    let maxSequence = 0;

    for (const run of existingRuns) {
      maxSequence = Math.max(maxSequence, this.extractRunSequence(run.runName));
    }

    const nextSequence = maxSequence + 1;
    return `RUN-${String(nextSequence).padStart(3, '0')}`;
  }

  private toHttpError(error: unknown): HttpError {
    if (error instanceof HttpError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unexpected shortlist error';
    const normalized = message.toLowerCase();

    if (normalized.includes('not authenticated')) {
      return new HttpError(401, message);
    }

    if (normalized.includes('not found')) {
      return new HttpError(404, message);
    }

    if (normalized.includes('invalid')) {
      return new HttpError(400, message);
    }

    return new HttpError(500, message);
  }

  private toResultEntryDTO(entry: IShortlistResultEntry): ShortlistResultEntryDTO {
    return {
      candidateRank: entry.candidateRank,
      applicantEmail: entry.applicantEmail,
      fullName: entry.fullName || '',
      matchScore: entry.matchScore,
      confidenceScore: entry.confidenceScore,
      skillsScore: entry.skillsScore,
      experienceScore: entry.experienceScore,
      educationScore: entry.educationScore,
      relevanceScore: entry.relevanceScore,
      criterionAssessments: entry.criterionAssessments || [],
      criticalRequirementGap: entry.criticalRequirementGap ?? false,
      strengths: entry.strengths || [],
      gapsOrRisks: entry.gapsOrRisks || [],
      finalRecommendation: entry.finalRecommendation,
      summaryExplanation: entry.summaryExplanation || '',
    };
  }

  private toShortlistEntryDTO(entry: IShortlistEntry): ShortlistEntryDTO {
    return {
      candidateRank: entry.candidateRank,
      applicantEmail: entry.applicantEmail,
      fullName: entry.fullName || '',
      matchScore: entry.matchScore,
      confidenceScore: entry.confidenceScore,
      skillsScore: entry.skillsScore,
      experienceScore: entry.experienceScore,
      educationScore: entry.educationScore,
      relevanceScore: entry.relevanceScore,
      criterionAssessments: entry.criterionAssessments || [],
      criticalRequirementGap: entry.criticalRequirementGap ?? false,
      strengths: entry.strengths || [],
      gapsOrRisks: entry.gapsOrRisks || [],
      finalRecommendation: entry.finalRecommendation,
      summaryExplanation: entry.summaryExplanation || '',
      pipelineStatus: entry.pipelineStatus || 'shortlisted',
    };
  }

  private toHydratedShortlistEntryDTO(
    entry: IShortlistEntry,
    screeningByEmail: Map<string, IShortlistResultEntry>
  ): ShortlistEntryDTO {
    const source = screeningByEmail.get(this.normalizeEmail(entry.applicantEmail));

    return {
      candidateRank: entry.candidateRank,
      applicantEmail: entry.applicantEmail,
      fullName: entry.fullName || '',
      matchScore: entry.matchScore,
      confidenceScore: entry.confidenceScore ?? source?.confidenceScore ?? 0,
      skillsScore: entry.skillsScore ?? source?.skillsScore ?? 0,
      experienceScore: entry.experienceScore ?? source?.experienceScore ?? 0,
      educationScore: entry.educationScore ?? source?.educationScore ?? 0,
      relevanceScore: entry.relevanceScore ?? source?.relevanceScore ?? 0,
      criterionAssessments: entry.criterionAssessments ?? source?.criterionAssessments ?? [],
      criticalRequirementGap: entry.criticalRequirementGap ?? source?.criticalRequirementGap ?? false,
      strengths: entry.strengths || [],
      gapsOrRisks: entry.gapsOrRisks || [],
      finalRecommendation: entry.finalRecommendation,
      summaryExplanation: entry.summaryExplanation || '',
      pipelineStatus: entry.pipelineStatus || 'shortlisted',
    };
  }

  private toWeightCriterionDTO(entry: IShortlistWeightCriterion): ShortlistWeightCriterionDTO {
    return {
      id: entry.id,
      label: entry.label,
      value: entry.value,
    };
  }

  private async toShortlistDTO(shortlist: IShortlist): Promise<ShortlistDTO> {
    const sourceScreeningResults = shortlist.screeningRun
      ? await ScreeningResult.find({ run: shortlist.screeningRun })
          .sort({ candidateRank: 1 })
          .lean<IShortlistResultEntry[]>()
      : (shortlist.screeningResults || []);
    const screeningByEmail = new Map(
      sourceScreeningResults.map((entry) => [this.normalizeEmail(entry.applicantEmail), entry])
    );

    return {
      _id: shortlist._id.toString(),
      job: shortlist.job.toString(),
      jobTitle: shortlist.jobTitle,
      runName: shortlist.runName,
      model: shortlist.geminiModel || '',
      totalApplicants: shortlist.totalApplicants,
      shortlistCount: shortlist.shortlistCount,
      weightCriteria: (shortlist.weightCriteria || []).map((entry) =>
        this.toWeightCriterionDTO(entry)
      ),
      screeningResults: sourceScreeningResults.map((entry) =>
        this.toResultEntryDTO(entry)
      ),
      shortlist: (shortlist.shortlist || []).map((entry) =>
        this.toHydratedShortlistEntryDTO(entry, screeningByEmail)
      ),
      instructions: shortlist.instructions || '',
      screeningStartedAt: shortlist.screeningStartedAt?.toISOString(),
      screeningCompletedAt: shortlist.screeningCompletedAt?.toISOString(),
      screeningDurationSeconds: shortlist.screeningDurationSeconds,
      createdBy: shortlist.createdBy.toString(),
      createdAt: shortlist.createdAt.toISOString(),
      updatedAt: shortlist.updatedAt.toISOString(),
    };
  }

  private toShortlistSummaryDTO(shortlist: IShortlist): ShortlistSummaryDTO {
    const top = (shortlist.shortlist || []).find((entry) => entry.candidateRank === 1) ||
      (shortlist.shortlist || [])[0];

    return {
      _id: shortlist._id.toString(),
      job: shortlist.job.toString(),
      jobTitle: shortlist.jobTitle,
      runName: shortlist.runName,
      model: shortlist.geminiModel || '',
      totalApplicants: shortlist.totalApplicants,
      shortlistCount: shortlist.shortlistCount,
      topMatchScore: top?.matchScore ?? 0,
      topCandidateName: top?.fullName || '',
      screeningStartedAt: shortlist.screeningStartedAt?.toISOString(),
      screeningCompletedAt: shortlist.screeningCompletedAt?.toISOString(),
      screeningDurationSeconds: shortlist.screeningDurationSeconds,
      createdBy: shortlist.createdBy.toString(),
      createdAt: shortlist.createdAt.toISOString(),
      updatedAt: shortlist.updatedAt.toISOString(),
    };
  }

  /**
   * List shortlists with pagination, optionally filtered by job.
   */
  @Get('/')
  @Security('jwt')
  public async listShortlists(
    @Query() jobId?: string,
    @Query() page: number = 1,
    @Query() pageSize: number = 20
  ): Promise<ShortlistListResponse> {
    try {
      const safePage = Math.max(1, Number(page) || 1);
      const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 20));

      const filter: Record<string, any> = {};

      if (jobId) {
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
          throw new Error('Invalid jobId');
        }
        filter.job = new mongoose.Types.ObjectId(jobId);
      }

      const total = await Shortlist.countDocuments(filter);
      const shortlists = await Shortlist.find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeSize)
        .limit(safeSize);

      return {
        data: shortlists.map((s) => this.toShortlistSummaryDTO(s)),
        total,
        page: safePage,
        pageSize: safeSize,
        totalPages: Math.max(1, Math.ceil(total / safeSize)),
        message: 'Shortlists retrieved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  /**
   * Lightweight shortlist rows for selectors.
   */
  @Get('select')
  @Security('jwt')
  public async listShortlistSelect(
    @Query() jobId?: string,
    @Query() limit: number = 100
  ): Promise<ShortlistSelectResponse> {
    try {
      const safeLimit = Math.min(300, Math.max(1, Number(limit) || 100));
      const filter: Record<string, any> = {};

      if (jobId) {
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
          throw new Error('Invalid jobId');
        }
        filter.job = new mongoose.Types.ObjectId(jobId);
      }

      const rows = await Shortlist.find(filter)
        .sort({ createdAt: -1 })
        .select('_id runName job jobTitle createdAt')
        .limit(safeLimit)
        .lean<Array<{
          _id: mongoose.Types.ObjectId;
          runName: string;
          job: mongoose.Types.ObjectId;
          jobTitle: string;
          createdAt: Date;
        }>>();

      return {
        data: rows.map((row) => ({
          _id: row._id.toString(),
          runName: row.runName,
          job: row.job.toString(),
          jobTitle: row.jobTitle,
          createdAt: row.createdAt.toISOString(),
        })),
        message: 'Shortlist selector data retrieved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  /**
   * Get a single shortlist by ID (includes full screening results).
   */
  @Get('{id}')
  @Security('jwt')
  public async getShortlist(@Path() id: string): Promise<ShortlistResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid shortlist id');
      }

      const shortlist = await Shortlist.findById(id);

      if (!shortlist) {
        throw new Error('Shortlist not found');
      }

      return {
        data: await this.toShortlistDTO(shortlist),
        message: 'Shortlist retrieved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  /**
   * Persist a screening run result as a shortlist record.
   */
  @Post('/')
  @Security('jwt')
  @SuccessResponse('201', 'Created')
  public async createShortlist(
    @Request() req: any,
    @Body() body: CreateShortlistRequest
  ): Promise<ShortlistResponse> {
    try {
      const actingUser: IUser | undefined = req.user;

      if (!actingUser || !actingUser._id) {
        throw new Error('User not authenticated');
      }

      if (!mongoose.Types.ObjectId.isValid(body.jobId)) {
        throw new Error('Invalid jobId');
      }

      const job = await Job.findById(body.jobId);

      if (!job) {
        throw new Error('Job not found');
      }

      const screeningStartedAt = body.screeningStartedAt
        ? new Date(body.screeningStartedAt)
        : undefined;
      const screeningCompletedAt = body.screeningCompletedAt
        ? new Date(body.screeningCompletedAt)
        : undefined;

      if (screeningStartedAt && Number.isNaN(screeningStartedAt.getTime())) {
        throw new Error('Invalid screeningStartedAt');
      }

      if (screeningCompletedAt && Number.isNaN(screeningCompletedAt.getTime())) {
        throw new Error('Invalid screeningCompletedAt');
      }

      let screeningDurationSeconds =
        typeof body.screeningDurationSeconds === 'number' &&
        Number.isFinite(body.screeningDurationSeconds) &&
        body.screeningDurationSeconds >= 0
          ? Math.round(body.screeningDurationSeconds)
          : undefined;

      if (
        screeningDurationSeconds === undefined &&
        screeningStartedAt &&
        screeningCompletedAt &&
        screeningCompletedAt >= screeningStartedAt
      ) {
        screeningDurationSeconds = Math.round(
          (screeningCompletedAt.getTime() - screeningStartedAt.getTime()) / 1000
        );
      }

      const screeningResults = Array.isArray(body.screeningResults) ? body.screeningResults : [];
      const shortlistEntries = Array.isArray(body.shortlist) ? body.shortlist : [];
      const weightCriteria = Array.isArray(body.weightCriteria) && body.weightCriteria.length > 0
        ? body.weightCriteria
        : (job.weightCriteria || []).map((criterion) => ({
            id: criterion.id,
            label: criterion.label,
            value: criterion.value,
          }));
      const runName = await this.buildUniqueRunName();

      const shortlist = new Shortlist({
        job: job._id,
        jobTitle: body.jobTitle || job.title,
        runName,
        geminiModel: body.model || '',
        totalApplicants: body.totalApplicants,
        shortlistCount: shortlistEntries.length,
        weightCriteria,
        screeningResults,
        shortlist: shortlistEntries,
        instructions: body.instructions || '',
        screeningStartedAt,
        screeningCompletedAt,
        screeningDurationSeconds,
        createdBy: actingUser._id,
      });

      await shortlist.save();

      return {
        data: await this.toShortlistDTO(shortlist),
        message: 'Shortlist saved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  /**
   * Delete a shortlist permanently.
   */
  /**
   * Mark a candidate as shortlisted or rejected on an existing shortlist.
   */
  @Patch('{id}/candidates/{email}')
  @Security('jwt')
  public async updateShortlistCandidateStatus(
    @Path() id: string,
    @Path() email: string,
    @Body() body: UpdateShortlistCandidateStatusRequest
  ): Promise<ShortlistResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid shortlist id');
      }

      const normalizedStatus = body?.status;
      const allowedStatuses: Array<typeof normalizedStatus> = [
        'shortlisted',
        'rejected',
        'interview',
        'exam',
        'assessment',
        'practical',
      ];
      if (!allowedStatuses.includes(normalizedStatus)) {
        throw new Error(
          'Invalid status; expected one of: shortlisted, rejected, interview, exam, assessment, practical.'
        );
      }

      const normalizedEmail = this.normalizeEmail(decodeURIComponent(email));
      if (!normalizedEmail) {
        throw new Error('Applicant email is required.');
      }

      const shortlist = await Shortlist.findById(id);
      if (!shortlist) {
        throw new Error('Shortlist not found');
      }

      const screeningEntry = shortlist.screeningResults.find(
        (entry) => this.normalizeEmail(entry.applicantEmail) === normalizedEmail
      );

      if (!screeningEntry) {
        throw new Error('Candidate is not part of this screening run.');
      }

      const existingIndex = shortlist.shortlist.findIndex(
        (entry) => this.normalizeEmail(entry.applicantEmail) === normalizedEmail
      );

      if (normalizedStatus === 'rejected') {
        if (existingIndex !== -1) {
          shortlist.shortlist = shortlist.shortlist.filter(
            (entry) => this.normalizeEmail(entry.applicantEmail) !== normalizedEmail
          ) as typeof shortlist.shortlist;
        }
      } else {
        const pipelineStatus = normalizedStatus as PipelineStatus;
        if (existingIndex === -1) {
          shortlist.shortlist.push({
            candidateRank: screeningEntry.candidateRank,
            applicantEmail: screeningEntry.applicantEmail,
            fullName: screeningEntry.fullName,
            matchScore: screeningEntry.matchScore,
            confidenceScore: screeningEntry.confidenceScore,
            skillsScore: screeningEntry.skillsScore,
            experienceScore: screeningEntry.experienceScore,
            educationScore: screeningEntry.educationScore,
            relevanceScore: screeningEntry.relevanceScore,
            criterionAssessments: screeningEntry.criterionAssessments,
            criticalRequirementGap: screeningEntry.criticalRequirementGap,
            strengths: screeningEntry.strengths,
            gapsOrRisks: screeningEntry.gapsOrRisks,
            finalRecommendation: screeningEntry.finalRecommendation,
            summaryExplanation: screeningEntry.summaryExplanation,
            pipelineStatus,
          } as IShortlistEntry);
        } else {
          shortlist.shortlist[existingIndex].pipelineStatus = pipelineStatus;
          shortlist.markModified('shortlist');
        }
      }

      shortlist.shortlistCount = shortlist.shortlist.length;
      await shortlist.save();

      return {
        data: await this.toShortlistDTO(shortlist),
        message: 'Candidate status updated successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Delete('{id}')
  @Security('jwt', ['recruiter', 'admin'])
  public async deleteShortlist(@Path() id: string): Promise<DeleteShortlistResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid shortlist id');
      }

      const shortlist = await Shortlist.findByIdAndDelete(id);

      if (!shortlist) {
        throw new Error('Shortlist not found');
      }

      return {
        id,
        message: 'Shortlist deleted successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }
}
