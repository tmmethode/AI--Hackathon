import { Get, Route, Security, Tags } from 'tsoa';
import Shortlist from '../models/Shortlist';
import { HttpError } from '../utils/HttpError';

export interface SidebarUsageDTO {
  weeklyCount: number;
  totalCount: number;
}

export interface SidebarUsageResponse {
  data: SidebarUsageDTO;
  message: string;
}

@Tags('Sidebar')
@Route('sidebar')
export class SidebarController {
  private toHttpError(error: unknown): HttpError {
    if (error instanceof HttpError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unexpected sidebar error';
    return new HttpError(500, message);
  }

  @Get('usage')
  @Security('jwt')
  public async getUsage(): Promise<SidebarUsageResponse> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [totalCount, weeklyCount] = await Promise.all([
        Shortlist.countDocuments({}),
        Shortlist.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      ]);

      return {
        data: {
          weeklyCount,
          totalCount,
        },
        message: 'Sidebar usage retrieved successfully',
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }
}
