// TSOA-compatible interfaces for Applicants

export type ApplicantSource =
  | 'umurava-platform'
  | 'pdf-upload'
  | 'csv-import'
  | 'paste-links';

export type IngestStatus = 'parsed' | 'pending' | 'failed';

export interface SkillDTO {
  name: string;
  level?: string;
  yearsOfExperience?: number;
}

export interface LanguageDTO {
  name: string;
  proficiency?: string;
}

export interface ExperienceDTO {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
  isCurrent?: boolean;
}

export interface EducationDTO {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface CertificationDTO {
  name: string;
  issuer?: string;
  issueDate?: string;
}

export interface ProjectDTO {
  name: string;
  description?: string;
  technologies?: string[];
  role?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface AvailabilityDTO {
  status?: string;
  type?: string;
  startDate?: string;
}

export interface SocialLinksDTO {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

/**
 * Full applicant profile shape, matching the candidates.json schema used by the
 * Umurava platform ingestion feed (also acceptable for CSV rows once parsed).
 *
 * Note: the JSON feed uses keys like "Start Date" / "Is Current". Callers can
 * send either the original keys or camelCase (see CandidatePayload for flexible
 * ingestion). This DTO is the canonical, normalized form stored in DB.
 */
export interface ApplicantProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;

  skills?: SkillDTO[];
  languages?: LanguageDTO[];
  experience?: ExperienceDTO[];
  education?: EducationDTO[];
  certifications?: CertificationDTO[];
  projects?: ProjectDTO[];

  availability?: AvailabilityDTO;
  socialLinks?: SocialLinksDTO;
}

export interface IApplicantResponse extends ApplicantProfileInput {
  _id: string;
  job: string;
  source: ApplicantSource;
  ingestStatus: IngestStatus;
  ingestError?: string;
  sourceFileName?: string;
  sourceUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Umurava platform / direct JSON ingestion. */
export interface IngestPlatformRequest {
  applicants: ApplicantProfileInput[];
}

/** CSV ingestion — either send pre-parsed rows or raw CSV text. */
export interface IngestCsvRequest {
  /** Pre-parsed CSV rows shaped like `ApplicantProfileInput`. */
  applicants?: ApplicantProfileInput[];
  /** Raw CSV text. First row MUST be a header row matching the profile keys. */
  csvText?: string;
}

/**
 * PDF / DOC ingestion — AI parsing is future work, so we accept file metadata
 * (+ optional base64 contents) and queue the applicant with `ingestStatus: 'pending'`.
 */
export interface IngestFileItem {
  filename: string;
  mimeType?: string;
  /** Optional base64 payload. Stored as-is for later AI processing. */
  dataBase64?: string;
  /** Optional candidate email if already known (prevents duplicates). */
  email?: string;
}

export interface IngestFilesRequest {
  files: IngestFileItem[];
}

/**
 * Paste-links ingestion — AI parsing is future work, so we store each URL as
 * a placeholder applicant with `ingestStatus: 'pending'`.
 */
export interface IngestLinksRequest {
  links: string[];
}

export type IngestItemState =
  | 'parsed-successfully'
  | 'saved-successfully'
  | 'partially-parsed'
  | 'duplicate-detected'
  | 'validation-failed'
  | 'unsupported-file'
  | 'parse-failed';

export interface IngestItemResult {
  index: number;
  source: ApplicantSource;
  state: IngestItemState;
  sourceFileName?: string;
  sourceUrl?: string;
  email?: string;
  message?: string;
}

export interface IngestSummary {
  received: number;
  created: number;
  skipped: number;
  failed: number;
  errors: { index: number; email?: string; message: string }[];
  applicants: IApplicantResponse[];
  itemResults?: IngestItemResult[];
  message: string;
}

export interface UpdateApplicantRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  headline?: string;
  bio?: string;
  location?: string;

  skills?: SkillDTO[];
  languages?: LanguageDTO[];
  experience?: ExperienceDTO[];
  education?: EducationDTO[];
  certifications?: CertificationDTO[];
  projects?: ProjectDTO[];

  availability?: AvailabilityDTO;
  socialLinks?: SocialLinksDTO;

  ingestStatus?: IngestStatus;
  ingestError?: string;
}

export interface ApplicantListResponse {
  data: IApplicantResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message: string;
}

export interface ApplicantResponse {
  data: IApplicantResponse;
  message: string;
}

export interface DeleteApplicantResponse {
  id: string;
  message: string;
}
