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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Textarea } from "@/components/ui/Input";

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
              <Button variant="secondary" leftIcon={<X className="h-4 w-4" />}>Reject</Button>
              <Button leftIcon={<Calendar className="h-4 w-4" />}>Schedule Interview</Button>
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
              <Button variant="secondary" fullWidth leftIcon={<Mail className="h-4 w-4" />}>
                Email Candidate
              </Button>
            </div>
            <p className="mt-3 text-[10px] text-ink-muted">Viewing candidate {params.id}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
