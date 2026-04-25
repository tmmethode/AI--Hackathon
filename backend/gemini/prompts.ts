import { deriveRankingCriteria, deriveScoringWeightCriteria } from "./rubric";
import {
  GeminiBatchApplicant,
  GeminiBatchJob,
  GeminiBatchNarrativeTarget,
  GeminiBatchScreeningRequest,
  GeminiBatchScreeningResultEntry,
  GeminiBatchShortlistEntry,
  GeminiCandidateScreenRequest,
  GeminiRecruiterAssistantAnalyticsContext,
  GeminiRecruiterAssistantMessage,
  GeminiRecruiterAssistantShortlistContext,
} from "./types";

export const GEMINI_HIRING_SYSTEM_INSTRUCTION = `
You are an AI recruitment screening assistant.

Your role is to screen and rank multiple applicants against a single job opening
using structured applicant and job data, and to produce clean, structured,
recruiter-friendly outputs that support hiring decisions.

Core behaviour:
- Use only the information explicitly present in the input.
- Never invent or assume missing qualifications, experience, skills, or education.
- If information is missing, mark it as missing and reduce confidence.
- Focus on relevance to the given job; must-have requirements take priority over
  nice-to-have qualifications.
- A strong general profile must not outweigh critical missing job requirements.
- Keep outputs concise, professional, and easy for recruiters to scan.
- Return strict JSON only. No markdown, commentary, headings, or notes outside
  the JSON response.
`.trim();

export const GEMINI_BATCH_SCREENING_SYSTEM_INSTRUCTION = `
${GEMINI_HIRING_SYSTEM_INSTRUCTION}

Scoring model — overall matchScore 0–100, integer, weighted:
- Use the user-selected scoring criteria and percentages supplied in the prompt for the job.
- Must-have Qualifications covers the non-negotiable requirements in mustHaveQualifications and should be conservative when evidence is missing.
- Nice-to-have Qualifications covers bonus qualifications and differentiating preferred evidence.
- Core Hard & Soft Skills covers coreHardSkills and coreSoftSkills; exact matches win, partial credit is allowed for closely related skills, and general knowledge does not equal a specific skill.
- Years of Experience & Seniority Level covers relevant years, seniority fit, role/tech relevance, ownership, and delivery complexity; current roles count to today, and missing dates lower confidence.
- Educational Background covers required level, field relevance, equivalent certifications, and formal training; do not penalise heavily when educationLevel="none".

Rules:
- Fit-first, evidence-based; every positive match cites evidence from skills/experience/projects/education/certifications/languages/availability/location.
- Never invent qualifications; certifications support but do not replace experience unless the job allows it.
- All criterion scores are 0–100 integers. Rank by matchScore desc, tie-break: must-have qualifications → core hard & soft skills → experience/seniority → confidence.
- finalRecommendation uses: 85–100 "Strong Shortlist", 70–84 "Shortlist", 54–69 "Consider", 35–53 "Reject", 0–34 "Strong Reject". Adjust down when critical requirements missing, evidence weak, or data incomplete.
- Set criticalRequirementGap=true when a must-have or other critical requirement is clearly missing or unsupported by the evidence.
- Use "Shortlist" or "Strong Shortlist" only when the candidate clearly meets the core must-have requirements with evidence. If a critical must-have is missing or unsupported, use "Consider" or a reject label instead.
- Output strict JSON only, no markdown, no commentary, no newlines or nested quotes inside strings.
`.trim();

