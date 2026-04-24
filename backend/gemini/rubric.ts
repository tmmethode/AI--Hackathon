import {
  GeminiBatchJob,
  GeminiCriterionAssessment,
  GeminiJobContext,
  GeminiModelCriterionScore,
  GeminiRankingCriterion,
  GeminiWeightCriterion,
} from "./types";

type ScoringCriterionId =
  | "must-have-qualifications"
  | "nice-to-have-qualifications"
  | "core-skills"
  | "experience-seniority"
  | "education";
type BatchScoreField = "skillsScore" | "experienceScore" | "relevanceScore" | "educationScore";

interface BatchSubScores {
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
}

const DEFAULT_SCORING_CRITERIA: Array<GeminiWeightCriterion & {
  id: ScoringCriterionId;
  description: string;
}> = [
  {
    id: "must-have-qualifications",
    label: "Must-have Qualifications",
    value: 30,
    description:
      "Inspect mustHaveQualifications and rate only the candidate evidence that satisfies those non-negotiable requirements.",
  },
  {
    id: "nice-to-have-qualifications",
    label: "Nice-to-have Qualifications",
    value: 10,
    description:
      "Inspect niceToHaveQualifications and rate bonus qualifications, preferred experience, and differentiating evidence.",
  },
  {
    id: "core-skills",
    label: "Core Hard & Soft Skills",
    value: 25,
    description:
      "Inspect coreHardSkills and coreSoftSkills, then rate matching hard-skill and soft-skill evidence from the candidate profile.",
  },
  {
    id: "experience-seniority",
    label: "Years of Experience & Seniority Level",
    value: 25,
    description:
      "Inspect experienceYears and seniorityLevel, then rate relevant years, seniority fit, ownership, and delivery complexity.",
  },
  {
    id: "education",
    label: "Educational Background",
    value: 10,
    description:
      "Inspect educationLevel plus education-related requirements mentioned in mustHaveQualifications and niceToHaveQualifications, then rate degree level, field relevance, equivalent certifications, and formal training evidence.",
  },
];

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function canonicalScoringCriterionId(criterion: Pick<GeminiWeightCriterion, "id" | "label">): ScoringCriterionId | undefined {
  const id = (criterion.id || "").trim().toLowerCase();
  const label = criterion.label.trim().toLowerCase();

  if (["must-have-qualifications", "must-have", "mandatory", "requirements"].includes(id) || label.includes("must-have") || label.includes("mandatory") || label.includes("non-negotiable")) {
    return "must-have-qualifications";
  }

  if (["nice-to-have-qualifications", "nice-to-have", "preferred", "bonus"].includes(id) || label.includes("nice-to-have") || label.includes("preferred") || label.includes("bonus")) {
    return "nice-to-have-qualifications";
  }

  if (["technical-skills", "skills", "skill-match", "core-hard-skills", "soft-skills", "culture", "culture-soft-skills", "core-skills", "relevance"].includes(id) || label.includes("technical") || label.includes("skill") || label.includes("culture") || label.includes("soft")) {
    return "core-skills";
  }

  if (["experience", "years-of-experience", "experience-seniority"].includes(id) || label.includes("experience") || label.includes("seniority")) {
    return "experience-seniority";
  }

  if (["education", "educational-background", "education-level"].includes(id) || label.includes("education")) {
    return "education";
  }

  return undefined;
}

function normalizeWeightCriteria(criteria: GeminiWeightCriterion[]): GeminiWeightCriterion[] {
  const sanitized = criteria.map((criterion) => ({
    ...criterion,
    value: clampPercent(Number(criterion.value) || 0),
  }));
  const total = sanitized.reduce((sum, criterion) => sum + criterion.value, 0);

  if (total === 100) {
    return sanitized;
  }

  if (total <= 0) {
    return DEFAULT_SCORING_CRITERIA.map(({ id, label, value }) => ({ id, label, value }));
  }

  const normalized = sanitized.map((criterion) => ({
    ...criterion,
    value: Math.floor((criterion.value / total) * 100),
  }));
  const normalizedTotal = normalized.reduce((sum, criterion) => sum + criterion.value, 0);
  const diff = 100 - normalizedTotal;

  if (normalized.length > 0) {
    normalized[normalized.length - 1] = {
      ...normalized[normalized.length - 1],
      value: clampPercent(normalized[normalized.length - 1].value + diff),
    };
  }

  return normalized;
}

