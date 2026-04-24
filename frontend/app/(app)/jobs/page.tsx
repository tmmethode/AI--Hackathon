"use client";

import { type ComponentProps, type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  AlertTriangle,
  Briefcase,
  CircleCheck,
  Clock3,
  Download,
  LoaderCircle,
  MapPin,
  MoreHorizontal,
  Pencil,
  Play,
  Search,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  getHiringManagerName,
  listAllJobs,
  splitLinesToList,
  type EducationLevel,
  type EmploymentType,
  type JobRecord,
  type JobStatus,
  type LocationPolicy,
  type SeniorityLevel,
  type WeightCriterion,
} from "@/lib/jobs";
import { downloadCsv, sanitizeFilename } from "@/lib/download";
import {
  archiveJob,
  deleteJob,
  fetchJobs,
  setDeleteTarget,
  setMenuOpen,
  setPage,
  setSearch,
  setSelectedId,
  setShowArchiveConfirm,
  setShowJobDetails,
  setStatusFilter,
  updateJob,
} from "@/lib/features/jobs/jobsSlice";

const statusTone: Record<JobStatus, ComponentProps<typeof Badge>["tone"]> = {
  Active: "success",
  Draft: "neutral",
  Closed: "danger",
};

const PAGE_SIZE = 5;
const ALL_STATUSES = ["All", "Active", "Draft", "Closed"] as const;

interface EditJobForm {
  title: string;
  location: string;
  locationPolicy: LocationPolicy;
  employmentType: EmploymentType;
  salaryBand: string;
  summary: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications: string;
  coreHardSkills: string;
  coreSoftSkills: string;
  experienceYears: string;
  seniorityLevel: SeniorityLevel;
  educationLevel: EducationLevel;
  status: JobStatus;
  weightCriteria: WeightCriterion[];
}

const DEFAULT_EDIT_WEIGHT_CRITERIA: WeightCriterion[] = [
  { id: "must-have-qualifications", label: "Must-have Qualifications", value: 30 },
  { id: "nice-to-have-qualifications", label: "Nice-to-have Qualifications", value: 10 },
  { id: "core-skills", label: "Core Hard & Soft Skills", value: 25 },
  { id: "experience-seniority", label: "Years of Experience & Seniority Level", value: 25 },
  { id: "education", label: "Educational Background", value: 10 },
];

function canonicalEditWeightId(criterion: WeightCriterion): string | undefined {
  const id = criterion.id.toLowerCase();
  const label = criterion.label.toLowerCase();

  if (id.includes("must-have") || label.includes("must-have") || label.includes("mandatory")) return "must-have-qualifications";
  if (id.includes("nice-to-have") || id.includes("preferred") || id.includes("bonus") || label.includes("nice-to-have") || label.includes("preferred") || label.includes("bonus")) return "nice-to-have-qualifications";
  if (id.includes("skill") || id.includes("culture") || id.includes("soft") || label.includes("skill") || label.includes("culture") || label.includes("soft")) return "core-skills";
  if (id.includes("experience") || id.includes("seniority") || label.includes("experience") || label.includes("seniority")) return "experience-seniority";
  if (id.includes("education") || label.includes("education")) return "education";
  return undefined;
}

function normalizeEditWeights(criteria: WeightCriterion[]): WeightCriterion[] {
  const source = criteria.length > 0 ? criteria : DEFAULT_EDIT_WEIGHT_CRITERIA;
  const valuesById = new Map<string, WeightCriterion>();

  for (const criterion of source) {
    const id = canonicalEditWeightId(criterion);
    if (id && !valuesById.has(id)) {
      valuesById.set(id, criterion);
    }
  }

  const normalized = DEFAULT_EDIT_WEIGHT_CRITERIA.map((criterion) => {
    const match = valuesById.get(criterion.id);
    return {
      ...criterion,
      value: Math.max(0, Math.min(100, Math.round(Number(match?.value ?? criterion.value) || 0))),
    };
  });
  const total = normalized.reduce((sum, criterion) => sum + criterion.value, 0);

  if (total === 100) {
    return normalized;
  }

  if (total <= 0) {
    return DEFAULT_EDIT_WEIGHT_CRITERIA.map((criterion) => ({ ...criterion }));
  }

  const scaled = normalized.map((criterion) => ({
    ...criterion,
    value: Math.floor((criterion.value / total) * 100),
  }));
  let diff = 100 - scaled.reduce((sum, criterion) => sum + criterion.value, 0);

  return scaled.map((criterion) => {
    if (diff <= 0) return criterion;
    diff -= 1;
    return { ...criterion, value: criterion.value + 1 };
  });
}

