"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  CircleCheck,
  Timer,
  TrendingUp,
  Zap,
  RefreshCw,
  Plus,
  ExternalLink,
  UserPlus,
  LoaderCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { getStoredAuth, type AuthUser } from "@/lib/auth";
import { listAllApplicants } from "@/lib/applicants";
import { listAllJobs } from "@/lib/jobs";
import { listAllShortlists } from "@/lib/shortlists";

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
}

function startOfThirtyDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date;
}

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

function secondsToHours(seconds: number) {
  return seconds / (60 * 60);
}

function DashboardSkeleton() {
  return (
    <div className="w-full px-6 py-5">
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

  const greeting = useMemo(() => {
    const firstName = account?.firstName?.trim();
    return firstName ? `Welcome back, ${firstName}.` : "Welcome back.";
  }, [account]);

  async function loadDashboard() {
    setError("");

    try {
      const [jobs, shortlists] = await Promise.all([listAllJobs(), listAllShortlists()]);
      const thirtyDaysAgo = startOfThirtyDaysAgo();
      const applicantBatches = await Promise.all(
        jobs.map(async (job) => ({
          jobId: job._id,
          applicants: await listAllApplicants(job._id),
        }))
      );

      const applicantsByJob = new Map(
        applicantBatches.map((entry) => [entry.jobId, entry.applicants])
      );

      const totalApplicants = jobs.reduce((sum, job) => sum + job.applicantsCount, 0);
      const activeJobs = jobs.filter((job) => job.status === "Active");
      const draftJobs = jobs.filter((job) => job.status === "Draft");
      const applicantsIn30Days = applicantBatches.reduce(
        (sum, entry) =>
          sum +
          entry.applicants.filter((applicant) => new Date(applicant.createdAt) >= thirtyDaysAgo).length,
        0
      );
      const shortlistsIn30Days = shortlists.filter(
        (shortlist) => new Date(shortlist.createdAt) >= thirtyDaysAgo
      ).length;

      const screeningRuntimeHours = shortlists
        .map((shortlist) =>
          typeof shortlist.screeningDurationSeconds === "number" &&
          Number.isFinite(shortlist.screeningDurationSeconds) &&
          shortlist.screeningDurationSeconds >= 0
            ? secondsToHours(shortlist.screeningDurationSeconds)
            : null
        )
        .filter((value): value is number => value !== null);

      const averageScreeningRuntime =
        screeningRuntimeHours.length > 0
          ? screeningRuntimeHours.reduce((sum, value) => sum + value, 0) / screeningRuntimeHours.length
          : 0;

      const metrics: DashboardMetric[] = [
        {
          label: "Active Jobs",
          value: String(activeJobs.length),
          context: draftJobs.length > 0 ? `${draftJobs.length} drafts waiting` : "No drafts pending",
          icon: Briefcase,
        },
        {
          label: "Applicants Ingested (30d)",
          value: String(applicantsIn30Days),
          context: `${totalApplicants} total applicants tracked`,
          icon: Users,
        },
        {
          label: "Screenings Completed",
          value: String(shortlists.length),
          context:
            shortlistsIn30Days > 0
              ? `${shortlistsIn30Days} completed in the last 30 days`
              : "No completed runs in the last 30 days",
          icon: CircleCheck,
        },
        {
          label: "Avg. Screening Runtime",
          value: formatHours(averageScreeningRuntime),
          context:
            screeningRuntimeHours.length > 0
              ? `Based on ${screeningRuntimeHours.length} runs from screening start to shortlist output`
              : "Waiting for runs with saved screening timing",
          icon: Timer,
        },
      ];

      const runs: DashboardRun[] = shortlists.slice(0, 5).map((shortlist) => ({
        title: shortlist.jobTitle,
        when: formatRelativeTime(shortlist.createdAt),
        applicants: `${shortlist.totalApplicants} candidates`,
        topMatch: shortlist.topMatchScore || null,
        status: "Completed",
      }));

      const spotlight: SpotlightItem[] = jobs
        .map((job) => {
          const recentApplicants =
            applicantsByJob
              .get(job._id)
              ?.filter((applicant) => new Date(applicant.createdAt) >= thirtyDaysAgo).length ?? 0;

          return {
            title: job.title,
            recentApplicants,
            applicantsCount: job.applicantsCount,
          };
        })
        .filter((job) => job.recentApplicants > 0 || job.applicantsCount > 0)
        .sort((a, b) => b.recentApplicants - a.recentApplicants || b.applicantsCount - a.applicantsCount)
        .slice(0, 3)
        .map((job) => ({
          title: job.title,
          count:
            job.recentApplicants > 0
              ? `${job.recentApplicants} applicants added in the last 30 days`
              : `${job.applicantsCount} applicants currently attached`,
        }));

      const hiringEfficiency =
        screeningRuntimeHours.length > 0
          ? `Across ${screeningRuntimeHours.length} timed screening runs, the current average screening runtime is ${formatHours(
              averageScreeningRuntime
            )}. ${activeJobs.length} jobs are active and ${applicantsIn30Days} applicants were added in the last 30 days.`
          : "No timed screening runs are available yet. Newly saved shortlist results will automatically include screening runtime so this panel can summarize pipeline efficiency.";

      const bestRun = [...shortlists].sort((a, b) => b.topMatchScore - a.topMatchScore)[0];
      const nextSteps = bestRun
        ? `${bestRun.topCandidateName || "A top candidate"} from ${bestRun.jobTitle} currently leads with a ${bestRun.topMatchScore}% top-match score. Review the shortlist and move strong matches forward while the pipeline is fresh.`
        : "No shortlist recommendations are available yet. Run a screening on an active job to generate next-step guidance here.";

      setSnapshot({
        metrics,
        runs,
        spotlight,
        hiringEfficiency,
        nextSteps,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full px-6 py-5">
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
              return (
                <Card key={metric.label} className="p-6">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10" aria-hidden>
                      <Icon className="h-5 w-5 text-brand" />
                    </span>
                    <Badge tone="neutral" pill>
                      Live
                    </Badge>
                  </div>
                  <p className="mt-7 text-sm text-ink-muted">{metric.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-ink">{metric.value}</p>
                  <p className="mt-2 text-xs leading-5 text-ink-muted">{metric.context}</p>
                </Card>
              );
            })}
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
                        View All History
                      </Button>
                    </Link>
                  }
                />
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
                    {snapshot.runs.map((run, index) => (
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
                      Review Screening History
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
