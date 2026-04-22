"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  LoaderCircle,
  Play,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ScreeningPageSkeleton } from "@/components/page-skeletons";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  type ApplicantRecord,
  type ApplicantSource,
  type IngestStatus,
  listAllApplicants,
} from "@/lib/applicants";
import {
  type GeminiBatchApplicant,
  type GeminiBatchJob,
  type GeminiFrontendConfigResponse,
  GEMINI_RECOMMENDATION_BANDS,
  GEMINI_SCORING_PILLARS,
  GEMINI_TIE_BREAK_ORDER,
  getGeminiFrontendConfig,
} from "@/lib/screening";
import { startScreeningRun } from "@/lib/screening-progress";
import { getHiringManagerName, listJobs, splitLinesToList, type JobRecord } from "@/lib/jobs";
import { listAllShortlists, type ShortlistSummary } from "@/lib/shortlists";

interface ScreeningAsset {
  name: string;
  meta: string;
}

const FALLBACK_SHORTLIST_SIZE = 10;
const FALLBACK_SHORTLIST_MIN = 1;
const FALLBACK_SHORTLIST_MAX = 50;

function formatJobId(job: JobRecord) {
  return `JOB-${job._id.slice(-6).toUpperCase()}`;
}

function humanizeApplicantSource(source: ApplicantSource) {
  switch (source) {
    case "umurava-platform":
      return "JSON Upload";
    case "pdf-upload":
      return "Resume Upload";
    case "csv-import":
      return "CSV Import";
    case "paste-links":
      return "Paste Links";
    default:
      return "Applicant Source";
  }
}

function humanizeIngestStatus(status: IngestStatus, count: number) {
  const label = count === 1 ? "candidate" : "candidates";

  switch (status) {
    case "parsed":
      return `${count} parsed ${label}`;
    case "pending":
      return `${count} pending ${label}`;
    case "failed":
      return `${count} failed ${label}`;
    default:
      return `${count} ${label}`;
  }
}

function buildScreeningAssets(applicants: ApplicantRecord[]): ScreeningAsset[] {
  const grouped = new Map<string, { source: ApplicantSource; ingestStatus: IngestStatus; count: number }>();

  for (const applicant of applicants) {
    const key = `${applicant.source}:${applicant.ingestStatus}`;
    const current = grouped.get(key);

    if (current) {
      current.count += 1;
      continue;
    }

    grouped.set(key, {
      source: applicant.source,
      ingestStatus: applicant.ingestStatus,
      count: 1,
    });
  }

  const statusPriority: Record<IngestStatus, number> = {
    parsed: 0,
    pending: 1,
    failed: 2,
  };

  return Array.from(grouped.values())
    .sort(
      (left, right) =>
        statusPriority[left.ingestStatus] - statusPriority[right.ingestStatus] ||
        right.count - left.count
    )
    .map((entry) => ({
      name:
        entry.ingestStatus === "parsed"
          ? humanizeApplicantSource(entry.source)
          : `${humanizeApplicantSource(entry.source)} · ${entry.ingestStatus === "pending" ? "Pending Parse" : "Failed"}`,
      meta: humanizeIngestStatus(entry.ingestStatus, entry.count),
    }));
}

function buildScreeningJob(job: JobRecord): GeminiBatchJob {
  return {
    id: job._id,
    title: job.title,
    department: job.department,
    hiringManager: getHiringManagerName(job.hiringManager),
    location: job.location,
    locationPolicy: job.locationPolicy,
    employmentType: job.employmentType,
    salaryBand: job.salaryBand,
    summary: job.summary,
    responsibilities: job.responsibilities,
    mustHaveQualifications: job.mustHaveQualifications,
    niceToHaveQualifications: job.niceToHaveQualifications,
    coreHardSkills: job.coreHardSkills,
    preferredSkills: job.preferredSkills,
    coreSoftSkills: job.coreSoftSkills,
    experienceYears: job.experienceYears,
    seniorityLevel: job.seniorityLevel,
    educationLevel: job.educationLevel,
    weightCriteria: job.weightCriteria,
    status: job.status,
  };
}

