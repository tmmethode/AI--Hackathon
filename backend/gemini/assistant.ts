import mongoose from "mongoose";
import Applicant, { IApplicant } from "../models/Applicant";
import Job, { IJob } from "../models/Job";
import Shortlist, { IShortlist } from "../models/Shortlist";
import { HttpError } from "../utils/HttpError";
import { GeminiClient } from "./client";
import {
  buildRecruiterAssistantPrompt,
  GEMINI_RECRUITER_ASSISTANT_SYSTEM_INSTRUCTION,
} from "./prompts";
import {
  GeminiBatchApplicant,
  GeminiBatchJob,
  GeminiRecruiterAssistantContext,
  GeminiRecruiterAssistantContextSummary,
  GeminiRecruiterAssistantRequest,
  GeminiRecruiterAssistantResponse,
  GeminiRecruiterAssistantShortlistContext,
} from "./types";

const DEFAULT_APPLICANT_LIMIT = 25;
const MAX_APPLICANT_LIMIT = 60;
const MAX_HISTORY_MESSAGES = 30;
const MAX_HISTORY_CHARS = 24_000;
const MAX_HISTORY_TURN_CHARS = 1_500;
const MAX_TEXT_FIELD_CHARS = 500;
const MAX_LIST_FIELD_ITEMS = 12;
const WORKSPACE_JOB_STATS_LIMIT = 6;
const WORKSPACE_RUN_COMPARISON_LIMIT = 6;

function normalizeEmail(email?: string): string {
  return (email || "").trim().toLowerCase();
}

function dedupeEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const email of emails.map(normalizeEmail)) {
    if (!email || seen.has(email)) {
      continue;
    }
    seen.add(email);
    ordered.push(email);
  }

  return ordered;
}

function collectShortlistPriorityEmails(shortlist: IShortlist): string[] {
  return dedupeEmails([
    ...(shortlist.shortlist || []).map((entry) => entry.applicantEmail),
    ...(shortlist.screeningResults || []).map((entry) => entry.applicantEmail),
  ]);
}

function sortApplicantsByEmailPriority(
  applicants: IApplicant[],
  priorityEmails: string[]
): IApplicant[] {
  if (priorityEmails.length === 0) {
    return applicants;
  }

  const priorityIndex = new Map(priorityEmails.map((email, index) => [email, index]));

  return [...applicants].sort((left, right) => {
    const leftRank = priorityIndex.get(normalizeEmail(left.email));
    const rightRank = priorityIndex.get(normalizeEmail(right.email));

    if (leftRank === undefined && rightRank === undefined) {
      return 0;
    }
    if (leftRank === undefined) {
      return 1;
    }
    if (rightRank === undefined) {
      return -1;
    }
    return leftRank - rightRank;
  });
}

function formatDateLabel(value?: Date): string {
  if (!value) {
    return "unknown date";
  }

  return value.toISOString().slice(0, 10);
}

function hydrateShortlistEntriesFromScreening(
  shortlist: IShortlist
): GeminiRecruiterAssistantShortlistContext["shortlist"] {
  const screeningByEmail = new Map(
    (shortlist.screeningResults || []).map((entry) => [normalizeEmail(entry.applicantEmail), entry])
  );

  return shortlist.shortlist?.map((entry) => {
    const source = screeningByEmail.get(normalizeEmail(entry.applicantEmail));

    return {
      candidateRank: entry.candidateRank,
      applicantEmail: entry.applicantEmail,
      fullName: entry.fullName,
      matchScore: entry.matchScore,
      confidenceScore: entry.confidenceScore ?? source?.confidenceScore ?? 0,
      skillsScore: entry.skillsScore ?? source?.skillsScore ?? 0,
      experienceScore: entry.experienceScore ?? source?.experienceScore ?? 0,
      educationScore: entry.educationScore ?? source?.educationScore ?? 0,
      relevanceScore: entry.relevanceScore ?? source?.relevanceScore ?? 0,
      criticalRequirementGap: entry.criticalRequirementGap ?? source?.criticalRequirementGap ?? false,
      strengths: entry.strengths || [],
      gapsOrRisks: entry.gapsOrRisks || [],
      finalRecommendation: entry.finalRecommendation,
      summaryExplanation: entry.summaryExplanation,
    };
  });
}

