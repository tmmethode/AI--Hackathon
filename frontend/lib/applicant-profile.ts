import type {
  ApplicantCertification,
  ApplicantEducation,
  ApplicantExperience,
  ApplicantRecord,
} from "@/lib/applicants";

function pickArray<T>(...candidates: unknown[]): T[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate as T[];
    }
  }

  return [];
}

export function resolveParsedApplicantHighlights(applicant?: ApplicantRecord): {
  experience: ApplicantExperience[];
  education: ApplicantEducation[];
  certifications: ApplicantCertification[];
} {
  const rawPayload = applicant?.rawPayload as Record<string, unknown> | undefined;
  const extracted = (rawPayload?.extracted || rawPayload) as Record<string, unknown> | undefined;
  const firstExtractedApplicant = Array.isArray(extracted?.applicants)
    ? (extracted?.applicants[0] as Record<string, unknown> | undefined)
    : undefined;

  const experience = pickArray<ApplicantExperience>(
    applicant?.experience,
    firstExtractedApplicant?.experience,
    firstExtractedApplicant?.workExperience,
    firstExtractedApplicant?.workHistory,
    firstExtractedApplicant?.["Work Experience"],
    firstExtractedApplicant?.["Recent Experience"],
    rawPayload?.experience,
    rawPayload?.workExperience,
    rawPayload?.workHistory,
    rawPayload?.["Work Experience"],
    rawPayload?.["Recent Experience"]
  );

  const education = pickArray<ApplicantEducation>(
    applicant?.education,
    firstExtractedApplicant?.education,
    firstExtractedApplicant?.educationHistory,
    firstExtractedApplicant?.["Education"],
    firstExtractedApplicant?.["Education History"],
    rawPayload?.education,
    rawPayload?.educationHistory,
    rawPayload?.["Education"],
    rawPayload?.["Education History"]
  );

  const certifications = pickArray<ApplicantCertification>(
    applicant?.certifications,
    firstExtractedApplicant?.certifications,
    firstExtractedApplicant?.["Certifications"],
    rawPayload?.certifications,
    rawPayload?.["Certifications"]
  );

  return { experience, education, certifications };
}
