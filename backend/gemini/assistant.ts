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
  return {
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicant.email,
    headline: applicant.headline,
    bio: applicant.bio,
    location: applicant.location,
    skills: applicant.skills?.map((skill) => ({
      name: skill.name,
      level: skill.level,
      yearsOfExperience: skill.yearsOfExperience,
    })),
    languages: applicant.languages?.map((language) => ({
      name: language.name,
      proficiency: language.proficiency,
    })),
    experience: applicant.experience?.map((entry) => ({
      company: entry.company,
      role: entry.role,
      startDate: entry.startDate,
      endDate: entry.endDate,
      description: entry.description,
      technologies: entry.technologies,
      isCurrent: entry.isCurrent,
    })),
    education: applicant.education?.map((entry) => ({
      institution: entry.institution,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy,
      startYear: entry.startYear,
      endYear: entry.endYear,
    })),
    certifications: applicant.certifications?.map((entry) => ({
      name: entry.name,
      issuer: entry.issuer,
      issueDate: entry.issueDate,
    })),
    projects: applicant.projects?.map((project) => ({
      name: project.name,
      description: project.description,
      technologies: project.technologies,
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

function mergeApplicants(
  inline: GeminiBatchApplicant[] | undefined,
  fromDb: GeminiBatchApplicant[] | undefined
): GeminiBatchApplicant[] | undefined {
  const inlineList = inline || [];
  const dbList = fromDb || [];

  if (inlineList.length === 0 && dbList.length === 0) {
    return undefined;
  }

  const byEmail = new Map<string, GeminiBatchApplicant>();
  for (const applicant of [...dbList, ...inlineList]) {
    const key = (applicant.email || "").trim().toLowerCase();
    if (!key) {
      continue;
    }
    byEmail.set(key, applicant);
  }

  return Array.from(byEmail.values());
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

    const includeApplicants = request.includeApplicants ?? true;
    const rawLimit = Number(request.applicantLimit);
    const applicantLimit = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_APPLICANT_LIMIT)
      : DEFAULT_APPLICANT_LIMIT;

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
    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> =
      (request.history || [])
        .filter((turn) => turn.content?.trim())
        .map((turn) => ({
          role: turn.role === "assistant" ? "assistant" as const : "user" as const,
          content: turn.content,
        }));

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
    const inlineContext: GeminiRecruiterAssistantContext = request.context || {};
    const hasInline = Boolean(
      inlineContext.job ||
        (inlineContext.applicants && inlineContext.applicants.length > 0) ||
        inlineContext.shortlist
    );

    let usedDatabase = false;

    let job: GeminiBatchJob | undefined = inlineContext.job;
    let shortlistContext: GeminiRecruiterAssistantShortlistContext | undefined = inlineContext.shortlist;
    let dbApplicants: GeminiBatchApplicant[] | undefined;

    let resolvedJobId: string | undefined = request.jobId;
    let resolvedShortlistId: string | undefined;
    let truncatedApplicants = false;
    let shortlistedApplicantsPrioritized = false;
    let shortlistPriorityEmails: string[] = [];

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

    const applicants = mergeApplicants(inlineContext.applicants, dbApplicants);

    let workspaceOverviewNote: string | undefined;
    const hasResolvedStructuredContext = Boolean(job || applicants?.length || shortlistContext);
    if (!hasResolvedStructuredContext && !hasInline) {
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
      inlineContext.contextNote,
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
    const source: GeminiRecruiterAssistantContextSummary["source"] = !anyData
      ? "none"
      : hasInline && usedDatabase
        ? "mixed"
        : usedDatabase
          ? "database"
          : "inline";

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
