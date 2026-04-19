import { listAllApplicants, type ApplicantRecord, type ApplicantSource } from "@/lib/applicants";
import { getShortlist, listShortlists, type ShortlistRecord } from "@/lib/shortlists";
import { listJobs, type JobRecord } from "@/lib/jobs";

export type CandidateStatus =
  | "shortlisted"
  | "interview"
  | "exam"
  | "assessment"
  | "practical"
  | "rejected"
  | "new";

export interface CandidateRecord {
  id: string;
  jobId: string;
  email: string;
  name: string;
  title: string;
  matchScore: number;
  skills: string[];
  experience: string;
  experienceYears: number;
  location: string;
  source: string;
  status: CandidateStatus;
  job: string;
  appliedDate: string;
  summary?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  sourceFileName?: string;
  sourceUrl?: string;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation?: string;
  confidenceScore?: number;
  scores?: {
    skills: number;
    experience: number;
    education: number;
    relevance: number;
  };
  applicant?: ApplicantRecord;
  shortlistRecord?: ShortlistRecord | null;
}

function humanizeApplicantSource(source: ApplicantSource) {
  switch (source) {
    case "umurava-platform":
      return "JSON Upload";
    case "pdf-upload":
      return "Resume Upload";
    case "csv-import":
      return "CSV Import";
    case "paste-links":
      return "Paste Links";
    default:
      return "Applicant Source";
  }
}

export function buildCandidateId(jobId: string, email: string) {
  return `${jobId}:${email.trim().toLowerCase()}`;
}

function applicantDisplayName(applicant?: ApplicantRecord, fallbackValue?: string) {
  if (!applicant) {
    return fallbackValue || "Unknown Candidate";
  }

  const fullName = `${applicant.firstName} ${applicant.lastName}`.trim();
  return fullName || applicant.email || fallbackValue || "Unknown Candidate";
}

function deriveExperienceYears(applicant?: ApplicantRecord) {
  if (!applicant?.experience?.length) {
    return 0;
  }

  let earliestYear = Number.POSITIVE_INFINITY;
  let latestYear = 0;

  for (const entry of applicant.experience) {
    const startYear = entry.startDate ? new Date(entry.startDate).getFullYear() : NaN;
    const endYear = entry.isCurrent
      ? new Date().getFullYear()
      : entry.endDate
      ? new Date(entry.endDate).getFullYear()
      : NaN;

    if (Number.isFinite(startYear)) {
      earliestYear = Math.min(earliestYear, startYear);
      latestYear = Math.max(latestYear, Number.isFinite(endYear) ? endYear : startYear);
    }
  }

  if (!Number.isFinite(earliestYear) || latestYear <= 0) {
    return 0;
  }

  return Math.max(0, latestYear - earliestYear + 1);
}

function formatExperience(applicant?: ApplicantRecord) {
  const years = deriveExperienceYears(applicant);
  return years > 0 ? `${years} Years` : "—";
}

function formatAppliedDate(value?: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().slice(0, 10);
}

function listApplicantSkills(applicant?: ApplicantRecord) {
  return (applicant?.skills || [])
    .map((skill) => skill.name.trim())
    .filter(Boolean)
    .slice(0, 3);
}

async function listAllJobs() {
  const firstPage = await listJobs({ page: 1, pageSize: 100 });

  if (firstPage.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      listJobs({
        page: index + 2,
        pageSize: 100,
      })
    )
  );

  return firstPage.data.concat(...remainingPages.map((page) => page.data));
}

