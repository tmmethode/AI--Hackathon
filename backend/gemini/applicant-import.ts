import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import WordExtractor from "word-extractor";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { GeminiClient } from "./client";
import { ApplicantProfileInput } from "../interfaces/applicant";

const MAX_SOURCE_TEXT_CHARS = 35_000;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export interface ParseApplicantLinkRequest {
  url: string;
}

export interface ParseApplicantFileRequest {
  fileName: string;
  mimeType?: string;
  base64Data: string;
}

export interface ApplicantImportResponse {
  applicants: ApplicantProfileInput[];
  warnings: string[];
  rawResponse: unknown;
  sourceTextChars: number;
}

interface ApplicantExtractionEnvelope {
  applicants?: unknown;
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function inferMimeFromName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".doc")) return "application/msword";
  return "";
}

function truncateSourceText(input: string): string {
  const normalized = input
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > MAX_SOURCE_TEXT_CHARS ? normalized.slice(0, MAX_SOURCE_TEXT_CHARS) : normalized;
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

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return trimmed;
  }
  return trimmed.slice(firstBrace, lastBrace + 1);
}

function parseModelResponse(raw: string): ApplicantExtractionEnvelope {
  const candidate = extractJsonObject(raw);
  if (!candidate) {
    throw new Error("Gemini returned an empty JSON payload.");
  }
  return JSON.parse(candidate) as ApplicantExtractionEnvelope;
}

