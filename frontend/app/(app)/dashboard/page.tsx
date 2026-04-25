"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Briefcase,
  CircleCheck,
  ExternalLink,
  Filter,
  Gauge,
  LoaderCircle,
  Plus,
  RefreshCw,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { getStoredAuth, type AuthUser } from "@/lib/auth";
import { fetchDashboardSummary } from "@/lib/dashboard";

interface DashboardMetric {
  label: string;
  value: string;
  context: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardRun {
  title: string;
  when: string;
  applicants: string;
  topMatch: number | null;
  status: "Completed";
}

interface SpotlightItem {
  title: string;
  count: string;
}

interface DashboardSnapshot {
  metrics: DashboardMetric[];
  runs: DashboardRun[];
  spotlight: SpotlightItem[];
  hiringEfficiency: string;
  nextSteps: string;
  totalApplicants: number;
  applicantsIn30Days: number;
  totalShortlists: number;
  shortlistsIn30Days: number;
  weeklyScreeningRuns: number;
  averageScreeningRuntimeHours: number;
  timedRunsCount: number;
  activeJobs: number;
  draftJobs: number;
  bestRunJobTitle?: string;
}

type RunFilter = "all" | "recent" | "topMatch";


function formatRelativeTime(value: string) {
  const then = new Date(value).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

function formatHours(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "—";
  }

  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }

  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }

  return `${(hours / 24).toFixed(1)}d`;
}

