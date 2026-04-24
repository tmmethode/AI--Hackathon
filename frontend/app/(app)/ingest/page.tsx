"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  CloudUpload,
  Database,
  File,
  FileText,
  Info,
  Link as LinkIcon,
  Link2,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteApplicant,
  ingestApplicantsFromCsv,
  ingestApplicantsFromFiles,
  ingestApplicantsFromLinks,
  ingestApplicantsFromPlatform,
  type IngestUploadProgress,
  listAllApplicants,
  type ApplicantProfileInput,
  type ApplicantRecord,
  type ApplicantSkill,
  type ApplicantSource,
  type IngestSummary,
  type UpdateApplicantRequest,
  updateApplicant,
} from "@/lib/applicants";
import { listAllJobs, type JobRecord } from "@/lib/jobs";
import { downloadText } from "@/lib/download";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { IngestPageSkeleton } from "@/components/page-skeletons";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

type ImportStage = "preparing" | "uploading" | "refreshing";

interface ImportProgressState {
  stage: ImportStage;
  mode: TabId;
  percent: number;
  title: string;
  detail: string;
}

interface ApplicantEditFormState {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio: string;
  location: string;
  availabilityStatus: string;
  availabilityType: string;
  availabilityStartDate: string;
  linkedin: string;
  github: string;
  portfolio: string;
  skillsJson: string;
  languagesJson: string;
  experienceJson: string;
  educationJson: string;
  certificationsJson: string;
  projectsJson: string;
}

const tabs = [
  { id: "json", label: "Upload via JSON", icon: Database },
  { id: "pdf", label: "Resume Upload", icon: FileText },
  { id: "csv", label: "CSV Import", icon: TableIcon },
  { id: "links", label: "Paste Links", icon: Link2 },
] as const;

type TabId = (typeof tabs)[number]["id"];
const importStages = [
  { id: "preparing", label: "Prepare Payload", icon: FileText },
  { id: "uploading", label: "Upload To Backend", icon: CloudUpload },
  { id: "refreshing", label: "Refresh Live Preview", icon: RefreshCw },
] as const;

const PAGE_SIZE = 5;
const EXAMPLE_JSON_SCHEMA = `{
  "applicants": [
    {
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "email": "sarah.jenkins@example.com",
      "headline": "Senior Frontend Engineer",
      "bio": "Strong product-thinking and mentoring experience.",
      "location": "Kigali, Rwanda",
      "skills": [
        {
          "name": "React",
          "level": "advanced",
          "yearsOfExperience": 4
        },
        {
          "name": "TypeScript",
          "level": "advanced",
          "yearsOfExperience": 4
        }
      ],
      "languages": [
        {
          "name": "English",
          "proficiency": "fluent"
        }
      ],
      "experience": [
        {
          "company": "Acme Labs",
          "role": "Senior Frontend Engineer",
          "startDate": "2021-01-01",
          "endDate": "2024-12-31",
          "description": "Led frontend delivery for customer-facing dashboards.",
          "technologies": ["React", "TypeScript", "Next.js"],
          "isCurrent": false
        }
      ],
      "education": [
        {
          "institution": "University of Rwanda",
          "degree": "BSc Computer Science",
          "fieldOfStudy": "Computer Science",
          "startYear": 2015,
          "endYear": 2019
        }
      ],
      "certifications": [
        {
          "name": "AWS Certified Developer",
          "issuer": "Amazon",
          "issueDate": "2023-06-15"
        }
      ],
      "projects": [
        {
          "name": "Recruiting Analytics Platform",
          "description": "Built a recruiter reporting workspace.",
          "technologies": ["React", "Node.js", "PostgreSQL"],
          "role": "Frontend Lead",
          "link": "https://portfolio.example.com/sarah",
          "startDate": "2023-01-01",
          "endDate": "2023-10-01"
        }
      ],
      "availability": {
        "status": "open",
        "type": "full-time",
        "startDate": "2025-01-15"
      },
      "socialLinks": {
        "linkedin": "https://linkedin.com/in/sarah-jenkins",
        "github": "https://github.com/sarahjenkins",
        "portfolio": "https://portfolio.example.com/sarah"
      }
    }
  ]
}`;
const CSV_TEMPLATE = `firstName,lastName,email,headline,bio,location,skills,languages,experienceCompany,experienceRole,experienceStartDate,experienceEndDate,experienceDescription,experienceTechnologies,experienceIsCurrent,educationInstitution,educationDegree,educationFieldOfStudy,educationStartYear,educationEndYear,certificationName,certificationIssuer,certificationIssueDate,projectName,projectDescription,projectTechnologies,projectRole,projectLink,projectStartDate,projectEndDate,availabilityStatus,availabilityType,availabilityStartDate,linkedin,github,portfolio
"Sarah","Jenkins","sarah.jenkins@example.com","Senior Frontend Engineer","Strong product-thinking and mentoring experience.","Kigali, Rwanda","React|TypeScript|Node.js","English:fluent","Acme Labs","Senior Frontend Engineer","2021-01-01","2024-12-31","Led frontend delivery for customer-facing dashboards.","React|TypeScript|Next.js","false","University of Rwanda","BSc Computer Science","Computer Science","2015","2019","AWS Certified Developer","Amazon","2023-06-15","Recruiting Analytics Platform","Built a recruiter reporting workspace.","React|Node.js|PostgreSQL","Frontend Lead","https://portfolio.example.com/sarah","2023-01-01","2023-10-01","open","full-time","2025-01-15","https://linkedin.com/in/sarah-jenkins","https://github.com/sarahjenkins","https://portfolio.example.com/sarah"
`;

function formatBytes(value: number) {
  return value < 1024 * 1024
    ? `${(value / 1024).toFixed(1)} KB`
    : `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapPercentToRange(value: number, start: number, end: number) {
  const normalized = Math.max(0, Math.min(100, value));
  return clampPercent(start + ((end - start) * normalized) / 100);
}

function getImportModeLabel(tab: TabId) {
  switch (tab) {
    case "json":
      return "JSON applicants";
    case "csv":
      return "CSV applicants";
    case "pdf":
      return "resume files";
    case "links":
      return "candidate links";
    default:
      return "applicants";
  }
}

function getImportStageTitle(tab: TabId, stage: ImportStage) {
  const modeLabel = getImportModeLabel(tab);

  switch (stage) {
    case "preparing":
      return `Preparing ${modeLabel}`;
    case "uploading":
      return `Uploading ${modeLabel}`;
    case "refreshing":
      return "Refreshing live preview";
    default:
      return "Importing applicants";
  }
}

function humanizeApplicantSource(source: ApplicantSource) {
  switch (source) {
    case "umurava-platform":
      return "JSON Upload";
    case "pdf-upload":
      return "Resume Upload";
    case "csv-import":
      return "CSV Import";
    case "paste-links":
      return "Paste Links";
    default:
      return "Applicant Source";
  }
}

function getApplicantDisplayName(applicant: ApplicantRecord) {
  const fullName = `${applicant.firstName} ${applicant.lastName}`.trim();
  return fullName || applicant.email || "Unknown Candidate";
}

function deriveExperienceYears(applicant: ApplicantRecord) {
  if (!applicant.experience.length) {
    return 0;
  }

  let earliestYear = Number.POSITIVE_INFINITY;
  let latestYear = 0;

  for (const entry of applicant.experience) {
    const startYear = entry.startDate ? new Date(entry.startDate).getFullYear() : NaN;
    const endYear = entry.isCurrent
      ? new Date().getFullYear()
      : entry.endDate
        ? new Date(entry.endDate).getFullYear()
        : NaN;

    if (Number.isFinite(startYear)) {
      earliestYear = Math.min(earliestYear, startYear);
      latestYear = Math.max(latestYear, Number.isFinite(endYear) ? endYear : startYear);
    }
  }

  if (!Number.isFinite(earliestYear) || latestYear <= 0) {
    return 0;
  }

  return Math.max(0, latestYear - earliestYear + 1);
}

function formatApplicantExperience(applicant: ApplicantRecord) {
  const years = deriveExperienceYears(applicant);
  return years > 0 ? `${years} Years` : "—";
}

function getApplicantSkills(applicant: ApplicantRecord) {
  return applicant.skills.map((skill) => skill.name.trim()).filter(Boolean).slice(0, 4);
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

function createApplicantEditForm(applicant: ApplicantRecord): ApplicantEditFormState {
  return {
    firstName: applicant.firstName || "",
    lastName: applicant.lastName || "",
    email: applicant.email || "",
    headline: applicant.headline || "",
    bio: applicant.bio || "",
    location: applicant.location || "",
    availabilityStatus: applicant.availability?.status || "",
    availabilityType: applicant.availability?.type || "",
    availabilityStartDate: applicant.availability?.startDate || "",
    linkedin: applicant.socialLinks?.linkedin || "",
    github: applicant.socialLinks?.github || "",
    portfolio: applicant.socialLinks?.portfolio || "",
    skillsJson: stringifyJson(applicant.skills || []),
    languagesJson: stringifyJson(applicant.languages || []),
    experienceJson: stringifyJson(applicant.experience || []),
    educationJson: stringifyJson(applicant.education || []),
    certificationsJson: stringifyJson(applicant.certifications || []),
    projectsJson: stringifyJson(applicant.projects || []),
  };
}

function parseJsonArrayField(fieldLabel: string, value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldLabel} must be a JSON array.`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`${fieldLabel}: ${error.message}`);
    }
    throw new Error(`${fieldLabel} contains invalid JSON.`);
  }
}

