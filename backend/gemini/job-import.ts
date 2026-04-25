import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import WordExtractor from "word-extractor";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { GeminiClient } from "./client";

const MAX_SOURCE_TEXT_CHARS = 30_000;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_LOCATION_POLICIES = new Set(["remote", "hybrid", "onsite"]);
const ALLOWED_EMPLOYMENT_TYPES = new Set(["full-time", "part-time", "contract", "internship", "temporary"]);
const ALLOWED_SENIORITY = new Set(["junior", "mid", "senior", "lead", "manager", "principal"]);
const ALLOWED_EDUCATION = new Set(["none", "hs", "associate", "bs", "ms", "mba", "phd", "professional"]);
const ALLOWED_STATUS = new Set(["Active", "Draft", "Closed"]);

interface ImportCandidateWeightCriterion {
  id?: unknown;
  label?: unknown;
  value?: unknown;
}

interface ImportCandidatePayload {
  title?: unknown;
  hiringManager?: unknown;
  location?: unknown;
  locationPolicy?: unknown;
  employmentType?: unknown;
  salaryBand?: unknown;
  description?: unknown;
  responsibilities?: unknown;
  mustHaveQualifications?: unknown;
  niceToHaveQualifications?: unknown;
  coreHardSkills?: unknown;
  coreSoftSkills?: unknown;
  experienceYears?: unknown;
  seniorityLevel?: unknown;
  educationLevel?: unknown;
  weightCriteria?: unknown;
  status?: unknown;
}

export interface ImportedJobDraft {
  title?: string;
  hiringManager?: string;
  location?: string;
  locationPolicy?: "remote" | "hybrid" | "onsite";
  employmentType?: "full-time" | "part-time" | "contract" | "internship" | "temporary";
  salaryBand?: string;
  description?: string;
  responsibilities?: string;
  mustHaveQualifications?: string;
  niceToHaveQualifications?: string;
  coreHardSkills?: string[];
  coreSoftSkills?: string[];
  experienceYears?: number;
  seniorityLevel?: "junior" | "mid" | "senior" | "lead" | "manager" | "principal";
  educationLevel?: "none" | "hs" | "associate" | "bs" | "ms" | "mba" | "phd" | "professional";
  weightCriteria?: Array<{ id: string; label: string; value: number }>;
  status?: "Active" | "Draft" | "Closed";
}

export interface ParseJobLinkRequest {
  url: string;
}

export interface ParseJobFileRequest {
  fileName: string;
  mimeType?: string;
  base64Data: string;
}

export interface JobImportResponse {
  data: ImportedJobDraft;
  warnings: string[];
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function clampText(value: unknown, maxChars = 4_000): string | undefined {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  return normalized.length > maxChars ? `${normalized.slice(0, maxChars).trim()}…` : normalized;
}

function normalizeStringArray(value: unknown, maxItems = 20): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const result = value
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);

  return result.length > 0 ? result : undefined;
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return trimmed;
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

function parseModelResponse(raw: string): ImportCandidatePayload {
  const candidate = extractJsonObject(raw);

  if (!candidate) {
    throw new Error("Gemini returned an empty JSON payload.");
  }

  return JSON.parse(candidate) as ImportCandidatePayload;
}

