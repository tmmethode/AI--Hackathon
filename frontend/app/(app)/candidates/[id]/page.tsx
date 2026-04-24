"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Mail,
  Download,
  Calendar,
  X,
  ShieldCheck,
  CircleAlert,
  Sparkles,
  GraduationCap,
  Award,
  Briefcase,
  Check,
  Video,
  Phone,
  Users,
  Send,
  LoaderCircle,
  Link as LinkIcon,
  FileText,
  Globe,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { loadCandidateRecords, type CandidateRecord } from "@/lib/candidates";
import type { ApplicantCertification, ApplicantEducation, ApplicantExperience } from "@/lib/applicants";
import { resolveParsedApplicantHighlights } from "@/lib/applicant-profile";
import { createPdfFromLines } from "@/lib/pdf";
import { downloadBlob, sanitizeFilename } from "@/lib/download";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatMatchTone(score: number) {
  if (score >= 85) {
    return "VERY HIGH";
  }

  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 50) {
    return "MEDIUM";
  }

  return "LOW";
}

function formatExperienceTimeline(startDate?: string, endDate?: string, isCurrent?: boolean) {
  const start = startDate ? new Date(startDate) : null;
  const end = isCurrent ? null : endDate ? new Date(endDate) : null;

  const startLabel = start && !Number.isNaN(start.getTime())
    ? start.getFullYear().toString()
    : "Unknown";
  const endLabel = isCurrent
    ? "Present"
    : end && !Number.isNaN(end.getTime())
    ? end.getFullYear().toString()
    : "Unknown";

  return `${startLabel} - ${endLabel}`;
}

function buildEmailBody(candidate: CandidateRecord) {
  const firstName = candidate.firstName?.trim() || candidate.name.split(" ")[0] || "there";

  return `Hi ${firstName},

Thank you for your application for the ${candidate.job} position. We reviewed your profile and would love to move forward with the next step in our hiring process.

Please let us know your availability and we will share the details with you.

Best regards,
Umurava Hiring Team`;
}

function formatCvTimeline(start?: string, end?: string, isCurrent?: boolean) {
  const startLabel = start?.trim() || "Unknown";
  const endLabel = isCurrent ? "Present" : end?.trim() || "Unknown";
  return `${startLabel} — ${endLabel}`;
}