function buildApplicantUpdatePayload(form: ApplicantEditFormState): UpdateApplicantRequest {
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const email = form.email.trim().toLowerCase();

  if (!firstName || !lastName || !email) {
    throw new Error("First name, last name, and email are required.");
  }

  const availability =
    form.availabilityStatus.trim() || form.availabilityType.trim() || form.availabilityStartDate.trim()
      ? {
          status: form.availabilityStatus.trim() || undefined,
          type: form.availabilityType.trim() || undefined,
          startDate: form.availabilityStartDate.trim() || undefined,
        }
      : undefined;

  const socialLinks =
    form.linkedin.trim() || form.github.trim() || form.portfolio.trim()
      ? {
          linkedin: form.linkedin.trim() || undefined,
          github: form.github.trim() || undefined,
          portfolio: form.portfolio.trim() || undefined,
        }
      : undefined;

  return {
    firstName,
    lastName,
    email,
    headline: form.headline.trim() || undefined,
    bio: form.bio.trim() || undefined,
    location: form.location.trim() || undefined,
    skills: parseJsonArrayField("Skills", form.skillsJson) as UpdateApplicantRequest["skills"],
    languages: parseJsonArrayField("Languages", form.languagesJson) as UpdateApplicantRequest["languages"],
    experience: parseJsonArrayField("Experience", form.experienceJson) as UpdateApplicantRequest["experience"],
    education: parseJsonArrayField("Education", form.educationJson) as UpdateApplicantRequest["education"],
    certifications: parseJsonArrayField("Certifications", form.certificationsJson) as UpdateApplicantRequest["certifications"],
    projects: parseJsonArrayField("Projects", form.projectsJson) as UpdateApplicantRequest["projects"],
    availability,
    socialLinks,
  };
}

