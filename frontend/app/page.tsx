import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  KeyRound,
  LineChart,
  Link as LinkIcon,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Umurava Screening — AI-powered recruiting & candidate screening",
  description:
    "Umurava Screening helps recruiters import jobs from any link or document, ingest applicants in bulk, and let Gemini AI rank, shortlist, and explain every candidate decision.",
};

const features = [
  {
    icon: LinkIcon,
    title: "Import jobs from anywhere",
    description:
      "Paste a job link or upload a PDF/DOC and the AI extracts the title, description, responsibilities, must-have / nice-to-have qualifications, hard & soft skills, seniority and education in seconds.",
  },
  {
    icon: Upload,
    title: "Ingest applicants in bulk",
    description:
      "Bring applicants in from the Umurava Platform JSON feed or upload your own files. Profiles are normalised into a structured talent schema ready for screening.",
  },
  {
    icon: BrainCircuit,
    title: "AI screening with Gemini",
    description:
      "Run an AI batch against all applicants for a job. Each candidate gets a match score, criterion-level scores, evidence, strengths, gaps and a final recommendation.",
  },
  {
    icon: Target,
    title: "Configurable scoring weights",
    description:
      "Decide how much each criterion matters: must-have qualifications, nice-to-haves, hard & soft skills, experience & seniority, and education — weights always sum to 100%.",
  },
  {
    icon: ClipboardCheck,
    title: "Shortlists & pipeline status",
    description:
      "Review the AI shortlist, move candidates through stages, and keep the pipeline visible across the dashboard, history and exports without re-running AI.",
  },
  {
    icon: Sparkles,
    title: "Page-aware AI assistant",
    description:
      "Ask the assistant about any job, applicant or shortlist — it has context for what you're looking at and answers using your real data, not generic knowledge.",
  },
  {
    icon: BarChart3,
    title: "Dashboards & exports",
    description:
      "Live dashboard for jobs, applicants and screening runs. Export shortlists to CSV / PDF for sharing with hiring managers.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Recruiter, admin and applicant roles with JWT-secured sessions, idle and absolute session expiry, and protected routes.",
  },
];

const benefits = [
  {
    icon: LineChart,
    title: "Faster time-to-shortlist",
    description:
      "Cut hours of manual CV reading per role — the AI screens hundreds of applicants in one batch and ranks them with evidence.",
  },
  {
    icon: Filter,
    title: "Consistent, evidence-based decisions",
    description:
      "Every score cites evidence from the candidate's skills, experience and education — no more gut-call shortlists.",
  },
  {
    icon: Users,
    title: "Recruiter-friendly, not a black box",
    description:
      "Strengths, gaps and a plain-English summary for every candidate, plus an assistant that can explain any ranking on demand.",
  },
];

