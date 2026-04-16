import { deriveRankingCriteria } from "./rubric";
import { GeminiCandidateScreenRequest } from "./types";

export const GEMINI_HIRING_SYSTEM_INSTRUCTION = `
You are an AI hiring assistant for structured candidate screening.
You must be careful, evidence-based, and concise.
Always score candidates against the job context provided.
When asked for JSON, return valid JSON only with no markdown fences.
`.trim();

function formatList(title: string, items?: string[]): string {
  if (!items || items.length === 0) {
    return `${title}: None provided`;
  }

  return `${title}:\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function formatRankingCriteria(request: GeminiCandidateScreenRequest): string {
  const criteria = deriveRankingCriteria(request.job);

  return `Ranking Criteria:\n${criteria
    .map((criterion) => `- ${criterion.label} (${criterion.pct}%): ${criterion.description || "No description provided"}`)
    .join("\n")}`;
}

function formatResponsibilities(items?: string[]): string {
  return formatList("Responsibilities", items);
}

function formatImportedCandidateData(request: GeminiCandidateScreenRequest): string {
  const importedData = request.candidate.importedData;

  if (!importedData) {
    return "Imported Candidate Data: None provided";
  }

  return `
Imported Candidate Data:
- Source: ${importedData.source || "Not provided"}
- Parsed Experience: ${importedData.experience || "Not provided"}
- Parsed Education Level: ${importedData.educationLevel || "Not provided"}
${formatList("Extracted Skills", importedData.extractedSkills)}
${formatList("Tags", importedData.tags)}
${formatList("Certifications", importedData.certifications)}
${formatList("Ingestion Notes", importedData.notes)}
`.trim();
}

export function buildCandidateScreeningPrompt(request: GeminiCandidateScreenRequest): string {
  const { job, candidate, instructions } = request;
  const criteria = deriveRankingCriteria(job);

  return `
Evaluate this candidate for the job below and return JSON with this exact shape:
{
  "recommendation": "strong_yes" | "yes" | "maybe" | "no",
  "mustHaveMatchScore": number,
  "dataCompletenessScore": number,
  "summary": string,
  "strengths": string[],
  "concerns": string[],
  "evidence": string[],
  "criterionScores": [
    {
      "label": string,
      "score": number,
      "summary": string,
      "evidence": string[]
    }
  ]
}

Scoring rules:
- mustHaveMatchScore and dataCompletenessScore must be integers from 0 to 100.
- Each criterion score must be an integer from 0 to 100.
- Focus first on must-have qualifications and hard skills.
- Be conservative when evidence is weak or missing.
- Use evidence drawn from the imported candidate data, candidate summary, or resume text.
- Score every ranking criterion listed below.
- Treat imported candidate data as high-confidence structured evidence.

Job Title: ${job.title}
Department: ${job.department || "Not specified"}
Location Policy: ${job.locationPolicy || "Not specified"}
Employment Type: ${job.employmentType || "Not specified"}
Salary Band: ${job.salaryBand || "Not specified"}
Job Summary: ${job.summary || "Not specified"}
${formatResponsibilities(job.responsibilities)}
Experience Requirement: ${job.experience || "Not specified"}
Seniority Level: ${job.seniorityLevel || "Not specified"}
Education Level: ${job.educationLevel || "Not specified"}
${formatList("Must-have Qualifications", job.mustHaveQualifications)}
${formatList("Nice-to-have Qualifications", job.niceToHaveQualifications)}
${formatList("Core Hard Skills", job.coreHardSkills || job.hardSkills)}
${formatList("Preferred / Bonus Skills", job.preferredBonusSkills)}
${formatList("Core Soft Skills", job.coreSoftSkills || job.softSkills)}
${formatRankingCriteria(request)}

Candidate Name: ${candidate.fullName || "Not provided"}
Candidate Summary: ${candidate.summary || "Not provided"}
${formatImportedCandidateData(request)}
Resume Text:
${candidate.resumeText}

Additional Instructions:
${instructions || "Prioritize fit for the role and explain the score clearly."}

Important:
- Return exactly ${criteria.length} criterionScores entries, one for each ranking criterion.
- Keep each criterionScores.label exactly the same as the ranking criterion label.
`.trim();
}
