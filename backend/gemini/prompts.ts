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

export function buildCandidateScreeningPrompt(request: GeminiCandidateScreenRequest): string {
  const { job, candidate, instructions } = request;

  return `
Evaluate this candidate for the job below and return JSON with this exact shape:
{
  "recommendation": "strong_yes" | "yes" | "maybe" | "no",
  "score": number,
  "summary": string,
  "strengths": string[],
  "concerns": string[],
  "evidence": string[]
}

Scoring rules:
- Score must be an integer from 0 to 100.
- Focus first on must-have qualifications and hard skills.
- Be conservative when evidence is weak or missing.
- Use evidence drawn from the candidate summary or resume text.

Job Title: ${job.title}
Experience Requirement: ${job.experience || "Not specified"}
Seniority Level: ${job.seniorityLevel || "Not specified"}
Education Level: ${job.educationLevel || "Not specified"}
${formatList("Must-have Qualifications", job.mustHaveQualifications)}
${formatList("Nice-to-have Qualifications", job.niceToHaveQualifications)}
${formatList("Hard Skills", job.hardSkills)}
${formatList("Soft Skills", job.softSkills)}

Candidate Name: ${candidate.fullName || "Not provided"}
Candidate Summary: ${candidate.summary || "Not provided"}
Resume Text:
${candidate.resumeText}

Additional Instructions:
${instructions || "Prioritize fit for the role and explain the score clearly."}
`.trim();
}