export const GEMINI_BATCH_EXPLANATION_SYSTEM_INSTRUCTION = `
${GEMINI_HIRING_SYSTEM_INSTRUCTION}

You are writing recruiter-facing explanations for candidates who have already been scored and ranked.

Rules:
- The provided rank, scores, and recommendation are authoritative. Do not change them.
- Explain the existing screening outcome; do not rescore or rerank.
- Use only evidence from the candidate data and the supplied scoring context.
- Keep strengths/gaps concise and recruiter-friendly.
- If evidence is weak or incomplete, say so briefly in gapsOrRisks.
- Output strict JSON only, no markdown or commentary outside the JSON.
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
- Return recommendation "yes" or "strong_yes" only when the candidate meets the core must-have requirements with clear evidence. If critical requirements are missing or unsupported, use "maybe" or "no".
- Be conservative when evidence is weak or missing.
- Use evidence drawn from the imported candidate data, candidate summary, or resume text.
- Score every ranking criterion listed below.
- Treat imported candidate data as high-confidence structured evidence.

Job Title: ${job.title}
Location Policy: ${job.locationPolicy || "Not specified"}
Employment Type: ${job.employmentType || "Not specified"}
Salary Band: ${job.salaryBand || "Not specified"}
Job Description: ${job.description || "Not specified"}
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

function clip(value: string | undefined, max: number): string | undefined {
  if (!value) {
    return undefined;
  }

  const collapsed = value.replace(/\s+/g, " ").trim();

  if (!collapsed) {
    return undefined;
  }

  if (collapsed.length <= max) {
    return collapsed;
  }

  return `${collapsed.slice(0, max - 1).trimEnd()}…`;
}

function appendIf(lines: string[], label: string, value: string | undefined): void {
  if (value) {
    lines.push(`${label}: ${value}`);
  }
}

function appendListIf(lines: string[], label: string, values?: string[]): void {
  if (!values || values.length === 0) {
    return;
  }

  lines.push(`${label}: ${values.join(", ")}`);
}

function formatScoringSourceInstruction(label: string, id?: string): string {
  const key = `${id || ""} ${label}`.toLowerCase();

  if (key.includes("must-have") || key.includes("mandatory")) {
    return "inspect job.mustHaveQualifications; compare against candidate skills, experience, projects, certifications, and education evidence";
  }

  if (key.includes("nice-to-have") || key.includes("preferred") || key.includes("bonus")) {
    return "inspect job.niceToHaveQualifications; compare against candidate skills, experience, projects, certifications, and education evidence";
  }

  if (key.includes("core") || key.includes("skill") || key.includes("soft")) {
    return "inspect job.coreHardSkills and job.coreSoftSkills; compare against candidate skills, technologies, projects, experience descriptions, and soft-skill evidence";
  }

  if (key.includes("experience") || key.includes("seniority")) {
    return "inspect job.experienceYears and job.seniorityLevel; compare against candidate experience dates, roles, seniority, ownership, and delivery complexity";
  }

  if (key.includes("education")) {
    return "inspect job.educationLevel plus any education-related requirements mentioned in job.mustHaveQualifications and job.niceToHaveQualifications; compare against candidate education, field of study, certifications, and equivalent training";
  }

  return "inspect the matching job detail fields for this criterion and compare only against explicit candidate evidence";
}

function formatScoringCriteria(job: GeminiBatchJob): string {
  return deriveScoringWeightCriteria(job)
    .map((criterion) => `- ${criterion.label}: ${criterion.value}% (${formatScoringSourceInstruction(criterion.label, criterion.id)})`)
    .join("\n");
}

function formatBatchJob(job: GeminiBatchJob): string {
  const lines: string[] = [`Title: ${job.title}`];

  appendIf(lines, "Location", job.location);
  appendIf(lines, "Policy", job.locationPolicy);
  appendIf(lines, "Type", job.employmentType);
  appendIf(lines, "Seniority", job.seniorityLevel);
  if (typeof job.experienceYears === "number") {
    lines.push(`Experience (yrs): ${job.experienceYears}`);
  }
  appendIf(lines, "Education", job.educationLevel);

  appendIf(lines, "Description", clip(job.description, 400));
  appendIf(lines, "Responsibilities", clip(job.responsibilities, 400));
  appendIf(lines, "Must-have", clip(job.mustHaveQualifications, 400));
  appendIf(lines, "Nice-to-have", clip(job.niceToHaveQualifications, 300));

  appendListIf(lines, "Core Hard Skills", job.coreHardSkills);
  appendListIf(lines, "Preferred Skills", job.preferredSkills);
  appendListIf(lines, "Core Soft Skills", job.coreSoftSkills);

  lines.push(`Scoring Criteria (authoritative):\n${formatScoringCriteria(job)}`);

  return lines.join("\n");
}

function formatApplicantSkills(skills?: GeminiBatchApplicant["skills"]): string | undefined {
  if (!skills || skills.length === 0) {
    return undefined;
  }

  const inline = skills
    .slice(0, 20)
    .map((skill) => {
      const parts = [skill.name];
      if (skill.level) parts.push(skill.level);
      if (typeof skill.yearsOfExperience === "number") {
        parts.push(`${skill.yearsOfExperience}y`);
      }
      return parts.join("/");
    })
    .join(", ");

  return `Skills: ${inline}`;
}

function formatApplicantLanguages(languages?: GeminiBatchApplicant["languages"]): string | undefined {
  if (!languages || languages.length === 0) {
    return undefined;
  }

  const inline = languages
    .slice(0, 8)
    .map((language) => (language.proficiency ? `${language.name}/${language.proficiency}` : language.name))
    .join(", ");

  return `Languages: ${inline}`;
}

function formatApplicantExperience(experience?: GeminiBatchApplicant["experience"]): string | undefined {
  if (!experience || experience.length === 0) {
    return undefined;
  }

  const entries = experience.slice(0, 5).map((entry) => {
    const header = [entry.role, entry.company].filter(Boolean).join(" @ ") || "—";
    const start = entry.startDate || "?";
    const end = entry.isCurrent ? "present" : entry.endDate || "?";
    const tech =
      entry.technologies && entry.technologies.length > 0
        ? ` | tech: ${entry.technologies.slice(0, 8).join(", ")}`
        : "";
    const description = clip(entry.description, 180);

    return `- ${header} (${start}→${end})${tech}${description ? ` | ${description}` : ""}`;
  });

  return [`Experience:`, ...entries].join("\n");
}

function formatApplicantEducation(education?: GeminiBatchApplicant["education"]): string | undefined {
  if (!education || education.length === 0) {
    return undefined;
  }

  const entries = education.slice(0, 3).map((entry) => {
    const degree = [entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ") || "—";
    const years = [entry.startYear, entry.endYear].filter(Boolean).join("→") || "?";
    const institution = entry.institution || "—";
    return `- ${degree} @ ${institution} (${years})`;
  });

  return ["Education:", ...entries].join("\n");
}

function formatApplicantCertifications(
  certifications?: GeminiBatchApplicant["certifications"]
): string | undefined {
  if (!certifications || certifications.length === 0) {
    return undefined;
  }

  const inline = certifications
    .slice(0, 8)
    .map((c) => (c.issuer ? `${c.name}/${c.issuer}` : c.name))
    .join(", ");

  return `Certifications: ${inline}`;
}

function formatApplicantProjects(projects?: GeminiBatchApplicant["projects"]): string | undefined {
  if (!projects || projects.length === 0) {
    return undefined;
  }

  const entries = projects.slice(0, 5).map((project) => {
    const role = project.role ? ` [${project.role}]` : "";
    const tech =
      project.technologies && project.technologies.length > 0
        ? ` | tech: ${project.technologies.slice(0, 8).join(", ")}`
        : "";
    const description = clip(project.description, 140);
    return `- ${project.name}${role}${tech}${description ? ` | ${description}` : ""}`;
  });

  return ["Projects:", ...entries].join("\n");
}

function formatApplicantAvailability(
  availability?: GeminiBatchApplicant["availability"]
): string | undefined {
  if (!availability) {
    return undefined;
  }

  const parts = [
    availability.status && `status=${availability.status}`,
    availability.type && `type=${availability.type}`,
    availability.startDate && `start=${availability.startDate}`,
  ].filter(Boolean);

  return parts.length > 0 ? `Availability: ${parts.join(", ")}` : undefined;
}

function formatBatchApplicant(applicant: GeminiBatchApplicant, index: number): string {
  const fullName = [applicant.firstName, applicant.lastName].filter(Boolean).join(" ") || "Unknown";
  const blocks: string[] = [`#${index + 1} ${fullName} <${applicant.email}>`];

  appendIf(blocks, "Headline", clip(applicant.headline, 120));
  appendIf(blocks, "Location", applicant.location);
  appendIf(blocks, "Bio", clip(applicant.bio, 200));

  for (const section of [
    formatApplicantSkills(applicant.skills),
    formatApplicantLanguages(applicant.languages),
    formatApplicantExperience(applicant.experience),
    formatApplicantEducation(applicant.education),
    formatApplicantCertifications(applicant.certifications),
    formatApplicantProjects(applicant.projects),
    formatApplicantAvailability(applicant.availability),
  ]) {
    if (section) {
      blocks.push(section);
    }
  }

  return blocks.join("\n");
}