function buildWorkspaceOverviewNote(input: {
  totalJobs: number;
  activeJobs: number;
  totalShortlists: number;
  topJobsByApplicants: IJob[];
  recentJobs: IJob[];
  recentShortlists: IShortlist[];
}): string | undefined {
  const lines: string[] = [
    "WORKSPACE OVERVIEW:",
    `- Jobs: ${input.totalJobs} total (${input.activeJobs} active)`,
    `- Shortlist runs: ${input.totalShortlists} total`,
  ];

  if (input.recentJobs.length > 0) {
    lines.push("Recent jobs:");
    for (const job of input.recentJobs) {
      lines.push(
        `- ${job.title} | ${job.department || "No department"} | ${job.status} | created ${formatDateLabel(job.createdAt)}`
      );
    }
  }

  if (input.topJobsByApplicants.length > 0) {
    lines.push("Job pipeline comparison (by applicant volume):");
    for (const job of input.topJobsByApplicants) {
      lines.push(
        `- ${job.title} (${job.department || "No department"}) | ${job.applicantsCount || 0} applicants | status ${job.status}`
      );
    }
  }

  if (input.recentShortlists.length > 0) {
    lines.push("Recent shortlist runs:");
    for (const shortlist of input.recentShortlists) {
      const topCandidate =
        shortlist.shortlist?.find((entry) => entry.candidateRank === 1)?.fullName ||
        shortlist.shortlist?.[0]?.fullName ||
        "Top candidate not saved";
      lines.push(
        `- ${shortlist.runName} for ${shortlist.jobTitle} | shortlisted ${shortlist.shortlistCount}/${shortlist.totalApplicants} | top candidate: ${topCandidate} | created ${formatDateLabel(shortlist.createdAt)}`
      );
    }
  }

  return lines.length > 0 ? lines.join("\n") : undefined;
}

function formatScore(value: number | undefined): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  return Number(value).toFixed(1);
}

function computeAverageMatchScore(shortlist: IShortlist): number | undefined {
  const entries = shortlist.screeningResults || shortlist.shortlist || [];
  if (!entries.length) {
    return undefined;
  }
  const sum = entries.reduce((acc, entry) => acc + (entry.matchScore || 0), 0);
  return sum / entries.length;
}

function buildJobAnalyticsNote(input: {
  job?: IJob;
  totalApplicantsForJob?: number;
  latestRunsForJob: IShortlist[];
  selectedShortlistId?: string;
}): string | undefined {
  if (!input.job && !input.latestRunsForJob.length && !Number.isFinite(input.totalApplicantsForJob)) {
    return undefined;
  }

  const lines: string[] = ["JOB ANALYTICS:"];

  if (input.job) {
    lines.push(
      `- ${input.job.title} (${input.job.department || "No department"}) | status ${input.job.status} | total applicants ${input.totalApplicantsForJob ?? input.job.applicantsCount ?? 0}`
    );
  } else if (Number.isFinite(input.totalApplicantsForJob)) {
    lines.push(`- Total applicants for selected job: ${input.totalApplicantsForJob}`);
  }

  if (input.latestRunsForJob.length > 0) {
    lines.push("Recent shortlist run comparison:");

    for (const run of input.latestRunsForJob) {
      const avgMatch = computeAverageMatchScore(run);
      const topCandidate =
        run.shortlist?.find((entry) => entry.candidateRank === 1)?.fullName ||
        run.shortlist?.[0]?.fullName ||
        "Top candidate not saved";
      const marker = input.selectedShortlistId === run._id.toString() ? " (selected)" : "";
      lines.push(
        `- ${run.runName}${marker} | created ${formatDateLabel(run.createdAt)} | shortlisted ${run.shortlistCount}/${run.totalApplicants} | avg match ${formatScore(avgMatch)} | top candidate: ${topCandidate}`
      );
    }
  }

  return lines.join("\n");
}

