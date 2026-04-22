import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";

export interface DashboardRecentRun {
  id: string;
  title: string;
  createdAt: string;
  applicants: number;
  topMatch: number | null;
}

export interface DashboardSpotlightItem {
  jobId: string;
  title: string;
  recentApplicants: number;
  applicantsCount: number;
}

export interface DashboardBestRun {
  jobTitle: string;
  topCandidateName: string;
  topMatchScore: number;
}

export interface DashboardSummary {
  userFirstName?: string;
  activeJobs: number;
  draftJobs: number;
  totalApplicants: number;
  applicantsIn30Days: number;
  totalShortlists: number;
  shortlistsIn30Days: number;
  averageScreeningRuntimeHours: number;
  timedRunsCount: number;
  weeklyScreeningRuns: number;
  recentRuns: DashboardRecentRun[];
  spotlight: DashboardSpotlightItem[];
  bestRun: DashboardBestRun | null;
}

interface DashboardSummaryResponse {
  data: DashboardSummary;
  message: string;
  error?: string;
}

function getAuthHeader(authToken?: string) {
  const token = authToken || getStoredAuth()?.token;

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchDashboardSummary(authToken?: string) {
  const response = await fetch(`${getApiBaseUrl()}/dashboard/summary`, {
    headers: {
      ...getAuthHeader(authToken),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as DashboardSummaryResponse | null;

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Failed to load dashboard data.");
  }

  if (!payload?.data) {
    throw new Error("The server returned an empty dashboard response.");
  }

  return payload.data;
}
