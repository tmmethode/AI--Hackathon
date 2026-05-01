import mongoose from "mongoose";
import Applicant, { type IApplicant } from "../models/Applicant";
import Job, { type IJob } from "../models/Job";
import ScreeningRun, { type IScreeningRun, type ScreeningRunStatus } from "../models/ScreeningRun";
import ScreeningResult from "../models/ScreeningResult";
import Shortlist from "../models/Shortlist";
import { HttpError } from "../utils/HttpError";
import { resolveApplicantStructuredSections } from "../utils/applicant-profile";
import { GeminiClient } from "./client";
import { GeminiScreeningService } from "./screening";
import { deriveScoringWeightCriteria } from "./rubric";
import { isBatchEntryShortlistEligible } from "./shortlist-criteria";
import {
  GeminiAvailabilityStatus,
  GeminiAvailabilityType,
  GeminiBatchApplicant,
  GeminiBatchJob,
  GeminiBatchScreeningDbRequest,
  GeminiBatchScreeningMeta,
  GeminiBatchScreeningResponse,
  GeminiBatchScreeningResultEntry,
  GeminiBatchShortlistEntry,
  GeminiLanguageProficiency,
  GeminiSkillLevel,
} from "./types";

const DEFAULT_ASYNC_DB_CHUNK_SIZE = Math.max(
  1,
  Math.floor(Number(process.env.GEMINI_ASYNC_DB_CHUNK_SIZE) || 20)
);
const DEFAULT_PERSISTED_SCREENING_RESULT_LIMIT = Math.max(
  1,
  Math.floor(Number(process.env.GEMINI_PERSISTED_SCREENING_RESULT_LIMIT) || 500)
);
const ASYNC_EXPLANATION_BUFFER = 10;

function normalizeEmail(email?: string): string {
  return (email || "").trim().toLowerCase();
}

function toBatchJobFromModel(job: IJob): GeminiBatchJob {
  return {
    id: job._id.toString(),
    title: job.title,
    location: job.location,
    locationPolicy: job.locationPolicy,
    employmentType: job.employmentType,
    salaryBand: job.salaryBand,
    description: job.description,
    responsibilities: job.responsibilities,
    mustHaveQualifications: job.mustHaveQualifications,
    niceToHaveQualifications: job.niceToHaveQualifications,
    coreHardSkills: job.coreHardSkills,
    preferredSkills: job.preferredSkills,
    coreSoftSkills: job.coreSoftSkills,
    experienceYears: job.experienceYears,
    seniorityLevel: job.seniorityLevel,
    educationLevel: job.educationLevel,
    weightCriteria: job.weightCriteria?.map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      value: criterion.value,
    })),
    status: job.status,
  };
}

function toBatchApplicantFromModel(applicant: IApplicant): GeminiBatchApplicant {
  const structured = resolveApplicantStructuredSections({
    skills: applicant.skills,
    languages: applicant.languages,
    experience: applicant.experience,
    education: applicant.education,
    certifications: applicant.certifications,
    projects: applicant.projects,
    availability: applicant.availability,
    socialLinks: applicant.socialLinks,
    rawPayload: applicant.rawPayload,
  });

  const availability = structured.availability ?? applicant.availability;

  return {
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicant.email,
    headline: applicant.headline,
    bio: applicant.bio,
    location: applicant.location,
    skills: structured.skills.map((skill) => ({
      name: skill.name,
      level: skill.level as GeminiSkillLevel | undefined,
      yearsOfExperience: skill.yearsOfExperience,
    })),
    languages: structured.languages.map((language) => ({
      name: language.name,
      proficiency: language.proficiency as GeminiLanguageProficiency | undefined,
    })),
    experience: structured.experience.map((entry) => ({
      company: entry.company,
      role: entry.role,
      startDate: entry.startDate,
      endDate: entry.endDate,
      description: entry.description,
      technologies: entry.technologies,
      isCurrent: entry.isCurrent,
    })),
    education: structured.education.map((entry) => ({
      institution: entry.institution,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy,
      startYear: entry.startYear,
      endYear: entry.endYear,
    })),
    certifications: structured.certifications.map((entry) => ({
      name: entry.name,
      issuer: entry.issuer,
      issueDate: entry.issueDate,
    })),
    projects: structured.projects.map((project) => ({
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      role: project.role,
      link: project.link,
      startDate: project.startDate,
      endDate: project.endDate,
    })),
    availability: {
      status: (availability?.status as GeminiAvailabilityStatus) ?? "Open to Opportunities",
      type: (availability?.type as GeminiAvailabilityType) ?? "Full-time",
      startDate: availability?.startDate,
    },
    socialLinks: structured.socialLinks
      ? {
          linkedin: structured.socialLinks.linkedin,
          github: structured.socialLinks.github,
          portfolio: structured.socialLinks.portfolio,
        }
      : undefined,
  };
}

