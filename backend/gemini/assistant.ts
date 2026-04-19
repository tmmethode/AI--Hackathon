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
      strengths: entry.strengths || [],
      gapsOrRisks: entry.gapsOrRisks || [],
      finalRecommendation: entry.finalRecommendation,
      summaryExplanation: entry.summaryExplanation,
    })),
    shortlist: shortlist.shortlist?.map((entry) => ({
      candidateRank: entry.candidateRank,
      applicantEmail: entry.applicantEmail,
      fullName: entry.fullName,
      matchScore: entry.matchScore,
      strengths: entry.strengths || [],
      gapsOrRisks: entry.gapsOrRisks || [],
      finalRecommendation: entry.finalRecommendation,
      summaryExplanation: entry.summaryExplanation,
    })),
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
      history: request.history,
      job: resolved.context.job,
      applicants: resolved.context.applicants,
      shortlist: resolved.context.shortlist,
      contextNote: resolved.context.contextNote,
    });

    const generation = await this.client.generateText({
      prompt,
      systemInstruction: GEMINI_RECRUITER_ASSISTANT_SYSTEM_INSTRUCTION,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      responseMimeType: "text/plain",
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
      const filter: Record<string, unknown> = { job: jobObjectId };

      if (request.applicantEmails && request.applicantEmails.length > 0) {
        filter.email = {
          $in: request.applicantEmails.map((email) => email.trim().toLowerCase()).filter(Boolean),
        };
      }

      const applicantDocs = await Applicant.find(filter)
        .limit(opts.applicantLimit + 1)
        .lean<IApplicant[]>();

      if (applicantDocs.length > opts.applicantLimit) {
        truncatedApplicants = true;
        applicantDocs.length = opts.applicantLimit;
      }

      if (applicantDocs.length > 0) {
        usedDatabase = true;
        dbApplicants = applicantDocs.map((doc) => toBatchApplicantFromModel(doc as IApplicant));
      }
    }

    const applicants = mergeApplicants(inlineContext.applicants, dbApplicants);

    const contextNote = [
      inlineContext.contextNote,
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

    const anyData = Boolean(job || applicants?.length || shortlistContext);
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
      jobTitle: job?.title,
      applicantCount: applicants?.length || 0,
      screeningResultCount: shortlistContext?.screeningResults?.length || 0,
      shortlistCount: shortlistContext?.shortlist?.length || 0,
      truncatedApplicants,
    };

    return { context, summary };
  }
}
