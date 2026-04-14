"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Filter, ArrowDownUp, Check, Users, Eye,
  Download, MoreHorizontal, Mail, Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";

interface Candidate {
  id: string;
  name: string;
  title: string;
  matchScore: number;
  skills: string[];
  experience: string;
  location: string;
  source: string;
  status: "shortlisted" | "interview" | "rejected" | "new";
  job: string;
  appliedDate: string;
}

const allCandidates: Candidate[] = [
  { id: "C-001", name: "Sarah Jenkins", title: "Senior Full Stack Engineer", matchScore: 98, skills: ["React", "Node.js", "AWS"], experience: "8 Years", location: "Remote (GMT+2)", source: "Umurava Platform", status: "shortlisted", job: "Senior Frontend Engineer", appliedDate: "2023-10-24" },
  { id: "C-002", name: "Michael Chen", title: "Technical Product Lead", matchScore: 94, skills: ["Agile", "Python", "Product"], experience: "6 Years", location: "Kigali, Rwanda", source: "CSV Import", status: "interview", job: "Senior Frontend Engineer", appliedDate: "2023-10-23" },
  { id: "C-003", name: "Elena Rodriguez", title: "DevOps & Infrastructure Specialist", matchScore: 91, skills: ["Kubernetes", "Terraform", "CI/CD"], experience: "7 Years", location: "Remote (US)", source: "PDF Upload", status: "shortlisted", job: "DevOps Architect", appliedDate: "2023-10-22" },
  { id: "C-004", name: "David Okafor", title: "Backend Architect", matchScore: 88, skills: ["Java", "Spring Boot", "Kafka"], experience: "9 Years", location: "Lagos, Nigeria", source: "Umurava Platform", status: "new", job: "Fullstack Developer", appliedDate: "2023-10-21" },
  { id: "C-005", name: "Aisha Gupta", title: "Frontend Developer", matchScore: 85, skills: ["TypeScript", "Tailwind", "Next.js"], experience: "4 Years", location: "Remote (EU)", source: "Linked Profile", status: "shortlisted", job: "Senior Frontend Engineer", appliedDate: "2023-10-20" },
  { id: "C-006", name: "James Osei", title: "Cloud Engineer", matchScore: 80, skills: ["GCP", "Docker", "Python"], experience: "5 Years", location: "Accra, Ghana", source: "Umurava Platform", status: "rejected", job: "DevOps Architect", appliedDate: "2023-10-19" },
  { id: "C-007", name: "Priya Nair", title: "Data Engineer", matchScore: 76, skills: ["Spark", "SQL", "Airflow"], experience: "5 Years", location: "Bangalore, India", source: "CSV Import", status: "new", job: "Data Scientist", appliedDate: "2023-10-18" },
  { id: "C-008", name: "Kevin Mwangi", title: "Full Stack Developer", matchScore: 72, skills: ["Python", "Django", "PostgreSQL"], experience: "7 Years", location: "Nairobi, Kenya", source: "PDF Upload", status: "interview", job: "Fullstack Developer", appliedDate: "2023-10-17" },
  { id: "C-009", name: "Julie Tran", title: "Product Designer", matchScore: 89, skills: ["Figma", "User Research", "Prototyping"], experience: "5 Years", location: "Ho Chi Minh, Vietnam", source: "Umurava Platform", status: "shortlisted", job: "Product Designer", appliedDate: "2023-10-16" },
  { id: "C-010", name: "Amara Diallo", title: "Junior Frontend Developer", matchScore: 65, skills: ["HTML", "CSS", "JavaScript"], experience: "2 Years", location: "Dakar, Senegal", source: "Linked Profile", status: "new", job: "Senior Frontend Engineer", appliedDate: "2023-10-15" },
];

const statusTone: Record<Candidate["status"], React.ComponentProps<typeof Badge>["tone"]> = {
  shortlisted: "brand",
  interview: "success",
  rejected: "danger",
  new: "neutral",
};

const statusLabels: Record<Candidate["status"], string> = {
  shortlisted: "Shortlisted",
  interview: "Interview",
  rejected: "Rejected",
  new: "New",
};

