import { Get, Query, Route, Security, Tags } from 'tsoa';
import Shortlist from '../models/Shortlist';
import { HttpError } from '../utils/HttpError';

export interface HistoryStageCountsDTO {
  shortlisted: number;
  interview: number;
  exam: number;
  assessment: number;
  practical: number;
  rejected: number;
  active: number;
}

export interface HistoryRunSummaryDTO {
  _id: string;
  runName: string;
  jobTitle: string;
  totalApplicants: number;
  shortlistCount: number;
  topMatchScore: number;
  topCandidateName: string;
  screeningCompletedAt?: string;
  screeningDurationSeconds?: number;
  createdAt: string;
  stageCounts: HistoryStageCountsDTO;
  averageMatchScore: number;
}

export interface HistorySummaryDTO {
  runs: HistoryRunSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HistorySummaryResponse {
  data: HistorySummaryDTO;
  message: string;
}

@Tags('History')
@Route('history')
export class HistoryController {
  private toHttpError(error: unknown): HttpError {
    if (error instanceof HttpError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unexpected history error';
    return new HttpError(500, message);
  }

  @Get('summary')
  @Security('jwt')
  public async getSummary(
    @Query() page: number = 1,
    @Query() pageSize: number = 20
  ): Promise<HistorySummaryResponse> {
    try {
      const safePage = Math.max(1, Number(page) || 1);
      const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 20));

      const total = await Shortlist.countDocuments({});

      const rows = await Shortlist.find({})
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeSize)
        .limit(safeSize)
        .select('_id runName jobTitle totalApplicants shortlistCount shortlist screeningCompletedAt screeningDurationSeconds createdAt')
        .lean<Array<{
          _id: any;
          runName: string;
          jobTitle: string;
          totalApplicants: number;
          shortlistCount: number;
          shortlist: Array<{ matchScore?: number; fullName?: string; candidateRank?: number; pipelineStatus?: string }>;
          screeningCompletedAt?: Date;
          screeningDurationSeconds?: number;
          createdAt: Date;
        }>>();

      return {
        data: {
          runs: rows.map((row) => {
            const top = (row.shortlist || []).find((entry) => entry.candidateRank === 1) || row.shortlist?.[0];
            const entries = row.shortlist || [];
            const stageCounts: HistoryStageCountsDTO = {
              shortlisted: 0,
              interview: 0,
              exam: 0,
              assessment: 0,
              practical: 0,
              rejected: Math.max(0, (row.totalApplicants || 0) - entries.length),
              active: entries.length,
            };
            let matchSum = 0;
            let matchCount = 0;
            for (const entry of entries) {
              const stage = (entry.pipelineStatus || 'shortlisted') as keyof Omit<HistoryStageCountsDTO, 'rejected' | 'active'>;
              if (stage in stageCounts) {
                stageCounts[stage] = (stageCounts[stage] || 0) + 1;
              } else {
                stageCounts.shortlisted += 1;
              }
              if (typeof entry.matchScore === 'number') {
                matchSum += entry.matchScore;
                matchCount += 1;
              }
            }

            return {
              _id: String(row._id),
              runName: row.runName,
              jobTitle: row.jobTitle,
              totalApplicants: row.totalApplicants,
              shortlistCount: row.shortlistCount,
              topMatchScore: typeof top?.matchScore === 'number' ? top.matchScore : 0,
              topCandidateName: top?.fullName || '',
              screeningCompletedAt: row.screeningCompletedAt?.toISOString(),
              screeningDurationSeconds: row.screeningDurationSeconds,
              createdAt: row.createdAt.toISOString(),
              stageCounts,
              averageMatchScore: matchCount > 0 ? Math.round(matchSum / matchCount) : 0,
            };
          }),
          total,
          page: safePage,
          pageSize: safeSize,
          totalPages: Math.max(1, Math.ceil(total / safeSize)),
        },
        message: 'History summary retrieved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }
}