export function deriveScoringWeightCriteria(
  job: Pick<GeminiJobContext | GeminiBatchJob, "weightCriteria">
): GeminiWeightCriterion[] {
  const valuesById = new Map<ScoringCriterionId, number>();

  for (const criterion of job.weightCriteria || []) {
    const id = canonicalScoringCriterionId(criterion);
    if (!id || valuesById.has(id)) {
      continue;
    }

    valuesById.set(id, clampPercent(Number(criterion.value) || 0));
  }

  const criteria = DEFAULT_SCORING_CRITERIA.map(({ id, label, value }) => ({
    id,
    label,
    value: valuesById.get(id) ?? value,
  }));

  return normalizeWeightCriteria(criteria);
}

export function deriveScoringRankingCriteria(job: Pick<GeminiJobContext | GeminiBatchJob, "weightCriteria">): GeminiRankingCriterion[] {
  const criteria = deriveScoringWeightCriteria(job)
    .map((criterion) => {
      const defaultCriterion = DEFAULT_SCORING_CRITERIA.find((item) => item.id === criterion.id);

      return {
        id: criterion.id,
        label: defaultCriterion?.label || criterion.label,
        pct: criterion.value,
        description: defaultCriterion?.description,
      };
    });

  return normalizeCriteria(criteria);
}

function batchScoreFieldForCriterion(criterion: GeminiWeightCriterion): BatchScoreField {
  const id = canonicalScoringCriterionId(criterion);

  if (id === "experience-seniority") {
    return "experienceScore";
  }

  if (id === "education") {
    return "educationScore";
  }

  if (id === "must-have-qualifications" || id === "nice-to-have-qualifications") {
    return "relevanceScore";
  }

  return "skillsScore";
}

export function computeWeightedBatchScore(
  job: Pick<GeminiBatchJob, "weightCriteria">,
  scores: BatchSubScores
): number {
  const weightedScore = deriveScoringWeightCriteria(job).reduce((sum, criterion) => {
    const field = batchScoreFieldForCriterion(criterion);
    return sum + (clampPercent(scores[field]) * criterion.value) / 100;
  }, 0);

  return clampPercent(Math.round(weightedScore));
}

function normalizeCriteria(criteria: GeminiRankingCriterion[]): GeminiRankingCriterion[] {
  const sanitized = criteria
    .filter((criterion) => criterion.label.trim().length > 0 && criterion.pct > 0)
    .map((criterion) => ({
      ...criterion,
      pct: clampPercent(criterion.pct),
    }));

  if (sanitized.length === 0) {
    return [];
  }

  const total = sanitized.reduce((sum, criterion) => sum + criterion.pct, 0);

  if (total === 100) {
    return sanitized;
  }

  const normalized = sanitized.map((criterion) => ({
    ...criterion,
    pct: Math.floor((criterion.pct / total) * 100),
  }));

  const normalizedTotal = normalized.reduce((sum, criterion) => sum + criterion.pct, 0);
  const diff = 100 - normalizedTotal;

  if (normalized.length > 0) {
    normalized[normalized.length - 1] = {
      ...normalized[normalized.length - 1],
      pct: clampPercent(normalized[normalized.length - 1].pct + diff),
    };
  }

  return normalized;
}

export function deriveRankingCriteria(job: GeminiJobContext): GeminiRankingCriterion[] {
  if (job.rankingCriteria && job.rankingCriteria.length > 0) {
    return normalizeCriteria(job.rankingCriteria);
  }

  return deriveScoringRankingCriteria(job);
}

function findCriterionScore(
  criterion: GeminiRankingCriterion,
  scores: GeminiModelCriterionScore[]
): GeminiModelCriterionScore | undefined {
  return scores.find((score) => score.label.trim().toLowerCase() === criterion.label.trim().toLowerCase());
}

export function buildCriterionAssessments(
  criteria: GeminiRankingCriterion[],
  scores: GeminiModelCriterionScore[]
): GeminiCriterionAssessment[] {
  return criteria.map((criterion) => {
    const match = findCriterionScore(criterion, scores);
    const score = clampPercent(match?.score ?? 0);
    const weightedScore = Number(((score * criterion.pct) / 100).toFixed(2));

    return {
      label: criterion.label,
      weightPct: criterion.pct,
      score,
      weightedScore,
      summary: match?.summary || `No criterion-specific explanation returned for ${criterion.label}.`,
      evidence: match?.evidence || [],
    };
  });
}

export function computeFinalWeightedScore(assessments: GeminiCriterionAssessment[]): number {
  return clampPercent(
    Math.round(assessments.reduce((sum, assessment) => sum + assessment.weightedScore, 0))
  );
}
