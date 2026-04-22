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
  GeminiRecruiterApplicantAnalyticsSummary,
  GeminiRecruiterAssistantAnalyticsContext,
  GeminiRecruiterAssistantContext,
  GeminiRecruiterAssistantContextSummary,
  GeminiRecruiterAssistantRequest,
  GeminiRecruiterAssistantResponse,
  GeminiRecruiterRunAnalyticsSummary,
  GeminiRecruiterStageCounts,
  GeminiRecruiterAssistantShortlistContext,
} from "./types";

const DEFAULT_APPLICANT_LIMIT = 25;
const MAX_APPLICANT_LIMIT = 60;
const MAX_HISTORY_MESSAGES = 30;
const MAX_HISTORY_CHARS = 24_000;
const MAX_HISTORY_TURN_CHARS = 1_500;
const MAX_TEXT_FIELD_CHARS = 500;
const MAX_LIST_FIELD_ITEMS = 12;
const ANALYTICS_TOP_ITEMS = 5;

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

function tallyByKey(values: Array<string | undefined>, fallback = "Unknown"): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, raw) => {
    const key = (raw || fallback).trim() || fallback;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function stageCountsFromResults(
  results: Array<Pick<IShortlist["screeningResults"][number], "finalRecommendation">> | undefined
): GeminiRecruiterStageCounts {
  const counts: GeminiRecruiterStageCounts = {
    shortlisted: 0,
    rejected: 0,
    consider: 0,
    strongShortlist: 0,
    strongReject: 0,
  };

  for (const result of results || []) {
    if (result.finalRecommendation === "Shortlist") counts.shortlisted += 1;
    if (result.finalRecommendation === "Strong Shortlist") counts.strongShortlist += 1;
    if (result.finalRecommendation === "Consider") counts.consider += 1;
    if (result.finalRecommendation === "Reject") counts.rejected += 1;
    if (result.finalRecommendation === "Strong Reject") counts.strongReject += 1;
  }

  return counts;
}

function averageMatchScore(results: IShortlist["screeningResults"] | undefined): number | undefined {
  if (!results || results.length === 0) return undefined;
  const sum = results.reduce((acc, row) => acc + (row.matchScore || 0), 0);
  return Number((sum / results.length).toFixed(1));
}

function topLocationBreakdown(applicants: IApplicant[]): Array<{ location: string; count: number }> {
  const byLocation = tallyByKey(applicants.map((applicant) => applicant.location), "Unknown");
  return Object.entries(byLocation)
    .map(([location, count]) => ({ location, count }))
    .sort((left, right) => right.count - left.count || left.location.localeCompare(right.location))
    .slice(0, ANALYTICS_TOP_ITEMS);
}

function toRunAnalyticsSummary(shortlists: IShortlist[]): GeminiRecruiterRunAnalyticsSummary {
  return {
    totalRuns: shortlists.length,
    comparedRuns: shortlists.slice(0, ANALYTICS_TOP_ITEMS).map((shortlist) => ({
      shortlistId: shortlist._id.toString(),
      runName: shortlist.runName,
      jobId: shortlist.job?.toString(),
      jobTitle: shortlist.jobTitle,
      createdAt: shortlist.createdAt?.toISOString(),
      totalApplicants: shortlist.totalApplicants,
      shortlistCount: shortlist.shortlistCount,
      averageMatchScore: averageMatchScore(shortlist.screeningResults),
      recommendationCounts: stageCountsFromResults(shortlist.screeningResults),
    })),
  };
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
    const resolved = await this.resolveContext(request, {
      includeApplicants,
      applicantLimit,
      truncatedHistory: history.truncatedHistory,
    });

    const prompt = buildRecruiterAssistantPrompt({
      message,
      job: resolved.context.job,
      applicants: resolved.context.applicants,
      shortlist: resolved.context.shortlist,
      analytics: resolved.context.analytics,
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
    opts: { includeApplicants: boolean; applicantLimit: number; truncatedHistory: boolean }
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
    let selectedShortlistDoc: IShortlist | undefined;

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
      selectedShortlistDoc = shortlistDoc as IShortlist;
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
      job = toBatchJobFromModel(jobDoc as IJob);
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
    const analyticsScope: GeminiRecruiterAssistantAnalyticsContext["scope"] = resolvedShortlistId
      ? "shortlist"
      : resolvedJobId
        ? "job"
        : "workspace";

    const [allJobs, relevantShortlists, scopedApplicants, jobCountsByEmail] = await Promise.all([
      Job.find().select("_id title status applicantsCount").lean<IJob[]>(),
      resolvedJobId
        ? Shortlist.find({ job: resolvedJobId }).sort({ createdAt: -1 }).lean<IShortlist[]>()
        : Shortlist.find().sort({ createdAt: -1 }).limit(40).lean<IShortlist[]>(),
      resolvedJobId
        ? Applicant.find({ job: resolvedJobId })
            .select("email source ingestStatus location job")
            .lean<IApplicant[]>()
        : Applicant.find()
            .select("email source ingestStatus location job")
            .sort({ createdAt: -1 })
            .limit(300)
            .lean<IApplicant[]>(),
      Applicant.aggregate<{ _id: string; jobCount: number }>([
        { $group: { _id: "$email", jobCount: { $addToSet: "$job" } } },
        { $project: { _id: 1, jobCount: { $size: "$jobCount" } } },
        { $match: { jobCount: { $gt: 1 } } },
        { $sort: { jobCount: -1, _id: 1 } },
        { $limit: ANALYTICS_TOP_ITEMS },
      ]),
    ]);
    usedDatabase = true;

    const sortedJobsByApplicants = [...allJobs].sort(
      (left, right) => (right.applicantsCount || 0) - (left.applicantsCount || 0)
    );
    const jobsWithFewestApplicants = [...allJobs]
      .sort((left, right) => (left.applicantsCount || 0) - (right.applicantsCount || 0))
      .slice(0, ANALYTICS_TOP_ITEMS);

    const totalApplicantsAcrossJobs = allJobs.reduce((sum, jobDoc) => sum + (jobDoc.applicantsCount || 0), 0);
    const applicantsBySource = tallyByKey(scopedApplicants.map((entry) => entry.source), "Unknown");
    const applicantsByIngestStatus = tallyByKey(scopedApplicants.map((entry) => entry.ingestStatus), "Unknown");

    const multiEmailSet = new Set(jobCountsByEmail.map((entry) => normalizeEmail(entry._id)));
    const multiJobApplicantsTop: GeminiRecruiterApplicantAnalyticsSummary["multiJobApplicantsTop"] = [];
    if (multiEmailSet.size > 0) {
      const multiRows = await Applicant.aggregate<{
        _id: string;
        jobIds: mongoose.Types.ObjectId[];
        jobCount: number;
      }>([
        { $match: { email: { $in: Array.from(multiEmailSet) } } },
        { $group: { _id: "$email", jobIds: { $addToSet: "$job" } } },
        {
          $project: {
            _id: 1,
            jobIds: 1,
            jobCount: { $size: "$jobIds" },
          },
        },
        { $sort: { jobCount: -1, _id: 1 } },
        { $limit: ANALYTICS_TOP_ITEMS },
      ]);

      const jobIdSet = new Set(multiRows.flatMap((row) => row.jobIds.map((id) => id.toString())));
      const jobTitles = await Job.find({ _id: { $in: Array.from(jobIdSet) } })
        .select("_id title")
        .lean<Array<Pick<IJob, "_id" | "title">>>();
      const titleById = new Map(jobTitles.map((entry) => [entry._id.toString(), entry.title]));

      for (const row of multiRows) {
        multiJobApplicantsTop.push({
          email: row._id,
          jobCount: row.jobCount,
          jobTitles: row.jobIds.map((id) => titleById.get(id.toString()) || id.toString()).slice(0, ANALYTICS_TOP_ITEMS),
        });
      }
    }

    const analytics: GeminiRecruiterAssistantAnalyticsContext = {
      scope: analyticsScope,
      generatedAt: new Date().toISOString(),
      job: {
        totalJobs: allJobs.length,
        statusCounts: tallyByKey(allJobs.map((jobDoc) => jobDoc.status), "Unknown"),
        totalApplicants: totalApplicantsAcrossJobs,
        averageApplicantsPerJob: allJobs.length > 0 ? Number((totalApplicantsAcrossJobs / allJobs.length).toFixed(1)) : 0,
        jobsWithNoApplicants: allJobs
          .filter((jobDoc) => (jobDoc.applicantsCount || 0) === 0)
          .slice(0, ANALYTICS_TOP_ITEMS)
          .map((jobDoc) => ({ jobId: jobDoc._id.toString(), title: jobDoc.title, status: jobDoc.status })),
        jobsWithMostApplicants: sortedJobsByApplicants.slice(0, ANALYTICS_TOP_ITEMS).map((jobDoc) => ({
          jobId: jobDoc._id.toString(),
          title: jobDoc.title,
          applicants: jobDoc.applicantsCount || 0,
          status: jobDoc.status,
        })),
        jobsWithFewestApplicants: jobsWithFewestApplicants.map((jobDoc) => ({
          jobId: jobDoc._id.toString(),
          title: jobDoc.title,
          applicants: jobDoc.applicantsCount || 0,
          status: jobDoc.status,
        })),
      },
      applicants: {
        totalApplicantsInScope: scopedApplicants.length,
        applicantsBySource,
        applicantsByIngestStatus,
        applicantsByLocationTop: topLocationBreakdown(scopedApplicants),
        multiJobApplicantsTop,
      },
      runs: toRunAnalyticsSummary(relevantShortlists),
    };

    if (resolvedJobId && job) {
      const latestJobRun = relevantShortlists[0];
      analytics.selectedJob = {
        jobId: resolvedJobId,
        title: job.title,
        status: job.status,
        applicantsCount: scopedApplicants.length,
        runCount: relevantShortlists.length,
        latestRun: latestJobRun
          ? {
              shortlistId: latestJobRun._id.toString(),
              runName: latestJobRun.runName,
              createdAt: latestJobRun.createdAt?.toISOString(),
            }
          : undefined,
      };
    }

    if (selectedShortlistDoc) {
      analytics.selectedRun = {
        shortlistId: selectedShortlistDoc._id.toString(),
        runName: selectedShortlistDoc.runName,
        jobTitle: selectedShortlistDoc.jobTitle,
        totalApplicants: selectedShortlistDoc.totalApplicants,
        shortlistCount: selectedShortlistDoc.shortlistCount,
        averageMatchScore: averageMatchScore(selectedShortlistDoc.screeningResults),
        recommendationCounts: stageCountsFromResults(selectedShortlistDoc.screeningResults),
      };
    }

    let workspaceOverviewNote: string | undefined;
    const hasResolvedStructuredContext = Boolean(job || applicants?.length || shortlistContext);
    if (!hasResolvedStructuredContext) {
      const [totalJobs, activeJobs, totalShortlists, recentJobs, recentShortlists] = await Promise.all([
        Job.countDocuments(),
        Job.countDocuments({ status: "Active" }),
        Shortlist.countDocuments(),
        Job.find().sort({ createdAt: -1 }).limit(5).lean<IJob[]>(),
        Shortlist.find().sort({ createdAt: -1 }).limit(5).lean<IShortlist[]>(),
      ]);

      workspaceOverviewNote = buildWorkspaceOverviewNote({
        totalJobs,
        activeJobs,
        totalShortlists,
        recentJobs,
        recentShortlists,
      });
      usedDatabase = usedDatabase || Boolean(workspaceOverviewNote);
    }

    const contextNote = [
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
      analytics,
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
      truncatedHistory: opts.truncatedHistory,
    };

    return { context, summary };
  }
}
