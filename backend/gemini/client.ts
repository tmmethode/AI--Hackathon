import { getGeminiConfig, type GeminiConfig } from "./config";
import { GeminiGenerateRequest, GeminiGenerateResponse, GeminiUsageMetadata } from "./types";

interface GeminiContentPart {
  text: string;
}

interface GeminiContentTurn {
  role: "user" | "model";
  parts: GeminiContentPart[];
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: GeminiUsageMetadata;
  error?: {
    message?: string;
  };
}

const GEMINI_MAX_RETRIES = Math.max(0, Math.floor(Number(process.env.GEMINI_MAX_RETRIES) || 2));
const GEMINI_RETRY_BASE_DELAY_MS = Math.max(
  100,
  Math.floor(Number(process.env.GEMINI_RETRY_BASE_DELAY_MS) || 600)
);
const GEMINI_REQUEST_TIMEOUT_MS = Math.max(
  10_000,
  Math.floor(Number(process.env.GEMINI_REQUEST_TIMEOUT_MS) || 90_000)
);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("socket hang up")
  );
}

export class GeminiClient {
  constructor(private readonly config: GeminiConfig = getGeminiConfig()) {
    this.config = config;
  }

  private getResolvedConfig(): GeminiConfig {
    return getGeminiConfig();
  }

  public isConfigured(): boolean {
    return this.getResolvedConfig().apiKey.trim().length > 0;
  }

  public getModel(): string {
    return this.getResolvedConfig().model;
  }

  public async generateText(request: GeminiGenerateRequest): Promise<GeminiGenerateResponse> {
    const resolved = this.getResolvedConfig();

    if (!this.isConfigured()) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const requestedTokens = Number(request.maxOutputTokens);
    const maxOutputTokens =
      Number.isFinite(requestedTokens) && requestedTokens > 0
        ? Math.floor(requestedTokens)
        : resolved.maxOutputTokens;

    const requestedTemperature = Number(request.temperature);
    const temperature =
      Number.isFinite(requestedTemperature) && requestedTemperature >= 0
        ? requestedTemperature
        : resolved.defaultTemperature;

    const requestedTimeoutMs = Number(request.timeoutMs);
    const timeoutMs =
      Number.isFinite(requestedTimeoutMs) && requestedTimeoutMs >= 5_000
        ? Math.floor(requestedTimeoutMs)
        : GEMINI_REQUEST_TIMEOUT_MS;

    const requestedMaxRetries = Number(request.maxRetries);
    const maxRetries =
      Number.isFinite(requestedMaxRetries) && requestedMaxRetries >= 0
        ? Math.floor(requestedMaxRetries)
        : GEMINI_MAX_RETRIES;

    const requestedSeed = Number(request.seed);
    const seed =
      Number.isFinite(requestedSeed) && Number.isInteger(requestedSeed)
        ? requestedSeed
        : undefined;

    const generationConfig: Record<string, unknown> = {
      temperature,
      maxOutputTokens,
      responseMimeType: request.responseMimeType ?? "text/plain",
    };

    if (seed !== undefined) {
      generationConfig.seed = seed;
    }

    const requestedTopP = Number(request.topP);
    if (Number.isFinite(requestedTopP) && requestedTopP > 0 && requestedTopP <= 1) {
      generationConfig.topP = requestedTopP;
    }

    // Build contents array — use multi-turn format when conversation
    // history is provided so Gemini gets proper user/model turn structure.
    let contents: GeminiContentTurn[];

    if (request.conversationHistory && request.conversationHistory.length > 0) {
      contents = request.conversationHistory.map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.content }],
      }));
      // Append the current prompt as the final user turn
      contents.push({ role: "user", parts: [{ text: request.prompt }] });
    } else {
      contents = [{ role: "user", parts: [{ text: request.prompt }] }];
    }

    const body = JSON.stringify({
      contents,
      systemInstruction: request.systemInstruction
        ? {
            parts: [{ text: request.systemInstruction }],
          }
        : undefined,
      generationConfig,
    });

    let data: GeminiApiResponse | null = null;
    let responseOk = false;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${resolved.baseUrl}/${resolved.model}:generateContent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": resolved.apiKey,
          },
          body,
          signal: controller.signal,
        });

        data = (await response.json().catch(() => ({}))) as GeminiApiResponse;
        responseOk = response.ok;

        if (response.ok) {
          break;
        }

        const statusRetryable = response.status === 429 || response.status >= 500;
        if (statusRetryable && attempt < maxRetries) {
          await sleep(GEMINI_RETRY_BASE_DELAY_MS * (attempt + 1));
          continue;
        }

        throw new Error(data.error?.message || "Gemini request failed");
      } catch (error) {
        const isTimeoutAbort = error instanceof Error && error.name === "AbortError";
        const retryable = isTimeoutAbort || isRetryableNetworkError(error);

        if (retryable && attempt < maxRetries) {
          await sleep(GEMINI_RETRY_BASE_DELAY_MS * (attempt + 1));
          continue;
        }

        if (isTimeoutAbort) {
          throw new Error(`Gemini request timed out after ${timeoutMs}ms`);
        }

        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!responseOk || !data) {
      throw new Error("Gemini request failed");
    }

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
    const finishReason = data.candidates?.[0]?.finishReason;

    if (!text) {
      throw new Error(
        finishReason
          ? `Gemini returned an empty response (finishReason=${finishReason})`
          : "Gemini returned an empty response"
      );
    }

    if (finishReason && finishReason !== "STOP") {
      throw new Error(
        `Gemini response was not completed normally (finishReason=${finishReason}); reduce the batch size or raise maxOutputTokens.`
      );
    }

    return {
      text,
      model: resolved.model,
      usage: data.usageMetadata,
    };
  }
}