function cleanStringArray(value: unknown, maxItems = 25): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    const text = normalizeText(item);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= maxItems) break;
  }

  return result;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeApplicant(raw: unknown): ApplicantProfileInput | null {
  const source = (raw || {}) as Record<string, unknown>;

  const firstName = normalizeText(source.firstName);
  const lastName = normalizeText(source.lastName);
  const email = normalizeText(source.email)?.toLowerCase();

  if (!firstName || !lastName || !email) {
    return null;
  }

  const skills = Array.isArray(source.skills)
    ? source.skills
        .map((entry) => {
          const skill = (entry || {}) as Record<string, unknown>;
          const name = normalizeText(skill.name);
          if (!name) return null;
          const years = toNumber(skill.yearsOfExperience);
          return {
            name,
            level: normalizeText(skill.level),
            yearsOfExperience: years !== undefined ? Math.max(0, Math.min(60, Math.round(years))) : undefined,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const languages = Array.isArray(source.languages)
    ? source.languages
        .map((entry) => {
          const language = (entry || {}) as Record<string, unknown>;
          const name = normalizeText(language.name);
          if (!name) return null;
          return {
            name,
            proficiency: normalizeText(language.proficiency),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const experience = Array.isArray(source.experience)
    ? source.experience
        .map((entry) => {
          const experienceItem = (entry || {}) as Record<string, unknown>;
          const company = normalizeText(experienceItem.company);
          const role = normalizeText(experienceItem.role);
          if (!company || !role) return null;
          const endDate = normalizeText(experienceItem.endDate);
          const isCurrent = typeof experienceItem.isCurrent === "boolean" ? experienceItem.isCurrent : !endDate;
          return {
            company,
            role,
            startDate: normalizeText(experienceItem.startDate),
            endDate,
            description: normalizeText(experienceItem.description),
            technologies: cleanStringArray(experienceItem.technologies),
            isCurrent,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const education = Array.isArray(source.education)
    ? source.education
        .map((entry) => {
          const educationItem = (entry || {}) as Record<string, unknown>;
          const institution = normalizeText(educationItem.institution);
          if (!institution) return null;
          const startYear = toNumber(educationItem.startYear);
          const endYear = toNumber(educationItem.endYear);
          return {
            institution,
            degree: normalizeText(educationItem.degree),
            fieldOfStudy: normalizeText(educationItem.fieldOfStudy),
            startYear: startYear !== undefined ? Math.round(startYear) : undefined,
            endYear: endYear !== undefined ? Math.round(endYear) : undefined,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const certifications = Array.isArray(source.certifications)
    ? source.certifications
        .map((entry) => {
          const cert = (entry || {}) as Record<string, unknown>;
          const name = normalizeText(cert.name);
          if (!name) return null;
          return {
            name,
            issuer: normalizeText(cert.issuer),
            issueDate: normalizeText(cert.issueDate),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const projects = Array.isArray(source.projects)
    ? source.projects
        .map((entry) => {
          const project = (entry || {}) as Record<string, unknown>;
          const name = normalizeText(project.name);
          if (!name) return null;
          return {
            name,
            description: normalizeText(project.description),
            technologies: cleanStringArray(project.technologies),
            role: normalizeText(project.role),
            link: normalizeText(project.link),
            startDate: normalizeText(project.startDate),
            endDate: normalizeText(project.endDate),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const availabilitySource = (source.availability || {}) as Record<string, unknown>;
  const socialSource = (source.socialLinks || {}) as Record<string, unknown>;

  return {
    firstName,
    lastName,
    email,
    headline: normalizeText(source.headline),
    bio: normalizeText(source.bio),
    location: normalizeText(source.location),
    skills,
    languages,
    experience,
    education,
    certifications,
    projects,
    availability: {
      status: normalizeText(availabilitySource.status),
      type: normalizeText(availabilitySource.type),
      startDate: normalizeText(availabilitySource.startDate),
    },
    socialLinks: {
      linkedin: normalizeText(socialSource.linkedin),
      github: normalizeText(socialSource.github),
      portfolio: normalizeText(socialSource.portfolio),
    },
  };
}

function buildExtractionPrompt(sourceType: "url" | "file", sourceValue: string, sourceText: string): string {
  return [
    "Extract applicant resume/profile data into strict JSON for recruitment ingestion.",
    "Return JSON only. Do not include markdown fences or commentary.",
    "Only use evidence from source content. If unknown, use empty string or empty arrays.",
    "Never invent employers, dates, links, or certifications.",
    "Strictly return top-level object with key applicants only.",
    'Output schema: {"applicants":[{"firstName":"","lastName":"","email":"","headline":"","bio":"","location":"","skills":[{"name":"","level":"","yearsOfExperience":0}],"languages":[{"name":"","proficiency":""}],"experience":[{"company":"","role":"","startDate":"","endDate":"","description":"","technologies":[""],"isCurrent":false}],"education":[{"institution":"","degree":"","fieldOfStudy":"","startYear":0,"endYear":0}],"certifications":[{"name":"","issuer":"","issueDate":""}],"projects":[{"name":"","description":"","technologies":[""],"role":"","link":"","startDate":"","endDate":""}],"availability":{"status":"","type":"","startDate":""},"socialLinks":{"linkedin":"","github":"","portfolio":""}}]}',
    "Do not include keys outside this schema.",
    `Source Type: ${sourceType}`,
    `Source Reference: ${sourceValue}`,
    "Source Content:",
    sourceText,
  ].join("\n");
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
  const tempFile = path.join(os.tmpdir(), `applicant-import-${randomUUID()}.doc`);
  await fs.writeFile(tempFile, buffer);

  try {
    const document = await extractor.extract(tempFile);
    return document.getBody() || "";
  } finally {
    await fs.unlink(tempFile).catch(() => undefined);
  }
}

export class GeminiApplicantImportService {
  constructor(private readonly client: GeminiClient) {}

  public isConfigured(): boolean {
    return this.client.isConfigured();
  }

  private async parseTextWithGemini(
    sourceType: "url" | "file",
    sourceValue: string,
    rawText: string
  ): Promise<ApplicantImportResponse> {
    const preparedText = truncateSourceText(rawText);
    if (!preparedText) {
      throw new Error("No readable applicant content was found in the provided source.");
    }

    const response = await this.client.generateText({
      prompt: buildExtractionPrompt(sourceType, sourceValue, preparedText),
      responseMimeType: "application/json",
      temperature: 0,
      maxOutputTokens: 2600,
    });

    const parsedPayload = parseModelResponse(response.text);
    const normalizedApplicants = Array.isArray(parsedPayload.applicants)
      ? parsedPayload.applicants
          .map((item) => normalizeApplicant(item))
          .filter((item): item is ApplicantProfileInput => Boolean(item))
      : [];

    if (!normalizedApplicants.length) {
      throw new Error("AI extraction did not return any valid applicant profile.");
    }

    const warnings: string[] = [];
    if (normalizedApplicants.some((applicant) => !applicant.headline && !applicant.bio)) {
      warnings.push("Some applicants were parsed with limited profile summary data.");
    }

    return {
      applicants: normalizedApplicants,
      warnings,
      rawResponse: parsedPayload,
      sourceTextChars: preparedText.length,
    };
  }

  public async parseFromFile(payload: ParseApplicantFileRequest): Promise<ApplicantImportResponse> {
    const fileName = normalizeText(payload.fileName);
    if (!fileName) {
      throw new Error("File name is required.");
    }

    const base64Data = normalizeText(payload.base64Data);
    if (!base64Data) {
      throw new Error("File payload is empty.");
    }

    const mimeType = normalizeText(payload.mimeType) || inferMimeFromName(fileName);
    if (!mimeType || !SUPPORTED_FILE_TYPES.has(mimeType)) {
      throw new Error("Unsupported file type. Please upload PDF, DOC, or DOCX.");
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

    return this.parseTextWithGemini("file", fileName, extractedText);
  }

  public async parseFromLink(payload: ParseApplicantLinkRequest): Promise<ApplicantImportResponse> {
    const sourceUrl = normalizeText(payload.url);
    if (!sourceUrl) {
      throw new Error("A profile URL is required.");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      throw new Error("Please enter a valid public URL.");
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error("Only http/https URLs are supported.");
    }

    const response = await fetch(parsedUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AI-Hackathon-ApplicantImporter/1.0)",
        Accept: "text/html,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Unable to access the applicant link (HTTP ${response.status}).`);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    const sourceRef = parsedUrl.toString();

    if (contentType.includes("application/pdf") || sourceRef.toLowerCase().endsWith(".pdf")) {
      const arrayBuffer = await response.arrayBuffer();
      const text = await extractTextFromPdf(Buffer.from(arrayBuffer));
      return this.parseTextWithGemini("url", sourceRef, text);
    }

    if (
      contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
      sourceRef.toLowerCase().endsWith(".docx")
    ) {
      const arrayBuffer = await response.arrayBuffer();
      const text = await extractTextFromDocx(Buffer.from(arrayBuffer));
      return this.parseTextWithGemini("url", sourceRef, text);
    }

    if (contentType.includes("application/msword") || sourceRef.toLowerCase().endsWith(".doc")) {
      const arrayBuffer = await response.arrayBuffer();
      const text = await extractTextFromDoc(Buffer.from(arrayBuffer));
      return this.parseTextWithGemini("url", sourceRef, text);
    }

    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new Error("The provided URL is not an HTML/text profile page or supported resume document.");
    }

    const text = await response.text();
    const readable = contentType.includes("text/plain") ? text : stripHtml(text);
    return this.parseTextWithGemini("url", sourceRef, readable);
  }
}
