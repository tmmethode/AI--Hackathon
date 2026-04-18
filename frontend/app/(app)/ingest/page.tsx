"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Database, FileText, Table as TableIcon, Link2, CloudUpload,
  AlertCircle, Info, Briefcase, X, File, Link as LinkIcon,
  CheckCircle2, ArrowRight, Sparkles, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";

/* ── Types ── */
interface Applicant {
  name: string; source: string; experience: string;
  skills: string[]; tag: { label: string; tone: "info" | "brand" | "success" }; flagged?: boolean;
}
interface UploadedFile { id: string; name: string; size: number; }

/* ── Static data ── */
const jobs = [
  { id: "JOB-001", title: "Senior Frontend Engineer", dept: "Product Engineering" },
  { id: "JOB-002", title: "Fullstack Developer (Node.js)", dept: "Core Services" },
  { id: "JOB-003", title: "Product Designer", dept: "UX/UI Team" },
  { id: "JOB-004", title: "QA Automation Lead", dept: "Quality Assurance" },
];

const applicants: Applicant[] = [
  { name: "Sarah Jenkins", source: "JSON Upload", experience: "6 Years", skills: ["React", "TypeScript", "Node.js"], tag: { label: "Senior Level", tone: "brand" } },
  { name: "Michael Chen", source: "JSON Upload", experience: "4 Years", skills: ["Vue.js", "JavaScript", "Tailwind"], tag: { label: "Mid Level", tone: "info" } },
  { name: "Elena Rodriguez", source: "JSON Upload", experience: "3 Years", skills: ["React Native", "Firebase", "Redux"], tag: { label: "Mobile Specialist", tone: "info" }, flagged: true },
  { name: "David Okafor", source: "JSON Upload", experience: "8 Years", skills: ["Angular", "RxJS", "SASS"], tag: { label: "Lead Potential", tone: "brand" } },
  { name: "Julie Tran", source: "JSON Upload", experience: "5 Years", skills: ["Next.js", "AWS", "PostgreSQL"], tag: { label: "Fullstack", tone: "success" } },
  { name: "Amara Diallo", source: "CSV Import", experience: "2 Years", skills: ["HTML", "CSS", "JavaScript"], tag: { label: "Junior", tone: "info" } },
  { name: "Kevin Mwangi", source: "PDF Upload", experience: "7 Years", skills: ["Python", "Django", "PostgreSQL"], tag: { label: "Senior Level", tone: "brand" } },
];

const tabs = [
  { id: "json", label: "Upload via JSON", icon: Database },
  { id: "pdf", label: "Resume Upload", icon: FileText },
  { id: "csv", label: "CSV Import", icon: TableIcon },
  { id: "links", label: "Paste Links", icon: Link2 },
] as const;

type TabId = typeof tabs[number]["id"];
const PAGE_SIZE = 5;
const EXAMPLE_JSON_SCHEMA = `[
  {
    "name": "Sarah Jenkins",
    "email": "sarah.jenkins@example.com",
    "phone": "+250788123456",
    "source": "JSON Upload",
    "experienceYears": 6,
    "currentTitle": "Senior Frontend Engineer",
    "location": "Kigali, Rwanda",
    "skills": ["React", "TypeScript", "Node.js"],
    "educationLevel": "bs",
    "portfolioUrl": "https://portfolio.example.com/sarah",
    "linkedinUrl": "https://linkedin.com/in/sarah-jenkins",
    "notes": "Strong product-thinking and mentoring experience."
  }
]`;

