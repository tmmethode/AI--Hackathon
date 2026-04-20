import { Get, Path, Query, Route, Security, Tags } from 'tsoa';
import Applicant from '../models/Applicant';
import Job from '../models/Job';
import Shortlist from '../models/Shortlist';
import { HttpError } from '../utils/HttpError';

export type NotificationType = 'screening' | 'job' | 'export' | 'system';

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  detail: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  data: NotificationDTO[];
  total: number;
  message: string;
}

export interface NotificationResponse {
  data: NotificationDTO;
  message: string;
}

@Tags('Notifications')
@Route('notifications')
export class NotificationController {
  private toHttpError(error: unknown): HttpError {
    if (error instanceof HttpError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unexpected notification error';
    const normalized = message.toLowerCase();

    if (normalized.includes('not found')) {
      return new HttpError(404, message);
    }

    if (normalized.includes('invalid')) {
      return new HttpError(400, message);
    }

    return new HttpError(500, message);
  }

  private buildScreeningNotifications = async () => {
    const records = await Shortlist.find({})
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    return records.map((record) => ({
      id: `screening-${record._id.toString()}`,
      type: 'screening' as const,
      title: 'Screening completed',
      body: `${record.runName || record.jobTitle || 'Screening run'} completed with ${record.shortlistCount} shortlisted from ${record.totalApplicants} applicants.`,
      detail: `The screening run "${record.runName || record.jobTitle || 'Untitled run'}" for ${record.jobTitle || 'this role'} completed successfully. ${record.shortlistCount} candidates were shortlisted out of ${record.totalApplicants} evaluated applicants.`,
      read: false,
      createdAt: record.createdAt.toISOString(),
    }));
  };

  private buildApplicantNotifications = async () => {
    const records = await Applicant.find({})
      .populate('job', 'title')
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    return records.map((record: any) => {
      const jobTitle = record.job?.title || 'a job';
      const fullName = [record.firstName, record.lastName].filter(Boolean).join(' ').trim() || 'A new candidate';

      return {
        id: `applicant-${record._id.toString()}`,
        type: 'job' as const,
        title: 'New applicant detected',
        body: `${fullName} applied to ${jobTitle}.`,
        detail: `${fullName} was ingested for ${jobTitle} via ${record.source || 'the platform'}. You can review the profile and include this applicant in your next screening run.`,
        read: false,
        createdAt: record.createdAt.toISOString(),
      };
    });
  };

  private buildJobNotifications = async () => {
    const records = await Job.find({})
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    return records.map((record) => ({
      id: `job-${record._id.toString()}`,
      type: 'job' as const,
      title: 'Job created',
      body: `New role "${record.title}" was created in ${record.department}.`,
      detail: `The role "${record.title}" (${record.status}) was created under the ${record.department} department with location set to ${record.location}.`,
      read: false,
      createdAt: record.createdAt.toISOString(),
    }));
  };

  private async aggregateNotifications(limit: number): Promise<NotificationDTO[]> {
    const [screening, applicants, jobs] = await Promise.all([
      this.buildScreeningNotifications(),
      this.buildApplicantNotifications(),
      this.buildJobNotifications(),
    ]);

    return [...screening, ...applicants, ...jobs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  @Get('/')
  @Security('jwt')
  public async listNotifications(
    @Query() limit: number = 100
  ): Promise<NotificationListResponse> {
    try {
      const safeLimit = Math.min(200, Math.max(1, Number(limit) || 100));
      const notifications = await this.aggregateNotifications(safeLimit);

      return {
        data: notifications,
        total: notifications.length,
        message: 'Notifications retrieved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Get('{id}')
  @Security('jwt')
  public async getNotification(@Path() id: string): Promise<NotificationResponse> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid notification id');
      }

      const notifications = await this.aggregateNotifications(300);
      const notification = notifications.find((entry) => entry.id === id);

      if (!notification) {
        throw new Error('Notification not found');
      }

      return {
        data: notification,
        message: 'Notification retrieved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }
}