function rebalanceEditWeights(criteria: WeightCriterion[], changedId: string, nextValue: number): WeightCriterion[] {
  const normalized = normalizeEditWeights(criteria);
  const clamped = Math.max(0, Math.min(100, Math.round(Number(nextValue) || 0)));
  const others = normalized.filter((criterion) => criterion.id !== changedId);
  const oldOtherTotal = others.reduce((sum, criterion) => sum + criterion.value, 0);
  const remaining = 100 - clamped;

  let nextOthers: WeightCriterion[];
  if (oldOtherTotal <= 0) {
    const base = Math.floor(remaining / Math.max(1, others.length));
    let diff = remaining - base * others.length;
    nextOthers = others.map((criterion) => {
      const value = base + (diff > 0 ? 1 : 0);
      diff -= diff > 0 ? 1 : 0;
      return { ...criterion, value };
    });
  } else {
    nextOthers = others.map((criterion) => ({
      ...criterion,
      value: Math.floor((criterion.value / oldOtherTotal) * remaining),
    }));
    let diff = remaining - nextOthers.reduce((sum, criterion) => sum + criterion.value, 0);
    nextOthers = nextOthers.map((criterion) => {
      if (diff <= 0) return criterion;
      diff -= 1;
      return { ...criterion, value: criterion.value + 1 };
    });
  }

  const valuesById = new Map(
    [{ id: changedId, value: clamped }, ...nextOthers].map((criterion) => [criterion.id, criterion.value])
  );

  return normalized.map((criterion) => ({
    ...criterion,
    value: valuesById.get(criterion.id) ?? criterion.value,
  }));
}

function buildEditForm(job: JobRecord): EditJobForm {
  return {
    title: job.title,
    location: job.location,
    locationPolicy: job.locationPolicy,
    employmentType: job.employmentType,
    salaryBand: job.salaryBand || "",
    summary: job.summary,
    responsibilities: job.responsibilities,
    mustHaveQualifications: job.mustHaveQualifications,
    niceToHaveQualifications: job.niceToHaveQualifications || "",
    coreHardSkills: job.coreHardSkills.join("\n"),
    coreSoftSkills: job.coreSoftSkills.join("\n"),
    experienceYears: String(job.experienceYears || 0),
    seniorityLevel: job.seniorityLevel,
    educationLevel: job.educationLevel,
    status: job.status,
    weightCriteria: normalizeEditWeights(job.weightCriteria),
  };
}

function formatJobId(job: JobRecord) {
  return `JOB-${job._id.slice(-6).toUpperCase()}`;
}

function formatExperience(job: JobRecord) {
  const years = job.experienceYears > 0 ? `${job.experienceYears}+ years` : "Entry friendly";
  return `${job.seniorityLevel} · ${years}`;
}

function formatCultureFit(job: JobRecord) {
  if (job.coreSoftSkills.length === 0) {
    return "Not specified";
  }

  return job.coreSoftSkills.slice(0, 3).join(" · ");
}

function JobRowSkeleton({ index }: { index: number }) {
  return (
    <li
      className={`grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-[2fr_1.1fr_1.1fr_0.9fr_100px_40px] md:items-center md:gap-4 ${
        index === 0 ? "bg-brand-soft/20" : ""
      }`}
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" delayIndex={index} />
        <Skeleton className="h-3 w-28" delayIndex={index + 1} />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton shape="circle" className="h-6 w-6" delayIndex={index + 2} />
        <Skeleton className="h-4 w-24" delayIndex={index + 3} />
      </div>
      <Skeleton className="h-4 w-28" delayIndex={index + 4} />
      <div className="space-y-2">
        <Skeleton className="h-4 w-10" delayIndex={index + 5} />
        <Skeleton className="h-3 w-16" delayIndex={index + 6} />
      </div>
      <div className="md:flex md:justify-center">
        <Skeleton shape="pill" className="h-6 w-16" delayIndex={index + 7} />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-8 w-8" delayIndex={index + 8} />
      </div>
    </li>
  );
}

