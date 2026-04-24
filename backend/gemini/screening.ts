import { GeminiClient } from "./client";
import {
  buildBatchNarrativePrompt,
  buildBatchScreeningPrompt,
  buildCandidateScreeningPrompt,
  GEMINI_BATCH_EXPLANATION_SYSTEM_INSTRUCTION,
  GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION,
  GEMINI_HIRING_SYSTEM_INSTRUCTION,
} from "./prompts";
import {
  buildCriterionAssessments,
  computeFinalWeightedScore,
  computeWeightedBatchScore,
  deriveRankingCriteria,
  deriveScoringRankingCriteria,
  deriveScoringWeightCriteria,
} from "./rubric";
import {
  GeminiBatchApplicant,
  GeminiBatchNarrativeEntry,
  GeminiBatchNarrativeTarget,
  GeminiBatchRecommendation,
  GeminiBatchScreeningRequest,
  GeminiBatchScreeningResponse,
  GeminiBatchScreeningResultEntry,
  GeminiBatchShortlistEntry,
  GeminiCandidateScreenRequest,
  GeminiCandidateScreenResponse,
  GeminiModelCriterionScore,
} from "./types";
import { isBatchEntryShortlistEligible } from "./shortlist-criteria";

const BATCH_RECOMMENDATIONS: readonly GeminiBatchRecommendation[] = [
  "Strong Reject",
  "Reject",
  "Consider",
  "Shortlist",
  "Strong Shortlist",
];
const DETERMINISTIC_SCREENING_TEMPERATURE = 0;

const BATCH_CHUNK_SIZE = Math.max(
  1,
  Math.floor(Number(process.env.GEMINI_BATCH_CHUNK_SIZE) || 30)
);
const BATCH_MAX_OUTPUT_TOKENS = Math.max(
  4096,
  Math.floor(Number(process.env.GEMINI_BATCH_MAX_OUTPUT_TOKENS) || 32768)
);
const BATCH_NARRATIVE_CHUNK_SIZE = Math.max(
  1,
  Math.floor(Number(process.env.GEMINI_BATCH_NARRATIVE_CHUNK_SIZE) || 10)
);
const SHORTLIST_EXPLANATION_BUFFER = 10;
const MAX_BATCH_EXPLANATION_ITEMS = 3;
const MAX_BATCH_EXPLANATION_ITEM_WORDS = 40;
const MIN_BATCH_SUMMARY_WORDS = 60;
const MAX_BATCH_SUMMARY_WORDS = 100;

function estimateBatchTokenBudget(applicantCount: number): number {
  return Math.max(1500, Math.min(BATCH_MAX_OUTPUT_TOKENS, 600 + applicantCount * 450));
}

function estimateNarrativeTokenBudget(applicantCount: number): number {
  return Math.max(1200, Math.min(BATCH_MAX_OUTPUT_TOKENS, 400 + applicantCount * 180));
}

function stableSeedFromString(input: string): number {
  // FNV-1a 32-bit hash, clamped to positive int32.
  const source = input && input.length > 0 ? input : "gemini-default-seed";
  let hash = 0x811c9dc5;

  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  // Force positive int32 range (Gemini expects a non-negative integer seed).
  return (hash >>> 0) % 0x7fffffff;
}

function deriveScreeningSeed(jobId: string | undefined, jobTitle: string | undefined): number {
  const key = (jobId && jobId.trim()) || (jobTitle && jobTitle.trim()) || "gemini-screening";
  return stableSeedFromString(`screen:${key}`);
}

function sortApplicantsDeterministically(
  applicants: readonly GeminiBatchApplicant[]
): GeminiBatchApplicant[] {
  return [...applicants].sort((left, right) => {
    const leftKey = (left.email || "").trim().toLowerCase();
    const rightKey = (right.email || "").trim().toLowerCase();

    if (leftKey !== rightKey) {
      return leftKey < rightKey ? -1 : 1;
    }

    const leftName = fullNameFromApplicant(left).toLowerCase();
    const rightName = fullNameFromApplicant(right).toLowerCase();

    if (leftName !== rightName) {
      return leftName < rightName ? -1 : 1;
    }

    return 0;
  });
}

