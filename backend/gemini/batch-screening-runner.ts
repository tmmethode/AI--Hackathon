import mongoose from "mongoose";
import Applicant, { IApplicant } from "../models/Applicant";
import Job, { IJob } from "../models/Job";
import { HttpError } from "../utils/HttpError";
import { resolveApplicantStructuredSections } from "../utils/applicant-profile";
import { GeminiScreeningService } from "./screening";
import {
  GeminiBatchApplicant,
  GeminiBatchJob,
  GeminiBatchScreeningDbRequest,
  GeminiBatchScreeningResponse,
} from "./types";

const DEFAULT_MAX_SCREENING_APPLICANTS = 200;

function normalizeEmail(email?: string): string {
  return (email || "").trim().toLowerCase();
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

  return {
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicant.email,
    headline: applicant.headline,
    bio: applicant.bio,
    location: applicant.location,
    skills: structured.skills.map((skill) => ({
      name: skill.name,
      level: skill.level,
      yearsOfExperience: skill.yearsOfExperience,
    })),
    languages: structured.languages.map((language) => ({
      name: language.name,
      proficiency: language.proficiency,
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
    availability: structured.availability
      ? {
          status: structured.availability.status,
          type: structured.availability.type,
          startDate: structured.availability.startDate,
        }
      : undefined,
    socialLinks: structured.socialLinks
      ? {
          linkedin: structured.socialLinks.linkedin,
          github: structured.socialLinks.github,
          portfolio: structured.socialLinks.portfolio,
        }
      : undefined,
  };
}

export class GeminiBatchScreeningRunnerService {
  constructor(private readonly screeningService: GeminiScreeningService) {}

  public async screenBatchFromDatabase(
    request: GeminiBatchScreeningDbRequest
  ): Promise<GeminiBatchScreeningResponse> {
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

    const applicantQuery: Record<string, unknown> = {
      job: job._id,
      ingestStatus: request.filters?.ingestStatus || "parsed",
    };

    if (request.applicantIds && request.applicantIds.length > 0) {
      const validApplicantIds = request.applicantIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (validApplicantIds.length === 0) {
        throw new HttpError(400, "applicantIds were provided but none were valid Mongo ObjectIds.");
      }

      applicantQuery._id = { $in: validApplicantIds };
    }

    if (request.applicantEmails && request.applicantEmails.length > 0) {
      const normalizedEmails = Array.from(
        new Set(request.applicantEmails.map((email) => normalizeEmail(email)).filter(Boolean))
      );

      if (normalizedEmails.length === 0) {
        throw new HttpError(400, "applicantEmails were provided but none were valid email strings.");
      }

      applicantQuery.email = { $in: normalizedEmails };
    }

    const requestedApplicants = await Applicant.countDocuments(applicantQuery);

    if (requestedApplicants === 0) {
      throw new HttpError(
        404,
        "No applicants matched this screening request. Try removing filters or ingesting parsed applicants first."
      );
    }

    const maxApplicants = Math.max(
      1,
      Math.floor(Number(process.env.GEMINI_SCREEN_BATCH_MAX_APPLICANTS) || DEFAULT_MAX_SCREENING_APPLICANTS)
    );

    const truncatedApplicants = requestedApplicants > maxApplicants;
    const applicantDocs = await Applicant.find(applicantQuery)
      .sort({ createdAt: -1 })
      .limit(maxApplicants);

    const applicants = applicantDocs.map(toBatchApplicantFromModel);

    if (applicants.length === 0) {
      throw new HttpError(404, "No applicants could be loaded for screening.");
    }

    const normalizedShortlistCount = Math.min(shortlistCount, applicants.length);

    const response = await this.screeningService.screenBatch({
      job: toBatchJobFromModel(job),
      applicants,
      shortlistCount: normalizedShortlistCount,
      instructions: request.instructions,
      temperature: request.temperature,
    });

    return {
      ...response,
      meta: {
        requestedApplicants,
        processedApplicants: applicants.length,
        maxApplicants,
        truncatedApplicants,
      },
    };
  }
}
