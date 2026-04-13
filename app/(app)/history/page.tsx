import { Download, Play, Save, Undo2, Copy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Textarea } from "@/components/ui/Input";

interface Run {
  id: string;
  name: string;
  job: string;
  completed: string;
  candidates: number;
  match: number;
  status: "Success" | "Partial";
}

const runs: Run[] = [
  { id: "RUN-9821", name: "Quarterly Frontend Ingest", job: "Senior React Engineer", completed: "2023-10-24 14:22", candidates: 45, match: 82, status: "Success" },
  { id: "RUN-9815", name: "Growth Batch A", job: "Product Designer", completed: "2023-10-23 09:15", candidates: 12, match: 68, status: "Success" },
  { id: "RUN-9799", name: "Urgent Replacement", job: "Full Stack Developer", completed: "2023-10-22 18:45", candidates: 8, match: 91, status: "Partial" },
  { id: "RUN-9782", name: "Marketing Q4 Interns", job: "Content Strategist", completed: "2023-10-20 11:30", candidates: 112, match: 45, status: "Success" },
  { id: "RUN-9760", name: "Core Banking Ops", job: "DevOps Architect", completed: "2023-10-18 16:00", candidates: 24, match: 77, status: "Success" },
];

const tabs = ["Prompt Templates", "Weighting & Thresholds", "API & Infrastructure"];

const tokens = [
  "{{candidate_resume}}",
  "{{job_description}}",
  "{{hiring_manager_notes}}",
  "{{ideal_profile}}",
  "{{score_threshold}}",
];

const prompt = `You are a world-class technical recruiter. Analyze the provided [CANDIDATE_RESUME] against the [JOB_DESCRIPTION].

Your goal is to rank the candidate on a scale of 0-100 based on the following dimensions:
1. Technical Skill Alignment (40%)
2. Practical Experience (30%)
3. Cultural & Value Fit (20%)
4. Educational Foundation (10%)

Output your reasoning in JSON format with keys: "score", "strengths", "gaps", and "recommendation".`;

export default function HistoryPage() {
  return (
    <div className="mx-auto w-full max-w-[1184px] px-4 py-8 md:px-8">
      <PageHeader
        title="History & Settings"
        description="Monitor past screenings and manage AI logic configurations."
        actions={
          <>
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>Export Logs</Button>
            <Button leftIcon={<Play className="h-4 w-4" />}>Trigger New Run</Button>
          </>
        }
      />

      <Card className="mt-8">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Recent Screening History</h2>
            <p className="text-sm text-ink-muted">Showing latest 5 of 1,244 runs</p>
          </div>
        </div>
        <div role="table">
          <div role="row" className="hidden grid-cols-[0.9fr_2fr_1.1fr_0.7fr_0.8fr_0.8fr] gap-4 bg-surface-soft/40 px-6 py-3 text-xs uppercase tracking-wider text-ink-muted md:grid">
            <span role="columnheader">Run ID</span>
            <span role="columnheader">Run Name / Job</span>
            <span role="columnheader">Completed</span>
            <span role="columnheader">Candidates</span>
            <span role="columnheader">Avg Match</span>
            <span role="columnheader">Status</span>
          </div>
          <ul className="divide-y divide-line">
            {runs.map((r, i) => (
              <li
                key={r.id}
                className={`grid grid-cols-2 gap-3 px-6 py-4 text-sm md:grid-cols-[0.9fr_2fr_1.1fr_0.7fr_0.8fr_0.8fr] md:items-center md:gap-4 ${
                  i === 0 ? "bg-brand-soft/30" : ""
                }`}
              >
                <span className="font-mono text-xs text-ink">{r.id}</span>
                <div>
                  <p className="font-medium text-ink">{r.name}</p>
                  <p className="text-xs text-ink-muted">{r.job}</p>
                </div>
                <p className="text-xs text-ink-muted">{r.completed}</p>
                <p className="font-semibold text-ink">{r.candidates}</p>
                <p className={`font-semibold ${r.match >= 80 ? "text-success" : r.match >= 60 ? "text-brand" : "text-ink-muted"}`}>
                  {r.match}%
                </p>
                <div>
                  <Badge tone={r.status === "Partial" ? "warning" : "success"} pill>{r.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Run Detail: RUN-9821</h2>
            <p className="text-sm text-ink-muted">Quarterly Frontend Ingest · Senior React Engineer</p>
          </div>
          <Button variant="secondary" size="sm">JSON</Button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-md border border-line p-3"><p className="text-xs text-ink-muted">Total Candidates</p><p className="mt-1 font-display text-xl font-bold text-ink">45</p></div>
          <div className="rounded-md border border-line p-3"><p className="text-xs text-ink-muted">Average Match</p><p className="mt-1 font-display text-xl font-bold text-success">82%</p></div>
          <div className="rounded-md border border-line p-3"><p className="text-xs text-ink-muted">Execution Time</p><p className="mt-1 font-display text-xl font-bold text-ink">1m 14s</p></div>
          <div className="rounded-md border border-line p-3"><p className="text-xs text-ink-muted">API Latency</p><p className="mt-1 font-display text-xl font-bold text-ink">840ms</p></div>
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Prompt Snapshot (v2.4.1)</p>
          <pre className="mt-2 max-h-48 overflow-y-auto rounded-md bg-surface-soft/60 p-4 font-mono text-[11px] leading-5 text-ink-subtle whitespace-pre-wrap">
{prompt}
          </pre>
        </div>

        <div className="mt-6 flex justify-between text-xs text-ink-muted">
          <span>Tokens Consumed: <strong className="text-ink">42,890</strong></span>
          <Button variant="ghost" size="sm">View Full Shortlist Results</Button>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Prompts &amp; Orchestration</h2>
            <p className="text-sm text-ink-muted">Tweak the AI&apos;s internal logic and evaluation criteria.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Undo2 className="h-3.5 w-3.5" />}>Revert</Button>
            <Button size="sm" leftIcon={<Save className="h-3.5 w-3.5" />}>Save Version</Button>
          </div>
        </div>

        <div role="tablist" className="mt-5 flex gap-1 border-b border-line">
          {tabs.map((t, i) => (
            <button
              key={t}
              role="tab"
              aria-selected={i === 0}
              className={`px-4 py-2 text-sm font-medium ${
                i === 0 ? "border-b-2 border-brand text-brand" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <Field label="Gemini-1.5-Pro System Prompt">
              <Textarea rows={10} defaultValue={prompt} className="font-mono text-xs leading-5" />
            </Field>

            <div className="mt-6 rounded-md border border-line p-4">
              <h4 className="text-sm font-semibold text-ink">Quick Test Runner</h4>
              <div className="mt-3 flex flex-col gap-2 md:flex-row">
                <Input placeholder="Search test profile..." className="flex-1" aria-label="Test Candidate" />
                <Button leftIcon={<Play className="h-4 w-4" />}>Run Simulation</Button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">Click run to see predicted ranking outputs for current prompt.</p>
            </div>
          </div>

          <aside>
            <h4 className="text-sm font-semibold text-ink">Injection Tokens</h4>
            <p className="mt-1 text-xs text-ink-muted">Click to copy variable placeholder.</p>
            <ul className="mt-3 flex flex-col gap-2">
              {tokens.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-line px-3 py-2 text-left font-mono text-xs text-ink hover:bg-surface-soft"
                  >
                    <span>{t}</span>
                    <Copy className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Card>
    </div>
  );
}
