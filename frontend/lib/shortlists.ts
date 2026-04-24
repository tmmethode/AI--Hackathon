import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";
import type {
  GeminiBatchScreeningResponse,
  GeminiBatchScreeningResultEntry,
  GeminiBatchShortlistEntry,
  GeminiWeightCriterion,
} from "@/lib/screening";

export interface ShortlistRecord {
  _id: string;
  job: string;
  jobTitle: string;
  runName: string;
  model: string;
  totalApplicants: number;
  shortlistCount: number;
  weightCriteria: GeminiWeightCriterion[];
  screeningResults: GeminiBatchScreeningResultEntry[];
  shortlist: GeminiBatchShortlistEntry[];
  instructions?: string;
  screeningStartedAt?: string;
  screeningCompletedAt?: string;
  screeningDurationSeconds?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShortlistSummary {
  _id: string;
  job: string;
  jobTitle: string;
  runName: string;
  model: string;
  totalApplicants: number;
  shortlistCount: number;
  topMatchScore: number;
  topCandidateName: string;
  screeningStartedAt?: string;
  screeningCompletedAt?: string;
  screeningDurationSeconds?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShortlistSelectorItem {
  _id: string;
  runName: string;
  job: string;
  jobTitle: string;
  createdAt: string;
}

export interface CreateShortlistPayload {
  jobId: string;
  runName?: string;
  jobTitle: string;
  model?: string;
  totalApplicants: number;
  shortlistCount: number;
  weightCriteria?: GeminiWeightCriterion[];
  screeningResults: GeminiBatchScreeningResultEntry[];
  shortlist: GeminiBatchShortlistEntry[];
  instructions?: string;
  screeningStartedAt?: string;
  screeningCompletedAt?: string;
  screeningDurationSeconds?: number;
}

interface ScreeningRuntimePayload {
  startedAt?: number;
  completedAt?: number;
}

interface ListShortlistsParams {
  jobId?: string;
  page?: number;
  pageSize?: number;
}

interface ShortlistListResponse {
  data: ShortlistSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message: string;
}

interface ShortlistResponse {
  data: ShortlistRecord;
  message: string;
}

interface ShortlistSelectorResponse {
  data: ShortlistSelectorItem[];
  message: string;
}

export interface SidebarUsageSummary {
  weeklyCount: number;
  totalCount: number;
}

export interface HistoryRunSummary {
  _id: string;
  runName: string;
  jobTitle: string;
  totalApplicants: number;
  shortlistCount: number;
  topMatchScore: number;
  topCandidateName: string;
  screeningCompletedAt?: string;
  screeningDurationSeconds?: number;
  createdAt: string;
}

export interface HistorySummaryResponse {
  data: {
    runs: HistoryRunSummary[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  message: string;
}

function getAuthHeader() {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return { Authorization: `Bearer ${session.token}` };
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

export async function listShortlists(params: ListShortlistsParams = {}) {
  const query = new URLSearchParams();

  if (params.jobId) {
    query.set("jobId", params.jobId);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.pageSize) {
    query.set("pageSize", String(params.pageSize));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${getApiBaseUrl()}/shortlists${suffix}`, {
    headers: { ...getAuthHeader() },
    cache: "no-store",
  });

  return handleApiResponse<ShortlistListResponse>(response, "Failed to load shortlists.");
}

export async function listAllShortlists(params: ListShortlistsParams = {}) {
  const pageSize = params.pageSize ?? 100;
  const firstPage = await listShortlists({
    ...params,
    page: 1,
    pageSize,
  });

  if (firstPage.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      listShortlists({
        ...params,
        page: index + 2,
        pageSize,
      })
    )
  );

  return firstPage.data.concat(...remainingPages.map((page) => page.data));
}

export async function listShortlistSelectors(params: { jobId?: string; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.jobId) {
    query.set("jobId", params.jobId);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${getApiBaseUrl()}/shortlists/select${suffix}`, {
    headers: { ...getAuthHeader() },
    cache: "no-store",
  });

  return handleApiResponse<ShortlistSelectorResponse>(
    response,
    "Failed to load shortlist selector options."
  );
}

export async function fetchSidebarUsage() {
  const response = await fetch(`${getApiBaseUrl()}/sidebar/usage`, {
    headers: { ...getAuthHeader() },
    cache: "force-cache",
  });

  return handleApiResponse<{ data: SidebarUsageSummary; message: string }>(
    response,
    "Failed to load sidebar usage."
  );
}

export async function fetchHistorySummary(params: { page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.pageSize) {
    query.set("pageSize", String(params.pageSize));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await fetch(`${getApiBaseUrl()}/history/summary${suffix}`, {
    headers: { ...getAuthHeader() },
    cache: "no-store",
  });

  return handleApiResponse<HistorySummaryResponse>(response, "Failed to load screening history.");
}

export async function getShortlist(id: string) {
  const response = await fetch(`${getApiBaseUrl()}/shortlists/${id}`, {
    headers: { ...getAuthHeader() },
    cache: "no-store",
  });

  return handleApiResponse<ShortlistResponse>(response, "Failed to load shortlist.");
}

export async function createShortlist(payload: CreateShortlistPayload) {
  const response = await fetch(`${getApiBaseUrl()}/shortlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse<ShortlistResponse>(response, "Failed to save shortlist.");
}

export async function deleteShortlist(id: string) {
  const response = await fetch(`${getApiBaseUrl()}/shortlists/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });

  return handleApiResponse<{ id: string; message: string }>(
    response,
    "Failed to delete shortlist."
  );
}

export async function updateShortlistCandidateStatus(
  id: string,
  email: string,
  status: "shortlisted" | "rejected"
) {
  const encoded = encodeURIComponent(email);
  const response = await fetch(`${getApiBaseUrl()}/shortlists/${id}/candidates/${encoded}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status }),
  });

  return handleApiResponse<ShortlistResponse>(
    response,
    "Failed to update candidate status."
  );
}

export function buildCreatePayload(
  jobId: string,
  runName: string,
  response: GeminiBatchScreeningResponse,
  instructions?: string,
  runtime?: ScreeningRuntimePayload
): CreateShortlistPayload {
  const startedAt =
    typeof runtime?.startedAt === "number" && Number.isFinite(runtime.startedAt)
      ? new Date(runtime.startedAt)
      : null;
  const completedAt =
    typeof runtime?.completedAt === "number" && Number.isFinite(runtime.completedAt)
      ? new Date(runtime.completedAt)
      : null;
  const screeningDurationSeconds =
    startedAt && completedAt && completedAt >= startedAt
      ? Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)
      : undefined;

  return {
    jobId,
    runName,
    jobTitle: response.jobTitle,
    model: response.model,
    totalApplicants: response.totalApplicants,
    shortlistCount: response.shortlistCount,
    weightCriteria: response.weightCriteria,
    screeningResults: response.screeningResults,
    shortlist: response.shortlist,
    instructions,
    screeningStartedAt: startedAt?.toISOString(),
    screeningCompletedAt: completedAt?.toISOString(),
    screeningDurationSeconds,
  };
}
