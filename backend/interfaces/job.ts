// TSOA-compatible interfaces for Jobs

export type JobStatus = 'Active' | 'Draft' | 'Closed';
export type LocationPolicy = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'principal';
export type EducationLevel =
  | 'none'
  | 'hs'
  | 'associate'
  | 'bs'
  | 'ms'
  | 'mba'
  | 'phd'
  | 'professional';

export interface WeightCriterionDTO {
  id: string;
  label: string;
  value: number;
}

export interface HiringManagerSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

export interface IJobResponse {
  _id: string;
  title: string;
  department: string;
  hiringManager: HiringManagerSummary;
  location: string;
  locationPolicy: LocationPolicy;
  employmentType: EmploymentType;
  salaryBand?: string;

  summary: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications?: string;

  coreHardSkills: string[];
  preferredSkills: string[];
  coreSoftSkills: string[];

  experienceYears: number;
  seniorityLevel: SeniorityLevel;
  educationLevel: EducationLevel;

  weightCriteria: WeightCriterionDTO[];

  status: JobStatus;
  applicantsCount: number;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  title: string;
  department: string;
  /** User id of the hiring manager (must have role 'recruiter'). Optional when the caller is a recruiter — defaults to them. Required for admins. */
  hiringManager?: string;
  location: string;
  locationPolicy?: LocationPolicy;
  employmentType?: EmploymentType;
  salaryBand?: string;

  summary: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications?: string;

  coreHardSkills?: string[];
  preferredSkills?: string[];
  coreSoftSkills?: string[];

  experienceYears?: number;
  seniorityLevel?: SeniorityLevel;
  educationLevel?: EducationLevel;

  weightCriteria?: WeightCriterionDTO[];

  status?: JobStatus;
}

export interface UpdateJobRequest {
  title?: string;
  department?: string;
  /** User id of the hiring manager. Must reference a user with role 'recruiter'. */
  hiringManager?: string;
  location?: string;
  locationPolicy?: LocationPolicy;
  employmentType?: EmploymentType;
  salaryBand?: string;

  summary?: string;
  responsibilities?: string;
  mustHaveQualifications?: string;
  niceToHaveQualifications?: string;

  coreHardSkills?: string[];
  preferredSkills?: string[];
  coreSoftSkills?: string[];

  experienceYears?: number;
  seniorityLevel?: SeniorityLevel;
  educationLevel?: EducationLevel;

  weightCriteria?: WeightCriterionDTO[];

  status?: JobStatus;
}

export interface JobListResponse {
  data: IJobResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message: string;
}

export interface JobResponse {
  data: IJobResponse;
  message: string;
}

export interface DeleteJobResponse {
  message: string;
  id: string;
}
