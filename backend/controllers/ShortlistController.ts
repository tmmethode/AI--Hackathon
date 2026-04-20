import {
  Body,
  Delete,
  Get,
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
  ShortlistRecommendation,
} from '../models/Shortlist';
import Job from '../models/Job';
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
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: ShortlistRecommendation;
  summaryExplanation: string;
}

export interface ShortlistDTO {
  _id: string;
  job: string;
  jobTitle: string;
  department: string;
  runName: string;
  model: string;
  totalApplicants: number;
  shortlistCount: number;
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
  department: string;
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
  department?: string;
  model?: string;
  totalApplicants: number;
  shortlistCount: number;
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

export interface DeleteShortlistResponse {
  id: string;
  message: string;
}

@Tags('Shortlists')
@Route('shortlists')
export class ShortlistController {
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
      strengths: entry.strengths || [],
      gapsOrRisks: entry.gapsOrRisks || [],
      finalRecommendation: entry.finalRecommendation,
      summaryExplanation: entry.summaryExplanation || '',
    };
  }

  private toShortlistDTO(shortlist: IShortlist): ShortlistDTO {
    return {
      _id: shortlist._id.toString(),
      job: shortlist.job.toString(),
      jobTitle: shortlist.jobTitle,
      department: shortlist.department || '',
      runName: shortlist.runName,
      model: shortlist.geminiModel || '',
      totalApplicants: shortlist.totalApplicants,
      shortlistCount: shortlist.shortlistCount,
      screeningResults: (shortlist.screeningResults || []).map((entry) =>
        this.toResultEntryDTO(entry)
      ),
      shortlist: (shortlist.shortlist || []).map((entry) => this.toShortlistEntryDTO(entry)),
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
      department: shortlist.department || '',
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
        data: this.toShortlistDTO(shortlist),
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

      const shortlist = new Shortlist({
        job: job._id,
        jobTitle: body.jobTitle || job.title,
        department: body.department ?? job.department ?? '',
        runName: body.runName || `${job.title} Screening Run`,
        geminiModel: body.model || '',
        totalApplicants: body.totalApplicants,
        shortlistCount: shortlistEntries.length,
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
        data: this.toShortlistDTO(shortlist),
        message: 'Shortlist saved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  /**
   * Delete a shortlist permanently.
   */
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