const workflow = [
  {
    step: "1",
    icon: ClipboardCheck,
    title: "Create or import a job",
    description:
      "Paste a job link, upload a JD document, or fill the form yourself. Set the scoring weights that matter for this role.",
  },
  {
    step: "2",
    icon: Upload,
    title: "Ingest applicants",
    description:
      "Pull applicants from the Umurava Platform feed or upload them. Profiles are parsed into structured skills, experience and education.",
  },
  {
    step: "3",
    icon: BrainCircuit,
    title: "Run AI screening",
    description:
      "Trigger a batch screening. Gemini scores every applicant against your weighted criteria and returns ranked results with evidence.",
  },
  {
    step: "4",
    icon: ClipboardCheck,
    title: "Review the shortlist",
    description:
      "Drill into any candidate, view their CV, read AI strengths/gaps, and ask the assistant follow-up questions.",
  },
  {
    step: "5",
    icon: Workflow,
    title: "Move through the pipeline",
    description:
      "Update pipeline status, persist changes across sessions, and keep dashboards, history and exports in sync.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface-muted text-ink">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Umurava Screening home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand" aria-hidden>
              <Activity className="h-5 w-5 text-white" />
            </span>
            <span className="text-[18px] font-bold text-brand">Umurava Screening</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-ink-subtle md:flex" aria-label="Primary">
            <a href="#overview" className="transition-colors hover:text-brand">Overview</a>
            <a href="#features" className="transition-colors hover:text-brand">Features</a>
            <a href="#workflow" className="transition-colors hover:text-brand">How it works</a>
            <a href="#demo" className="transition-colors hover:text-brand">Demo access</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="md">Sign in</Button>
            </Link>
            <Link href="/login" aria-label="Go to login page">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-line/70"
        style={{
          background:
            "radial-gradient(circle at top left, var(--color-brand-softer) 0%, var(--color-brand-soft) 36%, var(--color-surface-muted) 100%)",
        }}
      >
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-surface/70 px-3 py-1 text-xs font-medium text-info-deep backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered recruiting workspace
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Hire faster with{" "}
              <span className="text-brand">AI screening</span>{" "}
              you can actually trust.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-ink-subtle sm:text-lg">
              Umurava Screening lets recruiters import any job, ingest applicants in bulk, and let Gemini AI rank, shortlist, and
              explain every candidate decision — with evidence from their real skills, experience and education.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Sign in to the workspace
                </Button>
              </Link>
              <a href="#demo">
                <Button variant="secondary" size="lg" leftIcon={<KeyRound className="h-4 w-4" />}>
                  Use demo credentials
                </Button>
              </a>
            </div>

            <ul className="mt-8 grid gap-3 text-sm text-ink-subtle sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> Parse jobs from a link or PDF
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> Score applicants on weighted criteria
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> Page-aware AI assistant
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> Export shortlists for hiring managers
              </li>
            </ul>
          </div>

          {/* Hero preview card */}
          <div className="relative">
            <Card className="relative z-10 overflow-hidden bg-surface/95 p-0 shadow-soft backdrop-blur">
              <div className="flex items-center justify-between border-b border-line/80 bg-surface-soft px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/10">
                    <BrainCircuit className="h-4 w-4 text-brand" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">AI Screening Run</p>
                    <p className="text-[11px] text-ink-muted">Senior Frontend Engineer · 124 applicants</p>
                  </div>
                </div>
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-deep">
                  Completed
                </span>
              </div>

              <div className="space-y-3 p-5">
                {[
                  { name: "Aline U.", score: 92, badge: "Strong Shortlist", tone: "success" },
                  { name: "Eric M.", score: 84, badge: "Shortlist", tone: "brand" },
                  { name: "Patrick K.", score: 71, badge: "Shortlist", tone: "brand" },
                  { name: "Diane I.", score: 58, badge: "Consider", tone: "muted" },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-md border border-line/70 bg-surface px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-info-deep">
                        {c.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-ink">{c.name}</p>
                        <p className="text-[11px] text-ink-muted">Match score {c.score}/100</p>
                      </div>
                    </div>
                    <span
                      className={
                        c.tone === "success"
                          ? "rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success-deep"
                          : c.tone === "brand"
                            ? "rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-info-deep"
                            : "rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-semibold text-ink-subtle"
                      }
                    >
                      {c.badge}
                    </span>
                  </div>
                ))}

                <div className="rounded-md border border-dashed border-line bg-surface-soft px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-ink">AI assistant</p>
                  <p className="mt-1 text-xs leading-5 text-ink-subtle">
                    &ldquo;Aline scores highest on must-have qualifications and hard skills, with 6 years of React and a CS degree.&rdquo;
                  </p>
                </div>
              </div>
            </Card>
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/15 blur-3xl"
              aria-hidden
            />
          </div>
        </div>
      </section>

      {/* Overview */}
      <section id="overview" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">System overview</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            One workspace for jobs, applicants, and AI-driven hiring decisions.
          </h2>
          <p className="mt-4 text-base text-ink-subtle">
            Umurava Screening connects job intake, applicant ingestion, AI screening, shortlisting, and analytics in a single
            recruiter-friendly app — built for teams that want speed without losing transparency.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ClipboardCheck,
              title: "Structured jobs",
              copy:
                "Every job is captured with description, responsibilities, qualifications, skills, weights and seniority — ready for screening.",
            },
            {
              icon: Users,
              title: "Unified applicants",
              copy:
                "Applicants from the Umurava Platform JSON feed and your uploads land in one normalised talent schema.",
            },
            {
              icon: BrainCircuit,
              title: "Explainable AI",
              copy:
                "Gemini scores, ranks and explains — every recommendation comes with evidence, strengths and gaps.",
            },
          ].map(({ icon: Icon, title, copy }) => (
            <Card key={title} className="p-6 transition-shadow duration-200 hover:shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                <Icon className="h-5 w-5 text-brand" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-subtle">{copy}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-line/70 bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Key features</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Everything a recruiter needs, end-to-end.
            </h2>
            <p className="mt-4 text-base text-ink-subtle">
              From job intake to a final shortlist export — each step is automated or assisted, and nothing is hidden behind a
              black box.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="flex h-full flex-col p-5 transition-shadow duration-200 hover:shadow-soft">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
                  <Icon className="h-4 w-4 text-brand" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-ink-subtle">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Why teams use it</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Less manual screening. More confident hiring.
            </h2>
            <p className="mt-4 text-base text-ink-subtle">
              Umurava Screening is built for recruiters who need to move quickly without sacrificing fairness or transparency.
              Every score, ranking and shortlist comes with evidence you can defend to your hiring manager.
            </p>
          </div>

          <div className="grid gap-4">
            {benefits.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="flex items-start gap-4 p-5 transition-shadow duration-200 hover:shadow-soft">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                  <Icon className="h-5 w-5 text-brand" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink-subtle">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y border-line/70 bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">How to use it</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              From a job link to a shortlist in five steps.
            </h2>
            <p className="mt-4 text-base text-ink-subtle">
              Sign in, then follow the recruiter workflow that the app guides you through.
            </p>
          </div>

          <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {workflow.map(({ step, icon: Icon, title, description }) => (
              <li key={step}>
                <Card className="relative flex h-full flex-col p-5 transition-shadow duration-200 hover:shadow-soft">
                  <span className="absolute -top-3 left-5 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white shadow-card">
                    {step}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
                    <Icon className="h-4 w-4 text-brand" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-ink-subtle">{description}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Demo credentials */}
      <section id="demo" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Card className="overflow-hidden p-0 shadow-soft">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-brand-soft p-8 lg:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1 text-xs font-medium text-info-deep">
                <KeyRound className="h-3.5 w-3.5" /> Demo access
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">
                Try the recruiter workspace right now.
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-subtle">
                Sign in with the demo account below to explore jobs, applicants, AI screening and the assistant — no setup
                required.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-md border border-line/70 bg-surface px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-brand" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Email</p>
                      <p className="font-mono text-sm text-ink">demo@example.com</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-line/70 bg-surface px-4 py-3">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-4 w-4 text-brand" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Password</p>
                      <p className="font-mono text-sm text-ink">demo123</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Continue to login
                  </Button>
                </Link>
                <a href="#workflow">
                  <Button variant="secondary" size="lg">See the workflow</Button>
                </a>
              </div>
            </div>

            <div className="space-y-4 bg-surface p-8 lg:p-10">
              <h3 className="font-display text-lg font-semibold text-ink">What to try first</h3>
              <ul className="space-y-3 text-sm leading-6 text-ink-subtle">
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>
                    <strong className="font-semibold text-ink">Create a job</strong> — paste a job link in the &ldquo;New Job&rdquo;
                    page and watch the AI fill in description, responsibilities, qualifications and skills automatically.
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>
                    <strong className="font-semibold text-ink">Ingest applicants</strong> — open the Umurava Platform tab on
                    the Ingest page to bring in candidates and watch them parse into structured profiles.
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>
                    <strong className="font-semibold text-ink">Run AI screening</strong> — pick a job, run a batch, and review
                    the ranked shortlist with strengths, gaps and evidence.
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>
                    <strong className="font-semibold text-ink">Ask the assistant</strong> — open the assistant on any page and
                    ask &ldquo;Why is this candidate ranked first?&rdquo; for an instant evidence-backed answer.
                  </span>
                </li>
              </ul>

              <p className="mt-6 rounded-md border border-line/70 bg-surface-muted px-4 py-3 text-xs text-ink-subtle">
                Demo data resets periodically. Treat the credentials above as shared — please don&apos;t store sensitive content.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line/70 bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Ready to screen smarter?
          </h2>
          <p className="max-w-2xl text-base text-ink-subtle">
            Sign in to Umurava Screening and turn a job link into a ranked shortlist in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Sign in
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg">Explore features</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line/70 bg-surface-muted">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand" aria-hidden>
              <Activity className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold text-brand">Umurava Screening</span>
          </div>
          <p className="text-xs text-ink-muted">© 2026 Umurava Screening. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-ink-muted">
            <Link href="/login" className="transition-colors hover:text-brand">Sign in</Link>
            <Link href="/privacy" className="transition-colors hover:text-brand">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-brand">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
