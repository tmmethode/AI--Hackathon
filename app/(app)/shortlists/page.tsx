"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Download, Filter, ArrowDownUp, Check, X, Trophy,
  Briefcase, ShieldCheck, FileDown, Plus, Search,
  MapPin, Users, Clock, CheckCircle2, FileText, Sheet, FileJson,
  Eye, TrendingUp, BarChart3, Sparkles, Calendar, Star,
  MessageSquare, Send, ChevronRight, Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { Textarea } from "@/components/ui/Input";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface Candidate {
  id: number; rank: number; name: string; title: string; match: number;
  skills: string[]; extras: number; summary: string; years: number;
  strength: string; cultureFit: string; retentionRisk: string;
  location: string; email: string;
  matching: { label: string; value: number }[];
  status: "shortlisted" | "interview" | "rejected";
}

const initialCandidates: Candidate[] = [
  { id: 1, rank: 1, name: "Sarah Jenkins", title: "Senior Full Stack Engineer", match: 98, skills: ["React", "Node.js", "AWS"], extras: 2, summary: "Exceptional architectural depth with proven experience leading distributed teams at scale.", years: 8, strength: "Scalable Architecture", cultureFit: "High", retentionRisk: "Low", location: "Remote (EU)", email: "sarah.j@example.com", matching: [{ label: "System Design", value: 95 }, { label: "React / Next.js", value: 98 }, { label: "AWS Infrastructure", value: 82 }, { label: "Team Leadership", value: 75 }], status: "shortlisted" },
  { id: 2, rank: 2, name: "Michael Chen", title: "Technical Product Lead", match: 94, skills: ["Agile", "Python", "Product Roadmap"], extras: 1, summary: "Strong bridge between technical execution and business requirements; high culture fit score.", years: 6, strength: "Product Strategy", cultureFit: "High", retentionRisk: "Low", location: "Kigali, Rwanda", email: "m.chen@example.com", matching: [{ label: "System Design", value: 88 }, { label: "React / Next.js", value: 72 }, { label: "AWS Infrastructure", value: 65 }, { label: "Team Leadership", value: 91 }], status: "shortlisted" },
  { id: 3, rank: 3, name: "Elena Rodriguez", title: "DevOps & Infrastructure Specialist", match: 91, skills: ["Kubernetes", "Terraform", "CI/CD"], extras: 1, summary: "Infrastructure veteran with a focus on security automation and high-availability systems.", years: 7, strength: "Infrastructure Automation", cultureFit: "Medium", retentionRisk: "Medium", location: "Remote (US)", email: "elena.r@example.com", matching: [{ label: "System Design", value: 90 }, { label: "React / Next.js", value: 40 }, { label: "AWS Infrastructure", value: 97 }, { label: "Team Leadership", value: 68 }], status: "shortlisted" },
  { id: 4, rank: 4, name: "David Okafor", title: "Backend Architect", match: 88, skills: ["Java", "Spring Boot", "Kafka"], extras: 1, summary: "High performance in technical assessment tests; specialized in message-driven architectures.", years: 9, strength: "Distributed Systems", cultureFit: "High", retentionRisk: "Low", location: "Lagos, Nigeria", email: "david.o@example.com", matching: [{ label: "System Design", value: 93 }, { label: "React / Next.js", value: 30 }, { label: "AWS Infrastructure", value: 78 }, { label: "Team Leadership", value: 80 }], status: "shortlisted" },
  { id: 5, rank: 5, name: "Aisha Gupta", title: "Frontend Developer", match: 85, skills: ["TypeScript", "Tailwind", "Next.js"], extras: 1, summary: "Design-centric engineer with exceptional attention to detail in UI/UX implementation.", years: 4, strength: "UI/UX Engineering", cultureFit: "High", retentionRisk: "Low", location: "Remote (IN)", email: "aisha.g@example.com", matching: [{ label: "System Design", value: 70 }, { label: "React / Next.js", value: 95 }, { label: "AWS Infrastructure", value: 50 }, { label: "Team Leadership", value: 60 }], status: "shortlisted" },
  { id: 6, rank: 6, name: "James Osei", title: "Cloud Engineer", match: 80, skills: ["GCP", "Docker", "Python"], extras: 2, summary: "Solid cloud-native background with strong automation skills across multi-cloud environments.", years: 5, strength: "Cloud Automation", cultureFit: "Medium", retentionRisk: "Medium", location: "Accra, Ghana", email: "james.o@example.com", matching: [{ label: "System Design", value: 78 }, { label: "React / Next.js", value: 35 }, { label: "AWS Infrastructure", value: 88 }, { label: "Team Leadership", value: 55 }], status: "shortlisted" },
  { id: 7, rank: 7, name: "Priya Nair", title: "Data Engineer", match: 76, skills: ["Spark", "SQL", "Airflow"], extras: 1, summary: "Strong data pipeline experience with a focus on real-time analytics and data quality.", years: 5, strength: "Data Pipelines", cultureFit: "High", retentionRisk: "Low", location: "Bangalore, India", email: "priya.n@example.com", matching: [{ label: "System Design", value: 72 }, { label: "React / Next.js", value: 20 }, { label: "AWS Infrastructure", value: 70 }, { label: "Team Leadership", value: 65 }], status: "shortlisted" },
];

