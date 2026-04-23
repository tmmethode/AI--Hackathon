import { getApiBaseUrl, getStoredAuth, type AuthUser } from "@/lib/auth";

export type JobStatus = "Active" | "Draft" | "Closed";
export type LocationPolicy = "remote" | "hybrid" | "onsite";
export type EmploymentType = "full-time" | "part-time" | "contract" | "internship" | "temporary";
export type SeniorityLevel = "junior" | "mid" | "senior" | "lead" | "manager" | "principal";
export type EducationLevel = "none" | "hs" | "associate" | "bs" | "ms" | "mba" | "phd" | "professional";

export interface WeightCriterion {
  id: string;
  label: string;
  value: number;
}

export interface HiringManagerSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

export interface JobRecord {
  _id: string;
  title: string;
  department: string;
  hiringManager: HiringManagerSummary;
  location: string;
  locationPolicy: LocationPolicy;
  employmentType: EmploymentType;
  salaryBand?: string;
  summary: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications?: string;
  coreHardSkills: string[];
  preferredSkills: string[];
  coreSoftSkills: string[];
  experienceYears: number;
  seniorityLevel: SeniorityLevel;
  educationLevel: EducationLevel;
  weightCriteria: WeightCriterion[];
  status: JobStatus;
  applicantsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_HIRING_MANAGER: HiringManagerSummary = {
  _id: "",
  firstName: "",
  lastName: "",
  email: "",
};

function normalizeJobRecord(job: JobRecord): JobRecord {
  return {
    ...job,
    hiringManager: job.hiringManager ?? DEFAULT_HIRING_MANAGER,
    coreHardSkills: Array.isArray(job.coreHardSkills) ? job.coreHardSkills : [],
    preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : [],
    coreSoftSkills: Array.isArray(job.coreSoftSkills) ? job.coreSoftSkills : [],
    weightCriteria: Array.isArray(job.weightCriteria) ? job.weightCriteria : [],
  };
}

function normalizeJobsResponse(response: JobsResponse): JobsResponse {
  return {
    ...response,
    data: Array.isArray(response.data) ? response.data.map(normalizeJobRecord) : [],
  };
}

function normalizeJobResponse(response: JobResponse): JobResponse {
  return {
    ...response,
    data: normalizeJobRecord(response.data),
  };
}

export interface JobsResponse {
  data: JobRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message: string;
}

export interface JobSelectorItem {
  _id: string;
  title: string;
  status: JobStatus;
}

export interface JobResponse {
  data: JobRecord;
  message: string;
}

export interface CreateJobPayload {
  title: string;
  department: string;
  hiringManager?: string;
  location: string;
  locationPolicy: LocationPolicy;
  employmentType: EmploymentType;
  salaryBand?: string;
  summary: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications?: string;
  coreHardSkills: string[];
  preferredSkills: string[];
  coreSoftSkills: string[];
  experienceYears: number;
  seniorityLevel: SeniorityLevel;
  educationLevel: EducationLevel;
  weightCriteria: WeightCriterion[];
  status: JobStatus;
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

export async function listJobs(params: {
  search?: string;
  status?: JobStatus | "All";
  page?: number;
  pageSize?: number;
}) {
  const url = new URL(`${getApiBaseUrl()}/jobs/`);

  if (params.search?.trim()) {
    url.searchParams.set("search", params.search.trim());
  }
  if (params.status && params.status !== "All") {
    url.searchParams.set("status", params.status);
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

  return normalizeJobsResponse(
    await handleApiResponse<JobsResponse>(response, "Failed to load jobs.")
  );
}

export async function listAllJobs(params: {
  search?: string;
  status?: JobStatus | "All";
  pageSize?: number;
} = {}) {
  const pageSize = params.pageSize ?? 100;
  const firstPage = await listJobs({
    ...params,
    page: 1,
    pageSize,
  });

  if (firstPage.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      listJobs({
        ...params,
        page: index + 2,
        pageSize,
      })
    )
  );

  return firstPage.data.concat(...remainingPages.map((page) => page.data));
}

export async function listJobSelectors(params: {
  search?: string;
  status?: JobStatus | "All";
  limit?: number;
} = {}) {
  const url = new URL(`${getApiBaseUrl()}/jobs/select`);

  if (params.search?.trim()) {
    url.searchParams.set("search", params.search.trim());
  }
  if (params.status && params.status !== "All") {
    url.searchParams.set("status", params.status);
  }
  if (params.limit) {
    url.searchParams.set("limit", String(params.limit));
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...getAuthHeader(),
    },
    cache: "force-cache",
  });

  return handleApiResponse<{ data: JobSelectorItem[]; message: string }>(
    response,
    "Failed to load job selector options."
  );
}

export async function createJob(payload: CreateJobPayload) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  return normalizeJobResponse(
    await handleApiResponse<JobResponse>(response, "Failed to create the job.")
  );
}

export async function archiveJob(id: string) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/${id}/archive`, {
    method: "PATCH",
    headers: {
      ...getAuthHeader(),
    },
  });

  return normalizeJobResponse(
    await handleApiResponse<JobResponse>(response, "Failed to archive the job.")
  );
}

export async function deleteJob(id: string) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleApiResponse<{ id: string; message: string }>(response, "Failed to delete the job.");
}

export function getHiringManagerName(manager?: HiringManagerSummary | null) {
  if (!manager) {
    return "Unassigned";
  }

  const fullName = `${manager.firstName} ${manager.lastName}`.trim();
  return fullName || manager.email || "Unassigned";
}

export function getStoredAuthUser(): AuthUser | null {
  return getStoredAuth()?.user ?? null;
}

export function splitLinesToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.replace(/^[\s\-*•]+/, "").trim())
    .filter(Boolean);
}
