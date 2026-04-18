import { GeminiClient } from "./client";
import {
  buildBatchScreeningPrompt,
  buildCandidateScreeningPrompt,
  GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION,
  GEMINI_HIRING_SYSTEM_INSTRUCTION,
} from "./prompts";
import { buildCriterionAssessments, computeFinalWeightedScore, deriveRankingCriteria } from "./rubric";
import {
  GeminiBatchApplicant,
  GeminiBatchRecommendation,
  GeminiBatchScreeningRequest,
  GeminiBatchScreeningResponse,
  GeminiBatchScreeningResultEntry,
  GeminiBatchShortlistEntry,
  GeminiCandidateScreenRequest,
  GeminiCandidateScreenResponse,
  GeminiModelCriterionScore,
} from "./types";

const BATCH_RECOMMENDATIONS: readonly GeminiBatchRecommendation[] = [
  "Strong Reject",
  "Reject",
  "Consider",
  "Shortlist",
  "Strong Shortlist",
];

function estimateBatchTokenBudget(applicantCount: number): number {
  return Math.max(1500, Math.min(8192, 600 + applicantCount * 350));
}

function normalizeRecommendation(value: unknown): GeminiBatchRecommendation {
  if (typeof value !== "string") {
    return "Consider";
  }

  const normalized = value.trim().toLowerCase();
  const match = BATCH_RECOMMENDATIONS.find(
    (candidate) => candidate.toLowerCase() === normalized
  );

  if (match) {
    return match;
  }

  if (normalized.includes("strong") && normalized.includes("short")) {
    return "Strong Shortlist";
  }

  if (normalized.includes("strong") && normalized.includes("reject")) {
    return "Strong Reject";
  }

  if (normalized.includes("short")) {
    return "Shortlist";
  }

  if (normalized.includes("reject")) {
    return "Reject";
  }

  return "Consider";
}

function recommendationFromScore(matchScore: number): GeminiBatchRecommendation {
  if (matchScore >= 85) {
    return "Strong Shortlist";
  }

  if (matchScore >= 70) {
    return "Shortlist";
  }

  if (matchScore >= 55) {
    return "Consider";
  }

  if (matchScore >= 35) {
    return "Reject";
  }

  return "Strong Reject";
}

function fullNameFromApplicant(applicant: GeminiBatchApplicant): string {
  return [applicant.firstName, applicant.lastName].filter(Boolean).join(" ").trim();
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

function clampScore(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function toCriterionScores(value: unknown): GeminiModelCriterionScore[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const score = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};

    return {
      label: score.label ? String(score.label) : "Unknown Criterion",
      score: typeof score.score === "number" ? score.score : Number(score.score ?? 0),
      summary: score.summary ? String(score.summary) : "",
      evidence: toStringArray(score.evidence),
    };
  });
}

interface ParsedBatchEntry {
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
  finalRecommendation: GeminiBatchRecommendation;
  summaryExplanation: string;
}

function parseBatchEntry(raw: unknown): ParsedBatchEntry | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const entry = raw as Record<string, unknown>;
  const email = entry.applicantEmail ? String(entry.applicantEmail).trim().toLowerCase() : "";

  if (!email) {
    return null;
  }

  const matchScore = clampScore(entry.matchScore);

  return {
    applicantEmail: email,
    fullName: entry.fullName ? String(entry.fullName).trim() : "",
    matchScore,
    confidenceScore: clampScore(entry.confidenceScore),
    skillsScore: clampScore(entry.skillsScore),
    experienceScore: clampScore(entry.experienceScore),
    educationScore: clampScore(entry.educationScore),
    relevanceScore: clampScore(entry.relevanceScore),
    strengths: toStringArray(entry.strengths),
    gapsOrRisks: toStringArray(entry.gapsOrRisks),
    finalRecommendation: normalizeRecommendation(entry.finalRecommendation),
    summaryExplanation: entry.summaryExplanation ? String(entry.summaryExplanation) : "",
  };
}

function compareBatchEntries(
  left: GeminiBatchScreeningResultEntry,
  right: GeminiBatchScreeningResultEntry
): number {
  if (right.matchScore !== left.matchScore) {
    return right.matchScore - left.matchScore;
  }

  if (right.skillsScore !== left.skillsScore) {
    return right.skillsScore - left.skillsScore;
  }

  if (right.experienceScore !== left.experienceScore) {
    return right.experienceScore - left.experienceScore;
  }

  if (right.relevanceScore !== left.relevanceScore) {
    return right.relevanceScore - left.relevanceScore;
  }

  return right.confidenceScore - left.confidenceScore;
}

export class GeminiScreeningService {
  constructor(private readonly client = new GeminiClient()) {}

