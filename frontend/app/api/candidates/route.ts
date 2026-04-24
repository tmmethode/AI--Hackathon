import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth-session";
import { calculateApplicantExperienceYears } from "@/lib/experience";
import type { ApplicantRecord, ApplicantSource } from "@/lib/applicants";
import type { JobRecord, JobsResponse } from "@/lib/jobs";
import type { ShortlistRecord, ShortlistSummary } from "@/lib/shortlists";
import type { CandidateDirectoryResponse, CandidateFilterStatus, CandidateSortKey, CandidateListItem } from "@/lib/candidate-directory";
import type { CandidateStatus } from "@/lib/candidates";
import { ADVANCED_STATUSES } from "@/lib/candidate-directory";

const PAGE_SIZE_DEFAULT = 10;
const PAGE_SIZE_MAX = 50;

function getApiBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").trim();
  if (/^https?:\/\//i.test(raw)) return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  if (/^\d+$/.test(raw)) return `http://localhost:${raw}`;
  return `http://${raw.replace(/\/$/, "")}`;
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

function buildCandidateId(jobId: string, email: string) {
  return `${jobId}:${email.trim().toLowerCase()}`;
}

function applicantDisplayName(applicant?: ApplicantRecord, fallbackValue?: string) {
  if (!applicant) return fallbackValue || "Unknown Candidate";
  const fullName = `${applicant.firstName} ${applicant.lastName}`.trim();
  return fullName || applicant.email || fallbackValue || "Unknown Candidate";
}

function formatAppliedDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function listApplicantSkills(applicant?: ApplicantRecord) {
  return (applicant?.skills || []).map((skill) => skill.name.trim()).filter(Boolean).slice(0, 3);
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as (T & { message?: string; error?: string }) | null;
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed: ${url}`);
  }
  if (!payload) {
    throw new Error(`Empty response from ${url}`);
  }
  return payload as T;
}

async function listAllJobs(token: string): Promise<JobRecord[]> {
  const baseUrl = getApiBaseUrl();
  const first = await fetchJson<JobsResponse>(`${baseUrl}/jobs?page=1&pageSize=100`, token);
  if (first.totalPages <= 1) return first.data;
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, idx) => fetchJson<JobsResponse>(`${baseUrl}/jobs?page=${idx + 2}&pageSize=100`, token))
  );
  return first.data.concat(...rest.map((entry) => entry.data));
}

async function listAllApplicantsForJob(token: string, jobId: string): Promise<ApplicantRecord[]> {
  const baseUrl = getApiBaseUrl();
  const first = await fetchJson<{ data: ApplicantRecord[]; totalPages: number }>(
    `${baseUrl}/jobs/${jobId}/applicants?page=1&pageSize=100`,
    token
  );
  if (first.totalPages <= 1) return first.data;
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, idx) =>
      fetchJson<{ data: ApplicantRecord[] }>(`${baseUrl}/jobs/${jobId}/applicants?page=${idx + 2}&pageSize=100`, token)
    )
  );
  return first.data.concat(...rest.flatMap((entry) => entry.data));
}

async function listAllShortlistSummaries(token: string): Promise<ShortlistSummary[]> {
  const baseUrl = getApiBaseUrl();
  const first = await fetchJson<{ data: ShortlistSummary[]; totalPages: number }>(`${baseUrl}/shortlists?page=1&pageSize=100`, token);
  if (first.totalPages <= 1) return first.data;
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, idx) =>
      fetchJson<{ data: ShortlistSummary[] }>(`${baseUrl}/shortlists?page=${idx + 2}&pageSize=100`, token)
    )
  );
  return first.data.concat(...rest.flatMap((entry) => entry.data));
}

function buildStatusCounts(candidates: CandidateListItem[]) {
  return {
    all: candidates.filter((c) => c.status !== "rejected" && c.status !== "new").length,
    shortlisted: candidates.filter((c) => c.status === "shortlisted").length,
    advanced: candidates.filter((c) => ADVANCED_STATUSES.includes(c.status)).length,
    interview: candidates.filter((c) => c.status === "interview").length,
    exam: candidates.filter((c) => c.status === "exam").length,
    assessment: candidates.filter((c) => c.status === "assessment").length,
    practical: candidates.filter((c) => c.status === "practical").length,
    rejected: candidates.filter((c) => c.status === "rejected").length,
    new: candidates.filter((c) => c.status === "new").length,
  };
}

function applyFilters(
  candidates: CandidateListItem[],
  search: string,
  status: CandidateFilterStatus,
  job: string,
  sortKey: CandidateSortKey,
  sortDir: "asc" | "desc"
) {
  const needle = search.trim().toLowerCase();
  const filtered = candidates.filter((candidate) => {
    if (job !== "all" && candidate.job !== job) return false;
    if (status === "all") {
      if (candidate.status === "rejected" || candidate.status === "new") {
        return false;
      }
    } else {
      if (status === "advanced") {
        if (!ADVANCED_STATUSES.includes(candidate.status)) return false;
      } else if (candidate.status !== status) {
        return false;
      }
    }

    if (!needle) return true;
    return (
      candidate.name.toLowerCase().includes(needle) ||
      candidate.title.toLowerCase().includes(needle) ||
      candidate.skills.some((skill) => skill.toLowerCase().includes(needle))
    );
  });

  filtered.sort((a, b) => {
    let val = 0;
    if (sortKey === "name") val = a.name.localeCompare(b.name);
    else if (sortKey === "appliedDate") val = a.appliedDate.localeCompare(b.appliedDate);
    else val = a.matchScore - b.matchScore;

    return sortDir === "asc" ? val : -val;
  });

  return filtered;
}

export async function GET(request: Request) {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(searchParams.get("pageSize") || PAGE_SIZE_DEFAULT)));
    const search = searchParams.get("search") || "";
    const status = (searchParams.get("status") || "all") as CandidateFilterStatus;
    const job = searchParams.get("job") || "all";
    const sortKey = (searchParams.get("sortKey") || "matchScore") as CandidateSortKey;
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const [jobs, shortlistSummaries] = await Promise.all([listAllJobs(token), listAllShortlistSummaries(token)]);
    const jobsById = new Map<string, JobRecord>(jobs.map((jobEntry) => [jobEntry._id, jobEntry]));
    const applicantsByJob = new Map<string, ApplicantRecord[]>();

    await Promise.all(
      jobs.map(async (jobEntry) => {
        const applicants = await listAllApplicantsForJob(token, jobEntry._id);
        applicantsByJob.set(jobEntry._id, applicants);
      })
    );

    const latestShortlistByJob = new Map<string, string>();
    for (const summary of shortlistSummaries) {
      if (!latestShortlistByJob.has(summary.job)) latestShortlistByJob.set(summary.job, summary._id);
    }

    const baseUrl = getApiBaseUrl();
    const shortlistRecords = await Promise.all(
      Array.from(latestShortlistByJob.values()).map((id) => fetchJson<{ data: ShortlistRecord }>(`${baseUrl}/shortlists/${id}`, token).then((res) => res.data))
    );

    const candidates: CandidateListItem[] = [];
    const seen = new Set<string>();

    for (const shortlist of shortlistRecords) {
      const applicants = applicantsByJob.get(shortlist.job) ?? [];
      const applicantsByEmail = new Map(applicants.map((a) => [a.email.trim().toLowerCase(), a]));
      const shortlistEntriesByEmail = new Map(
        (shortlist.shortlist || []).map((entry) => [entry.applicantEmail.trim().toLowerCase(), entry])
      );

      for (const result of shortlist.screeningResults || []) {
        const emailKey = result.applicantEmail.trim().toLowerCase();
        const applicant = applicantsByEmail.get(emailKey);
        const candidateId = buildCandidateId(shortlist.job, result.applicantEmail);
        const expYears = calculateApplicantExperienceYears(applicant);
        const shortlistEntry = shortlistEntriesByEmail.get(emailKey);
        const derivedStatus: CandidateStatus = shortlistEntry
          ? ((shortlistEntry.pipelineStatus as CandidateStatus | undefined) || "shortlisted")
          : "rejected";

        candidates.push({
          id: candidateId,
          jobId: shortlist.job,
          shortlistId: shortlist._id,
          email: result.applicantEmail,
          name: applicantDisplayName(applicant, result.fullName || result.applicantEmail),
          title: applicant?.headline?.trim() || result.finalRecommendation,
          matchScore: result.matchScore,
          skills: listApplicantSkills(applicant).length > 0 ? listApplicantSkills(applicant) : result.strengths.slice(0, 3),
          experience: expYears > 0 ? `${expYears} Years` : "—",
          experienceYears: expYears,
          location: applicant?.location?.trim() || "—",
          source: applicant ? humanizeApplicantSource(applicant.source) : "Screening Run",
          status: derivedStatus,
          job: shortlist.jobTitle || jobsById.get(shortlist.job)?.title || "Unknown Job",
          appliedDate: formatAppliedDate(applicant?.createdAt || shortlist.createdAt),
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
        });

        seen.add(candidateId);
      }
    }

    for (const jobEntry of jobs) {
      const applicants = applicantsByJob.get(jobEntry._id) ?? [];
      for (const applicant of applicants) {
        const candidateId = buildCandidateId(jobEntry._id, applicant.email);
        if (seen.has(candidateId)) continue;
        const expYears = calculateApplicantExperienceYears(applicant);
        candidates.push({
          id: candidateId,
          jobId: jobEntry._id,
          email: applicant.email,
          name: applicantDisplayName(applicant),
          title: applicant.headline?.trim() || "Applicant",
          matchScore: 0,
          skills: listApplicantSkills(applicant),
          experience: expYears > 0 ? `${expYears} Years` : "—",
          experienceYears: expYears,
          location: applicant.location?.trim() || "—",
          source: humanizeApplicantSource(applicant.source),
          status: "new",
          job: jobEntry.title,
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
        });
      }
    }

    const jobCandidates = job === "all" ? candidates : candidates.filter((candidate) => candidate.job === job);
    const filtered = applyFilters(candidates, search, status, job, sortKey, sortDir);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    const isActiveCandidate = (candidate: CandidateListItem) =>
      candidate.status !== "rejected" && candidate.status !== "new";

    const response: CandidateDirectoryResponse = {
      data: paginated,
      page: safePage,
      pageSize,
      total,
      totalPages,
      statusCounts: buildStatusCounts(jobCandidates),
      jobOptions: Array.from(new Set(candidates.map((candidate) => candidate.job)))
        .sort((a, b) => a.localeCompare(b))
        .map((jobName) => ({
          job: jobName,
          count: candidates.filter(
            (candidate) => candidate.job === jobName && isActiveCandidate(candidate)
          ).length,
        })),
      message: "Candidates retrieved successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to build candidates directory." },
      { status: 500 }
    );
  }
}
