"use client";

import { use, useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { loadCandidateRecords, type CandidateRecord } from "@/lib/candidates";

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

export default function CandidateDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const candidateParamId = resolvedParams.id;
  const [showSchedule, setShowSchedule] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [scheduleSent, setScheduleSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [candidate, setCandidate] = useState<CandidateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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

  const experienceEntries = candidate.applicant?.experience ?? [];
  const educationEntries = candidate.applicant?.education ?? [];
  const certifications = candidate.applicant?.certifications ?? [];
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
            <h3 className="text-sm font-semibold text-ink">Skill Match</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-success/10 p-3 text-center">
                <p className="text-[10px] uppercase text-ink-muted">Skill Match</p>
                <p className="font-display text-2xl font-bold text-success">
                  {candidate.scores?.skills ?? candidate.matchScore}%
                </p>
              </div>
              <div className="rounded-md bg-brand-soft p-3 text-center">
                <p className="text-[10px] uppercase text-ink-muted">Exp. Match</p>
                <p className="font-display text-2xl font-bold text-brand">
                  {candidate.scores?.experience ?? 0}%
                </p>
              </div>
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

            <Button variant="secondary" size="sm" fullWidth className="mt-5" leftIcon={<Download className="h-4 w-4" />}>
              {candidate.sourceFileName ? `View ${candidate.sourceFileName}` : "Resume source unavailable"}
            </Button>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Quick Actions</h3>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="secondary" fullWidth leftIcon={<Download className="h-4 w-4" />}>
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