function buildCandidateCvPdfLines(
  candidate: CandidateRecord,
  experienceEntries: ApplicantExperience[],
  educationEntries: ApplicantEducation[],
  certifications: ApplicantCertification[]
): string[] {
  const applicant = candidate.applicant;
  const skills = applicant?.skills || [];
  const languages = applicant?.languages || [];
  const projects = applicant?.projects || [];
  const socialLinks = applicant?.socialLinks;
  const availability = applicant?.availability;
  const bio = applicant?.bio?.trim() || candidate.bio?.trim() || candidate.summary?.trim() || "";
  const headline = applicant?.headline?.trim() || candidate.headline?.trim() || "";

  const lines: string[] = [
    candidate.name,
    headline || candidate.job || "",
    "",
    "Contact",
    `Email: ${candidate.email || "—"}`,
    `Location: ${candidate.location || "—"}`,
  ];

  if (socialLinks?.linkedin) lines.push(`LinkedIn: ${socialLinks.linkedin}`);
  if (socialLinks?.github) lines.push(`GitHub: ${socialLinks.github}`);
  if (socialLinks?.portfolio) lines.push(`Portfolio: ${socialLinks.portfolio}`);

  if (bio) {
    lines.push("", "Professional Summary", bio);
  }

  if (skills.length > 0) {
    lines.push("", "Skills");
    skills.forEach((skill) => {
      const meta = [skill.level, skill.yearsOfExperience ? `${skill.yearsOfExperience} years` : null]
        .filter(Boolean)
        .join(" · ");
      lines.push(`- ${skill.name}${meta ? ` (${meta})` : ""}`);
    });
  }

  if (languages.length > 0) {
    lines.push("", "Languages");
    languages.forEach((language) => {
      lines.push(`- ${language.name}${language.proficiency ? ` — ${language.proficiency}` : ""}`);
    });
  }

  lines.push("", "Professional Experience");
  if (experienceEntries.length > 0) {
    experienceEntries.forEach((entry, index) => {
      lines.push(
        `${index + 1}. ${entry.role || "Role"} @ ${entry.company || "—"} (${formatCvTimeline(entry.startDate, entry.endDate, entry.isCurrent)})`
      );
      if (entry.description) {
        lines.push(`   ${entry.description}`);
      }
      if (entry.technologies && entry.technologies.length > 0) {
        lines.push(`   Technologies: ${entry.technologies.join(", ")}`);
      }
    });
  } else {
    lines.push("No work experience parsed.");
  }

  lines.push("", "Education");
  if (educationEntries.length > 0) {
    educationEntries.forEach((entry, index) => {
      const degreeLabel = entry.degree || entry.fieldOfStudy || "Program";
      const years = [entry.startYear, entry.endYear].filter(Boolean).join(" — ");
      lines.push(`${index + 1}. ${degreeLabel} — ${entry.institution || "—"}${years ? ` (${years})` : ""}`);
      if (entry.fieldOfStudy && entry.degree) {
        lines.push(`   Field: ${entry.fieldOfStudy}`);
      }
    });
  } else {
    lines.push("No education parsed.");
  }

  if (projects.length > 0) {
    lines.push("", "Projects");
    projects.forEach((project, index) => {
      lines.push(
        `${index + 1}. ${project.name}${project.role ? ` — ${project.role}` : ""} (${formatCvTimeline(project.startDate, project.endDate)})`
      );
      if (project.description) lines.push(`   ${project.description}`);
      if (project.technologies && project.technologies.length > 0) {
        lines.push(`   Technologies: ${project.technologies.join(", ")}`);
      }
      if (project.link) lines.push(`   Link: ${project.link}`);
    });
  }

  if (certifications.length > 0) {
    lines.push("", "Certifications");
    certifications.forEach((cert, index) => {
      const meta = [cert.issuer, cert.issueDate].filter(Boolean).join(" · ");
      lines.push(`${index + 1}. ${cert.name}${meta ? ` (${meta})` : ""}`);
    });
  }

  if (availability && (availability.status || availability.type || availability.startDate)) {
    lines.push("", "Availability");
    if (availability.status) lines.push(`Status: ${availability.status}`);
    if (availability.type) lines.push(`Type: ${availability.type}`);
    if (availability.startDate) lines.push(`Start Date: ${availability.startDate}`);
  }

  return lines;
}

interface CvViewProps {
  candidate: CandidateRecord;
  experienceEntries: ApplicantExperience[];
  educationEntries: ApplicantEducation[];
  certifications: ApplicantCertification[];
  onOpenResume: () => void;
  onExport: () => void;
  onDownloadCv: () => void;
}

