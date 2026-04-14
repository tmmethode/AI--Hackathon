import { X, Play, Save, Briefcase, UserRound, Cpu, Settings2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

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

function SliderRow({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border border-line p-4 shadow-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm font-semibold text-brand">{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-soft">
        <div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-muted">Adjusts relative weight of this category in ranking.</p>
    </Card>
  );
}

export default function NewJobPage() {
  return (
    <div className="w-full px-6 py-5">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Create New Screening Job</h1>
          <p className="mt-1 text-sm text-ink-muted">Drafting: Senior Frontend Engineer — Product Team</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={<X className="h-4 w-4" />}>Cancel</Button>
          <Button leftIcon={<Play className="h-4 w-4" />}>Save &amp; Start Screening</Button>
        </div>
      </div>

      <form className="flex flex-col gap-6">
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
          icon={UserRound}
          title="Candidate Profile & Requirements"
          description="Define the specific qualifications and technical skills required for this role."
        >
          <Field label="Required Hard Skills">
            <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-md border border-line bg-white p-2">
              {["TypeScript", "React", "Tailwind CSS", "Next.js", "System Design"].map((s) => (
                <Badge key={s} tone="neutral" className="gap-1.5">
                  {s}
                  <button type="button" aria-label={`Remove ${s}`} className="text-ink-muted hover:text-ink">×</button>
                </Badge>
              ))}
              <button type="button" className="ml-auto text-xs font-medium text-brand hover:underline">
                + Add Skill
              </button>
            </div>
          </Field>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="Min. Experience">
              <Select defaultValue="5">
                <option value="0">0+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="8">8+ Years</option>
              </Select>
            </Field>
            <Field label="Min. Education">
              <Select defaultValue="bs">
                <option value="hs">High School</option>
                <option value="bs">Bachelor&apos;s Degree</option>
                <option value="ms">Master&apos;s Degree</option>
              </Select>
            </Field>
            <Field label="Certifications">
              <Input placeholder="AWS, PMP, etc." />
            </Field>
          </div>

          <Field label="Ideal Candidate Summary (AI Prompt Context)" className="mt-5">
            <Textarea
              rows={4}
              defaultValue="We are looking for a frontend leader who deeply understands React ecosystems and can navigate complex architectural decisions. The ideal candidate has experience working in distributed teams and possesses a strong eye for UX/UI detail. They should be comfortable mentoring junior devs."
            />
          </Field>
        </Section>

        <Section
          icon={Cpu}
          title="AI Weighting & Prioritization"
          description="Adjust the importance of each category. These weights directly influence the AI's matching score."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SliderRow label="Technical Skills" value={40} />
            <SliderRow label="Years of Experience" value={30} />
            <SliderRow label="Culture & Soft Skills" value={20} />
            <SliderRow label="Educational Background" value={10} />
          </div>
          <p className="mt-4 rounded-md bg-brand-soft/60 px-4 py-3 text-xs text-info-deep">
            <strong className="font-semibold">Total: 100%</strong> — Your current configuration favors technical mastery.
            Ensure your &ldquo;Ideal Candidate&rdquo; summary aligns with these weights for the best results.
          </p>
        </Section>

        <Section
          icon={Settings2}
          title="Advanced AI Configuration"
          description="Fine-tune how the AI processes applicants and presents findings."
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Tuning Parameters</h3>
            <ChevronDown className="h-4 w-4 text-ink-muted" aria-hidden />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="AI Explanation Depth">
              <div role="tablist" className="flex rounded-md bg-surface-soft p-1 text-xs font-medium">
                {["Brief", "Standard", "Detailed"].map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={i === 0}
                    className={`flex-1 rounded px-3 py-1.5 ${
                      i === 0 ? "bg-white text-ink shadow-card" : "text-ink-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">&ldquo;Detailed&rdquo; provides bullet points for every async component.</p>
            </Field>

            <fieldset>
              <legend className="mb-1.5 text-[13px] font-medium text-ink">Blackout Settings</legend>
              <div className="space-y-2 text-sm">
                {["Exclude Competitor Staff", "Prioritize Internal Referrals", "AI-Anonymized Initial Review"].map(
                  (l, i) => (
                    <label key={l} className="flex items-center gap-2 text-ink">
                      <input type="checkbox" defaultChecked={i !== 1} className="h-4 w-4 rounded border-line text-brand focus:ring-brand/40" />
                      {l}
                    </label>
                  )
                )}
              </div>
            </fieldset>

            <Field label="Target Shortlist Size">
              <Input type="number" defaultValue={15} />
              <span className="mt-1 block text-xs text-ink-muted">Top-ranked candidates to return in results.</span>
            </Field>

            <Field label="Excluded Companies (Blacklist)" className="md:col-span-2">
              <Input placeholder="Enter company names separated by commas (e.g. Meta, Google, Amazon)" />
              <span className="mt-1 block text-xs text-ink-muted">
                Candidates currently at these firms will be flagged for omission based on policy.
              </span>
            </Field>
          </div>
        </Section>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost">Discard Changes</Button>
          <Button type="button" variant="secondary" leftIcon={<Save className="h-4 w-4" />}>Save as Draft</Button>
          <Button type="submit" leftIcon={<Play className="h-4 w-4" />}>Save &amp; Start Screening</Button>
        </div>
      </form>
    </div>
  );
}
