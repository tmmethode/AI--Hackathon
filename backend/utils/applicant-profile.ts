import type {
  ApplicantProfileInput,
  AvailabilityDTO,
  CertificationDTO,
  EducationDTO,
  ExperienceDTO,
  LanguageDTO,
  ProjectDTO,
  SkillDTO,
  SocialLinksDTO,
} from "../interfaces/applicant";

type UnknownRecord = Record<string, unknown>;

export interface ApplicantStructuredSource {
  skills?: unknown;
  languages?: unknown;
  experience?: unknown;
  education?: unknown;
  certifications?: unknown;
  projects?: unknown;
  availability?: unknown;
  socialLinks?: unknown;
  rawPayload?: unknown;
  [key: string]: unknown;
}

export interface ResolvedApplicantStructuredSections {
  skills: SkillDTO[];
  languages: LanguageDTO[];
  experience: ExperienceDTO[];
  education: EducationDTO[];
  certifications: CertificationDTO[];
  projects: ProjectDTO[];
  availability?: AvailabilityDTO;
  socialLinks?: SocialLinksDTO;
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function toYear(value: unknown): number | undefined {
  const numeric = toNumber(value);
  if (numeric !== undefined) {
    return Math.round(numeric);
  }

  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const directYear = text.match(/\b(19|20)\d{2}\b/);
  if (directYear) {
    return Number(directYear[0]);
  }

  const parsedDate = new Date(text);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.getUTCFullYear();
  }

  return undefined;
}

function splitDelimitedText(value: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const part of value.split(/[\n,;|]+/)) {
    const normalized = normalizeText(part);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push(normalized);
  }

  return items;
}

function cleanStringArray(value: unknown, maxItems = 25): string[] {
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const item of value) {
      const text = normalizeText(item);
      if (!text) {
        continue;
      }

      const key = text.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(text);
      if (result.length >= maxItems) {
        break;
      }
    }

    return result;
  }

  const text = normalizeText(value);
  return text ? splitDelimitedText(text).slice(0, maxItems) : [];
}

function pickValue(record: UnknownRecord | undefined, ...keys: string[]): unknown {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function resolveSourceRecords(source: ApplicantStructuredSource): UnknownRecord[] {
  const baseRecord = asRecord(source);
  const rawPayload = asRecord(source.rawPayload);
  const extracted = asRecord(rawPayload?.extracted) || rawPayload;
  const firstExtractedApplicant = Array.isArray(extracted?.applicants)
    ? asRecord(extracted.applicants[0])
    : undefined;

  return [baseRecord, firstExtractedApplicant, extracted, rawPayload].filter(
    (record, index, records): record is UnknownRecord =>
      Boolean(record) && records.findIndex((item) => item === record) === index
  );
}

function resolveValue(records: UnknownRecord[], ...keys: string[]): unknown {
  for (const record of records) {
    const value = pickValue(record, ...keys);
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as UnknownRecord).length === 0
    ) {
      continue;
    }

    return value;
  }

  return undefined;
}

function normalizeSkills(value: unknown): SkillDTO[] {
  if (!Array.isArray(value)) {
    return cleanStringArray(value).map((name) => ({ name }));
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        const name = normalizeText(entry);
        return name ? { name } : null;
      }

      const skill = asRecord(entry);
      const name = normalizeText(
        pickValue(skill, "name", "skill", "label", "title", "technology")
      );

      if (!name) {
        return null;
      }

      const years = toNumber(
        pickValue(skill, "yearsOfExperience", "years", "experienceYears", "durationYears")
      );

      return {
        name,
        level: normalizeText(pickValue(skill, "level", "proficiency")),
        yearsOfExperience: years !== undefined ? Math.max(0, Math.min(60, Math.round(years))) : undefined,
      };
    })
    .filter((entry): entry is SkillDTO => Boolean(entry));
}

function normalizeLanguages(value: unknown): LanguageDTO[] {
  if (!Array.isArray(value)) {
    const text = normalizeText(value);
    if (!text) {
      return [];
    }

    return splitDelimitedText(text).map((entry) => {
      const [namePart, proficiencyPart] = entry.split(/[:/]-?/);
      return {
        name: namePart.trim(),
        proficiency: proficiencyPart?.trim() || undefined,
      };
    });
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        const normalized = normalizeText(entry);
        if (!normalized) {
          return null;
        }

        const [namePart, proficiencyPart] = normalized.split(/[:/]-?/);
        return {
          name: namePart.trim(),
          proficiency: proficiencyPart?.trim() || undefined,
        };
      }

      const language = asRecord(entry);
      const name = normalizeText(pickValue(language, "name", "language", "label"));
      if (!name) {
        return null;
      }

      return {
        name,
        proficiency: normalizeText(pickValue(language, "proficiency", "level")),
      };
    })
    .filter(Boolean) as LanguageDTO[];
}

function normalizeExperience(value: unknown): ExperienceDTO[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const experience = asRecord(entry);
      const company = normalizeText(
        pickValue(experience, "company", "employer", "organization", "Company")
      );
      const role = normalizeText(
        pickValue(experience, "role", "title", "position", "jobTitle", "Title")
      );

      if (!company || !role) {
        return null;
      }

      const endDate = normalizeText(pickValue(experience, "endDate", "End Date", "end"));
      const currentFlag = pickValue(experience, "isCurrent", "Is Current", "current");

      return {
        company,
        role,
        startDate: normalizeText(pickValue(experience, "startDate", "Start Date", "start")),
        endDate,
        description: normalizeText(
          pickValue(experience, "description", "summary", "details", "responsibilities")
        ),
        technologies: cleanStringArray(
          pickValue(experience, "technologies", "skills", "stack", "tools")
        ),
        isCurrent:
          typeof currentFlag === "boolean"
            ? currentFlag
            : normalizeText(currentFlag)?.toLowerCase() === "true" || !endDate,
      };
    })
    .filter(Boolean) as ExperienceDTO[];
}