function isMaxTokensError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("finishReason=MAX_TOKENS") || message.includes("MAX_TOKENS");
}

function splitShortlistCount(
  shortlistCount: number,
  leftSize: number,
  rightSize: number
): [number, number] {
  const totalSize = leftSize + rightSize;

  if (shortlistCount <= 0) {
    return [0, 0];
  }

  if (shortlistCount >= totalSize) {
    return [leftSize, rightSize];
  }

  const leftCount = Math.min(
    leftSize,
    Math.max(1, Math.round((shortlistCount * leftSize) / totalSize))
  );
  const remaining = Math.max(0, shortlistCount - leftCount);
  const rightCount = Math.min(
    rightSize,
    remaining > 0 ? remaining : Math.min(1, rightSize)
  );

  return [leftCount, rightCount];
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

  if (matchScore >= 54) {
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

function safeParseJson<T>(raw: string, context: string): T {
  const candidate = extractJsonObject(raw);

  if (!candidate) {
    throw new Error(`${context}: Gemini returned a non-JSON response (empty).`);
  }

  try {
    return JSON.parse(candidate) as T;
  } catch (error) {
    const snippet = candidate.length > 240 ? `${candidate.slice(0, 240)}…` : candidate;
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(
      `${context}: Gemini returned a non-JSON response (${reason}). Raw: ${snippet}`
    );
  }
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

function normalizeWhitespace(value: string | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function countWords(value: string): number {
  const normalized = normalizeWhitespace(value);
  return normalized ? normalized.split(" ").length : 0;
}

function truncateWords(value: string, maxWords: number): string {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return "";
  }

  const words = normalized.split(" ");
  if (words.length <= maxWords) {
    return normalized;
  }

  return words.slice(0, maxWords).join(" ");
}

function normalizeBatchExplanationItems(value: unknown): string[] {
  return toStringArray(value)
    .map((item) => truncateWords(item, MAX_BATCH_EXPLANATION_ITEM_WORDS))
    .filter(Boolean)
    .slice(0, MAX_BATCH_EXPLANATION_ITEMS);
}

function buildFallbackBatchSummary(entry: {
  finalRecommendation: GeminiBatchRecommendation;
  matchScore: number;
  confidenceScore: number;
  strengths: string[];
  gapsOrRisks: string[];
}): string {
  const strengths =
    entry.strengths.slice(0, 2).join(" and ") || "limited verified strengths in the submitted evidence";
  const risks =
    entry.gapsOrRisks.slice(0, 2).join(" and ") || "no major additional risks were explicitly returned";

  return truncateWords(
    `This candidate received a ${entry.finalRecommendation} recommendation with a ${entry.matchScore}% match score based on the available application evidence. Key strengths include ${strengths}. Main gaps or risks include ${risks}. Confidence in this assessment is ${entry.confidenceScore}% because the evaluation only uses the information provided for screening.`,
    MAX_BATCH_SUMMARY_WORDS
  );
}

function normalizeBatchSummaryExplanation(entry: {
  finalRecommendation: GeminiBatchRecommendation;
  matchScore: number;
  confidenceScore: number;
  strengths: string[];
  gapsOrRisks: string[];
  summaryExplanation: string;
}): string {
  const trimmedSummary = truncateWords(entry.summaryExplanation, MAX_BATCH_SUMMARY_WORDS);

  if (countWords(trimmedSummary) >= MIN_BATCH_SUMMARY_WORDS) {
    return trimmedSummary;
  }

  return buildFallbackBatchSummary(entry);
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

interface ParsedBatchScoreEntry {
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  criterionAssessments: ReturnType<typeof buildCriterionAssessments>;
  criticalRequirementGap: boolean;
  finalRecommendation: GeminiBatchRecommendation;
}

interface ParsedBatchNarrativeResult {
  applicantEmail: string;
  strengths: string[];
  gapsOrRisks: string[];
  summaryExplanation: string;
}

function parseBatchScoreEntry(
  raw: unknown,
  job: GeminiBatchScreeningRequest["job"]
): ParsedBatchScoreEntry | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const entry = raw as Record<string, unknown>;
  const email = entry.applicantEmail ? String(entry.applicantEmail).trim().toLowerCase() : "";

  if (!email) {
    return null;
  }

  const criteria = deriveScoringRankingCriteria(job);
  const returnedCriterionScores = toCriterionScores(entry.criterionScores);
  const fallbackCriterionScores =
    returnedCriterionScores.length > 0
      ? returnedCriterionScores
      : criteria.map((criterion) => {
          const label = criterion.label.toLowerCase();
          const score =
            label.includes("experience") || label.includes("seniority")
              ? entry.experienceScore
              : label.includes("education")
              ? entry.educationScore
              : label.includes("core") || label.includes("skill")
              ? entry.skillsScore
              : entry.relevanceScore;

          return {
            label: criterion.label,
            score: clampScore(score),
            summary: "",
            evidence: [],
          };
        });
  const criterionAssessments = buildCriterionAssessments(criteria, fallbackCriterionScores);
  const matchScore = computeFinalWeightedScore(criterionAssessments);

  return {
    applicantEmail: email,
    fullName: entry.fullName ? String(entry.fullName).trim() : "",
    matchScore,
    confidenceScore: clampScore(entry.confidenceScore),
    skillsScore: clampScore(entry.skillsScore),
    experienceScore: clampScore(entry.experienceScore),
    educationScore: clampScore(entry.educationScore),
    relevanceScore: clampScore(entry.relevanceScore),
    criterionAssessments,
    criticalRequirementGap: entry.criticalRequirementGap === true || entry.criticalRequirementGap === "true",
    finalRecommendation: normalizeRecommendation(entry.finalRecommendation),
  };
}

function parseBatchNarrativeEntry(raw: unknown): ParsedBatchNarrativeResult | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const entry = raw as Record<string, unknown>;
  const email = entry.applicantEmail ? String(entry.applicantEmail).trim().toLowerCase() : "";

  if (!email) {
    return null;
  }

  return {
    applicantEmail: email,
    strengths: normalizeBatchExplanationItems(entry.strengths),
    gapsOrRisks: normalizeBatchExplanationItems(entry.gapsOrRisks),
    summaryExplanation: normalizeBatchSummaryExplanation({
      finalRecommendation: normalizeRecommendation(entry.finalRecommendation),
      matchScore: clampScore(entry.matchScore),
      confidenceScore: clampScore(entry.confidenceScore),
      strengths: normalizeBatchExplanationItems(entry.strengths),
      gapsOrRisks: normalizeBatchExplanationItems(entry.gapsOrRisks),
      summaryExplanation: entry.summaryExplanation ? String(entry.summaryExplanation) : "",
    }),
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
      // Screening should remain deterministic so saved rankings stay stable across reruns.
      temperature: DETERMINISTIC_SCREENING_TEMPERATURE,
      maxOutputTokens: 1200,
      seed: deriveScreeningSeed(request.job.id, request.job.title),
    });

    const parsed = safeParseJson<Partial<GeminiCandidateScreenResponse> & {
      criterionScores?: unknown;
    }>(response.text, "screenCandidate");
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

  private async runGeminiBatchScoringCall(
    request: GeminiBatchScreeningRequest,
    effectiveShortlistCount: number
  ): Promise<{ entries: Map<string, ParsedBatchScoreEntry>; model: string }> {
    const response = await this.client.generateText({
      prompt: buildBatchScreeningPrompt({
        ...request,
        shortlistCount: effectiveShortlistCount,
      }),
      systemInstruction: GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      // Batch ranking should remain deterministic so shortlist order matches across repeated runs.
      temperature: DETERMINISTIC_SCREENING_TEMPERATURE,
      maxOutputTokens: estimateBatchTokenBudget(request.applicants.length),
      seed: deriveScreeningSeed(request.job.id, request.job.title),
    });

    const parsed = safeParseJson<{ screeningResults?: unknown }>(response.text, "screenBatch");

    const parsedEntries = Array.isArray(parsed.screeningResults)
      ? (parsed.screeningResults as unknown[])
          .map((entry) => parseBatchScoreEntry(entry, request.job))
          .filter((entry): entry is ParsedBatchScoreEntry => entry !== null)
          .map((entry) => {
            const weightedMatchScore = entry.criterionAssessments.length > 0
              ? computeFinalWeightedScore(entry.criterionAssessments)
              : computeWeightedBatchScore(request.job, entry);

            return {
              ...entry,
              matchScore: weightedMatchScore,
              finalRecommendation: recommendationFromScore(weightedMatchScore),
            };
          })
      : [];

    const entryByEmail = new Map<string, ParsedBatchScoreEntry>();
    for (const entry of parsedEntries) {
      if (!entryByEmail.has(entry.applicantEmail)) {
        entryByEmail.set(entry.applicantEmail, entry);
      }
    }

    return { entries: entryByEmail, model: response.model };
  }

  private async runGeminiBatchScoringChunkWithRetry(
    request: GeminiBatchScreeningRequest,
    effectiveShortlistCount: number
  ): Promise<{ entries: Map<string, ParsedBatchScoreEntry>; model: string }> {
    try {
      return await this.runGeminiBatchScoringCall(request, effectiveShortlistCount);
    } catch (error) {
      if (!isMaxTokensError(error) || request.applicants.length <= 1) {
        throw error;
      }

      const midpoint = Math.ceil(request.applicants.length / 2);
      const leftApplicants = request.applicants.slice(0, midpoint);
      const rightApplicants = request.applicants.slice(midpoint);
      const [leftShortlistCount, rightShortlistCount] = splitShortlistCount(
        effectiveShortlistCount,
        leftApplicants.length,
        rightApplicants.length
      );

      const [leftResult, rightResult] = await Promise.all([
        this.runGeminiBatchScoringChunkWithRetry(
          { ...request, applicants: leftApplicants },
          leftShortlistCount
        ),
        this.runGeminiBatchScoringChunkWithRetry(
          { ...request, applicants: rightApplicants },
          rightShortlistCount
        ),
      ]);

      const mergedEntries = new Map<string, ParsedBatchScoreEntry>();

      for (const [email, entry] of leftResult.entries) {
        mergedEntries.set(email, entry);
      }

      for (const [email, entry] of rightResult.entries) {
        if (!mergedEntries.has(email)) {
          mergedEntries.set(email, entry);
        }
      }

      return {
        entries: mergedEntries,
        model: rightResult.model || leftResult.model,
      };
    }
  }

  private async runGeminiBatchNarrativeCall(
    job: GeminiBatchScreeningRequest["job"],
    targets: GeminiBatchNarrativeTarget[],
    instructions?: string
  ): Promise<{ entries: Map<string, ParsedBatchNarrativeResult>; model: string }> {
    const response = await this.client.generateText({
      prompt: buildBatchNarrativePrompt(job, targets, instructions),
      systemInstruction: GEMINI_BATCH_EXPLANATION_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      temperature: DETERMINISTIC_SCREENING_TEMPERATURE,
      maxOutputTokens: estimateNarrativeTokenBudget(targets.length),
      seed: deriveScreeningSeed(job.id, job.title),
    });

    const parsed = safeParseJson<{ narratives?: unknown }>(response.text, "screenBatchNarratives");
    const parsedEntries = Array.isArray(parsed.narratives)
      ? (parsed.narratives as unknown[])
          .map(parseBatchNarrativeEntry)
          .filter((entry): entry is ParsedBatchNarrativeResult => entry !== null)
      : [];

    const entryByEmail = new Map<string, ParsedBatchNarrativeResult>();
    for (const entry of parsedEntries) {
      if (!entryByEmail.has(entry.applicantEmail)) {
        entryByEmail.set(entry.applicantEmail, entry);
      }
    }

    return { entries: entryByEmail, model: response.model };
  }

  private async runGeminiBatchNarrativeChunkWithRetry(
    job: GeminiBatchScreeningRequest["job"],
    targets: GeminiBatchNarrativeTarget[],
    instructions?: string
  ): Promise<{ entries: Map<string, ParsedBatchNarrativeResult>; model: string }> {
    try {
      return await this.runGeminiBatchNarrativeCall(job, targets, instructions);
    } catch (error) {
      if (!isMaxTokensError(error) || targets.length <= 1) {
        throw error;
      }

      const midpoint = Math.ceil(targets.length / 2);
      const leftTargets = targets.slice(0, midpoint);
      const rightTargets = targets.slice(midpoint);
      const [leftResult, rightResult] = await Promise.all([
        this.runGeminiBatchNarrativeChunkWithRetry(job, leftTargets, instructions),
        this.runGeminiBatchNarrativeChunkWithRetry(job, rightTargets, instructions),
      ]);

      const mergedEntries = new Map<string, ParsedBatchNarrativeResult>();

      for (const [email, entry] of leftResult.entries) {
        mergedEntries.set(email, entry);
      }

      for (const [email, entry] of rightResult.entries) {
        if (!mergedEntries.has(email)) {
          mergedEntries.set(email, entry);
        }
      }

      return {
        entries: mergedEntries,
        model: rightResult.model || leftResult.model,
      };
    }
  }

  private async enrichRankedResults(
    job: GeminiBatchScreeningRequest["job"],
    rankedResults: GeminiBatchScreeningResultEntry[],
    applicants: readonly GeminiBatchApplicant[],
    requestedShortlistCount: number,
    shortlistedEntries: readonly GeminiBatchScreeningResultEntry[],
    instructions?: string
  ): Promise<string | undefined> {
    if (rankedResults.length === 0) {
      return undefined;
    }

    const applicantByEmail = new Map(
      applicants.map((applicant) => [applicant.email.trim().toLowerCase(), applicant])
    );
    const requestedCoverage = Math.min(
      rankedResults.length,
      requestedShortlistCount + SHORTLIST_EXPLANATION_BUFFER
    );
    const shortlistedEmails = new Set(
      shortlistedEntries.map((entry) => entry.applicantEmail.trim().toLowerCase())
    );
    const targets = rankedResults
      .filter(
        (entry, index) =>
          index < requestedCoverage || shortlistedEmails.has(entry.applicantEmail.trim().toLowerCase())
      )
      .map((entry): GeminiBatchNarrativeTarget => ({
        candidateRank: entry.candidateRank,
        applicantEmail: entry.applicantEmail,
        fullName: entry.fullName,
        matchScore: entry.matchScore,
        confidenceScore: entry.confidenceScore,
        skillsScore: entry.skillsScore,
        experienceScore: entry.experienceScore,
        educationScore: entry.educationScore,
        relevanceScore: entry.relevanceScore,
        criterionAssessments: entry.criterionAssessments,
        finalRecommendation: entry.finalRecommendation,
        applicant: applicantByEmail.get(entry.applicantEmail.trim().toLowerCase()) || {
          email: entry.applicantEmail,
          firstName: entry.fullName,
        },
      }));

    if (targets.length === 0) {
      return undefined;
    }

    const chunks: GeminiBatchNarrativeTarget[][] = [];
    for (let index = 0; index < targets.length; index += BATCH_NARRATIVE_CHUNK_SIZE) {
      chunks.push(targets.slice(index, index + BATCH_NARRATIVE_CHUNK_SIZE));
    }

    const narrativesByEmail = new Map<string, ParsedBatchNarrativeResult>();
    let lastModel: string | undefined;

    for (const chunk of chunks) {
      try {
        const { entries, model } = await this.runGeminiBatchNarrativeChunkWithRetry(
          job,
          chunk,
          instructions
        );

        for (const [email, entry] of entries) {
          if (!narrativesByEmail.has(email)) {
            narrativesByEmail.set(email, entry);
          }
        }

        lastModel = model || lastModel;
      } catch {
        // Leave narrative fields empty for this chunk if enrichment fails.
      }
    }

    rankedResults.forEach((entry) => {
      const narrative = narrativesByEmail.get(entry.applicantEmail.trim().toLowerCase());

      entry.strengths = narrative?.strengths || [];
      entry.gapsOrRisks = narrative?.gapsOrRisks || [];
      entry.summaryExplanation = narrative?.summaryExplanation || "";
    });

    return lastModel;
  }

  public async screenBatch(request: GeminiBatchScreeningRequest): Promise<GeminiBatchScreeningResponse> {
    if (!request.applicants || request.applicants.length === 0) {
      throw new Error("At least one applicant is required for Gemini batch screening");
    }

    const sortedApplicants = sortApplicantsDeterministically(request.applicants);
    const totalApplicants = sortedApplicants.length;
    const shortlistCount = Math.max(
      0,
      Math.min(Math.floor(request.shortlistCount ?? 0), totalApplicants)
    );

    const chunkSize = Math.max(1, BATCH_CHUNK_SIZE);
    const chunks: GeminiBatchApplicant[][] = [];
    for (let i = 0; i < totalApplicants; i += chunkSize) {
      chunks.push(sortedApplicants.slice(i, i + chunkSize));
    }

    const mergedEntries = new Map<string, ParsedBatchScoreEntry>();
    const failures: Array<{ chunkIndex: number; reason: string }> = [];
    let lastModel = this.client.getModel();

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const chunk = chunks[chunkIndex];

      try {
        const { entries, model } = await this.runGeminiBatchScoringChunkWithRetry(
          { ...request, applicants: chunk },
          Math.min(chunk.length, shortlistCount || chunk.length)
        );

        for (const [email, entry] of entries) {
          if (!mergedEntries.has(email)) {
            mergedEntries.set(email, entry);
          }
        }
        lastModel = model || lastModel;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        failures.push({ chunkIndex, reason });
      }
    }

    if (mergedEntries.size === 0 && failures.length > 0) {
      throw new Error(
        `screenBatch: all ${chunks.length} Gemini chunk(s) failed. First error: ${failures[0].reason}`
      );
    }

    const screeningResults: GeminiBatchScreeningResultEntry[] = sortedApplicants.map(
      (applicant) => {
        const key = applicant.email.trim().toLowerCase();
        const entry = mergedEntries.get(key);
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
            criterionAssessments: entry.criterionAssessments,
            strengths: [],
            gapsOrRisks: entry.criticalRequirementGap
              ? ["Critical requirement gap identified during screening."]
              : [],
            finalRecommendation: entry.finalRecommendation,
            summaryExplanation: "",
            criticalRequirementGap: entry.criticalRequirementGap,
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
          criterionAssessments: [],
          strengths: [],
          gapsOrRisks: ["Gemini did not return an evaluation for this applicant."],
          finalRecommendation: "Consider",
          summaryExplanation: "",
          criticalRequirementGap: true,
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

    const shortlistedEntries = screeningResults
      .filter((entry) => isBatchEntryShortlistEligible(entry))
      .slice(0, shortlistCount);

    const explanationModel = await this.enrichRankedResults(
      request.job,
      screeningResults,
      sortedApplicants,
      shortlistCount,
      shortlistedEntries,
      request.instructions
    );

    const shortlist: GeminiBatchShortlistEntry[] = shortlistedEntries
      .map((entry) => ({
        candidateRank: entry.candidateRank,
        applicantEmail: entry.applicantEmail,
        fullName: entry.fullName,
        matchScore: entry.matchScore,
        confidenceScore: entry.confidenceScore,
        skillsScore: entry.skillsScore,
        experienceScore: entry.experienceScore,
        educationScore: entry.educationScore,
        relevanceScore: entry.relevanceScore,
        criterionAssessments: entry.criterionAssessments,
        criticalRequirementGap: entry.criticalRequirementGap,
        strengths: entry.strengths,
        gapsOrRisks: entry.gapsOrRisks,
        finalRecommendation: entry.finalRecommendation,
        summaryExplanation: entry.summaryExplanation,
      }));

    const unscoredApplicants = screeningResults.filter(
      (entry) => entry.matchScore === 0 && entry.gapsOrRisks.some((reason) => reason.startsWith("Gemini did not return"))
    ).length;

    return {
      jobTitle: request.job.title,
      weightCriteria: deriveScoringWeightCriteria(request.job),
      shortlistCount: shortlist.length,
      totalApplicants,
      screeningResults,
      shortlist,
      model: explanationModel || lastModel,
      meta: {
        requestedApplicants: totalApplicants,
        processedApplicants: totalApplicants - unscoredApplicants,
        maxApplicants: totalApplicants,
        truncatedApplicants: false,
        unscoredApplicants,
        failedChunks: failures.length,
        failureReasons: failures.map((failure) => failure.reason).slice(0, 3),
      },
    };
  }
}
