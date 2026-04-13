import {
  Database,
  FileText,
  Table as TableIcon,
  Link2,
  CloudUpload,
  AlertCircle,
  Info,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

interface Applicant {
  name: string;
  source: string;
  experience: string;
  skills: string[];
  tag: { label: string; tone: "info" | "brand" | "success" };
  flagged?: boolean;
}

const applicants: Applicant[] = [
  {
    name: "Sarah Jenkins",
    source: "Umurava Platform",
    experience: "6 Years",
    skills: ["React", "TypeScript", "Node.js"],
    tag: { label: "Senior Level", tone: "brand" },
  },
  {
    name: "Michael Chen",
    source: "Umurava Platform",
    experience: "4 Years",
    skills: ["Vue.js", "JavaScript", "Tailwind"],
    tag: { label: "Mid Level", tone: "info" },
  },
  {
    name: "Elena Rodriguez",
    source: "Umurava Platform",
    experience: "3 Years",
    skills: ["React Native", "Firebase", "Redux"],
    tag: { label: "Mobile Specialist", tone: "info" },
    flagged: true,
  },
  {
    name: "David Okafor",
    source: "Umurava Platform",
    experience: "8 Years",
    skills: ["Angular", "RxJS", "SASS"],
    tag: { label: "Lead Potential", tone: "brand" },
  },
  {
    name: "Julie Tran",
    source: "Umurava Platform",
    experience: "5 Years",
    skills: ["Next.js", "AWS", "PostgreSQL"],
    tag: { label: "Fullstack", tone: "success" },
  },
];

const tabs = [
  { label: "Umurava Platform", icon: Database },
  { label: "PDF/Docx Upload", icon: FileText, active: true },
  { label: "CSV Import", icon: TableIcon },
  { label: "Paste Links", icon: Link2 },
];

export default function IngestPage() {
  return (
    <div className="mx-auto w-full max-w-[1184px] px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge tone="info" className="rounded-full font-mono">Job ID: SR-FE-2024</Badge>
          <p className="text-sm text-ink-muted">
            Ingesting candidates for <span className="font-semibold text-ink">&ldquo;Senior Frontend Engineer&rdquo;</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Cancel</Button>
          <Button>Confirm &amp; Start Screening</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <div role="tablist" aria-label="Ingestion source" className="flex items-center gap-1 border-b border-line p-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.label}
                    role="tab"
                    aria-selected={t.active}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-medium ${
                      t.active ? "bg-surface-soft text-ink" : "text-ink-muted hover:bg-surface-soft/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden /> {t.label}
                  </button>
                );
              })}
            </div>
            <div className="p-6">
              <div className="rounded-lg border border-dashed border-line-strong bg-surface-soft/20 py-14 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft" aria-hidden>
                  <CloudUpload className="h-6 w-6 text-brand" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">Drag and drop PDF resumes</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Supports .pdf, .docx, and .txt files. Max 50 files per batch for optimal AI parsing.
                </p>
                <div className="mt-4">
                  <Button variant="secondary">Browse Files</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Extracted Applicant Preview</h3>
                <p className="text-sm text-ink-muted">Review and verify data before final ingestion.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">Bulk Edit</Button>
                <Button variant="ghost" size="sm">Discard All</Button>
              </div>
            </div>
            <div role="table">
              <div role="row" className="hidden grid-cols-[1.4fr_0.7fr_1.5fr_1fr] gap-4 bg-surface-soft/30 px-6 py-3 text-[11px] uppercase tracking-wider text-ink-muted md:grid">
                <span role="columnheader">Candidate</span>
                <span role="columnheader">Exp.</span>
                <span role="columnheader">Extracted Skills</span>
                <span role="columnheader">Job Match Tags</span>
              </div>
              <ul className="divide-y divide-line">
                {applicants.map((a) => (
                  <li
                    key={a.name}
                    className="grid grid-cols-1 gap-3 px-6 py-4 text-sm md:grid-cols-[1.4fr_0.7fr_1.5fr_1fr] md:items-center md:gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={a.name} size={32} />
                      <div>
                        <p className="flex items-center gap-1.5 font-medium text-ink">
                          {a.name}
                          {a.flagged && <Info className="h-3.5 w-3.5 text-danger" aria-label="Flagged" />}
                        </p>
                        <p className="text-xs text-ink-muted">Source: {a.source}</p>
                      </div>
                    </div>
                    <p className="text-ink">{a.experience}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {a.skills.map((s) => (
                        <Badge key={s} tone="neutral">{s}</Badge>
                      ))}
                    </div>
                    <div>
                      <Badge tone={a.tag.tone} pill>{a.tag.label}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Active Pipeline</h3>
            <p className="mt-1 text-xs text-ink-muted">Destination for these candidates</p>
            <div className="mt-3 flex items-center gap-3 rounded-md border border-line p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10">
                <Briefcase className="h-4 w-4 text-brand" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Senior Frontend Engineer</p>
                <p className="text-xs text-ink-muted">Engineering Dept · Kigali, RW</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-3 w-full">Change Target Job</Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Parsing Status</h3>
              <Badge tone="success" pill>REAL-TIME</Badge>
            </div>
            <p className="mt-3 text-xs text-ink-muted">Processing Batch #142</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-surface-soft">
                <div className="h-full rounded-full bg-brand" style={{ width: "68%" }} />
              </div>
              <span className="text-xs font-semibold text-ink">68%</span>
            </div>
            <p className="mt-2 text-xs text-ink-muted">Analyzing 34 of 50 resumes…</p>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Statistics</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Successful</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">32</p>
              </div>
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Errors</p>
                <p className="mt-1 font-display text-xl font-bold text-danger">2</p>
              </div>
            </div>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Recent Issues</p>
            <div className="mt-2 flex items-start gap-2 rounded-md bg-danger/5 p-3 text-xs">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <div>
                <p className="font-semibold text-danger">Corrupted File: resume_final_v2.pdf</p>
                <p className="mt-0.5 text-ink-muted">The PDF header could not be read. Please re-upload.</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" fullWidth className="mt-3">View Detailed Logs</Button>
          </Card>

          <Card className="bg-brand-soft/60 p-5">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-info-deep" />
              <h4 className="text-sm font-semibold text-info-deep">Ingestion Guidelines</h4>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-info-deep/80">
              <li>Ensure resumes are text-readable PDFs (no flattened images).</li>
              <li>AI extraction takes approximately 5-10 seconds per candidate.</li>
              <li>Maximum batch size is 50 files for real-time processing.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