type SortKey = "matchScore" | "name" | "appliedDate";
type FilterStatus = "all" | "shortlisted" | "interview" | "rejected" | "new";
const PAGE_SIZE = 6;

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("matchScore");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const filtered = useMemo(() => {
    let list = allCandidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
    list = [...list].sort((a, b) => {
      let val: number;
      if (sortKey === "name") val = a.name.localeCompare(b.name);
      else if (sortKey === "appliedDate") val = a.appliedDate.localeCompare(b.appliedDate);
      else val = a.matchScore - b.matchScore;
      return sortAsc ? val : -val;
    });
    return list;
  }, [search, sortKey, sortAsc, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(key === "name"); }
    setShowSort(false);
    setPage(1);
  }

  const counts = {
    all: allCandidates.length,
    shortlisted: allCandidates.filter((c) => c.status === "shortlisted").length,
    interview: allCandidates.filter((c) => c.status === "interview").length,
    rejected: allCandidates.filter((c) => c.status === "rejected").length,
    new: allCandidates.filter((c) => c.status === "new").length,
  };

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Candidate Pool"
        description="Browse, search, and manage all candidates across your hiring pipeline."
        actions={
          <>
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>Export All</Button>
            <Link href="/ingest"><Button leftIcon={<Users className="h-4 w-4" />}>Ingest Candidates</Button></Link>
          </>
        }
      />

      {/* Stats row */}
      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {([
          { label: "Total Candidates", value: counts.all, tone: "brand" },
          { label: "Shortlisted", value: counts.shortlisted, tone: "brand" },
          { label: "In Interview", value: counts.interview, tone: "success" },
          { label: "New / Unreviewed", value: counts.new, tone: "neutral" },
        ] as const).map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-ink-muted">{s.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${
              s.tone === "success" ? "text-success" : s.tone === "brand" ? "text-brand" : "text-ink"
            }`}>{s.value}</p>
          </Card>
        ))}
      </section>

      {/* Toolbar + table */}
      <Card className="mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            All Candidates <Badge tone="neutral">{filtered.length}</Badge>
          </h2>

          <div className="relative ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                placeholder="Search name, title, or skill…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-8 w-52 rounded-md border border-line bg-white pl-8 pr-3 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Button variant="secondary" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}
                onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}>
                Filter
              </Button>
              {showFilter && (
                <div className="absolute right-0 top-9 z-10 w-44 rounded-md border border-line bg-white shadow-card">
                  {(["all", "shortlisted", "interview", "rejected", "new"] as FilterStatus[]).map((s) => (
                    <button key={s} onClick={() => { setFilterStatus(s); setShowFilter(false); setPage(1); }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm capitalize hover:bg-surface-soft ${
                        filterStatus === s ? "text-brand font-medium" : "text-ink"
                      }`}>
                      {s} ({counts[s]}) {filterStatus === s && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <Button variant="secondary" size="sm" leftIcon={<ArrowDownUp className="h-3.5 w-3.5" />}
                onClick={() => { setShowSort((v) => !v); setShowFilter(false); }}>
                Sort
              </Button>
              {showSort && (
                <div className="absolute right-0 top-9 z-10 w-44 rounded-md border border-line bg-white shadow-card">
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

        {/* Candidates grid */}
        {paginated.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-ink-muted">
            No candidates match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-2">
            {paginated.map((c) => (
              <div
                key={c.id}
                className={`flex flex-col gap-3 bg-white p-5 ${c.status === "rejected" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                      <Badge tone={statusTone[c.status]} pill>{statusLabels[c.status]}</Badge>
                    </div>
                    <p className="text-xs text-ink-muted">{c.title}</p>
                    <p className="mt-0.5 text-[10px] text-ink-muted">{c.location} · {c.experience}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      c.matchScore >= 90 ? "text-success" : c.matchScore >= 80 ? "text-brand" : "text-ink-muted"
                    }`}>{c.matchScore}%</p>
                    <p className="text-[9px] uppercase tracking-wider text-ink-muted">Match</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {c.skills.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}
                </div>

                <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-ink-muted">
                  <span>Job: {c.job}</span>
                  <span>{c.source}</span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/candidates/${c.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" fullWidth leftIcon={<Eye className="h-3.5 w-3.5" />}>
                      View Profile
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" leftIcon={<Mail className="h-3.5 w-3.5" />} />
                  <Button variant="ghost" size="sm" leftIcon={<Calendar className="h-3.5 w-3.5" />} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-line px-5 py-4 text-sm text-ink-muted">
          <p>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
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

      {/* Close dropdowns */}
      {(showSort || showFilter) && (
        <div className="fixed inset-0 z-[5]" onClick={() => { setShowSort(false); setShowFilter(false); }} />
      )}
    </div>
  );
}