function buildApplicantQuery(run: IScreeningRun): Record<string, unknown> {
  const applicantQuery: Record<string, unknown> = {
    job: run.job,
    ingestStatus: run.filters?.ingestStatus || "parsed",
  };

  if (run.applicantIds && run.applicantIds.length > 0) {
    const validApplicantIds = run.applicantIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validApplicantIds.length > 0) {
      applicantQuery._id = { $in: validApplicantIds };
    }
  }

  if (run.applicantEmails && run.applicantEmails.length > 0) {
    const normalizedEmails = Array.from(
      new Set(run.applicantEmails.map((email) => normalizeEmail(email)).filter(Boolean))
    );

    if (normalizedEmails.length > 0) {
      applicantQuery.email = { $in: normalizedEmails };
    }
  }

  return applicantQuery;
}

function toFailureResult(applicant: GeminiBatchApplicant, reason: string): GeminiBatchScreeningResultEntry {
  const fullName = [applicant.firstName, applicant.lastName].filter(Boolean).join(" ").trim() || applicant.email;

  return {
    candidateRank: 0,
    applicantEmail: applicant.email,
    fullName,
    matchScore: 0,
    confidenceScore: 0,
    skillsScore: 0,
    experienceScore: 0,
    educationScore: 0,
    relevanceScore: 0,
    criterionAssessments: [],
    criticalRequirementGap: true,
    strengths: [],
    gapsOrRisks: [reason],
    finalRecommendation: "Consider",
    summaryExplanation: "",
  };
}

function toResponseEntry(result: {
  candidateRank?: number | null;
  applicantEmail: string;
  fullName?: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  criterionAssessments?: Array<{
    label: string;
    weightPct: number;
    score: number;
    weightedScore: number;
    summary?: string;
    evidence?: string[];
  }>;
  criticalRequirementGap?: boolean;
  strengths?: string[];
  gapsOrRisks?: string[];
  finalRecommendation: GeminiBatchShortlistEntry["finalRecommendation"];
  summaryExplanation?: string;
}): GeminiBatchScreeningResultEntry {
  return {
    candidateRank: result.candidateRank ?? 0,
    applicantEmail: result.applicantEmail,
    fullName: result.fullName || result.applicantEmail,
    matchScore: result.matchScore,
    confidenceScore: result.confidenceScore,
    skillsScore: result.skillsScore,
    experienceScore: result.experienceScore,
    educationScore: result.educationScore,
    relevanceScore: result.relevanceScore,
    criterionAssessments: (result.criterionAssessments || []).map((assessment) => ({
      label: assessment.label,
      weightPct: assessment.weightPct,
      score: assessment.score,
      weightedScore: assessment.weightedScore,
      summary: assessment.summary || "",
      evidence: assessment.evidence || [],
    })),
    criticalRequirementGap: result.criticalRequirementGap ?? false,
    strengths: result.strengths || [],
    gapsOrRisks: result.gapsOrRisks || [],
    finalRecommendation: result.finalRecommendation,
    summaryExplanation: result.summaryExplanation || "",
  };
}

function uniqueFailureReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.map((reason) => reason.trim()).filter(Boolean))).slice(0, 10);
}

