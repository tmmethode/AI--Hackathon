import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";

export type ApplicantSource =
  | "umurava-platform"
  | "pdf-upload"
  | "csv-import"
  | "paste-links";

export type IngestStatus = "parsed" | "pending" | "failed";

export interface ApplicantSkill {
  name: string;
  level?: string;
  yearsOfExperience?: number;
}

export interface ApplicantLanguage {
  name: string;
  proficiency?: string;
}

export interface ApplicantExperience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
  isCurrent?: boolean;
}

export interface ApplicantEducation {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface ApplicantCertification {
  name: string;
  issuer?: string;
  issueDate?: string;
}

export interface ApplicantProject {
  name: string;
  description?: string;
  technologies?: string[];
  role?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApplicantAvailability {
  status?: string;
  type?: string;
  startDate?: string;
}

export interface ApplicantSocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ApplicantRecord {
  _id: string;
  job: string;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: ApplicantSkill[];
  languages: ApplicantLanguage[];
  experience: ApplicantExperience[];
  education: ApplicantEducation[];
  certifications: ApplicantCertification[];
  projects: ApplicantProject[];
  availability?: ApplicantAvailability;
  socialLinks?: ApplicantSocialLinks;
  source: ApplicantSource;
  ingestStatus: IngestStatus;
  ingestError?: string;
  sourceFileName?: string;
  sourceUrl?: string;
  rawPayload?: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicantProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: ApplicantSkill[];
  languages?: ApplicantLanguage[];
  experience?: ApplicantExperience[];
  education?: ApplicantEducation[];
  certifications?: ApplicantCertification[];
  projects?: ApplicantProject[];
  availability?: ApplicantAvailability;
  socialLinks?: ApplicantSocialLinks;
}

export interface UpdateApplicantRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: ApplicantSkill[];
  languages?: ApplicantLanguage[];
  experience?: ApplicantExperience[];
  education?: ApplicantEducation[];
  certifications?: ApplicantCertification[];
  projects?: ApplicantProject[];
  availability?: ApplicantAvailability;
  socialLinks?: ApplicantSocialLinks;
  ingestStatus?: IngestStatus;
  ingestError?: string;
}

export interface IngestFileItem {
  filename: string;
  mimeType?: string;
  dataBase64?: string;
  email?: string;
}

export interface IngestSummary {
  received: number;
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{
    index: number;
    email?: string;
    message: string;
  }>;
  itemResults?: Array<{
    index: number;
    source: ApplicantSource;
    state:
      | "parsed-successfully"
      | "saved-successfully"
      | "partially-parsed"
      | "duplicate-detected"
      | "validation-failed"
      | "unsupported-file"
      | "parse-failed";
    sourceFileName?: string;
    sourceUrl?: string;
    email?: string;
    message?: string;
  }>;
  applicants: ApplicantRecord[];
  message: string;
}

export interface IngestUploadProgress {
  loaded: number;
  total?: number;
  percent: number;
}

export interface ApplicantListResponse {
  data: ApplicantRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message: string;
}

interface DeleteApplicantResponse {
  id: string;
  message: string;
}

interface ApplicantResponse {
  data: ApplicantRecord;
  message: string;
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

async function handleApiPayload<T>(
  payload: ({ message?: string; error?: string } & T) | null,
  ok: boolean,
  fallbackMessage: string
): Promise<T> {
  if (!ok) {
    throw new Error(payload?.message || payload?.error || fallbackMessage);
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload as T;
}

async function postJsonWithProgress<T>(
  url: string,
  payload: unknown,
  fallbackMessage: string,
  onProgress?: (progress: IngestUploadProgress) => void
) {
  if (!onProgress || typeof XMLHttpRequest === "undefined") {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    return handleApiResponse<T>(response, fallbackMessage);
  }

  const body = JSON.stringify(payload);
  const bodySize = new Blob([body]).size;

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    };

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      const total =
        event.lengthComputable && event.total > 0
          ? event.total
          : bodySize > 0
            ? bodySize
            : undefined;
      const loaded = typeof event.loaded === "number" ? event.loaded : 0;
      const percent =
        total && total > 0
          ? Math.max(0, Math.min(100, Math.round((loaded / total) * 100)))
          : loaded > 0
            ? 80
            : 0;

      onProgress({ loaded, total, percent });
    };

