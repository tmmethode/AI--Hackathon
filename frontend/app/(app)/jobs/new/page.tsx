"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Play, Save, Briefcase, UserRound, Cpu, Upload, CheckCircle2, ArrowRight, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface SectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, description, children }: SectionProps) {
  return (
    <Card className="p-6">
      <header className="mb-6 flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10" aria-hidden>
          <Icon className="h-5 w-5 text-brand" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">{description}</p>
        </div>
      </header>
      {children}
    </Card>
  );
}

interface WeightCriterion {
  id: string;
  label: string;
  value: number;
}

function WeightRow({
  criterion,
  maxValue,
  onLabelChange,
  onValueChange,
  onRemove,
  canRemove,
}: {
  criterion: WeightCriterion;
  maxValue: number;
  onLabelChange: (id: string, label: string) => void;
  onValueChange: (id: string, value: number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  return (
    <Card className="border border-line p-4 shadow-none">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-1">
          <Input
            value={criterion.label}
            onChange={(e) => onLabelChange(criterion.id, e.target.value)}
            placeholder="Scoring criterion"
          />
        </div>
        <div className="w-24">
          <Input
            type="number"
            min={0}
            max={maxValue}
            value={criterion.value}
            onChange={(e) => onValueChange(criterion.id, Number(e.target.value))}
          />
        </div>
        <div className="pt-1 text-sm font-semibold text-brand">%</div>
        {canRemove ? (
          <Button type="button" variant="ghost" onClick={() => onRemove(criterion.id)}>
            Remove
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={maxValue}
          value={criterion.value}
          onChange={(e) => onValueChange(criterion.id, Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-soft accent-brand"
        />
        <span className="w-12 text-right text-sm font-semibold text-brand">{criterion.value}%</span>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Adjust this criterion to reflect how important it is for this role. Maximum available here: {maxValue}%.
      </p>
    </Card>
  );
}

export default function NewJobPage() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [weightCriteria, setWeightCriteria] = useState<WeightCriterion[]>([
    { id: "technical-skills", label: "Technical Skills", value: 40 },
    { id: "experience", label: "Years of Experience", value: 30 },
    { id: "soft-skills", label: "Culture & Soft Skills", value: 20 },
    { id: "education", label: "Educational Background", value: 10 },
  ]);

  const totalWeight = weightCriteria.reduce((sum, criterion) => sum + criterion.value, 0);
  const remainingWeight = 100 - totalWeight;
  const isWeightBalanced = remainingWeight === 0;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isWeightBalanced) {
      return;
    }
    setShowSuccessModal(true);
  }

  function updateWeightLabel(id: string, label: string) {
    setWeightCriteria((current) =>
      current.map((criterion) => (criterion.id === id ? { ...criterion, label } : criterion))
    );
  }

  function updateWeightValue(id: string, value: number) {
    setWeightCriteria((current) => {
      const otherTotal = current.reduce((sum, criterion) => (
        criterion.id === id ? sum : sum + criterion.value
      ), 0);
      const maxAllowed = Math.max(0, 100 - otherTotal);
      const normalizedValue = Number.isNaN(value) ? 0 : Math.min(maxAllowed, Math.max(0, value));

      return current.map((criterion) => (criterion.id === id ? { ...criterion, value: normalizedValue } : criterion));
    });
  }

  function getMaxWeightValue(id: string) {
    const otherTotal = weightCriteria.reduce((sum, criterion) => (
      criterion.id === id ? sum : sum + criterion.value
    ), 0);

    return Math.max(0, 100 - otherTotal);
  }

  function addWeightCriterion() {
    setWeightCriteria((current) => [
      ...current,
      {
        id: `criterion-${Date.now()}`,
        label: `Custom Criterion ${current.length - 3}`,
        value: 0,
      },
    ]);
  }

  function removeWeightCriterion(id: string) {
    setWeightCriteria((current) => current.filter((criterion) => criterion.id !== id));
  }

  return (
    <div className="w-full px-6 py-5">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Create New Job Requisition</h1>
          <p className="mt-1 text-sm text-ink-muted">Drafting: Senior Frontend Engineer — Product Team</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs"><Button variant="secondary" leftIcon={<X className="h-4 w-4" />}>Cancel</Button></Link>
          <Button variant="secondary" leftIcon={<Save className="h-4 w-4" />} onClick={() => setShowSuccessModal(true)}>Save as Draft</Button>
          <Button leftIcon={<Play className="h-4 w-4" />} onClick={handleSave} disabled={!isWeightBalanced}>Save Job</Button>
        </div>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSave}>
        <Section
          icon={Briefcase}
          title="Role Fundamentals"
          description="Basic information about the position and recruitment context."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Official Job Title" className="md:col-span-2">
              <Input defaultValue="Senior Frontend Engineer" />
            </Field>
            <Field label="Department / Team">
              <Select defaultValue="pe">
                <option value="pe">Product &amp; Engineering</option>
                <option value="design">Design</option>
                <option value="ops">Operations</option>
              </Select>
            </Field>
            <Field label="Location Policy">
              <Select defaultValue="remote-eu">
                <option value="remote-eu">Remote (Africa/Europe)</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </Select>
            </Field>
            <Field label="Employment Type">
              <Select defaultValue="ft">
                <option value="ft">Full-time Permanent</option>
                <option value="contract">Contract</option>
              </Select>
            </Field>
            <Field label="Target Salary Band (Annual)">
              <Input defaultValue="$70,000 - $110,000 USD" />
            </Field>
          </div>
        </Section>

        <Section
          icon={FileText}
          title="Job Description & Details"
          description="Provide a comprehensive description of the role, responsibilities, and what the job entails."
        >
          <Field label="Job Summary" className="mb-5">
            <Textarea
              rows={4}
              defaultValue="We are seeking a talented Senior Frontend Engineer to join our Product Engineering team. You will be responsible for building and maintaining high-quality web applications that serve thousands of users daily. This is a key role that influences both the technical direction and user experience of our platform."
            />
            <span className="mt-1 block text-xs text-ink-muted">A brief overview of the role visible to candidates at the top of the job posting.</span>
          </Field>

          <Field label="Key Responsibilities" className="mb-5">
            <Textarea
              rows={8}
              defaultValue={"• Architect, build, and maintain scalable frontend applications using React, TypeScript, and Next.js\n• Collaborate closely with designers, product managers, and backend engineers to deliver exceptional user experiences\n• Lead code reviews and establish engineering best practices across the frontend codebase\n• Mentor junior developers and contribute to a culture of continuous learning\n• Optimize application performance, accessibility, and SEO\n• Participate in sprint planning, technical design discussions, and architecture reviews\n• Write comprehensive unit and integration tests using Testing Library and Cypress\n• Contribute to our design system and component library"}
            />
            <span className="mt-1 block text-xs text-ink-muted">List the primary duties and day-to-day tasks. Use bullet points (•) for readability.</span>
          </Field>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Must-have Qualifications">
              <Textarea
                rows={8}
                defaultValue={"• 5+ years of professional frontend development experience\n• Strong proficiency in React, TypeScript, and modern CSS (Tailwind preferred)\n• Experience with server-side rendering (Next.js) and state management\n• Solid understanding of web performance optimization techniques\n• Excellent communication skills and ability to work in distributed teams"}
              />
              <span className="mt-1 block text-xs text-ink-muted">List the non-negotiable requirements candidates must meet.</span>
            </Field>
            <Field label="Nice-to-have Qualifications">
              <Textarea
                rows={8}
                defaultValue={"• Experience with GraphQL, REST API design, or backend technologies (Node.js)\n• Familiarity with CI/CD pipelines and deployment automation\n• Contributions to open-source projects\n• Experience in a high-growth SaaS environment"}
              />
              <span className="mt-1 block text-xs text-ink-muted">Capture bonus qualifications that strengthen a candidate profile.</span>
            </Field>
          </div>
        </Section>


        <Section
          icon={UserRound}
          title="Candidate Profile & Requirements"
          description="Describe the profile you want to target so screening is tailored to this specific role."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Core Hard Skills">
              <Textarea
                rows={5}
                defaultValue={"• TypeScript\n• React\n• Next.js\n• Tailwind CSS\n• Frontend architecture\n• Component-driven development"}
              />
              <span className="mt-1 block text-xs text-ink-muted">List the technical skills a strong candidate should already have.</span>
            </Field>
            <Field label="Preferred / Bonus Skills">
              <Textarea
                rows={5}
                defaultValue={"• GraphQL\n• Design systems\n• Testing Library / Cypress\n• Performance optimization\n• Accessibility auditing\n• Mentoring or tech leadership"}
              />
              <span className="mt-1 block text-xs text-ink-muted">Capture tools or experience that would make a candidate stand out.</span>
            </Field>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Core Soft Skills">
              <Textarea
                rows={4}
                defaultValue={"• Clear written and verbal communication\n• Ownership and accountability\n• Cross-functional collaboration\n• Mentorship mindset\n• Product thinking"}
              />
            </Field>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="Experience">
              <Select defaultValue="5">
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
            <Field label="Seniority Level">
              <Select defaultValue="senior">
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="manager">Manager</option>
              </Select>
            </Field>
            <Field label="Education Level">
              <Select defaultValue="bs">
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
          icon={Cpu}
          title="AI Weighting & Prioritization"
          description="Adjust the importance of each category. Add or remove criteria so the scoring model fits the specific job."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {weightCriteria.map((criterion) => (
              <WeightRow
                key={criterion.id}
                criterion={criterion}
                maxValue={getMaxWeightValue(criterion.id)}
                onLabelChange={updateWeightLabel}
                onValueChange={updateWeightValue}
                onRemove={removeWeightCriterion}
                canRemove={weightCriteria.length > 1}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-start">
            <Button type="button" variant="secondary" onClick={addWeightCriterion}>
              Add Criterion
            </Button>
          </div>
          <p className="mt-4 rounded-md bg-brand-soft/60 px-4 py-3 text-xs text-info-deep">
            <strong className="font-semibold">Total: {totalWeight}%</strong>
            {isWeightBalanced
              ? " — Your weighting is balanced and ready for scoring."
              : ` — Assign the remaining ${remainingWeight}% before saving the job.`}
            {" "}Each criterion is capped by the percentage left after the others are allocated, so the total cannot go above 100%.
          </p>
        </Section>


        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost">Discard Changes</Button>
          <Button type="button" variant="secondary" leftIcon={<Save className="h-4 w-4" />} onClick={() => setShowSuccessModal(true)}>Save as Draft</Button>
          <Button type="submit" leftIcon={<Play className="h-4 w-4" />} disabled={!isWeightBalanced}>Save Job</Button>
        </div>
      </form>

      {/* Success Modal — guides user to Ingest */}
      <Modal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} size="sm">
        <ModalBody className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Job Created Successfully!</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Your job requisition has been saved. The next step is to ingest applicants so you can start reviewing candidates.
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

          {/* Workflow stepper */}
          <div className="flex w-full items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">✓ Create Job</span>
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
