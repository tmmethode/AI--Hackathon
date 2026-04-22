import type { CandidateRecord, CandidateStatus } from "@/lib/candidates";

export type CandidateSortKey = "matchScore" | "name" | "appliedDate";
export type CandidateFilterStatus = "all" | "shortlisted" | "advanced" | "interview" | "exam" | "assessment" | "practical" | "rejected" | "new";

export type CandidateListItem = Omit<CandidateRecord, "applicant" | "shortlistRecord">;

export interface CandidateStatusCounts {
  all: number;
  shortlisted: number;
  advanced: number;
  interview: number;
  exam: number;
  assessment: number;
  practical: number;
  rejected: number;
  new: number;
}

export interface CandidateJobOption {
  job: string;
  count: number;
}

export interface CandidateDirectoryResponse {
  data: CandidateListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  statusCounts: CandidateStatusCounts;
  jobOptions: CandidateJobOption[];
  message: string;
}

interface CandidateDirectoryQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortKey: CandidateSortKey;
  sortDir: "asc" | "desc";
  status: CandidateFilterStatus;
  job: string;
}

export const ADVANCED_STATUSES: CandidateStatus[] = ["interview", "exam", "assessment", "practical"];

export async function listCandidateDirectory(query: CandidateDirectoryQuery): Promise<CandidateDirectoryResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sortKey: query.sortKey,
    sortDir: query.sortDir,
    status: query.status,
    job: query.job,
  });

  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }

  const response = await fetch(`/api/candidates?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as CandidateDirectoryResponse | { message?: string } | null;

  if (!response.ok) {
    throw new Error(payload && "message" in payload && payload.message ? payload.message : "Failed to load candidates.");
  }

  if (!payload || !("data" in payload)) {
    throw new Error("The server returned an invalid candidates response.");
  }

  return payload;
}
