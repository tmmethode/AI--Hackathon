import { Get, Request, Route, Security, Tags } from 'tsoa';
import Applicant from '../models/Applicant';
import Job from '../models/Job';
import Shortlist from '../models/Shortlist';
import { HttpError } from '../utils/HttpError';

export interface DashboardRecentRunDTO {
  id: string;
  title: string;
  createdAt: string;
  applicants: number;
  topMatch: number | null;
}

export interface DashboardSpotlightItemDTO {
  jobId: string;
  title: string;
  recentApplicants: number;
  applicantsCount: number;
}

export interface DashboardBestRunDTO {
  jobTitle: string;
  topCandidateName: string;
  topMatchScore: number;
}

export interface DashboardSummaryDTO {
  userFirstName?: string;
  activeJobs: number;
  draftJobs: number;
  totalApplicants: number;
  applicantsIn30Days: number;
  totalShortlists: number;
  shortlistsIn30Days: number;
  averageScreeningRuntimeHours: number;
  timedRunsCount: number;
  weeklyScreeningRuns: number;
  recentRuns: DashboardRecentRunDTO[];
  spotlight: DashboardSpotlightItemDTO[];
  bestRun: DashboardBestRunDTO | null;
}

export interface DashboardSummaryResponse {
  data: DashboardSummaryDTO;
  message: string;
}

@Tags('Dashboard')
@Route('dashboard')
export class DashboardController {
  private toHttpError(error: unknown): HttpError {
    if (error instanceof HttpError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unexpected dashboard error';
    return new HttpError(500, message);
  }

  @Get('summary')
  @Security('jwt')
  public async getSummary(@Request() req: any): Promise<DashboardSummaryResponse> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [jobs, recentApplicantCounts, shortlistCounts, runtimeStats, recentRuns, bestRunRows] = await Promise.all([
        Job.find({})
          .select('title status applicantsCount')
          .sort({ createdAt: -1 })
          .lean<Array<{ _id: any; title: string; status: string; applicantsCount: number }>>(),
        Applicant.aggregate<{ _id: string; count: number }>([
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: '$job',
              count: { $sum: 1 },
            },
          },
        ]),
        Shortlist.aggregate<{ _id: null; totalShortlists: number; shortlistsIn30Days: number; weeklyScreeningRuns: number }>([
          {
            $group: {
              _id: null,
              totalShortlists: { $sum: 1 },
              shortlistsIn30Days: {
                $sum: {
                  $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0],
                },
              },
              weeklyScreeningRuns: {
                $sum: {
                  $cond: [{ $gte: ['$createdAt', sevenDaysAgo] }, 1, 0],
                },
              },
            },
          },
        ]),
        Shortlist.aggregate<{ _id: null; averageScreeningDurationSeconds: number; timedRunsCount: number }>([
          {
            $match: {
              screeningDurationSeconds: { $type: 'number', $gte: 0 },
            },
          },
          {
            $group: {
              _id: null,
              averageScreeningDurationSeconds: { $avg: '$screeningDurationSeconds' },
              timedRunsCount: { $sum: 1 },
            },
          },
        ]),
        Shortlist.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .select('jobTitle totalApplicants shortlist createdAt')
          .lean<Array<{
            _id: any;
            jobTitle: string;
            totalApplicants: number;
            shortlist: Array<{ matchScore?: number }>;
            createdAt: Date;
          }>>(),
        Shortlist.aggregate<{ jobTitle: string; topCandidateName: string; topMatchScore: number }>([
          {
            $match: {
              'shortlist.0': { $exists: true },
            },
          },
          {
            $project: {
              createdAt: 1,
              jobTitle: 1,
              topCandidateName: {
                $ifNull: [{ $arrayElemAt: ['$shortlist.fullName', 0] }, ''],
              },
              topMatchScore: {
                $ifNull: [{ $arrayElemAt: ['$shortlist.matchScore', 0] }, 0],
              },
            },
          },
          {
            $sort: {
              topMatchScore: -1,
              createdAt: -1,
            },
          },
          {
            $limit: 1,
          },
        ]),
      ]);

      const applicantsIn30DaysByJob = new Map(
        recentApplicantCounts.map((entry) => [String(entry._id), entry.count])
      );

      const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicantsCount || 0), 0);
      const activeJobs = jobs.filter((job) => job.status === 'Active').length;
      const draftJobs = jobs.filter((job) => job.status === 'Draft').length;

      const spotlight = jobs
        .map((job) => ({
          jobId: String(job._id),
          title: job.title,
          recentApplicants: applicantsIn30DaysByJob.get(String(job._id)) ?? 0,
          applicantsCount: job.applicantsCount || 0,
        }))
        .filter((job) => job.recentApplicants > 0 || job.applicantsCount > 0)
        .sort((a, b) => b.recentApplicants - a.recentApplicants || b.applicantsCount - a.applicantsCount)
        .slice(0, 3);

      const shortlistCountSummary = shortlistCounts[0];
      const runtimeSummary = runtimeStats[0];
      const bestRun = bestRunRows[0] || null;

      return {
        data: {
          userFirstName: typeof req.user?.firstName === 'string' ? req.user.firstName.trim() : undefined,
          activeJobs,
          draftJobs,
          totalApplicants,
          applicantsIn30Days: recentApplicantCounts.reduce((sum, entry) => sum + entry.count, 0),
          totalShortlists: shortlistCountSummary?.totalShortlists || 0,
          shortlistsIn30Days: shortlistCountSummary?.shortlistsIn30Days || 0,
          averageScreeningRuntimeHours: runtimeSummary?.averageScreeningDurationSeconds
            ? runtimeSummary.averageScreeningDurationSeconds / (60 * 60)
            : 0,
          timedRunsCount: runtimeSummary?.timedRunsCount || 0,
          weeklyScreeningRuns: shortlistCountSummary?.weeklyScreeningRuns || 0,
          recentRuns: recentRuns.map((run) => ({
            id: String(run._id),
            title: run.jobTitle,
            createdAt: run.createdAt.toISOString(),
            applicants: run.totalApplicants,
            topMatch:
              typeof run.shortlist?.[0]?.matchScore === 'number' ? run.shortlist[0].matchScore : null,
          })),
          spotlight,
          bestRun: bestRun
            ? {
                jobTitle: bestRun.jobTitle,
                topCandidateName: bestRun.topCandidateName || '',
                topMatchScore: bestRun.topMatchScore || 0,
              }
            : null,
        },
        message: 'Dashboard summary retrieved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }
}
