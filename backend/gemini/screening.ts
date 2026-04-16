import { GeminiClient } from "./client";
import { buildCandidateScreeningPrompt, GEMINI_HIRING_SYSTEM_INSTRUCTION } from "./prompts";
import { buildCriterionAssessments, computeFinalWeightedScore, deriveRankingCriteria } from "./rubric";
import {
  GeminiCandidateScreenRequest,
  GeminiCandidateScreenResponse,
  GeminiModelCriterionScore,
} from "./types";

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
}
