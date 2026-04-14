"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Download, Play, Pencil, Upload, MoreHorizontal, CircleCheck, Search, Trash2, Archive, X, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";

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
  skills: string[];
  experience: string;
  cultureFit: string;
  description: string;
}

const initialJobs: Job[] = [
  { id: "JOB-001", title: "Senior Frontend Engineer", dept: "Product Engineering", manager: "Marcus Chen", location: "Remote (GMT+2)", applicants: 142, delta: "+12", lastScreened: "2023-10-24", status: "Active", skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Testing Library"], experience: "Senior / Lead", cultureFit: "High (Innovation focus)", description: "The ideal candidate has 5+ years of experience in high-growth SaaS environments. They excel at architecture and modular component design." },
  { id: "JOB-002", title: "Fullstack Developer (Node.js)", dept: "Core Services", manager: "Sarah Jenkins", location: "Kigali, Rwanda", applicants: 89, delta: "+5", lastScreened: "2023-10-22", status: "Active", skills: ["Node.js", "PostgreSQL", "REST APIs", "Docker"], experience: "Mid / Senior", cultureFit: "High (Collaboration focus)", description: "Looking for a fullstack developer comfortable with both frontend and backend systems in a fast-paced environment." },
  { id: "JOB-003", title: "Product Designer", dept: "UX/UI Team", manager: "David Miller", location: "Remote (US)", applicants: 56, delta: "-2", lastScreened: "N/A", status: "Draft", skills: ["Figma", "User Research", "Prototyping", "Design Systems"], experience: "Mid-level", cultureFit: "Medium (Creative focus)", description: "Seeking a product designer who can translate complex user needs into elegant, accessible interfaces." },
  { id: "JOB-004", title: "QA Automation Lead", dept: "Quality Assurance", manager: "Aisha Varma", location: "Hybrid (Nairobi)", applicants: 210, delta: "+45", lastScreened: "2023-10-20", status: "Active", skills: ["Selenium", "Cypress", "Jest", "CI/CD", "Python"], experience: "Senior / Lead", cultureFit: "High (Quality focus)", description: "Lead our QA automation efforts and build robust testing pipelines across web and mobile platforms." },
  { id: "JOB-005", title: "DevOps Architect", dept: "Infrastructure", manager: "Robert Fox", location: "Remote", applicants: 34, delta: "+1", lastScreened: "2023-09-15", status: "Closed", skills: ["AWS", "Terraform", "Kubernetes", "CI/CD"], experience: "Principal / Architect", cultureFit: "High (Reliability focus)", description: "Design and maintain scalable cloud infrastructure with a focus on reliability and cost efficiency." },
  { id: "JOB-006", title: "Data Scientist", dept: "Analytics", manager: "Priya Nair", location: "Remote (EU)", applicants: 78, delta: "+8", lastScreened: "2023-10-18", status: "Active", skills: ["Python", "ML", "SQL", "TensorFlow"], experience: "Mid / Senior", cultureFit: "High (Data-driven)", description: "Build and deploy machine learning models to drive product and business decisions." },
  { id: "JOB-007", title: "Backend Engineer (Go)", dept: "Platform", manager: "James Osei", location: "Hybrid (Lagos)", applicants: 45, delta: "+3", lastScreened: "2023-10-10", status: "Draft", skills: ["Go", "gRPC", "PostgreSQL", "Redis"], experience: "Mid-level", cultureFit: "Medium (Performance focus)", description: "Join the platform team to build high-throughput backend services in Go." },
];

const statusTone: Record<Job["status"], React.ComponentProps<typeof Badge>["tone"]> = {
  Active: "success",
  Draft: "neutral",
  Closed: "danger",
};

const PAGE_SIZE = 5;
const ALL_STATUSES = ["All", "Active", "Draft", "Closed"] as const;

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string>("JOB-001");
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.dept.toLowerCase().includes(search.toLowerCase()) ||
        j.manager.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = jobs.find((j) => j.id === selectedId) ?? jobs[0];

  function handleDelete(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (selectedId === id) setSelectedId(jobs.find((j) => j.id !== id)?.id ?? "");
    setDeleteTarget(null);
    setMenuOpen(null);
  }

  function handleArchive(id: string) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "Closed" } : j)));
    setShowArchiveConfirm(null);
    setMenuOpen(null);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleStatusChange(val: string) {
    setStatusFilter(val);
    setPage(1);
  }

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Jobs Management"
        description="Manage, ingest applicants, and trigger AI-powered screenings."
        actions={
          <>
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>Export Report</Button>
            <Link href="/jobs/new">
              <Button leftIcon={<Play className="h-4 w-4" />}>Create New Requisition</Button>
            </Link>
          </>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Search & Filter — aligned to table width */}
        <div className="flex items-center rounded-md border border-line bg-white shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              placeholder="Search by title, department, or manager…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 border-l border-line px-2">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`h-7 rounded px-3 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-brand text-white"
                    : "text-ink-muted hover:bg-surface-soft hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* spacer to keep grid alignment — empty on first row */}
        <div className="hidden lg:block" />
        <Card className="overflow-hidden">
          <div role="table" className="min-w-0">
            <div role="row" className="hidden grid-cols-[2fr_1.1fr_1.1fr_0.9fr_1fr_100px_40px] gap-4 bg-surface-soft/40 px-5 py-3 text-xs text-ink-muted md:grid">
              <span role="columnheader">Job Title &amp; ID</span>
              <span role="columnheader">Manager</span>
              <span role="columnheader">Location</span>
              <span role="columnheader">Applicants</span>
              <span role="columnheader">Last Screened</span>
              <span role="columnheader" className="text-center">Status</span>
              <span role="columnheader" />
            </div>

            {paginated.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-ink-muted">No jobs match your search.</div>
            ) : (
              <ul className="divide-y divide-line">
                {paginated.map((j) => (
                  <li
                    key={j.id}
                    onClick={() => setSelectedId(j.id)}
                    className={`grid cursor-pointer grid-cols-2 gap-3 px-5 py-4 text-sm transition-colors md:grid-cols-[2fr_1.1fr_1.1fr_0.9fr_1fr_100px_40px] md:items-center md:gap-4 ${
                      selectedId === j.id ? "bg-brand-soft/40" : "hover:bg-surface-soft/50"
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
                    {/* Row actions menu */}
                    <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="rounded-md p-1 text-ink-muted hover:bg-surface-soft"
                        aria-label="More options"
                        onClick={() => setMenuOpen(menuOpen === j.id ? null : j.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuOpen === j.id && (
                        <div className="absolute right-0 top-8 z-10 w-40 rounded-md border border-line bg-white shadow-card">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-soft"
                            onClick={() => { setShowArchiveConfirm(j.id); setMenuOpen(null); }}
                          >
                            <Archive className="h-3.5 w-3.5 text-ink-muted" /> Archive
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
                            onClick={() => { setDeleteTarget(j.id); setMenuOpen(null); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4 border-t border-line bg-white px-5 py-4 text-sm text-ink-muted">
            <p>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} jobs</p>
            <nav aria-label="Pagination" className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-md border text-xs transition-colors ${
                    p === page ? "border-brand bg-brand text-white" : "border-line text-ink hover:bg-surface-soft"
                  }`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
            </nav>
          </div>
        </Card>

        {/* Quick Inspection Panel */}
        <aside aria-label="Quick inspection" className="flex flex-col gap-4">
          {selected ? (
            <>
              <Card className="p-5">
                <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                  — Quick Inspection —
                </p>
                <div className="flex items-start justify-between">
                  <Badge tone="neutral" className="rounded-full font-mono">ID: {selected.id}</Badge>
                  <Badge tone={statusTone[selected.status]} pill>{selected.status}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-ink">{selected.title}</h3>
                <p className="text-xs text-ink-muted">{selected.dept}</p>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="uppercase tracking-wider text-ink-muted">Location</dt>
                    <dd className="mt-0.5 text-ink">{selected.location}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wider text-ink-muted">Hiring Manager</dt>
                    <dd className="mt-0.5 text-ink">{selected.manager}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    <CircleCheck className="h-4 w-4 text-brand" /> Must-have Skills
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.skills.map((s) => (
                      <Badge key={s} tone="neutral">{s}</Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <Button leftIcon={<Play className="h-4 w-4" />}>Start AI Screening</Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" leftIcon={<Upload className="h-4 w-4" />}>Ingest</Button>
                    <Link href="/jobs/new" className="contents">
                      <Button variant="secondary" leftIcon={<Pencil className="h-4 w-4" />} fullWidth>Edit</Button>
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="bg-brand-soft p-5">
                <h4 className="text-sm font-semibold text-info-deep">Ideal Candidate Profile</h4>
                <p className="mt-2 text-xs leading-5 text-info-deep/80">{selected.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <dt className="uppercase tracking-wider text-info-deep/60">Experience Level</dt>
                    <dd className="mt-0.5 font-semibold text-info-deep">{selected.experience}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wider text-info-deep/60">Culture Fit</dt>
                    <dd className="mt-0.5 font-semibold text-info-deep">{selected.cultureFit}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-ink-muted">Total Applicants</p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">{selected.applicants}</p>
                </div>
                <div className="text-right text-xs">
                  <span className={`font-semibold ${selected.delta.startsWith("-") ? "text-danger" : "text-success"}`}>
                    {selected.delta.startsWith("-") ? "↘" : "↗"} {selected.delta.replace(/[+-]/, "")}
                  </span>
                  <p className="text-ink-muted">vs last month</p>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center text-sm text-ink-muted">Select a job to inspect.</Card>
          )}
        </aside>
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-[5]" onClick={() => setMenuOpen(null)} />
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
        <ModalHeader
          title="Delete Job"
          subtitle="This action cannot be undone."
          onClose={() => setDeleteTarget(null)}
        />
        <ModalBody className="flex flex-col gap-4">
          {deleteTarget && (() => {
            const job = jobs.find((j) => j.id === deleteTarget);
            if (!job) return null;
            return (
              <>
                <div className="flex items-center gap-3 rounded-md border border-danger/20 bg-danger/5 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{job.title}</p>
                    <p className="text-xs text-ink-muted">{job.id} · {job.dept} · {job.applicants} applicants</p>
                  </div>
                </div>
                <p className="text-sm text-ink-muted">
                  Deleting this job will permanently remove it and all associated screening data.
                  Candidate records will remain in the candidate pool.
                </p>
              </>
            );
          })()}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => deleteTarget && handleDelete(deleteTarget)}>
            Delete Permanently
          </Button>
        </ModalFooter>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal open={!!showArchiveConfirm} onClose={() => setShowArchiveConfirm(null)} size="sm">
        <ModalHeader
          title="Archive Job"
          subtitle="This job will be moved to Closed status."
          onClose={() => setShowArchiveConfirm(null)}
        />
        <ModalBody className="flex flex-col gap-4">
          {showArchiveConfirm && (() => {
            const job = jobs.find((j) => j.id === showArchiveConfirm);
            if (!job) return null;
            return (
              <>
                <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-4">
                  <Archive className="h-5 w-5 shrink-0 text-ink-muted" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{job.title}</p>
                    <p className="text-xs text-ink-muted">{job.id} · {job.dept}</p>
                  </div>
                </div>
                <p className="text-sm text-ink-muted">
                  Archived jobs stop accepting new applicants but all existing data is preserved.
                  You can reactivate this job later from the Jobs Management page.
                </p>
              </>
            );
          })()}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowArchiveConfirm(null)}>Cancel</Button>
          <Button leftIcon={<Archive className="h-4 w-4" />} onClick={() => showArchiveConfirm && handleArchive(showArchiveConfirm)}>
            Confirm Archive
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
