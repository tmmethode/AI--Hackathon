import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";

export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
}

export interface AssistantContextSummary {
  source: "inline" | "database" | "mixed" | "none";
  jobId?: string;
  shortlistId?: string;
  jobTitle?: string;
  applicantCount: number;
  screeningResultCount: number;
  shortlistCount: number;
  truncatedApplicants: boolean;
}

export interface AssistantUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface AssistantHealthResponse {
  configured: boolean;
  model: string;
}

export interface AssistantAskRequest {
  message: string;
  history?: AssistantMessage[];
  jobId?: string;
  shortlistId?: string;
  applicantEmails?: string[];
  includeApplicants?: boolean;
  applicantLimit?: number;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AssistantAskResponse {
  reply: string;
  model: string;
  usage?: AssistantUsageMetadata;
  contextUsed: AssistantContextSummary;
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

export async function askAssistant(request: AssistantAskRequest): Promise<AssistantAskResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45000);

  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/gemini/assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The assistant request timed out. Please retry.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  const payload = await parseJson<
    (AssistantAskResponse & { message?: string; error?: string }) | null
  >(response);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "The AI assistant could not answer right now. Please try again."
    );
  }

  if (!payload || typeof payload.reply !== "string") {
    throw new Error("The AI assistant returned an empty response.");
  }

  return payload as AssistantAskResponse;
}

export async function getAssistantHealth(): Promise<AssistantHealthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/gemini/health`, {
    cache: "no-store",
  });

  const payload = await parseJson<
    (AssistantHealthResponse & { message?: string; error?: string }) | null
  >(response);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "The assistant health check failed."
    );
  }

  if (!payload || typeof payload.configured !== "boolean" || typeof payload.model !== "string") {
    throw new Error("The assistant health response was incomplete.");
  }

  return payload;
}