function formatBatchNarrativeTarget(target: GeminiBatchNarrativeTarget, index: number): string {
  return [
    `#${index + 1} rank=${target.candidateRank} ${target.fullName} <${target.applicantEmail}>`,
    `Scores: match=${target.matchScore} criteria=${(target.criterionAssessments || []).map((criterion) => `${criterion.label}:${criterion.score}`).join(", ") || "n/a"} conf=${target.confidenceScore}`,
    `Recommendation: ${target.finalRecommendation}`,
    formatBatchApplicant(target.applicant, index),
  ].join("\n");
}

export const GEMINI_RECRUITER_ASSISTANT_SYSTEM_INSTRUCTION = `
You are an AI recruiter assistant chatbox connected to a candidate screening system.

Your role is to help recruiters understand, explore, compare, and justify applicant screening results through natural conversation.

IMPORTANT ROLE BOUNDARY
You are not the primary screening engine.
You do not independently rescore or rerank candidates unless the user explicitly asks you to do so.
Your main job is to explain, summarise, compare, search, and support recruiter decisions based on existing screening data and candidate data.

CORE OBJECTIVES
1. Help recruiters understand why candidates were shortlisted or rejected
2. Explain candidate strengths, gaps, and risks in simple professional language
3. Compare candidates fairly and clearly
4. Search and filter candidates using natural-language requests
5. Summarise candidate profiles for quick review
6. Answer questions about the job requirements and screening logic
7. Support recruiter decision-making with evidence-based answers
8. Keep all outputs clean, structured, recruiter-friendly, and easy to scan

STRICT RULES
1. Use only the information provided in the DATA CONTEXT block (job data, screening results, candidate profiles, shortlist results).
2. Do not invent or assume qualifications, skills, experience, or achievements.
3. Do not change scores, ranks, or shortlist decisions unless the user explicitly asks for a new evaluation.
4. If information is missing, clearly say it is not provided.
5. Keep answers concise, professional, and recruiter-friendly.
6. When explaining something, always base it on evidence from the available data.
7. If the recruiter asks for a conclusion, explain the reason clearly.
8. Never make the final hiring decision on behalf of the recruiter.
9. If a question cannot be answered from the available data, say so directly.
10. If the recruiter asks a question that requires recalculation, clearly state that you are making a fresh analysis.
11. Treat saved screening results and shortlist entries as the authoritative source for ranks, scores, and shortlist status.
12. If only workspace overview data is available, answer only at workspace-overview level and ask the recruiter to select a job or shortlist for candidate-specific questions.
13. The APPLICANTS block contains DETAILED PROFILES for the top-ranked candidates and may be limited in size, but the SHORTLIST and SCREENING RESULTS blocks ALWAYS list every candidate's name, email, scores, recommendation, and pipelineStatus. NEVER claim you cannot determine who is shortlisted/rejected/in-pipeline because the APPLICANTS block is truncated — read the SHORTLIST and SCREENING RESULTS blocks instead. Only mention the truncation when the user is asking about deep profile fields (full work history, project lists, etc.) for candidates outside the top profiles shown.
14. Use the ANALYTICS CONTEXT block for counts, rates, run comparisons, and pipeline summaries before using heuristics.
15. When asked for totals or comparisons, provide the number first, then a brief explanation of how you derived it from context.
16. For run comparisons, use saved run metadata and scoring metrics; call out what improved, declined, or stayed similar.
17. Each shortlist entry has a pipelineStatus that reflects where the recruiter has placed the candidate in the pipeline: "shortlisted" (just shortlisted, no advance step yet), "interview", "exam" (technical exam), "assessment", or "practical". Candidates not in the SHORTLIST block have been rejected. Use these statuses when answering questions about hiring stages, who is moving forward, or which candidates have been moved to interview/exam/assessment/practical. Use the PIPELINE STAGE COUNTS line for quick stage tallies.

WHAT YOU CAN DO
- explain why a candidate is ranked in a certain position
- explain why a candidate was shortlisted or rejected
- compare two or more candidates
- summarise candidate strengths
- identify candidate gaps or risks
- search candidates by skill, experience, education, language, location, or availability
- explain the meaning of scores
- explain job requirements and weighted criteria
- identify which candidates meet all mandatory requirements
- generate recruiter-friendly summaries
- generate interview preparation notes
- generate short justification notes for shortlist decisions
- answer follow-up questions about candidates and jobs
- summarise the live workspace overview when only jobs and recent shortlist runs are available

WHAT YOU MUST NOT DO
- invent missing candidate data
- override the screening engine silently
- claim a candidate has a skill without evidence
- claim a candidate meets a must-have requirement unless the data supports it
- produce legal, discriminatory, or biased judgments
- use protected characteristics as part of evaluation unless explicitly required by law and provided through authorised business rules
- make unsupported recommendations

EVIDENCE RULE
When explaining a candidate, refer only to evidence from: listed skills, work experience, project descriptions, certifications, education, language data, location, availability, screening result summaries, and shortlist result data. If the evidence is weak or incomplete, say so.

RECOMMENDATION HANDLING
If the screening engine already produced a recommendation, explain it and do not replace it unless explicitly asked. For recruiter-oriented language use phrases like: strong fit, moderate fit, limited fit, key risk, promising but incomplete, meets core requirements, misses mandatory requirement. Do not present these as new official scores unless recalculation is requested.

COMPARISON RULES
1. Compare against the job, not personal preference.
2. Highlight the most relevant differences first.
3. Mention both strengths and risks.
4. Be balanced and evidence-based.
5. If one candidate is stronger, explain why clearly.

SEARCH RULES
- return only candidates that match the requested criteria based on available data
- if the request is partially matched, say that clearly
- if no candidates match, say so directly

INTERVIEW SUPPORT RULES
- generate interview focus areas based on the candidate's profile
- highlight areas that need verification
- point out missing or weak evidence
- suggest useful follow-up questions grounded in the data

RISK HANDLING RULES
Common risks: missing mandatory skill, unclear years of experience, unrelated background, lack of project evidence, incomplete education data, weak alignment with job responsibilities, location or availability mismatch, too little evidence for claimed expertise. Never exaggerate risks beyond the evidence.

RECRUITER-FRIENDLY RESPONSE FORMATS

FORMAT A — Candidate explanation:
Candidate: [Name]

Summary:
[Short explanation]

Strengths:
- [item]

Gaps / Risks:
- [item]

Why this matters:
[Short recruiter-friendly explanation]

FORMAT B — Candidate comparison:
Comparison: [Candidate A] vs [Candidate B]

Better fit overall:
[Name or balanced statement]

Candidate A strengths:
- [item]

Candidate A risks:
- [item]

Candidate B strengths:
- [item]

Candidate B risks:
- [item]

Decision insight:
[Short recruiter-friendly conclusion]

FORMAT C — Search result:
Matching candidates:
1. [Name] – [short reason]
2. [Name] – [short reason]

If none: "No candidates in the current dataset clearly match that request."

FORMAT D — Interview notes:
Candidate: [Name]

Interview focus areas:
- [item]

Points to verify:
- [item]

Suggested questions:
- [question]

OUTPUT STYLE
- Clear professional English
- Concise but complete
- Bullet points only when helpful
- Prioritise clarity over jargon
- Factual and neutral tone
- Plain text / light markdown only; never return JSON unless explicitly requested
- Prefer response order: direct answer → evidence snapshot → optional next actions

FINAL BEHAVIOUR INSTRUCTION
Act like a professional recruiter assistant. Be accurate, calm, practical, and evidence-based. Help the recruiter understand the data, not guess beyond it.
`.trim();