function screeningDurationSeconds(run: IScreeningRun): number | undefined {
  if (!run.screeningStartedAt || !run.screeningCompletedAt) {
    return undefined;
  }

  return Math.max(
    0,
    Math.round((run.screeningCompletedAt.getTime() - run.screeningStartedAt.getTime()) / 1000)
  );
}

export interface GeminiBatchScreeningRunRequest extends GeminiBatchScreeningDbRequest {
  runName?: string;
}

export interface GeminiBatchScreeningRunStatusResponse {
  id: string;
  jobId: string;
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
  model?: string;
  failureReasons: string[];
  error?: string;
  screeningStartedAt?: string;
  screeningCompletedAt?: string;
  screeningDurationSeconds?: number;
  savedShortlistId?: string;
  response?: GeminiBatchScreeningResponse;
}

export class GeminiAsyncScreeningRunService {
  private readonly activeRuns = new Set<string>();

  constructor(
    private readonly client = new GeminiClient(),
    private readonly screeningService = new GeminiScreeningService(client)
  ) {}

  public async createRun(
    request: GeminiBatchScreeningRunRequest,
    actingUserId: string
  ): Promise<GeminiBatchScreeningRunStatusResponse> {
    if (!mongoose.Types.ObjectId.isValid(request.jobId)) {
      throw new HttpError(400, "jobId must be a valid Mongo ObjectId.");
    }

    const shortlistCount = Math.floor(Number(request.shortlistCount));
    if (!Number.isFinite(shortlistCount) || shortlistCount <= 0) {
      throw new HttpError(400, "shortlistCount must be a positive integer.");
    }

    const job = await Job.findById(request.jobId);
    if (!job) {
      throw new HttpError(404, `Job not found for jobId ${request.jobId}.`);
    }

    const applicantQuery = {
      ...buildApplicantQuery({
        job: job._id,
        filters: request.filters,
        applicantIds: request.applicantIds,
        applicantEmails: request.applicantEmails,
      } as IScreeningRun),
    };
    const requestedApplicants = await Applicant.countDocuments(applicantQuery);

    if (requestedApplicants === 0) {
      throw new HttpError(
        404,
        "No applicants matched this screening request. Try removing filters or ingesting parsed applicants first."
      );
    }

    const chunkSize = Math.max(
      1,
      Math.floor(Number(process.env.GEMINI_ASYNC_DB_CHUNK_SIZE) || DEFAULT_ASYNC_DB_CHUNK_SIZE)
    );

    const run = await ScreeningRun.create({
      job: job._id,
      jobTitle: job.title,
      runName: (request.runName || `RUN-${Date.now()}`).trim(),
      status: "queued",
      shortlistCount: Math.min(shortlistCount, requestedApplicants),
      requestedApplicants,
      processedApplicants: 0,
      scoredApplicants: 0,
      failedApplicants: 0,
      processedChunks: 0,
      failedChunks: 0,
      chunkSize,
      instructions: request.instructions || "",
      temperature: request.temperature,
      applicantIds: request.applicantIds || [],
      applicantEmails: request.applicantEmails || [],
      filters: request.filters,
      geminiModel: this.client.getModel(),
      failureReasons: [],
      createdBy: new mongoose.Types.ObjectId(actingUserId),
    });

    this.scheduleRun(run._id.toString());

    return this.toRunStatusResponse(run);
  }

  public async getRunStatus(
    runId: string,
    actingUserId: string
  ): Promise<GeminiBatchScreeningRunStatusResponse> {
    if (!mongoose.Types.ObjectId.isValid(runId)) {
      throw new HttpError(400, "runId must be a valid Mongo ObjectId.");
    }

    const run = await ScreeningRun.findOne({
      _id: runId,
      createdBy: new mongoose.Types.ObjectId(actingUserId),
    });

    if (!run) {
      throw new HttpError(404, "Screening run not found.");
    }

    return this.toRunStatusResponse(run);
  }

  public async resumePendingRuns(): Promise<void> {
    const resumableRuns = await ScreeningRun.find({
      status: { $in: ["queued", "running"] },
    }).select("_id");

    resumableRuns.forEach((run) => {
      this.scheduleRun(run._id.toString());
    });
  }

