import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function TermsOfServicePage() {
  return (
    <div className="w-full px-6 py-5">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
        </Link>
      </div>

      <Card className="mx-auto max-w-3xl p-8">
        <div className="flex items-center gap-3 text-brand">
          <FileText className="h-6 w-6" />
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Terms of Service</h1>
        </div>
        <p className="mt-2 text-sm text-ink-muted">Last updated: April 14, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-6 text-ink">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">1. Acceptance of Terms</h2>
            <p className="mt-2 text-ink-muted">
              By accessing and using the Umurava Screening platform (&ldquo;Service&rdquo;), you agree to be bound by these
              Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not use the Service.
              These Terms apply to all users, including recruiters, hiring managers, and administrators.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">2. Description of Service</h2>
            <p className="mt-2 text-ink-muted">
              Umurava Screening provides an AI-powered candidate evaluation and ranking platform designed
              for recruiters and hiring teams. The Service uses machine learning models to analyze candidate
              resumes, match qualifications against job requirements, and generate ranked shortlists with
              explainable scoring.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">3. User Accounts &amp; Responsibilities</h2>
            <p className="mt-2 text-ink-muted">
              You are responsible for maintaining the confidentiality of your account credentials and for
              all activities that occur under your account. You agree to notify us immediately of any
              unauthorized access or use of your account. You must ensure that all candidate data processed
              through the platform has been collected with proper consent.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">4. AI Usage &amp; Fairness</h2>
            <p className="mt-2 text-ink-muted">
              Our AI screening models are designed to evaluate candidates based on objective, job-relevant
              criteria. All AI decisions are fully explainable and auditable. Users acknowledge that AI
              outputs are recommendations and should not be the sole basis for hiring decisions. Final
              hiring decisions must involve human review and judgment.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">5. Data Processing &amp; Retention</h2>
            <p className="mt-2 text-ink-muted">
              Candidate data is processed using decentralized models with no permanent PII storage beyond
              the active screening session. All data is encrypted at rest and in transit. Audit logs are
              retained for compliance purposes for a period of 12 months, after which they are
              automatically purged unless otherwise required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">6. Service Credits &amp; Billing</h2>
            <p className="mt-2 text-ink-muted">
              Screening runs consume service credits based on the number of candidates processed and the
              depth of analysis selected. Credits are non-refundable once consumed. Usage is tracked in
              real-time and visible from your dashboard. Overages beyond your plan limit will be billed
              at the published per-screening rate.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">7. Limitation of Liability</h2>
            <p className="mt-2 text-ink-muted">
              The Service is provided &ldquo;as is&rdquo; without warranty of any kind. Umurava Screening shall not
              be liable for any indirect, incidental, special, consequential, or punitive damages arising out
              of or in connection with your use of the Service, including but not limited to hiring outcomes
              based on AI recommendations.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">8. Contact Information</h2>
            <p className="mt-2 text-ink-muted">
              For questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@umurava.africa" className="text-brand hover:underline">
                legal@umurava.africa
              </a>
              .
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
