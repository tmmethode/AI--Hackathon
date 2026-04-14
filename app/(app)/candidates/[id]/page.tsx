"use client";

import { useState } from "react";
import {
  MapPin,
  Mail,
  Linkedin,
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
  Clock,
  Video,
  Phone,
  Users,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface PageProps {
  params: { id: string };
}

const strengths = [
  {
    title: "Advanced React Ecosystem",
    copy: "6+ years of specialized experience building complex, state-heavy dashboards using React, Redux, and Next.js.",
    tag: "Page 2, Projects",
  },
  {
    title: "Performance Optimization",
    copy: "Documented success in reducing initial bundle sizes by 40% and improving Core Web Vitals at his previous role.",
    tag: "ScaleAI Case Study",
  },
  {
    title: "Leadership Experience",
    copy: "Mentored a team of 4 junior engineers and established front-end coding standards across the organization.",
    tag: "Experience: Lead",
  },
];

const risks = [
  {
    title: "Limited Backend Exposure",
    copy: "While proficient in Node.js, he has limited experience with GraphQL or complex microservices required for the full-stack aspects of this role.",
    tag: "Skills Gap Analysis",
  },
  {
    title: "Domain Specificity",
    copy: "Lacks direct experience in Fintech, although his enterprise SaaS background shows high adaptability.",
    tag: "Relevance to Role",
  },
];

export default function CandidateDetailPage({ params }: PageProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [scheduleSent, setScheduleSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  function handleSchedule() {
    setScheduleSent(true);
    setTimeout(() => { setScheduleSent(false); setShowSchedule(false); }, 1500);
  }

  function handleSendEmail() {
    setEmailSent(true);
    setTimeout(() => { setEmailSent(false); setShowEmail(false); }, 1500);
  }

  return (
    <div className="w-full px-6 py-5">
      <Card className="mb-6 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name="Jordan Alexander" size={72} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Jordan Alexander</h1>
                <Badge tone="success" pill>Rank #1</Badge>
              </div>
              <p className="text-sm text-ink-muted">Senior Frontend Engineer · 8+ Years Exp.</p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
                <li className="flex items-center gap-1"><MapPin className="h-3 w-3" /> San Francisco, CA (Open to Remote)</li>
                <li className="flex items-center gap-1"><Mail className="h-3 w-3" /> j.alexander@example.com</li>
                <li className="flex items-center gap-1"><Linkedin className="h-3 w-3" /> /in/jalex-dev</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="rounded-md bg-success/10 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-success-deep">AI Match Score</p>
              <p className="font-display text-3xl font-bold text-success">94%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-success">VERY HIGH</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" leftIcon={<X className="h-4 w-4" />} onClick={() => setShowReject(true)}>Reject</Button>
              <Button leftIcon={<Calendar className="h-4 w-4" />} onClick={() => setShowSchedule(true)}>Schedule Interview</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card className="bg-brand-soft/40 p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-info-deep" />
              <h2 className="font-display text-base font-bold text-info-deep">AI Recommendation: Proceed Immediately</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-info-deep/80">
              Jordan is an exceptional fit for the Senior Frontend Engineer role. His deep expertise in React
              architecture and proven track record leading high-performance teams at ScaleAI align perfectly with your
              current project requirements. He demonstrates strong problem-solving capabilities and is likely to thrive
              in your fast-paced environment.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <h3 className="font-display text-base font-semibold text-ink">Key Strengths</h3>
            </div>
            <ul className="space-y-4">
              {strengths.map((s) => (
                <li key={s.title} className="rounded-md border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-ink">{s.title}</h4>
                    <Badge tone="success">{s.tag}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{s.copy}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-danger" />
              <h3 className="font-display text-base font-semibold text-ink">Potential Gaps &amp; Risks</h3>
            </div>
            <ul className="space-y-4">
              {risks.map((r) => (
                <li key={r.title} className="rounded-md border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-ink">{r.title}</h4>
                    <Badge tone="danger">{r.tag}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{r.copy}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-md bg-surface-soft/60 p-3 text-xs italic text-ink-muted">
              &ldquo;Candidates with strong component-driven architecture experience and a focus on UX are priority #1.&rdquo;
              — Hiring Manager Note
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-ink">Internal Recruiter Notes</h3>
            <div className="mt-4 rounded-md border border-line p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">HR SARAH</span>
                <span className="text-ink-muted">2 days ago</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-ink-muted">
                &ldquo;Candidate was very communicative during the initial phone screen. Excited about the team culture.&rdquo;
              </p>
            </div>
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
                <p className="font-display text-2xl font-bold text-success">95%</p>
              </div>
              <div className="rounded-md bg-brand-soft p-3 text-center">
                <p className="text-[10px] uppercase text-ink-muted">Exp. Match</p>
                <p className="font-display text-2xl font-bold text-brand">88%</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Parsed Resume Highlights</h3>

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Recent Experience</p>
              <div className="mt-2 space-y-3">
                <div className="flex gap-2">
                  <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <div>
                    <p className="text-sm font-medium text-ink">Lead Frontend Engineer</p>
                    <p className="text-xs text-ink-muted">ScaleAI · 2021 — Present</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Built data labeling interfaces processing 10M+ daily events.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <div>
                    <p className="text-sm font-medium text-ink">Senior React Developer</p>
                    <p className="text-xs text-ink-muted">Finlytics · 2018 — 2021</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Education</p>
              <div className="mt-2 flex gap-2">
                <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-medium text-ink">B.S. in Computer Science</p>
                  <p className="text-xs text-ink-muted">Stanford University, 2017</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Certifications</p>
              <ul className="mt-2 space-y-1.5 text-xs text-ink">
                <li className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-brand" /> AWS Certified Developer</li>
                <li className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-brand" /> Meta Frontend Professional</li>
              </ul>
            </div>

            <Button variant="secondary" size="sm" fullWidth className="mt-5" leftIcon={<Download className="h-4 w-4" />}>
              View Full Resume (PDF)
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
            <p className="mt-3 text-[10px] text-ink-muted">Viewing candidate {params.id}</p>
          </Card>
        </aside>
      </div>

      {/* Schedule Interview Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} size="md">
        <ModalHeader
          title="Schedule Interview"
          subtitle="Set up an interview with Jordan Alexander"
          onClose={() => setShowSchedule(false)}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">Interview Setup</p>
        </ModalHeader>
        <ModalBody className="flex flex-col gap-5">
          <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
            <Avatar name="Jordan Alexander" size={40} />
            <div>
              <p className="text-sm font-medium text-ink">Jordan Alexander</p>
              <p className="text-xs text-ink-muted">Senior Frontend Engineer · 94% Match</p>
            </div>
            <Badge tone="success" pill className="ml-auto">Top Candidate</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Interview Type">
              <div className="flex gap-2">
                {([
                  { icon: Video, label: "Video Call" },
                  { icon: Phone, label: "Phone" },
                  { icon: Users, label: "In Person" },
                ] as const).map((type, i) => (
                  <button
                    key={type.label}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-colors ${
                      i === 0 ? "border-brand bg-brand-soft/30 text-brand" : "border-line text-ink-muted hover:bg-surface-soft"
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
              <Input type="date" defaultValue="2026-04-18" />
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
              <Input placeholder="e.g. Marcus Chen, Sarah Lee" defaultValue="Marcus Chen" />
            </Field>
          </div>

          <Field label="Meeting Link / Location">
            <Input placeholder="https://meet.google.com/..." defaultValue="https://meet.google.com/abc-defg-hij" />
          </Field>

          <Field label="Notes for Interviewer">
            <Textarea
              rows={3}
              placeholder="Any specific areas to probe, topics to cover..."
              defaultValue="Focus on system design experience and React architecture patterns. Check GraphQL knowledge depth given identified gap."
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

      {/* Email Candidate Modal */}
      <Modal open={showEmail} onClose={() => setShowEmail(false)} size="md">
        <ModalHeader
          title="Email Candidate"
          subtitle="Send a message to Jordan Alexander"
          onClose={() => setShowEmail(false)}
        />
        <ModalBody className="flex flex-col gap-4">
          <Field label="To">
            <Input defaultValue="j.alexander@example.com" readOnly className="bg-surface-soft/50" />
          </Field>
          <Field label="Subject">
            <Input defaultValue="Next Steps - Senior Frontend Engineer Position at Umurava" />
          </Field>
          <Field label="Message">
            <Textarea
              rows={6}
              defaultValue={`Hi Jordan,

Thank you for your application for the Senior Frontend Engineer position. We were very impressed with your background and would love to move forward with the next steps in our hiring process.

Would you be available for a technical interview next week? Please let us know your availability and we'll send over a calendar invite.

Best regards,
Umurava Hiring Team`}
            />
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

      {/* Reject Confirmation Modal */}
      <Modal open={showReject} onClose={() => setShowReject(false)} size="sm">
        <ModalHeader
          title="Reject Candidate"
          subtitle="This action can be undone later from the candidate history."
          onClose={() => setShowReject(false)}
        />
        <ModalBody className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-md border border-danger/20 bg-danger/5 p-3">
            <Avatar name="Jordan Alexander" size={36} />
            <div>
              <p className="text-sm font-medium text-ink">Jordan Alexander</p>
              <p className="text-xs text-ink-muted">94% Match Score · Rank #1</p>
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
