/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

import {
  buildBatchScreeningPrompt,
  GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION,
} from "../gemini/prompts";
import {
  buildBatchScreeningPromptOld,
  GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION_OLD,
} from "../gemini/prompts-old";
import type {
  GeminiBatchApplicant,
  GeminiBatchJob,
  GeminiBatchScreeningRequest,
} from "../gemini/types";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const APPLICANT_COUNT = Number(process.env.AB_APPLICANT_COUNT || 10);
const CANDIDATES_FILE = process.env.AB_CANDIDATES_FILE;

const JOB: GeminiBatchJob = {
  id: "ab-test-job",
  title: "Senior Full Stack Engineer",
  department: "Product Engineering",
  location: "Kigali, Rwanda",
  locationPolicy: "remote",
  employmentType: "full-time",
  salaryBand: "$60,000 – $95,000 USD",
  seniorityLevel: "senior",
  experienceYears: 5,
  educationLevel: "bachelor",
  summary:
    "Build and scale our core SaaS platform. The ideal candidate owns end-to-end web systems, designs for scale, and collaborates closely with product and infrastructure teams.",
  responsibilities:
    "Design and implement features across React front-end and Node.js backend. Own services end-to-end, including observability and deployments on AWS. Mentor mid-level engineers and participate in architecture reviews.",
  mustHaveQualifications:
    "5+ years full-stack experience. Strong React and Node.js/TypeScript. Experience with relational databases (PostgreSQL). Production experience with at least one major cloud (AWS/GCP).",
  niceToHaveQualifications:
    "Prior startup experience, exposure to ML/AI features, contributions to open source.",
  coreHardSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
  preferredSkills: ["GraphQL", "Redis", "CI/CD"],
  coreSoftSkills: ["Ownership", "Collaboration", "Written communication"],
  status: "Active",
};

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    console.error("GEMINI_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  if (!CANDIDATES_FILE || !CANDIDATES_FILE.trim()) {
    console.error("AB_CANDIDATES_FILE is not set. Point it to a JSON file with applicants.");
    process.exit(1);
  }

  const model = process.env.AB_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  // Force v1beta for this test — v1 uses snake_case and lacks systemInstruction/responseMimeType.
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

  const raw = fs.readFileSync(CANDIDATES_FILE, "utf-8");
  const allApplicants = JSON.parse(raw) as GeminiBatchApplicant[];
  const applicants = allApplicants.slice(0, APPLICANT_COUNT);

  const request: GeminiBatchScreeningRequest = {
    job: JOB,
    applicants,
    shortlistCount: 5,
    instructions:
      "Rank applicants strictly against the configured job requirements and weight criteria.",
    temperature: 0.2,
  };

  const newPrompt = buildBatchScreeningPrompt({ ...request });
  const oldPrompt = buildBatchScreeningPromptOld({ ...request });

  console.log("=".repeat(70));
  console.log(`A/B test: ${applicants.length} applicants · model=${model}`);
  console.log("=".repeat(70));
  console.log("Prompt sizes (characters, rough proxy for tokens — tokens ≈ chars/4):");
  console.log(
    `  OLD system:  ${GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION_OLD.length.toLocaleString()} chars`
  );
  console.log(
    `  NEW system:  ${GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION.length.toLocaleString()} chars`
  );
  console.log(`  OLD prompt:  ${oldPrompt.length.toLocaleString()} chars`);
  console.log(`  NEW prompt:  ${newPrompt.length.toLocaleString()} chars`);
  console.log(
    `  Savings:     ${(
      ((oldPrompt.length +
        GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION_OLD.length -
        newPrompt.length -
        GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION.length) /
        (oldPrompt.length + GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION_OLD.length)) *
        100
    ).toFixed(1)}%`
  );

  console.log("\nCalling Gemini for OLD prompt…");
  const oldResult = await callGemini(
    apiKey,
    baseUrl,
    model,
    oldPrompt,
    GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION_OLD
  );

  console.log("Calling Gemini for NEW prompt…");
  const newResult = await callGemini(
    apiKey,
    baseUrl,
    model,
    newPrompt,
    GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION
  );

  console.log("\n" + "=".repeat(70));
  console.log("Actual token usage (from Gemini usageMetadata):");
  console.log("=".repeat(70));
  printUsage("OLD", oldResult.usage);
  printUsage("NEW", newResult.usage);

  const oldEntries = parseEntries(oldResult.text);
  const newEntries = parseEntries(newResult.text);

  console.log("\n" + "=".repeat(70));
  console.log("Ranking comparison (top 10 by matchScore):");
  console.log("=".repeat(70));
  printRanking("OLD", oldEntries);
  console.log();
  printRanking("NEW", newEntries);

  console.log("\n" + "=".repeat(70));
  console.log("Per-applicant diff:");
  console.log("=".repeat(70));
  diffPerApplicant(oldEntries, newEntries);

  console.log("\n" + "=".repeat(70));
  console.log("Sample entry (first applicant):");
  console.log("=".repeat(70));
  const first = applicants[0];
  const oldFirst = oldEntries.find(
    (e) => (e.applicantEmail || "").toLowerCase() === first.email.toLowerCase()
  );
  const newFirst = newEntries.find(
    (e) => (e.applicantEmail || "").toLowerCase() === first.email.toLowerCase()
  );
  console.log(`Applicant: ${first.firstName} ${first.lastName} <${first.email}>`);
  console.log("\n--- OLD ---");
  console.log(JSON.stringify(oldFirst, null, 2));
  console.log("\n--- NEW ---");
  console.log(JSON.stringify(newFirst, null, 2));

  const outDir = path.resolve(__dirname, "..", "tmp-ab");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "old.json"), oldResult.text);
  fs.writeFileSync(path.join(outDir, "new.json"), newResult.text);
  fs.writeFileSync(path.join(outDir, "old.prompt.txt"), oldPrompt);
  fs.writeFileSync(path.join(outDir, "new.prompt.txt"), newPrompt);
  console.log(`\nFull prompts and responses saved under: ${outDir}`);
}

