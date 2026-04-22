"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Download, Filter, ArrowDownUp, Check, X, Trophy,
  Briefcase, ShieldCheck, FileDown, Plus, Search,
  MapPin, Users, Clock, CheckCircle2, FileText, Sheet, FileJson,
  Eye, TrendingUp, BarChart3, Sparkles, Calendar, Star,
  MessageSquare, Send, ChevronRight, Award, ChevronDown,
  ClipboardCheck, GraduationCap, Wrench, ArrowRight, LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { Textarea } from "@/components/ui/Input";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ShortlistsPageSkeleton } from "@/components/page-skeletons";
import { Skeleton } from "@/components/ui/Skeleton";
import { buildCandidateId } from "@/lib/candidates";
import { listAllApplicants, type ApplicantRecord } from "@/lib/applicants";
import { calculateApplicantExperienceYears } from "@/lib/experience";
import { createPdfFromLines } from "@/lib/pdf";
import {
  getShortlist,
  listShortlists,
  type ShortlistRecord,
  type ShortlistSummary,
} from "@/lib/shortlists";
import type { GeminiBatchScreeningResultEntry } from "@/lib/screening";

interface Candidate {
  id: number; rank: number; name: string; title: string; match: number;
  candidateRecordId: string;
  skills: string[]; extras: number; summary: string; years: number;
  strength: string; cultureFit: string; retentionRisk: string;
  location: string; email: string;
  matching: { label: string; value: number }[];
  status: "shortlisted" | "interview" | "exam" | "assessment" | "practical" | "rejected";
}

interface ScreeningJob {
  id: string;
  title: string;
  dept: string;
  location: string;
  type: string;
  salary: string;
  manager: string;
  screened: number;
  screenedDate: string;
  isCurrent: boolean;
  skills: string[];
  description: string;
  requirements: string[];
  candidates: Candidate[];
}

function formatScreenedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function nameFromEntry(fullName: string, email: string): string {
  const trimmed = (fullName || "").trim();
  return trimmed || email || "Unknown";
}

