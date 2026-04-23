"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search, Filter, ArrowDownUp, Check, Users, Eye,
  Download, Mail, Calendar,
  Briefcase, ChevronDown, Send, Video, Phone, X,
  ClipboardCheck, GraduationCap, Wrench, ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { type CandidateStatus } from "@/lib/candidates";
import { createPdfFromLines } from "@/lib/pdf";
import { downloadCsv, downloadJson, downloadBlob, sanitizeFilename } from "@/lib/download";
import {
  ADVANCED_STATUSES,
  listCandidateDirectory,
  type CandidateFilterStatus,
  type CandidateListItem,
  type CandidateSortKey,
  type CandidateStatusCounts,
} from "@/lib/candidate-directory";
import { CandidatesPageSkeleton } from "@/components/page-skeletons";

type Candidate = CandidateListItem;

const advanceOptions = [
  { key: "interview" as const, label: "Interview", icon: Calendar, desc: "Schedule a screening or panel interview" },
  { key: "exam" as const, label: "Technical Exam", icon: ClipboardCheck, desc: "Assign a written or online technical test" },
  { key: "assessment" as const, label: "Assessment", icon: GraduationCap, desc: "Behavioral or competency assessment" },
  { key: "practical" as const, label: "Practical Test", icon: Wrench, desc: "Hands-on project or take-home assignment" },
];

type AdvanceKey = typeof advanceOptions[number]["key"];

interface AdvanceDropdownProps {
  candidate: Candidate;
  isOpen: boolean;
  onToggle: () => void;
  onAdvance: (id: string, status: AdvanceKey | "rejected") => void;
}

function AdvanceDropdown({ candidate, isOpen, onToggle, onAdvance }: AdvanceDropdownProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxHeight: number; placement: "top" | "bottom" } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    function update() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const margin = 8;
      const desiredWidth = 240;
      const spaceBelow = vh - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const placement: "top" | "bottom" = spaceBelow >= 280 || spaceBelow >= spaceAbove ? "bottom" : "top";
      const maxHeight = Math.max(160, Math.min(360, placement === "bottom" ? spaceBelow : spaceAbove));
      const width = Math.min(desiredWidth, vw - margin * 2);
      let left = rect.right - width;
      if (left < margin) left = margin;
      if (left + width > vw - margin) left = vw - margin - width;
      const top = placement === "bottom" ? rect.bottom + 4 : rect.top - 4 - maxHeight;
      setPos({ top, left, width, maxHeight, placement });
    }

    update();
    const onScroll = () => update();
    const onResize = () => update();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]);

  return (
    <>
      <Button
        ref={buttonRef as unknown as React.Ref<HTMLButtonElement>}
        size="sm"
        leftIcon={<ChevronRight className="h-3.5 w-3.5" />}
        onClick={onToggle}
        disabled={candidate.status === "rejected"}
      >
        Advance ▾
      </Button>
      {isOpen && pos && createPortal(
        <div
          role="menu"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            maxHeight: pos.maxHeight,
            zIndex: 60,
          }}
          className="overflow-y-auto rounded-lg border border-line bg-surface shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="sticky top-0 bg-surface px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Advance to
          </p>
          {advanceOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onAdvance(candidate.id, opt.key)}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface-soft transition-colors ${
                candidate.status === opt.key ? "bg-brand-soft/20" : ""
              }`}
            >
              <opt.icon className={`h-4 w-4 shrink-0 ${candidate.status === opt.key ? "text-success" : "text-brand"}`} />
              <div>
                <p className="text-sm font-medium text-ink">{opt.label}</p>
                <p className="text-[10px] text-ink-muted">{opt.desc}</p>
              </div>
              {candidate.status === opt.key && <Check className="h-3.5 w-3.5 ml-auto text-success" />}
            </button>
          ))}
          <div className="border-t border-line">
            <button
              onClick={() => onAdvance(candidate.id, "rejected")}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-danger/5 transition-colors"
            >
              <X className="h-4 w-4 shrink-0 text-danger" />
              <div>
                <p className="text-sm font-medium text-danger">Reject</p>
                <p className="text-[10px] text-ink-muted">Remove from pipeline</p>
              </div>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

const statusTone: Record<CandidateStatus, React.ComponentProps<typeof Badge>["tone"]> = {
  shortlisted: "brand",
  interview: "success",
  exam: "brand",
  assessment: "brand",
  practical: "brand",
  rejected: "danger",
  new: "neutral",
};

const statusLabels: Record<CandidateStatus, string> = {
  shortlisted: "Shortlisted",
  interview: "Interview",
  exam: "Technical Exam",
  assessment: "Assessment",
  practical: "Practical Test",
  rejected: "Rejected",
  new: "New",
};

type SortKey = CandidateSortKey;
type FilterStatus = CandidateFilterStatus;
const PAGE_SIZE = 10;

function getEmailSubject(c: Candidate): string {
  switch (c.status) {
    case "interview": return `Interview Invitation — ${c.job} Position at Umurava`;
    case "exam": return `Technical Exam Assignment — ${c.job} Position at Umurava`;
    case "assessment": return `Assessment Invitation — ${c.job} Position at Umurava`;
    case "practical": return `Practical Test Assignment — ${c.job} Position at Umurava`;
    default: return `Next Steps — ${c.job} Position at Umurava`;
  }
}

function getEmailBody(c: Candidate): string {
  const first = c.name.split(" ")[0];
  switch (c.status) {
    case "interview":
      return `Hi ${first},\n\nWe're pleased to invite you to an interview for the ${c.job} position at Umurava. Your profile stood out among our candidates, and we'd love to learn more about your experience.\n\nPlease find the interview details below and let us know if the scheduled time works for you.\n\nBest regards,\nUmurava Hiring Team`;
    case "exam":
      return `Hi ${first},\n\nCongratulations on progressing to the technical exam stage for the ${c.job} position at Umurava!\n\nYou'll receive a link to an online technical assessment. Please complete it within the allotted time. The exam covers core skills relevant to the role.\n\nGood luck!\nUmurava Hiring Team`;
    case "assessment":
      return `Hi ${first},\n\nWe'd like to invite you to complete a behavioral and competency assessment as part of your application for the ${c.job} position.\n\nThe assessment helps us understand your working style and cultural alignment. It should take approximately 30-45 minutes.\n\nBest regards,\nUmurava Hiring Team`;
    case "practical":
      return `Hi ${first},\n\nWe're excited to move you forward to the practical test stage for the ${c.job} position at Umurava!\n\nYou'll receive a take-home project with detailed requirements. You'll have 48-72 hours to complete it. Focus on code quality, architecture, and documentation.\n\nBest regards,\nUmurava Hiring Team`;
    default:
      return `Hi ${first},\n\nThank you for your application for the ${c.job} position. We were impressed with your profile and would like to discuss next steps.\n\nPlease let us know your availability for a brief call.\n\nBest regards,\nUmurava Hiring Team`;
  }
}