function sanitizeWeightCriteria(value: unknown): Array<{ id: string; label: string; value: number }> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sanitized = value
    .map((criterion, index) => {
      const source = (criterion || {}) as ImportCandidateWeightCriterion;
      const label = normalizeText(source.label);
      const parsedValue = typeof source.value === "number" ? source.value : Number(source.value);
      const rounded = Number.isFinite(parsedValue) ? Math.max(0, Math.min(100, Math.round(parsedValue))) : undefined;
      const id = normalizeText(source.id) || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `criterion-${index}`);

      if (!label || rounded === undefined) {
        return undefined;
      }

      return { id, label, value: rounded };
    })
    .filter((item): item is { id: string; label: string; value: number } => Boolean(item));

  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeImportedDraft(payload: ImportCandidatePayload): ImportedJobDraft {
  const locationPolicy = normalizeText(payload.locationPolicy);
  const employmentType = normalizeText(payload.employmentType);
  const seniorityLevel = normalizeText(payload.seniorityLevel);
  const educationLevel = normalizeText(payload.educationLevel);
  const status = normalizeText(payload.status);

  const draft: ImportedJobDraft = {
    title: clampText(payload.title, 160),
    hiringManager: clampText(payload.hiringManager, 160),
    location: clampText(payload.location, 160),
    locationPolicy:
      locationPolicy && ALLOWED_LOCATION_POLICIES.has(locationPolicy)
        ? (locationPolicy as ImportedJobDraft["locationPolicy"])
        : undefined,
    employmentType:
      employmentType && ALLOWED_EMPLOYMENT_TYPES.has(employmentType)
        ? (employmentType as ImportedJobDraft["employmentType"])
        : undefined,
    salaryBand: clampText(payload.salaryBand, 160),
    description: clampText(payload.description, 6_000),
    responsibilities: clampText(payload.responsibilities, 10_000),
    mustHaveQualifications: clampText(payload.mustHaveQualifications, 7_000),
    niceToHaveQualifications: clampText(payload.niceToHaveQualifications, 7_000),
    coreHardSkills: normalizeStringArray(payload.coreHardSkills, 30),
    coreSoftSkills: normalizeStringArray(payload.coreSoftSkills, 30),
    experienceYears: Number.isFinite(Number(payload.experienceYears))
      ? Math.max(0, Math.min(50, Math.round(Number(payload.experienceYears))))
      : undefined,
    seniorityLevel:
      seniorityLevel && ALLOWED_SENIORITY.has(seniorityLevel)
        ? (seniorityLevel as ImportedJobDraft["seniorityLevel"])
        : undefined,
    educationLevel:
      educationLevel && ALLOWED_EDUCATION.has(educationLevel)
        ? (educationLevel as ImportedJobDraft["educationLevel"])
        : undefined,
    weightCriteria: sanitizeWeightCriteria(payload.weightCriteria),
    status: status && ALLOWED_STATUS.has(status) ? (status as ImportedJobDraft["status"]) : undefined,
  };

  return draft;
}

function stripHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  return withoutScripts
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateSourceText(input: string): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  return normalized.length > MAX_SOURCE_TEXT_CHARS ? normalized.slice(0, MAX_SOURCE_TEXT_CHARS) : normalized;
}

function buildExtractionPrompt(sourceType: "url" | "file", sourceValue: string, sourceText: string): string {
  return [
    "Extract a job posting into strict JSON for a recruiting system.",
    "Be exhaustive: capture as much job-relevant information as is explicit in the source. Do not summarize or omit details that the source provides — preserve them in the appropriate field.",
    "Only include information that is explicit in the source. If unknown, return null or empty arrays. Do not hallucinate or invent details.",
    "Field guidance — extract everything available; do not paraphrase away useful detail:",
    "- title: the exact job title.",
    "- hiringManager: name of the hiring manager / reporting manager / contact person if listed.",
    "- location: the city/region/country (or 'Remote' if explicitly remote-only). Capture every location mentioned.",
    "- salaryBand: full compensation info as written (range, currency, period, equity, bonus) when disclosed.",
    "- description: a comprehensive overview of the role and the team/company context. Include the company/team intro, mission, what the role is about, why the role exists, what success looks like, the work environment, perks/benefits, and any application instructions or deadlines that don't fit other fields. Preserve sentences from the source where useful — do not over-condense.",
    "- responsibilities: a complete list of duties / day-to-day activities / deliverables / KPIs. Use bullet points (one per line) and keep every distinct responsibility from the source.",
    "- mustHaveQualifications: every required/non-negotiable qualification, including required years of experience, required degrees/certifications, required hard skills with required proficiency, languages, work authorization, travel, on-call, security clearances, etc. One bullet per requirement.",
    "- niceToHaveQualifications: every preferred / bonus / 'plus' / 'a plus' qualification, including preferred certifications, preferred tools, additional languages, domain experience, etc. Put preferred/bonus skills here — do not create a separate preferred skills field.",
    "- coreHardSkills: deduplicated list of concrete technical skills, tools, languages, frameworks, platforms, and methodologies the role uses (e.g. 'Python', 'AWS', 'React', 'SQL', 'Figma'). Pull from anywhere in the post.",
    "- coreSoftSkills: deduplicated list of soft skills / behavioral traits explicitly called out (e.g. 'communication', 'leadership', 'attention to detail').",
    "- experienceYears: the minimum required years of professional experience as a single integer. If a range is given, use the lower bound.",
    "- weightCriteria: only include if the source explicitly weights criteria; otherwise return an empty array.",
    "Enums must exactly match allowed values:",
    '- locationPolicy: "remote" | "hybrid" | "onsite"',
    '- employmentType: "full-time" | "part-time" | "contract" | "internship" | "temporary"',
    '- seniorityLevel: "junior" | "mid" | "senior" | "lead" | "manager" | "principal"',
    '- educationLevel: "none" | "hs" | "associate" | "bs" | "ms" | "mba" | "phd" | "professional"',
    '- status: "Active" | "Draft" | "Closed"',
    "Return only valid JSON with this exact top-level shape:",
    '{"title":string|null,"hiringManager":string|null,"location":string|null,"locationPolicy":string|null,"employmentType":string|null,"salaryBand":string|null,"description":string|null,"responsibilities":string|null,"mustHaveQualifications":string|null,"niceToHaveQualifications":string|null,"coreHardSkills":string[],"coreSoftSkills":string[],"experienceYears":number|null,"seniorityLevel":string|null,"educationLevel":string|null,"weightCriteria":[{"id":string,"label":string,"value":number}],"status":string|null}',
    `Source Type: ${sourceType}`,
    `Source Reference: ${sourceValue}`,
    "Source Content:",
    sourceText,
  ].join("\n");
}