type SortKey = "rank" | "match" | "name" | "years";
type FilterStatus = "all" | "shortlisted" | "interview" | "rejected";
type ExportFormat = "csv" | "pdf" | "json";
const PAGE_SIZE = 5;

const jobDetails = {
  id: "SF-204", title: "Senior Full Stack Developer", dept: "Product Engineering",
  location: "Remote (Africa / Europe)", type: "Full-time Permanent",
  salary: "$70,000 – $110,000 USD", manager: "Marcus Chen",
  screened: 124, shortlisted: 20,
  skills: ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL", "System Design"],
  description: "We are looking for a senior full stack developer to join our core product team. The ideal candidate has 5+ years of experience building scalable SaaS applications and is comfortable owning both frontend and backend systems.",
  requirements: ["5+ years full stack experience", "Strong React & Node.js skills", "Experience with cloud infrastructure (AWS/GCP)", "Excellent communication skills"],
};

interface NoteEntry { author: string; text: string; time: string; }

export default function ShortlistsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [selectedId, setSelectedId] = useState<number>(1);
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
  const [compareIds, setCompareIds] = useState<number[]>([1, 2]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportDone, setExportDone] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<Record<number, NoteEntry[]>>({
    1: [{ author: "HR Sarah", text: "Candidate was very communicative during the initial phone screen. Excited about the team culture.", time: "2 days ago" }],
  });

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
      const lines = exportable.map((c) =>
        `#${c.rank} ${c.name} | ${c.title} | ${c.match}% match | ${c.skills.join(", ")}`
      );
      const blob = new Blob([`Shortlist Export\n\n${lines.join("\n")}`], { type: "text/plain" });
      triggerDownload(blob, "shortlist.txt");
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
      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
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

  function handleAction(id: number, action: "interview" | "rejected") {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, status: action } : c));
    const next = candidates.find((c) => c.id !== id && c.status === "shortlisted");
    if (next) setSelectedId(next.id);
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
    interview: candidates.filter((c) => c.status === "interview").length,
    rejected: candidates.filter((c) => c.status === "rejected").length,
  };

  const avgMatch = Math.round(candidates.reduce((s, c) => s + c.match, 0) / candidates.length);
  const topMatch = Math.max(...candidates.map((c) => c.match));

  // Score distribution for mini-chart
  const scoreRanges = [
    { label: "90-100%", count: candidates.filter((c) => c.match >= 90).length, color: "bg-success" },
    { label: "80-89%", count: candidates.filter((c) => c.match >= 80 && c.match < 90).length, color: "bg-brand" },
    { label: "70-79%", count: candidates.filter((c) => c.match >= 70 && c.match < 80).length, color: "bg-brand/50" },
    { label: "<70%", count: candidates.filter((c) => c.match < 70).length, color: "bg-ink-muted/30" },
  ];
  const maxCount = Math.max(...scoreRanges.map((r) => r.count), 1);

  return (
    <div className="w-full px-6 py-5">
      {/* Job context header */}
      <Card className="mb-5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <Briefcase className="h-3.5 w-3.5" /> Current Job Context
              <Badge tone="success" pill>Active</Badge>
            </p>
            <h1 className="mt-1 font-display text-xl font-bold text-ink">Senior Full Stack Developer (SF-204)</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-muted">
              <span>Screened: <strong className="text-ink">124 Applicants</strong></span>
              <button onClick={() => { setFilterStatus("shortlisted"); setPage(1); }} className="hover:text-brand transition-colors">Shortlisted: <strong className="text-ink">{statusCounts.shortlisted}</strong></button>
              <button onClick={() => { setFilterStatus("interview"); setPage(1); }} className="hover:text-brand transition-colors">Interview: <strong className="text-success">{statusCounts.interview}</strong></button>
              <button onClick={() => { setFilterStatus("rejected"); setPage(1); }} className="hover:text-brand transition-colors">Rejected: <strong className="text-danger">{statusCounts.rejected}</strong></button>
              {filterStatus !== "all" && (
                <button onClick={() => { setFilterStatus("all"); setPage(1); }} className="flex items-center gap-1 text-brand hover:underline">
                  <X className="h-3 w-3" /> Clear filter
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<Briefcase className="h-4 w-4" />} onClick={() => setShowJobModal(true)}>Job Details</Button>
            <Button variant="secondary" leftIcon={<BarChart3 className="h-4 w-4" />} onClick={() => setShowCompare(true)}>Compare</Button>
            <Button leftIcon={<Download className="h-4 w-4" />} onClick={() => setShowExportModal(true)}>Export</Button>
          </div>
        </div>
      </Card>

      {/* Metrics row */}
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
              <p className="text-xs text-ink-muted">Ready for Interview</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{statusCounts.interview}</p>
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
          {/* Toolbar */}
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
                  className="h-8 rounded-md border border-line bg-white pl-8 pr-3 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div className="relative">
                <Button variant="secondary" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}
                  onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}>
                  Filter
                </Button>
                {showFilter && (
                  <div className="absolute right-0 top-9 z-10 w-44 rounded-md border border-line bg-white shadow-card">
                    {(["all", "shortlisted", "interview", "rejected"] as FilterStatus[]).map((s) => (
                      <button key={s} onClick={() => { setFilterStatus(s); setShowFilter(false); setPage(1); }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-sm capitalize hover:bg-surface-soft ${filterStatus === s ? "text-brand font-medium" : "text-ink"}`}>
                        {s} {filterStatus === s && <Check className="h-3.5 w-3.5" />}
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
                  <div className="absolute right-0 top-9 z-10 w-44 rounded-md border border-line bg-white shadow-card">
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

          {/* Candidate list */}
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
                      {/* Mini match bars */}
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
                    <div className="flex gap-2 md:flex-col" onClick={(e) => e.stopPropagation()}>
                      <Button variant="secondary" size="sm" leftIcon={<X className="h-3.5 w-3.5" />}
                        onClick={() => handleAction(c.id, "rejected")}
                        disabled={c.status === "rejected"}>
                        Reject
                      </Button>
                      <Button size="sm" leftIcon={<Check className="h-3.5 w-3.5" />}
                        onClick={() => handleAction(c.id, "interview")}
                        disabled={c.status === "interview"}>
                        Interview
                      </Button>
                      <Link href={`/candidates/${c.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>
                          Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
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

        {/* Deep dive panel */}
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
                  <Link href={`/candidates/${selected.id}`}>
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

      {(showSort || showFilter) && (
        <div className="fixed inset-0 z-[5]" onClick={() => { setShowSort(false); setShowFilter(false); }} />
      )}

      {/* Job Details Modal */}
      <Modal open={showJobModal} onClose={() => setShowJobModal(false)} size="lg">
        <ModalHeader title={jobDetails.title} subtitle={`${jobDetails.dept} · ${jobDetails.id}`} onClose={() => setShowJobModal(false)}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">Job Details</p>
        </ModalHeader>
        <ModalBody className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <div><dt className="text-xs text-ink-muted">Location</dt><dd className="font-medium text-ink">{jobDetails.location}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <div><dt className="text-xs text-ink-muted">Type</dt><dd className="font-medium text-ink">{jobDetails.type}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <div><dt className="text-xs text-ink-muted">Hiring Manager</dt><dd className="font-medium text-ink">{jobDetails.manager}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <div><dt className="text-xs text-ink-muted">Salary Band</dt><dd className="font-medium text-ink">{jobDetails.salary}</dd></div>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Description</p>
            <p className="text-sm leading-6 text-ink">{jobDetails.description}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Requirements</p>
            <ul className="space-y-1.5">
              {jobDetails.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Required Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {jobDetails.skills.map((s) => <span key={s} className="rounded-md bg-surface-soft px-2.5 py-1 text-xs font-medium text-ink">{s}</span>)}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowJobModal(false)}>Close</Button>
        </ModalFooter>
      </Modal>

      {/* Export Modal */}
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

      {/* Add Note Modal */}
      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)} size="sm">
        <ModalHeader title="Add Recruiter Note" subtitle={`For ${selected.name}`} onClose={() => setShowNoteModal(false)} />
        <ModalBody className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
            <Avatar name={selected.name} size={32} />
            <div>
              <p className="text-sm font-medium text-ink">{selected.name}</p>
              <p className="text-xs text-ink-muted">{selected.title} · {selected.match}% Match</p>
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

      {/* Compare Candidates Modal */}
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
                className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
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
    </div>
  );
}
