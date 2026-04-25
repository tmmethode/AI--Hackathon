"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Play, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchHistorySummary, type HistoryRunSummary } from "@/lib/shortlists";
import { downloadCsv, sanitizeFilename } from "@/lib/download";

function formatDateTime(value?: string) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusTone(run: HistoryRunSummary): "success" | "warning" {
  const hasDuration = typeof run.screeningDurationSeconds === "number";
  return hasDuration ? "success" : "warning";
}

function getStatusLabel(run: HistoryRunSummary) {
  return typeof run.screeningDurationSeconds === "number" ? "Completed" : "Recorded";
}

export default function ScreeningHistoryPage() {
  const [runs, setRuns] = useState<HistoryRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchHistorySummary({ page: 1, pageSize: 50 });
      setRuns(response.data.runs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load screening history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRuns();
  }, []);

  // Re-pull the latest history data when the user returns to this tab so
  // status changes made on the Selected Candidates / Shortlists pages are reflected.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void loadRuns();
      }
    }
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const latestRun = useMemo(() => runs[0] ?? null, [runs]);

  const totals = useMemo(() => {
    return runs.reduce(
      (acc, run) => {
        const counts = run.stageCounts;
        if (counts) {
          acc.active += counts.active;
          acc.interview += counts.interview;
          acc.exam += counts.exam;
          acc.assessment += counts.assessment;
          acc.practical += counts.practical;
          acc.rejected += counts.rejected;
        }
        return acc;
      },
      { active: 0, interview: 0, exam: 0, assessment: 0, practical: 0, rejected: 0 }
    );
  }, [runs]);

  const handleExportLogs = () => {
    if (runs.length === 0) {
      return;
    }

    const header = [
      "Run Name",
      "Job Title",
      "Total Applicants",
      "Shortlist Size",
      "Active in Pipeline",
      "Shortlisted",
      "Interview",
      "Technical Exam",
      "Assessment",
      "Practical",
      "Rejected",
      "Avg Match %",
      "Top Match %",
      "Top Candidate",
      "Completed",
      "Duration (s)",
      "Status",
    ];
    const rows: (readonly unknown[])[] = [header];
    for (const run of runs) {
      const counts = run.stageCounts;
      rows.push([
        run.runName || "Untitled Run",
        run.jobTitle || "",
        run.totalApplicants ?? 0,
        run.shortlistCount ?? 0,
        counts?.active ?? 0,
        counts?.shortlisted ?? 0,
        counts?.interview ?? 0,
        counts?.exam ?? 0,
        counts?.assessment ?? 0,
        counts?.practical ?? 0,
        counts?.rejected ?? 0,
        run.averageMatchScore ?? 0,
        run.topMatchScore ?? 0,
        run.topCandidateName || "",
        formatDateTime(run.screeningCompletedAt || run.createdAt),
        run.screeningDurationSeconds ?? "",
        getStatusLabel(run),
      ]);
    }

    const filename = sanitizeFilename(`screening-runs_${new Date().toISOString().slice(0, 10)}`);
    downloadCsv(rows, `${filename}.csv`);
  };

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Screening History"
        description="Live shortlist run history synced from backend records."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExportLogs}
              disabled={loading || runs.length === 0}
            >
              Export Logs
            </Button>
            <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadRuns()}>
              Refresh
            </Button>
            <Link href="/screening">
              <Button leftIcon={<Play className="h-4 w-4" />}>Trigger New Run</Button>
            </Link>
          </>
        }
      />

      {!loading && runs.length > 0 && (
        <Card className="mt-6 p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span className="font-semibold uppercase tracking-wider">Pipeline totals across runs:</span>
            <Badge tone="brand" pill>{totals.active} Active</Badge>
            <Badge tone="success" pill>{totals.interview} Interview</Badge>
            <Badge tone="success" pill>{totals.exam} Tech Exam</Badge>
            <Badge tone="success" pill>{totals.assessment} Assessment</Badge>
            <Badge tone="success" pill>{totals.practical} Practical</Badge>
            <Badge tone="danger" pill>{totals.rejected} Rejected</Badge>
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Recent Screening Runs</h2>
            <p className="text-sm text-ink-muted">{loading ? "Loading runs..." : `Showing ${runs.length} run(s)`}</p>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-10 text-sm text-danger">{error}</div>
        ) : loading ? (
          <div className="px-6 py-10 text-sm text-ink-muted">Fetching shortlist runs from backend...</div>
        ) : runs.length === 0 ? (
          <div className="px-6 py-10 text-sm text-ink-muted">
            No screening runs found yet. Complete a screening run to populate this page.
          </div>
        ) : (
          <div role="table">
            <div
              role="row"
              className="hidden grid-cols-[2fr_0.9fr_0.9fr_1fr_0.9fr] gap-4 bg-surface-soft/40 px-6 py-3 text-xs uppercase tracking-wider text-ink-muted md:grid"
            >
              <span role="columnheader">Run Name / Job</span>
              <span role="columnheader">Applicants</span>
              <span role="columnheader">Shortlist</span>
              <span role="columnheader">Completed</span>
              <span role="columnheader">Status</span>
            </div>
            <ul className="divide-y divide-line">
              {runs.map((run, index) => {
                const counts = run.stageCounts;
                return (
                  <li
                    key={run._id}
                    className={`grid grid-cols-2 gap-3 px-6 py-4 text-sm md:grid-cols-[2fr_0.9fr_0.9fr_1fr_0.9fr] md:items-center md:gap-4 ${
                      index === 0 ? "bg-brand-soft/30" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium text-ink">{run.runName || "Untitled Run"}</p>
                      <p className="text-xs text-ink-muted">{run.jobTitle}</p>
                      {counts && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {counts.shortlisted > 0 && <Badge tone="brand">{counts.shortlisted} shortlisted</Badge>}
                          {counts.interview > 0 && <Badge tone="success">{counts.interview} interview</Badge>}
                          {counts.exam > 0 && <Badge tone="success">{counts.exam} exam</Badge>}
                          {counts.assessment > 0 && <Badge tone="success">{counts.assessment} assessment</Badge>}
                          {counts.practical > 0 && <Badge tone="success">{counts.practical} practical</Badge>}
                          {counts.rejected > 0 && <Badge tone="danger">{counts.rejected} rejected</Badge>}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-ink">{run.totalApplicants}</p>
                    <div>
                      <p className="font-semibold text-ink">{run.shortlistCount}</p>
                      {counts && counts.active !== run.shortlistCount && (
                        <p className="text-[10px] text-ink-muted">{counts.active} active in pipeline</p>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted">{formatDateTime(run.screeningCompletedAt || run.createdAt)}</p>
                    <div>
                      <Badge tone={getStatusTone(run)} pill>
                        {getStatusLabel(run)}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>

      {latestRun && (
        <Card className="mt-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Latest Run Details</h2>
              <p className="text-sm text-ink-muted">
                {latestRun.runName || "Untitled Run"} · {latestRun.jobTitle}
              </p>
            </div>
            <Link href="/shortlists">
              <Button variant="secondary" size="sm">
                Open Shortlists
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-md border border-line p-3">
              <p className="text-xs text-ink-muted">Total Candidates</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{latestRun.totalApplicants}</p>
            </div>
            <div className="rounded-md border border-line p-3">
              <p className="text-xs text-ink-muted">Shortlist Size</p>
              <p className="mt-1 font-display text-xl font-bold text-success">{latestRun.shortlistCount}</p>
            </div>
            <div className="rounded-md border border-line p-3">
              <p className="text-xs text-ink-muted">Avg Match</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{latestRun.averageMatchScore ?? 0}%</p>
            </div>
            <div className="rounded-md border border-line p-3">
              <p className="text-xs text-ink-muted">Top Match Score</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{latestRun.topMatchScore || 0}%</p>
            </div>
            <div className="rounded-md border border-line p-3">
              <p className="text-xs text-ink-muted">Top Candidate</p>
              <p className="mt-1 font-display text-base font-bold text-ink">{latestRun.topCandidateName || "--"}</p>
            </div>
          </div>

          {latestRun.stageCounts && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Pipeline Stage Breakdown</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="brand" pill>{latestRun.stageCounts.shortlisted} Shortlisted</Badge>
                <Badge tone="success" pill>{latestRun.stageCounts.interview} Interview</Badge>
                <Badge tone="success" pill>{latestRun.stageCounts.exam} Technical Exam</Badge>
                <Badge tone="success" pill>{latestRun.stageCounts.assessment} Assessment</Badge>
                <Badge tone="success" pill>{latestRun.stageCounts.practical} Practical</Badge>
                <Badge tone="danger" pill>{latestRun.stageCounts.rejected} Rejected</Badge>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