function getScheduleTitle(c: Candidate): string {
  switch (c.status) {
    case "interview": return "Schedule Interview";
    case "exam": return "Schedule Technical Exam";
    case "assessment": return "Schedule Assessment";
    case "practical": return "Schedule Practical Test";
    default: return "Schedule Meeting";
  }
}

function getScheduleSubtitle(c: Candidate): string {
  return `${statusLabels[c.status]} for ${c.name}`;
}

function getScheduleDefaults(c: Candidate): { round: string; notes: string; duration: string } {
  switch (c.status) {
    case "interview":
      return { round: "technical", notes: "Focus areas: system design, coding, behavioral questions", duration: "60 min" };
    case "exam":
      return { round: "exam", notes: "Online proctored exam. Ensure candidate has stable internet connection.", duration: "120 min" };
    case "assessment":
      return { round: "assessment", notes: "Behavioral & competency evaluation. Prepare rubric in advance.", duration: "45 min" };
    case "practical":
      return { round: "practical", notes: "Hands-on project review session. Candidate presents their solution.", duration: "90 min" };
    default:
      return { round: "phone", notes: "", duration: "30 min" };
  }
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobOptions, setJobOptions] = useState<Array<{ job: string; count: number }>>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<CandidateStatusCounts>({
    all: 0,
    shortlisted: 0,
    advanced: 0,
    interview: 0,
    exam: 0,
    assessment: 0,
    practical: 0,
    rejected: 0,
    new: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("matchScore");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterJob, setFilterJob] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [emailTarget, setEmailTarget] = useState<Candidate | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Candidate | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [scheduleSent, setScheduleSent] = useState(false);
  const [advanceDropdownId, setAdvanceDropdownId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState("");
  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, { previous: CandidateStatus; next: CandidateStatus; job: string }>
  >({});

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setLoadError("");

      try {
        const response = await listCandidateDirectory({
          page,
          pageSize: PAGE_SIZE,
          search,
          sortKey,
          sortDir: sortAsc ? "asc" : "desc",
          status: filterStatus,
          job: filterJob,
        });

        if (cancelled) {
          return;
        }

        setCandidates(
          response.data.map((candidate) => ({
            ...candidate,
            status: localStatusOverrides[candidate.id]?.next ?? candidate.status,
          }))
        );
        setCounts(response.statusCounts);
        setJobOptions(response.jobOptions);
        setTotalCandidates(response.total);
        setTotalPages(response.totalPages);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Failed to load candidates.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [filterJob, filterStatus, page, search, sortAsc, sortKey, localStatusOverrides]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(key === "name"); }
    setShowSort(false);
    setPage(1);
  }

  function handleAdvance(id: string, status: AdvanceKey | "rejected") {
    const target = candidates.find((entry) => entry.id === id);
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    if (target && target.status !== status) {
      setLocalStatusOverrides((prev) => ({
        ...prev,
        [id]: { previous: target.status, next: status, job: target.job },
      }));
    }
    setAdvanceDropdownId(null);
  }

  function handleJobSwitch(job: string) {
    setFilterJob(job);
    setFilterStatus("all");
    setSearch("");
    setPage(1);
    setShowJobPicker(false);
  }

  async function handleExportAll(format: "csv" | "json" | "pdf") {
    setShowExportMenu(false);
    setExportError("");
    setExportBusy(true);

    try {
      const response = await listCandidateDirectory({
        page: 1,
        pageSize: 1000,
        search,
        sortKey,
        sortDir: sortAsc ? "asc" : "desc",
        status: filterStatus,
        job: filterJob,
      });

      const rows = response.data.map((entry) => ({
        ...entry,
        status: localStatusOverrides[entry.id]?.next ?? entry.status,
      }));

      if (rows.length === 0) {
        setExportError("There are no candidates matching the current filters to export.");
        return;
      }

      const jobLabel = filterJob === "all" ? "all-jobs" : filterJob;
      const baseName = sanitizeFilename(`candidates_${jobLabel}_${filterStatus}`);

      if (format === "csv") {
        const header = [
          "Name",
          "Email",
          "Title",
          "Job",
          "Status",
          "Match Score",
          "Experience (yrs)",
          "Location",
          "Top Skills",
          "Applied Date",
          "Source",
        ];
        const csvRows: (readonly unknown[])[] = [header];
        for (const c of rows) {
          csvRows.push([
            c.name,
            c.email,
            c.title,
            c.job,
            c.status,
            c.matchScore,
            c.experienceYears,
            c.location,
            (c.skills || []).join("; "),
            c.appliedDate,
            c.source,
          ]);
        }
        downloadCsv(csvRows, `${baseName}.csv`);
      } else if (format === "json") {
        downloadJson(rows, `${baseName}.json`);
      } else {
        const lines = [
          "Candidate Pool Report",
          `Generated: ${new Date().toLocaleString()}`,
          `Job Filter: ${filterJob === "all" ? "All Jobs" : filterJob}`,
          `Status Filter: ${filterStatus}`,
          `Candidates Included: ${rows.length}`,
          "",
          ...rows.flatMap((c, index) => {
            const entry = [
              `${index + 1}. ${c.name} - ${c.matchScore}% match`,
              `Email: ${c.email || "—"}`,
              `Job: ${c.job || "—"} | Status: ${c.status}`,
              `Experience: ${c.experience || `${c.experienceYears} yrs`} | Location: ${c.location || "—"}`,
              `Skills: ${(c.skills || []).join(", ") || "—"}`,
            ];
            if (c.summary) {
              entry.push(`Summary: ${c.summary}`);
            }
            entry.push("");
            return entry;
          }),
        ];
        downloadBlob(createPdfFromLines(lines), `${baseName}.pdf`);
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to export candidates.");
    } finally {
      setExportBusy(false);
    }
  }

  const filterLabels: Record<FilterStatus, string> = {
    all: "All",
    shortlisted: "Shortlisted",
    advanced: "All Advanced",
    interview: "Interview",
    exam: "Technical Exam",
    assessment: "Assessment",
    practical: "Practical Test",
    rejected: "Rejected",
    new: "New",
  };

  const displayCounts = useMemo(() => {
    const next = { ...counts };
    const currentJob = filterJob;
    Object.values(localStatusOverrides).forEach((override) => {
      if (currentJob !== "all" && override.job !== currentJob) {
        return;
      }
      next[override.previous as keyof CandidateStatusCounts] = Math.max(
        0,
        next[override.previous as keyof CandidateStatusCounts] - 1
      );
      next[override.next as keyof CandidateStatusCounts] += 1;
    });
    next.advanced = next.interview + next.exam + next.assessment + next.practical;
    return next;
  }, [counts, filterJob, localStatusOverrides]);

  if (loading) {
    return <CandidatesPageSkeleton />;
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-5">
      <PageHeader
        title="Candidate Pool"
        description="Browse, search, and manage all candidates across your hiring pipeline."
        actions={
          <>
            <div className="relative">
              <Button
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => setShowExportMenu((open) => !open)}
                disabled={exportBusy}
              >
                {exportBusy ? "Exporting…" : "Export All"}
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-44 rounded-md border border-line bg-surface shadow-card">
                  {([["csv", "CSV Spreadsheet"], ["pdf", "PDF Report"], ["json", "JSON Data"]] as const).map(([fmt, label]) => (
                    <button
                      key={fmt}
                      onClick={() => handleExportAll(fmt)}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm text-ink hover:bg-surface-soft"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/ingest"><Button leftIcon={<Users className="h-4 w-4" />}>Ingest Candidates</Button></Link>
          </>
        }
      />
      {showExportMenu && (
        <div className="fixed inset-0 z-[25]" onClick={() => setShowExportMenu(false)} />
      )}
      {exportError && (
        <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-deep">
          {exportError}
        </div>
      )}

      {loadError && (
        <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
      )}

      <div className="relative mt-6">
        <button
          onClick={() => setShowJobPicker((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left transition-all hover:border-brand/40 hover:shadow-sm"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/10">
            <Briefcase className="h-4 w-4 text-brand" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Showing candidates for</p>
            <p className="font-display text-sm font-bold text-ink truncate">
              {filterJob === "all" ? "All Jobs" : filterJob}
            </p>
          </div>
          <Badge tone="neutral" pill>{displayCounts.all} candidates</Badge>
          <ChevronDown className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${showJobPicker ? "rotate-180" : ""}`} />
        </button>

        {showJobPicker && (
          <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-full rounded-lg border border-line bg-surface shadow-xl">
            <p className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Filter by job</p>
            <ul className="max-h-56 overflow-y-auto pb-2">
              <li>
                <button
                  onClick={() => handleJobSwitch("all")}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    filterJob === "all" ? "bg-brand-soft/30" : "hover:bg-surface-soft"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${filterJob === "all" ? "bg-brand/10" : "bg-surface-soft"}`}>
                    <Users className={`h-4 w-4 ${filterJob === "all" ? "text-brand" : "text-ink-muted"}`} />
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${filterJob === "all" ? "text-brand" : "text-ink"}`}>All Jobs</p>
                    <p className="text-[11px] text-ink-muted">View candidates across all positions</p>
                  </div>
                  <p className="text-xs font-bold text-ink">{displayCounts.all}</p>
                  {filterJob === "all" && <Check className="h-4 w-4 shrink-0 text-brand" />}
                </button>
              </li>
              {jobOptions.map(({ job, count }) => {
                const isActive = filterJob === job;
                return (
                  <li key={job}>
                    <button
                      onClick={() => handleJobSwitch(job)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isActive ? "bg-brand-soft/30" : "hover:bg-surface-soft"
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isActive ? "bg-brand/10" : "bg-surface-soft"}`}>
                        <Briefcase className={`h-4 w-4 ${isActive ? "text-brand" : "text-ink-muted"}`} />
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isActive ? "text-brand" : "text-ink"}`}>{job}</p>
                      </div>
                      <p className="text-xs font-bold text-ink">{count}</p>
                      {isActive && <Check className="h-4 w-4 shrink-0 text-brand" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      {showJobPicker && <div className="fixed inset-0 z-[15]" onClick={() => setShowJobPicker(false)} />}

      <section className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {([
          { label: "Total", value: displayCounts.all, tone: "brand" },
          { label: "Shortlisted", value: displayCounts.shortlisted, tone: "brand" },
          { label: "Advanced", value: displayCounts.advanced, tone: "success" },
          { label: "New", value: displayCounts.new, tone: "neutral" },
          { label: "Rejected", value: displayCounts.rejected, tone: "danger" },
        ] as const).map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-ink-muted">{s.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${
              s.tone === "success" ? "text-success" : s.tone === "brand" ? "text-brand" : s.tone === "danger" ? "text-danger" : "text-ink"
            }`}>{s.value}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            All Candidates <Badge tone="neutral">{totalCandidates}</Badge>
          </h2>

          <div className="relative ml-0 flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                placeholder="Search name, title, or skill…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-8 w-full min-w-0 rounded-md border border-line bg-surface pl-8 pr-3 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40 sm:w-52"
              />
            </div>

            <div className="relative">
              <Button variant="secondary" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}
                onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}>
                Filter
              </Button>
              {showFilter && (
                <div className="absolute right-0 top-9 z-10 w-48 rounded-md border border-line bg-surface shadow-card">
                  {(["all", "shortlisted", "advanced", "interview", "exam", "assessment", "practical", "rejected", "new"] as FilterStatus[]).map((s) => (
                    <button key={s} onClick={() => { setFilterStatus(s); setShowFilter(false); setPage(1); }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-surface-soft ${
                        filterStatus === s ? "text-brand font-medium" : "text-ink"
                      } ${s === "advanced" ? "border-b border-line" : ""}`}>
                      {filterLabels[s]} {filterStatus === s && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Button variant="secondary" size="sm" leftIcon={<ArrowDownUp className="h-3.5 w-3.5" />}
                onClick={() => { setShowSort((v) => !v); setShowFilter(false); }}>
                Sort
              </Button>
              {showSort && (
                <div className="absolute right-0 top-9 z-10 w-44 rounded-md border border-line bg-surface shadow-card">
                  {([["matchScore", "By Match %"], ["name", "By Name"], ["appliedDate", "By Date"]] as [SortKey, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => handleSort(key)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-surface-soft ${
                        sortKey === key ? "text-brand font-medium" : "text-ink"
                      }`}>
                      {label} {sortKey === key && <span className="text-xs">{sortAsc ? "↑" : "↓"}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-ink-muted">
            No candidates match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">
            {candidates.map((c) => {
              const matchColor = c.matchScore >= 90 ? "text-success" : c.matchScore >= 80 ? "text-brand" : "text-ink-muted";
              const ringColor = c.matchScore >= 90 ? "#22c55e" : c.matchScore >= 80 ? "var(--color-brand)" : "#94a3b8";
              const ringBg = c.matchScore >= 90 ? "rgba(34,197,94,0.1)" : c.matchScore >= 80 ? "rgba(59,130,246,0.1)" : "rgba(148,163,184,0.1)";
              const barColor = c.matchScore >= 90 ? "bg-success" : c.matchScore >= 80 ? "bg-brand" : "bg-ink-muted/40";
              const statusIcon = advanceOptions.find((o) => o.key === c.status);

              return (
                <div
                  key={c.id}
                  className={`group relative flex flex-col rounded-xl border border-line bg-surface shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand/30 hover:-translate-y-0.5 ${c.status === "rejected" ? "opacity-50 grayscale-[30%]" : ""}`}
                >
                  <div className="h-1 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${ringColor}, ${ringColor}60)` }} />

                  <div className="flex flex-col gap-3.5 p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="relative flex-shrink-0">
                        <svg width="52" height="52" viewBox="0 0 52 52" className="rotate-[-90deg]">
                          <circle cx="26" cy="26" r="22" fill="none" stroke={ringBg} strokeWidth="4" />
                          <circle
                            cx="26" cy="26" r="22" fill="none" stroke={ringColor} strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${(c.matchScore / 100) * 138.2} 138.2`}
                          />
                        </svg>
                        <span className={`absolute inset-0 flex items-center justify-center font-display text-xs font-bold ${matchColor}`}>
                          {c.matchScore}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-bold text-ink leading-tight">{c.name}</h3>
                          <Badge tone={statusTone[c.status]} pill>
                            {statusIcon && <statusIcon.icon className="h-2.5 w-2.5 mr-0.5" />}
                            {statusLabels[c.status]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-ink/70">{c.title}</p>
                        <p className="mt-0.5 text-[10px] text-ink-muted">{c.location} · {c.experience}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {c.skills.map((s) => (
                        <span key={s} className="rounded-md bg-surface-soft px-2 py-0.5 text-[11px] font-medium text-ink/70">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] text-ink-muted mb-1">
                        <span>AI Match Score</span>
                        <span className={`font-bold ${matchColor}`}>{c.matchScore}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${c.matchScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-md bg-surface-soft/50 px-3 py-2 text-[11px] text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-3 w-3" />
                        {c.job}
                      </span>
                      <span>{c.source}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-4 py-3">
                    <Link href={`/candidates/${c.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" fullWidth leftIcon={<Eye className="h-3.5 w-3.5" />}>
                        Profile
                      </Button>
                    </Link>

                    <AdvanceDropdown
                      candidate={c}
                      isOpen={advanceDropdownId === c.id}
                      onToggle={() => setAdvanceDropdownId(advanceDropdownId === c.id ? null : c.id)}
                      onAdvance={handleAdvance}
                    />

                    <button
                      onClick={() => setEmailTarget(c)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:bg-surface-soft hover:text-brand hover:border-brand/30"
                      title={`Email — ${statusLabels[c.status]}`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setScheduleTarget(c)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:bg-surface-soft hover:text-brand hover:border-brand/30"
                      title={`Schedule ${statusLabels[c.status]}`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-4 text-sm text-ink-muted sm:px-5">
          <p>Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCandidates)}–{Math.min(page * PAGE_SIZE, totalCandidates)} of {totalCandidates}</p>
          <nav className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-md border text-xs transition-colors ${
                  p === page ? "border-brand bg-brand text-white" : "border-line text-ink hover:bg-surface-soft"
                }`}>{p}</button>
            ))}
          </nav>
        </div>
      </Card>

      {(showSort || showFilter || advanceDropdownId !== null) && (
        <div className="fixed inset-0 z-[5]" onClick={() => { setShowSort(false); setShowFilter(false); setAdvanceDropdownId(null); }} />
      )}

      <Modal open={!!emailTarget} onClose={() => setEmailTarget(null)} size="md">
        <ModalHeader
          title={emailTarget ? `Email — ${statusLabels[emailTarget.status]}` : "Email Candidate"}
          subtitle={emailTarget ? `Send ${statusLabels[emailTarget.status].toLowerCase()} notification to ${emailTarget.name}` : ""}
          onClose={() => setEmailTarget(null)}
        >
          {emailTarget && ADVANCED_STATUSES.includes(emailTarget.status) && (
            <Badge tone={statusTone[emailTarget.status]} pill className="mb-2">{statusLabels[emailTarget.status]} Stage</Badge>
          )}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-4">
          {emailTarget && (
            <>
              <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
                <Avatar name={emailTarget.name} size={36} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{emailTarget.name}</p>
                  <p className="text-xs text-ink-muted">{emailTarget.title} · {emailTarget.matchScore}% Match</p>
                </div>
                <Badge tone={statusTone[emailTarget.status]} pill>{statusLabels[emailTarget.status]}</Badge>
              </div>
              <Field label="To"><Input defaultValue={`${emailTarget.name.toLowerCase().replace(/ /g, ".")}@example.com`} readOnly className="bg-surface-soft/50" /></Field>
              <Field label="Subject"><Input key={emailTarget.id + emailTarget.status} defaultValue={getEmailSubject(emailTarget)} /></Field>
              <Field label="Message">
                <Textarea key={emailTarget.id + emailTarget.status} rows={6} defaultValue={getEmailBody(emailTarget)} />
              </Field>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEmailTarget(null)}>Cancel</Button>
          <Button leftIcon={emailSent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            onClick={() => { setEmailSent(true); setTimeout(() => { setEmailSent(false); setEmailTarget(null); }, 1500); }}>
            {emailSent ? "Sent!" : "Send Email"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={!!scheduleTarget} onClose={() => setScheduleTarget(null)} size="md">
        <ModalHeader
          title={scheduleTarget ? getScheduleTitle(scheduleTarget) : "Schedule"}
          subtitle={scheduleTarget ? getScheduleSubtitle(scheduleTarget) : ""}
          onClose={() => setScheduleTarget(null)}
        >
          {scheduleTarget && (
            <Badge tone={statusTone[scheduleTarget.status]} pill className="mb-2">{statusLabels[scheduleTarget.status]} Stage</Badge>
          )}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-5">
          {scheduleTarget && (() => {
            const defaults = getScheduleDefaults(scheduleTarget);
            return (
              <>
                <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
                  <Avatar name={scheduleTarget.name} size={36} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{scheduleTarget.name}</p>
                    <p className="text-xs text-ink-muted">{scheduleTarget.title} · {scheduleTarget.job}</p>
                  </div>
                  <Badge tone={scheduleTarget.matchScore >= 90 ? "success" : "brand"} pill className="ml-auto">{scheduleTarget.matchScore}% Match</Badge>
                </div>

                <div className="flex items-center gap-3 rounded-md border border-brand/20 bg-brand-soft/20 p-3">
                  {(() => {
                    const opt = advanceOptions.find((o) => o.key === scheduleTarget.status);
                    const Icon = opt?.icon ?? Calendar;
                    return (
                      <>
                        <Icon className="h-5 w-5 text-brand" />
                        <div>
                          <p className="text-sm font-semibold text-ink">{opt?.label ?? "Meeting"}</p>
                          <p className="text-xs text-ink-muted">{opt?.desc ?? "Schedule a session"} · {defaults.duration}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {scheduleTarget.status === "interview" && (
                    <Field label="Interview Type">
                      <div className="flex gap-2">
                        {([{ icon: Video, label: "Video" }, { icon: Phone, label: "Phone" }, { icon: Users, label: "In Person" }] as const).map((type, i) => (
                          <button key={type.label} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-colors ${i === 0 ? "border-brand bg-brand-soft/30 text-brand" : "border-line text-ink-muted hover:bg-surface-soft"}`}>
                            <type.icon className="h-3.5 w-3.5" />{type.label}
                          </button>
                        ))}
                      </div>
                    </Field>
                  )}
                  <Field label={scheduleTarget.status === "interview" ? "Round" : "Session Type"}>
                    <Select key={scheduleTarget.id + scheduleTarget.status} defaultValue={defaults.round}>
                      {scheduleTarget.status === "interview" ? (
                        <>
                          <option value="phone">Phone Screen</option>
                          <option value="technical">Technical</option>
                          <option value="behavioral">Behavioral</option>
                          <option value="final">Final / Panel</option>
                        </>
                      ) : scheduleTarget.status === "exam" ? (
                        <>
                          <option value="exam">Online Proctored</option>
                          <option value="take-home">Take-Home Exam</option>
                          <option value="live">Live Coding</option>
                        </>
                      ) : scheduleTarget.status === "assessment" ? (
                        <>
                          <option value="assessment">Behavioral Assessment</option>
                          <option value="competency">Competency Evaluation</option>
                          <option value="personality">Personality Profile</option>
                        </>
                      ) : scheduleTarget.status === "practical" ? (
                        <>
                          <option value="practical">Project Presentation</option>
                          <option value="pair">Pair Programming</option>
                          <option value="design">Design Challenge</option>
                        </>
                      ) : (
                        <>
                          <option value="phone">Initial Call</option>
                          <option value="intro">Introduction Meeting</option>
                        </>
                      )}
                    </Select>
                  </Field>
                  <Field label="Date"><Input type="date" defaultValue="2026-04-18" /></Field>
                  <Field label="Time"><Input type="time" defaultValue="14:00" /></Field>
                </div>
                {scheduleTarget.status === "interview" && (
                  <Field label="Meeting Link"><Input placeholder="https://meet.google.com/..." /></Field>
                )}
                {scheduleTarget.status === "exam" && (
                  <Field label="Exam Platform Link"><Input placeholder="https://hackerrank.com/test/..." /></Field>
                )}
                {scheduleTarget.status === "practical" && (
                  <Field label="Project Repository / Brief"><Input placeholder="https://github.com/company/take-home-..." /></Field>
                )}
                <Field label="Notes">
                  <Textarea key={scheduleTarget.id + scheduleTarget.status} rows={2} defaultValue={defaults.notes} />
                </Field>
              </>
            );
          })()}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setScheduleTarget(null)}>Cancel</Button>
          <Button leftIcon={scheduleSent ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            onClick={() => { setScheduleSent(true); setTimeout(() => { setScheduleSent(false); setScheduleTarget(null); }, 1500); }}>
            {scheduleSent ? "Scheduled!" : scheduleTarget ? `Schedule ${statusLabels[scheduleTarget.status]}` : "Send Invite"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
