export interface GeminiGenerateRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "text/plain" | "application/json";
}

export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface GeminiGenerateResponse {
  text: string;
  model: string;
  usage?: GeminiUsageMetadata;
}

export interface GeminiJobContext {
  title: string;
  mustHaveQualifications?: string[];
  niceToHaveQualifications?: string[];
  hardSkills?: string[];
  softSkills?: string[];
  experience?: string;
  seniorityLevel?: string;
  educationLevel?: string;
}

export interface GeminiCandidateContext {
  fullName?: string;
  summary?: string;
  resumeText: string;
}

export interface GeminiCandidateScreenRequest {
  job: GeminiJobContext;
  candidate: GeminiCandidateContext;
  instructions?: string;
  temperature?: number;
}

export interface GeminiCandidateScreenResponse {
  recommendation: "strong_yes" | "yes" | "maybe" | "no";
  score: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  evidence: string[];
  raw: string;
  model: string;
}
