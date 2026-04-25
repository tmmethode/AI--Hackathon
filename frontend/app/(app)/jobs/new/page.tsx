"use client";

import { type ChangeEvent, type ComponentType, type FormEvent, type ReactNode, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileText,
  Link2,
  LoaderCircle,
  Play,
  Save,
  SlidersHorizontal,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { type EducationLevel, type EmploymentType, type LocationPolicy, type SeniorityLevel } from "@/lib/jobs";
import { parseJobFromFile, parseJobFromLink } from "@/lib/job-import";
import {
  mergeParsedJobData as mergeParsedJobDataAction,
  setShowSuccessModal as setShowSuccessModalAction,
  submitJob as submitJobAction,
  updateFormField as updateFormFieldAction,
  updateWeightValue as updateWeightValueAction,
} from "@/lib/features/jobs/jobFormSlice";

interface SectionProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  step?: number;
  children: ReactNode;
}

interface JobFormState {
  title: string;
  location: string;
  locationPolicy: LocationPolicy | "";
  employmentType: EmploymentType | "";
  salaryBand: string;
  description: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications: string;
  coreHardSkills: string;
  coreSoftSkills: string;
  experienceYears: string;
  seniorityLevel: SeniorityLevel | "";
  educationLevel: EducationLevel | "";
}

