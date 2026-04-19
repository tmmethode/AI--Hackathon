import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";

export interface GeminiScoringPillar {
  id: "skills" | "experience" | "education" | "relevance";
  label: string;
  pct: number;
  description: string;
  evidenceFields: string[];
}

export const GEMINI_SCORING_PILLARS: readonly GeminiScoringPillar[] = [
  {
    id: "skills",
    label: "Skills Match",
    pct: 35,
    description:
      "Evaluates coreHardSkills, preferredSkills, and skill-related must-haves. Exact matches score highest; closely related skills get partial credit.",
    evidenceFields: ["skills", "experience.technologies", "projects.technologies", "certifications"],
  },
  {
    id: "experience",
    label: "Experience Match",
    pct: 30,
    description:
      "Measures years of relevant experience, seniority fit, role and technology relevance, and complexity or ownership in prior work.",
    evidenceFields: ["experience", "projects", "headline"],
  },
  {
    id: "education",
    label: "Education Match",
    pct: 10,
    description:
      "Compares against the required educationLevel and field of study. Not penalised heavily when the job requires \"none\".",
    evidenceFields: ["education"],
  },
  {
    id: "relevance",
    label: "Overall Relevance",
    pct: 25,
    description:
      "Alignment with responsibilities, industry and domain fit, certifications, soft-skills evidence, location, availability, and languages.",
    evidenceFields: [
      "responsibilities",
      "certifications",
      "projects",
      "coreSoftSkills",
      "location",
      "availability",
      "languages",
    ],
  },
];

export interface GeminiRecommendationBand {
  label: "Strong Shortlist" | "Shortlist" | "Consider" | "Reject" | "Strong Reject";
  min: number;
  max: number;
  tone: "success" | "brand" | "warning" | "danger";
}

export const GEMINI_RECOMMENDATION_BANDS: readonly GeminiRecommendationBand[] = [
  { label: "Strong Shortlist", min: 85, max: 100, tone: "success" },
  { label: "Shortlist", min: 70, max: 84, tone: "brand" },
  { label: "Consider", min: 55, max: 69, tone: "warning" },
  { label: "Reject", min: 35, max: 54, tone: "danger" },
  { label: "Strong Reject", min: 0, max: 34, tone: "danger" },
];

export const GEMINI_TIE_BREAK_ORDER: readonly string[] = [
  "Higher skillsScore",
  "Higher experienceScore",
  "Higher relevanceScore",
  "Higher confidenceScore",
];

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
  locationPolicy?: string;
  employmentType?: string;
  salaryBand?: string;
  summary?: string;
  responsibilities?: string;
  mustHaveQualifications?: string;
  niceToHaveQualifications?: string;
  coreHardSkills?: string[];
  preferredSkills?: string[];
  coreSoftSkills?: string[];
  experienceYears?: number;
  seniorityLevel?: string;
  educationLevel?: string;
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
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: "Strong Reject" | "Reject" | "Consider" | "Shortlist" | "Strong Shortlist";
  summaryExplanation: string;
}

export interface GeminiBatchShortlistEntry {
  candidateRank: number;
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: "Strong Reject" | "Reject" | "Consider" | "Shortlist" | "Strong Shortlist";
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

export async function getGeminiFrontendConfig() {
  const response = await fetch(`${getApiBaseUrl()}/gemini/frontend-config`, {
    headers: {
      ...getAuthHeader(),
    },
    cache: "no-store",
  });

  return handleApiResponse<GeminiFrontendConfigResponse>(response, "Failed to load screening configuration.");
}

export async function screenBatchApplicants(payload: GeminiBatchScreeningRequest) {
  const response = await fetch(`${getApiBaseUrl()}/gemini/screen-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse<GeminiBatchScreeningResponse>(response, "Failed to run screening.");
}