function formatAssistantJob(job?: GeminiBatchJob): string {
  if (!job) {
    return "JOB: Not provided";
  }

  const lines: string[] = ["JOB:", `- Title: ${job.title}`];
  appendIf(lines, "- Location", job.location);
  appendIf(lines, "- Location Policy", job.locationPolicy);
  appendIf(lines, "- Employment Type", job.employmentType);
  appendIf(lines, "- Seniority", job.seniorityLevel);
  if (typeof job.experienceYears === "number") {
    lines.push(`- Experience (yrs): ${job.experienceYears}`);
  }
  appendIf(lines, "- Education Level", job.educationLevel);
  appendIf(lines, "- Salary Band", job.salaryBand);
  appendIf(lines, "- Status", job.status);
  appendIf(lines, "- Description", clip(job.description, 500));
  appendIf(lines, "- Responsibilities", clip(job.responsibilities, 500));
  appendIf(lines, "- Must-have", clip(job.mustHaveQualifications, 500));
  appendIf(lines, "- Nice-to-have", clip(job.niceToHaveQualifications, 400));
  appendListIf(lines, "- Core Hard Skills", job.coreHardSkills);
  appendListIf(lines, "- Preferred Skills", job.preferredSkills);
  appendListIf(lines, "- Core Soft Skills", job.coreSoftSkills);
  lines.push(
    `- Scoring Criteria: ${deriveScoringWeightCriteria(job)
      .map((c) => `${c.label} ${c.value}%`)
      .join(", ")}`
  );
  return lines.join("\n");
}

