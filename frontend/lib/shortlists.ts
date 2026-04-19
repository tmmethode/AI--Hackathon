import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";
import type {
  GeminiBatchScreeningResponse,
  GeminiBatchScreeningResultEntry,
  GeminiBatchShortlistEntry,
} from "@/lib/screening";

export interface ShortlistRecord {
  _id: string;
  job: string;
  jobTitle: string;
  department: string;
  runName: string;
  model: string;
  totalApplicants: number;
  shortlistCount: number;
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
  department: string;
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

export interface CreateShortlistPayload {
  jobId: string;
  runName?: string;
  jobTitle: string;
  department?: string;
  model?: string;
  totalApplicants: number;
  shortlistCount: number;
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
    department: response.department,
    model: response.model,
    totalApplicants: response.totalApplicants,
    shortlistCount: response.shortlistCount,
    screeningResults: response.screeningResults,
    shortlist: response.shortlist,
    instructions,
    screeningStartedAt: startedAt?.toISOString(),
    screeningCompletedAt: completedAt?.toISOString(),
    screeningDurationSeconds,
  };
}
