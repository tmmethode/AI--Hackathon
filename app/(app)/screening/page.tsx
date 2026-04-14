"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Play, ShieldCheck, FileText, CheckCircle2, Briefcase, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface Job {
  id: string;
  title: string;
  dept: string;
  location: string;
  applicants: number;
  requirements: string[];
  assets: { name: string; meta: string }[];
}

const jobs: Job[] = [
  {
    id: "JOB-001",
    title: "Senior Frontend Engineer",
    dept: "Product Engineering",
    location: "Remote (GMT+2)",
    applicants: 142,
    requirements: ["5+ Years React/TypeScript", "Proficiency in Next.js & Tailwind", "Component architecture expertise"],
    assets: [
      { name: "Applicants_Ingested.csv", meta: "1.2 MB · 142 records" },
      { name: "Job_Benchmark.json", meta: "4 KB · Custom Weights" },
    ],
  },
  {
    id: "JOB-002",
    title: "Fullstack Developer (Node.js)",
    dept: "Core Services",
    location: "Kigali, Rwanda",
    applicants: 89,
    requirements: ["3+ Years Node.js & Express", "PostgreSQL & REST API design", "Docker & CI/CD experience"],
    assets: [
      { name: "Fullstack_Batch.csv", meta: "780 KB · 89 records" },
      { name: "Job_Benchmark.json", meta: "3 KB · Default Weights" },
    ],
  },
  {
    id: "JOB-003",
    title: "Product Designer",
    dept: "UX/UI Team",
    location: "Remote (US)",
    applicants: 56,
    requirements: ["5+ Years UX/UI experience", "Proficiency in Figma & Design Systems", "Case studies on SaaS products"],
    assets: [
      { name: "Designer_Applicants.csv", meta: "420 KB · 56 records" },
      { name: "Design_Benchmark.json", meta: "3 KB · Custom Weights" },
    ],
  },
  {
    id: "JOB-004",
    title: "QA Automation Lead",
    dept: "Quality Assurance",
    location: "Hybrid (Nairobi)",
    applicants: 210,
    requirements: ["5+ Years QA automation", "Selenium/Cypress proficiency", "CI/CD pipeline integration"],
    assets: [
      { name: "QA_Candidates.csv", meta: "1.8 MB · 210 records" },
      { name: "QA_Benchmark.json", meta: "5 KB · Custom Weights" },
    ],
  },
  {
    id: "JOB-006",
    title: "Data Scientist",
    dept: "Analytics",
    location: "Remote (EU)",
    applicants: 78,
    requirements: ["3+ Years ML/Data Science", "Python, TensorFlow or PyTorch", "SQL & data pipeline experience"],
    assets: [
      { name: "DS_Applicants.csv", meta: "650 KB · 78 records" },
      { name: "DS_Benchmark.json", meta: "4 KB · Default Weights" },
    ],
  },
];

