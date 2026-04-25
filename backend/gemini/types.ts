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

export interface GeminiWeightCriterion {
  id?: string;
  label: string;
  value: number;
}

export interface GeminiJobContext {
  id?: string;
  title: string;
  locationPolicy?: string;
  employmentType?: string;
  salaryBand?: string;
  description?: string;
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
  weightCriteria?: GeminiWeightCriterion[];
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

export interface GeminiBatchJob {
  id?: string;
  title: string;
  hiringManager?: string;
  location?: string;
  locationPolicy?: "remote" | "hybrid" | "onsite" | string;
  employmentType?: "full-time" | "part-time" | "contract" | "internship" | string;
  salaryBand?: string;
  description?: string;
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

// Talent Profile Schema controlled vocabularies (mirrored from
// backend/models/Applicant.ts so the Gemini request layer is type-aligned with
// what is actually persisted).
export type GeminiSkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export type GeminiLanguageProficiency = "Basic" | "Conversational" | "Fluent" | "Native";
export type GeminiAvailabilityStatus = "Available" | "Open to Opportunities" | "Not Available";
export type GeminiAvailabilityType = "Full-time" | "Part-time" | "Contract";

export interface GeminiApplicantSkill {
  name: string;
  level?: GeminiSkillLevel;
  yearsOfExperience?: number;
}

export interface GeminiApplicantLanguage {
  name: string;
  proficiency?: GeminiLanguageProficiency;
}

export interface GeminiApplicantExperience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
  isCurrent?: boolean;
}

export interface GeminiApplicantEducation {
  institution: string;
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
  status: GeminiAvailabilityStatus;
  type: GeminiAvailabilityType;
  startDate?: string;
}

export interface GeminiApplicantSocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

// Mirrors the Talent Profile Schema (§3.1 – §3.8). Source-of-truth lives in
// backend/models/Applicant.ts. Only the identity fields are guaranteed
// populated; all other Talent Profile sections are stored when present and
// remain optional so ingest never blocks on incomplete applicants.
export interface GeminiBatchApplicant {
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: GeminiApplicantSkill[];
  languages?: GeminiApplicantLanguage[];
  experience: GeminiApplicantExperience[];
  education: GeminiApplicantEducation[];
  certifications?: GeminiApplicantCertification[];
  projects: GeminiApplicantProject[];
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
  unscoredApplicants?: number;
  failedChunks?: number;
  failureReasons?: string[];
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
  criterionAssessments?: GeminiCriterionAssessment[];
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
  criterionAssessments?: GeminiCriterionAssessment[];
  criticalRequirementGap: boolean;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: GeminiBatchRecommendation;
  summaryExplanation: string;
}

export type GeminiPipelineStatus =
  | "shortlisted"
  | "interview"
  | "exam"
  | "assessment"
  | "practical";

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
  criterionAssessments?: GeminiCriterionAssessment[];
  criticalRequirementGap: boolean;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: GeminiBatchRecommendation;
  summaryExplanation: string;
  pipelineStatus?: GeminiPipelineStatus;
}

export interface GeminiBatchScreeningResponse {
  jobTitle: string;
  weightCriteria?: GeminiWeightCriterion[];
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
  analytics?: GeminiRecruiterAssistantAnalyticsContext;
  contextNote?: string;
}

export interface GeminiRecruiterJobAnalyticsSummary {
  totalJobs: number;
  statusCounts: Record<string, number>;
  totalApplicants: number;
  averageApplicantsPerJob: number;
  jobsWithNoApplicants: Array<{ jobId: string; title: string; status?: string }>;
  jobsWithMostApplicants: Array<{ jobId: string; title: string; applicants: number; status?: string }>;
  jobsWithFewestApplicants: Array<{ jobId: string; title: string; applicants: number; status?: string }>;
}

export interface GeminiRecruiterStageCounts {
  shortlisted: number;
  rejected: number;
  consider: number;
  strongShortlist: number;
  strongReject: number;
}

export interface GeminiRecruiterRunAnalyticsSummary {
  totalRuns: number;
  comparedRuns: Array<{
    shortlistId: string;
    runName: string;
    jobId?: string;
    jobTitle?: string;
    createdAt?: string;
    totalApplicants?: number;
    shortlistCount?: number;
    averageMatchScore?: number;
    recommendationCounts?: Partial<GeminiRecruiterStageCounts>;
  }>;
}

export interface GeminiRecruiterApplicantAnalyticsSummary {
  totalApplicantsInScope: number;
  applicantsBySource: Record<string, number>;
  applicantsByIngestStatus: Record<string, number>;
  applicantsByLocationTop: Array<{ location: string; count: number }>;
  multiJobApplicantsTop: Array<{ email: string; jobCount: number; jobTitles: string[] }>;
}

export interface GeminiRecruiterAssistantAnalyticsContext {
  scope: "workspace" | "job" | "shortlist";
  generatedAt: string;
  job?: GeminiRecruiterJobAnalyticsSummary;
  applicants?: GeminiRecruiterApplicantAnalyticsSummary;
  runs?: GeminiRecruiterRunAnalyticsSummary;
  selectedJob?: {
    jobId: string;
    title: string;
    status?: string;
    applicantsCount: number;
    runCount: number;
    latestRun?: { shortlistId: string; runName: string; createdAt?: string };
  };
  selectedRun?: {
    shortlistId: string;
    runName?: string;
    jobTitle?: string;
    totalApplicants?: number;
    shortlistCount?: number;
    averageMatchScore?: number;
    recommendationCounts?: Partial<GeminiRecruiterStageCounts>;
  };
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
