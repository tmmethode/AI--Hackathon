import type { ApplicantExperience, ApplicantRecord, ApplicantSkill } from "@/lib/applicants";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_YEAR = MS_PER_DAY * 365.25;

function parseExperienceDate(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeRange(entry: ApplicantExperience, now: Date): [number, number] | null {
  const start = parseExperienceDate(entry.startDate);
  const explicitEnd = parseExperienceDate(entry.endDate);
  const end = entry.isCurrent ? now : explicitEnd;

  if (!start && !end) {
    return null;
  }

  const startMs = (start ?? end)?.getTime();
  const endMs = (end ?? start ?? now).getTime();

  if (typeof startMs !== "number" || Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return null;
  }

  if (endMs < startMs) {
    return [startMs, startMs];
  }

  return [startMs, endMs];
}

function mergeRanges(ranges: Array<[number, number]>) {
  if (ranges.length === 0) {
    return [] as Array<[number, number]>;
  }

  const sorted = [...ranges].sort((left, right) => left[0] - right[0]);
  const merged: Array<[number, number]> = [sorted[0]];

  for (const range of sorted.slice(1)) {
    const last = merged[merged.length - 1];

    if (range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
      continue;
    }

    merged.push([range[0], range[1]]);
  }

  return merged;
}

function fallbackSkillYears(skills: ApplicantSkill[] = []) {
  const numericYears = skills
    .map((skill) => Number(skill.yearsOfExperience))
    .filter((years) => Number.isFinite(years) && years > 0);

  if (numericYears.length === 0) {
    return 0;
  }

  return Math.floor(Math.max(...numericYears));
}

export function calculateApplicantExperienceYears(applicant?: Pick<ApplicantRecord, "experience" | "skills">) {
  const now = new Date();
  const ranges = (applicant?.experience || [])
    .map((entry) => normalizeRange(entry, now))
    .filter((range): range is [number, number] => Boolean(range));

  if (ranges.length === 0) {
    return fallbackSkillYears(applicant?.skills);
  }

  const totalMs = mergeRanges(ranges).reduce((sum, [startMs, endMs]) => {
    return sum + Math.max(0, endMs - startMs);
  }, 0);

  const computedYears = Math.floor(totalMs / MS_PER_YEAR);

  if (computedYears > 0) {
    return computedYears;
  }

  return fallbackSkillYears(applicant?.skills);
}
