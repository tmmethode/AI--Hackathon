import {
  Route,
  Tags,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Path,
  Query,
  Request,
  Security,
  SuccessResponse,
} from 'tsoa';
import mongoose from 'mongoose';
import Applicant, { IApplicant } from '../models/Applicant';
import Job from '../models/Job';
import { IUser } from '../models/User';
import { HttpError } from '../utils/HttpError';
import { GeminiClient } from '../gemini/client';
import { GeminiApplicantImportService } from '../gemini/applicant-import';
import {
  ApplicantProfileInput,
  ApplicantListResponse,
  ApplicantResponse,
  DeleteApplicantResponse,
  IApplicantResponse,
  IngestCsvRequest,
  IngestFilesRequest,
  IngestLinksRequest,
  IngestPlatformRequest,
  IngestSummary,
  IngestItemResult,
  ApplicantSource,
  UpdateApplicantRequest,
} from '../interfaces/applicant';

@Tags('Applicants')
@Route('jobs/{jobId}/applicants')
export class ApplicantController {
  private readonly applicantImportService = new GeminiApplicantImportService(new GeminiClient());

  private assertJobId(jobId: string) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new HttpError(400, 'Invalid job id');
    }
  }

  private async assertJobExists(jobId: string) {
    this.assertJobId(jobId);
    const job = await Job.findById(jobId).select('_id');
    if (!job) {
      throw new HttpError(404, 'Job not found');
    }
  }

  /**
   * Normalize a raw candidate payload — supports both the candidates.json-style
   * keys ("Start Date", "Field of Study", etc.) and camelCase keys.
   */
  private normalizeProfile(raw: any): ApplicantProfileInput {
    if (!raw || typeof raw !== 'object') {
      throw new HttpError(400, 'Invalid applicant payload');
    }

    const pick = (obj: any, ...keys: string[]) => {
      for (const k of keys) {
        if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
          return obj[k];
        }
      }
      return undefined;
    };

    const normalizeExperience = (e: any) => ({
      company: pick(e, 'company'),
      role: pick(e, 'role', 'title'),
      startDate: pick(e, 'startDate', 'Start Date'),
      endDate: pick(e, 'endDate', 'End Date'),
      description: pick(e, 'description'),
      technologies: Array.isArray(e?.technologies) ? e.technologies : [],
      isCurrent: Boolean(pick(e, 'isCurrent', 'Is Current')),
    });

    const normalizeEducation = (e: any) => ({
      institution: pick(e, 'institution'),
      degree: pick(e, 'degree'),
      fieldOfStudy: pick(e, 'fieldOfStudy', 'Field of Study'),
      startYear: pick(e, 'startYear', 'Start Year'),
      endYear: pick(e, 'endYear', 'End Year'),
    });

    const normalizeCert = (c: any) => ({
      name: pick(c, 'name'),
      issuer: pick(c, 'issuer'),
      issueDate: pick(c, 'issueDate', 'Issue Date'),
    });

    const normalizeProject = (p: any) => ({
      name: pick(p, 'name'),
      description: pick(p, 'description'),
      technologies: Array.isArray(p?.technologies) ? p.technologies : [],
      role: pick(p, 'role'),
      link: pick(p, 'link'),
      startDate: pick(p, 'startDate', 'Start Date'),
      endDate: pick(p, 'endDate', 'End Date'),
    });

    const normalizeAvailability = (a: any) =>
      a
        ? {
            status: pick(a, 'status'),
            type: pick(a, 'type'),
            startDate: pick(a, 'startDate', 'Start Date'),
          }
        : undefined;

    const firstName = pick(raw, 'firstName', 'first_name');
    const lastName = pick(raw, 'lastName', 'last_name');
    const email = pick(raw, 'email');

    if (!firstName || !lastName || !email) {
      throw new HttpError(400, 'firstName, lastName and email are required');
    }

    return {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim().toLowerCase(),
      headline: pick(raw, 'headline'),
      bio: pick(raw, 'bio'),
      location: pick(raw, 'location'),
      skills: Array.isArray(raw.skills) ? raw.skills : [],
      languages: Array.isArray(raw.languages) ? raw.languages : [],
      experience: Array.isArray(raw.experience)
        ? raw.experience.map(normalizeExperience)
        : [],
      education: Array.isArray(raw.education)
        ? raw.education.map(normalizeEducation)
        : [],
      certifications: Array.isArray(raw.certifications)
        ? raw.certifications.map(normalizeCert)
        : [],
      projects: Array.isArray(raw.projects)
        ? raw.projects.map(normalizeProject)
        : [],
      availability: normalizeAvailability(raw.availability),
      socialLinks: raw.socialLinks,
    };
  }

  private toResponse(a: IApplicant): IApplicantResponse {
    return {
      _id: a._id.toString(),
      job: a.job.toString(),
      firstName: a.firstName,
      lastName: a.lastName,
      email: a.email,
      headline: a.headline,
      bio: a.bio,
      location: a.location,
      skills: a.skills || [],
      languages: a.languages || [],
      experience: (a.experience || []).map((e) => ({
        company: e.company,
        role: e.role,
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description,
        technologies: e.technologies || [],
        isCurrent: e.isCurrent,
      })),
      education: (a.education || []).map((e) => ({
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
        startYear: e.startYear,
        endYear: e.endYear,
      })),
      certifications: a.certifications || [],
      projects: a.projects || [],
      availability: a.availability,
      socialLinks: a.socialLinks,
      source: a.source,
      ingestStatus: a.ingestStatus,
      ingestError: a.ingestError,
      sourceFileName: a.sourceFileName,
      sourceUrl: a.sourceUrl,
      createdBy: a.createdBy.toString(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  private async ingestProfiles(
    jobId: string,
    profiles: ApplicantProfileInput[],
    source: ApplicantSource,
    createdBy: mongoose.Types.ObjectId,
    extras: { sourceFileName?: string; sourceUrl?: string; rawPayloads?: any[] } = {}
  ): Promise<IngestSummary> {
    const summary: IngestSummary = {
      received: profiles.length,
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      applicants: [],
      message: '',
    };

    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      try {
        const existing = await Applicant.findOne({
          job: jobId,
          email: profile.email.toLowerCase(),
        });
        if (existing) {
          summary.skipped += 1;
          continue;
        }

        const created = await Applicant.create({
          ...profile,
          email: profile.email.toLowerCase(),
          job: jobId,
          source,
          ingestStatus: 'parsed',
          sourceFileName: extras.sourceFileName,
          sourceUrl: extras.sourceUrl,
          rawPayload: extras.rawPayloads ? extras.rawPayloads[i] : undefined,
          createdBy,
        });

        summary.created += 1;
        summary.applicants.push(this.toResponse(created));
      } catch (err: any) {
        summary.failed += 1;
        summary.errors.push({
          index: i,
          email: profile?.email,
          message: err?.message || 'Unknown error',
        });
      }
    }

    if (summary.created > 0) {
      await Job.findByIdAndUpdate(jobId, {
        $inc: { applicantsCount: summary.created },
      });
    }

    summary.message = `Ingested ${summary.created}/${summary.received} applicants (skipped ${summary.skipped}, failed ${summary.failed}).`;
    return summary;
  }

  private normalizeUrl(value?: string): string | undefined {
    if (!value) return undefined;
    const trimmed = String(value).trim();
    if (!trimmed) return undefined;
    try {
      const parsed = new URL(trimmed);
      return parsed.toString().replace(/\/+$/, '');
    } catch {
      return undefined;
    }
  }

  private async findDuplicateApplicant(jobId: string, profile: ApplicantProfileInput): Promise<IApplicant | null> {
    const normalizedEmail = profile.email?.trim().toLowerCase();
    if (normalizedEmail) {
      const byEmail = await Applicant.findOne({ job: jobId, email: normalizedEmail });
      if (byEmail) return byEmail;
    }

    const linkedin = this.normalizeUrl(profile.socialLinks?.linkedin);
    const github = this.normalizeUrl(profile.socialLinks?.github);
    const portfolio = this.normalizeUrl(profile.socialLinks?.portfolio);
    const socialCandidates = [linkedin, github, portfolio].filter((item): item is string => Boolean(item));
    if (socialCandidates.length) {
      const bySocial = await Applicant.findOne({
        job: jobId,
        $or: [
          { 'socialLinks.linkedin': { $in: socialCandidates } },
          { 'socialLinks.github': { $in: socialCandidates } },
          { 'socialLinks.portfolio': { $in: socialCandidates } },
        ],
      });
      if (bySocial) return bySocial;
    }

    return null;
  }

  private buildPlaceholderEmail(prefix: string, index: number) {
    return `${prefix}+${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}@ingest.local`;
  }

  /** Minimal CSV parser: handles quoted fields and commas inside quotes. */
  private parseCsv(text: string): Record<string, string>[] {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    const parseRow = (line: string) => {
      const out: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          out.push(cur);
          cur = '';
        } else {
          cur += c;
        }
      }
      out.push(cur);
      return out.map((s) => s.trim());
    };

    const headers = parseRow(lines[0]);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = cells[idx] ?? '';
      });
      rows.push(obj);
    }
    return rows;
  }

  /**
   * List applicants for a job (paginated + searchable).
   */
  @Get('/')
  @Security('jwt')
  public async listApplicants(
    @Path() jobId: string,
    @Query() search?: string,
    @Query() source?: ApplicantSource,
    @Query() page: number = 1,
    @Query() pageSize: number = 20
  ): Promise<ApplicantListResponse> {
    this.assertJobId(jobId);

    const safePage = Math.max(1, Number(page) || 1);
    const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 20));

    const filter: Record<string, any> = { job: jobId };
    if (source) filter.source = source;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { headline: regex },
        { location: regex },
      ];
    }

    const total = await Applicant.countDocuments(filter);
    const docs = await Applicant.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeSize)
      .limit(safeSize);

    return {
      data: docs.map((d) => this.toResponse(d)),
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages: Math.max(1, Math.ceil(total / safeSize)),
      message: 'Applicants retrieved successfully',
    };
  }

  /**
   * Get a single applicant attached to a job.
   */
  @Get('{applicantId}')
  @Security('jwt')
  public async getApplicant(
    @Path() jobId: string,
    @Path() applicantId: string
  ): Promise<ApplicantResponse> {
    this.assertJobId(jobId);
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      throw new HttpError(400, 'Invalid applicant id');
    }

    const applicant = await Applicant.findOne({ _id: applicantId, job: jobId });
    if (!applicant) {
      throw new HttpError(404, 'Applicant not found');
    }

    return {
      data: this.toResponse(applicant),
      message: 'Applicant retrieved successfully',
    };
  }

  /**
   * Ingest applicants from the Umurava platform feed (JSON array matching
   * candidates.json). Duplicate emails per-job are skipped.
   */
  @Post('platform')
  @Security('jwt', ['recruiter', 'admin'])
  @SuccessResponse('201', 'Created')
  public async ingestFromPlatform(
    @Request() req: any,
    @Path() jobId: string,
    @Body() body: IngestPlatformRequest
  ): Promise<IngestSummary> {
    await this.assertJobExists(jobId);
    const actingUser: IUser = req.user;

    if (!Array.isArray(body?.applicants) || body.applicants.length === 0) {
      throw new HttpError(400, 'applicants array is required');
    }

    const normalized = body.applicants.map((raw) => this.normalizeProfile(raw));
    return this.ingestProfiles(jobId, normalized, 'umurava-platform', actingUser._id, {
      rawPayloads: body.applicants,
    });
  }

  /**
   * Ingest applicants from a CSV — accepts either pre-parsed `applicants` rows
   * or raw `csvText` (header row required). Fields map to ApplicantProfileInput.
   */
  @Post('csv')
  @Security('jwt', ['recruiter', 'admin'])
  @SuccessResponse('201', 'Created')
  public async ingestFromCsv(
    @Request() req: any,
    @Path() jobId: string,
    @Body() body: IngestCsvRequest
  ): Promise<IngestSummary> {
    await this.assertJobExists(jobId);
    const actingUser: IUser = req.user;

    let rawRows: any[] = [];
    if (Array.isArray(body?.applicants) && body.applicants.length > 0) {
      rawRows = body.applicants;
    } else if (body?.csvText && body.csvText.trim()) {
      rawRows = this.parseCsv(body.csvText);
    } else {
      throw new HttpError(400, 'Provide either applicants[] or csvText');
    }

    const normalized = rawRows.map((r) => this.normalizeProfile(r));
    return this.ingestProfiles(jobId, normalized, 'csv-import', actingUser._id, {
      rawPayloads: rawRows,
    });
  }

  /**
   * Queue PDF/DOC resumes for AI parsing (future feature). For now the files
   * are stored as placeholder applicants with `ingestStatus: 'pending'` so the
   * UI can display them, and a background AI job can update them later.
   */
  @Post('files')
  @Security('jwt', ['recruiter', 'admin'])
  @SuccessResponse('202', 'Queued')
  public async ingestFromFiles(
    @Request() req: any,
    @Path() jobId: string,
    @Body() body: IngestFilesRequest
  ): Promise<IngestSummary> {
    await this.assertJobExists(jobId);
    const actingUser: IUser = req.user;

    if (!Array.isArray(body?.files) || body.files.length === 0) {
      throw new HttpError(400, 'files array is required');
    }

    const summary: IngestSummary = {
      received: body.files.length,
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      applicants: [],
      itemResults: [],
      message: '',
    };

    for (let i = 0; i < body.files.length; i++) {
      const file = body.files[i];
      try {
        if (!file?.filename) {
          throw new Error('filename is required');
        }
        if (!file.dataBase64 || !this.applicantImportService.isConfigured()) {
          const placeholderEmail = (
            file.email?.toLowerCase() ||
            this.buildPlaceholderEmail('pending-file', i)
          ).toLowerCase();

          const existing = await Applicant.findOne({ job: jobId, email: placeholderEmail });
          if (existing) {
            summary.skipped += 1;
            summary.itemResults?.push({
              index: i,
              source: 'pdf-upload',
              state: 'duplicate-detected',
              sourceFileName: file.filename,
              email: placeholderEmail,
              message: 'File payload already queued.',
            });
            continue;
          }

          const queued = await Applicant.create({
            job: jobId,
            firstName: 'Pending',
            lastName: 'Parse',
            email: placeholderEmail,
            source: 'pdf-upload',
            ingestStatus: 'pending',
            sourceFileName: file.filename,
            rawPayload: { mimeType: file.mimeType, dataBase64: file.dataBase64 },
            createdBy: actingUser._id,
          });

          summary.created += 1;
          summary.applicants.push(this.toResponse(queued));
          summary.itemResults?.push({
            index: i,
            source: 'pdf-upload',
            state: 'parsed-successfully',
            sourceFileName: file.filename,
            email: placeholderEmail,
            message: this.applicantImportService.isConfigured()
              ? 'File queued for deferred parsing (missing binary payload).'
              : 'Gemini unavailable. File queued for deferred parsing.',
          });
          continue;
        }

        const parsed = await this.applicantImportService.parseFromFile({
          fileName: file.filename,
          mimeType: file.mimeType,
          base64Data: file.dataBase64,
        });

        let createdForFile = 0;
        for (const parsedApplicant of parsed.applicants) {
          const normalized = this.normalizeProfile(parsedApplicant);
          const duplicate = await this.findDuplicateApplicant(jobId, normalized);
          if (duplicate) {
            summary.skipped += 1;
            summary.itemResults?.push({
              index: i,
              source: 'pdf-upload',
              state: 'duplicate-detected',
              sourceFileName: file.filename,
              email: normalized.email,
              message: 'Duplicate applicant detected from existing email/social profile.',
            });
            continue;
          }

          const created = await Applicant.create({
            ...normalized,
            email: normalized.email.toLowerCase(),
            job: jobId,
            source: 'pdf-upload',
            ingestStatus: 'parsed',
            sourceFileName: file.filename,
            rawPayload: { extractionWarnings: parsed.warnings, extracted: parsed.rawResponse },
            createdBy: actingUser._id,
          });

          summary.created += 1;
          createdForFile += 1;
          summary.applicants.push(this.toResponse(created));
          summary.itemResults?.push({
            index: i,
            source: 'pdf-upload',
            state: 'saved-successfully',
            sourceFileName: file.filename,
            email: normalized.email,
            message: parsed.warnings.length ? parsed.warnings.join(' ') : 'Applicant parsed and saved.',
          });
        }

        if (createdForFile === 0) {
          summary.itemResults?.push({
            index: i,
            source: 'pdf-upload',
            state: 'partially-parsed',
            sourceFileName: file.filename,
            message: 'File was parsed but no new applicants were saved.',
          });
        }
      } catch (err: any) {
        summary.failed += 1;
        summary.errors.push({
          index: i,
          message: err?.message || 'Unknown error',
        });
        const state = String(err?.message || '').toLowerCase().includes('unsupported file type')
          ? 'unsupported-file'
          : 'parse-failed';
        summary.itemResults?.push({
          index: i,
          source: 'pdf-upload',
          state: state as IngestItemResult['state'],
          sourceFileName: file?.filename,
          message: err?.message || 'Unknown error',
        });
      }
    }

    if (summary.created > 0) {
      await Job.findByIdAndUpdate(jobId, {
        $inc: { applicantsCount: summary.created },
      });
    }

    summary.message = this.applicantImportService.isConfigured()
      ? `Processed ${summary.received} files: saved ${summary.created}, skipped ${summary.skipped}, failed ${summary.failed}.`
      : `Queued ${summary.created}/${summary.received} files for deferred AI parsing (Gemini not configured).`;
    return summary;
  }

  /**
   * Queue candidate profile URLs (LinkedIn, portfolio, etc.) for AI parsing
   * (future feature). Stored as placeholder applicants with
   * `ingestStatus: 'pending'`.
   */
  @Post('links')
  @Security('jwt', ['recruiter', 'admin'])
  @SuccessResponse('202', 'Queued')
  public async ingestFromLinks(
    @Request() req: any,
    @Path() jobId: string,
    @Body() body: IngestLinksRequest
  ): Promise<IngestSummary> {
    await this.assertJobExists(jobId);
    const actingUser: IUser = req.user;

    if (!Array.isArray(body?.links) || body.links.length === 0) {
      throw new HttpError(400, 'links array is required');
    }

    const summary: IngestSummary = {
      received: body.links.length,
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      applicants: [],
      itemResults: [],
      message: '',
    };

    for (let i = 0; i < body.links.length; i++) {
      const link = body.links[i]?.trim();
      try {
        if (!link) throw new Error('Empty link');

        const existing = await Applicant.findOne({ job: jobId, sourceUrl: link });
        if (existing) {
          summary.skipped += 1;
          summary.itemResults?.push({
            index: i,
            source: 'paste-links',
            state: 'duplicate-detected',
            sourceUrl: link,
            message: 'This source URL was already ingested.',
          });
          continue;
        }

        if (!this.applicantImportService.isConfigured()) {
          const placeholderEmail = this.buildPlaceholderEmail('pending-link', i);
          const created = await Applicant.create({
            job: jobId,
            firstName: 'Pending',
            lastName: 'Parse',
            email: placeholderEmail,
            source: 'paste-links',
            ingestStatus: 'pending',
            sourceUrl: link,
            createdBy: actingUser._id,
          });

          summary.created += 1;
          summary.applicants.push(this.toResponse(created));
          summary.itemResults?.push({
            index: i,
            source: 'paste-links',
            state: 'parsed-successfully',
            sourceUrl: link,
            email: placeholderEmail,
            message: 'Gemini unavailable. Link queued for deferred parsing.',
          });
          continue;
        }

        const parsed = await this.applicantImportService.parseFromLink({ url: link });
        let createdForLink = 0;
        for (const parsedApplicant of parsed.applicants) {
          const normalized = this.normalizeProfile(parsedApplicant);
          const duplicate = await this.findDuplicateApplicant(jobId, normalized);
          if (duplicate) {
            summary.skipped += 1;
            summary.itemResults?.push({
              index: i,
              source: 'paste-links',
              state: 'duplicate-detected',
              sourceUrl: link,
              email: normalized.email,
              message: 'Duplicate applicant detected from existing email/social profile.',
            });
            continue;
          }

          const created = await Applicant.create({
            ...normalized,
            email: normalized.email.toLowerCase(),
            job: jobId,
            source: 'paste-links',
            ingestStatus: 'parsed',
            sourceUrl: link,
            rawPayload: { extractionWarnings: parsed.warnings, extracted: parsed.rawResponse },
            createdBy: actingUser._id,
          });
          createdForLink += 1;
          summary.created += 1;
          summary.applicants.push(this.toResponse(created));
          summary.itemResults?.push({
            index: i,
            source: 'paste-links',
            state: 'saved-successfully',
            sourceUrl: link,
            email: normalized.email,
            message: parsed.warnings.length ? parsed.warnings.join(' ') : 'Applicant parsed and saved.',
          });
        }

        if (createdForLink === 0) {
          summary.itemResults?.push({
            index: i,
            source: 'paste-links',
            state: 'partially-parsed',
            sourceUrl: link,
            message: 'Link parsed but no new applicants were saved.',
          });
        }
      } catch (err: any) {
        summary.failed += 1;
        summary.errors.push({
          index: i,
          message: err?.message || 'Unknown error',
        });
        summary.itemResults?.push({
          index: i,
          source: 'paste-links',
          state: 'parse-failed',
          sourceUrl: link,
          message: err?.message || 'Unknown error',
        });
      }
    }

    if (summary.created > 0) {
      await Job.findByIdAndUpdate(jobId, {
        $inc: { applicantsCount: summary.created },
      });
    }

    summary.message = this.applicantImportService.isConfigured()
      ? `Processed ${summary.received} links: saved ${summary.created}, skipped ${summary.skipped}, failed ${summary.failed}.`
      : `Queued ${summary.created}/${summary.received} links for deferred AI parsing (Gemini not configured).`;
    return summary;
  }

  /**
   * Patch an applicant (e.g. after manual verification of AI-parsed data).
   */
  @Patch('{applicantId}')
  @Security('jwt', ['recruiter', 'admin'])
  public async updateApplicant(
    @Path() jobId: string,
    @Path() applicantId: string,
    @Body() body: UpdateApplicantRequest
  ): Promise<ApplicantResponse> {
    this.assertJobId(jobId);
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      throw new HttpError(400, 'Invalid applicant id');
    }

    const updated = await Applicant.findOneAndUpdate(
      { _id: applicantId, job: jobId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new HttpError(404, 'Applicant not found');
    }

    return {
      data: this.toResponse(updated),
      message: 'Applicant updated successfully',
    };
  }

  /**
   * Remove an applicant from a job.
   */
  @Delete('{applicantId}')
  @Security('jwt', ['recruiter', 'admin'])
  public async deleteApplicant(
    @Path() jobId: string,
    @Path() applicantId: string
  ): Promise<DeleteApplicantResponse> {
    this.assertJobId(jobId);
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      throw new HttpError(400, 'Invalid applicant id');
    }

    const deleted = await Applicant.findOneAndDelete({
      _id: applicantId,
      job: jobId,
    });
    if (!deleted) {
      throw new HttpError(404, 'Applicant not found');
    }

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: -1 } });

    return {
      id: applicantId,
      message: 'Applicant removed from job',
    };
  }
}
