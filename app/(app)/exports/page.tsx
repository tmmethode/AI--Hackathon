"use client";

import { useState } from "react";
import {
  Download, FileText, Sheet, FileJson, CheckCircle2,
  Calendar, Filter, Search, Clock, Briefcase, Users,
  Eye, Trash2, Check, X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";

type ExportFormat = "csv" | "pdf" | "json";

interface ExportRecord {
  id: string;
  name: string;
  job: string;
  format: ExportFormat;
  candidates: number;
  createdAt: string;
  size: string;
  status: "ready" | "generating" | "expired";
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

export default function ExportsPage() {
  const [showNewExport, setShowNewExport] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [exportDone, setExportDone] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = exports.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.job.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-ink-muted">Total Exports</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{exports.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-muted">Ready to Download</p>
          <p className="mt-1 font-display text-2xl font-bold text-success">
            {exports.filter((e) => e.status === "ready").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-muted">Total Candidates Exported</p>
          <p className="mt-1 font-display text-2xl font-bold text-brand">
            {exports.reduce((sum, e) => sum + e.candidates, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-muted">Expired</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-muted">
            {exports.filter((e) => e.status === "expired").length}
          </p>
        </Card>
      </section>

      {/* Export list */}
      <Card className="mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink">Export History</h2>
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <input
              placeholder="Search exports…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-52 rounded-md border border-line bg-white pl-8 pr-3 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
        </div>

        {/* Table */}
        <div role="table">
          <div role="row" className="hidden grid-cols-[2fr_0.8fr_1fr_0.7fr_0.7fr_0.7fr_120px] gap-4 bg-surface-soft/40 px-5 py-3 text-xs uppercase tracking-wider text-ink-muted md:grid">
            <span role="columnheader">Export Name</span>
            <span role="columnheader">Format</span>
            <span role="columnheader">Created</span>
            <span role="columnheader">Candidates</span>
            <span role="columnheader">Size</span>
            <span role="columnheader">Status</span>
            <span role="columnheader" className="text-right">Actions</span>
          </div>
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">
              No exports found.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((exp, i) => {
                const FormatIcon = formatIcons[exp.format];
                return (
                  <li
                    key={exp.id}
                    className={`grid grid-cols-2 gap-3 px-5 py-4 text-sm md:grid-cols-[2fr_0.8fr_1fr_0.7fr_0.7fr_0.7fr_120px] md:items-center md:gap-4 ${
                      i % 2 === 1 ? "bg-surface-soft/30" : "bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-ink">{exp.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">{exp.id} · {exp.job}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FormatIcon className="h-4 w-4 text-brand" />
                      <span className="text-xs uppercase text-ink">{exp.format}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Clock className="h-3 w-3" />
                      {exp.createdAt}
                    </div>
                    <p className="font-semibold text-ink">{exp.candidates}</p>
                    <p className="text-ink-muted">{exp.size}</p>
                    <div>
                      <Badge
                        tone={exp.status === "ready" ? "success" : exp.status === "generating" ? "brand" : "neutral"}
                        pill
                      >
                        {exp.status === "ready" ? "Ready" : exp.status === "generating" ? "Generating" : "Expired"}
                      </Badge>
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Download className="h-3.5 w-3.5" />}
                        disabled={exp.status === "expired"}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

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
