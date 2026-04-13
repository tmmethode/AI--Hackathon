import {
  Download,
  Filter,
  ArrowDownUp,
  Check,
  X,
  Trophy,
  Briefcase,
  ShieldCheck,
  FileDown,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";

interface Candidate {
  rank: number;
  name: string;
  title: string;
  match: number;
  skills: string[];
  extras: number;
  summary: string;
}

const candidates: Candidate[] = [
  {
    rank: 1,
    name: "Sarah Jenkins",
    title: "Senior Full Stack Engineer",
    match: 98,
    skills: ["React", "Node.js", "AWS"],
    extras: 1,
    summary: "Exceptional architectural depth with proven experience leading distributed teams at scale.",
  },
  {
    rank: 2,
    name: "Michael Chen",
    title: "Technical Product Lead",
    match: 94,
    skills: ["Agile", "Python", "Product Roadmap"],
    extras: 1,
    summary: "Strong bridge between technical execution and business requirements; high culture fit score.",
  },
  {
    rank: 3,
    name: "Elena Rodriguez",
    title: "DevOps & Infrastructure Specialist",
    match: 91,
    skills: ["Kubernetes", "Terraform", "CI/CD"],
    extras: 1,
    summary: "Infrastructure veteran with a focus on security automation and high-availability systems.",
  },
  {
    rank: 4,
    name: "David Okafor",
    title: "Backend Architect",
    match: 88,
    skills: ["Java", "Spring Boot", "Kafka"],
    extras: 1,
    summary: "High performance in technical assessment tests; specialized in message-driven architectures.",
  },
  {
    rank: 5,
    name: "Aisha Gupta",
    title: "Frontend Developer",
    match: 85,
    skills: ["TypeScript", "Tailwind", "Next.js"],
    extras: 1,
    summary: "Design-centric engineer with exceptional attention to detail in UI/UX implementation.",
  },
];

const matching = [
  { label: "System Design", value: 95 },
  { label: "React / Next.js", value: 98 },
  { label: "AWS Infrastructure", value: 82 },
  { label: "Team Leadership", value: 75 },
];

export default function ShortlistsPage() {
  return (
    <div className="mx-auto w-full max-w-[1184px] px-4 py-8 md:px-8">
      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <Briefcase className="h-3.5 w-3.5" /> Current Job Context <Badge tone="success" pill>Active</Badge>
            </p>
            <h1 className="mt-1 font-display text-xl font-bold text-ink">Senior Full Stack Developer (SF-204)</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-muted">
              <span>Screened: <strong className="text-ink">124 Applicants</strong></span>
              <span>Shortlisted: <strong className="text-ink">20 Targets</strong></span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<Briefcase className="h-4 w-4" />}>Job Details</Button>
            <Button leftIcon={<Download className="h-4 w-4" />}>Export Shortlist</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              Ranked Candidates <Badge tone="neutral">5 Total</Badge>
            </h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}>Filter</Button>
              <Button variant="secondary" size="sm" leftIcon={<ArrowDownUp className="h-3.5 w-3.5" />}>Sort</Button>
            </div>
          </div>

          <ul className="divide-y divide-line">
            {candidates.map((c) => (
              <li key={c.rank} className="p-5 hover:bg-surface-soft/40">
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold ${
                        c.rank === 1 ? "bg-success/10 text-success" : "bg-surface-soft text-ink-subtle"
                      }`}
                      aria-label={`Rank ${c.rank}`}
                    >
                      {c.rank}
                    </div>
                    <Avatar name={c.name} size={44} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{c.name}</h3>
                      {c.rank === 1 && <Badge tone="success" pill><Trophy className="h-3 w-3" /> Top</Badge>}
                      <span className="ml-auto text-sm font-bold text-success">{c.match}% Match</span>
                    </div>
                    <p className="text-xs text-ink-muted">{c.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.skills.map((s) => (
                        <Badge key={s} tone="neutral">{s}</Badge>
                      ))}
                      <Badge tone="neutral">+{c.extras}</Badge>
                    </div>
                    <blockquote className="mt-3 rounded-md bg-surface-soft/50 px-3 py-2 text-xs italic text-ink-muted">
                      &ldquo;{c.summary}&rdquo;
                    </blockquote>
                  </div>
                  <div className="flex gap-2 md:flex-col">
                    <Button variant="secondary" size="sm" leftIcon={<X className="h-3.5 w-3.5" />}>Reject</Button>
                    <Button size="sm" leftIcon={<Check className="h-3.5 w-3.5" />}>Interview</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-5 py-4 text-center">
            <p className="text-xs text-ink-muted">Showing 5 of 20 results</p>
            <Button variant="ghost" size="sm" className="mt-2">Load More Candidates</Button>
          </div>
        </Card>

        <aside className="flex flex-col gap-5">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Deep Dive Detail</p>
                <h3 className="mt-1 font-display text-xl font-bold text-ink">Sarah Jenkins</h3>
                <p className="text-xs text-ink-muted">Rank #1 Candidate · Senior Full Stack Engineer · 8 years</p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold text-success">98%</p>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">AI Match Score</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" fullWidth className="mt-4" leftIcon={<FileDown className="h-4 w-4" />}>
              Download Resume
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand" />
              <h4 className="text-sm font-semibold text-ink">AI Executive Summary</h4>
              <Badge tone="success" pill className="ml-auto">Verified Insight</Badge>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink">
              Exceptional architectural depth with proven experience leading distributed teams at scale. Based on our
              deep parsing of project histories, this candidate demonstrates a level of technical leadership rarely seen
              at this tenure. They effectively managed a migration from monolithic to microservices architecture for a
              platform serving 2M+ users, directly aligning with your team&apos;s upcoming Q3 roadmap.
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-md bg-surface-soft/60 p-2">
                <dt className="text-ink-muted">Key Strength</dt>
                <dd className="mt-0.5 font-semibold text-ink">Scalable Architecture</dd>
              </div>
              <div className="rounded-md bg-surface-soft/60 p-2">
                <dt className="text-ink-muted">Culture Fit</dt>
                <dd className="mt-0.5 font-semibold text-ink">High</dd>
              </div>
              <div className="rounded-md bg-surface-soft/60 p-2">
                <dt className="text-ink-muted">Retention Risk</dt>
                <dd className="mt-0.5 font-semibold text-ink">Low</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-semibold text-ink">Requirement Matching</h4>
            <ul className="mt-3 space-y-3">
              {matching.map((m) => (
                <li key={m.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-ink">{m.label}</span>
                    <span className="font-semibold text-ink">{m.value}%</span>
                  </div>
                  <Progress value={m.value} />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-semibold text-ink">Recruiter Notes</h4>
            <p className="mt-2 text-xs italic text-ink-muted">
              No internal notes added yet. Collaborate with your team by adding observations about this candidate.
            </p>
            <Button variant="ghost" size="sm" className="mt-3" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Add Internal Note
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