  public async screenCandidate(request: GeminiCandidateScreenRequest): Promise<GeminiCandidateScreenResponse> {
    const rankingCriteria = deriveRankingCriteria(request.job);
    const response = await this.client.generateText({
      prompt: buildCandidateScreeningPrompt(request),
      systemInstruction: GEMINI_HIRING_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      temperature: request.temperature ?? 0.2,
      maxOutputTokens: 1200,
    });

    const parsed = JSON.parse(extractJsonObject(response.text)) as Partial<GeminiCandidateScreenResponse> & {
      criterionScores?: unknown;
    };
    const criterionAssessments = buildCriterionAssessments(rankingCriteria, toCriterionScores(parsed.criterionScores));

    const recommendation =
      parsed.recommendation === "strong_yes" ||
      parsed.recommendation === "yes" ||
      parsed.recommendation === "maybe" ||
      parsed.recommendation === "no"
        ? parsed.recommendation
        : "maybe";

    return {
      recommendation,
      score: computeFinalWeightedScore(criterionAssessments),
      mustHaveMatchScore: clampScore(parsed.mustHaveMatchScore),
      dataCompletenessScore: clampScore(parsed.dataCompletenessScore),
      summary: parsed.summary ? String(parsed.summary) : "No summary returned by Gemini.",
      strengths: toStringArray(parsed.strengths),
      concerns: toStringArray(parsed.concerns),
      evidence: toStringArray(parsed.evidence),
      criterionAssessments,
      raw: response.text,
      model: response.model,
    };
  }

  public async screenBatch(request: GeminiBatchScreeningRequest): Promise<GeminiBatchScreeningResponse> {
    if (!request.applicants || request.applicants.length === 0) {
      throw new Error("At least one applicant is required for Gemini batch screening");
    }

    const shortlistCount = Math.max(
      0,
      Math.min(Math.floor(request.shortlistCount ?? 0), request.applicants.length)
    );

    const response = await this.client.generateText({
      prompt: buildBatchScreeningPrompt({ ...request, shortlistCount }),
      systemInstruction: GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      temperature: request.temperature ?? 0.2,
      maxOutputTokens: estimateBatchTokenBudget(request.applicants.length),
    });

    const parsed = JSON.parse(extractJsonObject(response.text)) as {
      screeningResults?: unknown;
      shortlist?: unknown;
    };

    const applicantIndex = new Map<string, GeminiBatchApplicant>();
    for (const applicant of request.applicants) {
      if (applicant.email) {
        applicantIndex.set(applicant.email.trim().toLowerCase(), applicant);
      }
    }

    const parsedEntries = Array.isArray(parsed.screeningResults)
      ? (parsed.screeningResults as unknown[])
          .map(parseBatchEntry)
          .filter((entry): entry is ParsedBatchEntry => entry !== null)
      : [];

    const entryByEmail = new Map<string, ParsedBatchEntry>();
    for (const entry of parsedEntries) {
      if (!entryByEmail.has(entry.applicantEmail)) {
        entryByEmail.set(entry.applicantEmail, entry);
      }
    }

    const screeningResults: GeminiBatchScreeningResultEntry[] = request.applicants.map(
      (applicant) => {
        const key = applicant.email.trim().toLowerCase();
        const entry = entryByEmail.get(key);
        const fallbackName = fullNameFromApplicant(applicant) || applicant.email;

        if (entry) {
          return {
            candidateRank: 0,
            applicantEmail: applicant.email,
            fullName: entry.fullName || fallbackName,
            matchScore: entry.matchScore,
            confidenceScore: entry.confidenceScore,
            skillsScore: entry.skillsScore,
            experienceScore: entry.experienceScore,
            educationScore: entry.educationScore,
            relevanceScore: entry.relevanceScore,
            strengths: entry.strengths,
            gapsOrRisks: entry.gapsOrRisks,
            finalRecommendation: entry.finalRecommendation,
            summaryExplanation: entry.summaryExplanation,
          };
        }

        return {
          candidateRank: 0,
          applicantEmail: applicant.email,
          fullName: fallbackName,
          matchScore: 0,
          confidenceScore: 0,
          skillsScore: 0,
          experienceScore: 0,
          educationScore: 0,
          relevanceScore: 0,
          strengths: [],
          gapsOrRisks: ["Gemini did not return an evaluation for this applicant."],
          finalRecommendation: "Consider",
          summaryExplanation:
            "No evaluation returned for this applicant; recruiter review recommended.",
        };
      }
    );

    screeningResults.sort(compareBatchEntries);
    screeningResults.forEach((entry, index) => {
      entry.candidateRank = index + 1;

      if (entry.matchScore > 0 && !BATCH_RECOMMENDATIONS.includes(entry.finalRecommendation)) {
        entry.finalRecommendation = recommendationFromScore(entry.matchScore);
      }
    });

    const shortlist: GeminiBatchShortlistEntry[] = screeningResults
      .slice(0, shortlistCount)
      .map((entry) => ({
        candidateRank: entry.candidateRank,
        applicantEmail: entry.applicantEmail,
        fullName: entry.fullName,
        matchScore: entry.matchScore,
        strengths: entry.strengths,
        gapsOrRisks: entry.gapsOrRisks,
        finalRecommendation: entry.finalRecommendation,
        summaryExplanation: entry.summaryExplanation,
      }));

    return {
      jobTitle: request.job.title,
      department: request.job.department || "",
      shortlistCount,
      totalApplicants: request.applicants.length,
      screeningResults,
      shortlist,
      model: response.model,
    };
  }
}