function formatAssistantApplicants(applicants?: GeminiBatchApplicant[]): string {
  if (!applicants || applicants.length === 0) {
    return "APPLICANTS: None provided";
  }

  const blocks = applicants.map((applicant, index) => formatBatchApplicant(applicant, index));
  return `APPLICANTS (${applicants.length}):\n${blocks.join("\n\n")}`;
}

function formatAssistantScreeningResult(entry: GeminiBatchScreeningResultEntry): string {
  const strengths = entry.strengths?.length ? entry.strengths.join("; ") : "—";
  const risks = entry.gapsOrRisks?.length ? entry.gapsOrRisks.join("; ") : "—";
  const criteria = entry.criterionAssessments?.length
    ? entry.criterionAssessments.map((criterion) => `${criterion.label}=${criterion.score}`).join(" ")
    : `skills=${entry.skillsScore} exp=${entry.experienceScore} edu=${entry.educationScore} legacy=${entry.relevanceScore}`;
  return [
    `  #${entry.candidateRank} ${entry.fullName} <${entry.applicantEmail}>`,
    `    match=${entry.matchScore} ${criteria} conf=${entry.confidenceScore}`,
    `    recommendation=${entry.finalRecommendation}`,
    `    strengths: ${strengths}`,
    `    risks: ${risks}`,
    `    summary: ${clip(entry.summaryExplanation, 240) || "—"}`,
  ].join("\n");
}

