import { Download, Play, Pencil, Upload, MoreHorizontal, CircleCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

interface Job {
  id: string;
  title: string;
  dept: string;
  manager: string;
  location: string;
  applicants: number;
  delta: string;
  lastScreened: string;
  status: "Active" | "Draft" | "Closed";
}

const jobs: Job[] = [
  { id: "JOB-001", title: "Senior Frontend Engineer", dept: "Product Engineering", manager: "Marcus Chen", location: "Remote (GMT+2)", applicants: 142, delta: "+12", lastScreened: "2023-10-24", status: "Active" },
  { id: "JOB-002", title: "Fullstack Developer (Node.js)", dept: "Core Services", manager: "Sarah Jenkins", location: "Kigali, Rwanda", applicants: 89, delta: "+5", lastScreened: "2023-10-22", status: "Active" },
  { id: "JOB-003", title: "Product Designer", dept: "UX/UI Team", manager: "David Miller", location: "Remote (US)", applicants: 56, delta: "-2", lastScreened: "N/A", status: "Draft" },
  { id: "JOB-004", title: "QA Automation Lead", dept: "Quality Assurance", manager: "Aisha Varma", location: "Hybrid (Nairobi)", applicants: 210, delta: "+45", lastScreened: "2023-10-20", status: "Active" },
  { id: "JOB-005", title: "DevOps Architect", dept: "Infrastructure", manager: "Robert Fox", location: "Remote", applicants: 34, delta: "+1", lastScreened: "2023-09-15", status: "Closed" },
];

const statusTone: Record<Job["status"], React.ComponentProps<typeof Badge>["tone"]> = {
  Active: "success",
  Draft: "neutral",
  Closed: "danger",
};

export default function JobsPage() {
  return (
    <div className="mx-auto w-full max-w-[1184px] px-4 py-8 md:px-8">
      <PageHeader
        title="Jobs Management"
        description="Manage, ingest applicants, and trigger AI-powered screenings."
        actions={
          <>
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>Export Report</Button>
            <Button leftIcon={<Play className="h-4 w-4" />}>Create New Requisition</Button>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div role="table" className="min-w-0">
            <div role="row" className="hidden grid-cols-[2fr_1.1fr_1.1fr_0.9fr_1fr_100px] gap-4 bg-surface-soft/40 px-5 py-3 text-xs text-ink-muted md:grid">
              <span role="columnheader">Job Title &amp; ID</span>
              <span role="columnheader">Manager</span>
              <span role="columnheader">Location</span>
              <span role="columnheader">Applicants</span>
              <span role="columnheader">Last Screened</span>
              <span role="columnheader" className="text-center">Status</span>
            </div>
            <ul className="divide-y divide-line">
              {jobs.map((j, i) => (
                <li
                  key={j.id}
                  className={`grid grid-cols-2 gap-3 px-5 py-4 text-sm md:grid-cols-[2fr_1.1fr_1.1fr_0.9fr_1fr_100px] md:items-center md:gap-4 ${
                    i === 0 ? "bg-brand-soft/30" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold text-ink">{j.title}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
                      {j.id} · {j.dept}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar name={j.manager} size={24} />
                    <span className="text-ink">{j.manager}</span>
                  </div>
                  <p className="text-ink-muted">{j.location}</p>
                  <div>
                    <p className="font-semibold text-ink">{j.applicants}</p>
                    <p className="text-xs text-ink-muted">{j.delta}</p>
                  </div>
                  <p className="text-ink-muted">{j.lastScreened}</p>
                  <div className="md:text-center">
                    <Badge tone={statusTone[j.status]} pill>{j.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-line bg-white px-5 py-4 text-sm text-ink-muted">
            <p>Showing 5 of 24 job listings</p>
            <nav aria-label="Pagination" className="flex items-center gap-1">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`h-8 w-8 rounded-md border text-xs ${
                    p === 1 ? "border-brand bg-brand text-white" : "border-line text-ink hover:bg-surface-soft"
                  }`}
                  aria-current={p === 1 ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
            </nav>
          </div>
        </Card>

        <aside aria-label="Quick inspection" className="flex flex-col gap-4">
          <Card className="p-5">
            <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
              — Quick Inspection —
            </p>
            <div className="flex items-start justify-between">
              <Badge tone="neutral" className="rounded-full font-mono">ID: JOB-001</Badge>
              <button className="rounded-md p-1 text-ink-muted hover:bg-surface-soft" aria-label="More options">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-3 font-display text-lg font-bold text-ink">Senior Frontend Engineer</h3>
            <p className="text-xs text-ink-muted">Product Engineering</p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="uppercase tracking-wider text-ink-muted">Location</dt>
                <dd className="mt-0.5 text-ink">Remote (GMT+2)</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-ink-muted">Hiring Manager</dt>
                <dd className="mt-0.5 text-ink">Marcus</dd>
              </div>
            </dl>

            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <CircleCheck className="h-4 w-4 text-brand" /> Must-have Skills
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["React", "TypeScript", "Tailwind CSS", "Next.js", "Testing Library"].map((s) => (
                  <Badge key={s} tone="neutral">{s}</Badge>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button leftIcon={<Play className="h-4 w-4" />}>Start AI Screening</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" leftIcon={<Upload className="h-4 w-4" />}>Ingest</Button>
                <Button variant="secondary" leftIcon={<Pencil className="h-4 w-4" />}>Edit</Button>
              </div>
            </div>
          </Card>

          <Card className="bg-brand-soft p-5">
            <h4 className="text-sm font-semibold text-info-deep">Ideal Candidate Profile</h4>
            <p className="mt-2 text-xs leading-5 text-info-deep/80">
              The ideal candidate has 5+ years of experience in high-growth SaaS environments. They excel at architecture
              and modular component design.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <dt className="uppercase tracking-wider text-info-deep/60">Experience Level</dt>
                <dd className="mt-0.5 font-semibold text-info-deep">Senior / Lead</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-info-deep/60">Culture Fit</dt>
                <dd className="mt-0.5 font-semibold text-info-deep">High (Innovation focus)</dd>
              </div>
            </dl>
          </Card>

          <Card className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-ink-muted">Total Applicants</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">142</p>
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold text-success">↗ 12%</span>
              <p className="text-ink-muted">vs last month</p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
