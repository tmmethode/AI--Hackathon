import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";
import type { ParsedJobImportData } from "@/lib/features/jobs/jobFormSlice";

export interface JobImportResponse {
  data: ParsedJobImportData;
  warnings: string[];
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

export async function parseJobFromLink(url: string) {
  const response = await fetch(`${getApiBaseUrl()}/gemini/parse-job-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ url }),
  });

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

  const response = await fetch(`${getApiBaseUrl()}/gemini/parse-job-file`, {
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
  });

  return handleApiResponse<JobImportResponse>(response, "Unable to parse this file.");
}
