import { Get, Path, Post, Patch, Query, Request, Route, Security, Tags } from 'tsoa';
import Applicant from '../models/Applicant';
import Job from '../models/Job';
import Shortlist from '../models/Shortlist';
import User from '../models/User';
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

    if (normalized.includes('not authenticated')) {
      return new HttpError(401, message);
    }

    if (normalized.includes('invalid')) {
      return new HttpError(400, message);
    }

    return new HttpError(500, message);
  }

  private getUserId(request?: { _id?: string; id?: string }) {
    const userId = request?._id || request?.id;

    if (!userId) {
      throw new Error('Not authenticated');
    }

    return String(userId);
  }

  private async listReadNotificationIds(userId: string) {
    const user = await User.findById(userId).select('readNotificationIds').lean<{ readNotificationIds?: string[] } | null>();
    return new Set(user?.readNotificationIds || []);
  }

  private async persistReadNotificationIds(userId: string, ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { readNotificationIds: { $each: ids } } }, { new: false });
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
      createdAt: record.createdAt.toISOString(),
    }));
  };

  private async aggregateNotifications(limit: number, readIds: Set<string>): Promise<NotificationDTO[]> {
    const [screening, applicants, jobs] = await Promise.all([
      this.buildScreeningNotifications(),
      this.buildApplicantNotifications(),
      this.buildJobNotifications(),
    ]);

    return [...screening, ...applicants, ...jobs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((notification) => ({
        ...notification,
        read: readIds.has(notification.id),
      }));
  }

  @Get('/')
  @Security('jwt')
  public async listNotifications(
    @Request() request: any,
    @Query() limit: number = 100
  ): Promise<NotificationListResponse> {
    try {
      const userId = this.getUserId(request?.user ?? request);
      const safeLimit = Math.min(200, Math.max(1, Number(limit) || 100));
      const readIds = await this.listReadNotificationIds(userId);
      const notifications = await this.aggregateNotifications(safeLimit, readIds);

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
  public async getNotification(@Request() request: any, @Path() id: string): Promise<NotificationResponse> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid notification id');
      }

      const userId = this.getUserId(request?.user ?? request);
      const readIds = await this.listReadNotificationIds(userId);
      const notifications = await this.aggregateNotifications(500, readIds);
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

  @Patch('{id}/read')
  @Security('jwt')
  public async markAsRead(@Request() request: any, @Path() id: string): Promise<NotificationResponse> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid notification id');
      }

      const userId = this.getUserId(request?.user ?? request);
      const readIds = await this.listReadNotificationIds(userId);
      const notifications = await this.aggregateNotifications(500, readIds);
      const notification = notifications.find((entry) => entry.id === id);

      if (!notification) {
        throw new Error('Notification not found');
      }

      await this.persistReadNotificationIds(userId, [id]);

      return {
        data: {
          ...notification,
          read: true,
        },
        message: 'Notification marked as read',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post('read-all')
  @Security('jwt')
  public async markAllAsRead(@Request() request: any): Promise<{ message: string }> {
    try {
      const userId = this.getUserId(request?.user ?? request);
      const readIds = await this.listReadNotificationIds(userId);
      const notifications = await this.aggregateNotifications(200, readIds);
      const unreadIds = notifications.filter((entry) => !entry.read).map((entry) => entry.id);

      await this.persistReadNotificationIds(userId, unreadIds);

      return {
        message: 'All visible notifications marked as read',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }
}
