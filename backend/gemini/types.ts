export interface GeminiGenerateRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "text/plain" | "application/json";
  seed?: number;
  topP?: number;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
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
    screenBatch: string;
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

export type GeminiBatchRecommendation =
  | "Strong Reject"
  | "Reject"
  | "Consider"
  | "Shortlist"
  | "Strong Shortlist";

export interface GeminiWeightCriterion {
  id?: string;
  label: string;
  value: number;
}

export interface GeminiBatchJob {
  id?: string;
  title: string;
  department?: string;
  hiringManager?: string;
  location?: string;
  locationPolicy?: "remote" | "hybrid" | "onsite" | string;
  employmentType?: "full-time" | "part-time" | "contract" | "internship" | string;
  salaryBand?: string;
  summary?: string;
  responsibilities?: string;
  mustHaveQualifications?: string;
  niceToHaveQualifications?: string;
  coreHardSkills?: string[];
  preferredSkills?: string[];
  coreSoftSkills?: string[];
  experienceYears?: number;
  seniorityLevel?: "junior" | "mid" | "senior" | "lead" | "principal" | string;
  educationLevel?: "none" | "highschool" | "associate" | "bachelor" | "master" | "phd" | string;
  weightCriteria?: GeminiWeightCriterion[];
  status?: string;
}

export interface GeminiApplicantSkill {
  name: string;
  level?: string;
  yearsOfExperience?: number;
}

export interface GeminiApplicantLanguage {
  name: string;
  proficiency?: string;
}

export interface GeminiApplicantExperience {
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
  isCurrent?: boolean;
}

export interface GeminiApplicantEducation {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface GeminiApplicantCertification {
  name: string;
  issuer?: string;
  issueDate?: string;
}

export interface GeminiApplicantProject {
  name: string;
  description?: string;
  technologies?: string[];
  role?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface GeminiApplicantAvailability {
  status?: string;
  type?: string;
  startDate?: string;
}

export interface GeminiApplicantSocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface GeminiBatchApplicant {
  firstName?: string;
  lastName?: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: GeminiApplicantSkill[];
  languages?: GeminiApplicantLanguage[];
  experience?: GeminiApplicantExperience[];
  education?: GeminiApplicantEducation[];
  certifications?: GeminiApplicantCertification[];
  projects?: GeminiApplicantProject[];
  availability?: GeminiApplicantAvailability;
  socialLinks?: GeminiApplicantSocialLinks;
}

export interface GeminiBatchScreeningRequest {
  job: GeminiBatchJob;
  applicants: GeminiBatchApplicant[];
  shortlistCount: number;
  instructions?: string;
  temperature?: number;
}

export interface GeminiBatchScreeningDbRequest {
  jobId: string;
  shortlistCount: number;
  instructions?: string;
  temperature?: number;
  applicantIds?: string[];
  applicantEmails?: string[];
  filters?: {
    ingestStatus?: "parsed" | "pending" | "failed";
  };
}

export interface GeminiBatchScreeningMeta {
  requestedApplicants: number;
  processedApplicants: number;
  maxApplicants: number;
  truncatedApplicants: boolean;
}

export interface GeminiBatchNarrativeTarget {
  candidateRank: number;
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  finalRecommendation: GeminiBatchRecommendation;
  applicant: GeminiBatchApplicant;
}

export interface GeminiBatchNarrativeEntry {
  applicantEmail: string;
  strengths: string[];
  gapsOrRisks: string[];
  summaryExplanation: string;
}

export interface GeminiBatchScreeningResultEntry {
  candidateRank: number;
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  criticalRequirementGap: boolean;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: GeminiBatchRecommendation;
  summaryExplanation: string;
}

export interface GeminiBatchShortlistEntry {
  candidateRank: number;
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  criticalRequirementGap: boolean;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: GeminiBatchRecommendation;
  summaryExplanation: string;
}

export interface GeminiBatchScreeningResponse {
  jobTitle: string;
  department: string;
  shortlistCount: number;
  totalApplicants: number;
  screeningResults: GeminiBatchScreeningResultEntry[];
  shortlist: GeminiBatchShortlistEntry[];
  model?: string;
  meta?: GeminiBatchScreeningMeta;
}

export type GeminiRecruiterAssistantRole = "user" | "assistant";

export interface GeminiRecruiterAssistantMessage {
  role: GeminiRecruiterAssistantRole;
  content: string;
}

export interface GeminiRecruiterAssistantShortlistContext {
  runName?: string;
  jobTitle?: string;
  department?: string;
  model?: string;
  totalApplicants?: number;
  shortlistCount?: number;
  instructions?: string;
  screeningResults?: GeminiBatchScreeningResultEntry[];
  shortlist?: GeminiBatchShortlistEntry[];
}

export interface GeminiRecruiterAssistantContext {
  job?: GeminiBatchJob;
  applicants?: GeminiBatchApplicant[];
  shortlist?: GeminiRecruiterAssistantShortlistContext;
  contextNote?: string;
}

export interface GeminiRecruiterAssistantRequest {
  message: string;
  history?: GeminiRecruiterAssistantMessage[];
  jobId?: string;
  shortlistId?: string;
  applicantEmails?: string[];
  includeApplicants?: boolean;
  applicantLimit?: number;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiRecruiterAssistantContextSummary {
  source: "database" | "none";
  jobId?: string;
  shortlistId?: string;
  jobTitle?: string;
  applicantCount: number;
  screeningResultCount: number;
  shortlistCount: number;
  truncatedApplicants: boolean;
  truncatedHistory: boolean;
}

export interface GeminiRecruiterAssistantResponse {
  reply: string;
  model: string;
  usage?: GeminiUsageMetadata;
  contextUsed: GeminiRecruiterAssistantContextSummary;
}