function formatBytes(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Tab content components ── */
function JsonTab({
  files,
  onFiles,
  onRemove,
  onViewSchema,
}: {
  files: UploadedFile[];
  onFiles: (f: UploadedFile[]) => void;
  onRemove: (id: string) => void;
  onViewSchema: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFiles(raw: FileList | null) {
    if (!raw) return;
    const next: UploadedFile[] = Array.from(raw).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}`, name: f.name, size: f.size,
    }));
    onFiles(next);
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <p className="text-sm text-ink-muted">Upload a JSON file containing applicant records to ingest candidates in bulk.</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed py-12 text-center transition-colors ${
          dragging ? "border-brand bg-brand-soft/40" : "border-line-strong bg-surface-soft/20 hover:border-brand/50 hover:bg-surface-soft/40"
        }`}
      >
        <Database className="mx-auto mb-2 h-8 w-8 text-brand/40" />
        <p className="text-sm text-ink-muted">Drop a `.json` file here or</p>
        <div className="mt-3 flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>Browse JSON</Button>
          <Button variant="ghost" size="sm" onClick={onViewSchema}>View Example Schema</Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 shrink-0 text-brand" />
                <span className="font-medium text-ink">{f.name}</span>
                <span className="text-xs text-ink-muted">{formatBytes(f.size)}</span>
              </div>
              <button onClick={() => onRemove(f.id)} className="rounded p-1 text-ink-muted hover:bg-surface-soft hover:text-danger">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-line bg-surface-soft/30 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10">
            <ShieldCheck className="h-4 w-4 text-brand" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">Expected payload</p>
            <p className="mt-1 text-xs text-ink-muted">
              Provide an array of applicants with fields such as name, email, experience, skills, and source metadata.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PdfTab({ files, onFiles, onRemove }: {
  files: UploadedFile[]; onFiles: (f: UploadedFile[]) => void; onRemove: (id: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFiles(raw: FileList | null) {
    if (!raw) return;
    const next: UploadedFile[] = Array.from(raw).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}`, name: f.name, size: f.size,
    }));
    onFiles(next);
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed py-12 text-center transition-colors ${
          dragging ? "border-brand bg-brand-soft/40" : "border-line-strong bg-surface-soft/20 hover:border-brand/50 hover:bg-surface-soft/40"
        }`}
      >
        <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${dragging ? "bg-brand text-white" : "bg-brand-soft"}`}>
          <CloudUpload className={`h-6 w-6 ${dragging ? "text-white" : "text-brand"}`} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-ink">
          {dragging ? "Drop files here" : "Drag and drop resumes"}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">Supports .pdf, .docx, .txt · Max 50 files</p>
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>Browse Files</Button>
        </div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt" className="hidden"
          onChange={(e) => processFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 shrink-0 text-brand" />
                <span className="font-medium text-ink">{f.name}</span>
                <span className="text-xs text-ink-muted">{formatBytes(f.size)}</span>
              </div>
              <button onClick={() => onRemove(f.id)} className="rounded p-1 text-ink-muted hover:bg-surface-soft hover:text-danger">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CsvTab() {
  return (
    <div className="p-6">
      <p className="mb-4 text-sm text-ink-muted">Upload a CSV file with candidate data. Download the template to get started.</p>
      <div className="rounded-lg border-2 border-dashed border-line-strong bg-surface-soft/20 py-12 text-center">
        <TableIcon className="mx-auto mb-2 h-8 w-8 text-brand/40" />
        <p className="text-sm text-ink-muted">Drop a .csv file here or</p>
        <div className="mt-3 flex justify-center gap-2">
          <Button variant="secondary" size="sm">Browse CSV</Button>
          <Button variant="ghost" size="sm">Download Template</Button>
        </div>
      </div>
    </div>
  );
}

function LinksTab() {
  const [links, setLinks] = useState("");
  return (
    <div className="p-6 flex flex-col gap-4">
      <p className="text-sm text-ink-muted">Paste LinkedIn or portfolio URLs, one per line.</p>
      <textarea
        value={links}
        onChange={(e) => setLinks(e.target.value)}
        placeholder={"https://linkedin.com/in/candidate-1\nhttps://linkedin.com/in/candidate-2"}
        className="min-h-[140px] w-full rounded-md border border-line bg-surface px-3 py-2.5 font-mono text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
      />
      <div className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4 text-ink-muted" />
        <span className="text-xs text-ink-muted">{links.split("\n").filter(Boolean).length} URL(s) detected</span>
        <Button size="sm" className="ml-auto">Parse Links</Button>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function IngestPage() {
  const [activeTab, setActiveTab] = useState<TabId>("pdf");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [jsonFiles, setJsonFiles] = useState<UploadedFile[]>([]);
  const [selectedJob, setSelectedJob] = useState(jobs[0].id);
  const [page, setPage] = useState(1);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const totalPages = Math.max(1, Math.ceil(applicants.length / PAGE_SIZE));
  const paginated = useMemo(() => applicants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [page]);
  const job = jobs.find((j) => j.id === selectedJob)!;

  function addFiles(newFiles: UploadedFile[]) {
    setFiles((prev) => [...prev, ...newFiles]);
  }
  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }
  function addJsonFiles(newFiles: UploadedFile[]) {
    setJsonFiles((prev) => [...prev, ...newFiles]);
  }
  function removeJsonFile(id: string) {
    setJsonFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="w-full px-6 py-5">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Ingest Applicants</h1>
          <p className="mt-1 text-sm text-ink-muted">Upload and parse candidate data into your talent pool.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs"><Button variant="secondary">Cancel</Button></Link>
          <Button onClick={() => setShowSuccessModal(true)}>Import Candidates</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          {/* Source tabs */}
          <Card className="overflow-hidden">
            <div role="tablist" className="flex items-center gap-1 border-b border-line p-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} role="tab" aria-selected={activeTab === t.id}
                    onClick={() => setActiveTab(t.id)}
                    title={t.label}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:px-4 ${
                      activeTab === t.id ? "bg-brand text-white" : "text-ink-muted hover:bg-surface-soft"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>
            {activeTab === "json" && (
              <JsonTab
                files={jsonFiles}
                onFiles={addJsonFiles}
                onRemove={removeJsonFile}
                onViewSchema={() => setShowSchemaModal(true)}
              />
            )}
            {activeTab === "pdf" && <PdfTab files={files} onFiles={addFiles} onRemove={removeFile} />}
            {activeTab === "csv" && <CsvTab />}
            {activeTab === "links" && <LinksTab />}
          </Card>

          {/* Applicant preview table */}
          <Card>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Extracted Applicant Preview</h3>
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
                {paginated.map((a) => (
                  <li key={a.name} className="grid grid-cols-1 gap-3 px-6 py-4 text-sm md:grid-cols-[1.4fr_0.7fr_1.5fr_1fr] md:items-center md:gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.name} size={32} />
                      <div>
                        <p className="flex items-center gap-1.5 font-medium text-ink">
                          {a.name}
                          {a.flagged && <Info className="h-3.5 w-3.5 text-danger" />}
                        </p>
                        <p className="text-xs text-ink-muted">Source: {a.source}</p>
                      </div>
                    </div>
                    <p className="text-ink">{a.experience}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {a.skills.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}
                    </div>
                    <Badge tone={a.tag.tone} pill>{a.tag.label}</Badge>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-line px-6 py-3 text-sm text-ink-muted">
              <p>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, applicants.length)} of {applicants.length}</p>
              <nav className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-md border text-xs transition-colors ${
                      p === page ? "border-brand bg-brand text-white" : "border-line text-ink hover:bg-surface-soft"
                    }`}
                  >{p}</button>
                ))}
              </nav>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-5">
          {/* Target job selector */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Target Job</h3>
            <p className="mt-1 text-xs text-ink-muted">Destination for these candidates</p>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="mt-3 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <div className="mt-3 flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10">
                <Briefcase className="h-4 w-4 text-brand" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{job.title}</p>
                <p className="text-xs text-ink-muted">{job.dept} · {job.id}</p>
              </div>
            </div>
          </Card>

          {/* Parsing status */}
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
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Successful</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">32</p>
              </div>
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Errors</p>
                <p className="mt-1 font-display text-xl font-bold text-danger">2</p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-md bg-danger/5 p-3 text-xs">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <div>
                <p className="font-semibold text-danger">Corrupted: resume_final_v2.pdf</p>
                <p className="mt-0.5 text-ink-muted">PDF header could not be read.</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" fullWidth className="mt-3">View Detailed Logs</Button>
          </Card>

          {/* Guidelines */}
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
      <Modal open={showSchemaModal} onClose={() => setShowSchemaModal(false)} size="lg">
        <ModalHeader
          title="Example JSON Schema"
          subtitle="Use this structure when uploading applicants through the JSON importer."
          onClose={() => setShowSchemaModal(false)}
        />
        <ModalBody className="flex flex-col gap-4">
          <div className="rounded-md border border-line bg-surface-soft/30 p-4">
            <p className="text-sm font-medium text-ink">Recommended fields</p>
            <p className="mt-1 text-xs text-ink-muted">
              Include candidate identity, contact details, experience, skills, and optional profile links.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-line bg-ink px-4 py-4 text-xs leading-6 text-white">
            <code>{EXAMPLE_JSON_SCHEMA}</code>
          </pre>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowSchemaModal(false)}>Close</Button>
        </ModalFooter>
      </Modal>
      {/* Success Modal — guides user to Screening */}
      <Modal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} size="sm">
        <ModalBody className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Candidates Imported!</h2>
            <p className="mt-2 text-sm text-ink-muted">
              <strong className="text-ink">{applicants.length} candidates</strong> have been ingested into your talent pool. The next step is to run AI screening to rank and evaluate them.
            </p>
          </div>

          <div className="w-full rounded-lg border border-line bg-surface-soft/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <Sparkles className="h-5 w-5 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">AI Screening</p>
                <p className="text-xs text-ink-muted">Rank candidates using AI-powered analysis</p>
              </div>
            </div>
          </div>

          {/* Workflow stepper */}
          <div className="flex w-full items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Create Job</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Ingest</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">Screen</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2.5 py-1">Shortlist</span>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>Stay Here</Button>
          <Link href="/screening"><Button leftIcon={<Sparkles className="h-4 w-4" />}>Start Screening</Button></Link>
        </ModalFooter>
      </Modal>
    </div>
  );
}
