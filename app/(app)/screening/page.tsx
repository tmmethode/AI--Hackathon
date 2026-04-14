import { X, Play, ShieldCheck, FileText, CheckCircle2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function ScreeningPage() {
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
          <Button variant="secondary" leftIcon={<X className="h-4 w-4" />}>Cancel</Button>
          <Button leftIcon={<Play className="h-4 w-4" />}>Run Screening</Button>
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
            <h3 className="font-display text-base font-semibold text-ink">Senior Product Designer</h3>
            <p className="text-xs text-ink-muted">Product &amp; Design Team · Kigali, Rwanda</p>

            <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Core Requirements</h4>
            <ul className="mt-2 space-y-2 text-xs text-ink">
              {[
                "5+ Years UX/UI experience",
                "Proficiency in Figma & Design Systems",
                "Case studies on SaaS products",
              ].map((r) => (
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
              <Badge tone="info" pill>142 Candidates</Badge>
            </div>
            <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Screening Assets</h4>
            <ul className="mt-2 space-y-2 text-xs">
              <li className="flex items-center justify-between rounded-md border border-line p-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-brand" />
                  <div>
                    <p className="font-medium text-ink">Applicants_Ingested.csv</p>
                    <p className="text-ink-muted">1.2 MB · 142 records</p>
                  </div>
                </div>
              </li>
              <li className="flex items-center justify-between rounded-md border border-line p-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-brand" />
                  <div>
                    <p className="font-medium text-ink">Job_Benchmark.json</p>
                    <p className="text-ink-muted">4 KB · Custom Weights</p>
                  </div>
                </div>
              </li>
            </ul>
            <Button variant="secondary" size="sm" fullWidth className="mt-3">Manage Assets</Button>
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
            You are about to run a Gemini-powered screening on 142 candidates.
          </p>
          <div className="mt-5 rounded-md bg-brand-soft/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-info-deep">Estimated Processing Time</p>
            <p className="mt-1 text-sm text-info-deep/80">
              Approximately 45-60 seconds based on current volume and depth settings.
            </p>
          </div>
          <label className="mt-4 flex items-start gap-2 text-xs text-ink-muted">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand/40" />
            <span>I understand this run will consume 1 Screening Credit and generate a persistent audit trail.</span>
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary">Back</Button>
            <Button leftIcon={<Play className="h-4 w-4" />}>Confirm &amp; Trigger Analysis</Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