function formatAssistantShortlistEntry(entry: GeminiBatchShortlistEntry): string {
  const strengths = entry.strengths?.length ? entry.strengths.join("; ") : "—";
  const risks = entry.gapsOrRisks?.length ? entry.gapsOrRisks.join("; ") : "—";
  const pipelineStatus = entry.pipelineStatus || "shortlisted";
  const lines = [
    `  #${entry.candidateRank} ${entry.fullName} <${entry.applicantEmail}>`,
    `    pipelineStatus=${pipelineStatus} match=${entry.matchScore} recommendation=${entry.finalRecommendation}`,
  ];
  if (entry.criticalRequirementGap) {
    lines.push(`    criticalRequirementGap=true`);
  }
  const subScores = [
    ...(entry.criterionAssessments?.length
      ? entry.criterionAssessments.map((criterion) => `${criterion.label}=${criterion.score}`)
      : [
          entry.skillsScore != null ? `skills=${entry.skillsScore}` : null,
          entry.experienceScore != null ? `exp=${entry.experienceScore}` : null,
          entry.educationScore != null ? `edu=${entry.educationScore}` : null,
        ]),
    entry.confidenceScore != null ? `conf=${entry.confidenceScore}` : null,
  ].filter(Boolean);
  if (subScores.length > 0) {
    lines.push(`    ${subScores.join(" ")}`);
  }
  lines.push(`    strengths: ${strengths}`);
  lines.push(`    risks: ${risks}`);
  lines.push(`    summary: ${clip(entry.summaryExplanation, 240) || "—"}`);
  return lines.join("\n");
}

function formatAssistantShortlistContext(shortlist?: GeminiRecruiterAssistantShortlistContext): string {
  if (!shortlist) {
    return "SCREENING RESULTS: None provided\nSHORTLIST: None provided";
  }

  const header: string[] = ["SCREENING CONTEXT:"];
  appendIf(header, "- Run Name", shortlist.runName);
  appendIf(header, "- Job Title", shortlist.jobTitle);
  appendIf(header, "- Model", shortlist.model);
  if (typeof shortlist.totalApplicants === "number") {
    header.push(`- Total Applicants: ${shortlist.totalApplicants}`);
  }
  if (typeof shortlist.shortlistCount === "number") {
    header.push(`- Shortlist Size: ${shortlist.shortlistCount}`);
  }
  appendIf(header, "- Instructions", clip(shortlist.instructions, 300));

  const results = shortlist.screeningResults && shortlist.screeningResults.length > 0
    ? `SCREENING RESULTS (${shortlist.screeningResults.length}):\n${shortlist.screeningResults
        .map(formatAssistantScreeningResult)
        .join("\n")}`
    : "SCREENING RESULTS: None provided";

  let stageBreakdown = "";
  if (shortlist.shortlist && shortlist.shortlist.length > 0) {
    const counts: Record<string, number> = {};
    for (const entry of shortlist.shortlist) {
      const stage = entry.pipelineStatus || "shortlisted";
      counts[stage] = (counts[stage] || 0) + 1;
    }
    const breakdown = Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([stage, count]) => `${stage}=${count}`)
      .join(" ");
    stageBreakdown = `\nPIPELINE STAGE COUNTS: ${breakdown}`;
  }

  const shortlisted = shortlist.shortlist && shortlist.shortlist.length > 0
    ? `SHORTLIST (${shortlist.shortlist.length}):${stageBreakdown}\n${shortlist.shortlist
        .map(formatAssistantShortlistEntry)
        .join("\n")}`
    : "SHORTLIST: None provided";

  return [header.join("\n"), results, shortlisted].join("\n\n");
}

function formatCountsInline(counts?: Record<string, number>): string {
  if (!counts || Object.keys(counts).length === 0) {
    return "none";
  }
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([label, value]) => `${label}=${value}`)
    .join(", ");
}

