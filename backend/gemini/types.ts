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

export interface GeminiRankingCriterion {
  id?: string;
  label: string;
  pct: number;
  description?: string;
}

export interface GeminiJobContext {
  id?: string;
  title: string;
  department?: string;
  locationPolicy?: string;
  employmentType?: string;
  salaryBand?: string;
  summary?: string;
  responsibilities?: string[];
  mustHaveQualifications?: string[];
  niceToHaveQualifications?: string[];
  hardSkills?: string[];
  coreHardSkills?: string[];
  preferredBonusSkills?: string[];
  softSkills?: string[];
  coreSoftSkills?: string[];
  experience?: string;
  seniorityLevel?: string;
  educationLevel?: string;
  rankingCriteria?: GeminiRankingCriterion[];
}

export interface GeminiImportedCandidateData {
  source?: string;
  extractedSkills?: string[];
  experience?: string;
  educationLevel?: string;
  tags?: string[];
  certifications?: string[];
  notes?: string[];
}

export interface GeminiCandidateContext {
  id?: string;
  fullName?: string;
  summary?: string;
  resumeText: string;
  importedData?: GeminiImportedCandidateData;
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
  mustHaveMatchScore: number;
  dataCompletenessScore: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  evidence: string[];
  criterionAssessments: GeminiCriterionAssessment[];
  raw: string;
  model: string;
}

export interface GeminiModelCriterionScore {
  label: string;
  score: number;
  summary: string;
  evidence: string[];
}

export interface GeminiCriterionAssessment {
  label: string;
  weightPct: number;
  score: number;
  weightedScore: number;
  summary: string;
  evidence: string[];
}

export interface GeminiFrontendConfigResponse {
  configured: boolean;
  model: string;
  defaults: {
    shortlistSize: number;
    minShortlistSize: number;
    maxShortlistSize: number;
    temperature: number;
    maxOutputTokens: number;
  };
  contracts: {
    jobFields: string[];
    candidateFields: string[];
  };
  endpoints: {
    health: string;
    generate: string;
    screenCandidate: string;
    screenRun: string;
    frontendConfig: string;
  };
}

export interface GeminiFrontendScreeningRunRequest {
  runName: string;
  job: GeminiJobContext;
  candidates: GeminiCandidateContext[];
  shortlistSize?: number;
  instructions?: string;
  temperature?: number;
}

export interface GeminiFrontendScreeningResult extends GeminiCandidateScreenResponse {
  candidateId?: string;
  candidateName?: string;
  shortlisted: boolean;
  rank: number;
}

export interface GeminiFrontendScreeningRunResponse {
  runName: string;
  jobTitle: string;
  totalCandidates: number;
  shortlistSize: number;
  shortlistedCount: number;
  model: string;
  rankingCriteria?: GeminiRankingCriterion[];
  summary: string;
  results: GeminiFrontendScreeningResult[];
}