function getStatusTone(status: ApplicantRecord["ingestStatus"]) {
  switch (status) {
    case "parsed":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function getStatusLabel(status: ApplicantRecord["ingestStatus"]) {
  switch (status) {
    case "parsed":
      return "Parsed";
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

function splitDelimitedText(value: string) {
  return value
    .split(/[|,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickValue(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return undefined;
}

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Unknown" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeSkills(value: unknown): ApplicantSkill[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") {
          const trimmed = entry.trim();
          return trimmed ? { name: trimmed } : null;
        }

        if (entry && typeof entry === "object" && "name" in entry && typeof entry.name === "string") {
          const trimmed = entry.name.trim();
          if (!trimmed) {
            return null;
          }

          return {
            name: trimmed,
            level:
              "level" in entry && typeof entry.level === "string" && entry.level.trim()
                ? entry.level.trim()
                : undefined,
            yearsOfExperience:
              "yearsOfExperience" in entry && Number.isFinite(Number(entry.yearsOfExperience))
                ? Number(entry.yearsOfExperience)
                : undefined,
          };
        }

        return null;
      })
      .filter((entry): entry is ApplicantSkill => Boolean(entry));
  }

  if (typeof value === "string") {
    return splitDelimitedText(value).map((name) => ({ name }));
  }

  return [];
}

function normalizeLanguages(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") {
          const [name, proficiency] = entry.split(":").map((item) => item.trim());
          if (!name) {
            return null;
          }

          return {
            name,
            proficiency: proficiency || undefined,
          };
        }

        if (entry && typeof entry === "object" && "name" in entry && typeof entry.name === "string") {
          const trimmed = entry.name.trim();
          if (!trimmed) {
            return null;
          }

          return {
            name: trimmed,
            proficiency:
              "proficiency" in entry && typeof entry.proficiency === "string" && entry.proficiency.trim()
                ? entry.proficiency.trim()
                : undefined,
          };
        }

        return null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  return splitDelimitedText(value)
    .map((entry) => {
      const [name, proficiency] = entry.split(":").map((item) => item.trim());
      if (!name) {
        return null;
      }

      return {
        name,
        proficiency: proficiency || undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function normalizeBoolean(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "yes" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "no" || normalized === "0") {
    return false;
  }

  return undefined;
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeExperienceEntries(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const company = pickValue(record, "company", "employer", "organization");
      const role = pickValue(record, "role", "title", "position", "jobTitle");

      if (typeof company !== "string" || !company.trim() || typeof role !== "string" || !role.trim()) {
        return null;
      }

      return {
        company: company.trim(),
        role: role.trim(),
        startDate:
          (typeof pickValue(record, "startDate", "Start Date", "start") === "string" &&
            String(pickValue(record, "startDate", "Start Date", "start")).trim()) ||
          undefined,
        endDate:
          (typeof pickValue(record, "endDate", "End Date", "end") === "string" &&
            String(pickValue(record, "endDate", "End Date", "end")).trim()) ||
          undefined,
        description:
          (typeof pickValue(record, "description", "summary", "details") === "string" &&
            String(pickValue(record, "description", "summary", "details")).trim()) ||
          undefined,
        technologies: Array.isArray(record.technologies)
          ? record.technologies.map((item) => String(item).trim()).filter(Boolean)
          : splitDelimitedText(String(pickValue(record, "technologies", "skills", "stack") || "")),
        isCurrent:
          typeof record.isCurrent === "boolean"
            ? record.isCurrent
            : normalizeBoolean(pickValue(record, "isCurrent", "Is Current", "current")),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function normalizeEducationEntries(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const institution = pickValue(record, "institution", "school", "university", "college");

      if (typeof institution !== "string" || !institution.trim()) {
        return null;
      }

      return {
        institution: institution.trim(),
        degree:
          (typeof pickValue(record, "degree", "qualification", "program") === "string" &&
            String(pickValue(record, "degree", "qualification", "program")).trim()) ||
          undefined,
        fieldOfStudy:
          (typeof pickValue(record, "fieldOfStudy", "field", "major", "Field of Study") === "string" &&
            String(pickValue(record, "fieldOfStudy", "field", "major", "Field of Study")).trim()) ||
          undefined,
        startYear: normalizeNumber(pickValue(record, "startYear", "Start Year")),
        endYear: normalizeNumber(pickValue(record, "endYear", "End Year", "graduationYear")),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function normalizeCertificationEntries(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        const trimmed = entry.trim();
        return trimmed ? { name: trimmed } : null;
      }

      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const name = pickValue(record, "name", "title", "certification", "certificate");
      if (typeof name !== "string" || !name.trim()) {
        return null;
      }

      return {
        name: name.trim(),
        issuer:
          (typeof pickValue(record, "issuer", "organization") === "string" &&
            String(pickValue(record, "issuer", "organization")).trim()) ||
          undefined,
        issueDate:
          (typeof pickValue(record, "issueDate", "Issue Date", "date") === "string" &&
            String(pickValue(record, "issueDate", "Issue Date", "date")).trim()) ||
          undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function normalizeProjectEntries(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const name = pickValue(record, "name", "title", "project");
      if (typeof name !== "string" || !name.trim()) {
        return null;
      }

      return {
        name: name.trim(),
        description:
          (typeof pickValue(record, "description", "summary", "details") === "string" &&
            String(pickValue(record, "description", "summary", "details")).trim()) ||
          undefined,
        technologies: Array.isArray(record.technologies)
          ? record.technologies.map((item) => String(item).trim()).filter(Boolean)
          : splitDelimitedText(String(pickValue(record, "technologies", "skills", "stack") || "")),
        role:
          (typeof pickValue(record, "role", "position") === "string" &&
            String(pickValue(record, "role", "position")).trim()) ||
          undefined,
        link:
          (typeof pickValue(record, "link", "url") === "string" &&
            String(pickValue(record, "link", "url")).trim()) ||
          undefined,
        startDate:
          (typeof pickValue(record, "startDate", "Start Date") === "string" &&
            String(pickValue(record, "startDate", "Start Date")).trim()) ||
          undefined,
        endDate:
          (typeof pickValue(record, "endDate", "End Date") === "string" &&
            String(pickValue(record, "endDate", "End Date")).trim()) ||
          undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function normalizeApplicantInput(raw: unknown): ApplicantProfileInput {
  if (!raw || typeof raw !== "object") {
    throw new Error("Each applicant entry must be an object.");
  }

  const record = raw as Record<string, unknown>;
  const firstNameValue = pickValue(record, "firstName", "first_name");
  const lastNameValue = pickValue(record, "lastName", "last_name");
  const nameValue = pickValue(record, "name", "fullName", "full_name");

  const fallbackName = typeof nameValue === "string" ? splitFullName(nameValue) : null;
  const firstName =
    (typeof firstNameValue === "string" && firstNameValue.trim()) || fallbackName?.firstName || "";
  const lastName =
    (typeof lastNameValue === "string" && lastNameValue.trim()) || fallbackName?.lastName || "";
  const email = pickValue(record, "email");

  if (!firstName || !lastName || typeof email !== "string" || !email.trim()) {
    throw new Error("Each applicant must include firstName, lastName, and email.");
  }

  const socialLinksRaw =
    record.socialLinks && typeof record.socialLinks === "object"
      ? (record.socialLinks as Record<string, unknown>)
      : {};
  const availabilityRaw =
    record.availability && typeof record.availability === "object"
      ? (record.availability as Record<string, unknown>)
      : {};

  const experienceCompany = pickValue(record, "experienceCompany");
  const experienceRole = pickValue(record, "experienceRole");
  const educationInstitution = pickValue(record, "educationInstitution");
  const certificationName = pickValue(record, "certificationName");
  const projectName = pickValue(record, "projectName");
  const nestedExperience = normalizeExperienceEntries(pickValue(record, "experience", "workExperience", "workHistory"));
  const nestedEducation = normalizeEducationEntries(pickValue(record, "education", "educationHistory"));
  const nestedCertifications = normalizeCertificationEntries(pickValue(record, "certifications"));
  const nestedProjects = normalizeProjectEntries(pickValue(record, "projects"));

  return {
    firstName,
    lastName,
    email: email.trim().toLowerCase(),
    headline:
      (typeof pickValue(record, "headline", "currentTitle", "title") === "string" &&
        String(pickValue(record, "headline", "currentTitle", "title")).trim()) ||
      undefined,
    bio:
      (typeof pickValue(record, "bio", "notes", "summary") === "string" &&
        String(pickValue(record, "bio", "notes", "summary")).trim()) ||
      undefined,
    location:
      (typeof pickValue(record, "location") === "string" && String(pickValue(record, "location")).trim()) ||
      undefined,
    skills: normalizeSkills(pickValue(record, "skills")),
    languages: normalizeLanguages(pickValue(record, "languages")),
    experience: nestedExperience.length > 0
      ? nestedExperience
      : typeof experienceCompany === "string" && experienceCompany.trim() && typeof experienceRole === "string" && experienceRole.trim()
        ? [
            {
              company: experienceCompany.trim(),
              role: experienceRole.trim(),
              startDate:
                (typeof pickValue(record, "experienceStartDate") === "string" &&
                  String(pickValue(record, "experienceStartDate")).trim()) ||
                undefined,
              endDate:
                (typeof pickValue(record, "experienceEndDate") === "string" &&
                  String(pickValue(record, "experienceEndDate")).trim()) ||
                undefined,
              description:
                (typeof pickValue(record, "experienceDescription") === "string" &&
                  String(pickValue(record, "experienceDescription")).trim()) ||
                undefined,
              technologies: splitDelimitedText(String(pickValue(record, "experienceTechnologies") || "")),
              isCurrent: normalizeBoolean(pickValue(record, "experienceIsCurrent")),
            },
          ]
        : [],
    education: nestedEducation.length > 0
      ? nestedEducation
      : typeof educationInstitution === "string" && educationInstitution.trim()
        ? [
            {
              institution: educationInstitution.trim(),
              degree:
                (typeof pickValue(record, "educationDegree") === "string" &&
                  String(pickValue(record, "educationDegree")).trim()) ||
                undefined,
              fieldOfStudy:
                (typeof pickValue(record, "educationFieldOfStudy") === "string" &&
                  String(pickValue(record, "educationFieldOfStudy")).trim()) ||
                undefined,
              startYear: normalizeNumber(pickValue(record, "educationStartYear")),
              endYear: normalizeNumber(pickValue(record, "educationEndYear")),
            },
          ]
        : [],
    certifications: nestedCertifications.length > 0
      ? nestedCertifications
      : typeof certificationName === "string" && certificationName.trim()
        ? [
            {
              name: certificationName.trim(),
              issuer:
                (typeof pickValue(record, "certificationIssuer") === "string" &&
                  String(pickValue(record, "certificationIssuer")).trim()) ||
                undefined,
              issueDate:
                (typeof pickValue(record, "certificationIssueDate") === "string" &&
                  String(pickValue(record, "certificationIssueDate")).trim()) ||
              undefined,
            },
          ]
        : [],
    projects: nestedProjects.length > 0
      ? nestedProjects
      : typeof projectName === "string" && projectName.trim()
        ? [
            {
              name: projectName.trim(),
              description:
                (typeof pickValue(record, "projectDescription") === "string" &&
                  String(pickValue(record, "projectDescription")).trim()) ||
                undefined,
              technologies: splitDelimitedText(String(pickValue(record, "projectTechnologies") || "")),
              role:
                (typeof pickValue(record, "projectRole") === "string" &&
                  String(pickValue(record, "projectRole")).trim()) ||
                undefined,
              link:
                (typeof pickValue(record, "projectLink") === "string" &&
                  String(pickValue(record, "projectLink")).trim()) ||
                undefined,
              startDate:
                (typeof pickValue(record, "projectStartDate") === "string" &&
                  String(pickValue(record, "projectStartDate")).trim()) ||
                undefined,
              endDate:
                (typeof pickValue(record, "projectEndDate") === "string" &&
                  String(pickValue(record, "projectEndDate")).trim()) ||
              undefined,
            },
          ]
        : [],
    availability:
      pickValue(record, "availabilityStatus", "availabilityType", "availabilityStartDate") !== undefined ||
      Object.keys(availabilityRaw).length > 0
        ? {
            status:
              (typeof pickValue(availabilityRaw, "status") === "string" &&
                String(pickValue(availabilityRaw, "status")).trim()) ||
              (typeof pickValue(record, "availabilityStatus") === "string" &&
                String(pickValue(record, "availabilityStatus")).trim()) ||
              undefined,
            type:
              (typeof pickValue(availabilityRaw, "type") === "string" &&
                String(pickValue(availabilityRaw, "type")).trim()) ||
              (typeof pickValue(record, "availabilityType") === "string" &&
                String(pickValue(record, "availabilityType")).trim()) ||
              undefined,
            startDate:
              (typeof pickValue(availabilityRaw, "startDate", "Start Date") === "string" &&
                String(pickValue(availabilityRaw, "startDate", "Start Date")).trim()) ||
              (typeof pickValue(record, "availabilityStartDate") === "string" &&
                String(pickValue(record, "availabilityStartDate")).trim()) ||
              undefined,
          }
        : undefined,
    socialLinks: {
      linkedin:
        (typeof pickValue(socialLinksRaw, "linkedin") === "string" &&
          String(pickValue(socialLinksRaw, "linkedin")).trim()) ||
        (typeof pickValue(record, "linkedinUrl", "linkedin") === "string" &&
          String(pickValue(record, "linkedinUrl", "linkedin")).trim()) ||
        undefined,
      github:
        (typeof pickValue(socialLinksRaw, "github") === "string" &&
          String(pickValue(socialLinksRaw, "github")).trim()) ||
        (typeof pickValue(record, "githubUrl", "github") === "string" &&
          String(pickValue(record, "githubUrl", "github")).trim()) ||
        undefined,
      portfolio:
        (typeof pickValue(socialLinksRaw, "portfolio") === "string" &&
          String(pickValue(socialLinksRaw, "portfolio")).trim()) ||
        (typeof pickValue(record, "portfolioUrl", "portfolio") === "string" &&
          String(pickValue(record, "portfolioUrl", "portfolio")).trim()) ||
        undefined,
    },
  };
}

function parseCsvRow(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsvText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvRow(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function extractApplicantRecordsFromJsonPayload(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.applicants)) {
      return record.applicants;
    }

    if (record.applicant && typeof record.applicant === "object") {
      return [record.applicant];
    }

    if ("firstName" in record && "lastName" in record && "email" in record) {
      return [record];
    }
  }

  return null;
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.readAsText(file);
  });
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Failed to encode ${file.name}.`));
        return;
      }

      const [, base64 = ""] = reader.result.split(",");
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function createUploadedFiles(raw: FileList | null) {
  if (!raw) {
    return [];
  }

  return Array.from(raw).map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    file,
  }));
}

function addUniqueFiles(previous: UploadedFile[], next: UploadedFile[]) {
  const seen = new Set(previous.map((file) => file.id));
  return previous.concat(next.filter((file) => !seen.has(file.id)));
}

function JsonTab({
  files,
  onFiles,
  onRemove,
  onViewSchema,
}: {
  files: UploadedFile[];
  onFiles: (files: UploadedFile[]) => void;
  onRemove: (id: string) => void;
  onViewSchema: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFiles(raw: FileList | null) {
    onFiles(createUploadedFiles(raw));
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-sm text-ink-muted">
        Upload one or more JSON files containing applicant records. Imported data is sent directly to the backend.
      </p>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          processFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed py-12 text-center transition-colors ${
          dragging
            ? "border-brand bg-brand-soft/40"
            : "border-line-strong bg-surface-soft/20 hover:border-brand/50 hover:bg-surface-soft/40"
        }`}
      >
        <Database className="mx-auto mb-2 h-8 w-8 text-brand/40" />
        <p className="text-sm text-ink-muted">Drop a `.json` file here or</p>
        <div className="mt-3 flex justify-center gap-2" onClick={(event) => event.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            Browse JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={onViewSchema}>
            View Example Schema
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => processFiles(event.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 shrink-0 text-brand" />
                <span className="font-medium text-ink">{file.name}</span>
                <span className="text-xs text-ink-muted">{formatBytes(file.size)}</span>
              </div>
              <button
                onClick={() => onRemove(file.id)}
                className="rounded p-1 text-ink-muted hover:bg-surface-soft hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-line bg-surface-soft/30 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10">
            <ShieldCheck className="h-4 w-4 text-brand" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">Expected payload</p>
            <p className="mt-1 text-xs text-ink-muted">
              Supported JSON formats: a single applicant object, an array of applicants, or an object with an
              `applicants` array. Each applicant should include `firstName`, `lastName`, and `email`.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PdfTab({
  files,
  onFiles,
  onRemove,
}: {
  files: UploadedFile[];
  onFiles: (files: UploadedFile[]) => void;
  onRemove: (id: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFiles(raw: FileList | null) {
    onFiles(createUploadedFiles(raw));
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          processFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed py-12 text-center transition-colors ${
          dragging
            ? "border-brand bg-brand-soft/40"
            : "border-line-strong bg-surface-soft/20 hover:border-brand/50 hover:bg-surface-soft/40"
        }`}
      >
        <div
          className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${
            dragging ? "bg-brand text-white" : "bg-brand-soft"
          }`}
        >
          <CloudUpload className={`h-6 w-6 ${dragging ? "text-white" : "text-brand"}`} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-ink">
          {dragging ? "Drop files here" : "Drag and drop resumes"}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">Supports .pdf, .docx, .txt</p>
        <div className="mt-4" onClick={(event) => event.stopPropagation()}>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Browse Files
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(event) => processFiles(event.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 shrink-0 text-brand" />
                <span className="font-medium text-ink">{file.name}</span>
                <span className="text-xs text-ink-muted">{formatBytes(file.size)}</span>
              </div>
              <button
                onClick={() => onRemove(file.id)}
                className="rounded p-1 text-ink-muted hover:bg-surface-soft hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CsvTab({
  files,
  onFiles,
  onRemove,
}: {
  files: UploadedFile[];
  onFiles: (files: UploadedFile[]) => void;
  onRemove: (id: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFiles(raw: FileList | null) {
    onFiles(createUploadedFiles(raw));
  }

  function handleDownloadTemplate() {
    downloadText(CSV_TEMPLATE, "text/csv", "applicant-import-template.csv");
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-sm text-ink-muted">
        Upload a CSV file with flat column fields. Related applicant sections such as experience, education,
        certification, project, and social links are mapped from dedicated CSV columns.
      </p>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          processFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed py-12 text-center transition-colors ${
          dragging
            ? "border-brand bg-brand-soft/40"
            : "border-line-strong bg-surface-soft/20 hover:border-brand/50 hover:bg-surface-soft/40"
        }`}
      >
        <TableIcon className="mx-auto mb-2 h-8 w-8 text-brand/40" />
        <p className="text-sm text-ink-muted">Drop a `.csv` file here or</p>
        <div className="mt-3 flex justify-center gap-2" onClick={(event) => event.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            Browse CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
            Download Template
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => processFiles(event.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 shrink-0 text-brand" />
                <span className="font-medium text-ink">{file.name}</span>
                <span className="text-xs text-ink-muted">{formatBytes(file.size)}</span>
              </div>
              <button
                onClick={() => onRemove(file.id)}
                className="rounded p-1 text-ink-muted hover:bg-surface-soft hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LinksTab({
  links,
  onChange,
}: {
  links: string;
  onChange: (value: string) => void;
}) {
  const totalLinks = links.split(/\r?\n/).map((value) => value.trim()).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-sm text-ink-muted">Paste LinkedIn or portfolio URLs, one per line.</p>
      <textarea
        value={links}
        onChange={(event) => onChange(event.target.value)}
        placeholder={"https://linkedin.com/in/candidate-1\nhttps://linkedin.com/in/candidate-2"}
        className="min-h-[140px] w-full rounded-md border border-line bg-surface px-3 py-2.5 font-mono text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
      />
      <div className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4 text-ink-muted" />
        <span className="text-xs text-ink-muted">{totalLinks} URL(s) ready for backend parsing</span>
      </div>
    </div>
  );
}

export default function IngestPage() {
  const [activeTab, setActiveTab] = useState<TabId>("pdf");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [jsonFiles, setJsonFiles] = useState<UploadedFile[]>([]);
  const [csvFiles, setCsvFiles] = useState<UploadedFile[]>([]);
  const [links, setLinks] = useState("");
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [applicantToDelete, setApplicantToDelete] = useState<ApplicantRecord | null>(null);
  const [editingApplicant, setEditingApplicant] = useState<ApplicantRecord | null>(null);
  const [editForm, setEditForm] = useState<ApplicantEditFormState | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingApplicant, setIsSavingApplicant] = useState(false);
  const [isDeletingApplicants, setIsDeletingApplicants] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgressState | null>(null);
  const [error, setError] = useState("");
  const [managementError, setManagementError] = useState("");
  const [lastImportSummary, setLastImportSummary] = useState<IngestSummary | null>(null);
  const [lastImportTab, setLastImportTab] = useState<TabId>("pdf");

  const currentJob = useMemo(
    () => jobs.find((job) => job._id === selectedJob) ?? null,
    [jobs, selectedJob]
  );

  const filteredApplicants = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();

    if (!needle) {
      return applicants;
    }

    return applicants.filter((applicant) => {
      const haystacks = [
        getApplicantDisplayName(applicant),
        applicant.email,
        applicant.headline,
        applicant.location,
        applicant.sourceFileName,
        applicant.sourceUrl,
        applicant.skills.map((skill) => skill.name).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystacks.includes(needle);
    });
  }, [applicants, searchQuery]);

  const paginatedApplicants = useMemo(
    () => filteredApplicants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredApplicants, page]
  );
  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / PAGE_SIZE));
  const selectedApplicants = useMemo(
    () => applicants.filter((applicant) => selectedApplicantIds.includes(applicant._id)),
    [applicants, selectedApplicantIds]
  );
  const allPaginatedApplicantsSelected = paginatedApplicants.length > 0 &&
    paginatedApplicants.every((applicant) => selectedApplicantIds.includes(applicant._id));

  const parsedCount = useMemo(
    () => applicants.filter((applicant) => applicant.ingestStatus === "parsed").length,
    [applicants]
  );
  const pendingCount = useMemo(
    () => applicants.filter((applicant) => applicant.ingestStatus === "pending").length,
    [applicants]
  );
  const failedCount = useMemo(
    () => applicants.filter((applicant) => applicant.ingestStatus === "failed").length,
    [applicants]
  );
  const latestIssue = useMemo(
    () =>
      [...applicants]
        .filter((applicant) => applicant.ingestStatus === "failed" || applicant.ingestError)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] ??
      null,
    [applicants]
  );
  const progressPercent = useMemo(() => {
    if (applicants.length === 0) {
      return 0;
    }

    return Math.round(((parsedCount + failedCount) / applicants.length) * 100);
  }, [applicants.length, failedCount, parsedCount]);

  useEffect(() => {
    void loadJobs();
  }, []);

  useEffect(() => {
    if (!selectedJob) {
      return;
    }

    void loadApplicants(selectedJob);
  }, [selectedJob]);

  useEffect(() => {
    setPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setSelectedApplicantIds((previous) =>
      previous.filter((applicantId) => applicants.some((applicant) => applicant._id === applicantId))
    );
  }, [applicants]);

  async function loadJobs() {
    setIsLoadingJobs(true);

    try {
      const nextJobs = await listAllJobs();
      setJobs(nextJobs);
      setSelectedJob((previous) => previous || nextJobs[0]?._id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load jobs.");
    } finally {
      setIsLoadingJobs(false);
    }
  }

  async function loadApplicants(jobId: string) {
    setIsLoadingApplicants(true);

    try {
      const nextApplicants = await listAllApplicants(jobId);
      setApplicants(nextApplicants);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load applicants.");
      setApplicants([]);
    } finally {
      setIsLoadingApplicants(false);
    }
  }

  function addFiles(newFiles: UploadedFile[]) {
    setFiles((previous) => addUniqueFiles(previous, newFiles));
  }

  function addJsonFiles(newFiles: UploadedFile[]) {
    setJsonFiles((previous) => addUniqueFiles(previous, newFiles));
  }

  function addCsvFiles(newFiles: UploadedFile[]) {
    setCsvFiles((previous) => addUniqueFiles(previous, newFiles));
  }

  function removeFile(id: string) {
    setFiles((previous) => previous.filter((file) => file.id !== id));
  }

  function removeJsonFile(id: string) {
    setJsonFiles((previous) => previous.filter((file) => file.id !== id));
  }

  function removeCsvFile(id: string) {
    setCsvFiles((previous) => previous.filter((file) => file.id !== id));
  }

  function toggleApplicantSelection(applicantId: string) {
    setSelectedApplicantIds((previous) =>
      previous.includes(applicantId)
        ? previous.filter((value) => value !== applicantId)
        : [...previous, applicantId]
    );
  }

  function toggleSelectAllPaginatedApplicants() {
    setSelectedApplicantIds((previous) => {
      const paginatedIds = paginatedApplicants.map((applicant) => applicant._id);
      const hasAll = paginatedIds.every((applicantId) => previous.includes(applicantId));

      if (hasAll) {
        return previous.filter((applicantId) => !paginatedIds.includes(applicantId));
      }

      return Array.from(new Set([...previous, ...paginatedIds]));
    });
  }

  function openApplicantEditor(applicant: ApplicantRecord) {
    setManagementError("");
    setEditingApplicant(applicant);
    setEditForm(createApplicantEditForm(applicant));
  }

  function closeApplicantEditor() {
    setEditingApplicant(null);
    setEditForm(null);
    setManagementError("");
  }

  function openDeleteConfirmation(applicant?: ApplicantRecord | null) {
    setManagementError("");
    setApplicantToDelete(applicant || null);
    setShowDeleteModal(true);
  }

  function closeDeleteConfirmation() {
    setApplicantToDelete(null);
    setShowDeleteModal(false);
    setManagementError("");
  }

  async function handleSaveApplicant() {
    if (!selectedJob || !editingApplicant || !editForm) {
      return;
    }

    setIsSavingApplicant(true);
    setManagementError("");

    try {
      const payload = buildApplicantUpdatePayload(editForm);
      const response = await updateApplicant(selectedJob, editingApplicant._id, payload);

      setApplicants((previous) =>
        previous.map((applicant) => (applicant._id === editingApplicant._id ? response.data : applicant))
      );
      closeApplicantEditor();
    } catch (saveError) {
      setManagementError(
        saveError instanceof Error ? saveError.message : "Failed to update the applicant."
      );
    } finally {
      setIsSavingApplicant(false);
    }
  }

  async function handleDeleteApplicants() {
    if (!selectedJob) {
      return;
    }

    const targets = applicantToDelete ? [applicantToDelete] : selectedApplicants;
    if (targets.length === 0) {
      closeDeleteConfirmation();
      return;
    }

    setIsDeletingApplicants(true);
    setManagementError("");

    try {
      const results = await Promise.allSettled(
        targets.map((applicant) => deleteApplicant(selectedJob, applicant._id))
      );

      const failures = results.filter((result) => result.status === "rejected") as PromiseRejectedResult[];
      if (failures.length > 0) {
        throw new Error(
          failures[0].reason instanceof Error
            ? failures[0].reason.message
            : "Failed to delete one or more applicants."
        );
      }

      const deletedIds = new Set(targets.map((applicant) => applicant._id));
      setApplicants((previous) => previous.filter((applicant) => !deletedIds.has(applicant._id)));
      setSelectedApplicantIds((previous) => previous.filter((applicantId) => !deletedIds.has(applicantId)));
      await loadJobs();
      closeDeleteConfirmation();
    } catch (deleteError) {
      setManagementError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete applicants."
      );
    } finally {
      setIsDeletingApplicants(false);
    }
  }

  function updateImportProgress(
    mode: TabId,
    stage: ImportStage,
    percent: number,
    detail: string
  ) {
    setImportProgress({
      stage,
      mode,
      percent: clampPercent(percent),
      title: getImportStageTitle(mode, stage),
      detail,
    });
  }

  async function handleImport() {
    setError("");

    if (!selectedJob) {
      setError("Create or select a job before importing applicants.");
      return;
    }

    const targetJobId = selectedJob;
    const importTab = activeTab;
    setIsImporting(true);
    updateImportProgress(importTab, "preparing", 6, "Validating import request…");

    try {
      let summary: IngestSummary;

      if (importTab === "json") {
        if (jsonFiles.length === 0) {
          throw new Error("Add at least one JSON file before importing.");
        }

        const applicantGroups: ApplicantProfileInput[][] = [];

        for (let index = 0; index < jsonFiles.length; index += 1) {
          const { file } = jsonFiles[index];
          updateImportProgress(
            importTab,
            "preparing",
            mapPercentToRange((index / jsonFiles.length) * 100, 8, 38),
            `Reading ${file.name} (${index + 1}/${jsonFiles.length})…`
          );

          const text = await readFileAsText(file);
          const payload = JSON.parse(text);
          const records = extractApplicantRecordsFromJsonPayload(payload);

          if (!records) {
            throw new Error(
              `${file.name} must contain a single applicant object, an applicants array, or an object with applicants[].`
            );
          }

          applicantGroups.push(records.map((entry) => normalizeApplicantInput(entry)));
        }

        updateImportProgress(
          importTab,
          "uploading",
          44,
          `Uploading ${applicantGroups.flat().length} applicant records to the backend…`
        );
        summary = await ingestApplicantsFromPlatform(targetJobId, applicantGroups.flat(), (progress: IngestUploadProgress) => {
          updateImportProgress(
            importTab,
            "uploading",
            mapPercentToRange(progress.percent, 44, 88),
            `Uploading ${applicantGroups.flat().length} applicant records… ${progress.percent}%`
          );
        });
        setJsonFiles([]);
      } else if (importTab === "csv") {
        if (csvFiles.length === 0) {
          throw new Error("Add at least one CSV file before importing.");
        }

        const applicantGroups: ApplicantProfileInput[][] = [];

        for (let index = 0; index < csvFiles.length; index += 1) {
          const { file } = csvFiles[index];
          updateImportProgress(
            importTab,
            "preparing",
            mapPercentToRange((index / csvFiles.length) * 100, 8, 38),
            `Parsing ${file.name} (${index + 1}/${csvFiles.length})…`
          );

          const text = await readFileAsText(file);
          const rows = parseCsvText(text);

          if (rows.length === 0) {
            throw new Error(`${file.name} does not contain any applicant rows.`);
          }

          applicantGroups.push(rows.map((row) => normalizeApplicantInput(row)));
        }

        updateImportProgress(
          importTab,
          "uploading",
          44,
          `Uploading ${applicantGroups.flat().length} CSV applicant records…`
        );
        summary = await ingestApplicantsFromCsv(targetJobId, { applicants: applicantGroups.flat() }, (progress: IngestUploadProgress) => {
          updateImportProgress(
            importTab,
            "uploading",
            mapPercentToRange(progress.percent, 44, 88),
            `Uploading parsed CSV applicants… ${progress.percent}%`
          );
        });
        setCsvFiles([]);
      } else if (importTab === "pdf") {
        if (files.length === 0) {
          throw new Error("Add at least one resume file before importing.");
        }

        const payload = [];

        for (let index = 0; index < files.length; index += 1) {
          const { file } = files[index];
          updateImportProgress(
            importTab,
            "preparing",
            mapPercentToRange((index / files.length) * 100, 8, 42),
            `Encoding ${file.name} (${index + 1}/${files.length})…`
          );

          payload.push({
            filename: file.name,
            mimeType: file.type || undefined,
            dataBase64: await readFileAsBase64(file),
          });
        }

        updateImportProgress(
          importTab,
          "uploading",
          46,
          `Uploading ${payload.length} resume file${payload.length === 1 ? "" : "s"} to the backend…`
        );
        summary = await ingestApplicantsFromFiles(targetJobId, payload, (progress: IngestUploadProgress) => {
          updateImportProgress(
            importTab,
            "uploading",
            mapPercentToRange(progress.percent, 46, 88),
            `Uploading encoded resume files… ${progress.percent}%`
          );
        });
        setFiles([]);
      } else {
        const parsedLinks = links
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean);

        if (parsedLinks.length === 0) {
          throw new Error("Paste at least one URL before importing.");
        }

        updateImportProgress(
          importTab,
          "preparing",
          20,
          `Preparing ${parsedLinks.length} link${parsedLinks.length === 1 ? "" : "s"} for backend parsing…`
        );
        updateImportProgress(
          importTab,
          "uploading",
          46,
          `Uploading ${parsedLinks.length} candidate link${parsedLinks.length === 1 ? "" : "s"}…`
        );
        summary = await ingestApplicantsFromLinks(targetJobId, parsedLinks, (progress: IngestUploadProgress) => {
          updateImportProgress(
            importTab,
            "uploading",
            mapPercentToRange(progress.percent, 46, 88),
            `Uploading candidate links… ${progress.percent}%`
          );
        });
        setLinks("");
      }

      updateImportProgress(importTab, "refreshing", 92, "Refreshing jobs and applicant preview…");
      setLastImportSummary(summary);
      setLastImportTab(importTab);
      setPage(1);
      await loadJobs();
      updateImportProgress(importTab, "refreshing", 96, "Reloading live applicant records…");
      await loadApplicants(targetJobId);
      updateImportProgress(importTab, "refreshing", 100, "Import complete. Preparing summary…");
      setShowSuccessModal(true);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Failed to import applicants.");
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  }

  const successTitle =
    lastImportTab === "pdf" || lastImportTab === "links" ? "Applicants Processed!" : "Applicants Imported!";
  const successDescription =
    lastImportTab === "pdf" || lastImportTab === "links"
      ? `${lastImportSummary?.created ?? 0} applicant records were processed for the selected job.`
      : `${lastImportSummary?.created ?? 0} applicant records were saved to the selected job.`;
  const currentImportStageIndex = importProgress
    ? importStages.findIndex((stage) => stage.id === importProgress.stage)
    : -1;

  if (isLoadingJobs && jobs.length === 0) {
    return <IngestPageSkeleton />;
  }

  return (
    <div className="w-full px-6 py-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Ingest Applicants</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Import applicants into a real job and review live backend records in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button
            onClick={() => void handleImport()}
            disabled={isImporting || isLoadingJobs || !selectedJob}
            leftIcon={isImporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : undefined}
          >
            {isImporting ? "Importing" : "Import Candidates"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {managementError && (
        <div className="mb-6 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {managementError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="order-2 flex flex-col gap-6 lg:order-1">
          <Card className="overflow-hidden">
            <div role="tablist" className="flex items-center gap-1 border-b border-line p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.label}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:px-4 ${
                      activeTab === tab.id ? "bg-brand text-white" : "text-ink-muted hover:bg-surface-soft"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === "json" && (
              <JsonTab
                files={jsonFiles}
                onFiles={addJsonFiles}
                onRemove={removeJsonFile}
                onViewSchema={() => setShowSchemaModal(true)}
              />
            )}
            {activeTab === "pdf" && <PdfTab files={files} onFiles={addFiles} onRemove={removeFile} />}
            {activeTab === "csv" && <CsvTab files={csvFiles} onFiles={addCsvFiles} onRemove={removeCsvFile} />}
            {activeTab === "links" && <LinksTab links={links} onChange={setLinks} />}
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Live Applicant Preview</h3>
                <p className="text-sm text-ink-muted">
                  Existing applicants for the selected job, loaded directly from the backend.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedApplicantIds.length > 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    disabled={isDeletingApplicants}
                    onClick={() => openDeleteConfirmation()}
                  >
                    Delete Selected ({selectedApplicantIds.length})
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={isLoadingApplicants ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  disabled={!selectedJob || isLoadingApplicants}
                  onClick={() => {
                    if (selectedJob) {
                      void loadApplicants(selectedJob);
                    }
                  }}
                >
                  Refresh
                </Button>
              </div>
            </div>

            <div className="border-b border-line px-6 py-4">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search applicants by name, email, skill, location, or source…"
                  className="pl-9"
                />
              </div>
            </div>

            <div role="table">
              <div className="hidden grid-cols-[auto_1.5fr_0.8fr_1.4fr_1fr_auto] gap-4 bg-surface-soft/30 px-6 py-3 text-[11px] uppercase tracking-wider text-ink-muted md:grid">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allPaginatedApplicantsSelected}
                    onChange={toggleSelectAllPaginatedApplicants}
                    className="h-4 w-4 rounded border-line text-brand"
                    aria-label="Select applicants on this page"
                  />
                </label>
                <span>Candidate</span>
                <span>Status</span>
                <span>Extracted Skills</span>
                <span>Source</span>
                <span className="text-right">Actions</span>
              </div>
              <ul className="divide-y divide-line">
                {isLoadingApplicants && applicants.length === 0 ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <li
                      key={`loading-${index}`}
                      className="grid grid-cols-1 gap-3 px-6 py-4 text-sm md:grid-cols-[auto_1.5fr_0.8fr_1.4fr_1fr_auto] md:items-center md:gap-4"
                    >
                      <Skeleton className="hidden h-4 w-4 md:block" delayIndex={index} />
                      <div className="flex items-center gap-3">
                        <Skeleton shape="circle" className="h-8 w-8" delayIndex={index + 1} />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" delayIndex={index + 2} />
                          <Skeleton className="h-3 w-36" delayIndex={index + 3} />
                        </div>
                      </div>
                      <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 4} />
                      <div className="flex flex-wrap gap-1.5">
                        <Skeleton shape="pill" className="h-6 w-16" delayIndex={index + 5} />
                        <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 6} />
                        <Skeleton shape="pill" className="h-6 w-14" delayIndex={index + 7} />
                      </div>
                      <Skeleton shape="pill" className="h-6 w-24" delayIndex={index + 8} />
                      <div className="hidden justify-end gap-2 md:flex">
                        <Skeleton shape="pill" className="h-8 w-16" delayIndex={index + 9} />
                        <Skeleton shape="pill" className="h-8 w-16" delayIndex={index + 10} />
                      </div>
                    </li>
                  ))
                ) : paginatedApplicants.length > 0 ? (
                  paginatedApplicants.map((applicant) => (
                    <li
                      key={applicant._id}
                      className="grid grid-cols-1 gap-3 px-6 py-4 text-sm md:grid-cols-[auto_1.5fr_0.8fr_1.4fr_1fr_auto] md:items-center md:gap-4"
                    >
                      <label className="hidden items-center md:flex">
                        <input
                          type="checkbox"
                          checked={selectedApplicantIds.includes(applicant._id)}
                          onChange={() => toggleApplicantSelection(applicant._id)}
                          className="h-4 w-4 rounded border-line text-brand"
                          aria-label={`Select ${getApplicantDisplayName(applicant)}`}
                        />
                      </label>
                      <div className="flex items-center gap-3">
                        <Avatar name={getApplicantDisplayName(applicant)} size={32} />
                        <div>
                          <p className="flex items-center gap-1.5 font-medium text-ink">
                            {getApplicantDisplayName(applicant)}
                            {(applicant.ingestStatus === "failed" || applicant.ingestError) && (
                              <AlertCircle className="h-3.5 w-3.5 text-danger" />
                            )}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {applicant.headline?.trim() || applicant.email}
                            {applicant.location ? ` · ${applicant.location}` : ""}
                            {formatApplicantExperience(applicant) !== "—" ? ` · ${formatApplicantExperience(applicant)}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge tone={getStatusTone(applicant.ingestStatus)} pill>
                        {getStatusLabel(applicant.ingestStatus)}
                      </Badge>
                      <div className="flex flex-wrap gap-1.5">
                        {getApplicantSkills(applicant).length > 0 ? (
                          getApplicantSkills(applicant).map((skill) => (
                            <Badge key={`${applicant._id}-${skill}`} tone="neutral">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-ink-muted">No extracted skills yet</span>
                        )}
                      </div>
                      <Badge tone="info" pill>
                        {humanizeApplicantSource(applicant.source)}
                      </Badge>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Pencil className="h-3.5 w-3.5" />}
                          onClick={() => openApplicantEditor(applicant)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => openDeleteConfirmation(applicant)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-6 py-10 text-sm text-ink-muted">
                    {searchQuery.trim()
                      ? "No applicants match the current search."
                      : "No applicants are attached to this job yet. Import a batch to populate the preview."}
                  </li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between border-t border-line px-6 py-3 text-sm text-ink-muted">
              <p>
                {filteredApplicants.length > 0
                  ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filteredApplicants.length)} of ${filteredApplicants.length}`
                  : "No applicant records yet"}
              </p>
              <nav className="flex gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((nextPage) => (
                  <button
                    key={nextPage}
                    onClick={() => setPage(nextPage)}
                    className={`h-8 w-8 rounded-lg border text-xs transition-all ${
                      nextPage === page
                        ? "border-brand bg-brand text-white shadow-sm"
                        : "border-line text-ink hover:border-brand/40 hover:bg-surface-soft"
                    }`}
                  >
                    {nextPage}
                  </button>
                ))}
              </nav>
            </div>
          </Card>
        </div>

        <aside className="order-1 flex flex-col gap-5 lg:order-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Target Job</h3>
            <p className="mt-1 text-xs text-ink-muted">Applicants will be attached to this backend job record.</p>
            <select
              value={selectedJob}
              onChange={(event) => {
                setSelectedJob(event.target.value);
                setSelectedApplicantIds([]);
                setSearchQuery("");
                setPage(1);
              }}
              disabled={isLoadingJobs || jobs.length === 0}
              className="mt-3 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {jobs.length === 0 ? (
                <option value="">No jobs available</option>
              ) : (
                jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}
                  </option>
                ))
              )}
            </select>

            {currentJob ? (
              <div className="mt-3 flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10">
                  <Briefcase className="h-4 w-4 text-brand" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{currentJob.title}</p>
                  <p className="text-xs text-ink-muted">
                    {currentJob.applicantsCount} applicants
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-line bg-surface-soft/30 p-3 text-xs text-ink-muted">
                Create a job first to start ingesting applicants.
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Parsing Status</h3>
              <Badge tone="success" pill>
                LIVE
              </Badge>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              {applicants.length > 0
                ? `${parsedCount + failedCount} of ${applicants.length} applicant records processed`
                : "No ingestion activity for this job yet"}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-surface-soft">
                <div className="h-full rounded-full bg-brand" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs font-semibold text-ink">{progressPercent}%</span>
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {pendingCount > 0
                ? `${pendingCount} applicant records are still waiting for parsing.`
                : "All current applicant records have been processed."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Parsed</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">{parsedCount}</p>
              </div>
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Failed</p>
                <p className="mt-1 font-display text-xl font-bold text-danger">{failedCount}</p>
              </div>
            </div>
            {latestIssue ? (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-danger/5 p-3 text-xs">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <div>
                  <p className="font-semibold text-danger">
                    {latestIssue.sourceFileName || latestIssue.email || "Applicant parsing issue"}
                  </p>
                  <p className="mt-0.5 text-ink-muted">
                    {latestIssue.ingestError || "This applicant record needs attention."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-line bg-surface-soft/30 p-3 text-xs text-ink-muted">
                No applicant parsing errors have been reported for this job.
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              className="mt-3"
              leftIcon={isLoadingApplicants ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              disabled={!selectedJob || isLoadingApplicants}
              onClick={() => {
                if (selectedJob) {
                  void loadApplicants(selectedJob);
                }
              }}
            >
              Refresh Status
            </Button>
          </Card>

          <Card className="bg-brand-soft/60 p-5">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-info-deep" />
              <h4 className="text-sm font-semibold text-info-deep">Ingestion Guidelines</h4>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-info-deep/80">
              <li>JSON and CSV imports are normalized client-side before they are saved to the backend.</li>
              <li>Resume files and links are queued as pending applicants until parsing completes.</li>
              <li>Preview and status cards on this page reflect the selected job's real applicant records.</li>
            </ul>
          </Card>
        </aside>
      </div>

      <Modal open={showSchemaModal} onClose={() => setShowSchemaModal(false)} size="lg">
        <ModalHeader
          title="Example JSON Schema"
          subtitle="Use this structure when uploading applicants through the JSON importer."
          onClose={() => setShowSchemaModal(false)}
        />
        <ModalBody className="flex flex-col gap-4">
          <div className="rounded-md border border-line bg-surface-soft/30 p-4">
            <p className="text-sm font-medium text-ink">Recommended fields</p>
            <p className="mt-1 text-xs text-ink-muted">
              This example matches the backend-supported applicant shape. You can upload it directly as one applicant,
              wrap multiple applicants in an array, or use a top-level `applicants` array.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-line bg-ink px-4 py-4 text-xs leading-6 text-white">
            <code>{EXAMPLE_JSON_SCHEMA}</code>
          </pre>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowSchemaModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(editingApplicant && editForm)} onClose={closeApplicantEditor} size="xl">
        <ModalHeader
          title="Edit Applicant"
          subtitle={editingApplicant ? `Update ${getApplicantDisplayName(editingApplicant)}` : undefined}
          onClose={closeApplicantEditor}
        />
        <ModalBody className="flex flex-col gap-6">
          {editForm && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="First Name">
                  <Input
                    value={editForm.firstName}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, firstName: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Last Name">
                  <Input
                    value={editForm.lastName}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, lastName: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Email" className="md:col-span-2">
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, email: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Headline" className="md:col-span-2">
                  <Input
                    value={editForm.headline}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, headline: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Location" className="md:col-span-2">
                  <Input
                    value={editForm.location}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, location: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Bio" className="md:col-span-2">
                  <Textarea
                    rows={4}
                    value={editForm.bio}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, bio: event.target.value } : previous)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Availability Status">
                  <Input
                    value={editForm.availabilityStatus}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, availabilityStatus: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Availability Type">
                  <Input
                    value={editForm.availabilityType}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, availabilityType: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Availability Start Date">
                  <Input
                    value={editForm.availabilityStartDate}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, availabilityStartDate: event.target.value } : previous)}
                    placeholder="YYYY-MM-DD"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="LinkedIn">
                  <Input
                    value={editForm.linkedin}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, linkedin: event.target.value } : previous)}
                  />
                </Field>
                <Field label="GitHub">
                  <Input
                    value={editForm.github}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, github: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Portfolio">
                  <Input
                    value={editForm.portfolio}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, portfolio: event.target.value } : previous)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Skills JSON" hint="Provide a JSON array of skill objects.">
                  <Textarea
                    rows={8}
                    className="font-mono text-xs"
                    value={editForm.skillsJson}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, skillsJson: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Languages JSON" hint="Provide a JSON array of language objects.">
                  <Textarea
                    rows={8}
                    className="font-mono text-xs"
                    value={editForm.languagesJson}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, languagesJson: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Experience JSON" hint="Provide a JSON array of experience entries.">
                  <Textarea
                    rows={10}
                    className="font-mono text-xs"
                    value={editForm.experienceJson}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, experienceJson: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Education JSON" hint="Provide a JSON array of education entries.">
                  <Textarea
                    rows={10}
                    className="font-mono text-xs"
                    value={editForm.educationJson}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, educationJson: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Certifications JSON" hint="Provide a JSON array of certification entries.">
                  <Textarea
                    rows={8}
                    className="font-mono text-xs"
                    value={editForm.certificationsJson}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, certificationsJson: event.target.value } : previous)}
                  />
                </Field>
                <Field label="Projects JSON" hint="Provide a JSON array of project entries.">
                  <Textarea
                    rows={8}
                    className="font-mono text-xs"
                    value={editForm.projectsJson}
                    onChange={(event) => setEditForm((previous) => previous ? { ...previous, projectsJson: event.target.value } : previous)}
                  />
                </Field>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={closeApplicantEditor} disabled={isSavingApplicant}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSaveApplicant()}
            disabled={isSavingApplicant || !editForm}
            leftIcon={isSavingApplicant ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
          >
            {isSavingApplicant ? "Saving" : "Save Changes"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showDeleteModal} onClose={closeDeleteConfirmation} size="sm">
        <ModalHeader
          title={applicantToDelete ? "Delete Applicant" : "Delete Selected Applicants"}
          subtitle={
            applicantToDelete
              ? `Remove ${getApplicantDisplayName(applicantToDelete)} from this job`
              : `Remove ${selectedApplicants.length} selected applicant record${selectedApplicants.length === 1 ? "" : "s"}`
          }
          onClose={closeDeleteConfirmation}
        />
        <ModalBody className="flex flex-col gap-4">
          <div className="rounded-md border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
            This action permanently removes the applicant data from the selected job.
          </div>
          <p className="text-sm text-ink-muted">
            {applicantToDelete
              ? "The applicant record, extracted profile fields, and parsed metadata will be deleted."
              : "All selected applicant records, including their extracted profile fields and parsed metadata, will be deleted."}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={closeDeleteConfirmation} disabled={isDeletingApplicants}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => void handleDeleteApplicants()}
            disabled={isDeletingApplicants}
            leftIcon={isDeletingApplicants ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          >
            {isDeletingApplicants ? "Deleting" : applicantToDelete ? "Delete Applicant" : "Delete Selected"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        open={Boolean(importProgress)}
        onClose={() => {
          if (!isImporting) {
            setImportProgress(null);
          }
        }}
        size="md"
      >
        <ModalBody className="flex flex-col gap-6 py-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
              {isImporting ? (
                <LoaderCircle className="h-8 w-8 animate-spin text-brand" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-success" />
              )}
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-ink">
              {importProgress?.title || "Importing applicants"}
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-muted">
              {importProgress?.detail || "Preparing your applicant import."}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface-soft/30 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <span>Import Progress</span>
              <span className="text-ink">{importProgress?.percent ?? 0}%</span>
            </div>
            <Progress value={importProgress?.percent ?? 0} className="mt-3 h-2" />
            <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span>
                Targeting {currentJob?.title || "selected job"} with {getImportModeLabel(importProgress?.mode || activeTab)}.
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {importStages.map((stage, index) => {
              const Icon = stage.icon;
              const isComplete = currentImportStageIndex > index || (!isImporting && currentImportStageIndex >= index);
              const isCurrent = currentImportStageIndex === index && isImporting;

              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                    isComplete
                      ? "border-success/30 bg-success/5"
                      : isCurrent
                        ? "border-brand/30 bg-brand-soft/30"
                        : "border-line bg-white"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isComplete
                        ? "bg-success/10"
                        : isCurrent
                          ? "bg-brand/10"
                          : "bg-surface-soft"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : isCurrent ? (
                      <LoaderCircle className="h-5 w-5 animate-spin text-brand" />
                    ) : (
                      <Icon className="h-5 w-5 text-ink-muted" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{stage.label}</p>
                    <p className="text-xs text-ink-muted">
                      {isCurrent
                        ? importProgress?.detail
                        : isComplete
                          ? "Completed"
                          : "Waiting to start"}
                    </p>
                  </div>
                  {isComplete && <Badge tone="success" pill>Done</Badge>}
                  {isCurrent && <Badge tone="brand" pill>Active</Badge>}
                </div>
              );
            })}
          </div>
        </ModalBody>
      </Modal>

      <Modal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} size="sm">
        <ModalBody className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">{successTitle}</h2>
            <p className="mt-2 text-sm text-ink-muted">
              <strong className="text-ink">{successDescription}</strong>
              {lastImportSummary ? ` ${lastImportSummary.message}` : ""}
            </p>
          </div>

          <div className="w-full rounded-lg border border-line bg-surface-soft/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <Sparkles className="h-5 w-5 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">AI Screening</p>
                <p className="text-xs text-ink-muted">Continue to screening once your applicant pool looks ready.</p>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">Create Job</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">Ingest</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">Screen</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2.5 py-1">Shortlist</span>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>
            Stay Here
          </Button>
          <Link href="/screening">
            <Button leftIcon={<Sparkles className="h-4 w-4" />}>Start Screening</Button>
          </Link>
        </ModalFooter>
      </Modal>
    </div>
  );
}
