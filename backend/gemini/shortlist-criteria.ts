import {
  GeminiBatchJob,
  GeminiBatchRecommendation,
  GeminiBatchScreeningResultEntry,
  GeminiFrontendScreeningResult,
} from "./types";

const SHORTLIST_MIN_MATCH_SCORE = 50;
const SHORTLIST_MIN_SKILLS_SCORE = 55;
const SHORTLIST_MIN_EXPERIENCE_SCORE = 55;
const SHORTLIST_MIN_EDUCATION_SCORE = 45;
const SHORTLIST_MIN_MUST_HAVE_MATCH_SCORE = 60;
const SHORTLIST_MIN_DATA_COMPLETENESS_SCORE = 40;

const SHORTLIST_RECOMMENDATIONS = new Set<GeminiBatchRecommendation>([
  "Shortlist",
  "Strong Shortlist",
]);

const CRITICAL_GAP_ACTIONS = [
  "missing",
  "lack",
  "lacks",
  "lacking",
  "insufficient",
  "unmet",
  "does not meet",
  "doesn't meet",
  "not meet",
  "fails to meet",
  "below minimum",
];

const CRITICAL_GAP_TARGETS = [
  "required",
  "must-have",
  "must have",
  "mandatory",
  "minimum",
  "core requirement",
  "core skill",
  "experience requirement",
  "education requirement",
];

function hasText(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasCriticalRequirementGapSignal(gapsOrRisks: readonly string[]): boolean {
  return gapsOrRisks.some((gap) => {
    const normalized = gap.trim().toLowerCase();

    if (!normalized) {
      return false;
    }

    const hasAction = CRITICAL_GAP_ACTIONS.some((token) => normalized.includes(token));
    const hasTarget = CRITICAL_GAP_TARGETS.some((token) => normalized.includes(token));

    return hasAction && hasTarget;
  });
}

function jobRequiresSkillsGate(job: GeminiBatchJob): boolean {
  return Boolean(job.coreHardSkills?.length || hasText(job.mustHaveQualifications));
}

function jobRequiresExperienceGate(job: GeminiBatchJob): boolean {
  return Boolean((typeof job.experienceYears === "number" && job.experienceYears > 0) || hasText(job.seniorityLevel));
}

function jobRequiresEducationGate(job: GeminiBatchJob): boolean {
  if (!hasText(job.educationLevel)) {
    return false;
  }

  const normalized = job.educationLevel!.trim().toLowerCase();
  return normalized !== "none" && normalized !== "not specified";
}

export function isBatchEntryShortlistEligible(
  entry: GeminiBatchScreeningResultEntry,
  job: GeminiBatchJob
): boolean {
  if (!SHORTLIST_RECOMMENDATIONS.has(entry.finalRecommendation)) {
    return false;
  }

  if (entry.matchScore < SHORTLIST_MIN_MATCH_SCORE) {
    return false;
  }

  if (entry.criticalRequirementGap || hasCriticalRequirementGapSignal(entry.gapsOrRisks)) {
    return false;
  }

  if (jobRequiresSkillsGate(job) && entry.skillsScore < SHORTLIST_MIN_SKILLS_SCORE) {
    return false;
  }

  if (jobRequiresExperienceGate(job) && entry.experienceScore < SHORTLIST_MIN_EXPERIENCE_SCORE) {
    return false;
  }

  if (jobRequiresEducationGate(job) && entry.educationScore < SHORTLIST_MIN_EDUCATION_SCORE) {
    return false;
  }

  return true;
}

export function isFrontendResultShortlistEligible(
  result: GeminiFrontendScreeningResult
): boolean {
  if (result.recommendation !== "strong_yes" && result.recommendation !== "yes") {
    return false;
  }

  if (result.score < SHORTLIST_MIN_MATCH_SCORE) {
    return false;
  }

  if (result.mustHaveMatchScore < SHORTLIST_MIN_MUST_HAVE_MATCH_SCORE) {
    return false;
  }

  if (result.dataCompletenessScore < SHORTLIST_MIN_DATA_COMPLETENESS_SCORE) {
    return false;
  }

  return true;
}
