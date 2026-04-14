import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full px-6 py-5">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
        </Link>
      </div>

      <Card className="mx-auto max-w-3xl p-8">
        <div className="flex items-center gap-3 text-brand">
          <Shield className="h-6 w-6" />
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Privacy Policy</h1>
        </div>
        <p className="mt-2 text-sm text-ink-muted">Last updated: April 14, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-6 text-ink">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">1. Information We Collect</h2>
            <p className="mt-2 text-ink-muted">
              When you use the Umurava Screening platform, we collect information that you provide directly,
              including account registration details (name, email, organization), job configuration data,
              and candidate materials you upload for screening. We also collect usage analytics such as
              feature engagement, screening run metadata, and performance metrics to improve the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">2. Candidate Data Processing</h2>
            <p className="mt-2 text-ink-muted">
              Candidate resumes, profiles, and related documents are processed by our AI models solely
              for the purpose of generating screening evaluations. This data is processed in-memory during
              active screening sessions and is not permanently stored in our systems. We use decentralized
              AI inference architecture to minimize data exposure. No personally identifiable information
              (PII) is used for model training.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">3. How We Use Your Information</h2>
            <p className="mt-2 text-ink-muted">
              We use the information we collect to provide, maintain, and improve the Service; generate
              candidate rankings and AI insights; create audit trails for compliance accountability;
              send notifications about screening status and platform updates; and provide customer support.
              We do not sell your data or candidate data to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">4. Data Security</h2>
            <p className="mt-2 text-ink-muted">
              We implement industry-standard security measures including end-to-end encryption (TLS 1.3)
              for data in transit, AES-256 encryption for data at rest, role-based access controls,
              regular security audits, and SOC 2 Type II compliance. All infrastructure is hosted on
              certified cloud providers with data residency in Africa and Europe.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">5. Data Retention &amp; Deletion</h2>
            <p className="mt-2 text-ink-muted">
              Account data is retained for as long as your account is active. Screening results and audit
              logs are retained for 12 months for compliance purposes. Candidate data from screening
              sessions is purged within 24 hours of screening completion unless explicitly saved by the
              user. You can request complete account and data deletion at any time by contacting our
              support team.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">6. Your Rights</h2>
            <p className="mt-2 text-ink-muted">
              Depending on your jurisdiction, you may have the right to access, correct, or delete your
              personal data; object to or restrict certain processing activities; request data portability;
              and withdraw consent at any time. We comply with GDPR, the African Union Convention on
              Cyber Security and Personal Data Protection, and other applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">7. AI Transparency &amp; Fairness</h2>
            <p className="mt-2 text-ink-muted">
              We are committed to responsible AI. All screening decisions are fully explainable, and we
              regularly audit our models for bias across protected characteristics including gender,
              ethnicity, age, and disability status. Users can request detailed explanations for any
              AI-generated score or recommendation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">8. Contact Us</h2>
            <p className="mt-2 text-ink-muted">
              For privacy-related inquiries, please contact our Data Protection Officer at{" "}
              <a href="mailto:privacy@umurava.africa" className="text-brand hover:underline">
                privacy@umurava.africa
              </a>
              .
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