function JobsSidebarSkeleton() {
  return (
    <>
      <Card className="p-5">
        <Skeleton className="mx-auto h-3 w-28" />
        <div className="mt-4 flex items-start justify-between">
          <Skeleton shape="pill" className="h-6 w-24" delayIndex={1} />
          <Skeleton shape="pill" className="h-6 w-16" delayIndex={2} />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-48" delayIndex={3} />
          <Skeleton className="h-3 w-24" delayIndex={4} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" delayIndex={5} />
            <Skeleton className="h-4 w-28" delayIndex={6} />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" delayIndex={7} />
            <Skeleton className="h-4 w-24" delayIndex={8} />
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2">
            <Skeleton shape="circle" className="h-4 w-4" delayIndex={9} />
            <Skeleton className="h-4 w-32" delayIndex={10} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton shape="pill" className="h-6 w-20" delayIndex={11} />
            <Skeleton shape="pill" className="h-6 w-16" delayIndex={12} />
            <Skeleton shape="pill" className="h-6 w-24" delayIndex={13} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Skeleton className="h-10 w-full" delayIndex={14} />
          <Skeleton className="h-10 w-full" delayIndex={15} />
        </div>
        <div className="mt-2">
          <Skeleton className="h-10 w-full" delayIndex={16} />
        </div>
      </Card>

      <Card className="bg-brand-soft p-5">
        <Skeleton className="h-4 w-40 bg-white/50" delayIndex={17} />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3 w-full bg-white/50" delayIndex={18} />
          <Skeleton className="h-3 w-11/12 bg-white/50" delayIndex={19} />
          <Skeleton className="h-3 w-4/5 bg-white/50" delayIndex={20} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 bg-white/50" delayIndex={21} />
            <Skeleton className="h-4 w-28 bg-white/50" delayIndex={22} />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 bg-white/50" delayIndex={23} />
            <Skeleton className="h-4 w-24 bg-white/50" delayIndex={24} />
          </div>
        </div>
      </Card>

      <Card className="flex items-center justify-between p-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" delayIndex={25} />
          <Skeleton className="h-7 w-14" delayIndex={26} />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-4 w-20" delayIndex={27} />
          <Skeleton className="ml-auto h-3 w-16" delayIndex={28} />
        </div>
      </Card>
    </>
  );
}

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const {
    items: jobs,
    search,
    statusFilter,
    selectedId,
    page,
    menuOpen,
    deleteTarget,
    showArchiveConfirm,
    showJobDetails,
    isLoading,
    isMutatingId,
    error,
    total,
    totalPages,
  } = useAppSelector((state) => state.jobs);

  useEffect(() => {
    void dispatch(fetchJobs());
  }, [dispatch, page, search, statusFilter]);

  const selected = useMemo(
    () => jobs.find((job) => job._id === selectedId) ?? jobs[0] ?? null,
    [jobs, selectedId]
  );
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditJobForm | null>(null);
  const [editError, setEditError] = useState("");
  const editWeightTotal = useMemo(
    () => editForm?.weightCriteria.reduce((sum, criterion) => sum + criterion.value, 0) ?? 0,
    [editForm]
  );

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  function handleSearchChange(value: string) {
    dispatch(setSearch(value));
  }

  function handleStatusChange(value: (typeof ALL_STATUSES)[number]) {
    dispatch(setStatusFilter(value));
  }

  async function handleDelete(id: string) {
    await dispatch(deleteJob(id));
  }

  async function handleArchive(id: string) {
    await dispatch(archiveJob(id));
  }

  function openEditJob(job: JobRecord) {
    setEditTargetId(job._id);
    setEditForm(buildEditForm(job));
    setEditError("");
    dispatch(setSelectedId(job._id));
    dispatch(setMenuOpen(null));
    dispatch(setShowJobDetails(false));
  }

  function updateEditField<Key extends keyof Omit<EditJobForm, "weightCriteria">>(
    field: Key,
    value: EditJobForm[Key]
  ) {
    setEditForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateEditWeight(id: string, value: number) {
    setEditForm((current) =>
      current
        ? {
            ...current,
            weightCriteria: rebalanceEditWeights(current.weightCriteria, id, value),
          }
        : current
    );
  }

  async function handleUpdateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editTargetId || !editForm) {
      return;
    }

    if (editWeightTotal !== 100) {
      setEditError(`Scoring weights must total 100% before saving. Current total is ${editWeightTotal}%.`);
      return;
    }

    setEditError("");

    const result = await dispatch(
      updateJob({
        id: editTargetId,
        payload: {
          title: editForm.title.trim(),
          location: editForm.location.trim(),
          locationPolicy: editForm.locationPolicy,
          employmentType: editForm.employmentType,
          salaryBand: editForm.salaryBand.trim() || undefined,
          summary: editForm.summary.trim(),
          responsibilities: editForm.responsibilities.trim(),
          mustHaveQualifications: editForm.mustHaveQualifications.trim(),
          niceToHaveQualifications: editForm.niceToHaveQualifications.trim() || undefined,
          coreHardSkills: splitLinesToList(editForm.coreHardSkills),
          coreSoftSkills: splitLinesToList(editForm.coreSoftSkills),
          experienceYears: Number(editForm.experienceYears) || 0,
          seniorityLevel: editForm.seniorityLevel,
          educationLevel: editForm.educationLevel,
          weightCriteria: editForm.weightCriteria,
          status: editForm.status,
        },
      })
    );

    if (updateJob.fulfilled.match(result)) {
      setEditTargetId(null);
      setEditForm(null);
    } else {
      setEditError(result.payload || "Failed to update the job.");
    }
  }

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  async function handleExportReport() {
    setExporting(true);
    setExportError("");

    try {
      const allJobs = await listAllJobs({
        search: search.trim() || undefined,
        status: statusFilter === "All" ? undefined : statusFilter,
      });

      if (allJobs.length === 0) {
        setExportError("No jobs match the current filters.");
        return;
      }

      const header = [
        "Job ID",
        "Title",
        "Location",
        "Status",
        "Hiring Manager",
        "Seniority",
        "Experience (yrs)",
        "Applicants",
        "Updated",
      ];
      const rows: (readonly unknown[])[] = [header];
      for (const job of allJobs) {
        rows.push([
          formatJobId(job),
          job.title,
          job.location,
          job.status,
          getHiringManagerName(job.hiringManager),
          job.seniorityLevel,
          job.experienceYears,
          job.applicantsCount,
          new Date(job.updatedAt).toISOString().slice(0, 10),
        ]);
      }

      const base = sanitizeFilename(
        `jobs-report_${statusFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`
      );
      downloadCsv(rows, `${base}.csv`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to export jobs report.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-5">
      <PageHeader
        title="Jobs Management"
        description="Manage and ingest applicants for your job requisitions."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExportReport}
              disabled={exporting || isLoading}
            >
              {exporting ? "Exporting…" : "Export Report"}
            </Button>
            <Link href="/jobs/new">
              <Button leftIcon={<Play className="h-4 w-4" />}>Create New Job</Button>
            </Link>
          </>
        }
      />

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {exportError && (
        <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-deep">
          {exportError}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col rounded-md border border-line bg-surface shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              placeholder="Search by title, manager, or location…"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 border-t border-line px-2 py-2 sm:border-l sm:border-t-0 sm:py-0">
            {ALL_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`h-7 rounded px-3 text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-brand text-white"
                    : "text-ink-muted hover:bg-surface-soft hover:text-ink"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden lg:block" />

        <Card className="overflow-hidden">
          <div role="table" className="min-w-0">
            <div role="row" className="hidden grid-cols-[2fr_1.1fr_1.1fr_0.9fr_100px_40px] gap-4 bg-surface-soft/40 px-5 py-3 text-xs text-ink-muted md:grid">
              <span role="columnheader">Job Title &amp; ID</span>
              <span role="columnheader">Manager</span>
              <span role="columnheader">Location</span>
              <span role="columnheader">Applicants</span>
              <span role="columnheader" className="text-center">Status</span>
              <span role="columnheader" />
            </div>

            {isLoading ? (
              <ul className="divide-y divide-line">
                {Array.from({ length: PAGE_SIZE }, (_, index) => (
                  <JobRowSkeleton key={index} index={index} />
                ))}
              </ul>
            ) : jobs.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-ink-muted">No jobs match your search.</div>
            ) : (
              <ul className="divide-y divide-line">
                {jobs.map((job) => {
                  const managerName = getHiringManagerName(job.hiringManager);
                  const isMutating = isMutatingId === job._id;

                  return (
                    <li
                      key={job._id}
                      onClick={() => dispatch(setSelectedId(job._id))}
                      className={`grid cursor-pointer grid-cols-1 gap-3 px-4 py-4 text-sm transition-colors sm:px-5 md:grid-cols-[2fr_1.1fr_1.1fr_0.9fr_100px_40px] md:items-center md:gap-4 ${
                        selectedId === job._id ? "bg-brand-soft/40" : "hover:bg-surface-soft/50"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-ink">{job.title}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
                          {formatJobId(job)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={managerName}
                          src={job.hiringManager.profilePicture}
                          size={24}
                        />
                        <span className="text-ink">{managerName}</span>
                      </div>
                      <p className="text-ink-muted">{job.location}</p>
                      <div>
                        <p className="font-semibold text-ink">{job.applicantsCount}</p>
                        <p className="text-xs text-ink-muted">
                          {new Date(job.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="md:text-center">
                        <Badge tone={statusTone[job.status]} pill>{job.status}</Badge>
                      </div>
                      <div className="relative flex justify-end" onClick={(event) => event.stopPropagation()}>
                        <button
                          className="rounded-md p-1 text-ink-muted hover:bg-surface-soft disabled:opacity-50"
                          aria-label="More options"
                          onClick={() => dispatch(setMenuOpen(menuOpen === job._id ? null : job._id))}
                          disabled={isMutating}
                        >
                          {isMutating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                        </button>
                        {menuOpen === job._id && (
                          <div className="absolute right-0 top-8 z-10 w-40 rounded-md border border-line bg-surface shadow-card">
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-soft"
                              onClick={() => {
                                dispatch(setSelectedId(job._id));
                                dispatch(setShowJobDetails(true));
                                dispatch(setMenuOpen(null));
                              }}
                            >
                              <Briefcase className="h-3.5 w-3.5 text-ink-muted" /> View Job
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-soft"
                              onClick={() => openEditJob(job)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-ink-muted" /> Edit Job
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-soft"
                              onClick={() => {
                                dispatch(setShowArchiveConfirm(job._id));
                                dispatch(setMenuOpen(null));
                              }}
                            >
                              <Archive className="h-3.5 w-3.5 text-ink-muted" /> Archive
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
                              onClick={() => {
                                dispatch(setDeleteTarget(job._id));
                                dispatch(setMenuOpen(null));
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface px-4 py-4 text-sm text-ink-muted sm:px-5">
            <p>Showing {rangeStart}-{rangeEnd} of {total} jobs</p>
            <nav aria-label="Pagination" className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                <button
                  key={value}
                  onClick={() => dispatch(setPage(value))}
                  className={`h-8 w-8 rounded-md border text-xs transition-colors ${
                    value === page ? "border-brand bg-brand text-white" : "border-line text-ink hover:bg-surface-soft"
                  }`}
                  aria-current={value === page ? "page" : undefined}
                  disabled={isLoading}
                >
                  {value}
                </button>
              ))}
            </nav>
          </div>
        </Card>

        <aside aria-label="Quick inspection" className="flex flex-col gap-4">
          {isLoading ? (
            <JobsSidebarSkeleton />
          ) : selected ? (
            <>
              <Card className="p-5">
                <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                  - Quick Inspection -
                </p>
                <div className="flex items-start justify-between">
                  <Badge tone="neutral" className="rounded-full font-mono">ID: {formatJobId(selected)}</Badge>
                  <Badge tone={statusTone[selected.status]} pill>{selected.status}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-ink">{selected.title}</h3>
                <p className="text-xs text-ink-muted">{selected.location}</p>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="uppercase tracking-wider text-ink-muted">Location</dt>
                    <dd className="mt-0.5 text-ink">{selected.location}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wider text-ink-muted">Hiring Manager</dt>
                    <dd className="mt-0.5 text-ink">{getHiringManagerName(selected.hiringManager)}</dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-xl border border-line bg-surface-soft/70 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <CircleCheck className="h-4 w-4 text-brand" />
                      Skills Snapshot
                    </div>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                      {selected.coreHardSkills.length + selected.coreSoftSkills.length} total
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <div className="rounded-lg border border-line/80 bg-surface p-2.5">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Must-have</p>
                        <span className="text-[11px] text-ink-muted">{selected.coreHardSkills.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.coreHardSkills.length > 0 ? (
                          selected.coreHardSkills.map((skill) => (
                            <Badge key={skill} tone="neutral">{skill}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-ink-muted">No hard skills listed yet.</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-line/80 bg-surface p-2.5">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Culture & Soft Skills</p>
                        <span className="text-[11px] text-ink-muted">{selected.coreSoftSkills.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.coreSoftSkills.length > 0 ? (
                          selected.coreSoftSkills.map((skill) => (
                            <Badge key={skill} tone="info">{skill}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-ink-muted">No soft skills listed yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      leftIcon={<Briefcase className="h-4 w-4" />}
                      fullWidth
                      onClick={() => dispatch(setShowJobDetails(true))}
                    >
                      View Job
                    </Button>
                    <Button
                      variant="secondary"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      fullWidth
                      onClick={() => openEditJob(selected)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/ingest" className="contents">
                      <Button variant="secondary" leftIcon={<Upload className="h-4 w-4" />} fullWidth>
                        Ingest
                      </Button>
                    </Link>
                    <Link href="/jobs/new" className="contents">
                      <Button variant="secondary" leftIcon={<Pencil className="h-4 w-4" />} fullWidth>
                        New Copy
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="bg-brand-soft p-5">
                <h4 className="text-sm font-semibold text-info-deep">Ideal Candidate Profile</h4>
                <p className="mt-2 text-xs leading-5 text-info-deep/80">{selected.summary}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <dt className="uppercase tracking-wider text-info-deep/60">Experience Level</dt>
                    <dd className="mt-0.5 font-semibold text-info-deep">{formatExperience(selected)}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wider text-info-deep/60">Culture Fit</dt>
                    <dd className="mt-0.5 font-semibold text-info-deep">{formatCultureFit(selected)}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-ink-muted">Total Applicants</p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">{selected.applicantsCount}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-semibold text-brand">{selected.locationPolicy}</span>
                  <p className="text-ink-muted">{selected.employmentType}</p>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center text-sm text-ink-muted">Select a job to inspect.</Card>
          )}
        </aside>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[5]" onClick={() => dispatch(setMenuOpen(null))} />
      )}

      <Modal open={showJobDetails && !!selected} onClose={() => dispatch(setShowJobDetails(false))} size="xl">
        {selected && (
          <>
            <ModalHeader
              title={selected.title}
              subtitle={formatJobId(selected)}
              onClose={() => dispatch(setShowJobDetails(false))}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">Job Details</p>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-5">
              <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                  <div>
                    <dt className="text-xs text-ink-muted">Location</dt>
                    <dd className="font-medium text-ink">{selected.location}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                  <div>
                    <dt className="text-xs text-ink-muted">Employment</dt>
                    <dd className="font-medium text-ink">{selected.employmentType}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                  <div>
                    <dt className="text-xs text-ink-muted">Hiring Manager</dt>
                    <dd className="font-medium text-ink">{getHiringManagerName(selected.hiringManager)}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                  <div>
                    <dt className="text-xs text-ink-muted">Salary Band</dt>
                    <dd className="font-medium text-ink">{selected.salaryBand || "Not specified"}</dd>
                  </div>
                </div>
              </dl>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Summary</p>
                <p className="text-sm leading-6 text-ink">{selected.summary}</p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Responsibilities</p>
                <p className="whitespace-pre-line text-sm leading-6 text-ink">{selected.responsibilities}</p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Must-have Qualifications</p>
                  <p className="whitespace-pre-line text-sm leading-6 text-ink">{selected.mustHaveQualifications}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Nice-to-have Qualifications</p>
                  <p className="whitespace-pre-line text-sm leading-6 text-ink">{selected.niceToHaveQualifications || "Not specified"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.coreHardSkills.map((skill) => (
                      <Badge key={skill} tone="neutral">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Soft Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.coreSoftSkills.length > 0 ? (
                      selected.coreSoftSkills.map((skill) => (
                        <Badge key={skill} tone="brand">{skill}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-ink-muted">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Scoring Criteria</p>
                {selected.weightCriteria.length > 0 ? (
                  <div className="space-y-2">
                    {selected.weightCriteria.map((criterion) => (
                      <div key={criterion.id} className="flex items-center justify-between rounded-md bg-surface-soft px-3 py-2 text-sm">
                        <span className="text-ink">{criterion.label}</span>
                        <span className="font-semibold text-brand">{criterion.value}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">No custom scoring criteria configured.</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => openEditJob(selected)}>
                Edit Job
              </Button>
              <Button variant="secondary" onClick={() => dispatch(setShowJobDetails(false))}>Close</Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      <Modal
        open={!!editTargetId && !!editForm}
        onClose={() => {
          setEditTargetId(null);
          setEditForm(null);
          setEditError("");
        }}
        size="xl"
      >
        {editForm && (
          <form onSubmit={handleUpdateJob}>
            <ModalHeader
              title={`Edit ${editForm.title || "Job"}`}
              subtitle="Update job details, requirements, status, and AI scoring weights."
              onClose={() => {
                setEditTargetId(null);
                setEditForm(null);
                setEditError("");
              }}
            />
            <ModalBody className="max-h-[70vh] overflow-y-auto">
              {editError && (
                <div className="mb-5 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Job Title" className="md:col-span-2" required>
                  <Input
                    value={editForm.title}
                    onChange={(event) => updateEditField("title", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Status">
                  <Select
                    value={editForm.status}
                    onChange={(event) => updateEditField("status", event.target.value as JobStatus)}
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Closed">Closed</option>
                  </Select>
                </Field>
                <Field label="Location" required>
                  <Input
                    value={editForm.location}
                    onChange={(event) => updateEditField("location", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Location Policy" required>
                  <Select
                    value={editForm.locationPolicy}
                    onChange={(event) => updateEditField("locationPolicy", event.target.value as LocationPolicy)}
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </Select>
                </Field>
                <Field label="Employment Type" required>
                  <Select
                    value={editForm.employmentType}
                    onChange={(event) => updateEditField("employmentType", event.target.value as EmploymentType)}
                  >
                    <option value="full-time">Full-time Permanent</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="temporary">Temporary</option>
                  </Select>
                </Field>
                <Field label="Salary Band">
                  <Input
                    value={editForm.salaryBand}
                    onChange={(event) => updateEditField("salaryBand", event.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5">
                <Field label="Job Summary" required>
                  <Textarea
                    rows={3}
                    value={editForm.summary}
                    onChange={(event) => updateEditField("summary", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Key Responsibilities" required>
                  <Textarea
                    rows={5}
                    value={editForm.responsibilities}
                    onChange={(event) => updateEditField("responsibilities", event.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Must-have Qualifications" required>
                  <Textarea
                    rows={5}
                    value={editForm.mustHaveQualifications}
                    onChange={(event) => updateEditField("mustHaveQualifications", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Nice-to-have Qualifications" required>
                  <Textarea
                    rows={5}
                    value={editForm.niceToHaveQualifications}
                    onChange={(event) => updateEditField("niceToHaveQualifications", event.target.value)}
                  />
                </Field>
                <Field label="Core Hard Skills" hint="One skill per line.">
                  <Textarea
                    rows={4}
                    value={editForm.coreHardSkills}
                    onChange={(event) => updateEditField("coreHardSkills", event.target.value)}
                  />
                </Field>
                <Field label="Core Soft Skills" hint="One skill per line.">
                  <Textarea
                    rows={4}
                    value={editForm.coreSoftSkills}
                    onChange={(event) => updateEditField("coreSoftSkills", event.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Experience">
                  <Select value={editForm.experienceYears} onChange={(event) => updateEditField("experienceYears", event.target.value)}>
                    <option value="">Select years</option>
                    <option value="0">0+ Years</option>
                    <option value="1">1+ Years</option>
                    <option value="2">2+ Years</option>
                    <option value="3">3+ Years</option>
                    <option value="4">4+ Years</option>
                    <option value="5">5+ Years</option>
                    <option value="6">6+ Years</option>
                    <option value="7">7+ Years</option>
                    <option value="8">8+ Years</option>
                    <option value="10">10+ Years</option>
                    <option value="12">12+ Years</option>
                    <option value="15">15+ Years</option>
                  </Select>
                </Field>
                <Field label="Seniority Level" required>
                  <Select
                    value={editForm.seniorityLevel}
                    onChange={(event) => updateEditField("seniorityLevel", event.target.value as SeniorityLevel)}
                  >
                    <option value="junior">Junior</option>
                    <option value="mid">Mid-level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="manager">Manager</option>
                    <option value="principal">Principal</option>
                  </Select>
                </Field>
                <Field label="Education Level" required>
                  <Select
                    value={editForm.educationLevel}
                    onChange={(event) => updateEditField("educationLevel", event.target.value as EducationLevel)}
                  >
                    <option value="none">No formal degree required</option>
                    <option value="hs">High School</option>
                    <option value="associate">Associate Degree</option>
                    <option value="bs">Bachelor&apos;s Degree</option>
                    <option value="ms">Master&apos;s Degree</option>
                    <option value="mba">MBA</option>
                    <option value="phd">PhD / Doctorate</option>
                    <option value="professional">Professional Certification Equivalent</option>
                  </Select>
                </Field>
              </div>

              <div className="mt-6">
                <h3 className="mb-1 text-sm font-semibold text-ink">AI Scoring Weights</h3>
                <p className="mb-3 text-xs text-ink-muted">These percentages are used by screening and saved shortlists.</p>
                <div className="flex flex-col gap-2">
                  {editForm.weightCriteria.map((criterion) => (
                    <div
                      key={criterion.id}
                      className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5"
                    >
                      <span className="w-[200px] shrink-0 text-sm font-medium text-ink">{criterion.label}</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={criterion.value}
                        onChange={(event) => updateEditWeight(criterion.id, Number(event.target.value))}
                        className="h-1.5 min-w-0 flex-1 cursor-pointer accent-brand"
                        aria-label={`${criterion.label} weight slider`}
                      />
                      <span
                        className={`w-12 shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-bold ${
                          criterion.value > 0 ? "bg-brand/10 text-brand" : "bg-surface-soft text-ink-muted"
                        }`}
                      >
                        {criterion.value}%
                      </span>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center justify-end gap-2 text-sm">
                    <span className="text-ink-muted">Total:</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        editWeightTotal === 100 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {editWeightTotal}%
                    </span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditTargetId(null);
                  setEditForm(null);
                  setEditError("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftIcon={isMutatingId === editTargetId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                disabled={isMutatingId === editTargetId}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => dispatch(setDeleteTarget(null))} size="sm">
        <ModalHeader
          title="Delete Job"
          subtitle="This action cannot be undone."
          onClose={() => dispatch(setDeleteTarget(null))}
        />
        <ModalBody className="flex flex-col gap-4">
          {deleteTarget && (() => {
            const job = jobs.find((item) => item._id === deleteTarget);
            if (!job) {
              return null;
            }

            return (
              <>
                <div className="flex items-center gap-3 rounded-md border border-danger/20 bg-danger/5 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{job.title}</p>
                    <p className="text-xs text-ink-muted">
                      {formatJobId(job)} · {job.applicantsCount} applicants
                    </p>
                  </div>
                </div>
                <p className="text-sm text-ink-muted">
                  Deleting this job will permanently remove it and all associated data.
                  Candidate records will remain in the candidate pool.
                </p>
              </>
            );
          })()}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => dispatch(setDeleteTarget(null))}>Cancel</Button>
          <Button
            variant="danger"
            leftIcon={isMutatingId === deleteTarget ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
            disabled={isMutatingId === deleteTarget}
          >
            Delete Permanently
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={!!showArchiveConfirm} onClose={() => dispatch(setShowArchiveConfirm(null))} size="sm">
        <ModalHeader
          title="Archive Job"
          subtitle="This job will be moved to Closed status."
          onClose={() => dispatch(setShowArchiveConfirm(null))}
        />
        <ModalBody className="flex flex-col gap-4">
          {showArchiveConfirm && (() => {
            const job = jobs.find((item) => item._id === showArchiveConfirm);
            if (!job) {
              return null;
            }

            return (
              <>
                <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-4">
                  <Archive className="h-5 w-5 shrink-0 text-ink-muted" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{job.title}</p>
                    <p className="text-xs text-ink-muted">{formatJobId(job)}</p>
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
          <Button variant="secondary" onClick={() => dispatch(setShowArchiveConfirm(null))}>Cancel</Button>
          <Button
            leftIcon={isMutatingId === showArchiveConfirm ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
            onClick={() => showArchiveConfirm && handleArchive(showArchiveConfirm)}
            disabled={isMutatingId === showArchiveConfirm}
          >
            Confirm Archive
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