interface GeminiCallResult {
  text: string;
  usage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
}

async function callGemini(
  apiKey: string,
  baseUrl: string,
  model: string,
  prompt: string,
  systemInstruction: string
): Promise<GeminiCallResult> {
  const response = await fetch(`${baseUrl}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini request failed");
  }

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() ?? "";
  const finishReason = data.candidates?.[0]?.finishReason;

  if (!text) {
    throw new Error(`Empty Gemini response (finishReason=${finishReason})`);
  }

  if (finishReason && finishReason !== "STOP") {
    console.warn(`  WARN: finishReason=${finishReason}`);
  }

  return { text, usage: data.usageMetadata || {} };
}

interface BatchEntry {
  candidateRank: number;
  applicantEmail: string;
  fullName: string;
  matchScore: number;
  confidenceScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  strengths: string[];
  gapsOrRisks: string[];
  finalRecommendation: string;
  summaryExplanation: string;
}

function parseEntries(text: string): BatchEntry[] {
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  const body = first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;

  try {
    const parsed = JSON.parse(body) as { screeningResults?: BatchEntry[] };
    return Array.isArray(parsed.screeningResults) ? parsed.screeningResults : [];
  } catch (error) {
    console.error("Parse failed:", (error as Error).message);
    console.error("Raw length:", body.length);
    return [];
  }
}

function printUsage(
  label: string,
  usage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
) {
  console.log(
    `  ${label}: prompt=${usage.promptTokenCount ?? "?"} output=${
      usage.candidatesTokenCount ?? "?"
    } total=${usage.totalTokenCount ?? "?"}`
  );
}

function printRanking(label: string, entries: BatchEntry[]) {
  console.log(`${label} ranking:`);
  const sorted = [...entries].sort((a, b) => b.matchScore - a.matchScore);
  for (const entry of sorted.slice(0, 10)) {
    const summaryWords = (entry.summaryExplanation || "").split(/\s+/).filter(Boolean).length;
    console.log(
      `  #${String(entry.candidateRank).padStart(2)} ${entry.matchScore
        .toString()
        .padStart(3)}% | strengths=${(entry.strengths || []).length} gaps=${
        (entry.gapsOrRisks || []).length
      } sum=${summaryWords}w | ${entry.applicantEmail}`
    );
  }
}

function diffPerApplicant(oldE: BatchEntry[], newE: BatchEntry[]) {
  const oldByEmail = new Map(oldE.map((e) => [e.applicantEmail.toLowerCase(), e]));
  const newByEmail = new Map(newE.map((e) => [e.applicantEmail.toLowerCase(), e]));

  const rows: Array<{
    email: string;
    oldScore: number;
    newScore: number;
    oldRank: number;
    newRank: number;
    delta: number;
    rankDelta: number;
  }> = [];

  for (const [email, oldEntry] of oldByEmail) {
    const newEntry = newByEmail.get(email);
    if (!newEntry) continue;
    rows.push({
      email,
      oldScore: oldEntry.matchScore,
      newScore: newEntry.matchScore,
      oldRank: oldEntry.candidateRank,
      newRank: newEntry.candidateRank,
      delta: newEntry.matchScore - oldEntry.matchScore,
      rankDelta: newEntry.candidateRank - oldEntry.candidateRank,
    });
  }

  rows.sort((a, b) => a.oldRank - b.oldRank);

  console.log("email                                      | old | new | Δscore | Δrank");
  console.log("-------------------------------------------+-----+-----+--------+------");
  for (const row of rows) {
    console.log(
      `${row.email.padEnd(42)} | ${String(row.oldScore).padStart(3)} | ${String(
        row.newScore
      ).padStart(3)} | ${row.delta >= 0 ? "+" : ""}${String(row.delta).padStart(4)}  | ${
        row.rankDelta >= 0 ? "+" : ""
      }${row.rankDelta}`
    );
  }

  if (rows.length > 0) {
    const avgDelta = rows.reduce((s, r) => s + r.delta, 0) / rows.length;
    const maxAbsDelta = Math.max(...rows.map((r) => Math.abs(r.delta)));
    const rankChanges = rows.filter((r) => r.rankDelta !== 0).length;
    const oldTop5 = new Set(
      [...oldE].sort((a, b) => b.matchScore - a.matchScore).slice(0, 5).map((e) => e.applicantEmail.toLowerCase())
    );
    const newTop5 = new Set(
      [...newE].sort((a, b) => b.matchScore - a.matchScore).slice(0, 5).map((e) => e.applicantEmail.toLowerCase())
    );
    const top5Overlap = [...oldTop5].filter((e) => newTop5.has(e)).length;

    const avgOldSummary =
      oldE.reduce((s, e) => s + (e.summaryExplanation || "").split(/\s+/).filter(Boolean).length, 0) /
      Math.max(1, oldE.length);
    const avgNewSummary =
      newE.reduce((s, e) => s + (e.summaryExplanation || "").split(/\s+/).filter(Boolean).length, 0) /
      Math.max(1, newE.length);

    const avgOldStrengths = oldE.reduce((s, e) => s + (e.strengths || []).length, 0) / Math.max(1, oldE.length);
    const avgNewStrengths = newE.reduce((s, e) => s + (e.strengths || []).length, 0) / Math.max(1, newE.length);

    console.log("\nAggregate:");
    console.log(`  Avg matchScore delta:   ${avgDelta.toFixed(2)}`);
    console.log(`  Max |delta|:            ${maxAbsDelta}`);
    console.log(`  Applicants whose rank changed: ${rankChanges}/${rows.length}`);
    console.log(`  Top-5 overlap:          ${top5Overlap}/5`);
    console.log(
      `  Avg summary length:     OLD=${avgOldSummary.toFixed(1)}w  NEW=${avgNewSummary.toFixed(1)}w`
    );
    console.log(
      `  Avg strengths items:    OLD=${avgOldStrengths.toFixed(1)}  NEW=${avgNewStrengths.toFixed(1)}`
    );
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