function Section({ icon: Icon, title, description, step, children }: SectionProps) {
  return (
    <Card className="p-6 transition-shadow duration-200 hover:shadow-soft">
      <header className="mb-6 flex items-start gap-3">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10" aria-hidden>
          <Icon className="h-5 w-5 text-brand" />
          {step != null && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand text-[10px] font-bold leading-none text-white shadow-sm">
              {step}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
        </div>
      </header>
      {children}
    </Card>
  );
}

export default function NewJobPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { form, weightCriteria, showSuccessModal, createdJobTitle, error, isSubmitting } = useAppSelector(
    (state) => state.jobForm
  );
  const [jobUrl, setJobUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [linkState, setLinkState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [fileState, setFileState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importError, setImportError] = useState("");
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const uploadConstraints = useMemo(
    () => ({
      maxBytes: 10 * 1024 * 1024,
      acceptedExtensions: [".pdf", ".doc", ".docx"],
      acceptedMimeTypes: new Set([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]),
    }),
    []
  );
  const weightTotal = useMemo(
    () => weightCriteria.reduce((sum, criterion) => sum + criterion.value, 0),
    [weightCriteria]
  );

  function updateFormField<Key extends keyof JobFormState>(key: Key, value: JobFormState[Key]) {
    dispatch(updateFormFieldAction({ field: key, value }));
  }

  function updateWeightValue(id: string, value: number) {
    dispatch(updateWeightValueAction({ id, value }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void dispatch(submitJobAction({ status: "Active" }));
  }

  function applyParsedJobData(data: Parameters<typeof mergeParsedJobDataAction>[0]) {
    dispatch(mergeParsedJobDataAction(data));
  }

  async function handleParseFromLink() {
    if (!jobUrl.trim()) {
      setLinkState("error");
      setImportError("Please enter a public job link to parse.");
      return;
    }

    setLinkState("loading");
    setImportError("");
    setImportWarnings([]);

    try {
      const response = await parseJobFromLink(jobUrl.trim());
      applyParsedJobData(response.data);
      setImportWarnings(response.warnings || []);
      setLinkState("success");
    } catch (parseError) {
      setLinkState("error");
      setImportError(parseError instanceof Error ? parseError.message : "Unable to parse this job link.");
    }
  }

  function handleSelectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileState("idle");
    setImportError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const extensionSupported = uploadConstraints.acceptedExtensions.includes(extension);
    const mimeSupported = !file.type || uploadConstraints.acceptedMimeTypes.has(file.type);

    if (!extensionSupported || !mimeSupported) {
      setSelectedFile(null);
      setFileState("error");
      setImportError("Unsupported file type. Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    if (file.size > uploadConstraints.maxBytes) {
      setSelectedFile(null);
      setFileState("error");
      setImportError("File is too large. Please upload a file up to 10MB.");
      return;
    }

    setSelectedFile(file);
  }

  async function handleParseFromFile() {
    if (!selectedFile) {
      setFileState("error");
      setImportError("Please choose a PDF, DOC, or DOCX file first.");
      return;
    }

    setFileState("loading");
    setImportError("");
    setImportWarnings([]);

    try {
      const response = await parseJobFromFile(selectedFile);
      applyParsedJobData(response.data);
      setImportWarnings(response.warnings || []);
      setFileState("success");
    } catch (parseError) {
      setFileState("error");
      setImportError(parseError instanceof Error ? parseError.message : "Unable to parse this file.");
    }
  }

  return (
    <div className="w-full px-6 py-5">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-ink-muted" aria-label="Breadcrumb">
        <Link href="/jobs" className="transition-colors hover:text-brand">Jobs</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">New Requisition</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Create New Job Requisition</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Drafting: {form.title || "Untitled Role"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs">
            <Button variant="secondary" size="sm" leftIcon={<X className="h-3.5 w-3.5" />}>Cancel</Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={isSubmitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            onClick={() => void dispatch(submitJobAction({ status: "Draft" }))}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
          <Button
            size="sm"
            leftIcon={isSubmitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            onClick={() => void dispatch(submitJobAction({ status: "Active" }))}
            disabled={isSubmitting}
          >
            Save Job
          </Button>
        </div>
      </div>

      {/* Step progress */}
      <div className="mb-6 flex items-center gap-0" aria-label="Form sections">
        {[
          { label: "Import", num: 1 },
          { label: "Fundamentals", num: 2 },
          { label: "Description", num: 3 },
          { label: "Profile", num: 4 },
          { label: "Weights", num: 5 },
        ].map((s, i, arr) => (
          <div key={s.num} className="flex flex-1 items-center">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                {s.num}
              </span>
              <span className="hidden text-xs font-medium text-ink-muted sm:inline">{s.label}</span>
            </div>
            {i < arr.length - 1 && <div className="mx-2 h-px flex-1 bg-line" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-5" onSubmit={handleSave}>
        <Section
          icon={Brain}
          title="AI Import (Optional)"
          description="Use Gemini to prefill this job form from a public link or job document."
          step={1}
        >
          <p className="mb-5 text-sm text-ink-muted">Review all AI-filled fields before saving.</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-line p-4 transition-colors hover:border-brand/30">
              <div className="mb-2 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold text-ink">Paste Job Link</h3>
              </div>
              <p className="mt-1 text-xs text-ink-muted">Paste a public job link to extract job details.</p>
              <Input
                className="mt-3"
                placeholder="https://company.com/careers/software-engineer"
                value={jobUrl}
                onChange={(event) => {
                  setJobUrl(event.target.value);
                  if (linkState !== "idle") {
                    setLinkState("idle");
                  }
                }}
                aria-label="Job posting URL"
              />
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => void handleParseFromLink()}
                  disabled={linkState === "loading" || fileState === "loading"}
                  leftIcon={linkState === "loading" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : undefined}
                >
                  Parse from link
                </Button>
                {linkState === "error" && (
                  <Button type="button" variant="secondary" onClick={() => void handleParseFromLink()}>
                    Retry
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-line p-4 transition-colors hover:border-brand/30">
              <div className="mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold text-ink">Upload Job File</h3>
              </div>
              <p className="mt-1 text-xs text-ink-muted">Upload a PDF or Word job description to extract details.</p>
              <Input
                className="mt-3"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleSelectFile}
                aria-label="Job description file"
              />
              <p className="mt-2 text-xs text-ink-muted">Supported files: PDF, DOC, DOCX up to 10MB.</p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => void handleParseFromFile()}
                  disabled={!selectedFile || linkState === "loading" || fileState === "loading"}
                  leftIcon={fileState === "loading" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : undefined}
                >
                  Parse from file
                </Button>
                {fileState === "error" && (
                  <Button type="button" variant="secondary" onClick={() => void handleParseFromFile()}>
                    Retry
                  </Button>
                )}
              </div>
              {selectedFile && <p className="mt-2 text-xs text-ink-muted">Selected: {selectedFile.name}</p>}
            </div>
          </div>

          {(linkState === "success" || fileState === "success") && (
            <div className="mt-4 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
              Job details were imported. Please review and edit fields before saving.
            </div>
          )}
          {importWarnings.length > 0 && (
            <div className="mt-4 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-ink">
              {importWarnings.join(" ")}
            </div>
          )}
          {importError && (
            <div className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {importError}
            </div>
          )}
        </Section>

        <Section
          icon={Briefcase}
          title="Role Fundamentals"
          description="Basic information about the position and recruitment context."
          step={2}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Official Job Title" className="md:col-span-2" required>
              <Input value={form.title} onChange={(event) => updateFormField("title", event.target.value)} required />
            </Field>
            <Field label="Primary Location" required>
              <Input value={form.location} onChange={(event) => updateFormField("location", event.target.value)} required />
            </Field>
            <Field label="Location Policy" required>
              <Select
                value={form.locationPolicy}
                onChange={(event) => updateFormField("locationPolicy", event.target.value as LocationPolicy)}
              >
                <option value="">Select policy</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </Select>
            </Field>
            <Field label="Employment Type" required>
              <Select
                value={form.employmentType}
                onChange={(event) => updateFormField("employmentType", event.target.value as EmploymentType)}
              >
                <option value="">Select type</option>
                <option value="full-time">Full-time Permanent</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="temporary">Temporary</option>
              </Select>
            </Field>
            <Field label="Target Salary Band (Annual)">
              <Input value={form.salaryBand} onChange={(event) => updateFormField("salaryBand", event.target.value)} />
            </Field>
          </div>
        </Section>

        <Section
          icon={FileText}
          title="Job Description & Details"
          description="Provide a comprehensive description of the role, responsibilities, and what the job entails."
          step={3}
        >
          <Field label="Job Description" className="mb-5" required>
            <RichTextEditor
              minHeight={140}
              value={form.description}
              onChange={(value) => updateFormField("description", value)}
              placeholder="Describe the role, the team, and what success looks like…"
              ariaLabel="Job description"
              required
            />
            <span className="mt-1 block text-xs text-ink-muted">A comprehensive overview of the role visible to candidates at the top of the job posting. Use the toolbar for headings, lists, and emphasis. Drag the bottom-right corner to resize.</span>
          </Field>

          <Field label="Key Responsibilities" className="mb-5" required>
            <RichTextEditor
              minHeight={180}
              value={form.responsibilities}
              onChange={(value) => updateFormField("responsibilities", value)}
              placeholder="Use the bulleted-list button to add responsibilities, one per line."
              ariaLabel="Key responsibilities"
              required
            />
            <span className="mt-1 block text-xs text-ink-muted">List the primary duties and day-to-day tasks.</span>
          </Field>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Must-have Qualifications" required>
              <RichTextEditor
                minHeight={180}
                value={form.mustHaveQualifications}
                onChange={(value) => updateFormField("mustHaveQualifications", value)}
                placeholder="List the non-negotiable requirements as a bulleted list."
                ariaLabel="Must-have qualifications"
                required
              />
              <span className="mt-1 block text-xs text-ink-muted">List the non-negotiable requirements candidates must meet.</span>
            </Field>
            <Field label="Nice-to-have Qualifications" required>
              <RichTextEditor
                minHeight={180}
                value={form.niceToHaveQualifications}
                onChange={(value) => updateFormField("niceToHaveQualifications", value)}
                placeholder="List bonus qualifications that strengthen a candidate profile."
                ariaLabel="Nice-to-have qualifications"
                required
              />
              <span className="mt-1 block text-xs text-ink-muted">Capture bonus qualifications that strengthen a candidate profile.</span>
            </Field>
          </div>
        </Section>

        <Section
          icon={UserRound}
          title="Candidate Profile & Requirements"
          description="Describe the profile you want to target so screening is tailored to this specific role."
          step={4}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Core Hard Skills">
              <Textarea
                rows={4}
                value={form.coreHardSkills}
                onChange={(event) => updateFormField("coreHardSkills", event.target.value)}
              />
              <span className="mt-1 block text-xs text-ink-muted">List the technical skills a strong candidate should already have.</span>
            </Field>
            <Field label="Core Soft Skills">
              <Textarea
                rows={4}
                value={form.coreSoftSkills}
                onChange={(event) => updateFormField("coreSoftSkills", event.target.value)}
              />
              <span className="mt-1 block text-xs text-ink-muted">List the communication, collaboration, and culture-fit skills a strong candidate should show.</span>
            </Field>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="Experience">
              <Select value={form.experienceYears} onChange={(event) => updateFormField("experienceYears", event.target.value)}>
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
                value={form.seniorityLevel}
                onChange={(event) => updateFormField("seniorityLevel", event.target.value as SeniorityLevel)}
              >
                <option value="">Select seniority</option>
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
                value={form.educationLevel}
                onChange={(event) => updateFormField("educationLevel", event.target.value as EducationLevel)}
              >
                <option value="">Select education level</option>
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
        </Section>

        <Section
          icon={SlidersHorizontal}
          title="AI Scoring Weights"
          description="Set the percentage weight Gemini applies to each candidate scoring criterion."
          step={5}
        >
          <div className="flex flex-col gap-2">
            {weightCriteria.map((criterion) => (
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
                  onChange={(event) => updateWeightValue(criterion.id, Number(event.target.value))}
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
                  weightTotal === 100 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}
              >
                {weightTotal}%
              </span>
            </div>
          </div>
        </Section>

        <Card className="mt-2 flex items-center justify-end gap-3 px-6 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/jobs")}>Discard Changes</Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={isSubmitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            onClick={() => void dispatch(submitJobAction({ status: "Draft" }))}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            size="sm"
            leftIcon={isSubmitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            disabled={isSubmitting}
          >
            Save Job
          </Button>
        </Card>
      </form>

      <Modal open={showSuccessModal} onClose={() => dispatch(setShowSuccessModalAction(false))} size="sm">
        <ModalBody className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Job Created Successfully!</h2>
            <p className="mt-2 text-sm text-ink-muted">
              {createdJobTitle || "Your job requisition"} has been saved. The next step is to ingest applicants so you can start reviewing candidates.
            </p>
          </div>

          <div className="w-full rounded-lg border border-line bg-surface-soft/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <Upload className="h-5 w-5 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">Ingest Applicants</p>
                <p className="text-xs text-ink-muted">Upload resumes, import CSVs, or connect platforms</p>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">Create Job</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">Ingest</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2.5 py-1">Screen</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2.5 py-1">Shortlist</span>
          </div>
        </ModalBody>
        <ModalFooter>
          <Link href="/jobs"><Button variant="secondary">Go to Jobs</Button></Link>
          <Link href="/ingest"><Button leftIcon={<Upload className="h-4 w-4" />}>Ingest Applicants</Button></Link>
        </ModalFooter>
      </Modal>
    </div>
  );
}