function inferMimeFromName(fileName: string): string {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) {
    return "application/msword";
  }

  return "";
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const parsed = await parser.getText();
    return parsed.text || "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const parsed = await mammoth.extractRawText({ buffer });
  return parsed.value || "";
}

async function extractTextFromDoc(buffer: Buffer): Promise<string> {
  const extractor = new WordExtractor();
  const tempFile = path.join(os.tmpdir(), `job-import-${randomUUID()}.doc`);

  await fs.writeFile(tempFile, buffer);

  try {
    const document = await extractor.extract(tempFile);
    return document.getBody() || "";
  } finally {
    await fs.unlink(tempFile).catch(() => undefined);
  }
}

export class GeminiJobImportService {
  constructor(private readonly client: GeminiClient) {}

  private ensureConfigured() {
    if (!this.client.isConfigured()) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
  }

  private async parseTextWithGemini(sourceType: "url" | "file", sourceValue: string, rawText: string) {
    this.ensureConfigured();

    const preparedText = truncateSourceText(rawText);
    if (!preparedText) {
      throw new Error("No readable job content was found in the provided source.");
    }

    const response = await this.client.generateText({
      prompt: buildExtractionPrompt(sourceType, sourceValue, preparedText),
      responseMimeType: "application/json",
      temperature: 0,
      maxOutputTokens: 4500,
    });

    const parsed = parseModelResponse(response.text);
    return sanitizeImportedDraft(parsed);
  }

  public async parseFromLink(payload: ParseJobLinkRequest): Promise<JobImportResponse> {
    const sourceUrl = normalizeText(payload.url);

    if (!sourceUrl) {
      throw new Error("A job URL is required.");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      throw new Error("Please enter a valid public URL.");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Only http/https URLs are supported.");
    }

    const response = await fetch(parsedUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AI-Hackathon-JobImporter/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Unable to access the job link (HTTP ${response.status}).`);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new Error("The provided URL is not an HTML or text page.");
    }

    const html = await response.text();
    const readable = contentType.includes("text/plain") ? html : stripHtml(html);
    const imported = await this.parseTextWithGemini("url", parsedUrl.toString(), readable);

    const warnings: string[] = [];
    if (!imported.title || !imported.description) {
      warnings.push("Some key fields were not confidently detected and were left unchanged.");
    }

    return { data: imported, warnings };
  }

  public async parseFromFile(payload: ParseJobFileRequest): Promise<JobImportResponse> {
    const fileName = normalizeText(payload.fileName);

    if (!fileName) {
      throw new Error("File name is required.");
    }

    const base64Data = normalizeText(payload.base64Data);
    if (!base64Data) {
      throw new Error("File payload is empty.");
    }

    const mimeType = normalizeText(payload.mimeType) || inferMimeFromName(fileName);
    const supported = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);

    if (!mimeType || !supported.has(mimeType)) {
      throw new Error("Unsupported file type. Please upload a PDF, DOC, or DOCX file.");
    }

    const buffer = Buffer.from(base64Data, "base64");
    if (!buffer.length) {
      throw new Error("File payload could not be decoded.");
    }

    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new Error("File is too large. Please upload a file up to 10MB.");
    }

    let extractedText = "";

    if (mimeType === "application/pdf") {
      extractedText = await extractTextFromPdf(buffer);
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      extractedText = await extractTextFromDocx(buffer);
    } else {
      extractedText = await extractTextFromDoc(buffer);
    }

    const imported = await this.parseTextWithGemini("file", fileName, extractedText);

    const warnings: string[] = [];
    if (!imported.title || !imported.description) {
      warnings.push("Some key fields were not confidently detected and were left unchanged.");
    }

    return { data: imported, warnings };
  }
}
