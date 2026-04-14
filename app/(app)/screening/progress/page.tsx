"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2, CheckCircle2, XCircle, User, ShieldCheck, Clock,
  BarChart3, Zap, ArrowRight, FileText, Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";

interface StageInfo {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const stages: StageInfo[] = [
  { label: "Parsing Resumes", description: "Extracting text, skills, and experience from candidate documents", icon: FileText },
  { label: "Skill Mapping", description: "Matching extracted skills against job requirements", icon: BarChart3 },
  { label: "Experience Scoring", description: "Evaluating years and relevance of professional experience", icon: Briefcase },
  { label: "Culture Fit Analysis", description: "Assessing soft skills and team compatibility signals", icon: User },
  { label: "Generating Rankings", description: "Computing final scores and ranking candidates", icon: Zap },
  { label: "Audit Trail", description: "Creating explainable AI decision records for compliance", icon: ShieldCheck },
];

interface ProcessedCandidate {
  name: string;
  score: number;
  status: "passed" | "flagged" | "pending";
}

const candidateStream: ProcessedCandidate[] = [
  { name: "Sarah Jenkins", score: 98, status: "passed" },
  { name: "Michael Chen", score: 94, status: "passed" },
  { name: "Elena Rodriguez", score: 91, status: "passed" },
  { name: "David Okafor", score: 88, status: "passed" },
  { name: "Aisha Gupta", score: 85, status: "passed" },
  { name: "James Osei", score: 80, status: "flagged" },
  { name: "Priya Nair", score: 76, status: "passed" },
  { name: "Kevin Mwangi", score: 72, status: "flagged" },
];

export default function ScreeningProgressPage() {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [visibleCandidates, setVisibleCandidates] = useState<ProcessedCandidate[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          return 100;
        }
        return prev + 1.5;
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stageIndex = Math.min(Math.floor((progress / 100) * stages.length), stages.length - 1);
    setCurrentStage(stageIndex);
    const processed = Math.min(Math.floor((progress / 100) * 142), 142);
    setProcessedCount(processed);

    const candidateCount = Math.min(Math.floor((progress / 100) * candidateStream.length), candidateStream.length);
    setVisibleCandidates(candidateStream.slice(0, candidateCount));
  }, [progress]);

  const elapsedSeconds = Math.min(Math.floor(progress * 0.6), 60);
  const elapsedDisplay = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="w-full px-6 py-5">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {isComplete ? "Screening Complete" : "Screening in Progress"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {isComplete
              ? "All candidates have been evaluated. View your shortlist below."
              : "AI is evaluating 142 candidates against your job criteria."}
          </p>
        </div>
        <div className="flex gap-2">
          {isComplete ? (
            <Link href="/shortlists">
              <Button leftIcon={<ArrowRight className="h-4 w-4" />}>View Shortlist</Button>
            </Link>
          ) : (
            <Link href="/screening">
              <Button variant="secondary" leftIcon={<XCircle className="h-4 w-4" />}>Cancel Run</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main progress area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* Progress card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isComplete ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  </span>
                )}
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">
                    {isComplete ? "Analysis Complete" : stages[currentStage].label}
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {isComplete ? "All stages completed successfully" : stages[currentStage].description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-brand">{Math.min(Math.round(progress), 100)}%</p>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">Progress</p>
              </div>
            </div>

            <div className="mt-5">
              <Progress value={Math.min(progress, 100)} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Processed</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">{processedCount}/142</p>
              </div>
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Elapsed</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">{elapsedDisplay}</p>
              </div>
              <div className="rounded-md border border-line p-3">
                <p className="text-xs text-ink-muted">Est. Remaining</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">
                  {isComplete ? "—" : `${Math.max(0, 60 - elapsedSeconds)}s`}
                </p>
              </div>
            </div>
          </Card>

          {/* Pipeline stages */}
          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-ink">Pipeline Stages</h3>
            <p className="mt-1 text-xs text-ink-muted">Real-time progress of each AI evaluation phase.</p>

            <ul className="mt-5 space-y-3">
              {stages.map((stage, i) => {
                const StageIcon = stage.icon;
                const isDone = i < currentStage || isComplete;
                const isCurrent = i === currentStage && !isComplete;

                return (
                  <li
                    key={stage.label}
                    className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                      isDone
                        ? "border-success/30 bg-success/5"
                        : isCurrent
                        ? "border-brand/30 bg-brand-soft/30"
                        : "border-line bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isDone
                          ? "bg-success/10"
                          : isCurrent
                          ? "bg-brand/10"
                          : "bg-surface-soft"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 animate-spin text-brand" />
                      ) : (
                        <StageIcon className="h-4 w-4 text-ink-muted" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDone ? "text-success-deep" : isCurrent ? "text-ink" : "text-ink-muted"}`}>
                        {stage.label}
                      </p>
                      <p className="text-xs text-ink-muted">{stage.description}</p>
                    </div>
                    {isDone && <Badge tone="success" pill>Done</Badge>}
                    {isCurrent && <Badge tone="brand" pill>Active</Badge>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-5">
          {/* Job context */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <Briefcase className="h-3.5 w-3.5" /> Target Job
            </div>
            <h3 className="font-display text-base font-semibold text-ink">Senior Product Designer</h3>
            <p className="text-xs text-ink-muted">Product & Design Team · Kigali, Rwanda</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
              <Clock className="h-3.5 w-3.5" />
              Run started at {new Date().toLocaleTimeString()}
            </div>
          </Card>

          {/* Live candidate stream */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Live Candidate Feed</h3>
              <Badge tone="success" pill>LIVE</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-muted">Top candidates processed so far</p>

            {visibleCandidates.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-line p-6 text-center text-xs text-ink-muted">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-brand/40" />
                Waiting for results…
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {visibleCandidates.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between rounded-md border border-line p-2.5 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-ink">{c.name}</p>
                        <p className="text-[10px] text-ink-muted">
                          {c.status === "flagged" ? "Flagged for review" : "Passed all checks"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${c.score >= 90 ? "text-success" : c.score >= 80 ? "text-brand" : "text-ink-muted"}`}>
                        {c.score}%
                      </p>
                      {c.status === "flagged" && <Badge tone="warning" pill className="mt-0.5 text-[9px]">Review</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Safety notice */}
          <Card className="border border-success/30 bg-success/5 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success-deep" />
              <h3 className="text-sm font-semibold text-success-deep">Audit & Compliance</h3>
            </div>
            <p className="mt-2 text-xs leading-5 text-success-deep/80">
              All AI decisions are logged with full explainability. No PII is permanently stored. This
              run generates a tamper-proof audit trail for regulatory compliance.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