function DashboardSkeleton() {
  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" delayIndex={1} />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" delayIndex={2} />
          <Skeleton className="h-10 w-36" delayIndex={3} />
        </div>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <Skeleton shape="circle" className="h-9 w-9" delayIndex={index + 4} />
              <Skeleton shape="pill" className="h-6 w-24" delayIndex={index + 5} />
            </div>
            <Skeleton className="mt-7 h-4 w-32" delayIndex={index + 6} />
            <Skeleton className="mt-2 h-8 w-20" delayIndex={index + 7} />
          </Card>
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_314px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title={<Skeleton className="h-6 w-48" delayIndex={10} />}
              description={<Skeleton className="mt-2 h-4 w-80 max-w-full" delayIndex={11} />}
              action={<Skeleton className="h-8 w-28" delayIndex={12} />}
            />
            <div className="divide-y divide-line">
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-[1.6fr_1fr_1.3fr_1fr_100px] md:items-center md:gap-4 ${
                    index % 2 === 1 ? "bg-surface-soft/30" : "bg-surface"
                  }`}
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" delayIndex={index + 13} />
                    <Skeleton className="h-3 w-20" delayIndex={index + 14} />
                  </div>
                  <Skeleton className="h-4 w-24" delayIndex={index + 15} />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-10" delayIndex={index + 16} />
                    <Skeleton className="h-2 w-16" delayIndex={index + 17} />
                  </div>
                  <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 18} />
                  <div className="md:text-right">
                    <Skeleton className="h-8 w-16" delayIndex={index + 19} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card className="p-5">
              <Skeleton className="h-4 w-32" delayIndex={20} />
              <Skeleton className="mt-3 h-3 w-full" delayIndex={21} />
              <Skeleton className="mt-2 h-3 w-5/6" delayIndex={22} />
            </Card>
            <Card className="p-5">
              <Skeleton className="h-4 w-28" delayIndex={23} />
              <Skeleton className="mt-3 h-3 w-full" delayIndex={24} />
              <Skeleton className="mt-2 h-3 w-4/5" delayIndex={25} />
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <Skeleton className="h-5 w-48" delayIndex={26} />
            <Skeleton className="mt-2 h-4 w-52" delayIndex={27} />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="rounded-md border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-4 w-36" delayIndex={index + 28} />
                    <Skeleton shape="pill" className="h-6 w-14" delayIndex={index + 29} />
                  </div>
                  <Skeleton className="mt-2 h-3 w-32" delayIndex={index + 30} />
                  <Skeleton className="mt-3 h-8 w-full" delayIndex={index + 31} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <Skeleton className="h-4 w-28" delayIndex={32} />
            <div className="mt-4 flex flex-col gap-2">
              <Skeleton className="h-11 w-full" delayIndex={33} />
              <Skeleton className="h-11 w-full" delayIndex={34} />
              <Skeleton className="h-11 w-full" delayIndex={35} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyDashboardState() {
  return (
    <div className="mt-6 rounded-2xl border border-line bg-surface px-6 py-10 text-center shadow-card">
      <p className="font-display text-xl font-semibold text-ink">Your dashboard is ready for live data.</p>
      <p className="mt-2 text-sm text-ink-muted">
        Create a job and ingest applicants to start seeing pipeline activity, screening runs, and recommendations.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/jobs/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Create New Job</Button>
        </Link>
        <Link href="/ingest">
          <Button variant="secondary" leftIcon={<UserPlus className="h-4 w-4" />}>
            Ingest Applicants
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [account] = useState<AuthUser | null>(() => getStoredAuth()?.user ?? null);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [runFilter, setRunFilter] = useState<RunFilter>("all");

  const greeting = useMemo(() => {
    const firstName = account?.firstName?.trim();
    return firstName ? `Welcome back, ${firstName}.` : "Welcome back.";
  }, [account]);

  const runInsights = useMemo(() => {
    const runs = snapshot?.runs ?? [];
    const matchValues = runs
      .map((run) => run.topMatch)
      .filter((value): value is number => typeof value === "number");
    const averageMatch = matchValues.length > 0
      ? Math.round(matchValues.reduce((sum, value) => sum + value, 0) / matchValues.length)
      : null;
    const distribution = {
      strong: matchValues.filter((value) => value >= 90).length,
      good: matchValues.filter((value) => value >= 80 && value < 90).length,
      fair: matchValues.filter((value) => value >= 70 && value < 80).length,
      weak: matchValues.filter((value) => value < 70).length,
    };
    const topMatch = matchValues.length > 0 ? Math.max(...matchValues) : null;
    return { averageMatch, distribution, topMatch };
  }, [snapshot]);

  const filteredRuns = useMemo(() => {
    const runs = snapshot?.runs ?? [];
    if (runFilter === "topMatch") {
      return runs.filter((run) => typeof run.topMatch === "number" && run.topMatch >= 85);
    }
    if (runFilter === "recent") {
      return runs.filter((run) =>
        /Just now|m ago|h ago|^[1-6]d ago$/.test(run.when)
      );
    }
    return runs;
  }, [snapshot, runFilter]);

  const conversionRate = useMemo(() => {
    if (!snapshot || snapshot.totalApplicants <= 0) return null;
    return Math.round((snapshot.totalShortlists / snapshot.totalApplicants) * 100);
  }, [snapshot]);

  const recentApplicantsShare = useMemo(() => {
    if (!snapshot || snapshot.totalApplicants <= 0) return null;
    return Math.round((snapshot.applicantsIn30Days / snapshot.totalApplicants) * 100);
  }, [snapshot]);

  const recentShortlistShare = useMemo(() => {
    if (!snapshot || snapshot.totalShortlists <= 0) return null;
    return Math.round((snapshot.shortlistsIn30Days / snapshot.totalShortlists) * 100);
  }, [snapshot]);

  async function loadDashboard() {
    setError("");

    try {
      const summary = await fetchDashboardSummary();
      const activeJobs = summary.activeJobs;
      const draftJobs = summary.draftJobs;
      const timedRunsCount = summary.timedRunsCount;
      const averageScreeningRuntime = summary.averageScreeningRuntimeHours;

      const metrics: DashboardMetric[] = [
        {
          label: "Active Jobs",
          value: String(activeJobs),
          context: draftJobs > 0 ? `${draftJobs} drafts waiting` : "No drafts pending",
          icon: Briefcase,
        },
        {
          label: "Applicants Ingested (30d)",
          value: String(summary.applicantsIn30Days),
          context: `${summary.totalApplicants} total applicants tracked`,
          icon: Users,
        },
        {
          label: "Screenings Completed",
          value: String(summary.totalShortlists),
          context:
            summary.shortlistsIn30Days > 0
              ? `${summary.shortlistsIn30Days} completed in the last 30 days`
              : "No completed runs in the last 30 days",
          icon: CircleCheck,
        },
        {
          label: "Avg. Screening Runtime",
          value: formatHours(averageScreeningRuntime),
          context:
            timedRunsCount > 0
              ? `Based on ${timedRunsCount} runs from screening start to shortlist output`
              : "Waiting for runs with saved screening timing",
          icon: Timer,
        },
      ];

      const runs: DashboardRun[] = summary.recentRuns.slice(0, 5).map((run) => ({
        title: run.title,
        when: formatRelativeTime(run.createdAt),
        applicants: `${run.applicants} candidates`,
        topMatch: run.topMatch || null,
        status: "Completed",
      }));

      const spotlight: SpotlightItem[] = summary.spotlight.map((job) => ({
          title: job.title,
          count:
            job.recentApplicants > 0
              ? `${job.recentApplicants} applicants added in the last 30 days`
              : `${job.applicantsCount} applicants currently attached`,
        }));

      const hiringEfficiency =
        timedRunsCount > 0
          ? `Across ${timedRunsCount} timed screening runs, the current average screening runtime is ${formatHours(
              averageScreeningRuntime
            )}. ${activeJobs} jobs are active and ${summary.applicantsIn30Days} applicants were added in the last 30 days.`
          : "No timed screening runs are available yet. Newly saved shortlist results will automatically include screening runtime so this panel can summarize pipeline efficiency.";

      const bestRun = summary.bestRun;
      const nextSteps = bestRun
        ? `${bestRun.topCandidateName || "A top candidate"} from ${bestRun.jobTitle} currently leads with a ${bestRun.topMatchScore}% top-match score. Review the shortlist and move strong matches forward while the pipeline is fresh.`
        : "No shortlist recommendations are available yet. Run a screening on an active job to generate next-step guidance here.";

      setSnapshot({
        metrics,
        runs,
        spotlight,
        hiringEfficiency,
        nextSteps,
        totalApplicants: summary.totalApplicants,
        applicantsIn30Days: summary.applicantsIn30Days,
        totalShortlists: summary.totalShortlists,
        shortlistsIn30Days: summary.shortlistsIn30Days,
        weeklyScreeningRuns: summary.weeklyScreeningRuns,
        averageScreeningRuntimeHours: summary.averageScreeningRuntimeHours,
        timedRunsCount: summary.timedRunsCount,
        activeJobs,
        draftJobs,
        bestRunJobTitle: bestRun?.jobTitle,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;
    let attempts = 0;
    let retryTimer: number | null = null;

    const attemptLoad = () => {
      if (isCancelled) {
        return;
      }

      if (getStoredAuth()?.token) {
        void loadDashboard();
        return;
      }

      if (attempts >= 10) {
        setIsLoading(false);
        setError("Your session is still being restored. Please try again.");
        return;
      }

      attempts += 1;
      retryTimer = window.setTimeout(attemptLoad, 150);
    };

    attemptLoad();

    return () => {
      isCancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-5">
      <PageHeader
        title="Recruiter Dashboard"
        description={`${greeting} Here's what's happening with your hiring pipeline.`}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={isRefreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              onClick={() => {
                setIsRefreshing(true);
                void loadDashboard();
              }}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing" : "Refresh"}
            </Button>
            <Link href="/jobs">
              <Button variant="secondary" leftIcon={<Briefcase className="h-4 w-4" />}>
                Manage Jobs
              </Button>
            </Link>
            <Link href="/jobs/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>Create New Job</Button>
            </Link>
          </>
        }
      />

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {snapshot && snapshot.metrics.every((metric) => metric.value === "0" || metric.value === "—") ? (
        <EmptyDashboardState />
      ) : (
        <>
          <section aria-label="Key metrics" className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {snapshot?.metrics.map((metric) => {
              const Icon = metric.icon;
              let share: { label: string; value: number } | null = null;
              if (metric.label === "Applicants Ingested (30d)" && recentApplicantsShare !== null) {
                share = { label: `${recentApplicantsShare}% of all-time applicants`, value: recentApplicantsShare };
              } else if (metric.label === "Screenings Completed" && recentShortlistShare !== null) {
                share = { label: `${recentShortlistShare}% added in the last 30 days`, value: recentShortlistShare };
              } else if (metric.label === "Active Jobs" && snapshot && snapshot.activeJobs + snapshot.draftJobs > 0) {
                const ratio = Math.round((snapshot.activeJobs / (snapshot.activeJobs + snapshot.draftJobs)) * 100);
                share = { label: `${ratio}% of jobs are active`, value: ratio };
              }
              return (
                <Card key={metric.label} className="p-4">
                  <div className="flex items-start justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10" aria-hidden>
                      <Icon className="h-4 w-4 text-brand" />
                    </span>
                    <Badge tone="neutral" pill>
                      Live
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-ink-muted">{metric.label}</p>
                  <p className="mt-0.5 font-display text-2xl font-bold text-ink">{metric.value}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{metric.context}</p>
                  {share && (
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={share.value} className="flex-1" />
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-muted">{share.value}%</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </section>

          <section aria-label="Pipeline health" className="mt-5">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-brand" aria-hidden />
                <h3 className="text-sm font-semibold text-ink">Pipeline Health</h3>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-ink-muted">Avg Top Match</p>
                  <p className="mt-0.5 font-display text-xl font-bold text-ink">
                    {runInsights.averageMatch !== null ? `${runInsights.averageMatch}%` : "—"}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {runInsights.averageMatch !== null
                      ? `Across ${snapshot?.runs.length ?? 0} recent runs`
                      : "Awaiting first run"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Shortlist Conversion</p>
                  <p className="mt-0.5 font-display text-xl font-bold text-ink">
                    {conversionRate !== null ? `${conversionRate}%` : "—"}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {snapshot
                      ? `${snapshot.totalShortlists} runs · ${snapshot.totalApplicants} applicants`
                      : "Awaiting applicants"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Weekly Throughput</p>
                  <p className="mt-0.5 font-display text-xl font-bold text-ink">
                    {snapshot?.weeklyScreeningRuns ?? 0}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Runs in 7d · {snapshot?.shortlistsIn30Days ?? 0} in 30d
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Best Recent Match</p>
                  <p className="mt-0.5 font-display text-xl font-bold text-ink">
                    {runInsights.topMatch !== null ? `${runInsights.topMatch}%` : "—"}
                  </p>
                  <p className="truncate text-[11px] text-ink-muted">
                    {snapshot?.bestRunJobTitle
                      ? `From ${snapshot.bestRunJobTitle}`
                      : "Awaiting top candidate"}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_314px]">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader
                  title="Recent Screening Runs"
                  description="Latest shortlist records generated by the backend screening workflow."
                  action={
                    <Link href="/history">
                      <Button variant="ghost" size="sm">
                        View Full History
                      </Button>
                    </Link>
                  }
                />

                {snapshot && snapshot.runs.length > 0 && runInsights.averageMatch !== null && (
                  <div className="border-b border-line bg-surface-soft/10 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-ink-muted">Top match per recent run (oldest → newest)</p>
                      <p className="text-[11px] text-ink-muted">avg {runInsights.averageMatch}%</p>
                    </div>
                    <div className="relative h-16">
                      <div
                        className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-line"
                        style={{ bottom: `${runInsights.averageMatch * 0.6}px` }}
                        aria-hidden
                      />
                      <div className="relative flex h-full items-end gap-1.5">
                        {[...snapshot.runs].reverse().map((run, idx) => {
                          const value = typeof run.topMatch === "number" ? run.topMatch : 0;
                          const isStrong = value >= 85;
                          const heightPx = Math.max(4, value * 0.6);
                          return (
                            <div
                              key={`${run.title}-${idx}`}
                              className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
                              title={`${run.title} · ${value}% · ${run.when}`}
                            >
                              <span className="text-[9px] font-semibold text-ink-muted opacity-0 transition-opacity group-hover:opacity-100">
                                {value}%
                              </span>
                              <div
                                className={`w-full rounded-t-sm transition-all ${isStrong ? "bg-success" : "bg-brand"} hover:opacity-80`}
                                style={{ height: `${heightPx}px` }}
                                aria-label={`${run.title} top match ${value}%`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {snapshot && snapshot.runs.length > 0 && (
                  <div className="flex flex-col gap-3 border-b border-line bg-surface-soft/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <Activity className="h-3.5 w-3.5" />
                        <span>Match distribution:</span>
                      </div>
                      <Badge tone="success" pill>
                        {runInsights.distribution.strong} ≥ 90%
                      </Badge>
                      <Badge tone="brand" pill>
                        {runInsights.distribution.good} 80–89%
                      </Badge>
                      <Badge tone="info" pill>
                        {runInsights.distribution.fair} 70–79%
                      </Badge>
                      <Badge tone="neutral" pill>
                        {runInsights.distribution.weak} &lt; 70%
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-ink-muted" />
                      {(
                        [
                          { key: "all" as const, label: "All" },
                          { key: "recent" as const, label: "Last 7d" },
                          { key: "topMatch" as const, label: "Top match ≥ 85%" },
                        ]
                      ).map((option) => {
                        const isActive = runFilter === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setRunFilter(option.key)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                              isActive
                                ? "border-brand bg-brand text-white"
                                : "border-line text-ink-muted hover:border-brand/40 hover:text-ink"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {snapshot && snapshot.runs.length > 0 ? (
                  <div role="table" className="divide-y divide-line">
                    <div role="row" className="hidden grid-cols-[1.6fr_1fr_1.3fr_1fr_100px] gap-4 bg-surface-soft/30 px-4 py-3 text-xs text-ink-muted md:grid">
                      <span role="columnheader">Job Title</span>
                      <span role="columnheader">Applicants</span>
                      <span role="columnheader">Top Match</span>
                      <span role="columnheader">Status</span>
                      <span role="columnheader" className="text-right">
                        Action
                      </span>
                    </div>
                    {filteredRuns.length === 0 ? (
                      <div className="px-6 py-10 text-center text-sm text-ink-muted">
                        No runs match this filter. Try a different range.
                      </div>
                    ) : null}
                    {filteredRuns.map((run, index) => (
                      <div
                        key={`${run.title}-${run.when}-${index}`}
                        role="row"
                        className={`grid grid-cols-2 gap-3 px-4 py-4 text-sm md:grid-cols-[1.6fr_1fr_1.3fr_1fr_100px] md:items-center md:gap-4 ${
                          index % 2 === 1 ? "bg-surface-soft/30" : "bg-surface"
                        }`}
                      >
                        <div>
                          <p className="text-ink">{run.title}</p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">{run.when}</p>
                        </div>
                        <p className="text-ink">{run.applicants}</p>
                        <div className="flex items-center gap-3">
                          {run.topMatch === null ? (
                            <span className="text-ink-muted">--</span>
                          ) : (
                            <>
                              <span className={`font-semibold ${run.topMatch >= 85 ? "text-success" : "text-brand"}`}>
                                {run.topMatch}%
                              </span>
                              <Progress value={run.topMatch} className="w-16" />
                            </>
                          )}
                        </div>
                        <div>
                          <Badge tone="neutral">{run.status}</Badge>
                        </div>
                        <div className="md:text-right">
                          <Link href="/shortlists">
                            <Button variant="ghost" size="sm">
                              Review
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-10 text-sm text-ink-muted">
                    No screening runs have been saved yet. Completed shortlists will appear here automatically.
                  </div>
                )}
              </Card>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Card className="bg-brand-soft/30 p-5 dark:bg-brand/5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand" />
                    <h3 className="text-sm font-semibold tracking-tight text-ink">Hiring Efficiency</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-ink-muted">{snapshot?.hiringEfficiency}</p>
                </Card>
                <Card className="bg-success/10 p-5 dark:bg-success/5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-success" />
                    <h3 className="text-sm font-semibold tracking-tight text-success">Next Steps</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-success dark:text-success/80">{snapshot?.nextSteps}</p>
                </Card>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <Card className="bg-brand-soft p-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-info-deep" aria-hidden />
                  <h3 className="font-display text-base font-bold text-info-deep">Spotlight Recommendations</h3>
                </div>
                <p className="mt-2 text-sm text-info-deep/70">Jobs with the strongest recent applicant activity.</p>
                {snapshot && snapshot.spotlight.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-3">
                    {snapshot.spotlight.map((item) => (
                      <li key={item.title} className="rounded-md border border-line bg-surface p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-ink">{item.title}</p>
                          <Badge tone="success" pill>
                            AI Pick
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink-muted">{item.count}</p>
                        <Link href="/screening">
                          <Button
                            variant="secondary"
                            size="sm"
                            fullWidth
                            className="mt-3"
                            leftIcon={<RefreshCw className="h-3 w-3" />}
                          >
                            Re-run Screening
                          </Button>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 rounded-md border border-line bg-surface p-4 text-sm text-ink-muted">
                    Spotlight recommendations will appear once jobs start receiving applicants.
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="px-2 pb-3 pt-2 text-sm font-bold uppercase tracking-widest text-ink-muted">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <Link href="/ingest">
                    <Button variant="dashed" fullWidth leftIcon={<UserPlus className="h-4 w-4" />} className="h-11 justify-start">
                      Ingest New Applicants
                    </Button>
                  </Link>
                  <Link href="/jobs/new">
                    <Button variant="dashed" fullWidth leftIcon={<Plus className="h-4 w-4" />} className="h-11 justify-start">
                      Create a New Job Role
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button variant="dashed" fullWidth leftIcon={<ExternalLink className="h-4 w-4" />} className="h-11 justify-start">
                      Browse All Open Jobs
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="border border-dashed border-line bg-surface-soft/40 p-4 shadow-none">
                <p className="text-center text-[11px] italic leading-5 text-ink-muted">
                  Dashboard values are now calculated from live backend data across jobs, applicants, and shortlists.
                </p>
                <div className="mt-2 text-center">
                  <Link href="/history">
                    <Button variant="ghost" size="sm">
                      Open Screening History
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