function buildScreeningApplicant(applicant: ApplicantRecord): GeminiBatchApplicant {
  return {
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicant.email,
    headline: applicant.headline,
    bio: applicant.bio,
    location: applicant.location,
    skills: applicant.skills,
    languages: applicant.languages,
    experience: applicant.experience,
    education: applicant.education,
    certifications: applicant.certifications,
    projects: applicant.projects,
    availability: applicant.availability,
    socialLinks: applicant.socialLinks,
  };
}

function extractRunSequence(runName?: string): number {
  const match = (runName || "").trim().match(/^RUN-(\d+)$/i);
  return match ? Number(match[1]) || 0 : 0;
}

function buildRunName(nextSequence: number): string {
  return `RUN-${String(nextSequence).padStart(3, "0")}`;
}

async function listAllJobs() {
  const firstPage = await listJobs({ page: 1, pageSize: 100 });

  if (firstPage.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      listJobs({
        page: index + 2,
        pageSize: 100,
      })
    )
  );

  return firstPage.data.concat(...remainingPages.map((page) => page.data));
}

export default function ScreeningPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [shortlists, setShortlists] = useState<ShortlistSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");

  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState("");

  const [screeningConfig, setScreeningConfig] = useState<GeminiFrontendConfigResponse | null>(null);
  const [configError, setConfigError] = useState("");

  const [shortlistSize, setShortlistSize] = useState(FALLBACK_SHORTLIST_SIZE);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState("");

  function sanitizeShortlistSizeInput(rawValue: string): number {
    const digitsOnly = rawValue.replace(/\D+/g, "");

    if (!digitsOnly) {
      return 0;
    }

    const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
    return Number(normalized) || 0;
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadJobs() {
      setJobsLoading(true);
      setJobsError("");

      try {
        const loadedJobs = await listAllJobs();

        if (isCancelled) {
          return;
        }

        setJobs(loadedJobs);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setJobs([]);
        setJobsError(error instanceof Error ? error.message : "Failed to load screening jobs.");
      } finally {
        if (!isCancelled) {
          setJobsLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadShortlists() {
      try {
        const loadedShortlists = await listAllShortlists({ pageSize: 100 });

        if (isCancelled) {
          return;
        }

        setShortlists(loadedShortlists);
      } catch {
        if (isCancelled) {
          return;
        }
        setShortlists([]);
      }
    }

    void loadShortlists();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadConfig() {
      try {
        const nextConfig = await getGeminiFrontendConfig();

        if (isCancelled) {
          return;
        }

        setScreeningConfig(nextConfig);
        setShortlistSize(nextConfig.defaults.shortlistSize);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setConfigError(error instanceof Error ? error.message : "Failed to load screening configuration.");
      }
    }

    void loadConfig();

    return () => {
      isCancelled = true;
    };
  }, []);

  const selectableJobs = useMemo(() => {
    const jobsWithApplicants = jobs.filter((job) => job.applicantsCount > 0);
    return jobsWithApplicants.length > 0 ? jobsWithApplicants : jobs;
  }, [jobs]);

  useEffect(() => {
    if (selectableJobs.length === 0) {
      setSelectedJobId("");
      return;
    }

    if (!selectableJobs.some((job) => job._id === selectedJobId)) {
      setSelectedJobId(selectableJobs[0]._id);
    }
  }, [selectableJobs, selectedJobId]);

  const selectedJob = useMemo(
    () => selectableJobs.find((job) => job._id === selectedJobId) ?? selectableJobs[0] ?? null,
    [selectableJobs, selectedJobId]
  );

  useEffect(() => {
    if (!selectedJob?._id) {
      setApplicants([]);
      return;
    }

    let isCancelled = false;

    async function loadApplicants() {
      setApplicantsLoading(true);
      setApplicantsError("");
      setRunError("");
      setApplicants([]);
      setAcknowledged(false);
      setIsSubmitting(false);

      try {
        const nextApplicants = await listAllApplicants(selectedJob._id);

        if (isCancelled) {
          return;
        }

        setApplicants(nextApplicants);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setApplicants([]);
        setApplicantsError(error instanceof Error ? error.message : "Failed to load applicants for this job.");
      } finally {
        if (!isCancelled) {
          setApplicantsLoading(false);
        }
      }
    }

    void loadApplicants();

    return () => {
      isCancelled = true;
    };
  }, [selectedJob?._id]);

  const parsedApplicants = useMemo(
    () => applicants.filter((applicant) => applicant.ingestStatus === "parsed"),
    [applicants]
  );
  const pendingApplicantsCount = useMemo(
    () => applicants.filter((applicant) => applicant.ingestStatus === "pending").length,
    [applicants]
  );
  const failedApplicantsCount = useMemo(
    () => applicants.filter((applicant) => applicant.ingestStatus === "failed").length,
    [applicants]
  );
  const jobWeightCriteria = useMemo(() => selectedJob?.weightCriteria ?? [], [selectedJob]);
  const requirements = useMemo(
    () => (selectedJob ? splitLinesToList(selectedJob.mustHaveQualifications) : []),
    [selectedJob]
  );
  const screeningAssets = useMemo(() => buildScreeningAssets(applicants), [applicants]);

  const configuredMinShortlist = screeningConfig?.defaults.minShortlistSize ?? FALLBACK_SHORTLIST_MIN;
  const configuredMaxShortlist = screeningConfig?.defaults.maxShortlistSize ?? FALLBACK_SHORTLIST_MAX;
  const configuredDefaultShortlist = screeningConfig?.defaults.shortlistSize ?? FALLBACK_SHORTLIST_SIZE;

  const effectiveShortlistMin =
    parsedApplicants.length > 0
      ? Math.max(1, Math.min(configuredMinShortlist, parsedApplicants.length))
      : configuredMinShortlist;
  const effectiveShortlistMax =
    parsedApplicants.length > 0
      ? Math.max(1, Math.min(configuredMaxShortlist, parsedApplicants.length))
      : configuredMaxShortlist;
  const effectiveDefaultShortlist =
    parsedApplicants.length > 0
      ? Math.max(1, Math.min(configuredDefaultShortlist, effectiveShortlistMax))
      : configuredDefaultShortlist;

  useEffect(() => {
    setShortlistSize((current) => {
      const base = current > 0 ? current : effectiveDefaultShortlist;
      return Math.max(effectiveShortlistMin, Math.min(base, effectiveShortlistMax));
    });
  }, [effectiveDefaultShortlist, effectiveShortlistMax, effectiveShortlistMin, selectedJobId]);

  const runSequence = useMemo(
    () => shortlists.reduce((max, entry) => Math.max(max, extractRunSequence(entry.runName)), 0) + 1,
    [shortlists]
  );
  const runName = selectedJob ? buildRunName(runSequence) : "RUN-001";
  const estimatedMinSeconds = Math.max(30, Math.round(parsedApplicants.length * 0.4));
  const estimatedMaxSeconds = Math.max(45, Math.round(parsedApplicants.length * 0.5));
  const geminiConfigured = screeningConfig?.configured !== false;
  const screeningDisabled =
    !selectedJob ||
    parsedApplicants.length === 0 ||
    applicantsLoading ||
    isSubmitting ||
    !acknowledged ||
    !geminiConfigured;

  async function handleRunScreening() {
    if (!selectedJob) {
      return;
    }

    if (parsedApplicants.length === 0) {
      setRunError("This job does not have any parsed applicants ready for screening yet.");
      return;
    }

    const normalizedShortlistSize = Math.max(
      1,
      Math.min(shortlistSize || effectiveDefaultShortlist, effectiveShortlistMax, parsedApplicants.length)
    );

    setRunError("");
    setIsSubmitting(true);

    const screeningInstructions =
      "Rank applicants strictly against the configured job requirements and weight criteria. Exclude applicants with incomplete or missing evidence from the shortlist when necessary.";

    try {
      startScreeningRun({
        jobId: selectedJob._id,
        runName,
        jobTitle: selectedJob.title,
        department: selectedJob.department,
        location: selectedJob.location,
        model: screeningConfig?.model,
        shortlistSize: normalizedShortlistSize,
        totalApplicants: parsedApplicants.length,
        estimatedMinSeconds,
        estimatedMaxSeconds,
        instructions: screeningInstructions,
        temperature: 0,
        job: buildScreeningJob(selectedJob),
        applicants: parsedApplicants.map(buildScreeningApplicant),
      });
      setShortlistSize(normalizedShortlistSize);
      router.push("/screening/progress");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Failed to complete the screening run.");
      setIsSubmitting(false);
    }
  }

  if (jobsLoading && jobs.length === 0) {
    return <ScreeningPageSkeleton />;
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-5">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Screening Confirmation</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Configure and trigger the AI screening process for your current backend applicant pool.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<X className="h-4 w-4" />} onClick={() => router.push("/jobs")}>
            Cancel
          </Button>
          <Button
            leftIcon={isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            onClick={() => void handleRunScreening()}
            disabled={screeningDisabled}
          >
            Run Screening
          </Button>
        </div>
      </div>

      {jobsError && (
        <div className="mb-6 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {jobsError}
        </div>
      )}

      {configError && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {configError} The page will use fallback screening defaults until configuration becomes available.
        </div>
      )}

      {screeningConfig && !screeningConfig.configured && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Gemini is not configured on the backend yet, so screening runs are currently disabled.
        </div>
      )}

      {runError && (
        <div className="mb-6 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {runError}
        </div>
      )}

      {!jobsLoading && selectableJobs.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="font-display text-lg font-semibold text-ink">No Jobs Ready For Screening</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Create a job and ingest applicants first, then return here to run AI screening.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/jobs/new" className="contents">
              <Button>Create New Job</Button>
            </Link>
            <Link href="/ingest" className="contents">
              <Button variant="secondary">Go to Ingest</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <header className="mb-5">
                <h2 className="font-display text-lg font-semibold text-ink">Run Parameters</h2>
                <p className="text-sm text-ink-muted">
                  The selected job, applicants, and Gemini defaults are loaded from the backend in real time.
                </p>
              </header>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Run Name" className="md:col-span-2">
                  <Input value={runName} readOnly />
                </Field>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">AI Ranking Distribution</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Fixed weighted model Gemini applies to every applicant. Your job weight criteria are
                    sent as contextual guidance.
                  </p>
                </div>
                <Badge tone="info" pill>
                  {screeningConfig?.model || "Gemini"}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                {GEMINI_SCORING_PILLARS.map((pillar) => (
                  <div
                    key={pillar.id}
                    className="rounded-md border border-line p-3"
                    title={pillar.description}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[11px] font-medium text-ink-muted">{pillar.label}</p>
                      <span className="font-display text-lg font-bold text-brand">{pillar.pct}%</span>
                    </div>
                    <div className="mt-2 h-1 w-full rounded-full bg-surface-soft">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${pillar.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface-soft/40 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  Bands
                </span>
                {GEMINI_RECOMMENDATION_BANDS.map((band) => (
                  <Badge key={band.label} tone={band.tone} pill>
                    {band.label} {band.min}–{band.max}
                  </Badge>
                ))}
                <span
                  className="ml-auto text-[10px] text-ink-muted"
                  title={`Tie-break order: ${GEMINI_TIE_BREAK_ORDER.join(" → ")}`}
                >
                  Tie-break: skills → exp → relevance → confidence
                </span>
              </div>

              {jobWeightCriteria.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    Job context
                  </span>
                  {jobWeightCriteria.map((criterion) => (
                    <span
                      key={criterion.id ?? criterion.label}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-medium text-ink"
                    >
                      <span className="truncate max-w-[140px]">{criterion.label}</span>
                      <span className="font-mono text-ink-muted">{criterion.value}%</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Field
                  label="Shortlist Cap"
                  hint={`Up to ${effectiveShortlistMax} qualified candidates`}
                  className="flex-1 min-w-[200px] mb-0"
                >
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={shortlistSize === 0 ? "" : String(shortlistSize)}
                    onChange={(event) =>
                      setShortlistSize(sanitizeShortlistSizeInput(event.target.value))
                    }
                    onBlur={() => {
                      if (shortlistSize === 0) {
                        setShortlistSize(effectiveDefaultShortlist);
                        return;
                      }

                      setShortlistSize((current) =>
                        Math.max(effectiveShortlistMin, Math.min(current, effectiveShortlistMax))
                      );
                    }}
                    className="max-w-[120px]"
                    disabled={applicantsLoading || parsedApplicants.length === 0}
                  />
                </Field>
                <div className="flex gap-1.5 text-xs">
                  <Badge tone="neutral">Min {effectiveShortlistMin}</Badge>
                  <Badge tone="brand">Default {effectiveDefaultShortlist}</Badge>
                  <Badge tone="neutral">Max {effectiveShortlistMax}</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                  <Play className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Confirm Screening Run</h2>
                  <p className="text-sm text-ink-muted">
                    {selectedJob ? (
                      <>
                        You are about to run a Gemini-powered screening on{" "}
                        <strong>{parsedApplicants.length}</strong> parsed candidates for{" "}
                        <strong>{selectedJob.title}</strong>.
                      </>
                    ) : (
                      "Select a job to prepare your screening run."
                    )}
                  </p>
                </div>
              </div>

              {applicantsLoading && applicants.length === 0 && (
                <div className="mb-4 rounded-lg border border-line bg-surface-soft/30 p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-10 w-full" delayIndex={1} />
                    <Skeleton className="h-10 w-full" delayIndex={2} />
                  </div>
                </div>
              )}

              {applicantsError && (
                <div className="mb-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {applicantsError}
                </div>
              )}

              {!applicantsLoading && pendingApplicantsCount > 0 && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {pendingApplicantsCount} applicant{pendingApplicantsCount === 1 ? "" : "s"} are still pending parsing
                    and will be excluded from this screening run until their data is structured.
                  </span>
                </div>
              )}

              {!applicantsLoading && failedApplicantsCount > 0 && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {failedApplicantsCount} applicant{failedApplicantsCount === 1 ? "" : "s"} failed ingestion and will not
                    be included until corrected.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-line bg-brand-soft/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-info-deep">Run Summary</p>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-info-deep/70">Job</p>
                        <p className="mt-1 text-sm font-semibold text-info-deep">
                          {selectedJob ? selectedJob.title : "Not selected"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-info-deep/70">Applicants</p>
                        <p className="mt-1 text-sm font-semibold text-info-deep">{parsedApplicants.length} candidates</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-info-deep/70">Time</p>
                        <p className="mt-1 text-sm font-semibold text-info-deep">
                          {estimatedMinSeconds}-{estimatedMaxSeconds} sec
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border border-line bg-surface-soft/30 p-4 text-sm text-ink-muted">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(event) => setAcknowledged(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand/40"
                    />
                    <span>
                      I understand this run will evaluate the currently parsed applicants only and generate an AI-ranked
                      shortlist using the saved job criteria. The shortlist cap is a maximum and the final shortlist may
                      be smaller if fewer candidates meet the required threshold.
                    </span>
                  </label>
                </div>

                <div className="rounded-xl border border-line bg-surface-soft/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Before You Run</p>
                  <ul className="mt-3 space-y-3 text-sm text-ink-muted">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>Target job details and ranking weights are loaded from the backend job record.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>Only applicants with parsed structured data are sent to Gemini for scoring.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>The shortlist cap is validated against backend defaults before the run is submitted.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>Top-ranked candidates at 54% match or higher will be shortlisted until the requested cap is filled.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Button variant="secondary" onClick={() => router.push("/jobs")}>
                  Back
                </Button>
                <Button
                  leftIcon={isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  onClick={() => void handleRunScreening()}
                  disabled={screeningDisabled}
                >
                  Confirm &amp; Trigger Analysis
                </Button>
              </div>
            </Card>
          </div>

          <aside className="flex flex-col gap-5">
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <Briefcase className="h-3.5 w-3.5" /> Target Job
              </div>

              <select
                value={selectedJobId}
                onChange={(event) => setSelectedJobId(event.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                disabled={jobsLoading || selectableJobs.length === 0}
              >
                {selectableJobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} ({formatJobId(job)})
                  </option>
                ))}
              </select>

              {selectedJob && (
                <div className="mt-4 rounded-xl border border-line bg-surface-soft/30 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                      <Briefcase className="h-4 w-4 text-brand" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{formatJobId(selectedJob)}</p>
                      <p className="text-sm font-semibold text-ink">{selectedJob.title}</p>
                      <p className="text-xs text-ink-muted">
                        {selectedJob.department} · {selectedJob.location}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-line bg-surface p-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                        <Users className="h-3.5 w-3.5" /> Ready
                      </div>
                      <p className="mt-2 font-display text-2xl font-bold text-ink">{parsedApplicants.length}</p>
                      <p className="text-xs text-ink-muted">Candidates ready for screening</p>
                    </div>
                    <div className="rounded-lg border border-line bg-surface p-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                        <FolderOpen className="h-3.5 w-3.5" /> Assets
                      </div>
                      <p className="mt-2 font-display text-2xl font-bold text-ink">{screeningAssets.length}</p>
                      <p className="text-xs text-ink-muted">Backend source groups attached</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-line bg-surface p-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      <Clock3 className="h-3.5 w-3.5" /> Estimated Processing Time
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {estimatedMinSeconds}-{estimatedMaxSeconds} seconds
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">
                      Based on the number of parsed applicants currently available for this job.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="success">{parsedApplicants.length} Ready</Badge>
                {pendingApplicantsCount > 0 && <Badge tone="warning">{pendingApplicantsCount} Pending</Badge>}
                {failedApplicantsCount > 0 && <Badge tone="danger">{failedApplicantsCount} Failed</Badge>}
              </div>

              <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Core Requirements</h4>
              <ul className="mt-2 space-y-2 text-xs text-ink">
                {requirements.length > 0 ? (
                  requirements.map((requirement) => (
                    <li key={requirement} className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span>{requirement}</span>
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg border border-line bg-surface p-3 text-ink-muted">
                    No must-have qualifications have been configured for this job yet.
                  </li>
                )}
              </ul>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Screening Assets</h3>
                  <p className="mt-1 text-xs text-ink-muted">Applicant sources the backend will use for this screening run.</p>
                </div>
                <Badge tone="info" pill>
                  {parsedApplicants.length} Ready
                </Badge>
              </div>

              {applicantsLoading && applicants.length === 0 ? (
                <div className="mt-4 rounded-lg border border-line bg-surface-soft/30 p-4">
                  <div className="space-y-3">
                    {Array.from({ length: 4 }, (_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3"
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" delayIndex={index} />
                          <Skeleton className="h-3 w-24" delayIndex={index + 1} />
                        </div>
                        <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 2} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : screeningAssets.length > 0 ? (
                <ul className="mt-4 space-y-3 text-xs">
                  {screeningAssets.map((asset) => (
                    <li key={`${asset.name}-${asset.meta}`} className="rounded-lg border border-line bg-surface-soft/30 p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                          <FileText className="h-4 w-4 text-brand" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{asset.name}</p>
                          <p className="mt-1 text-xs text-ink-muted">{asset.meta}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 rounded-lg border border-line bg-surface-soft/30 px-3 py-4 text-sm text-ink-muted">
                  No applicants have been ingested for this job yet.
                </div>
              )}

              <Link href="/ingest" className="contents">
                <Button variant="secondary" size="sm" fullWidth className="mt-4">
                  Manage Assets
                </Button>
              </Link>
            </Card>
          </aside>
        </div>
      )}

    </div>
  );
}
