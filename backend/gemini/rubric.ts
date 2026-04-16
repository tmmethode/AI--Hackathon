import { GeminiCriterionAssessment, GeminiJobContext, GeminiModelCriterionScore, GeminiRankingCriterion } from "./types";

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
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

  const fallback: GeminiRankingCriterion[] = [];

  if ((job.coreHardSkills && job.coreHardSkills.length > 0) || (job.hardSkills && job.hardSkills.length > 0)) {
    fallback.push({
      id: "core-hard-skills",
      label: "Core Hard Skills",
      pct: 35,
      description: "Measures the candidate against required technical skills.",
    });
  }

  if (job.mustHaveQualifications && job.mustHaveQualifications.length > 0) {
    fallback.push({
      id: "must-have-qualifications",
      label: "Must-have Qualifications",
      pct: 30,
      description: "Checks the mandatory qualifications defined for the role.",
    });
  }

  if (job.experience || job.seniorityLevel) {
    fallback.push({
      id: "experience-seniority",
      label: "Experience & Seniority",
      pct: 20,
      description: "Evaluates years of experience and the expected level of ownership.",
    });
  }

  if (job.educationLevel) {
    fallback.push({
      id: "education-level",
      label: "Education Level",
      pct: 15,
      description: "Assesses fit against the minimum education requirement.",
    });
  }

  if (fallback.length === 0) {
    fallback.push(
      {
        id: "qualifications",
        label: "Qualifications",
        pct: 40,
        description: "General alignment with the stated job requirements.",
      },
      {
        id: "skills",
        label: "Skills",
        pct: 35,
        description: "Technical and practical skill fit for the role.",
      },
      {
        id: "experience",
        label: "Experience",
        pct: 25,
        description: "Relevant delivery experience and overall fit.",
      }
    );
  }

  return normalizeCriteria(fallback);
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
