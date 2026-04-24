import {
  Route,
  Tags,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Path,
  Query,
  Request,
  Security,
  SuccessResponse,
} from 'tsoa';
import mongoose from 'mongoose';
import Job, { IJob } from '../models/Job';
import User, { IUser } from '../models/User';
import {
  IJobResponse,
  CreateJobRequest,
  UpdateJobRequest,
  JobListResponse,
  JobResponse,
  DeleteJobResponse,
  JobStatus,
  HiringManagerSummary,
} from '../interfaces/job';

export interface JobSelectItemDTO {
  _id: string;
  title: string;
  status: JobStatus;
}

export interface JobSelectResponse {
  data: JobSelectItemDTO[];
  message: string;
}

@Tags('Jobs')
@Route('jobs')
export class JobController {
  private toHiringManagerSummary(hm: any): HiringManagerSummary {
    if (hm && typeof hm === 'object' && 'email' in hm) {
      const u = hm as IUser;
      return {
        _id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        profilePicture: u.profilePicture,
      };
    }
    return {
      _id: hm?.toString?.() ?? String(hm),
      firstName: '',
      lastName: '',
      email: '',
    };
  }

  /**
   * Resolve and validate the hiring manager for a job.
   * - Admins may omit `hiringManager` and will default to themselves.
   * - Recruiters may omit it (defaults to themselves). If provided, it must equal their own id unless admin.
   * - Explicit hiring managers must belong to a user with role `recruiter` or `admin`.
   */
  private async resolveHiringManager(
    actingUser: IUser,
    requestedId?: string
  ): Promise<mongoose.Types.ObjectId> {
    const actingRole = actingUser.role;

    // Defaulting to the acting user avoids silent ownership reassignment.
    if (!requestedId) {
      if (actingRole === 'recruiter' || actingRole === 'admin') {
        return actingUser._id;
      }
      throw new Error('hiringManager is required');
    }

    if (!mongoose.Types.ObjectId.isValid(requestedId)) {
      throw new Error('Invalid hiringManager id');
    }

    // Recruiters are intentionally restricted to themselves to prevent privilege escalation.
    if (actingRole === 'recruiter' && requestedId !== actingUser._id.toString()) {
      throw new Error('Recruiters can only assign themselves as hiring manager');
    }

    const hm = await User.findById(requestedId);
    if (!hm) {
      throw new Error('Hiring manager user not found');
    }
    if (hm.role !== 'recruiter' && hm.role !== 'admin') {
      throw new Error('Hiring manager must be a user with role \'recruiter\' or \'admin\'');
    }

    return hm._id;
  }

