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

// Map free-form input (any case / whitespace) to one of the spec's controlled
// vocabulary values, or undefined when no match is found.
function canonicalizeEnum(
  value: unknown,
  allowed: readonly string[]
): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const folded = text.toLowerCase();
  for (const candidate of allowed) {
    if (candidate.toLowerCase() === folded) {
      return candidate;
    }
  }
  return undefined;
}

const SKILL_LEVEL_VALUES = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const LANGUAGE_PROFICIENCY_VALUES = ["Basic", "Conversational", "Fluent", "Native"] as const;
const AVAILABILITY_STATUS_VALUES = ["Available", "Open to Opportunities", "Not Available"] as const;
const AVAILABILITY_TYPE_VALUES = ["Full-time", "Part-time", "Contract"] as const;

// Coerce common date inputs (e.g. "2024", "2024/06", "2024-6", "Jan 2024",
// ISO timestamp) into the spec's YYYY-MM. Returns undefined when not parseable.
function normalizeYearMonth(value: unknown): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }
  if (/^present$/i.test(text)) {
    return "Present";
  }

  // YYYY-MM(-DD) — clip to YYYY-MM
  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?/);
  if (isoMatch) {
    const month = isoMatch[2].padStart(2, "0");
    if (Number(month) >= 1 && Number(month) <= 12) {
      return `${isoMatch[1]}-${month}`;
    }
  }

  // Just a year — accept as January
  const yearOnly = text.match(/^(\d{4})$/);
  if (yearOnly) {
    return `${yearOnly[1]}-01`;
  }

  // "Jan 2024" / "January 2024"
  const months: Record<string, string> = {
    jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
    apr: "04", april: "04", may: "05", jun: "06", june: "06", jul: "07", july: "07",
    aug: "08", august: "08", sep: "09", sept: "09", september: "09",
    oct: "10", october: "10", nov: "11", november: "11", dec: "12", december: "12",
  };
  const monthMatch = text.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthMatch) {
    const month = months[monthMatch[1].toLowerCase()];
    if (month) {
      return `${monthMatch[2]}-${month}`;
    }
  }

  return undefined;
}

function normalizeYearMonthDay(value: unknown): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const month = isoMatch[2].padStart(2, "0");
    const day = isoMatch[3].padStart(2, "0");
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${isoMatch[1]}-${month}-${day}`;
    }
  }

  return undefined;
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
        level: canonicalizeEnum(pickValue(skill, "level", "proficiency"), SKILL_LEVEL_VALUES),
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
        proficiency: canonicalizeEnum(proficiencyPart, LANGUAGE_PROFICIENCY_VALUES),
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
          proficiency: canonicalizeEnum(proficiencyPart, LANGUAGE_PROFICIENCY_VALUES),
        };
      }

      const language = asRecord(entry);
      const name = normalizeText(pickValue(language, "name", "language", "label"));
      if (!name) {
        return null;
      }

      return {
        name,
        proficiency: canonicalizeEnum(pickValue(language, "proficiency", "level"), LANGUAGE_PROFICIENCY_VALUES),
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

      const rawEnd = pickValue(experience, "endDate", "End Date", "end");
      const currentFlag = pickValue(experience, "isCurrent", "Is Current", "current");
      const endDate = normalizeYearMonth(rawEnd);

      return {
        company,
        role,
        startDate: normalizeYearMonth(pickValue(experience, "startDate", "Start Date", "start")),
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
        issueDate: normalizeYearMonth(pickValue(certification, "issueDate", "Issue Date", "date")),
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
        startDate: normalizeYearMonth(pickValue(project, "startDate", "Start Date")),
        endDate: normalizeYearMonth(pickValue(project, "endDate", "End Date")),
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
    status: canonicalizeEnum(pickValue(availability, "status"), AVAILABILITY_STATUS_VALUES),
    type: canonicalizeEnum(pickValue(availability, "type"), AVAILABILITY_TYPE_VALUES),
    startDate: normalizeYearMonthDay(pickValue(availability, "startDate", "Start Date")),
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
