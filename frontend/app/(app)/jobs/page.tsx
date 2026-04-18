"use client";

import { type ComponentProps, useEffect, useMemo } from "react";
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
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  getHiringManagerName,
  type JobRecord,
  type JobStatus,
} from "@/lib/jobs";
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
} from "@/lib/features/jobs/jobsSlice";

const statusTone: Record<JobStatus, ComponentProps<typeof Badge>["tone"]> = {
  Active: "success",
  Draft: "neutral",
  Closed: "danger",
};

const PAGE_SIZE = 5;
const ALL_STATUSES = ["All", "Active", "Draft", "Closed"] as const;

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

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-soft/80 ${className}`} />;
}

function JobRowSkeleton({ index }: { index: number }) {
  return (
    <li
      className={`grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-[2fr_1.1fr_1.1fr_0.9fr_100px_40px] md:items-center md:gap-4 ${
        index === 0 ? "bg-brand-soft/20" : ""
      }`}
    >
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-3 w-28" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-6 w-6 rounded-full" />
        <SkeletonBlock className="h-4 w-24" />
      </div>
      <SkeletonBlock className="h-4 w-28" />
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-10" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
      <div className="md:flex md:justify-center">
        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex justify-end">
        <SkeletonBlock className="h-8 w-8 rounded-md" />
      </div>
    </li>
  );
}

function JobsSidebarSkeleton() {
  return (
    <>
      <Card className="p-5">
        <SkeletonBlock className="mx-auto h-3 w-28" />
        <div className="mt-4 flex items-start justify-between">
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
        <div className="mt-3 space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-3 w-24" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-4 w-28" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-4 w-4 rounded-full" />
            <SkeletonBlock className="h-4 w-32" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <SkeletonBlock className="h-6 w-20 rounded-full" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
        <div className="mt-2">
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </Card>

      <Card className="bg-brand-soft p-5">
        <SkeletonBlock className="h-4 w-40 bg-white/50" />
        <div className="mt-3 space-y-2">
          <SkeletonBlock className="h-3 w-full bg-white/50" />
          <SkeletonBlock className="h-3 w-11/12 bg-white/50" />
          <SkeletonBlock className="h-3 w-4/5 bg-white/50" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-24 bg-white/50" />
            <SkeletonBlock className="h-4 w-28 bg-white/50" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-20 bg-white/50" />
            <SkeletonBlock className="h-4 w-24 bg-white/50" />
          </div>
        </div>
      </Card>

      <Card className="flex items-center justify-between p-5">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-14" />
        </div>
        <div className="space-y-2 text-right">
          <SkeletonBlock className="ml-auto h-4 w-20" />
          <SkeletonBlock className="ml-auto h-3 w-16" />
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

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Jobs Management"
        description="Manage and ingest applicants for your job requisitions."
        actions={
          <>
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} disabled>
              Export Report
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

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex items-center rounded-md border border-line bg-surface shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              placeholder="Search by title, department, or manager…"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 border-l border-line px-2">
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
                      className={`grid cursor-pointer grid-cols-2 gap-3 px-5 py-4 text-sm transition-colors md:grid-cols-[2fr_1.1fr_1.1fr_0.9fr_100px_40px] md:items-center md:gap-4 ${
                        selectedId === job._id ? "bg-brand-soft/40" : "hover:bg-surface-soft/50"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-ink">{job.title}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
                          {formatJobId(job)} · {job.department}
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

          <div className="flex items-center justify-between gap-4 border-t border-line bg-surface px-5 py-4 text-sm text-ink-muted">
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
                <p className="text-xs text-ink-muted">{selected.department}</p>

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

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    <CircleCheck className="h-4 w-4 text-brand" /> Must-have Skills
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.coreHardSkills.length > 0 ? (
                      selected.coreHardSkills.map((skill) => (
                        <Badge key={skill} tone="neutral">{skill}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-ink-muted">No hard skills listed yet.</span>
                    )}
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
                    <Link href="/ingest" className="contents">
                      <Button variant="secondary" leftIcon={<Upload className="h-4 w-4" />} fullWidth>
                        Ingest
                      </Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
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
              subtitle={`${selected.department} · ${formatJobId(selected)}`}
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
              <Button variant="secondary" onClick={() => dispatch(setShowJobDetails(false))}>Close</Button>
            </ModalFooter>
          </>
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
                      {formatJobId(job)} · {job.department} · {job.applicantsCount} applicants
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
                    <p className="text-xs text-ink-muted">{formatJobId(job)} · {job.department}</p>
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
