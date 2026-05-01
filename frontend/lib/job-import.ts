import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";
import type { ParsedJobImportData } from "@/lib/features/jobs/jobFormSlice";

export interface JobImportResponse {
  data: ParsedJobImportData;
  warnings: string[];
}

const JOB_IMPORT_REQUEST_TIMEOUT_MS = 50_000;

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

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Job parsing timed out. Try a smaller file or a simpler public job URL.");
    }

    if (error instanceof Error && error.message.toLowerCase().includes("failed to fetch")) {
      throw new Error("The parsing request could not reach the backend or it timed out before a response was returned.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function parseJobFromLink(url: string) {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/gemini/parse-job-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ url }),
  }, JOB_IMPORT_REQUEST_TIMEOUT_MS);

  return handleApiResponse<JobImportResponse>(response, "Unable to parse this job link.");
}

export async function parseJobFromFile(file: File) {
  const bytes = await file.arrayBuffer();
  const uint8 = new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < uint8.length; index += chunkSize) {
    const chunk = uint8.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  const base64Data = btoa(binary);

  const response = await fetchWithTimeout(`${getApiBaseUrl()}/gemini/parse-job-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      base64Data,
    }),
  }, JOB_IMPORT_REQUEST_TIMEOUT_MS);

  return handleApiResponse<JobImportResponse>(response, "Unable to parse this file.");
}
