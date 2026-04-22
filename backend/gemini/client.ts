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

export class GeminiClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly defaultTemperature: number;
  private readonly maxOutputTokens: number;

  constructor(private readonly config: GeminiConfig = getGeminiConfig()) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
    this.defaultTemperature = config.defaultTemperature;
    this.maxOutputTokens = config.maxOutputTokens;
  }

  public isConfigured(): boolean {
    return this.apiKey.trim().length > 0;
  }

  public getModel(): string {
    return this.model;
  }

  public async generateText(request: GeminiGenerateRequest): Promise<GeminiGenerateResponse> {
    if (!this.isConfigured()) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const requestedTokens = Number(request.maxOutputTokens);
    const maxOutputTokens =
      Number.isFinite(requestedTokens) && requestedTokens > 0
        ? Math.floor(requestedTokens)
        : this.maxOutputTokens;

    const requestedTemperature = Number(request.temperature);
    const temperature =
      Number.isFinite(requestedTemperature) && requestedTemperature >= 0
        ? requestedTemperature
        : this.defaultTemperature;

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

    const response = await fetch(`${this.baseUrl}/${this.model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: request.systemInstruction
          ? {
              parts: [{ text: request.systemInstruction }],
            }
          : undefined,
        generationConfig,
      }),
    });

    const data = (await response.json()) as GeminiApiResponse;

    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini request failed");
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
      model: this.model,
      usage: data.usageMetadata,
    };
  }
}
