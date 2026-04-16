"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Play, FileText, CheckCircle2, Briefcase, ArrowRight, ListChecks, Sparkles, Users, Clock3, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface Job {
  id: string;
  title: string;
  dept: string;
  location: string;
  applicants: number;
  requirements: string[];
  assets: { name: string; meta: string }[];
  rankingCriteria: { label: string; pct: number; description: string }[];
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
    rankingCriteria: [
      { label: "Core Hard Skills", pct: 35, description: "Matches the technical skills defined in the requisition." },
      { label: "Must-have Qualifications", pct: 30, description: "Checks the non-negotiable qualifications required for the role." },
      { label: "Experience & Seniority", pct: 20, description: "Validates years of experience and target seniority level." },
      { label: "Education Level", pct: 15, description: "Compares the profile against the education threshold for the job." },
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
    rankingCriteria: [
      { label: "Core Hard Skills", pct: 40, description: "Prioritizes backend and API skills required for the stack." },
      { label: "Must-have Qualifications", pct: 25, description: "Ensures the baseline role requirements are present." },
      { label: "Experience & Seniority", pct: 20, description: "Assesses relevant delivery depth and ownership level." },
      { label: "Preferred / Bonus Skills", pct: 15, description: "Rewards extra platform and deployment experience." },
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
    rankingCriteria: [
      { label: "Core Hard Skills", pct: 30, description: "Measures product design craft, tools, and systems fluency." },
      { label: "Must-have Qualifications", pct: 30, description: "Checks the core portfolio and UX requirements for the role." },
      { label: "Experience & Seniority", pct: 25, description: "Balances years of practice with the target level of ownership." },
      { label: "Preferred / Bonus Skills", pct: 15, description: "Highlights additional strengths that elevate shortlisted candidates." },
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
    rankingCriteria: [
      { label: "Core Hard Skills", pct: 35, description: "Emphasizes automation tooling and testing depth." },
      { label: "Must-have Qualifications", pct: 30, description: "Focuses on the mandatory QA lead capabilities for the role." },
      { label: "Experience & Seniority", pct: 25, description: "Looks for leadership-ready automation experience." },
      { label: "Education Level", pct: 10, description: "Applies the minimum education expectation from the job setup." },
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
    rankingCriteria: [
      { label: "Core Hard Skills", pct: 35, description: "Scores ML, modeling, and technical analysis capability." },
      { label: "Must-have Qualifications", pct: 25, description: "Checks the required data science foundation for the role." },
      { label: "Experience & Seniority", pct: 20, description: "Measures hands-on depth and expected level of ownership." },
      { label: "Education Level", pct: 20, description: "Accounts for the academic baseline often expected in data roles." },
    ],
  },
];

export default function ScreeningPage() {
  const router = useRouter();
  const [selectedJobId, setSelectedJobId] = useState(jobs[0].id);
  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0];
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const runName = `${selectedJob.title} Screening Run`;
  const estimatedMinSeconds = Math.max(30, Math.round(selectedJob.applicants * 0.4));
  const estimatedMaxSeconds = Math.max(45, Math.round(selectedJob.applicants * 0.5));

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
          <Button leftIcon={<Play className="h-4 w-4" />} onClick={() => setShowSuccessModal(true)}>Run Screening</Button>
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
                <Input value={runName} readOnly />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-ink">AI Ranking Distribution</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Built from the required content in the job setup, including must-have qualifications, hard skills,
              experience, seniority, and education expectations.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {selectedJob.rankingCriteria.map((criterion) => (
                <div key={criterion.label} className="rounded-md border border-line p-4">
                  <p className="text-sm text-ink-muted">{criterion.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-brand">{criterion.pct}%</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-surface-soft">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${criterion.pct}%` }} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-ink-muted">{criterion.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-md border border-line bg-surface-soft/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Scoring Source</p>
              <p className="mt-2 text-sm text-ink-muted">
                These weights reflect the required fields configured in the job requisition rather than a generic
                screening preset, so each role is ranked against what matters most for that opening.
              </p>
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

          <Card className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[460px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                    <Play className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h2 id="confirm-title" className="font-display text-lg font-semibold text-ink">Confirm Screening Run</h2>
                    <p id="confirm-desc" className="mt-1 text-sm text-ink-muted">
                      You are about to run a Gemini-powered screening on <strong>{selectedJob.applicants}</strong> candidates for <strong>{selectedJob.title}</strong>.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-line bg-brand-soft/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-info-deep">Run Summary</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-info-deep/70">Job</p>
                      <p className="mt-1 text-sm font-semibold text-info-deep">{selectedJob.title}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-info-deep/70">Applicants</p>
                      <p className="mt-1 text-sm font-semibold text-info-deep">{selectedJob.applicants} candidates</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-info-deep/70">Time</p>
                      <p className="mt-1 text-sm font-semibold text-info-deep">{estimatedMinSeconds}-{estimatedMaxSeconds} sec</p>
                    </div>
                  </div>
                </div>

                <label className="mt-5 flex items-start gap-3 rounded-lg border border-line bg-surface-soft/30 p-4 text-sm text-ink-muted">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand/40" />
                  <span>
                    I understand this run will consume <strong className="text-ink">1 Screening Credit</strong> and generate a persistent audit trail.
                  </span>
                </label>
              </div>

              <div className="w-full max-w-[260px] rounded-xl border border-line bg-surface-soft/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Before You Run</p>
                <ul className="mt-3 space-y-3 text-sm text-ink-muted">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>Target job and ranking criteria are locked in from the current requisition setup.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>Uploaded assets will be used as evidence sources during candidate evaluation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>Results will be available immediately in shortlist review once processing completes.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => router.push("/jobs")}>Back</Button>
              <Button leftIcon={<Play className="h-4 w-4" />} onClick={() => setShowSuccessModal(true)}>Confirm &amp; Trigger Analysis</Button>
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
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.id})
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-xl border border-line bg-surface-soft/30 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                  <Briefcase className="h-4 w-4 text-brand" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{selectedJob.id}</p>
                  <p className="text-sm font-semibold text-ink">{selectedJob.title}</p>
                  <p className="text-xs text-ink-muted">{selectedJob.dept} · {selectedJob.location}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-line bg-white p-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    <Users className="h-3.5 w-3.5" /> Applicants
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-ink">{selectedJob.applicants}</p>
                  <p className="text-xs text-ink-muted">Candidates ready for screening</p>
                </div>
                <div className="rounded-lg border border-line bg-white p-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    <FolderOpen className="h-3.5 w-3.5" /> Assets
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-ink">{selectedJob.assets.length}</p>
                  <p className="text-xs text-ink-muted">Files attached to this run</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-line bg-white p-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <Clock3 className="h-3.5 w-3.5" /> Estimated Processing Time
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{estimatedMinSeconds}-{estimatedMaxSeconds} seconds</p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">
                  Based on current applicant volume and the selected ranking criteria.
                </p>
              </div>
            </div>

            <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Core Requirements</h4>
            <ul className="mt-2 space-y-2 text-xs text-ink">
              {selectedJob.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2 rounded-lg border border-line bg-white p-3">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Screening Assets</h3>
                <p className="mt-1 text-xs text-ink-muted">Files the AI will use for this screening run.</p>
              </div>
              <Badge tone="info" pill>{selectedJob.applicants} Candidates</Badge>
            </div>
            <ul className="mt-4 space-y-3 text-xs">
              {selectedJob.assets.map((a) => (
                <li key={a.name} className="rounded-lg border border-line bg-surface-soft/30 p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                      <FileText className="h-4 w-4 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                      <p className="mt-1 text-xs text-ink-muted">{a.meta}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/ingest"><Button variant="secondary" size="sm" fullWidth className="mt-4">Manage Assets</Button></Link>
          </Card>
        </aside>
      </div>

      {/* Success Modal — guides user to Shortlists */}
      <Modal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} size="sm">
        <ModalBody className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Sparkles className="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Screening Complete!</h2>
            <p className="mt-2 text-sm text-ink-muted">
              AI screening has been completed for <strong className="text-ink">{selectedJob.applicants} candidates</strong> under <strong className="text-ink">{selectedJob.title}</strong>. Review your ranked shortlist now.
            </p>
          </div>

          <div className="w-full rounded-lg border border-line bg-surface-soft/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <ListChecks className="h-5 w-5 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">View Shortlist</p>
                <p className="text-xs text-ink-muted">Review AI-ranked candidates and advance top picks</p>
              </div>
            </div>
          </div>

          {/* Workflow stepper */}
          <div className="flex w-full items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Create Job</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Ingest</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Screen</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">Shortlist</span>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>Stay Here</Button>
          <Link href="/shortlists"><Button leftIcon={<ListChecks className="h-4 w-4" />}>View Shortlist</Button></Link>
        </ModalFooter>
      </Modal>
    </div>
  );
}