export async function loadCandidateRecords(): Promise<CandidateRecord[]> {
  const [jobs, shortlistSummaryResponse] = await Promise.all([
    listAllJobs(),
    listShortlists({ page: 1, pageSize: 100 }),
  ]);

  const jobsById = new Map<string, JobRecord>(jobs.map((job) => [job._id, job]));
  const applicantsByJob = new Map<string, ApplicantRecord[]>();

  await Promise.all(
    jobs.map(async (job) => {
      const applicants = await listAllApplicants(job._id);
      applicantsByJob.set(job._id, applicants);
    })
  );

  const latestShortlistByJob = new Map<string, string>();
  for (const summary of shortlistSummaryResponse.data) {
    if (!latestShortlistByJob.has(summary.job)) {
      latestShortlistByJob.set(summary.job, summary._id);
    }
  }

  const shortlistRecords = await Promise.all(
    Array.from(latestShortlistByJob.values()).map(async (id) => (await getShortlist(id)).data)
  );
  const shortlistByJob = new Map<string, ShortlistRecord>(shortlistRecords.map((record) => [record.job, record]));

  const nextCandidates: CandidateRecord[] = [];
  const seenCandidateIds = new Set<string>();

  for (const record of shortlistRecords) {
    const applicants = applicantsByJob.get(record.job) ?? [];
    const applicantsByEmail = new Map(
      applicants.map((applicant) => [applicant.email.trim().toLowerCase(), applicant])
    );
    const shortlistedEmails = new Set(
      (record.shortlist || []).map((entry) => entry.applicantEmail.trim().toLowerCase())
    );

    for (const result of record.screeningResults || []) {
      const emailKey = result.applicantEmail.trim().toLowerCase();
      const applicant = applicantsByEmail.get(emailKey);
      const candidateId = buildCandidateId(record.job, result.applicantEmail);
      const experienceYears = deriveExperienceYears(applicant);

      nextCandidates.push({
        id: candidateId,
        jobId: record.job,
        email: result.applicantEmail,
        name: applicantDisplayName(applicant, result.fullName || result.applicantEmail),
        title: applicant?.headline?.trim() || result.finalRecommendation,
        matchScore: result.matchScore,
        skills:
          listApplicantSkills(applicant).length > 0
            ? listApplicantSkills(applicant)
            : result.strengths.slice(0, 3),
        experience: experienceYears > 0 ? `${experienceYears} Years` : "—",
        experienceYears,
        location: applicant?.location?.trim() || "—",
        source: applicant ? humanizeApplicantSource(applicant.source) : "Screening Run",
        status: shortlistedEmails.has(emailKey) ? "shortlisted" : "rejected",
        job: record.jobTitle || jobsById.get(record.job)?.title || "Unknown Job",
        appliedDate: formatAppliedDate(applicant?.createdAt || record.createdAt),
        summary: result.summaryExplanation,
        firstName: applicant?.firstName,
        lastName: applicant?.lastName,
        headline: applicant?.headline,
        bio: applicant?.bio,
        sourceFileName: applicant?.sourceFileName,
        sourceUrl: applicant?.sourceUrl,
        strengths: result.strengths || [],
        gapsOrRisks: result.gapsOrRisks || [],
        finalRecommendation: result.finalRecommendation,
        confidenceScore: result.confidenceScore,
        scores: {
          skills: result.skillsScore,
          experience: result.experienceScore,
          education: result.educationScore,
          relevance: result.relevanceScore,
        },
        applicant,
        shortlistRecord: record,
      });

      seenCandidateIds.add(candidateId);
    }
  }

  for (const job of jobs) {
    const applicants = applicantsByJob.get(job._id) ?? [];
    const shortlistRecord = shortlistByJob.get(job._id) ?? null;

    for (const applicant of applicants) {
      const candidateId = buildCandidateId(job._id, applicant.email);

      if (seenCandidateIds.has(candidateId)) {
        continue;
      }

      const experienceYears = deriveExperienceYears(applicant);

      nextCandidates.push({
        id: candidateId,
        jobId: job._id,
        email: applicant.email,
        name: applicantDisplayName(applicant),
        title: applicant.headline?.trim() || "Applicant",
        matchScore: 0,
        skills: listApplicantSkills(applicant),
        experience: experienceYears > 0 ? `${experienceYears} Years` : "—",
        experienceYears,
        location: applicant.location?.trim() || "—",
        source: humanizeApplicantSource(applicant.source),
        status: "new",
        job: job.title,
        appliedDate: formatAppliedDate(applicant.createdAt),
        summary: applicant.bio || "",
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        headline: applicant.headline,
        bio: applicant.bio,
        sourceFileName: applicant.sourceFileName,
        sourceUrl: applicant.sourceUrl,
        strengths: [],
        gapsOrRisks: [],
        applicant,
        shortlistRecord,
      });
    }
  }

  nextCandidates.sort((left, right) => {
    if (right.matchScore !== left.matchScore) {
      return right.matchScore - left.matchScore;
    }

    return right.appliedDate.localeCompare(left.appliedDate);
  });

  return nextCandidates;
}