export default function ScreeningPage() {
  const router = useRouter();
  const [selectedJobId, setSelectedJobId] = useState(jobs[0].id);
  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0];

  return (
    <div className="w-full px-6 py-5">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Screening Confirmation</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Configure and trigger the AI screening process for your candidate pool.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<X className="h-4 w-4" />} onClick={() => router.push("/jobs")}>Cancel</Button>
          <Link href="/screening/progress"><Button leftIcon={<Play className="h-4 w-4" />}>Run Screening</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <header className="mb-5">
              <h2 className="font-display text-lg font-semibold text-ink">Run Parameters</h2>
              <p className="text-sm text-ink-muted">Define how the AI should evaluate and rank the candidate pool.</p>
            </header>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Run Name" className="md:col-span-2">
                <Input defaultValue="Senior Product Designer - Rwanda Batch" />
              </Field>
              <Field label="Weighting Preset">
                <Select defaultValue="tech">
                  <option value="tech">Technical Depth Focus</option>
                  <option value="culture">Culture-first</option>
                  <option value="balanced">Balanced</option>
                </Select>
              </Field>
              <Field label="Explanation Depth">
                <Select defaultValue="detailed">
                  <option value="brief">Brief</option>
                  <option value="standard">Standard</option>
                  <option value="detailed">Detailed (Evidence mapping)</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-ink">AI Ranking Distribution</h3>
            <p className="mt-1 text-sm text-ink-muted">Ranked candidates</p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { label: "Skills", pct: 60 },
                { label: "Experience", pct: 30 },
                { label: "Culture", pct: 10 },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-line p-4">
                  <p className="text-sm text-ink-muted">{s.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-brand">{s.pct}%</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-surface-soft">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Field label="Shortlist Size">
                <div className="flex items-center gap-3">
                  <Input type="number" defaultValue={10} className="max-w-[120px]" />
                  <span className="text-sm text-ink-muted">Candidates</span>
                </div>
              </Field>
              <div className="mt-3 flex gap-2 text-xs">
                <Badge tone="neutral">Min (5)</Badge>
                <Badge tone="brand">Standard (20)</Badge>
                <Badge tone="neutral">Max (50)</Badge>
              </div>
            </div>
          </Card>

          <Card className="border border-success/30 bg-success/5 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success-deep" />
              <h3 className="text-sm font-semibold text-success-deep">Safety &amp; Audit Readiness</h3>
            </div>
            <p className="mt-2 text-xs leading-5 text-success-deep/80">
              This screening run uses decentralized models with no PII storage. All rankings are fully explainable and
              compliant with global hiring standards.
            </p>
          </Card>
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <Briefcase className="h-3.5 w-3.5" /> Target Job
            </div>

            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.id})
                </option>
              ))}
            </select>

            <div className="mt-3 flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10">
                <Briefcase className="h-4 w-4 text-brand" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{selectedJob.title}</p>
                <p className="text-xs text-ink-muted">{selectedJob.dept} · {selectedJob.location}</p>
              </div>
            </div>

            <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Core Requirements</h4>
            <ul className="mt-2 space-y-2 text-xs text-ink">
              {selectedJob.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  {r}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Applicants Ingested</h3>
              <Badge tone="info" pill>{selectedJob.applicants} Candidates</Badge>
            </div>
            <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Screening Assets</h4>
            <ul className="mt-2 space-y-2 text-xs">
              {selectedJob.assets.map((a) => (
                <li key={a.name} className="flex items-center justify-between rounded-md border border-line p-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-brand" />
                    <div>
                      <p className="font-medium text-ink">{a.name}</p>
                      <p className="text-ink-muted">{a.meta}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/ingest"><Button variant="secondary" size="sm" fullWidth className="mt-3">Manage Assets</Button></Link>
          </Card>
        </aside>
      </div>

      <section
        role="dialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="mt-10"
      >
        <Card className="mx-auto max-w-[560px] p-6">
          <h2 id="confirm-title" className="font-display text-lg font-semibold text-ink">Confirm Screening Run</h2>
          <p id="confirm-desc" className="mt-1 text-sm text-ink-muted">
            You are about to run a Gemini-powered screening on <strong>{selectedJob.applicants}</strong> candidates for <strong>{selectedJob.title}</strong>.
          </p>
          <div className="mt-5 rounded-md bg-brand-soft/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-info-deep">Estimated Processing Time</p>
            <p className="mt-1 text-sm text-info-deep/80">
              Approximately {Math.max(30, Math.round(selectedJob.applicants * 0.4))}-{Math.max(45, Math.round(selectedJob.applicants * 0.5))} seconds based on current volume and depth settings.
            </p>
          </div>
          <label className="mt-4 flex items-start gap-2 text-xs text-ink-muted">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand/40" />
            <span>I understand this run will consume 1 Screening Credit and generate a persistent audit trail.</span>
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => router.push("/jobs")}>Back</Button>
            <Link href="/screening/progress"><Button leftIcon={<Play className="h-4 w-4" />}>Confirm &amp; Trigger Analysis</Button></Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
