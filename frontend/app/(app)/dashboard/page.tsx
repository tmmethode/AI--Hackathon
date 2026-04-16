import Link from "next/link";
import {
  Briefcase,
  Users,
  CircleCheck,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Zap,
  RefreshCw,
  Plus,
  ExternalLink,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";

interface Stat {
  label: string;
  value: string;
  change: string;
  changeTone: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
}

const stats: Stat[] = [
  { label: "Active Jobs", value: "12", change: "+2", changeTone: "positive", icon: Briefcase },
  { label: "Applicants Ingested (30d)", value: "450", change: "+12%", changeTone: "positive", icon: Users },
  { label: "Screenings Completed", value: "85", change: "-4%", changeTone: "negative", icon: CircleCheck },
  { label: "Avg. Time-to-Shortlist", value: "4.2h", change: "15m", changeTone: "positive", icon: Timer },
];

type Status = "Completed" | "Processing";
interface Run {
  title: string;
  when: string;
  applicants: string;
  match: number | null;
  status: Status;
}

const runs: Run[] = [
  { title: "Senior Product Designer", when: "2h ago", applicants: "42 candidates", match: 88, status: "Completed" },
  { title: "Full Stack Engineer (L5)", when: "5h ago", applicants: "124 candidates", match: 74, status: "Completed" },
  { title: "Marketing Lead", when: "Just now", applicants: "18 candidates", match: null, status: "Processing" },
  { title: "Senior DevOps Engineer", when: "Yesterday", applicants: "35 candidates", match: 91, status: "Completed" },
  { title: "Junior Frontend Dev", when: "2 days ago", applicants: "210 candidates", match: 62, status: "Completed" },
];

const spotlight = [
  { title: "Senior Full Stack Engineer", count: "14 new applicants detected" },
  { title: "UX Researcher - Mobile", count: "8 new applicants detected" },
  { title: "Product Manager", count: "3 new applicants detected" },
];

export default function DashboardPage() {
  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Recruiter Dashboard"
        description="Welcome back. Here's what's happening with your hiring pipeline."
        actions={
          <>
            <Link href="/jobs"><Button variant="secondary" leftIcon={<Briefcase className="h-4 w-4" />}>Manage Jobs</Button></Link>
            <Link href="/jobs/new"><Button leftIcon={<Plus className="h-4 w-4" />}>Create New Job</Button></Link>
          </>
        }
      />

      <section aria-label="Key metrics" className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const isNeg = s.changeTone === "negative";
          const ChangeIcon = isNeg ? ArrowDownRight : ArrowUpRight;
          return (
            <Card key={s.label} className="p-6">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10" aria-hidden>
                  <Icon className="h-5 w-5 text-brand" />
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    isNeg ? "bg-danger/10 text-danger" : "text-ink"
                  }`}
                >
                  <ChangeIcon className="h-3 w-3" aria-hidden />
                  {s.change}
                </span>
              </div>
              <p className="mt-7 text-sm text-ink-muted">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{s.value}</p>
            </Card>
          );
        })}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_314px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Recent Screening Runs"
              description="View the status and results of your latest AI evaluations."
              action={<Link href="/history"><Button variant="ghost" size="sm">View All History</Button></Link>}
            />
            <div role="table" className="divide-y divide-line">
              <div role="row" className="hidden grid-cols-[1.6fr_1fr_1.3fr_1fr_100px] gap-4 bg-surface-soft/30 px-4 py-3 text-xs text-ink-muted md:grid">
                <span role="columnheader">Job Title</span>
                <span role="columnheader">Applicants</span>
                <span role="columnheader">Match Avg.</span>
                <span role="columnheader">Status</span>
                <span role="columnheader" className="text-right">Action</span>
              </div>
              {runs.map((r, i) => (
                <div
                  key={r.title}
                  role="row"
                  className={`grid grid-cols-2 gap-3 px-4 py-4 text-sm md:grid-cols-[1.6fr_1fr_1.3fr_1fr_100px] md:gap-4 md:items-center ${
                    i % 2 === 1 ? "bg-surface-soft/30" : "bg-white"
                  }`}
                >
                  <div>
                    <p className="text-ink">{r.title}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">{r.when}</p>
                  </div>
                  <p className="text-ink">{r.applicants}</p>
                  <div className="flex items-center gap-3">
                    {r.match === null ? (
                      <span className="text-ink-muted">--</span>
                    ) : (
                      <>
                        <span
                          className={`font-semibold ${
                            r.match >= 85 ? "text-success" : "text-brand"
                          }`}
                        >
                          {r.match}%
                        </span>
                        <Progress value={r.match} className="w-16" />
                      </>
                    )}
                  </div>
                  <div>
                    <Badge tone={r.status === "Processing" ? "neutral" : "neutral"}>{r.status}</Badge>
                  </div>
                  <div className="md:text-right">
                    <Link href="/shortlists"><Button variant="ghost" size="sm">Review</Button></Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card className="bg-brand-soft/30 p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-info-deep" />
                <h3 className="text-sm font-semibold tracking-tight text-ink">Hiring Efficiency</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-info-deep/80">
                Your average screening time has decreased by <strong className="font-bold">12%</strong> this week. AI
                accuracy remains high at 94% based on hiring manager feedback.
              </p>
            </Card>
            <Card className="bg-success-soft/30 p-5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-success-deep" />
                <h3 className="text-sm font-semibold tracking-tight text-success-deep">Next Steps</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-success-deep/80">
                3 candidates from the <strong className="font-bold">Senior Product Designer</strong> run match over 95%.
                Consider moving them to interview immediately.
              </p>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="bg-brand-soft p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-info-deep" aria-hidden />
              <h3 className="font-display text-base font-bold text-info-deep">Spotlight Recommendations</h3>
            </div>
            <p className="mt-2 text-sm text-info-deep/70">AI identified new data that requires your attention.</p>
            <ul className="mt-4 flex flex-col gap-3">
              {spotlight.map((item) => (
                <li key={item.title} className="rounded-md border border-line bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <Badge tone="success" pill>AI Pick</Badge>
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
          </Card>

          <Card className="p-4">
            <h3 className="px-2 pb-3 pt-2 text-sm font-bold uppercase tracking-widest text-ink-muted">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Link href="/ingest"><Button variant="dashed" fullWidth leftIcon={<UserPlus className="h-4 w-4" />} className="justify-start h-11">Ingest New Applicants</Button></Link>
              <Link href="/jobs/new"><Button variant="dashed" fullWidth leftIcon={<Plus className="h-4 w-4" />} className="justify-start h-11">Create a New Job Role</Button></Link>
              <Link href="/jobs"><Button variant="dashed" fullWidth leftIcon={<ExternalLink className="h-4 w-4" />} className="justify-start h-11">Browse All Open Jobs</Button></Link>
            </div>
          </Card>

          <Card className="border border-dashed border-line bg-surface-soft/40 p-4 shadow-none">
            <p className="text-center text-[11px] italic leading-5 text-ink-muted">
              &ldquo;Pro Tip: You can automate candidate ingestion by connecting your ATS in the settings panel.&rdquo;
            </p>
            <div className="mt-2 text-center">
              <Link href="/history"><Button variant="ghost" size="sm">Configure Integration</Button></Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