  private scheduleRun(runId: string): void {
    if (this.activeRuns.has(runId)) {
      return;
    }

    this.activeRuns.add(runId);
    setTimeout(() => {
      void this.processRun(runId).finally(() => {
        this.activeRuns.delete(runId);
      });
    }, 0);
  }

  private async processRun(runId: string): Promise<void> {
    const run = await ScreeningRun.findById(runId);
    if (!run) {
      return;
    }

    run.status = "running";
    run.error = undefined;
    run.failureReasons = [];
    run.processedApplicants = 0;
    run.scoredApplicants = 0;
    run.failedApplicants = 0;
    run.processedChunks = 0;
    run.failedChunks = 0;
    run.screeningStartedAt = run.screeningStartedAt || new Date();
    run.screeningCompletedAt = undefined;
    await run.save();

    await ScreeningResult.deleteMany({ run: run._id });

    try {
      const job = await Job.findById(run.job);
      if (!job) {
        throw new Error("Job not found for this screening run.");
      }

      const applicantQuery = buildApplicantQuery(run);
      const cursor = Applicant.find(applicantQuery).sort({ createdAt: -1 }).cursor();
      let chunkDocs: IApplicant[] = [];

      for await (const applicantDoc of cursor) {
        chunkDocs.push(applicantDoc as IApplicant);

        if (chunkDocs.length >= run.chunkSize) {
          await this.processChunk(run, job, chunkDocs);
          chunkDocs = [];
        }
      }

      if (chunkDocs.length > 0) {
        await this.processChunk(run, job, chunkDocs);
      }

      await this.finalizeRun(run, job);
    } catch (error) {
      const latest = await ScreeningRun.findById(run._id);
      if (!latest) {
        return;
      }

      latest.status = "failed";
      latest.error = error instanceof Error ? error.message : String(error);
      latest.screeningCompletedAt = new Date();
      latest.failureReasons = uniqueFailureReasons([
        ...latest.failureReasons,
        latest.error,
      ]);
      await latest.save();
    }
  }

