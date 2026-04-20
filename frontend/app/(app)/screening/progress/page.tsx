"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, CheckCircle2, XCircle, User, ShieldCheck, Clock,
  BarChart3, Zap, ArrowRight, FileText, Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
  clearScreeningRun,
  getScreeningRunSnapshot,
  subscribeToScreeningRun,
  type ScreeningRunSnapshot,
} from "@/lib/screening-progress";

interface StageInfo {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const stages: StageInfo[] = [
  { label: "Parsing Resumes", description: "Extracting text, skills, and experience from candidate documents", icon: FileText },
  { label: "Skill Mapping", description: "Matching extracted skills against job requirements", icon: BarChart3 },
  { label: "Experience Scoring", description: "Evaluating years and relevance of professional experience", icon: Briefcase },
  { label: "Culture Fit Analysis", description: "Assessing soft skills and team compatibility signals", icon: User },
  { label: "Generating Rankings", description: "Computing final scores and ranking candidates", icon: Zap },
  { label: "Audit Trail", description: "Creating explainable AI decision records for compliance", icon: ShieldCheck },
];

function getRecommendationStatus(score: number): "passed" | "flagged" {
  return score >= 80 ? "passed" : "flagged";
}

function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function getProgress(snapshot: ScreeningRunSnapshot | null, now: number) {
  if (!snapshot) {
    return 0;
  }

  if (snapshot.status === "completed") {
    return 100;
  }

  const endTime = snapshot.completedAt ?? now;
  const elapsedSeconds = Math.max(0, Math.floor((endTime - snapshot.startedAt) / 1000));
  const expectedSeconds = Math.max(snapshot.request.estimatedMaxSeconds, 20);
  const timedProgress = 6 + (elapsedSeconds / expectedSeconds) * 86;

  if (snapshot.status === "failed") {
    return Math.max(8, Math.min(timedProgress, 96));
  }

  return Math.max(6, Math.min(timedProgress, 92));
}

export default function ScreeningProgressPage() {
  const router = useRouter();
  const [run, setRun] = useState<ScreeningRunSnapshot | null>(() => getScreeningRunSnapshot());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const unsubscribe = subscribeToScreeningRun(() => {
      setRun(getScreeningRunSnapshot());
      setNow(Date.now());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!run || run.status !== "running") {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 400);

    return () => clearInterval(interval);
  }, [run]);

  const progress = useMemo(() => getProgress(run, now), [now, run]);
  const isComplete = run?.status === "completed";
  const hasFailed = run?.status === "failed";
  const currentStage = useMemo(() => {
    if (isComplete) {
      return stages.length - 1;
    }

    return Math.min(Math.floor((progress / 100) * stages.length), stages.length - 1);
  }, [isComplete, progress]);
  const processedCount = useMemo(() => {
    if (!run) {
      return 0;
    }

    if (isComplete) {
      return run.request.totalApplicants;
    }

    return Math.min(Math.round((progress / 100) * run.request.totalApplicants), run.request.totalApplicants);
  }, [isComplete, progress, run]);
  const elapsedSeconds = useMemo(() => {
    if (!run) {
      return 0;
    }

    const endTime = run.completedAt ?? now;
    return Math.max(0, Math.floor((endTime - run.startedAt) / 1000));
  }, [now, run]);
  const elapsedDisplay = formatElapsed(elapsedSeconds);
  const remainingSeconds = useMemo(() => {
    if (!run || isComplete || hasFailed) {
      return 0;
    }

    return Math.max(0, run.request.estimatedMaxSeconds - elapsedSeconds);
  }, [elapsedSeconds, hasFailed, isComplete, run]);
  const visibleCandidates = useMemo(() => {
    if (!run?.response?.shortlist?.length) {
      return [];
    }

    const candidateCount = isComplete
      ? Math.min(run.response.shortlist.length, 6)
      : Math.min(Math.floor((progress / 100) * run.response.shortlist.length), run.response.shortlist.length);

    return run.response.shortlist.slice(0, candidateCount).map((candidate) => ({
      name: candidate.fullName,
      score: candidate.matchScore,
      status: getRecommendationStatus(candidate.matchScore),
    }));
  }, [isComplete, progress, run]);

