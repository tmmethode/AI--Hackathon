export interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  defaultTemperature: number;
  maxOutputTokens: number;
  frontend: {
    defaultShortlistSize: number;
    minShortlistSize: number;
    maxShortlistSize: number;
  };
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

let cachedConfig: GeminiConfig | null = null;

export function getGeminiConfig(): GeminiConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    baseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/models",
    defaultTemperature: parseNumber(process.env.GEMINI_DEFAULT_TEMPERATURE, 0.2),
    maxOutputTokens: parseNumber(process.env.GEMINI_MAX_OUTPUT_TOKENS, 1200),
    frontend: {
      defaultShortlistSize: parseNumber(process.env.GEMINI_FRONTEND_DEFAULT_SHORTLIST_SIZE, 10),
      minShortlistSize: parseNumber(process.env.GEMINI_FRONTEND_MIN_SHORTLIST_SIZE, 5),
      maxShortlistSize: parseNumber(process.env.GEMINI_FRONTEND_MAX_SHORTLIST_SIZE, 50),
    },
  };

  return cachedConfig;
}
