"use client";

import { useState } from "react";
import {
  Download, FileText, Sheet, FileJson, CheckCircle2,
  Filter, Search, Clock, Users,
  Eye, Check, Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";

type ExportFormat = "csv" | "pdf" | "json";
type ExportStatus = "ready" | "generating" | "expired";

interface ExportRecord {
  id: string;
  name: string;
  job: string;
  format: ExportFormat;
  candidates: number;
  createdAt: string;
  size: string;
  status: ExportStatus;
}

const exports: ExportRecord[] = [
  { id: "EXP-001", name: "Senior Frontend Engineer - Shortlist", job: "JOB-001", format: "csv", candidates: 20, createdAt: "2023-10-24 14:22", size: "245 KB", status: "ready" },
  { id: "EXP-002", name: "Full Stack Developer - Complete Report", job: "JOB-002", format: "pdf", candidates: 45, createdAt: "2023-10-23 09:15", size: "1.2 MB", status: "ready" },
  { id: "EXP-003", name: "Product Designer - AI Analysis", job: "JOB-003", format: "json", candidates: 12, createdAt: "2023-10-22 18:45", size: "89 KB", status: "ready" },
  { id: "EXP-004", name: "QA Automation Lead - Screening Data", job: "JOB-004", format: "csv", candidates: 112, createdAt: "2023-10-20 11:30", size: "780 KB", status: "ready" },
  { id: "EXP-005", name: "DevOps Architect - Final Ranking", job: "JOB-005", format: "pdf", candidates: 24, createdAt: "2023-10-18 16:00", size: "560 KB", status: "expired" },
];

const formatIcons: Record<ExportFormat, React.ComponentType<{ className?: string }>> = {
  csv: Sheet,
  pdf: FileText,
  json: FileJson,
};

const formatLabels: Record<ExportFormat, string> = {
  csv: "CSV Spreadsheet",
  pdf: "PDF Report",
  json: "JSON Data",
};

const statusLabels: Record<ExportStatus, string> = {
  ready: "Ready",
  generating: "Generating",
  expired: "Expired",
};

export default function ExportsPage() {
  const [showNewExport, setShowNewExport] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [exportDone, setExportDone] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExportStatus | "all">("all");
  const [formatFilter, setFormatFilter] = useState<ExportFormat | "all">("all");
  const [previewExp, setPreviewExp] = useState<ExportRecord | null>(null);

  // Sample preview data per export
  const previewData: Record<string, string[][]> = {
    "EXP-001": [["Rank","Name","Match %","Skills","Status"],["1","Sarah Jenkins","98%","React, Node.js, AWS","Interview"],["2","Michael Chen","94%","Agile, Python","Shortlisted"],["3","Elena Rodriguez","91%","Kubernetes, CI/CD","Shortlisted"]],
    "EXP-002": [["Rank","Name","Match %","Title","Status"],["1","David Okafor","88%","Backend Architect","Interview"],["2","Aisha Gupta","85%","Frontend Dev","Shortlisted"]],
    "EXP-003": [["Rank","Name","Match %","Skills","Status"],["1","Julie Tran","92%","Figma, Prototyping","Interview"]],
    "EXP-004": [["Rank","Name","Match %","Skills","Status"],["1","James Osei","95%","Selenium, Cypress","Interview"],["2","Priya Nair","87%","Jest, CI/CD","Shortlisted"]],
    "EXP-005": [["Rank","Name","Match %","Skills","Status"],["1","Robert Fox","77%","AWS, Terraform","Shortlisted"]],
  };

  function handleDownload(exp: ExportRecord) {
    const rows = previewData[exp.id] ?? [["No data available"]];
    let content = "";
    let mime = "text/plain";
    let filename = exp.name.replace(/\s+/g, "_");

    if (exp.format === "csv") {
      content = rows.map((r) => r.join(",")).join("\n");
      mime = "text/csv";
      filename += ".csv";
    } else if (exp.format === "json") {
      const headers = rows[0];
      const data = rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
      content = JSON.stringify(data, null, 2);
      mime = "application/json";
      filename += ".json";
    } else {
      content = rows.map((r) => r.join(" | ")).join("\n");
      mime = "text/plain";
      filename += ".txt";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const totalCandidates = exports.reduce((sum, exp) => sum + exp.candidates, 0);
  const readyExports = exports.filter((exp) => exp.status === "ready").length;
  const latestExport = exports[0];
  const latestExportTone =
    latestExport.status === "ready" ? "success" : latestExport.status === "generating" ? "brand" : "neutral";

  const filtered = exports.filter((exp) => {
    const matchesSearch =
      exp.name.toLowerCase().includes(search.toLowerCase()) ||
      exp.job.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    const matchesFormat = formatFilter === "all" || exp.format === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

  function handleGenerateExport() {
    setExportDone(true);
    setTimeout(() => {
      setExportDone(false);
      setShowNewExport(false);
    }, 1500);
  }

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Exports"
        description="Generate and download reports from your screening runs."
        actions={
          <Button leftIcon={<Download className="h-4 w-4" />} onClick={() => setShowNewExport(true)}>
            New Export
          </Button>
        }
      />

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-brand-soft via-surface to-surface-soft/80 p-6 dark:from-brand/10 dark:via-surface dark:to-surface-soft/20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[560px]">
                <div className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
                  <Sparkles className="h-3.5 w-3.5" />
                  Export Hub
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-ink">Package shortlist decisions into shareable hiring outputs</h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  Create recruiter-friendly exports for hiring managers, finance, or downstream systems without leaving the workflow.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                <div className="rounded-xl border border-line bg-surface/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Total Exports</p>
                  <p className="mt-2 font-display text-2xl font-bold text-ink">{exports.length}</p>
                </div>
                <div className="rounded-xl border border-line bg-surface/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Ready to Download</p>
                  <p className="mt-2 font-display text-2xl font-bold text-success">{readyExports}</p>
                </div>
                <div className="rounded-xl border border-line bg-surface/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Candidates Exported</p>
                  <p className="mt-2 font-display text-2xl font-bold text-brand">{totalCandidates}</p>
                </div>
                <div className="rounded-xl border border-line bg-surface/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Expired</p>
                  <p className="mt-2 font-display text-2xl font-bold text-ink-muted">
                    {exports.filter((exp) => exp.status === "expired").length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Latest Export</p>
          <div className="mt-4 rounded-xl border border-line bg-surface-soft/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                <Download className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{latestExport.name}</p>
                <p className="mt-1 text-xs text-ink-muted">{latestExport.job} · {latestExport.createdAt}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={latestExportTone} pill>{statusLabels[latestExport.status]}</Badge>
              <Badge tone="brand" pill>{formatLabels[latestExport.format]}</Badge>
              <Badge tone="neutral" pill>{latestExport.candidates} Candidates</Badge>
            </div>
            <Button variant="secondary" fullWidth className="mt-4" leftIcon={<Eye className="h-4 w-4" />}>
              Preview Export
            </Button>
          </div>
        </Card>
      </section>

      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Export History</h2>
            <p className="mt-1 text-sm text-ink-muted">Search, filter, and reopen previously generated exports.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[220px_auto] lg:min-w-[520px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                placeholder="Search exports…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-md border border-line bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </div>
              {(["all", "ready", "generating", "expired"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                    statusFilter === status ? "bg-brand text-white" : "bg-surface-soft text-ink-muted hover:bg-brand-soft hover:text-brand"
                  }`}
                >
                  {status === "all" ? "All Statuses" : statusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "csv", "pdf", "json"] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => setFormatFilter(format)}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                formatFilter === format ? "bg-brand text-white" : "bg-surface-soft text-ink-muted hover:bg-brand-soft hover:text-brand"
              }`}
            >
              {format === "all" ? "All Formats" : formatLabels[format]}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-4">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft/40">
              <Search className="h-6 w-6 text-brand" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">No matching exports</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Try a different search term or clear some filters to see more export history.
            </p>
          </Card>
        ) : (
          filtered.map((exp) => {
            const FormatIcon = formatIcons[exp.format];
            const statusTone =
              exp.status === "ready" ? "success" : exp.status === "generating" ? "brand" : "neutral";

            return (
              <Card key={exp.id} className="p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                      <FormatIcon className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink">{exp.name}</h3>
                        <Badge tone={statusTone} pill>{statusLabels[exp.status]}</Badge>
                        <Badge tone="neutral" pill>{formatLabels[exp.format]}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">{exp.id} · {exp.job}</p>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <Users className="h-3.5 w-3.5" />
                          <span><strong className="text-ink">{exp.candidates}</strong> candidates</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{exp.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{exp.size}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-[220px] lg:flex-col">
                    <Button
                      leftIcon={<Download className="h-4 w-4" />}
                      disabled={exp.status === "expired"}
                      fullWidth
                      onClick={() => handleDownload(exp)}
                    >
                      Download
                    </Button>
                    <Button variant="secondary" leftIcon={<Eye className="h-4 w-4" />} fullWidth
                      onClick={() => setPreviewExp(exp)}>
                      Preview
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Preview Modal */}
      {previewExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreviewExp(null)}>
          <div className="w-full max-w-2xl rounded-xl border border-line bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h2 className="font-display text-base font-bold text-ink">{previewExp.name}</h2>
                <p className="text-xs text-ink-muted">{previewExp.id} · {previewExp.candidates} candidates · {previewExp.size}</p>
              </div>
              <button onClick={() => setPreviewExp(null)} className="rounded-md p-1 text-ink-muted hover:bg-surface-soft">
                <Eye className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-soft/40">
                    {(previewData[previewExp.id]?.[0] ?? []).map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(previewData[previewExp.id]?.slice(1) ?? []).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-surface" : "bg-surface-soft/20"}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2.5 text-ink">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <Button variant="secondary" onClick={() => setPreviewExp(null)}>Close</Button>
              <Button leftIcon={<Download className="h-4 w-4" />} onClick={() => { handleDownload(previewExp); setPreviewExp(null); }}>
                Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Export Modal */}
      <Modal open={showNewExport} onClose={() => setShowNewExport(false)} size="sm">
        <ModalHeader title="Generate New Export" subtitle="Choose a format and configure your export." onClose={() => setShowNewExport(false)} />
        <ModalBody className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Select format</p>
            <div className="flex flex-col gap-2">
              {(["csv", "pdf", "json"] as ExportFormat[]).map((fmt) => {
                const Icon = formatIcons[fmt];
                const descs: Record<ExportFormat, string> = {
                  csv: "Best for Excel & Google Sheets",
                  pdf: "Formatted report for sharing",
                  json: "Raw data for integrations",
                };
                return (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                      selectedFormat === fmt ? "border-brand bg-brand-soft/30" : "border-line hover:bg-surface-soft"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${selectedFormat === fmt ? "text-brand" : "text-ink-muted"}`} />
                    <div>
                      <p className="text-sm font-medium text-ink">{formatLabels[fmt]}</p>
                      <p className="text-xs text-ink-muted">{descs[fmt]}</p>
                    </div>
                    {selectedFormat === fmt && <Check className="ml-auto h-4 w-4 text-brand" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-md bg-brand-soft/40 p-3 text-xs text-info-deep">
            <strong>Note:</strong> Exports include all non-rejected candidates from your most recent screening run.
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowNewExport(false)}>Cancel</Button>
          <Button
            leftIcon={exportDone ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            onClick={handleGenerateExport}
          >
            {exportDone ? "Generated!" : `Export as ${selectedFormat.toUpperCase()}`}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