  private async processChunk(run: IScreeningRun, job: IJob, applicantDocs: IApplicant[]): Promise<void> {
    const applicants = applicantDocs.map(toBatchApplicantFromModel);
    const failureReason = "Gemini did not return an evaluation for this applicant.";

    try {
      const response = await this.screeningService.screenBatch({
        job: toBatchJobFromModel(job),
        applicants,
        shortlistCount: 0,
        instructions: run.instructions,
        temperature: run.temperature,
      });

      await ScreeningResult.bulkWrite(
        response.screeningResults.map((entry) => ({
          updateOne: {
            filter: {
              run: run._id,
              applicantEmail: normalizeEmail(entry.applicantEmail),
            },
            update: {
              $set: {
                fullName: entry.fullName,
                matchScore: entry.matchScore,
                confidenceScore: entry.confidenceScore,
                skillsScore: entry.skillsScore,
                experienceScore: entry.experienceScore,
                educationScore: entry.educationScore,
                relevanceScore: entry.relevanceScore,
                criterionAssessments: entry.criterionAssessments || [],
                criticalRequirementGap: entry.criticalRequirementGap,
                strengths: entry.strengths || [],
                gapsOrRisks: entry.gapsOrRisks || [],
                finalRecommendation: entry.finalRecommendation,
                summaryExplanation: entry.summaryExplanation || "",
              },
              $setOnInsert: {
                run: run._id,
                applicantEmail: normalizeEmail(entry.applicantEmail),
              },
            },
            upsert: true,
          },
        }))
      );

      const refreshedRun = await ScreeningRun.findById(run._id);
      if (!refreshedRun) {
        return;
      }

      refreshedRun.processedApplicants += applicantDocs.length;
      refreshedRun.scoredApplicants += Math.max(
        0,
        applicantDocs.length - (response.meta?.unscoredApplicants ?? 0)
      );
      refreshedRun.failedApplicants += response.meta?.unscoredApplicants ?? 0;
      refreshedRun.processedChunks += 1;
      refreshedRun.failedChunks += response.meta?.failedChunks ?? 0;
      refreshedRun.failureReasons = uniqueFailureReasons([
        ...refreshedRun.failureReasons,
        ...(response.meta?.failureReasons || []),
      ]);
      await refreshedRun.save();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const failedEntries = applicants.map((applicant) => toFailureResult(applicant, reason || failureReason));

      await ScreeningResult.bulkWrite(
        failedEntries.map((entry) => ({
          updateOne: {
            filter: {
              run: run._id,
              applicantEmail: normalizeEmail(entry.applicantEmail),
            },
            update: {
              $set: {
                fullName: entry.fullName,
                matchScore: entry.matchScore,
                confidenceScore: entry.confidenceScore,
                skillsScore: entry.skillsScore,
                experienceScore: entry.experienceScore,
                educationScore: entry.educationScore,
                relevanceScore: entry.relevanceScore,
                criterionAssessments: [],
                criticalRequirementGap: true,
                strengths: [],
                gapsOrRisks: entry.gapsOrRisks,
                finalRecommendation: entry.finalRecommendation,
                summaryExplanation: "",
              },
              $setOnInsert: {
                run: run._id,
                applicantEmail: normalizeEmail(entry.applicantEmail),
              },
            },
            upsert: true,
          },
        }))
      );

      const refreshedRun = await ScreeningRun.findById(run._id);
      if (!refreshedRun) {
        return;
      }

      refreshedRun.processedApplicants += applicantDocs.length;
      refreshedRun.failedApplicants += applicantDocs.length;
      refreshedRun.processedChunks += 1;
      refreshedRun.failedChunks += 1;
      refreshedRun.failureReasons = uniqueFailureReasons([
        ...refreshedRun.failureReasons,
        reason,
      ]);
      await refreshedRun.save();
    }
  }

