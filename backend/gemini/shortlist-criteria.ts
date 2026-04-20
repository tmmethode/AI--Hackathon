import {
  GeminiBatchJob,
  GeminiBatchScreeningResultEntry,
  GeminiFrontendScreeningResult,
} from "./types";

const SHORTLIST_MIN_MATCH_SCORE = 50;
const SHORTLIST_MIN_MUST_HAVE_MATCH_SCORE = 50;
const SHORTLIST_MIN_DATA_COMPLETENESS_SCORE = 40;

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

export function isBatchEntryShortlistEligible(
  entry: GeminiBatchScreeningResultEntry,
  job: GeminiBatchJob
): boolean {
  if (entry.matchScore < SHORTLIST_MIN_MATCH_SCORE) {
    return false;
  }

  if (entry.criticalRequirementGap || hasCriticalRequirementGapSignal(entry.gapsOrRisks)) {
    return false;
  }

  return true;
}

export function isFrontendResultShortlistEligible(
  result: GeminiFrontendScreeningResult
): boolean {
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