    xhr.onerror = () => reject(new Error("Network error while uploading applicants."));
    xhr.onabort = () => reject(new Error("Applicant upload was aborted."));
    xhr.onload = async () => {
      onProgress({ loaded: bodySize, total: bodySize, percent: 100 });

      const payload =
        xhr.responseText?.trim().length > 0
          ? ((JSON.parse(xhr.responseText) as unknown) as { message?: string; error?: string } & T)
          : null;

      try {
        resolve(await handleApiPayload<T>(payload, xhr.status >= 200 && xhr.status < 300, fallbackMessage));
      } catch (error) {
        reject(error);
      }
    };

    xhr.send(body);
  });
}

export async function listApplicants(
  jobId: string,
  params: {
    search?: string;
    source?: ApplicantSource;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const url = new URL(`${getApiBaseUrl()}/jobs/${jobId}/applicants/`);

  if (params.search?.trim()) {
    url.searchParams.set("search", params.search.trim());
  }
  if (params.source) {
    url.searchParams.set("source", params.source);
  }
  if (params.page) {
    url.searchParams.set("page", String(params.page));
  }
  if (params.pageSize) {
    url.searchParams.set("pageSize", String(params.pageSize));
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...getAuthHeader(),
    },
    cache: "no-store",
  });

  return handleApiResponse<ApplicantListResponse>(response, "Failed to load applicants.");
}

export async function listAllApplicants(jobId: string, params: { search?: string; source?: ApplicantSource } = {}) {
  const firstPage = await listApplicants(jobId, {
    ...params,
    page: 1,
    pageSize: 100,
  });

  if (firstPage.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      listApplicants(jobId, {
        ...params,
        page: index + 2,
        pageSize: 100,
      })
    )
  );

  return firstPage.data.concat(...remainingPages.map((page) => page.data));
}

export async function ingestApplicantsFromPlatform(
  jobId: string,
  applicants: ApplicantProfileInput[],
  onProgress?: (progress: IngestUploadProgress) => void
) {
  return postJsonWithProgress<IngestSummary>(
    `${getApiBaseUrl()}/jobs/${jobId}/applicants/platform`,
    { applicants },
    "Failed to import applicants from JSON.",
    onProgress
  );
}

export async function ingestApplicantsFromCsv(
  jobId: string,
  payload: { applicants?: ApplicantProfileInput[]; csvText?: string },
  onProgress?: (progress: IngestUploadProgress) => void
) {
  return postJsonWithProgress<IngestSummary>(
    `${getApiBaseUrl()}/jobs/${jobId}/applicants/csv`,
    payload,
    "Failed to import applicants from CSV.",
    onProgress
  );
}

export async function ingestApplicantsFromFiles(
  jobId: string,
  files: IngestFileItem[],
  onProgress?: (progress: IngestUploadProgress) => void
) {
  return postJsonWithProgress<IngestSummary>(
    `${getApiBaseUrl()}/jobs/${jobId}/applicants/files`,
    { files },
    "Failed to queue resume files.",
    onProgress
  );
}

export async function ingestApplicantsFromLinks(
  jobId: string,
  links: string[],
  onProgress?: (progress: IngestUploadProgress) => void
) {
  return postJsonWithProgress<IngestSummary>(
    `${getApiBaseUrl()}/jobs/${jobId}/applicants/links`,
    { links },
    "Failed to queue candidate links.",
    onProgress
  );
}

export async function deleteApplicant(jobId: string, applicantId: string) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/${jobId}/applicants/${applicantId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleApiResponse<DeleteApplicantResponse>(response, "Failed to delete the applicant.");
}

export async function updateApplicant(jobId: string, applicantId: string, payload: UpdateApplicantRequest) {
  const response = await fetch(`${getApiBaseUrl()}/jobs/${jobId}/applicants/${applicantId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse<ApplicantResponse>(response, "Failed to update the applicant.");
}