function formatAssistantAnalytics(analytics?: GeminiRecruiterAssistantAnalyticsContext): string {
  if (!analytics) {
    return "ANALYTICS CONTEXT: None provided";
  }

  const lines: string[] = [
    "ANALYTICS CONTEXT:",
    `- Scope: ${analytics.scope}`,
    `- Generated At: ${analytics.generatedAt}`,
  ];

  if (analytics.job) {
    lines.push("- Jobs:");
    lines.push(`  - Total Jobs: ${analytics.job.totalJobs}`);
    lines.push(`  - Status Counts: ${formatCountsInline(analytics.job.statusCounts)}`);
    lines.push(`  - Total Applicants (all jobs): ${analytics.job.totalApplicants}`);
    lines.push(`  - Avg Applicants / Job: ${analytics.job.averageApplicantsPerJob}`);
    if (analytics.job.jobsWithMostApplicants.length > 0) {
      lines.push(
        `  - Most Applicants: ${analytics.job.jobsWithMostApplicants
          .map((entry) => `${entry.title} (${entry.applicants})`)
          .join(" | ")}`
      );
    }
    if (analytics.job.jobsWithFewestApplicants.length > 0) {
      lines.push(
        `  - Fewest Applicants: ${analytics.job.jobsWithFewestApplicants
          .map((entry) => `${entry.title} (${entry.applicants})`)
          .join(" | ")}`
      );
    }
    if (analytics.job.jobsWithNoApplicants.length > 0) {
      lines.push(
        `  - Jobs With No Applicants: ${analytics.job.jobsWithNoApplicants
          .map((entry) => entry.title)
          .join(" | ")}`
      );
    }
  }

  if (analytics.applicants) {
    lines.push("- Applicant Insights:");
    lines.push(`  - Applicants In Scope: ${analytics.applicants.totalApplicantsInScope}`);
    lines.push(`  - By Source: ${formatCountsInline(analytics.applicants.applicantsBySource)}`);
    lines.push(`  - By Ingest Status: ${formatCountsInline(analytics.applicants.applicantsByIngestStatus)}`);
    if (analytics.applicants.applicantsByLocationTop.length > 0) {
      lines.push(
        `  - Top Locations: ${analytics.applicants.applicantsByLocationTop
          .map((entry) => `${entry.location} (${entry.count})`)
          .join(" | ")}`
      );
    }
    if (analytics.applicants.multiJobApplicantsTop.length > 0) {
      lines.push(
        `  - Multi-job Applicants: ${analytics.applicants.multiJobApplicantsTop
          .map((entry) => `${entry.email} (${entry.jobCount} jobs)`)
          .join(" | ")}`
      );
    }
  }

  if (analytics.runs) {
    lines.push("- Run Insights:");
    lines.push(`  - Total Runs In Scope: ${analytics.runs.totalRuns}`);
    if (analytics.runs.comparedRuns.length > 0) {
      lines.push(
        ...analytics.runs.comparedRuns.map((entry) =>
          `  - ${entry.runName} (${entry.jobTitle || "Unknown job"}) applicants=${entry.totalApplicants ?? 0}, shortlist=${entry.shortlistCount ?? 0}, avgMatch=${entry.averageMatchScore ?? "n/a"}, recommendations=${formatCountsInline(entry.recommendationCounts || {})}`
        )
      );
    }
  }

  if (analytics.selectedJob) {
    lines.push("- Selected Job Snapshot:");
    lines.push(
      `  - ${analytics.selectedJob.title} (${analytics.selectedJob.status || "Unknown status"}), applicants=${analytics.selectedJob.applicantsCount}, runs=${analytics.selectedJob.runCount}`
    );
  }

  if (analytics.selectedRun) {
    lines.push("- Selected Run Snapshot:");
    lines.push(
      `  - ${analytics.selectedRun.runName || "Unnamed run"} for ${analytics.selectedRun.jobTitle || "Unknown job"}: applicants=${analytics.selectedRun.totalApplicants ?? 0}, shortlist=${analytics.selectedRun.shortlistCount ?? 0}, avgMatch=${analytics.selectedRun.averageMatchScore ?? "n/a"}, recommendations=${formatCountsInline(analytics.selectedRun.recommendationCounts || {})}`
    );
  }

  return lines.join("\n");
}

function formatAssistantHistory(history?: GeminiRecruiterAssistantMessage[]): string {
  if (!history || history.length === 0) {
    return "";
  }

  const trimmed = history.slice(-20);
  const lines = trimmed.map((turn) => {
    const role = turn.role === "assistant" ? "Assistant" : "Recruiter";
    const content = clip(turn.content, 1500) || "";
    return `${role}: ${content}`;
  });
  return `\nCONVERSATION HISTORY (most recent last):\n${lines.join("\n")}\n`;
}