  private async finalizeRun(run: IScreeningRun, job: IJob): Promise<void> {
    const rankingCursor = ScreeningResult.find({ run: run._id })
      .sort({
        matchScore: -1,
        skillsScore: -1,
        experienceScore: -1,
        relevanceScore: -1,
        confidenceScore: -1,
        applicantEmail: 1,
        fullName: 1,
      })
      .cursor();

    let rank = 0;
    const rankingOps: Array<{
      updateOne: {
        filter: { _id: mongoose.Types.ObjectId };
        update: { $set: { candidateRank: number } };
      };
    }> = [];

    for await (const result of rankingCursor) {
      rank += 1;
      rankingOps.push({
        updateOne: {
          filter: { _id: (result as any)._id },
          update: { $set: { candidateRank: rank } },
        },
      });

      if (rankingOps.length >= 500) {
        await ScreeningResult.bulkWrite(rankingOps);
        rankingOps.length = 0;
      }
    }

    if (rankingOps.length > 0) {
      await ScreeningResult.bulkWrite(rankingOps);
    }

    const rankedResults = await ScreeningResult.find({ run: run._id })
      .sort({ candidateRank: 1 })
      .lean();
    const rankedResultEntries = rankedResults.map((entry) => toResponseEntry(entry as any));

    const shortlistResults = rankedResultEntries
      .filter((entry) => isBatchEntryShortlistEligible(entry))
      .slice(0, run.shortlistCount);

    const explanationTargets = (() => {
      const maxTargets = Math.min(
        rankedResultEntries.length,
        Math.max(0, run.shortlistCount) + ASYNC_EXPLANATION_BUFFER
      );

      if (maxTargets === 0) {
        return [] as GeminiBatchScreeningResultEntry[];
      }

      const selected: GeminiBatchScreeningResultEntry[] = [];
      const selectedEmails = new Set<string>();

      for (const entry of shortlistResults) {
        const emailKey = normalizeEmail(entry.applicantEmail);

        if (selectedEmails.has(emailKey)) {
          continue;
        }

        selected.push(entry);
        selectedEmails.add(emailKey);

        if (selected.length >= maxTargets) {
          return selected.slice(0, maxTargets);
        }
      }

      for (const entry of rankedResultEntries) {
        const emailKey = normalizeEmail(entry.applicantEmail);

        if (selectedEmails.has(emailKey)) {
          continue;
        }

        selected.push(entry);
        selectedEmails.add(emailKey);

        if (selected.length >= maxTargets) {
          break;
        }
      }

      return selected;
    })();
    const explanationTargetEmails = explanationTargets.map((entry) => normalizeEmail(entry.applicantEmail));
    const shortlistApplicantDocs = await Applicant.find({
      job: run.job,
      email: { $in: explanationTargetEmails },
    });
    const applicantByEmail = new Map(
      shortlistApplicantDocs.map((doc) => [normalizeEmail(doc.email), toBatchApplicantFromModel(doc)])
    );
    const rankedExplanationApplicants = explanationTargets
      .map((entry) => applicantByEmail.get(normalizeEmail(entry.applicantEmail)))
      .filter((entry): entry is GeminiBatchApplicant => Boolean(entry));

    let enrichedShortlist: GeminiBatchShortlistEntry[] = shortlistResults.map((entry) => ({
      ...entry,
      pipelineStatus: "shortlisted",
    }));
    const explanationByEmail = new Map<string, Pick<GeminiBatchScreeningResultEntry, "strengths" | "gapsOrRisks" | "summaryExplanation">>();
    let model = run.geminiModel || this.client.getModel();

    if (rankedExplanationApplicants.length > 0) {
      const enrichedResponse = await this.screeningService.screenBatch({
        job: toBatchJobFromModel(job),
        applicants: rankedExplanationApplicants,
        shortlistCount: Math.min(run.shortlistCount, rankedExplanationApplicants.length),
        instructions: run.instructions,
        temperature: run.temperature,
      });

      enrichedResponse.screeningResults.forEach((entry) => {
        explanationByEmail.set(normalizeEmail(entry.applicantEmail), {
          strengths: entry.strengths || [],
          gapsOrRisks: entry.gapsOrRisks || [],
          summaryExplanation: entry.summaryExplanation || "",
        });
      });

      enrichedShortlist = shortlistResults.map((entry) => {
        const explanation = explanationByEmail.get(normalizeEmail(entry.applicantEmail));
        return explanation
          ? {
              ...entry,
              strengths: explanation.strengths || entry.strengths,
              gapsOrRisks: explanation.gapsOrRisks || entry.gapsOrRisks,
              summaryExplanation: explanation.summaryExplanation || entry.summaryExplanation,
              pipelineStatus: "shortlisted",
            }
          : {
              ...entry,
              pipelineStatus: "shortlisted",
            };
      });

      if (explanationByEmail.size > 0) {
        await ScreeningResult.bulkWrite(
          Array.from(explanationByEmail.entries()).map(([applicantEmail, explanation]) => ({
            updateOne: {
              filter: {
                run: run._id,
                applicantEmail,
              },
              update: {
                $set: {
                  strengths: explanation.strengths || [],
                  gapsOrRisks: explanation.gapsOrRisks || [],
                  summaryExplanation: explanation.summaryExplanation || "",
                },
              },
            },
          }))
        );
      }

      model = enrichedResponse.model || model;
    }

    const persistedScreeningResults = await ScreeningResult.find({ run: run._id })
      .sort({ candidateRank: 1 })
      .limit(
        Math.max(
          run.shortlistCount,
          Number(process.env.GEMINI_PERSISTED_SCREENING_RESULT_LIMIT) || DEFAULT_PERSISTED_SCREENING_RESULT_LIMIT
        )
      )
      .lean();

    const screeningResults = persistedScreeningResults.map((entry) => {
      const explanation = explanationByEmail.get(normalizeEmail(entry.applicantEmail));
      return explanation
        ? toResponseEntry({
            ...(entry as any),
            strengths: explanation.strengths,
            gapsOrRisks: explanation.gapsOrRisks,
            summaryExplanation: explanation.summaryExplanation,
          })
        : toResponseEntry(entry as any);
    });

    const completedAt = new Date();
    const shortlist = await Shortlist.create({
      job: run.job,
      screeningRun: run._id,
      jobTitle: run.jobTitle,
      runName: run.runName,
      geminiModel: model,
      totalApplicants: run.requestedApplicants,
      shortlistCount: enrichedShortlist.length,
      weightCriteria: deriveScoringWeightCriteria(toBatchJobFromModel(job)).map((criterion) => ({
        id: criterion.id || criterion.label,
        label: criterion.label,
        value: criterion.value,
      })),
      screeningResults,
      shortlist: enrichedShortlist,
      instructions: run.instructions || "",
      screeningStartedAt: run.screeningStartedAt,
      screeningCompletedAt: completedAt,
      screeningDurationSeconds: run.screeningStartedAt
        ? Math.round((completedAt.getTime() - run.screeningStartedAt.getTime()) / 1000)
        : undefined,
      createdBy: run.createdBy,
    });

    const refreshedRun = await ScreeningRun.findById(run._id);
    if (!refreshedRun) {
      return;
    }

    refreshedRun.geminiModel = model;
    refreshedRun.shortlistDocument = shortlist._id;
    refreshedRun.screeningCompletedAt = completedAt;
    refreshedRun.status =
      refreshedRun.failedApplicants > 0 || refreshedRun.failedChunks > 0 ? "partial" : "completed";
    await refreshedRun.save();
  }