function CvView({
  candidate,
  experienceEntries,
  educationEntries,
  certifications,
  onOpenResume,
  onExport,
  onDownloadCv,
}: CvViewProps) {
  const applicant = candidate.applicant;
  const skills = applicant?.skills || [];
  const languages = applicant?.languages || [];
  const projects = applicant?.projects || [];
  const socialLinks = applicant?.socialLinks;
  const availability = applicant?.availability;
  const bio = applicant?.bio?.trim() || candidate.bio?.trim() || candidate.summary?.trim();
  const headline = applicant?.headline?.trim() || candidate.headline?.trim();

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        {(bio || headline) && (
          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand" />
              <h3 className="font-display text-base font-semibold text-ink">Professional Summary</h3>
            </div>
            {headline && <p className="text-sm font-semibold text-ink">{headline}</p>}
            {bio && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{bio}</p>}
          </Card>
        )}

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-brand" />
            <h3 className="font-display text-base font-semibold text-ink">Professional Experience</h3>
          </div>
          {experienceEntries.length > 0 ? (
            <ol className="space-y-5">
              {experienceEntries.map((entry, index) => (
                <li key={`${entry.company}-${entry.role}-${index}`} className="border-l-2 border-brand/30 pl-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">{entry.role || "Role"}</p>
                      <p className="text-sm text-ink-muted">{entry.company || "Company"}</p>
                    </div>
                    <span className="text-xs text-ink-muted">
                      {formatExperienceTimeline(entry.startDate, entry.endDate, entry.isCurrent)}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="mt-2 whitespace-pre-line text-xs leading-5 text-ink-muted">{entry.description}</p>
                  )}
                  {entry.technologies && entry.technologies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entry.technologies.map((tech) => (
                        <Badge key={`${index}-${tech}`} tone="neutral">{tech}</Badge>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-muted">No work experience has been parsed from this CV.</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            <h3 className="font-display text-base font-semibold text-ink">Education</h3>
          </div>
          {educationEntries.length > 0 ? (
            <ul className="space-y-4">
              {educationEntries.map((entry, index) => (
                <li key={`${entry.institution}-${entry.degree}-${index}`} className="flex items-start justify-between gap-3 border-l-2 border-brand/30 pl-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{entry.degree || entry.fieldOfStudy || "Program"}</p>
                    <p className="text-sm text-ink-muted">{entry.institution || "Institution"}</p>
                    {entry.fieldOfStudy && entry.degree && (
                      <p className="text-xs text-ink-muted">{entry.fieldOfStudy}</p>
                    )}
                  </div>
                  <span className="text-xs text-ink-muted">
                    {[entry.startYear, entry.endYear].filter(Boolean).join(" — ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">No education history has been parsed.</p>
          )}
        </Card>

        {projects.length > 0 && (
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-brand" />
              <h3 className="font-display text-base font-semibold text-ink">Projects</h3>
            </div>
            <ul className="space-y-5">
              {projects.map((project, index) => (
                <li key={`${project.name}-${index}`} className="border-l-2 border-brand/30 pl-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{project.name}</p>
                    <span className="text-xs text-ink-muted">
                      {formatExperienceTimeline(project.startDate, project.endDate)}
                    </span>
                  </div>
                  {project.role && <p className="text-xs text-ink-muted">{project.role}</p>}
                  {project.description && (
                    <p className="mt-1 whitespace-pre-line text-xs leading-5 text-ink-muted">{project.description}</p>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <Badge key={`${index}-${tech}`} tone="neutral">{tech}</Badge>
                      ))}
                    </div>
                  )}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand hover:underline"
                    >
                      <LinkIcon className="h-3 w-3" />
                      {project.link}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {certifications.length > 0 && (
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-brand" />
              <h3 className="font-display text-base font-semibold text-ink">Certifications</h3>
            </div>
            <ul className="space-y-3">
              {certifications.map((cert, index) => (
                <li key={`${cert.name}-${index}`} className="flex items-start justify-between gap-3 border-l-2 border-brand/30 pl-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{cert.name}</p>
                    {cert.issuer && <p className="text-xs text-ink-muted">{cert.issuer}</p>}
                  </div>
                  {cert.issueDate && <span className="text-xs text-ink-muted">{cert.issueDate}</span>}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <aside className="flex flex-col gap-5">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink">Contact</h3>
          <ul className="mt-3 space-y-2 text-xs text-ink">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
              <span className="break-all">{candidate.email}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
              <span>{candidate.location || "—"}</span>
            </li>
            {socialLinks?.linkedin && (
              <li className="flex items-start gap-2">
                <LinkIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="break-all text-brand hover:underline">
                  {socialLinks.linkedin}
                </a>
              </li>
            )}
            {socialLinks?.github && (
              <li className="flex items-start gap-2">
                <LinkIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="break-all text-brand hover:underline">
                  {socialLinks.github}
                </a>
              </li>
            )}
            {socialLinks?.portfolio && (
              <li className="flex items-start gap-2">
                <LinkIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
                <a href={socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="break-all text-brand hover:underline">
                  {socialLinks.portfolio}
                </a>
              </li>
            )}
          </ul>
        </Card>

        {skills.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Skills</h3>
            <ul className="mt-3 space-y-2">
              {skills.map((skill, index) => (
                <li key={`${skill.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink">{skill.name}</span>
                  <span className="text-ink-muted">
                    {[skill.level, skill.yearsOfExperience ? `${skill.yearsOfExperience}y` : null].filter(Boolean).join(" · ") || ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {languages.length > 0 && (
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold text-ink">Languages</h3>
            </div>
            <ul className="space-y-1.5">
              {languages.map((language, index) => (
                <li key={`${language.name}-${index}`} className="flex items-center justify-between text-xs">
                  <span className="text-ink">{language.name}</span>
                  {language.proficiency && <span className="text-ink-muted">{language.proficiency}</span>}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {availability && (availability.status || availability.type || availability.startDate) && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Availability</h3>
            <dl className="mt-3 space-y-2 text-xs">
              {availability.status && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-muted">Status</dt>
                  <dd className="text-ink">{availability.status}</dd>
                </div>
              )}
              {availability.type && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-muted">Type</dt>
                  <dd className="text-ink">{availability.type}</dd>
                </div>
              )}
              {availability.startDate && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-muted">Start Date</dt>
                  <dd className="text-ink">{availability.startDate}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink">Downloads</h3>
          <Button
            size="sm"
            fullWidth
            className="mt-3"
            leftIcon={<FileText className="h-4 w-4" />}
            onClick={onDownloadCv}
          >
            Download CV (PDF)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            className="mt-2"
            leftIcon={<Download className="h-4 w-4" />}
            disabled={!candidate.sourceUrl}
            onClick={onOpenResume}
          >
            {candidate.sourceFileName || (candidate.sourceUrl ? "View original resume" : "Original resume unavailable")}
          </Button>
          <Button variant="secondary" size="sm" fullWidth className="mt-2" leftIcon={<Download className="h-4 w-4" />} onClick={onExport}>
            Export AI Report (PDF)
          </Button>
        </Card>
      </aside>
    </div>
  );
}

export default function CandidateDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const candidateParamId = resolvedParams.id;
  const searchParams = useSearchParams();
  const initialView = searchParams?.get("view") === "cv" ? "cv" : "summary";
  const [view, setView] = useState<"summary" | "cv">(initialView);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [scheduleSent, setScheduleSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [candidate, setCandidate] = useState<CandidateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const nextView = searchParams?.get("view") === "cv" ? "cv" : "summary";
    setView(nextView);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadCandidate() {
      setLoading(true);
      setLoadError("");

      try {
        const allCandidates = await loadCandidateRecords();
        const candidateId = decodeURIComponent(candidateParamId);
        const match = allCandidates.find((entry) => entry.id === candidateId) ?? null;

        if (cancelled) {
          return;
        }

        setCandidate(match);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCandidate(null);
        setLoadError(error instanceof Error ? error.message : "Failed to load candidate.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCandidate();

    return () => {
      cancelled = true;
    };
  }, [candidateParamId]);

  function handleSchedule() {
    setScheduleSent(true);
    setTimeout(() => {
      setScheduleSent(false);
      setShowSchedule(false);
    }, 1500);
  }

  function handleSendEmail() {
    setEmailSent(true);
    setTimeout(() => {
      setEmailSent(false);
      setShowEmail(false);
    }, 1500);
  }

  function handleOpenResume() {
    if (!candidate) return;
    if (candidate.sourceUrl) {
      window.open(candidate.sourceUrl, "_blank", "noopener,noreferrer");
    }
  }

  function handleDownloadCv() {
    if (!candidate) return;

    const { experience: experienceEntries, education: educationEntries, certifications } =
      resolveParsedApplicantHighlights(candidate.applicant);

    const lines = buildCandidateCvPdfLines(candidate, experienceEntries, educationEntries, certifications);
    const blob = createPdfFromLines(lines);
    const filename = `${sanitizeFilename(`cv_${candidate.name}`)}.pdf`;
    downloadBlob(blob, filename);
  }

  function handleExportAiReport() {
    if (!candidate) return;

    const { experience: experienceEntries, education: educationEntries, certifications } =
      resolveParsedApplicantHighlights(candidate.applicant);
    const formatTimeline = (start?: string, end?: string, isCurrent?: boolean) => {
      const s = start ? new Date(start) : null;
      const e = isCurrent ? null : end ? new Date(end) : null;
      const sLabel = s && !Number.isNaN(s.getTime()) ? s.getFullYear().toString() : "Unknown";
      const eLabel = isCurrent
        ? "Present"
        : e && !Number.isNaN(e.getTime())
          ? e.getFullYear().toString()
          : "Unknown";
      return `${sLabel} - ${eLabel}`;
    };

    const lines: string[] = [
      "AI Candidate Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      candidate.name,
      `Email: ${candidate.email || "—"}`,
      `Role Applied: ${candidate.job || "—"}`,
      `Location: ${candidate.location || "—"}`,
      `Source: ${candidate.sourceFileName || candidate.sourceUrl || candidate.source || "—"}`,
      `Status: ${candidate.status}`,
      "",
      "AI Scores",
      `Overall Match: ${candidate.matchScore}%`,
      candidate.criterionAssessments && candidate.criterionAssessments.length > 0
        ? candidate.criterionAssessments.map((criterion) => `${criterion.label}: ${criterion.score}%`).join(" | ")
        : `Core Hard & Soft Skills: ${candidate.scores?.skills ?? "—"}% | Years of Experience & Seniority Level: ${candidate.scores?.experience ?? "—"}% | Educational Background: ${candidate.scores?.education ?? "—"}%`,
      candidate.finalRecommendation ? `Recommendation: ${candidate.finalRecommendation}` : "",
      "",
      "AI Summary",
      candidate.summary || candidate.bio || "No AI summary available.",
      "",
      "Key Strengths",
      ...(candidate.strengths.length
        ? candidate.strengths.map((item, index) => `${index + 1}. ${item}`)
        : ["No strengths captured."]),
      "",
      "Potential Gaps & Risks",
      ...(candidate.gapsOrRisks.length
        ? candidate.gapsOrRisks.map((item, index) => `${index + 1}. ${item}`)
        : ["No gaps or risks reported."]),
      "",
      "Experience",
      ...(experienceEntries.length
        ? experienceEntries.flatMap((entry, index) => [
            `${index + 1}. ${entry.role || "Role"} @ ${entry.company || "—"} (${formatTimeline(entry.startDate, entry.endDate, entry.isCurrent)})`,
            entry.description ? `   ${entry.description}` : "",
          ])
        : ["No experience entries parsed."]),
      "",
      "Education",
      ...(educationEntries.length
        ? educationEntries.map((entry, index) =>
            `${index + 1}. ${entry.degree || entry.fieldOfStudy || "Program"} — ${entry.institution || "—"}${entry.endYear ? `, ${entry.endYear}` : ""}`
          )
        : ["No education entries parsed."]),
      "",
      "Certifications",
      ...(certifications.length
        ? certifications.map((cert, index) => `${index + 1}. ${cert.name}`)
        : ["No certifications extracted."]),
    ].filter((line) => line !== undefined);

    const blob = createPdfFromLines(lines);
    const filename = `${sanitizeFilename(`ai-report_${candidate.name}_${candidate.job}`)}.pdf`;
    downloadBlob(blob, filename);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-10">
        <div className="flex items-center gap-3 rounded-md border border-line bg-white px-5 py-4 text-sm text-ink-muted shadow-soft">
          <LoaderCircle className="h-4 w-4 animate-spin text-brand" />
          Loading candidate details...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full px-6 py-5">
        <Card className="p-6">
          <h1 className="font-display text-xl font-semibold text-ink">Candidate details unavailable</h1>
          <p className="mt-2 text-sm text-danger">{loadError}</p>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="w-full px-6 py-5">
        <Card className="p-6">
          <h1 className="font-display text-xl font-semibold text-ink">Candidate not found</h1>
          <p className="mt-2 text-sm text-ink-muted">
            We could not find a live candidate record for <span className="font-mono text-xs">{decodeURIComponent(candidateParamId)}</span>.
          </p>
        </Card>
      </div>
    );
  }

  const { experience: experienceEntries, education: educationEntries, certifications } =
    resolveParsedApplicantHighlights(candidate.applicant);
  const strengths = candidate.strengths.length > 0 ? candidate.strengths : candidate.skills;
  const risks = candidate.gapsOrRisks;
  const hasAiExplanation =
    Boolean(candidate.summary?.trim()) ||
    candidate.strengths.length > 0 ||
    candidate.gapsOrRisks.length > 0;
  const recruiterNote = candidate.shortlistRecord?.instructions?.trim();
  const topCandidate = candidate.matchScore >= 85;

  return (
    <div className="w-full px-6 py-5">
      <Card className="mb-6 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={candidate.name} size={72} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{candidate.name}</h1>
                {candidate.status === "shortlisted" ? <Badge tone="success" pill>Shortlisted</Badge> : null}
              </div>
              <p className="text-sm text-ink-muted">
                {candidate.job} {candidate.experience !== "—" ? `· ${candidate.experience}` : ""}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
                <li className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {candidate.location || "Location unavailable"}
                </li>
                <li className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {candidate.email}
                </li>
                <li className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  {candidate.sourceFileName || candidate.sourceUrl || candidate.source}
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="rounded-md bg-success/10 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-success-deep">AI Match Score</p>
              <p className="font-display text-3xl font-bold text-success">{candidate.matchScore}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-success">
                {formatMatchTone(candidate.matchScore)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" leftIcon={<X className="h-4 w-4" />} onClick={() => setShowReject(true)}>
                Reject
              </Button>
              <Button leftIcon={<Calendar className="h-4 w-4" />} onClick={() => setShowSchedule(true)}>
                Schedule Interview
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div role="tablist" aria-label="Candidate view" className="mb-6 inline-flex rounded-lg border border-line bg-surface p-1 shadow-soft">
        {([
          { id: "summary" as const, label: "AI Summary", icon: Sparkles },
          { id: "cv" as const, label: "Full CV", icon: FileText },
        ]).map((tab) => {
          const Icon = tab.icon;
          const isActive = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setView(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand text-white shadow-sm"
                  : "text-ink-muted hover:bg-surface-soft hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {view === "cv" ? (
        <CvView
          candidate={candidate}
          experienceEntries={experienceEntries}
          educationEntries={educationEntries}
          certifications={certifications}
          onOpenResume={handleOpenResume}
          onExport={handleExportAiReport}
          onDownloadCv={handleDownloadCv}
        />
      ) : (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card className="bg-brand-soft/40 p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-info-deep" />
              <h2 className="font-display text-base font-bold text-info-deep">
                AI Recommendation: {candidate.finalRecommendation || "Review Candidate"}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-info-deep/80">
              {candidate.summary ||
                candidate.bio ||
                "This candidate was outside the cached AI explanation window for the latest screening run."}
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <h3 className="font-display text-base font-semibold text-ink">Key Strengths</h3>
            </div>
            <ul className="space-y-4">
              {strengths.length > 0 ? (
                strengths.map((strength, index) => (
                  <li key={`${strength}-${index}`} className="rounded-md border border-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-ink">Strength {index + 1}</h4>
                      <Badge tone="success">{candidate.skills[index] || "AI Screen"}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">{strength}</p>
                  </li>
                ))
              ) : (
                <li className="rounded-md border border-dashed border-line p-4 text-xs text-ink-muted">
                  {hasAiExplanation
                    ? "No strengths were extracted from the latest screening run."
                    : "AI strengths were not generated for this lower-ranked candidate in the latest run."}
                </li>
              )}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-danger" />
              <h3 className="font-display text-base font-semibold text-ink">Potential Gaps &amp; Risks</h3>
            </div>
            <ul className="space-y-4">
              {risks.length > 0 ? (
                risks.map((risk, index) => (
                  <li key={`${risk}-${index}`} className="rounded-md border border-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-ink">Risk {index + 1}</h4>
                      <Badge tone="danger">AI Screen</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">{risk}</p>
                  </li>
                ))
              ) : (
                <li className="rounded-md border border-dashed border-line p-4 text-xs text-ink-muted">
                  {hasAiExplanation
                    ? "No gaps or risks were reported by the latest screening run."
                    : "AI gaps and risks were not generated for this lower-ranked candidate in the latest run."}
                </li>
              )}
            </ul>
            <p className="mt-4 rounded-md bg-surface-soft/60 p-3 text-xs italic text-ink-muted">
              {recruiterNote
                ? `"${recruiterNote}"`
                : "No recruiter note has been added for this candidate yet."}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-ink">Internal Recruiter Notes</h3>
            {recruiterNote ? (
              <div className="mt-4 rounded-md border border-line p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">Latest Screening Instructions</span>
                  <span className="text-ink-muted">{candidate.appliedDate || "Recent"}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-ink-muted">{recruiterNote}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-line p-4 text-xs text-ink-muted">
                No internal note is stored for this candidate yet.
              </div>
            )}
            <Textarea className="mt-4" placeholder="Add a private note about this candidate..." />
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-ink-muted">Visible to hiring team only</span>
              <Button size="sm">Save Note</Button>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">AI Criteria Scores</h3>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {(candidate.criterionAssessments && candidate.criterionAssessments.length > 0
                ? candidate.criterionAssessments
                : [
                    { label: "Core Hard & Soft Skills", score: candidate.scores?.skills ?? candidate.matchScore },
                    { label: "Years of Experience & Seniority Level", score: candidate.scores?.experience ?? 0 },
                  ]
              ).map((criterion) => (
                <div key={criterion.label} className="rounded-md bg-surface-soft p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase text-ink-muted">{criterion.label}</p>
                    <p className="font-display text-lg font-bold text-brand">{criterion.score}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Parsed Resume Highlights</h3>

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Recent Experience</p>
              <div className="mt-2 space-y-3">
                {experienceEntries.length > 0 ? (
                  experienceEntries.slice(0, 3).map((entry, index) => (
                    <div key={`${entry.company}-${entry.role}-${index}`} className="flex gap-2">
                      <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      <div>
                        <p className="text-sm font-medium text-ink">{entry.role || "Experience Entry"}</p>
                        <p className="text-xs text-ink-muted">
                          {[entry.company, formatExperienceTimeline(entry.startDate, entry.endDate, entry.isCurrent)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {entry.description ? (
                          <p className="mt-1 text-xs text-ink-muted">{entry.description}</p>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-ink-muted">No parsed experience entries are available.</p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Education</p>
              {educationEntries.length > 0 ? (
                educationEntries.slice(0, 2).map((entry, index) => (
                  <div key={`${entry.institution}-${entry.degree}-${index}`} className="mt-2 flex gap-2">
                    <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-medium text-ink">{entry.degree || entry.fieldOfStudy || "Education"}</p>
                      <p className="text-xs text-ink-muted">
                        {[entry.institution, entry.endYear]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="mt-2 text-xs text-ink-muted">No education details were parsed.</p>
              )}
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Certifications</p>
              {certifications.length > 0 ? (
                <ul className="mt-2 space-y-1.5 text-xs text-ink">
                  {certifications.slice(0, 4).map((certification, index) => (
                    <li key={`${certification.name}-${index}`} className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-brand" />
                      {certification.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-ink-muted">No certifications were extracted.</p>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              fullWidth
              className="mt-5"
              leftIcon={<Download className="h-4 w-4" />}
              disabled={!candidate.sourceUrl}
              onClick={handleOpenResume}
              title={
                candidate.sourceUrl
                  ? "Open resume source in a new tab"
                  : "No resume source URL is available for this candidate"
              }
            >
              {candidate.sourceFileName
                ? `View ${candidate.sourceFileName}`
                : candidate.sourceUrl
                  ? "View resume source"
                  : "Resume source unavailable"}
            </Button>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Quick Actions</h3>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                variant="secondary"
                fullWidth
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleExportAiReport}
              >
                Export Full AI Report
              </Button>
              <Button variant="secondary" fullWidth leftIcon={<Mail className="h-4 w-4" />} onClick={() => setShowEmail(true)}>
                Email Candidate
              </Button>
            </div>
            <p className="mt-3 text-[10px] text-ink-muted">Viewing candidate {candidate.id}</p>
          </Card>
        </aside>
      </div>
      )}

      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} size="md">
        <ModalHeader
          title="Schedule Interview"
          subtitle={`Set up an interview with ${candidate.name}`}
          onClose={() => setShowSchedule(false)}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">Interview Setup</p>
        </ModalHeader>
        <ModalBody className="flex flex-col gap-5">
          <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
            <Avatar name={candidate.name} size={40} />
            <div>
              <p className="text-sm font-medium text-ink">{candidate.name}</p>
              <p className="text-xs text-ink-muted">{candidate.job} · {candidate.matchScore}% Match</p>
            </div>
            {topCandidate ? <Badge tone="success" pill className="ml-auto">Top Candidate</Badge> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Interview Type">
              <div className="flex gap-2">
                {([
                  { icon: Video, label: "Video Call" },
                  { icon: Phone, label: "Phone" },
                  { icon: Users, label: "In Person" },
                ] as const).map((type, index) => (
                  <button
                    key={type.label}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-colors ${
                      index === 0 ? "border-brand bg-brand-soft/30 text-brand" : "border-line text-ink-muted hover:bg-surface-soft"
                    }`}
                  >
                    <type.icon className="h-3.5 w-3.5" />
                    {type.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Interview Round">
              <Select defaultValue="technical">
                <option value="phone">Phone Screen</option>
                <option value="technical">Technical Interview</option>
                <option value="behavioral">Behavioral Interview</option>
                <option value="final">Final Round / Panel</option>
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" />
            </Field>
            <Field label="Time">
              <Input type="time" defaultValue="14:00" />
            </Field>
            <Field label="Duration">
              <Select defaultValue="60">
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </Select>
            </Field>
            <Field label="Interviewer(s)">
              <Input placeholder="e.g. Marcus Chen, Sarah Lee" />
            </Field>
          </div>

          <Field label="Meeting Link / Location">
            <Input placeholder="https://meet.google.com/..." />
          </Field>

          <Field label="Notes for Interviewer">
            <Textarea
              rows={3}
              placeholder="Any specific areas to probe, topics to cover..."
              defaultValue={risks.length > 0 ? `Probe deeper on: ${risks.join("; ")}` : ""}
            />
          </Field>

          <div className="rounded-md bg-brand-soft/40 p-3 text-xs text-info-deep">
            <strong>Tip:</strong> Calendar invites will be automatically sent to the candidate and interviewers upon confirmation.
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowSchedule(false)}>Cancel</Button>
          <Button
            leftIcon={scheduleSent ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            onClick={handleSchedule}
          >
            {scheduleSent ? "Scheduled!" : "Confirm & Send Invite"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showEmail} onClose={() => setShowEmail(false)} size="md">
        <ModalHeader
          title="Email Candidate"
          subtitle={`Send a message to ${candidate.name}`}
          onClose={() => setShowEmail(false)}
        />
        <ModalBody className="flex flex-col gap-4">
          <Field label="To">
            <Input defaultValue={candidate.email} readOnly className="bg-surface-soft/50" />
          </Field>
          <Field label="Subject">
            <Input defaultValue={`Next Steps - ${candidate.job} Position at Umurava`} />
          </Field>
          <Field label="Message">
            <Textarea rows={6} defaultValue={buildEmailBody(candidate)} />
          </Field>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Mail className="h-3.5 w-3.5" />
            Email will be sent from hiring@umurava.africa
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowEmail(false)}>Cancel</Button>
          <Button
            leftIcon={emailSent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            onClick={handleSendEmail}
          >
            {emailSent ? "Sent!" : "Send Email"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showReject} onClose={() => setShowReject(false)} size="sm">
        <ModalHeader
          title="Reject Candidate"
          subtitle="This action can be undone later from the candidate history."
          onClose={() => setShowReject(false)}
        />
        <ModalBody className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-md border border-danger/20 bg-danger/5 p-3">
            <Avatar name={candidate.name} size={36} />
            <div>
              <p className="text-sm font-medium text-ink">{candidate.name}</p>
              <p className="text-xs text-ink-muted">{candidate.matchScore}% Match Score · {candidate.job}</p>
            </div>
          </div>
          <Field label="Rejection Reason">
            <Select defaultValue="">
              <option value="">Select a reason…</option>
              <option value="skills">Skills mismatch</option>
              <option value="experience">Insufficient experience</option>
              <option value="culture">Culture fit concerns</option>
              <option value="compensation">Compensation expectations</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Internal Notes (optional)">
            <Textarea rows={2} placeholder="Add context for other hiring team members..." />
          </Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowReject(false)}>Cancel</Button>
          <Button variant="danger" leftIcon={<X className="h-4 w-4" />} onClick={() => setShowReject(false)}>
            Confirm Rejection
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