function normalizeEducation(value: unknown): EducationDTO[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const education = asRecord(entry);
      const institution = normalizeText(
        pickValue(education, "institution", "school", "university", "college", "Institution")
      );

      if (!institution) {
        return null;
      }

      return {
        institution,
        degree: normalizeText(
          pickValue(education, "degree", "qualification", "program", "Degree")
        ),
        fieldOfStudy: normalizeText(
          pickValue(education, "fieldOfStudy", "field", "major", "Field of Study")
        ),
        startYear: toYear(pickValue(education, "startYear", "Start Year", "startDate")),
        endYear: toYear(pickValue(education, "endYear", "End Year", "graduationYear", "endDate")),
      };
    })
    .filter(Boolean) as EducationDTO[];
}

function normalizeCertifications(value: unknown): CertificationDTO[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        const name = normalizeText(entry);
        return name ? { name } : null;
      }

      const certification = asRecord(entry);
      const name = normalizeText(
        pickValue(certification, "name", "title", "certification", "certificate")
      );
      if (!name) {
        return null;
      }

      return {
        name,
        issuer: normalizeText(pickValue(certification, "issuer", "organization")),
        issueDate: normalizeText(pickValue(certification, "issueDate", "Issue Date", "date")),
      };
    })
    .filter(Boolean) as CertificationDTO[];
}

function normalizeProjects(value: unknown): ProjectDTO[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const project = asRecord(entry);
      const name = normalizeText(pickValue(project, "name", "title", "project"));
      if (!name) {
        return null;
      }

      return {
        name,
        description: normalizeText(pickValue(project, "description", "summary", "details")),
        technologies: cleanStringArray(
          pickValue(project, "technologies", "skills", "stack", "tools")
        ),
        role: normalizeText(pickValue(project, "role", "position")),
        link: normalizeText(pickValue(project, "link", "url")),
        startDate: normalizeText(pickValue(project, "startDate", "Start Date")),
        endDate: normalizeText(pickValue(project, "endDate", "End Date")),
      };
    })
    .filter(Boolean) as ProjectDTO[];
}

function normalizeAvailability(value: unknown): AvailabilityDTO | undefined {
  const availability = asRecord(value);
  if (!availability) {
    return undefined;
  }

  const normalized: AvailabilityDTO = {
    status: normalizeText(pickValue(availability, "status")),
    type: normalizeText(pickValue(availability, "type")),
    startDate: normalizeText(pickValue(availability, "startDate", "Start Date")),
  };

  return normalized.status || normalized.type || normalized.startDate ? normalized : undefined;
}

function normalizeSocialLinks(
  value: unknown,
  fallbacks?: { linkedin?: unknown; github?: unknown; portfolio?: unknown }
): SocialLinksDTO | undefined {
  const socialLinks = asRecord(value);
  const normalized: SocialLinksDTO = {
    linkedin: normalizeText(fallbacks?.linkedin ?? pickValue(socialLinks, "linkedin", "LinkedIn")),
    github: normalizeText(fallbacks?.github ?? pickValue(socialLinks, "github", "GitHub")),
    portfolio: normalizeText(fallbacks?.portfolio ?? pickValue(socialLinks, "portfolio", "website")),
  };

  return normalized.linkedin || normalized.github || normalized.portfolio
    ? normalized
    : undefined;
}

export function resolveApplicantStructuredSections(
  source: ApplicantStructuredSource
): ResolvedApplicantStructuredSections {
  const records = resolveSourceRecords(source);

  return {
    skills: normalizeSkills(
      resolveValue(records, "skills", "extractedSkills", "technicalSkills", "Technical Skills")
    ),
    languages: normalizeLanguages(resolveValue(records, "languages", "Languages")),
    experience: normalizeExperience(
      resolveValue(
        records,
        "experience",
        "workExperience",
        "work_history",
        "workHistory",
        "Work Experience",
        "Recent Experience",
        "professionalExperience"
      )
    ),
    education: normalizeEducation(
      resolveValue(
        records,
        "education",
        "educations",
        "educationHistory",
        "education_history",
        "Education",
        "Education History",
        "educationalBackground",
        "academicHistory"
      )
    ),
    certifications: normalizeCertifications(
      resolveValue(records, "certifications", "Certifications", "licenses")
    ),
    projects: normalizeProjects(resolveValue(records, "projects", "Projects")),
    availability: normalizeAvailability(resolveValue(records, "availability", "Availability")),
    socialLinks: normalizeSocialLinks(resolveValue(records, "socialLinks", "Social Links"), {
      linkedin: resolveValue(records, "linkedin", "LinkedIn"),
      github: resolveValue(records, "github", "GitHub"),
      portfolio: resolveValue(records, "portfolio", "website"),
    }),
  };
}

export function buildApplicantProfileInput(
  source: ApplicantStructuredSource & Pick<ApplicantProfileInput, "firstName" | "lastName" | "email"> & {
    headline?: string;
    bio?: string;
    location?: string;
  }
): ApplicantProfileInput {
  const sections = resolveApplicantStructuredSections(source);

  return {
    firstName: source.firstName,
    lastName: source.lastName,
    email: source.email,
    headline: source.headline,
    bio: source.bio,
    location: source.location,
    skills: sections.skills,
    languages: sections.languages,
    experience: sections.experience,
    education: sections.education,
    certifications: sections.certifications,
    projects: sections.projects,
    availability: sections.availability,
    socialLinks: sections.socialLinks,
  };
}