  private convertJobToResponse(job: IJob): IJobResponse {
    return {
      _id: job._id.toString(),
      title: job.title,
      hiringManager: this.toHiringManagerSummary((job as any).hiringManager),
      location: job.location,
      locationPolicy: job.locationPolicy,
      employmentType: job.employmentType,
      salaryBand: job.salaryBand,
      summary: job.summary,
      responsibilities: job.responsibilities,
      mustHaveQualifications: job.mustHaveQualifications,
      niceToHaveQualifications: job.niceToHaveQualifications,
      coreHardSkills: job.coreHardSkills || [],
      preferredSkills: job.preferredSkills || [],
      coreSoftSkills: job.coreSoftSkills || [],
      experienceYears: job.experienceYears,
      seniorityLevel: job.seniorityLevel,
      educationLevel: job.educationLevel,
      weightCriteria: job.weightCriteria || [],
      status: job.status,
      applicantsCount: job.applicantsCount,
      createdBy: job.createdBy.toString(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  /**
   * List jobs with optional filters and pagination.
   */
  @Get('/')
  @Security('jwt')
  public async listJobs(
    @Query() search?: string,
    @Query() status?: JobStatus | 'All',
    @Query() page: number = 1,
    @Query() pageSize: number = 10
  ): Promise<JobListResponse> {
    try {
      const safePage = Math.max(1, Number(page) || 1);
      const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 10));

      const filter: Record<string, any> = {};

      if (status && status !== 'All') {
        filter.status = status;
      }

      if (search && search.trim().length > 0) {
        const regex = new RegExp(search.trim(), 'i');

        // Include hiring manager identity in search so recruiters can find all of their requisitions.
        const matchingManagers = await User.find({
          role: { $in: ['recruiter', 'admin'] },
          $or: [
            { firstName: regex },
            { lastName: regex },
            { email: regex },
          ],
        }).select('_id');
        const matchingManagerIds = matchingManagers.map((u) => u._id);

        filter.$or = [
          { title: regex },
          { location: regex },
          { hiringManager: { $in: matchingManagerIds } },
        ];
      }

      const total = await Job.countDocuments(filter);
      const jobs = await Job.find(filter)
        .populate('hiringManager', 'firstName lastName email profilePicture role')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeSize)
        .limit(safeSize);

      return {
        data: jobs.map((j) => this.convertJobToResponse(j)),
        total,
        page: safePage,
        pageSize: safeSize,
        totalPages: Math.max(1, Math.ceil(total / safeSize)),
        message: 'Jobs retrieved successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to list jobs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * List lightweight job rows for selectors.
   */
  @Get('select')
  @Security('jwt')
  public async listJobSelect(
    @Query() search?: string,
    @Query() status?: JobStatus | 'All',
    @Query() limit: number = 100
  ): Promise<JobSelectResponse> {
    try {
      const safeLimit = Math.min(300, Math.max(1, Number(limit) || 100));
      const filter: Record<string, any> = {};

      if (status && status !== 'All') {
        filter.status = status;
      }

      if (search && search.trim().length > 0) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [{ title: regex }, { location: regex }];
      }

      const jobs = await Job.find(filter)
        .select('_id title status')
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean<Array<{ _id: mongoose.Types.ObjectId; title: string; status: JobStatus }>>();

      return {
        data: jobs.map((job) => ({
          _id: job._id.toString(),
          title: job.title,
          status: job.status,
        })),
        message: 'Job selector data retrieved successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to load job selector data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a single job by ID.
   */
  @Get('{id}')
  @Security('jwt')
  public async getJob(@Path() id: string): Promise<JobResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid job id');
      }

      const job = await Job.findById(id).populate(
        'hiringManager',
        'firstName lastName email profilePicture role'
      );
      if (!job) {
        throw new Error('Job not found');
      }

      return {
        data: this.convertJobToResponse(job),
        message: 'Job retrieved successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to get job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new job requisition.
   */
  @Post('/')
  @Security('jwt', ['recruiter', 'admin'])
  @SuccessResponse('201', 'Created')
  public async createJob(
    @Request() req: any,
    @Body() body: CreateJobRequest
  ): Promise<JobResponse> {
    try {
      const actingUser: IUser | undefined = req.user;
      if (!actingUser || !actingUser._id) {
        throw new Error('User not authenticated');
      }

      this.validateWeightCriteria(body.weightCriteria, body.status);

      const hiringManagerId = await this.resolveHiringManager(actingUser, body.hiringManager);

      const job = new Job({
        ...body,
        hiringManager: hiringManagerId,
        createdBy: actingUser._id,
        status: body.status || 'Draft',
      });

      await job.save();
      await job.populate('hiringManager', 'firstName lastName email profilePicture role');

      return {
        data: this.convertJobToResponse(job),
        message: 'Job created successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update a job (full update).
   */
  @Put('{id}')
  @Security('jwt', ['recruiter', 'admin'])
  public async updateJob(
    @Request() req: any,
    @Path() id: string,
    @Body() body: UpdateJobRequest
  ): Promise<JobResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid job id');
      }

      this.validateWeightCriteria(body.weightCriteria, body.status);

      const update: Record<string, any> = { ...body };

      if (body.hiringManager !== undefined) {
        const actingUser: IUser | undefined = req.user;
        if (!actingUser) {
          throw new Error('User not authenticated');
        }
        update.hiringManager = await this.resolveHiringManager(
          actingUser,
          body.hiringManager
        );
      }

      const job = await Job.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      }).populate('hiringManager', 'firstName lastName email profilePicture role');

      if (!job) {
        throw new Error('Job not found');
      }

      return {
        data: this.convertJobToResponse(job),
        message: 'Job updated successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to update job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Partially update a job.
   */
  @Patch('{id}')
  @Security('jwt', ['recruiter', 'admin'])
  public async patchJob(
    @Request() req: any,
    @Path() id: string,
    @Body() body: UpdateJobRequest
  ): Promise<JobResponse> {
    return this.updateJob(req, id, body);
  }

  /**
   * Change the status of a job (publish/archive/draft).
   */
  @Patch('{id}/status')
  @Security('jwt', ['recruiter', 'admin'])
  public async changeStatus(
    @Path() id: string,
    @Body() body: { status: JobStatus }
  ): Promise<JobResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid job id');
      }

      if (!['Active', 'Draft', 'Closed'].includes(body.status)) {
        throw new Error('Invalid job status');
      }

      const job = await Job.findByIdAndUpdate(
        id,
        { status: body.status },
        { new: true, runValidators: true }
      ).populate('hiringManager', 'firstName lastName email profilePicture role');

      if (!job) {
        throw new Error('Job not found');
      }

      return {
        data: this.convertJobToResponse(job),
        message: `Job status changed to ${body.status}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to change job status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Archive a job (soft close — sets status to Closed).
   */
  @Patch('{id}/archive')
  @Security('jwt', ['recruiter', 'admin'])
  public async archiveJob(@Path() id: string): Promise<JobResponse> {
    return this.changeStatus(id, { status: 'Closed' });
  }

  /**
   * Delete a job permanently.
   */
  @Delete('{id}')
  @Security('jwt', ['recruiter', 'admin'])
  public async deleteJob(@Path() id: string): Promise<DeleteJobResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid job id');
      }

      const job = await Job.findByIdAndDelete(id);
      if (!job) {
        throw new Error('Job not found');
      }

      return {
        id,
        message: 'Job deleted successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private validateWeightCriteria(
    weightCriteria: { value: number }[] | undefined,
    status: JobStatus | undefined
  ) {
    // Draft jobs can be saved incrementally; enforce a strict 100% only at activation time.
    if (!weightCriteria || weightCriteria.length === 0) return;
    if (status && status !== 'Active') return;

    const total = weightCriteria.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
    if (total !== 100) {
      throw new Error(`Weight criteria must sum to 100% (currently ${total}%)`);
    }
  }
}
