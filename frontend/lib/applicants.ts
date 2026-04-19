import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";

export type ApplicantSource =
  | "umurava-platform"
  | "pdf-upload"
  | "csv-import"
  | "paste-links";

export type IngestStatus = "parsed" | "pending" | "failed";

export interface ApplicantSkill {
  name: string;
  level?: string;
  yearsOfExperience?: number;
}

export interface ApplicantLanguage {
  name: string;
  proficiency?: string;
}

export interface ApplicantExperience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
  isCurrent?: boolean;
}

export interface ApplicantEducation {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface ApplicantCertification {
  name: string;
  issuer?: string;
  issueDate?: string;
}

export interface ApplicantProject {
  name: string;
  description?: string;
  technologies?: string[];
  role?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApplicantAvailability {
  status?: string;
  type?: string;
  startDate?: string;
}

export interface ApplicantSocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ApplicantRecord {
  _id: string;
  job: string;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: ApplicantSkill[];
  languages: ApplicantLanguage[];
  experience: ApplicantExperience[];
  education: ApplicantEducation[];
  certifications: ApplicantCertification[];
  projects: ApplicantProject[];
  availability?: ApplicantAvailability;
  socialLinks?: ApplicantSocialLinks;
  source: ApplicantSource;
  ingestStatus: IngestStatus;
  ingestError?: string;
  sourceFileName?: string;
  sourceUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicantProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: ApplicantSkill[];
  languages?: ApplicantLanguage[];
  experience?: ApplicantExperience[];
  education?: ApplicantEducation[];
  certifications?: ApplicantCertification[];
  projects?: ApplicantProject[];
  availability?: ApplicantAvailability;
  socialLinks?: ApplicantSocialLinks;
}

export interface IngestFileItem {
  filename: string;
  mimeType?: string;
  dataBase64?: string;
  email?: string;
}

export interface IngestSummary {
  received: number;
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{
    index: number;
    email?: string;
    message: string;
  }>;
  applicants: ApplicantRecord[];
  message: string;
}

export interface ApplicantListResponse {
  data: ApplicantRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message: string;
}

interface DeleteApplicantResponse {
  id: string;
  message: string;
}

function getAuthHeader() {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return {
    Authorization: `Bearer ${session.token}`,
  };
}

async function parseJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

async function handleApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = await parseJson<{ message?: string; error?: string } & T>(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || fallbackMessage);
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload as T;
}

export async function listApplicants(
  jobId: string,
  params: {
    search?: string;
    source?: ApplicantSource;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const url = new URL(`${getApiBaseUrl()}/jobs/${jobId}/applicants/`);

  if (params.search?.trim()) {
    url.searchParams.set("search", params.search.trim());
  }
  if (params.source) {
    url.searchParams.set("source", params.source);
  }
  if (params.page) {
    url.searchParams.set("page", String(params.page));
  }
  if (params.pageSize) {
    url.searchParams.set("pageSize", String(params.pageSize));
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...getAuthHeader(),
    },
    cache: "no-store",
  });

  return handleApiResponse<ApplicantListResponse>(response, "Failed to load applicants.");
}

export async function listAllApplicants(jobId: string, params: { search?: string; source?: ApplicantSource } = {}) {
  const firstPage = await listApplicants(jobId, {
    ...params,
    page: 1,
    pageSize: 100,
  });

  if (firstPage.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      listApplicants(jobId, {
        ...params,
        page: index + 2,
        pageSize: 100,
      })
    )
  );

  return firstPage.data.concat(...remainingPages.map((page) => page.data));
}

export async function ingestApplicantsFromPlatform(jobId: string, applicants: ApplicantProfileInput[]) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/${jobId}/applicants/platform`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ applicants }),
  });

  return handleApiResponse<IngestSummary>(response, "Failed to import applicants from JSON.");
}

export async function ingestApplicantsFromCsv(
  jobId: string,
  payload: { applicants?: ApplicantProfileInput[]; csvText?: string }
) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/${jobId}/applicants/csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse<IngestSummary>(response, "Failed to import applicants from CSV.");
}

export async function ingestApplicantsFromFiles(jobId: string, files: IngestFileItem[]) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/${jobId}/applicants/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ files }),
  });

  return handleApiResponse<IngestSummary>(response, "Failed to queue resume files.");
}

export async function ingestApplicantsFromLinks(jobId: string, links: string[]) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/${jobId}/applicants/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ links }),
  });

  return handleApiResponse<IngestSummary>(response, "Failed to queue candidate links.");
}

export async function deleteApplicant(jobId: string, applicantId: string) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/${jobId}/applicants/${applicantId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleApiResponse<DeleteApplicantResponse>(response, "Failed to delete the applicant.");
}