  if (!run) {
    return (
      <div className="w-full px-6 py-5">
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">No Active Screening Run</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Start a screening run from the screening page to see live progress here.
          </p>
          <div className="mt-5 flex justify-center">
            <Link href="/screening" className="contents">
              <Button>Go to Screening</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-5">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {isComplete ? "Screening Complete" : hasFailed ? "Screening Failed" : "Screening in Progress"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {isComplete
              ? "All candidates have been evaluated. View your shortlist below."
              : hasFailed
              ? "The screening run stopped before completion. Review the error and try again."
              : `AI is evaluating ${run.request.totalApplicants} candidates against your job criteria.`}
          </p>
        </div>
        <div className="flex gap-2">
          {isComplete ? (
            <Link href={run.savedShortlistId ? `/shortlists?id=${run.savedShortlistId}` : "/shortlists"}>
              <Button leftIcon={<ArrowRight className="h-4 w-4" />}>View Shortlist</Button>
            </Link>
          ) : (
            <Button
              variant="secondary"
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={() => router.push("/screening")}
            >
              Back to Screening
            </Button>
          )}
        </div>
      </div>

      {hasFailed && run.error && (
        <div className="mb-6 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {run.error}
        </div>
      )}

      {isComplete && run.persistWarning && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {run.persistWarning}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isComplete ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </span>
                ) : hasFailed ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                    <XCircle className="h-5 w-5 text-danger" />
                  </span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  </span>
                )}
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">
                    {isComplete ? "Analysis Complete" : hasFailed ? "Run Interrupted" : stages[currentStage].label}
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {isComplete
                      ? "All stages completed successfully"
                      : hasFailed
                      ? "The backend returned an error before the shortlist was finalized."
                      : stages[currentStage].description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-brand">{Math.min(Math.round(progress), 100)}%</p>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">Progress</p>
              </div>
            </div>

            <div className="mt-5">
              <Progress value={Math.min(progress, 100)} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Processed</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">
                  {processedCount}/{run.request.totalApplicants}
                </p>
              </div>
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Elapsed</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">{elapsedDisplay}</p>
              </div>
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Est. Remaining</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">
                  {isComplete || hasFailed ? "—" : `${remainingSeconds}s`}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-ink">Pipeline Stages</h3>
            <p className="mt-1 text-xs text-ink-muted">Real-time progress of each AI evaluation phase.</p>

            <ul className="mt-5 space-y-3">
              {stages.map((stage, i) => {
                const StageIcon = stage.icon;
                const isDone = i < currentStage || isComplete;
                const isCurrent = i === currentStage && !isComplete;

                return (
                  <li
                    key={stage.label}
                    className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                      isDone
                        ? "border-success/30 bg-success/5"
                        : isCurrent
                        ? "border-brand/30 bg-brand-soft/30"
                        : "border-line bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isDone
                          ? "bg-success/10"
                          : isCurrent
                          ? "bg-brand/10"
                          : "bg-surface-soft"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 animate-spin text-brand" />
                      ) : (
                        <StageIcon className="h-4 w-4 text-ink-muted" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDone ? "text-success-deep" : isCurrent ? "text-ink" : "text-ink-muted"}`}>
                        {stage.label}
                      </p>
                      <p className="text-xs text-ink-muted">{stage.description}</p>
                    </div>
                    {isDone && <Badge tone="success" pill>Done</Badge>}
                    {isCurrent && !hasFailed && <Badge tone="brand" pill>Active</Badge>}
                    {hasFailed && isCurrent && <Badge tone="danger" pill>Stopped</Badge>}
                  </li>
                );
              })}
            </ul>
          </Card>

          {isComplete && run.response && (
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-ink">Top Matches</h3>
              <p className="mt-1 text-xs text-ink-muted">
                {run.response.shortlist.length} qualified candidate{run.response.shortlist.length === 1 ? "" : "s"} shortlisted from {run.response.totalApplicants} evaluated applicants.
              </p>

              {run.response.shortlist.length < run.request.shortlistSize && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  The requested shortlist cap was {run.request.shortlistSize}, but only {run.response.shortlist.length} candidate{run.response.shortlist.length === 1 ? "" : "s"} met the shortlist criteria.
                </div>
              )}

              {run.response.shortlist.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {run.response.shortlist.slice(0, 5).map((candidate) => (
                    <li
                      key={`${candidate.applicantEmail}-${candidate.candidateRank}`}
                      className="rounded-md border border-line bg-surface-soft/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            #{candidate.candidateRank} {candidate.fullName}
                          </p>
                          <p className="mt-1 text-xs text-ink-muted">{candidate.summaryExplanation}</p>
                        </div>
                        <Badge tone={candidate.matchScore >= 85 ? "success" : "brand"} pill>
                          {candidate.matchScore}%
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-md border border-line bg-surface-soft/30 p-4 text-sm text-ink-muted">
                  Gemini completed the run, but no candidates met the shortlist criteria.
                </div>
              )}
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <Briefcase className="h-3.5 w-3.5" /> Target Job
            </div>
            <h3 className="font-display text-base font-semibold text-ink">{run.request.jobTitle}</h3>
            <p className="text-xs text-ink-muted">
              {[run.request.department, run.request.location].filter(Boolean).join(" · ") || "Screening run"}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
              <Clock className="h-3.5 w-3.5" />
              Run started at {new Date(run.startedAt).toLocaleTimeString()}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Requested Cap</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">{run.request.shortlistSize}</p>
              </div>
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Model</p>
                <p className="mt-1 text-sm font-semibold text-ink">{run.request.model || "Gemini"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Live Candidate Feed</h3>
              <Badge tone={isComplete ? "success" : hasFailed ? "danger" : "success"} pill>
                {isComplete ? "READY" : hasFailed ? "ERROR" : "LIVE"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {isComplete ? "Top shortlisted candidates from this run" : "Candidates will appear here when results are ready"}
            </p>

            {visibleCandidates.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-line p-6 text-center text-xs text-ink-muted">
                {hasFailed ? (
                  <XCircle className="mx-auto mb-2 h-5 w-5 text-danger/60" />
                ) : (
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-brand/40" />
                )}
                {hasFailed ? "No shortlist was produced for this run." : "Waiting for results…"}
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {visibleCandidates.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between rounded-md border border-line p-2.5 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-ink">{c.name}</p>
                        <p className="text-[10px] text-ink-muted">
                          {c.status === "flagged" ? "Flagged for review" : "Passed all checks"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${c.score >= 90 ? "text-success" : c.score >= 80 ? "text-brand" : "text-ink-muted"}`}>
                        {c.score}%
                      </p>
                      {c.status === "flagged" && <Badge tone="warning" pill className="mt-0.5 text-[9px]">Review</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border border-success/30 bg-success/5 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success-deep" />
              <h3 className="text-sm font-semibold text-success-deep">Audit & Compliance</h3>
            </div>
            <p className="mt-2 text-xs leading-5 text-success-deep/80">
              All AI decisions are logged with full explainability. No PII is permanently stored. This
              run generates a tamper-proof audit trail for regulatory compliance.
            </p>
          </Card>

          {(isComplete || hasFailed) && (
            <Card className="p-5">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    clearScreeningRun();
                    router.push(isComplete ? (run.savedShortlistId ? `/shortlists?id=${run.savedShortlistId}` : "/shortlists") : "/screening");
                  }}
                >
                  {isComplete ? "Continue to Shortlists" : "Return to Screening"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    clearScreeningRun();
                    router.push("/screening");
                  }}
                >
                  Start Another Run
                </Button>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