function cultureFitFromScore(score: number): string {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function retentionRiskFromScore(confidenceScore: number): string {
  if (confidenceScore >= 70) return "Low";
  if (confidenceScore >= 40) return "Medium";
  return "High";
}

function buildCandidateFromResult(
  entry: GeminiBatchScreeningResultEntry,
  shortlistJobId: string,
  candidateKey: number,
  pillarLabels: { skills: string; experience: string; education: string; relevance: string },
  shortlistedEmails: Set<string>,
  experienceYears: number
): Candidate {
  const strengths = entry.strengths || [];
  const primaryStrength = strengths[0] || "—";
  const emailKey = entry.applicantEmail.trim().toLowerCase();

  return {
    id: candidateKey,
    rank: entry.candidateRank,
    candidateRecordId: buildCandidateId(shortlistJobId, entry.applicantEmail),
    name: nameFromEntry(entry.fullName, entry.applicantEmail),
    title: entry.finalRecommendation,
    match: entry.matchScore,
    skills: strengths.slice(0, 3),
    extras: Math.max(0, strengths.length - 3),
    summary:
      entry.summaryExplanation ||
      "AI explanation was generated only for the top-ranked candidates in this run.",
    years: experienceYears,
    strength: primaryStrength,
    cultureFit: cultureFitFromScore(entry.relevanceScore),
    retentionRisk: retentionRiskFromScore(entry.confidenceScore),
    location: "—",
    email: entry.applicantEmail,
    matching: [
      { label: pillarLabels.skills, value: entry.skillsScore },
      { label: pillarLabels.experience, value: entry.experienceScore },
      { label: pillarLabels.education, value: entry.educationScore },
      { label: pillarLabels.relevance, value: entry.relevanceScore },
    ],
    status: shortlistedEmails.has(emailKey) ? "shortlisted" : "rejected",
  };
}

function buildScreeningJobFromSummary(summary: ShortlistSummary, isCurrent: boolean): ScreeningJob {
  return {
    id: summary._id,
    title: summary.jobTitle,
    dept: summary.department || "—",
    location: "—",
    type: "—",
    salary: "—",
    manager: "—",
    screened: summary.totalApplicants,
    screenedDate: formatScreenedDate(summary.createdAt),
    isCurrent,
    skills: [],
    description: summary.runName,
    requirements: [],
    candidates: [],
  };
}

function buildCandidatesFromRecord(record: ShortlistRecord, applicants: ApplicantRecord[]): Candidate[] {
  const labels = {
    skills: "Skills Match",
    experience: "Experience Match",
    education: "Education Match",
    relevance: "Overall Relevance",
  };
  const shortlistedEmails = new Set(
    (record.shortlist || []).map((entry) => entry.applicantEmail.trim().toLowerCase())
  );
  const applicantsByEmail = new Map(
    applicants.map((applicant) => [applicant.email.trim().toLowerCase(), applicant])
  );

  return (record.screeningResults || []).map((entry, index) => {
    const applicant = applicantsByEmail.get(entry.applicantEmail.trim().toLowerCase());
    return buildCandidateFromResult(
      entry,
      record.job,
      index + 1,
      labels,
      shortlistedEmails,
      calculateApplicantExperienceYears(applicant)
    );
  });
}

type SortKey = "rank" | "match" | "name" | "years";
type FilterStatus = "all" | "shortlisted" | "interview" | "exam" | "assessment" | "practical" | "rejected" | "advanced";

const advanceOptions = [
  { key: "interview" as const, label: "Interview", icon: Calendar, desc: "Schedule a screening or panel interview" },
  { key: "exam" as const, label: "Technical Exam", icon: ClipboardCheck, desc: "Assign a written or online technical test" },
  { key: "assessment" as const, label: "Assessment", icon: GraduationCap, desc: "Behavioral or competency assessment" },
  { key: "practical" as const, label: "Practical Test", icon: Wrench, desc: "Hands-on project or take-home assignment" },
];

type AdvanceStatus = typeof advanceOptions[number]["key"];
type ExportFormat = "csv" | "pdf" | "json";
const PAGE_SIZE = 10;

interface NoteEntry { author: string; text: string; time: string; }

function ShortlistsPageInner() {
  const searchParams = useSearchParams();
  const requestedId = searchParams?.get("id") ?? "";

  const [screeningJobs, setScreeningJobs] = useState<ScreeningJob[]>([]);
  const [candidatesByJob, setCandidatesByJob] = useState<Record<string, Candidate[]>>({});
  const [activeJobId, setActiveJobId] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadJobsError, setLoadJobsError] = useState("");
  const [loadingActiveJob, setLoadingActiveJob] = useState(false);
  const [loadActiveJobError, setLoadActiveJobError] = useState("");

  const activeJob =
    screeningJobs.find((j) => j.id === activeJobId) ?? screeningJobs[0] ?? null;
  const candidates = candidatesByJob[activeJobId] ?? [];

  const [selectedId, setSelectedId] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [advanceDropdownId, setAdvanceDropdownId] = useState<number | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([0, 0]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportDone, setExportDone] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<Record<number, NoteEntry[]>>({});
  const [showNextStepModal, setShowNextStepModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSummaries() {
      setLoadingJobs(true);
      setLoadJobsError("");

      try {
        const response = await listShortlists({ page: 1, pageSize: 100 });

        if (cancelled) {
          return;
        }

        const requestedMatchesSummary =
          requestedId &&
          response.data.some((summary) => summary._id === requestedId);
        const initialActiveId = requestedMatchesSummary
          ? requestedId
          : response.data[0]?._id || "";

        const jobs = response.data.map((summary) =>
          buildScreeningJobFromSummary(summary, summary._id === initialActiveId)
        );

        setScreeningJobs(jobs);
        setActiveJobId(initialActiveId);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setScreeningJobs([]);
        setActiveJobId("");
        setLoadJobsError(
          error instanceof Error ? error.message : "Failed to load shortlists."
        );
      } finally {
        if (!cancelled) {
          setLoadingJobs(false);
        }
      }
    }

    void loadSummaries();

    return () => {
      cancelled = true;
    };
  }, [requestedId]);

  useEffect(() => {
    if (!activeJobId) {
      return;
    }

    if (candidatesByJob[activeJobId]) {
      return;
    }

    let cancelled = false;

    async function loadActiveJob() {
      setLoadingActiveJob(true);
      setLoadActiveJobError("");

      try {
        const response = await getShortlist(activeJobId);
        const applicants = await listAllApplicants(response.data.job);

        if (cancelled) {
          return;
        }

        const nextCandidates = buildCandidatesFromRecord(response.data, applicants);
        setCandidatesByJob((prev) => ({ ...prev, [activeJobId]: nextCandidates }));
        setSelectedId(nextCandidates[0]?.id ?? 0);
        setCompareIds([nextCandidates[0]?.id ?? 0, nextCandidates[1]?.id ?? 0]);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadActiveJobError(
          error instanceof Error ? error.message : "Failed to load shortlist detail."
        );
      } finally {
        if (!cancelled) {
          setLoadingActiveJob(false);
        }
      }
    }

    void loadActiveJob();

    return () => {
      cancelled = true;
    };
  }, [activeJobId, candidatesByJob]);

  function handleSwitchJob(jobId: string) {
    setActiveJobId(jobId);
    const job = screeningJobs.find((j) => j.id === jobId);
    const jobCandidates = candidatesByJob[jobId] ?? job?.candidates ?? [];
    setSelectedId(jobCandidates[0]?.id ?? 0);
    setCompareIds([jobCandidates[0]?.id ?? 0, jobCandidates[1]?.id ?? 0]);
    setSearch("");
    setSortKey("rank");
    setSortAsc(true);
    setFilterStatus("all");
    setPage(1);
  }

  function setCandidates(updater: (prev: Candidate[]) => Candidate[]) {
    setCandidatesByJob((prev) => ({ ...prev, [activeJobId]: updater(prev[activeJobId] ?? []) }));
  }

  function handleExport() {
    const exportable = candidates.filter((c) => c.status !== "rejected");
    if (exportFormat === "csv") {
      const header = "Rank,Name,Title,Match %,Skills,Status,Years";
      const rows = exportable.map((c) =>
        `${c.rank},"${c.name}","${c.title}",${c.match},"${c.skills.join("; ")}",${c.status},${c.years}`
      );
      const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
      triggerDownload(blob, "shortlist.csv");
    } else if (exportFormat === "json") {
      const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: "application/json" });
      triggerDownload(blob, "shortlist.json");
    } else {
      const lines = [
        "Shortlist Export",
        `Role: ${activeJob?.title || "—"}`,
        `Run: ${activeJob?.description || "—"}`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        "Candidates",
        ...exportable.flatMap((candidate) => [
          `#${candidate.rank} ${candidate.name}` ,
          `Title: ${candidate.title}`,
          `Match: ${candidate.match}% | Experience: ${candidate.years} years | Status: ${candidate.status}`,
          `Skills: ${candidate.skills.join(", ") || "—"}` ,
          `Summary: ${candidate.summary || "No AI summary available."}` ,
          "",
        ]),
      ];
      const blob = createPdfFromLines(lines);
      triggerDownload(blob, "shortlist.pdf");
    }
    setExportDone(true);
    setTimeout(() => { setExportDone(false); setShowExportModal(false); }, 1500);
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => {
    let list = candidates.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      let matchesStatus: boolean;
      if (filterStatus === "all") matchesStatus = true;
      else if (filterStatus === "advanced") matchesStatus = c.status !== "shortlisted" && c.status !== "rejected";
      else matchesStatus = c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
    list = [...list].sort((a, b) => {
      let val: number;
      if (sortKey === "name") val = a.name.localeCompare(b.name);
      else if (sortKey === "years") val = a.years - b.years;
      else if (sortKey === "match") val = a.match - b.match;
      else val = a.rank - b.rank;
      return sortAsc ? val : -val;
    });
    return list;
  }, [candidates, search, sortKey, sortAsc, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = candidates.find((c) => c.id === selectedId) ?? candidates[0];

  function handleAction(id: number, action: AdvanceStatus | "rejected") {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, status: action } : c));
    const next = candidates.find((c) => c.id !== id && c.status === "shortlisted");
    if (next) setSelectedId(next.id);
    setAdvanceDropdownId(null);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
    setShowSort(false); setPage(1);
  }

  function handleAddNote() {
    if (!noteText.trim()) return;
    const entry: NoteEntry = { author: "You", text: noteText.trim(), time: "Just now" };
    setNotes((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), entry] }));
    setNoteText("");
    setShowNoteModal(false);
  }

  const statusCounts = {
    shortlisted: candidates.filter((c) => c.status === "shortlisted").length,
    advanced: candidates.filter((c) => ["interview", "exam", "assessment", "practical"].includes(c.status)).length,
    interview: candidates.filter((c) => c.status === "interview").length,
    exam: candidates.filter((c) => c.status === "exam").length,
    assessment: candidates.filter((c) => c.status === "assessment").length,
    practical: candidates.filter((c) => c.status === "practical").length,
    rejected: candidates.filter((c) => c.status === "rejected").length,
  };

  const avgMatch = candidates.length
    ? Math.round(candidates.reduce((s, c) => s + c.match, 0) / candidates.length)
    : 0;
  const topMatch = candidates.length ? Math.max(...candidates.map((c) => c.match)) : 0;

  // Score distribution for mini-chart
  const scoreRanges = [
    { label: "90-100%", count: candidates.filter((c) => c.match >= 90).length, color: "bg-success" },
    { label: "80-89%", count: candidates.filter((c) => c.match >= 80 && c.match < 90).length, color: "bg-brand" },
    { label: "70-79%", count: candidates.filter((c) => c.match >= 70 && c.match < 80).length, color: "bg-brand/50" },
    { label: "<70%", count: candidates.filter((c) => c.match < 70).length, color: "bg-ink-muted/30" },
  ];
  const maxCount = Math.max(...scoreRanges.map((r) => r.count), 1);

  if (loadingJobs) {
    return <ShortlistsPageSkeleton />;
  }

  if (loadJobsError) {
    return (
      <div className="w-full px-6 py-5">
        <Card className="p-8 text-center">
          <h2 className="font-display text-lg font-semibold text-ink">
            Couldn&apos;t load shortlists
          </h2>
          <p className="mt-2 text-sm text-danger">{loadJobsError}</p>
        </Card>
      </div>
    );
  }

  if (!activeJob || screeningJobs.length === 0) {
    return (
      <div className="w-full px-6 py-5">
        <Card className="p-8 text-center">
          <h2 className="font-display text-lg font-semibold text-ink">
            No Shortlists Yet
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Run a screening to generate a ranked shortlist. Results you save here will
            appear in this view.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/screening" className="contents">
              <Button>Run Screening</Button>
            </Link>
            <Link href="/jobs" className="contents">
              <Button variant="secondary">Back to Jobs</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-5">
      {loadActiveJobError && (
        <div className="mb-5 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadActiveJobError}
        </div>
      )}
      {loadingActiveJob && candidates.length === 0 && (
        <Card className="mb-5 p-5">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-full" delayIndex={1} />
            <Skeleton className="h-12 w-full" delayIndex={2} />
          </div>
        </Card>
      )}
      <Card className="mb-5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="relative">
              <button
                onClick={() => setShowJobPicker((v) => !v)}
                className="group flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left transition-all hover:border-brand/40 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand/10">
                  <Briefcase className="h-5 w-5 text-brand" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-lg font-bold text-ink truncate">{activeJob.title}</h1>
                    {activeJob.isCurrent ? (
                      <Badge tone="success" pill>Current</Badge>
                    ) : (
                      <Badge tone="neutral" pill>{activeJob.screenedDate}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">{activeJob.dept} · {activeJob.location} · {activeJob.id}</p>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${showJobPicker ? "rotate-180" : ""}`} />
              </button>

              {showJobPicker && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-full rounded-lg border border-line bg-surface shadow-xl">
                  <p className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Switch Screening Job</p>
                  <ul className="max-h-64 overflow-y-auto pb-2">
                    {screeningJobs.map((j) => {
                      const jobCandidates = candidatesByJob[j.id] ?? j.candidates;
                      const isActive = j.id === activeJobId;
                      return (
                        <li key={j.id}>
                          <button
                            onClick={() => { handleSwitchJob(j.id); setShowJobPicker(false); }}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                              isActive ? "bg-brand-soft/30" : "hover:bg-surface-soft"
                            }`}
                          >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                              isActive ? "bg-brand/10" : "bg-surface-soft"
                            }`}>
                              <Briefcase className={`h-4 w-4 ${isActive ? "text-brand" : "text-ink-muted"}`} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-semibold truncate ${isActive ? "text-brand" : "text-ink"}`}>{j.title}</p>
                                {j.isCurrent && <Badge tone="success" pill className="text-[9px]">Current</Badge>}
                              </div>
                              <p className="text-[11px] text-ink-muted">
                                {j.dept} · {j.screened} screened · {j.screenedDate}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-ink">{jobCandidates.length}</p>
                              <p className="text-[9px] text-ink-muted">shortlisted</p>
                            </div>
                            {isActive && <Check className="h-4 w-4 shrink-0 text-brand" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
              <span>Screened: <strong className="text-ink">{activeJob.screened} Applicants</strong></span>
              <span className="text-line">|</span>
              <button onClick={() => { setFilterStatus("shortlisted"); setPage(1); }} className="hover:text-brand transition-colors">Shortlisted: <strong className="text-ink">{statusCounts.shortlisted}</strong></button>
              <button onClick={() => { setFilterStatus("advanced"); setPage(1); }} className="hover:text-brand transition-colors">Advanced: <strong className="text-success">{statusCounts.advanced}</strong></button>
              <button onClick={() => { setFilterStatus("rejected"); setPage(1); }} className="hover:text-brand transition-colors">Rejected: <strong className="text-danger">{statusCounts.rejected}</strong></button>
              {filterStatus !== "all" && (
                <button onClick={() => { setFilterStatus("all"); setPage(1); }} className="flex items-center gap-1 text-brand hover:underline">
                  <X className="h-3 w-3" /> Clear filter
                </button>
              )}
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:w-auto md:grid-cols-1 lg:grid-cols-2">
            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<Briefcase className="h-4 w-4" />}
              onClick={() => setShowJobModal(true)}
            >
              Job Details
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<BarChart3 className="h-4 w-4" />}
              onClick={() => setShowCompare(true)}
            >
              Compare
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setShowExportModal(true)}
            >
              Export
            </Button>
            <Button
              className="w-full"
              leftIcon={<ChevronRight className="h-4 w-4" />}
              onClick={() => setShowNextStepModal(true)}
            >
              Continue to Candidates
            </Button>
          </div>
        </div>
      </Card>

      {showJobPicker && (
        <div className="fixed inset-0 z-[15]" onClick={() => setShowJobPicker(false)} />
      )}

      <section className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-ink-muted">Average Match</p>
              <p className="mt-1 font-display text-2xl font-bold text-brand">{avgMatch}%</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10"><TrendingUp className="h-4 w-4 text-brand" /></span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-ink-muted">Top Score</p>
              <p className="mt-1 font-display text-2xl font-bold text-success">{topMatch}%</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10"><Trophy className="h-4 w-4 text-success" /></span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-ink-muted">Advanced to Next Step</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{statusCounts.advanced}</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10"><Calendar className="h-4 w-4 text-success" /></span>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-muted">Score Distribution</p>
          <div className="mt-2 flex items-end gap-1" style={{ height: 32 }}>
            {scoreRanges.map((r) => (
              <div key={r.label} className="group relative flex-1">
                <div
                  className={`w-full rounded-sm ${r.color} transition-all group-hover:opacity-80`}
                  style={{ height: Math.max(4, (r.count / maxCount) * 32) }}
                />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {r.label}: {r.count}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[8px] text-ink-muted">
            <span>90+</span><span>80s</span><span>70s</span><span>&lt;70</span>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              Ranked Candidates <Badge tone="neutral">{filtered.length} Total</Badge>
            </h2>
            <div className="relative ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                <input
                  placeholder="Search name or skill…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-8 rounded-md border border-line bg-surface pl-8 pr-3 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div className="relative">
                <Button variant="secondary" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}
                  onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}>
                  Filter
                </Button>
                {showFilter && (
                  <div className="absolute right-0 top-9 z-10 w-44 rounded-md border border-line bg-surface shadow-card">
                    {(["all", "shortlisted", "advanced", "interview", "exam", "assessment", "practical", "rejected"] as FilterStatus[]).map((s) => {
                      const labels: Record<FilterStatus, string> = {
                        all: "All", shortlisted: "Shortlisted", advanced: "All Advanced",
                        interview: "Interview", exam: "Technical Exam",
                        assessment: "Assessment", practical: "Practical Test", rejected: "Rejected",
                      };
                      return (
                      <button key={s} onClick={() => { setFilterStatus(s); setShowFilter(false); setPage(1); }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-surface-soft ${filterStatus === s ? "text-brand font-medium" : "text-ink"} ${s === "advanced" ? "border-b border-line" : ""}`}>
                        {labels[s]} {filterStatus === s && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                    })}
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
                    {([["rank", "By Rank"], ["match", "By Match %"], ["name", "By Name"], ["years", "By Experience"]] as [SortKey, string][]).map(([key, label]) => (
                      <button key={key} onClick={() => handleSort(key)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-surface-soft ${sortKey === key ? "text-brand font-medium" : "text-ink"}`}>
                        {label} {sortKey === key && <span className="text-xs">{sortAsc ? "↑" : "↓"}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {paginated.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">No candidates match your filters.</div>
          ) : (
            <ul className="divide-y divide-line">
              {paginated.map((c) => (
                <li key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`cursor-pointer p-5 transition-colors ${selectedId === c.id ? "bg-brand-soft/30" : "hover:bg-surface-soft/40"} ${c.status === "rejected" ? "opacity-50" : ""}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                        c.rank === 1 ? "bg-success/10 text-success" : c.rank <= 3 ? "bg-brand/10 text-brand" : "bg-surface-soft text-ink-subtle"
                      }`}>
                        {c.rank}
                      </div>
                      <Avatar name={c.name} size={44} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink">{c.name}</h3>
                        {c.rank === 1 && <Badge tone="success" pill><Trophy className="h-3 w-3" /> Top Pick</Badge>}
                        {c.rank === 2 && <Badge tone="brand" pill><Star className="h-3 w-3" /> Runner Up</Badge>}
                        {c.status === "interview" && <Badge tone="success" pill>Interview</Badge>}
                        {c.status === "exam" && <Badge tone="brand" pill>Technical Exam</Badge>}
                        {c.status === "assessment" && <Badge tone="brand" pill>Assessment</Badge>}
                        {c.status === "practical" && <Badge tone="brand" pill>Practical Test</Badge>}
                        {c.status === "rejected" && <Badge tone="danger" pill>Rejected</Badge>}
                        <span className={`ml-auto text-sm font-bold ${c.match >= 90 ? "text-success" : c.match >= 80 ? "text-brand" : "text-ink-muted"}`}>
                          {c.match}% Match
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted">{c.title} · {c.years} yrs · {c.location}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.skills.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}
                        {c.extras > 0 && <Badge tone="neutral">+{c.extras}</Badge>}
                      </div>
                      <blockquote className="mt-3 rounded-md bg-surface-soft/50 px-3 py-2 text-xs italic text-ink-muted">
                        &ldquo;{c.summary}&rdquo;
                      </blockquote>
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {c.matching.map((m) => (
                          <div key={m.label} className="text-center">
                            <div className="mx-auto h-1 w-full overflow-hidden rounded-full bg-surface-soft">
                              <div className={`h-full rounded-full ${m.value >= 80 ? "bg-success" : m.value >= 50 ? "bg-brand" : "bg-ink-muted/40"}`} style={{ width: `${m.value}%` }} />
                            </div>
                            <p className="mt-0.5 text-[9px] text-ink-muted truncate">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:flex-col md:flex-nowrap md:items-end" onClick={(e) => e.stopPropagation()}>
                      <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" leftIcon={<X className="h-3.5 w-3.5" />}
                        onClick={() => handleAction(c.id, "rejected")}
                        disabled={c.status === "rejected"}>
                        Reject
                      </Button>

                      <div className="relative flex-1 sm:flex-none">
                        <Button size="sm" className="w-full" leftIcon={<Check className="h-3.5 w-3.5" />}
                          onClick={() => setAdvanceDropdownId(advanceDropdownId === c.id ? null : c.id)}
                          disabled={c.status !== "shortlisted"}>
                          Advance ▾
                        </Button>
                        {advanceDropdownId === c.id && (
                          <div className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-line bg-surface shadow-xl">
                            <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Advance to</p>
                            {advanceOptions.map((opt) => (
                              <button key={opt.key}
                                onClick={() => handleAction(c.id, opt.key)}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface-soft transition-colors">
                                <opt.icon className="h-4 w-4 shrink-0 text-brand" />
                                <div>
                                  <p className="text-sm font-medium text-ink">{opt.label}</p>
                                  <p className="text-[10px] text-ink-muted">{opt.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/candidates/${encodeURIComponent(c.candidateRecordId)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 sm:flex-none"
                      >
                        <Button variant="ghost" size="sm" className="w-full" leftIcon={<Eye className="h-3.5 w-3.5" />}>
                          Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-line px-5 py-4 text-sm text-ink-muted">
            <p>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <nav className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-md border text-xs transition-colors ${p === page ? "border-brand bg-brand text-white" : "border-line text-ink hover:bg-surface-soft"}`}>
                  {p}
                </button>
              ))}
            </nav>
          </div>
        </Card>

        <aside className="flex flex-col gap-5">
          {selected && (
            <>
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={selected.name} size={48} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Deep Dive</p>
                    <h3 className="mt-0.5 font-display text-lg font-bold text-ink">{selected.name}</h3>
                    <p className="text-xs text-ink-muted">Rank #{selected.rank} · {selected.title} · {selected.years} yrs</p>
                    <p className="text-xs text-ink-muted">{selected.location} · {selected.email}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-display text-3xl font-bold ${selected.match >= 90 ? "text-success" : "text-brand"}`}>{selected.match}%</p>
                    <p className="text-[10px] uppercase tracking-wider text-ink-muted">AI Match</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href={`/candidates/${encodeURIComponent(selected.candidateRecordId)}`}>
                    <Button variant="secondary" size="sm" fullWidth leftIcon={<Eye className="h-3.5 w-3.5" />}>
                      Full Profile
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" fullWidth leftIcon={<FileDown className="h-3.5 w-3.5" />}>
                    Resume
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand" />
                  <h4 className="text-sm font-semibold text-ink">AI Summary</h4>
                  <Badge tone="success" pill className="ml-auto">Verified</Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-ink">{selected.summary}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-md bg-surface-soft/60 p-2">
                    <dt className="text-ink-muted">Strength</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{selected.strength}</dd>
                  </div>
                  <div className="rounded-md bg-surface-soft/60 p-2">
                    <dt className="text-ink-muted">Culture Fit</dt>
                    <dd className={`mt-0.5 font-semibold ${selected.cultureFit === "High" ? "text-success" : "text-ink"}`}>{selected.cultureFit}</dd>
                  </div>
                  <div className="rounded-md bg-surface-soft/60 p-2">
                    <dt className="text-ink-muted">Retention</dt>
                    <dd className={`mt-0.5 font-semibold ${selected.retentionRisk === "Low" ? "text-success" : "text-ink"}`}>{selected.retentionRisk}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-5">
                <h4 className="text-sm font-semibold text-ink">Requirement Matching</h4>
                <ul className="mt-3 space-y-3">
                  {selected.matching.map((m) => (
                    <li key={m.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-ink">{m.label}</span>
                        <span className={`font-semibold ${m.value >= 80 ? "text-success" : m.value >= 50 ? "text-brand" : "text-danger"}`}>{m.value}%</span>
                      </div>
                      <Progress value={m.value} />
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <MessageSquare className="h-4 w-4 text-ink-muted" /> Notes
                    {(notes[selectedId]?.length ?? 0) > 0 && (
                      <Badge tone="brand" pill>{notes[selectedId].length}</Badge>
                    )}
                  </h4>
                  <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setShowNoteModal(true)}>
                    Add
                  </Button>
                </div>
                {(notes[selectedId]?.length ?? 0) === 0 ? (
                  <p className="mt-3 text-xs italic text-ink-muted">No notes yet for this candidate.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {notes[selectedId].map((n, i) => (
                      <li key={i} className="rounded-md border border-line p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-ink">{n.author}</span>
                          <span className="text-ink-muted">{n.time}</span>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-ink-muted">&ldquo;{n.text}&rdquo;</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}
        </aside>
      </div>

      {(showSort || showFilter || advanceDropdownId !== null) && (
        <div className="fixed inset-0 z-[5]" onClick={() => { setShowSort(false); setShowFilter(false); setAdvanceDropdownId(null); }} />
      )}

      <Modal open={showJobModal} onClose={() => setShowJobModal(false)} size="lg">
        <ModalHeader title={activeJob.title} subtitle={`${activeJob.dept} · ${activeJob.id}`} onClose={() => setShowJobModal(false)}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">Job Details</p>
        </ModalHeader>
        <ModalBody className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <div><dt className="text-xs text-ink-muted">Location</dt><dd className="font-medium text-ink">{activeJob.location}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <div><dt className="text-xs text-ink-muted">Type</dt><dd className="font-medium text-ink">{activeJob.type}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <div><dt className="text-xs text-ink-muted">Hiring Manager</dt><dd className="font-medium text-ink">{activeJob.manager}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <div><dt className="text-xs text-ink-muted">Salary Band</dt><dd className="font-medium text-ink">{activeJob.salary}</dd></div>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Description</p>
            <p className="text-sm leading-6 text-ink">{activeJob.description}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Requirements</p>
            <ul className="space-y-1.5">
              {activeJob.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Required Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {activeJob.skills.map((s) => <span key={s} className="rounded-md bg-surface-soft px-2.5 py-1 text-xs font-medium text-ink">{s}</span>)}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowJobModal(false)}>Close</Button>
        </ModalFooter>
      </Modal>

      <Modal open={showExportModal} onClose={() => setShowExportModal(false)} size="sm">
        <ModalHeader title="Export Shortlist" onClose={() => setShowExportModal(false)} />
        <ModalBody className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">Choose a format to export <strong className="text-ink">{candidates.filter(c => c.status !== "rejected").length} candidates</strong>.</p>
          <div className="flex flex-col gap-2">
            {(["csv", "pdf", "json"] as ExportFormat[]).map((fmt) => {
              const Icon = fmt === "csv" ? Sheet : fmt === "pdf" ? FileText : FileJson;
              const labels: Record<ExportFormat, string> = { csv: "CSV Spreadsheet", pdf: "PDF Report", json: "JSON Data" };
              const descs: Record<ExportFormat, string> = { csv: "Best for Excel / Google Sheets", pdf: "Formatted report for sharing", json: "Raw data for integrations" };
              return (
                <button key={fmt} onClick={() => setExportFormat(fmt)}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                    exportFormat === fmt ? "border-brand bg-brand-soft/30" : "border-line hover:bg-surface-soft"
                  }`}>
                  <Icon className={`h-5 w-5 shrink-0 ${exportFormat === fmt ? "text-brand" : "text-ink-muted"}`} />
                  <div>
                    <p className="text-sm font-medium text-ink">{labels[fmt]}</p>
                    <p className="text-xs text-ink-muted">{descs[fmt]}</p>
                  </div>
                  {exportFormat === fmt && <Check className="ml-auto h-4 w-4 text-brand" />}
                </button>
              );
            })}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button leftIcon={exportDone ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />} onClick={handleExport}>
            {exportDone ? "Downloaded!" : `Export as ${exportFormat.toUpperCase()}`}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showNoteModal && !!selected} onClose={() => setShowNoteModal(false)} size="sm">
        <ModalHeader title="Add Recruiter Note" subtitle={`For ${selected?.name ?? "—"}`} onClose={() => setShowNoteModal(false)} />
        <ModalBody className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
            <Avatar name={selected?.name ?? ""} size={32} />
            <div>
              <p className="text-sm font-medium text-ink">{selected?.name ?? ""}</p>
              <p className="text-xs text-ink-muted">{selected?.title ?? ""} · {selected?.match ?? 0}% Match</p>
            </div>
          </div>
          <Textarea
            rows={4}
            placeholder="Add your internal observations, interview prep notes, or feedback…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> Visible to hiring team only. Not shared with candidates.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setShowNoteModal(false); setNoteText(""); }}>Cancel</Button>
          <Button leftIcon={<Send className="h-4 w-4" />} onClick={handleAddNote} disabled={!noteText.trim()}>
            Save Note
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showCompare} onClose={() => setShowCompare(false)} size="xl">
        <ModalHeader title="Compare Candidates" subtitle="Side-by-side evaluation" onClose={() => setShowCompare(false)} />
        <ModalBody>
          <div className="mb-4 flex gap-3">
            {[0, 1].map((slot) => (
              <select
                key={slot}
                value={compareIds[slot]}
                onChange={(e) => {
                  const next = [...compareIds];
                  next[slot] = Number(e.target.value);
                  setCompareIds(next);
                }}
                className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>#{c.rank} {c.name} ({c.match}%)</option>
                ))}
              </select>
            ))}
          </div>

          {(() => {
            const a = candidates.find((c) => c.id === compareIds[0]);
            const b = candidates.find((c) => c.id === compareIds[1]);
            if (!a || !b) return null;
            return (
              <div className="grid grid-cols-2 gap-4">
                {[a, b].map((c) => (
                  <div key={c.id} className="rounded-lg border border-line p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size={40} />
                      <div>
                        <p className="font-semibold text-ink">{c.name}</p>
                        <p className="text-xs text-ink-muted">{c.title}</p>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className={`font-display text-4xl font-bold ${c.match >= 90 ? "text-success" : "text-brand"}`}>{c.match}%</p>
                      <p className="text-[10px] uppercase tracking-wider text-ink-muted">Overall Match</p>
                    </div>

                    <dl className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded-md bg-surface-soft/60 p-2 text-center">
                        <dt className="text-ink-muted">Experience</dt>
                        <dd className="mt-0.5 font-bold text-ink">{c.years} yrs</dd>
                      </div>
                      <div className="rounded-md bg-surface-soft/60 p-2 text-center">
                        <dt className="text-ink-muted">Culture</dt>
                        <dd className={`mt-0.5 font-bold ${c.cultureFit === "High" ? "text-success" : "text-ink"}`}>{c.cultureFit}</dd>
                      </div>
                      <div className="rounded-md bg-surface-soft/60 p-2 text-center">
                        <dt className="text-ink-muted">Retention</dt>
                        <dd className={`mt-0.5 font-bold ${c.retentionRisk === "Low" ? "text-success" : "text-ink"}`}>{c.retentionRisk}</dd>
                      </div>
                    </dl>

                    <div className="mt-4 space-y-2">
                      {c.matching.map((m) => {
                        const otherCandidate = c.id === a.id ? b : a;
                        const otherVal = otherCandidate.matching.find((om) => om.label === m.label)?.value ?? 0;
                        const isHigher = m.value > otherVal;
                        return (
                          <div key={m.label}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-ink">{m.label}</span>
                              <span className={`font-semibold ${isHigher ? "text-success" : m.value === otherVal ? "text-ink" : "text-ink-muted"}`}>
                                {m.value}% {isHigher && "▲"}
                              </span>
                            </div>
                            <Progress value={m.value} />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1">
                      {c.skills.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowCompare(false)}>Close</Button>
        </ModalFooter>
      </Modal>

      <Modal open={showNextStepModal} onClose={() => setShowNextStepModal(false)} size="sm">
        <ModalBody className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Shortlist Reviewed!</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Great work! You&apos;ve reviewed the shortlisted candidates. Continue to the <strong className="text-ink">Candidate Pool</strong> to manage all candidates, send emails, and schedule interviews.
            </p>
          </div>

          <div className="w-full rounded-lg border border-line bg-surface-soft/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <Users className="h-5 w-5 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">Candidate Pool</p>
                <p className="text-xs text-ink-muted">Manage candidates, send emails, and schedule interviews</p>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Create Job</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Ingest</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Screen</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Shortlist</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">Candidates</span>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowNextStepModal(false)}>Stay Here</Button>
          <Link href="/candidates"><Button leftIcon={<Users className="h-4 w-4" />}>Go to Candidates</Button></Link>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default function ShortlistsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-6 py-5">
          <Card className="flex items-center justify-center gap-3 p-10 text-sm text-ink-muted">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading saved shortlists…
          </Card>
        </div>
      }
    >
      <ShortlistsPageInner />
    </Suspense>
  );
}