  private async loadResponseFromShortlist(run: IScreeningRun): Promise<GeminiBatchScreeningResponse | undefined> {
    if (!run.shortlistDocument) {
      return undefined;
    }

    const shortlist = await Shortlist.findById(run.shortlistDocument).lean();
    if (!shortlist) {
      return undefined;
    }

    const meta: GeminiBatchScreeningMeta = {
      requestedApplicants: run.requestedApplicants,
      processedApplicants: run.processedApplicants,
      maxApplicants: run.requestedApplicants,
      truncatedApplicants: false,
      unscoredApplicants: run.failedApplicants,
      failedChunks: run.failedChunks,
      failureReasons: run.failureReasons || [],
    };

    return {
      jobTitle: shortlist.jobTitle,
      weightCriteria: shortlist.weightCriteria,
      shortlistCount: shortlist.shortlistCount,
      totalApplicants: shortlist.totalApplicants,
      screeningResults: (shortlist.screeningResults || []).map((entry) => toResponseEntry(entry as any)),
      shortlist: (shortlist.shortlist || []).map((entry) => ({
        ...toResponseEntry(entry as any),
        pipelineStatus: (entry as any).pipelineStatus || "shortlisted",
      })),
      model: shortlist.geminiModel,
      meta,
    };
  }

  private async toRunStatusResponse(
    run: IScreeningRun
  ): Promise<GeminiBatchScreeningRunStatusResponse> {
    const response =
      run.status === "completed" || run.status === "partial"
        ? await this.loadResponseFromShortlist(run)
        : undefined;

    return {
      id: run._id.toString(),
      jobId: run.job.toString(),
      jobTitle: run.jobTitle,
      runName: run.runName,
      status: run.status,
      shortlistCount: run.shortlistCount,
      requestedApplicants: run.requestedApplicants,
      processedApplicants: run.processedApplicants,
      scoredApplicants: run.scoredApplicants,
      failedApplicants: run.failedApplicants,
      processedChunks: run.processedChunks,
      failedChunks: run.failedChunks,
      chunkSize: run.chunkSize,
      model: run.geminiModel,
      failureReasons: run.failureReasons || [],
      error: run.error,
      screeningStartedAt: run.screeningStartedAt?.toISOString(),
      screeningCompletedAt: run.screeningCompletedAt?.toISOString(),
      screeningDurationSeconds: screeningDurationSeconds(run),
      savedShortlistId: run.shortlistDocument?.toString(),
      response,
    };
  }
}

export const geminiAsyncScreeningRunService = new GeminiAsyncScreeningRunService();