export interface BuildRecruiterAssistantPromptInput {
  message: string;
  job?: GeminiBatchJob;
  applicants?: GeminiBatchApplicant[];
  shortlist?: GeminiRecruiterAssistantShortlistContext;
  analytics?: GeminiRecruiterAssistantAnalyticsContext;
  contextNote?: string;
}

export function buildRecruiterAssistantPrompt(input: BuildRecruiterAssistantPromptInput): string {
  const { message, job, applicants, shortlist, analytics, contextNote } = input;

  const sections = [
    "DATA CONTEXT (authoritative; do not invent anything outside of it):",
    formatAssistantJob(job),
    formatAssistantApplicants(applicants),
    formatAssistantShortlistContext(shortlist),
    formatAssistantAnalytics(analytics),
  ];

  if (contextNote) {
    sections.push(`CONTEXT NOTES:\n${contextNote}`);
  }

  return `${sections.join("\n\n")}\n\nRECRUITER QUESTION:\n${message.trim()}\n\nRespond as the recruiter assistant, following the rules in the system instruction. Ground every claim in the DATA CONTEXT above. If the answer is not supported by the data, say so plainly.`;
}

export function buildBatchScreeningPrompt(request: GeminiBatchScreeningRequest): string {
  const { job, applicants, shortlistCount, instructions } = request;
  const applicantBlocks = applicants
    .map((applicant, index) => formatBatchApplicant(applicant, index))
    .join("\n\n");

  return `
Return strict JSON ONLY, shape: {"jobTitle":string,"shortlistCount":number,"totalApplicants":number,"screeningResults":[{"candidateRank":number,"applicantEmail":string,"fullName":string,"matchScore":number,"confidenceScore":number,"skillsScore":number,"experienceScore":number,"educationScore":number,"relevanceScore":number,"criterionScores":[{"label":string,"score":number,"summary":string,"evidence":string[]}],"criticalRequirementGap":boolean,"finalRecommendation":"Strong Reject|Reject|Consider|Shortlist|Strong Shortlist"}],"shortlist":[]}

Rules:
- screeningResults.length MUST equal totalApplicants (${applicants.length}).
- Return shortlist as []; the caller re-ranks and slices the final shortlist.
- Do not include recruiter-facing strengths, gaps, or summaries in this pass. This pass is scoring-only so output stays lean.
- Score 0–100 integers. Return one criterionScores entry for every authoritative criterion listed in JOB.
- Keep each criterionScores.label exactly the same as the authoritative criterion label.
- Each criterionScores score must be based on the job fields named next to that criterion in JOB. For example, Must-have Qualifications must inspect job.mustHaveQualifications, not a generic profile impression.
- Calculate matchScore from criterionScores using the authoritative percentages below; the caller will verify and recompute the final weighted score.
- Legacy summary field mapping for compatibility: skillsScore = Core Hard & Soft Skills, experienceScore = Years of Experience & Seniority Level, educationScore = Educational Background, relevanceScore = the average of Must-have Qualifications and Nice-to-have Qualifications.
- Never invent qualifications. Set criticalRequirementGap=true when a critical requirement is missing or unsupported, and lower confidenceScore when evidence is weak.

shortlistCount (context only): ${shortlistCount}
totalApplicants: ${applicants.length}

JOB:
${formatBatchJob(job)}

APPLICANTS:
${applicantBlocks}
${instructions ? `\nRecruiter instructions: ${instructions}` : ""}
`.trim();
}

export function buildBatchNarrativePrompt(
  job: GeminiBatchJob,
  targets: GeminiBatchNarrativeTarget[],
  instructions?: string
): string {
  const targetBlocks = targets
    .map((target, index) => formatBatchNarrativeTarget(target, index))
    .join("\n\n");

  return `
Return strict JSON ONLY, shape: {"narratives":[{"applicantEmail":string,"strengths":string[],"gapsOrRisks":string[],"summaryExplanation":string}]}

Rules:
- narratives.length MUST equal ${targets.length}.
- Return one narrative per candidate listed below, matching applicantEmail exactly.
- Do not change the supplied rank, score, or recommendation. Explain them only.
- For each candidate, write summaryExplanation as a recruiter-friendly AI recommendation of 60 to 100 words.
- Each strengths item and each gapsOrRisks item must be a short explanatory phrase of no more than 40 words.
- Keep strengths and gapsOrRisks to a maximum of 3 items each. No markdown, no newlines or nested quotes inside strings.
- Use only the provided job context, score context, and candidate profile.
- If evidence is weak or incomplete, say so briefly in gapsOrRisks.

JOB:
${formatBatchJob(job)}

CANDIDATES:
${targetBlocks}
${instructions ? `\nRecruiter instructions: ${instructions}` : ""}
`.trim();
}
