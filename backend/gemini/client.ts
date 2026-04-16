import { GeminiGenerateRequest, GeminiGenerateResponse, GeminiUsageMetadata } from "./types";

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  usageMetadata?: GeminiUsageMetadata;
  error?: {
    message?: string;
  };
}

export class GeminiClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
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

    const response = await fetch(`${this.baseUrl}/${this.model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: request.prompt }],
          },
        ],
        systemInstruction: request.systemInstruction
          ? {
              parts: [{ text: request.systemInstruction }],
            }
          : undefined,
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: request.maxOutputTokens ?? 1024,
          responseMimeType: request.responseMimeType ?? "text/plain",
        },
      }),
    });

    const data = (await response.json()) as GeminiApiResponse;

    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini request failed");
    }

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    return {
      text,
      model: this.model,
      usage: data.usageMetadata,
    };
  }
}
