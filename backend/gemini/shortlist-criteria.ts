import {
  GeminiBatchScreeningResultEntry,
  GeminiFrontendScreeningResult,
} from "./types";

const SHORTLIST_MIN_MATCH_SCORE = 54;

export function isBatchEntryShortlistEligible(
  entry: GeminiBatchScreeningResultEntry
): boolean {
  return entry.matchScore >= SHORTLIST_MIN_MATCH_SCORE;
}

export function isFrontendResultShortlistEligible(
  result: GeminiFrontendScreeningResult
): boolean {
  return result.score >= SHORTLIST_MIN_MATCH_SCORE;
}