function toBatchJobFromModel(job: IJob): GeminiBatchJob {
  return {
    id: job._id.toString(),
    title: job.title,
    department: job.department,
    location: job.location,
    locationPolicy: job.locationPolicy,
    employmentType: job.employmentType,
    salaryBand: job.salaryBand,
    summary: job.summary,
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
  const trimText = (value?: string, max = MAX_TEXT_FIELD_CHARS): string | undefined => {
    if (!value) return undefined;
    const normalized = value.trim();
    return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
  };

  const capItems = <T>(items?: T[], max = MAX_LIST_FIELD_ITEMS): T[] | undefined => {
    if (!items?.length) return undefined;
    return items.slice(0, max);
  };

  return {
    firstName: trimText(applicant.firstName, 80),
    lastName: trimText(applicant.lastName, 80),
    email: applicant.email,
    headline: trimText(applicant.headline, 160),
    bio: trimText(applicant.bio, 450),
    location: trimText(applicant.location, 120),
    skills: capItems(applicant.skills)?.map((skill) => ({
      name: skill.name,
      level: skill.level,
      yearsOfExperience: skill.yearsOfExperience,
    })),
    languages: capItems(applicant.languages, 8)?.map((language) => ({
      name: language.name,
      proficiency: language.proficiency,
    })),
    experience: capItems(applicant.experience, 8)?.map((entry) => ({
      company: entry.company,
      role: entry.role,
      startDate: entry.startDate,
      endDate: entry.endDate,
      description: trimText(entry.description, 320),
      technologies: capItems(entry.technologies, 8),
      isCurrent: entry.isCurrent,
    })),
    education: capItems(applicant.education, 6)?.map((entry) => ({
      institution: entry.institution,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy,
      startYear: entry.startYear,
      endYear: entry.endYear,
    })),
    certifications: capItems(applicant.certifications, 8)?.map((entry) => ({
      name: entry.name,
      issuer: entry.issuer,
      issueDate: entry.issueDate,
    })),
    projects: capItems(applicant.projects, 6)?.map((project) => ({
      name: project.name,
      description: trimText(project.description, 320),
      technologies: capItems(project.technologies, 8),
      role: project.role,
      link: project.link,
      startDate: project.startDate,
      endDate: project.endDate,
    })),
    availability: applicant.availability
      ? {
          status: applicant.availability.status,
          type: applicant.availability.type,
          startDate: applicant.availability.startDate,
        }
      : undefined,
    socialLinks: applicant.socialLinks
      ? {
          linkedin: applicant.socialLinks.linkedin,
          github: applicant.socialLinks.github,
          portfolio: applicant.socialLinks.portfolio,
        }
      : undefined,
  };
}

function trimHistory(
  history: GeminiRecruiterAssistantRequest["history"]
): {
  trimmedHistory: Array<{ role: "user" | "assistant"; content: string }>;
  truncatedHistory: boolean;
} {
  if (!history?.length) {
    return { trimmedHistory: [], truncatedHistory: false };
  }

  const normalized = history
    .filter((turn) => turn.content?.trim())
    .map((turn) => ({
      role: turn.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content:
        turn.content.length > MAX_HISTORY_TURN_CHARS
          ? `${turn.content.slice(0, MAX_HISTORY_TURN_CHARS)}…`
          : turn.content,
    }));

  if (normalized.length === 0) {
    return { trimmedHistory: [], truncatedHistory: false };
  }

  let truncatedHistory = false;
  const recentByCount =
    normalized.length > MAX_HISTORY_MESSAGES
      ? (truncatedHistory = true, normalized.slice(-MAX_HISTORY_MESSAGES))
      : normalized;

  let totalChars = 0;
  const recentWithinChars: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (let index = recentByCount.length - 1; index >= 0; index -= 1) {
    const turn = recentByCount[index];
    const turnChars = turn.content.length;
    if (totalChars + turnChars > MAX_HISTORY_CHARS && recentWithinChars.length > 0) {
      truncatedHistory = true;
      break;
    }
    if (turnChars > MAX_HISTORY_CHARS) {
      truncatedHistory = true;
      continue;
    }
    recentWithinChars.push(turn);
    totalChars += turnChars;
  }

  if (recentWithinChars.length < recentByCount.length) {
    truncatedHistory = true;
  }

  recentWithinChars.reverse();
  return { trimmedHistory: recentWithinChars, truncatedHistory };
}

function toShortlistContextFromModel(shortlist: IShortlist): GeminiRecruiterAssistantShortlistContext {
  return {
    runName: shortlist.runName,
    jobTitle: shortlist.jobTitle,
    department: shortlist.department,
    model: shortlist.geminiModel,
    totalApplicants: shortlist.totalApplicants,
    shortlistCount: shortlist.shortlistCount,
    instructions: shortlist.instructions,
    screeningResults: shortlist.screeningResults?.map((entry) => ({
      candidateRank: entry.candidateRank,
      applicantEmail: entry.applicantEmail,
      fullName: entry.fullName,
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
      summaryExplanation: entry.summaryExplanation,
    })),
    shortlist: hydrateShortlistEntriesFromScreening(shortlist),
  };
}

export class GeminiRecruiterAssistantService {
  constructor(private readonly client: GeminiClient) {}

  public async ask(request: GeminiRecruiterAssistantRequest): Promise<GeminiRecruiterAssistantResponse> {
    if (!this.client.isConfigured()) {
      throw new HttpError(503, "GEMINI_API_KEY is not configured");
    }

    const message = (request.message || "").trim();
    if (!message) {
      throw new HttpError(400, "message is required");
    }

    if ("context" in (request as unknown as Record<string, unknown>)) {
      throw new HttpError(
        400,
        "Inline assistant context is not accepted. Provide only lightweight selectors and let the server load context."
      );
    }

    const includeApplicants = request.includeApplicants ?? true;
    const rawLimit = Number(request.applicantLimit);
    const applicantLimit = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_APPLICANT_LIMIT)
      : DEFAULT_APPLICANT_LIMIT;

    const history = trimHistory(request.history);
    const resolved = await this.resolveContext(request, { includeApplicants, applicantLimit });

    const prompt = buildRecruiterAssistantPrompt({
      message,
      job: resolved.context.job,
      applicants: resolved.context.applicants,
      shortlist: resolved.context.shortlist,
      contextNote: resolved.context.contextNote,
    });

    // Build multi-turn conversation history for the Gemini API.
    // The DATA CONTEXT + current question go as the prompt (final user turn),
    // while previous conversation turns use proper user/model alternation.
    const conversationHistory = history.trimmedHistory;

    const generation = await this.client.generateText({
      prompt,
      systemInstruction: GEMINI_RECRUITER_ASSISTANT_SYSTEM_INSTRUCTION,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      responseMimeType: "text/plain",
      topP: 0.85,
      conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
    });

    return {
      reply: generation.text,
      model: generation.model,
      usage: generation.usage,
      contextUsed: resolved.summary,
    };
  }

  private async resolveContext(
    request: GeminiRecruiterAssistantRequest,
    opts: { includeApplicants: boolean; applicantLimit: number }
  ): Promise<{ context: GeminiRecruiterAssistantContext; summary: GeminiRecruiterAssistantContextSummary }> {
    let usedDatabase = false;

    let job: GeminiBatchJob | undefined;
    let shortlistContext: GeminiRecruiterAssistantShortlistContext | undefined;
    let dbApplicants: GeminiBatchApplicant[] | undefined;

    let resolvedJobId: string | undefined = request.jobId;
    let resolvedShortlistId: string | undefined;
    let truncatedApplicants = false;
    let shortlistedApplicantsPrioritized = false;
    let shortlistPriorityEmails: string[] = [];
    let jobDocForAnalytics: IJob | undefined;

    if (request.shortlistId) {
      if (!mongoose.Types.ObjectId.isValid(request.shortlistId)) {
        throw new HttpError(400, "Invalid shortlistId");
      }

      const shortlistDoc = await Shortlist.findById(request.shortlistId).lean<IShortlist | null>();
      if (!shortlistDoc) {
        throw new HttpError(404, "Shortlist not found");
      }

      usedDatabase = true;
      resolvedShortlistId = shortlistDoc._id.toString();
      shortlistContext = toShortlistContextFromModel(shortlistDoc as IShortlist);
      shortlistPriorityEmails = collectShortlistPriorityEmails(shortlistDoc as IShortlist);
      resolvedJobId = resolvedJobId || shortlistDoc.job.toString();
    }

    if (!job && resolvedJobId) {
      if (!mongoose.Types.ObjectId.isValid(resolvedJobId)) {
        throw new HttpError(400, "Invalid jobId");
      }

      const jobDoc = await Job.findById(resolvedJobId).lean<IJob | null>();
      if (!jobDoc) {
        throw new HttpError(404, "Job not found");
      }
      usedDatabase = true;
      jobDocForAnalytics = jobDoc as IJob;
      job = toBatchJobFromModel(jobDocForAnalytics);
    }

    if (opts.includeApplicants && resolvedJobId) {
      const jobObjectId = new mongoose.Types.ObjectId(resolvedJobId);
      const requestedApplicantEmails = dedupeEmails(request.applicantEmails || []);
      const priorityEmails =
        requestedApplicantEmails.length > 0 ? requestedApplicantEmails : shortlistPriorityEmails;
      const applicantDocs: IApplicant[] = [];
      const includedEmails = new Set<string>();

      if (priorityEmails.length > 0) {
        const prioritizedDocs = sortApplicantsByEmailPriority(
          await Applicant.find({
            job: jobObjectId,
            email: { $in: priorityEmails },
          }).lean<IApplicant[]>(),
          priorityEmails
        );

        const cappedPrioritizedDocs = prioritizedDocs.slice(0, opts.applicantLimit);
        if (prioritizedDocs.length > cappedPrioritizedDocs.length || priorityEmails.length > opts.applicantLimit) {
          truncatedApplicants = true;
        }

        for (const doc of cappedPrioritizedDocs) {
          const email = normalizeEmail(doc.email);
          if (!email || includedEmails.has(email)) {
            continue;
          }
          includedEmails.add(email);
          applicantDocs.push(doc);
        }

        shortlistedApplicantsPrioritized =
          requestedApplicantEmails.length === 0 && shortlistPriorityEmails.length > 0 && applicantDocs.length > 0;
      }

      if (requestedApplicantEmails.length === 0 && applicantDocs.length < opts.applicantLimit) {
        const remainingDocs = await Applicant.find({
          job: jobObjectId,
          ...(includedEmails.size > 0 ? { email: { $nin: Array.from(includedEmails) } } : {}),
        })
          .sort({ createdAt: -1 })
          .limit(opts.applicantLimit - applicantDocs.length + 1)
          .lean<IApplicant[]>();

        if (remainingDocs.length > opts.applicantLimit - applicantDocs.length) {
          truncatedApplicants = true;
          remainingDocs.length = opts.applicantLimit - applicantDocs.length;
        }

        applicantDocs.push(...remainingDocs);
      }

      if (applicantDocs.length > 0) {
        usedDatabase = true;
        dbApplicants = applicantDocs.map((doc) => toBatchApplicantFromModel(doc as IApplicant));
      }
    }

    const applicants = dbApplicants;
    let jobAnalyticsNote: string | undefined;

    let workspaceOverviewNote: string | undefined;
    const hasResolvedStructuredContext = Boolean(job || applicants?.length || shortlistContext);
    if (resolvedJobId && mongoose.Types.ObjectId.isValid(resolvedJobId)) {
      const [totalApplicantsForJob, latestRunsForJob] = await Promise.all([
        Applicant.countDocuments({ job: new mongoose.Types.ObjectId(resolvedJobId) }),
        Shortlist.find({ job: new mongoose.Types.ObjectId(resolvedJobId) })
          .sort({ createdAt: -1 })
          .limit(WORKSPACE_RUN_COMPARISON_LIMIT)
          .lean<IShortlist[]>(),
      ]);

      jobAnalyticsNote = buildJobAnalyticsNote({
        job: jobDocForAnalytics,
        totalApplicantsForJob,
        latestRunsForJob,
        selectedShortlistId: resolvedShortlistId,
      });
      usedDatabase = true;
    }

    if (!hasResolvedStructuredContext) {
      const [totalJobs, activeJobs, totalShortlists, recentJobs, recentShortlists] = await Promise.all([
        Job.countDocuments(),
        Job.countDocuments({ status: "Active" }),
        Shortlist.countDocuments(),
        Job.find().sort({ createdAt: -1 }).limit(5).lean<IJob[]>(),
        Shortlist.find().sort({ createdAt: -1 }).limit(5).lean<IShortlist[]>(),
      ]);
      const topJobsByApplicants = await Job.find()
        .sort({ applicantsCount: -1, createdAt: -1 })
        .limit(WORKSPACE_JOB_STATS_LIMIT)
        .lean<IJob[]>();

      workspaceOverviewNote = buildWorkspaceOverviewNote({
        totalJobs,
        activeJobs,
        totalShortlists,
        topJobsByApplicants,
        recentJobs,
        recentShortlists,
      });
      usedDatabase = usedDatabase || Boolean(workspaceOverviewNote);
    }

    const contextNote = [
      jobAnalyticsNote,
      workspaceOverviewNote,
      shortlistedApplicantsPrioritized
        ? "Applicant profiles were prioritized from the selected shortlist's ranked and scored candidates before filling remaining slots from the same job."
        : undefined,
      truncatedApplicants
        ? `Applicant list truncated to the first ${opts.applicantLimit} of a larger set; ask to narrow by skill, score range, or email list for deeper review.`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n") || undefined;

    const context: GeminiRecruiterAssistantContext = {
      job,
      applicants,
      shortlist: shortlistContext,
      contextNote,
    };

    const anyData = Boolean(job || applicants?.length || shortlistContext || contextNote);
    const source: GeminiRecruiterAssistantContextSummary["source"] = anyData && usedDatabase ? "database" : "none";

    const summary: GeminiRecruiterAssistantContextSummary = {
      source,
      jobId: resolvedJobId,
      shortlistId: resolvedShortlistId,
      jobTitle: job?.title || shortlistContext?.jobTitle,
      applicantCount: applicants?.length || 0,
      screeningResultCount: shortlistContext?.screeningResults?.length || 0,
      shortlistCount: shortlistContext?.shortlist?.length || 0,
      truncatedApplicants,
    };

    return { context, summary };
  }
}
