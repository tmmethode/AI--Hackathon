"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  Sheet,
  FileJson,
  CheckCircle2,
  Filter,
  Search,
  Clock,
  Users,
  Eye,
  Check,
  Sparkles,
  LoaderCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import {
  getShortlist,
  listAllShortlists,
  type ShortlistRecord,
  type ShortlistSummary,
} from "@/lib/shortlists";

type ExportFormat = "csv" | "pdf" | "json";
type ExportStatus = "ready" | "generating" | "expired";

interface ExportRecord {
  id: string;
  shortlistId: string;
  name: string;
  job: string;
  format: ExportFormat;
  candidates: number;
  createdAt: string;
  size: string;
  status: ExportStatus;
}

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

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapSummaryToExport(summary: ShortlistSummary, format: ExportFormat): ExportRecord {
  return {
    id: `EXP-${summary._id.slice(-6).toUpperCase()}-${format.toUpperCase()}`,
    shortlistId: summary._id,
    name: `${summary.jobTitle} - ${summary.runName}`,
    job: summary.jobTitle,
    format,
    candidates: summary.shortlistCount || summary.totalApplicants,
    createdAt: formatDateTime(summary.createdAt),
    size: "Calculated on download",
    status: "ready",
  };
}

function buildPreviewRows(record: ShortlistRecord): string[][] {
  const headers = ["Rank", "Name", "Email", "Match %", "Recommendation", "Summary"];
  const rows = (record.shortlist?.length ? record.shortlist : record.screeningResults)
    .slice(0, 10)
    .map((entry) => [
      String(entry.candidateRank ?? ""),
      entry.fullName || "Unknown",
      entry.applicantEmail,
      `${entry.matchScore ?? 0}%`,
      entry.finalRecommendation,
      (entry.summaryExplanation || "").replace(/\s+/g, " ").trim().slice(0, 120),
    ]);

  return [headers, ...rows];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadTextAsFile(content: string, mime: string, filename: string) {
  downloadBlob(new Blob([content], { type: mime }), filename);
}


function createSimplePdf(lines: string[]): Blob {
  const escaped = lines.map((line) =>
    line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
  );
  const content = escaped
    .map((line, index) => `BT /F1 10 Tf 50 ${780 - index * 14} Td (${line.slice(0, 110)}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export default function ExportsPage() {
  const [showNewExport, setShowNewExport] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [selectedShortlistId, setSelectedShortlistId] = useState("");
  const [exportDone, setExportDone] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExportStatus | "all">("all");
  const [formatFilter, setFormatFilter] = useState<ExportFormat | "all">("all");
  const [previewExp, setPreviewExp] = useState<ExportRecord | null>(null);
  const [summaries, setSummaries] = useState<ShortlistSummary[]>([]);
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [recordByShortlist, setRecordByShortlist] = useState<Record<string, ShortlistRecord>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await listAllShortlists({ pageSize: 100 });

        if (cancelled) {
          return;
        }

        setSummaries(data);
        setSelectedShortlistId(data[0]?._id ?? "");

        const hydrated = data.flatMap((summary) =>
          (["csv", "pdf", "json"] as ExportFormat[]).map((format) => mapSummaryToExport(summary, format))
        );
        setRecords(hydrated);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSummaries([]);
        setRecords([]);
        setLoadError(error instanceof Error ? error.message : "Failed to load export data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalCandidates = records.reduce((sum, exp) => sum + exp.candidates, 0);
  const readyExports = records.filter((exp) => exp.status === "ready").length;
  const latestExport = records[0] ?? null;
  const latestExportTone =
    latestExport?.status === "ready"
      ? "success"
      : latestExport?.status === "generating"
        ? "brand"
        : "neutral";

  const filtered = useMemo(() => records.filter((exp) => {
    const matchesSearch =
      exp.name.toLowerCase().includes(search.toLowerCase()) ||
      exp.job.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    const matchesFormat = formatFilter === "all" || exp.format === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  }), [records, search, statusFilter, formatFilter]);

  async function fetchRecord(shortlistId: string) {
    if (recordByShortlist[shortlistId]) {
      return recordByShortlist[shortlistId];
    }

    const response = await getShortlist(shortlistId);
    setRecordByShortlist((prev) => ({ ...prev, [shortlistId]: response.data }));
    return response.data;
  }

  async function handleDownload(exp: ExportRecord) {
    setActionBusy(true);
    setActionError("");

    try {
      const shortlist = await fetchRecord(exp.shortlistId);
      const rows = buildPreviewRows(shortlist);
      const safeBase = `${shortlist.jobTitle}_${shortlist.runName}`.replace(/\s+/g, "_");

      if (exp.format === "csv") {
        const csv = rows
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(","))
          .join("\n");
        downloadTextAsFile(csv, "text/csv", `${safeBase}.csv`);
      } else if (exp.format === "json") {
        const headers = rows[0];
        const data = rows.slice(1).map((row) =>
          Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
        );
        downloadTextAsFile(JSON.stringify(data, null, 2), "application/json", `${safeBase}.json`);
      } else {
        const lines = [
          `Job: ${shortlist.jobTitle}`,
          `Run: ${shortlist.runName}`,
          `Created: ${formatDateTime(shortlist.createdAt)}`,
          "",
          ...rows.map((row) => row.join(" | ")),
        ];
        downloadBlob(createSimplePdf(lines), `${safeBase}.pdf`);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to export shortlist data.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleOpenPreview(exp: ExportRecord) {
    setActionBusy(true);
    setActionError("");

    try {
      await fetchRecord(exp.shortlistId);
      setPreviewExp(exp);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to load export preview.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleGenerateExport() {
    const summary = summaries.find((item) => item._id === selectedShortlistId);

    if (!summary) {
      return;
    }

    const freshRecord = mapSummaryToExport(summary, selectedFormat);
    setRecords((prev) => [freshRecord, ...prev]);
    await handleDownload(freshRecord);
    setExportDone(true);
    setTimeout(() => {
      setExportDone(false);
      setShowNewExport(false);
    }, 1200);
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

      {loadError && (
        <Card className="mt-6 border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {loadError}
        </Card>
      )}

      {actionError && (
        <Card className="mt-4 border-warning/30 bg-warning/10 p-4 text-sm text-warning-deep">
          {actionError}
        </Card>
      )}

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
                  Connected to your shortlist runs so every export uses live backend data.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                <div className="rounded-xl border border-line bg-surface/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Total Exports</p>
                  <p className="mt-2 font-display text-2xl font-bold text-ink">{records.length}</p>
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
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Shortlist Runs</p>
                  <p className="mt-2 font-display text-2xl font-bold text-ink-muted">{summaries.length}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Latest Export</p>
          <div className="mt-4 rounded-xl border border-line bg-surface-soft/30 p-4">
            {!latestExport ? (
              <p className="text-sm text-ink-muted">No exports available yet.</p>
            ) : (
              <>
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
                <Button variant="secondary" fullWidth className="mt-4" leftIcon={<Eye className="h-4 w-4" />} onClick={() => void handleOpenPreview(latestExport)}>
                  Preview Export
                </Button>
              </>
            )}
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

      {loading ? (
        <Card className="mt-6 p-8 text-center text-sm text-ink-muted">
          <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-brand" />
          Loading exports from backend shortlists...
        </Card>
      ) : (
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
                        disabled={exp.status === "expired" || actionBusy}
                        fullWidth
                        onClick={() => void handleDownload(exp)}
                      >
                        Download
                      </Button>
                      <Button
                        variant="secondary"
                        leftIcon={<Eye className="h-4 w-4" />}
                        fullWidth
                        onClick={() => void handleOpenPreview(exp)}
                        disabled={actionBusy}
                      >
                        Preview
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {previewExp && recordByShortlist[previewExp.shortlistId] && (
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
                    {buildPreviewRows(recordByShortlist[previewExp.shortlistId])[0].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {buildPreviewRows(recordByShortlist[previewExp.shortlistId]).slice(1).map((row, i) => (
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
              <Button leftIcon={<Download className="h-4 w-4" />} onClick={() => { void handleDownload(previewExp); setPreviewExp(null); }}>
                Download
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal open={showNewExport} onClose={() => setShowNewExport(false)} size="sm">
        <ModalHeader title="Generate New Export" subtitle="Choose run and format for your export." onClose={() => setShowNewExport(false)} />
        <ModalBody className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Shortlist run</p>
            <select
              value={selectedShortlistId}
              onChange={(e) => setSelectedShortlistId(e.target.value)}
              className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {summaries.map((summary) => (
                <option key={summary._id} value={summary._id}>
                  {summary.jobTitle} · {summary.runName}
                </option>
              ))}
            </select>
          </div>
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
            <strong>Note:</strong> Export payload is generated from persisted shortlist data in the backend.
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowNewExport(false)}>Cancel</Button>
          <Button
            leftIcon={exportDone ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            onClick={() => void handleGenerateExport()}
            disabled={!selectedShortlistId || actionBusy}
          >
            {exportDone ? "Generated!" : `Export as ${selectedFormat.toUpperCase()}`}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
