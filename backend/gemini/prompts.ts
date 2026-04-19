import { deriveRankingCriteria } from "./rubric";
import {
  GeminiBatchApplicant,
  GeminiBatchJob,
  GeminiBatchScreeningRequest,
  GeminiBatchScreeningResultEntry,
  GeminiBatchShortlistEntry,
  GeminiCandidateScreenRequest,
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
- Skills 35% (coreHardSkills + preferredSkills + skill-related must-haves; exact matches win; partial credit for closely related skills; general knowledge ≠ specific skill)
- Experience 30% (relevant years, seniority fit, role/tech relevance, ownership; current roles count to today; conservative on missing dates — flag in gapsOrRisks and lower confidenceScore)
- Education 10% (required level + field relevance; do not penalise heavily when educationLevel="none")
- Relevance 25% (responsibilities, industry, certifications, projects, soft skills, location, availability, languages)

Rules:
- Relevance-first, evidence-based; every positive match cites evidence from skills/experience/projects/education/certifications/languages/availability/location.
- Never invent qualifications; certifications support but do not replace experience unless the job allows it.
- All sub-scores are 0–100 integers. Rank by matchScore desc, tie-break: skills → experience → relevance → confidence.
- finalRecommendation uses: 85–100 "Strong Shortlist", 70–84 "Shortlist", 55–69 "Consider", 35–54 "Reject", 0–34 "Strong Reject". Adjust down when critical requirements missing, evidence weak, or data incomplete.
- Output strict JSON only, no markdown, no commentary, no newlines or nested quotes inside strings.
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

function formatBatchJob(job: GeminiBatchJob): string {
  const lines: string[] = [`Title: ${job.title}`];

  appendIf(lines, "Department", job.department);
  appendIf(lines, "Location", job.location);
  appendIf(lines, "Policy", job.locationPolicy);
  appendIf(lines, "Type", job.employmentType);
  appendIf(lines, "Seniority", job.seniorityLevel);
  if (typeof job.experienceYears === "number") {
    lines.push(`Experience (yrs): ${job.experienceYears}`);
  }
  appendIf(lines, "Education", job.educationLevel);

  appendIf(lines, "Summary", clip(job.summary, 400));
  appendIf(lines, "Responsibilities", clip(job.responsibilities, 400));
  appendIf(lines, "Must-have", clip(job.mustHaveQualifications, 400));
  appendIf(lines, "Nice-to-have", clip(job.niceToHaveQualifications, 300));

  appendListIf(lines, "Core Hard Skills", job.coreHardSkills);
  appendListIf(lines, "Preferred Skills", job.preferredSkills);
  appendListIf(lines, "Core Soft Skills", job.coreSoftSkills);

  if (job.weightCriteria && job.weightCriteria.length > 0) {
    lines.push(
      `Weight Criteria (informational): ${job.weightCriteria
        .map((c) => `${c.label} ${c.value}%`)
        .join(", ")}`
    );
  }

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
13. If the context says applicant profiles were truncated or limited, mention that limitation whenever it materially affects the answer.

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

FINAL BEHAVIOUR INSTRUCTION
Act like a professional recruiter assistant. Be accurate, calm, practical, and evidence-based. Help the recruiter understand the data, not guess beyond it.
`.trim();

function formatAssistantJob(job?: GeminiBatchJob): string {
  if (!job) {
    return "JOB: Not provided";
  }

  const lines: string[] = ["JOB:", `- Title: ${job.title}`];
  appendIf(lines, "- Department", job.department);
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
  appendIf(lines, "- Summary", clip(job.summary, 500));
  appendIf(lines, "- Responsibilities", clip(job.responsibilities, 500));
  appendIf(lines, "- Must-have", clip(job.mustHaveQualifications, 500));
  appendIf(lines, "- Nice-to-have", clip(job.niceToHaveQualifications, 400));
  appendListIf(lines, "- Core Hard Skills", job.coreHardSkills);
  appendListIf(lines, "- Preferred Skills", job.preferredSkills);
  appendListIf(lines, "- Core Soft Skills", job.coreSoftSkills);
  if (job.weightCriteria && job.weightCriteria.length > 0) {
    lines.push(
      `- Weight Criteria: ${job.weightCriteria
        .map((c) => `${c.label} ${c.value}%`)
        .join(", ")}`
    );
  }
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
  return [
    `  #${entry.candidateRank} ${entry.fullName} <${entry.applicantEmail}>`,
    `    match=${entry.matchScore} skills=${entry.skillsScore} exp=${entry.experienceScore} edu=${entry.educationScore} rel=${entry.relevanceScore} conf=${entry.confidenceScore}`,
    `    recommendation=${entry.finalRecommendation}`,
    `    strengths: ${strengths}`,
    `    risks: ${risks}`,
    `    summary: ${clip(entry.summaryExplanation, 240) || "—"}`,
  ].join("\n");
}

function formatAssistantShortlistEntry(entry: GeminiBatchShortlistEntry): string {
  const strengths = entry.strengths?.length ? entry.strengths.join("; ") : "—";
  const risks = entry.gapsOrRisks?.length ? entry.gapsOrRisks.join("; ") : "—";
  return [
    `  #${entry.candidateRank} ${entry.fullName} <${entry.applicantEmail}>`,
    `    match=${entry.matchScore} recommendation=${entry.finalRecommendation}`,
    `    strengths: ${strengths}`,
    `    risks: ${risks}`,
    `    summary: ${clip(entry.summaryExplanation, 240) || "—"}`,
  ].join("\n");
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

  const shortlisted = shortlist.shortlist && shortlist.shortlist.length > 0
    ? `SHORTLIST (${shortlist.shortlist.length}):\n${shortlist.shortlist
        .map(formatAssistantShortlistEntry)
        .join("\n")}`
    : "SHORTLIST: None provided";

  return [header.join("\n"), results, shortlisted].join("\n\n");
}

function formatAssistantHistory(history?: GeminiRecruiterAssistantMessage[]): string {
  if (!history || history.length === 0) {
    return "";
  }

  const trimmed = history.slice(-10);
  const lines = trimmed.map((turn) => {
    const role = turn.role === "assistant" ? "Assistant" : "Recruiter";
    const content = clip(turn.content, 800) || "";
    return `${role}: ${content}`;
  });
  return `\nCONVERSATION HISTORY (most recent last):\n${lines.join("\n")}\n`;
}

export interface BuildRecruiterAssistantPromptInput {
  message: string;
  history?: GeminiRecruiterAssistantMessage[];
  job?: GeminiBatchJob;
  applicants?: GeminiBatchApplicant[];
  shortlist?: GeminiRecruiterAssistantShortlistContext;
  contextNote?: string;
}

export function buildRecruiterAssistantPrompt(input: BuildRecruiterAssistantPromptInput): string {
  const { message, history, job, applicants, shortlist, contextNote } = input;

  const sections = [
    "DATA CONTEXT (authoritative; do not invent anything outside of it):",
    formatAssistantJob(job),
    formatAssistantApplicants(applicants),
    formatAssistantShortlistContext(shortlist),
  ];

  if (contextNote) {
    sections.push(`CONTEXT NOTES:\n${contextNote}`);
  }

  const historyBlock = formatAssistantHistory(history);

  return `${sections.join("\n\n")}${historyBlock}\n\nRECRUITER QUESTION:\n${message.trim()}\n\nRespond as the recruiter assistant, following the rules in the system instruction. Ground every claim in the DATA CONTEXT above. If the answer is not supported by the data, say so plainly.`;
}

export function buildBatchScreeningPrompt(request: GeminiBatchScreeningRequest): string {
  const { job, applicants, shortlistCount, instructions } = request;
  const applicantBlocks = applicants
    .map((applicant, index) => formatBatchApplicant(applicant, index))
    .join("\n\n");

  return `
Return strict JSON ONLY, shape: {"jobTitle":string,"department":string,"shortlistCount":number,"totalApplicants":number,"screeningResults":[{"candidateRank":number,"applicantEmail":string,"fullName":string,"matchScore":number,"confidenceScore":number,"skillsScore":number,"experienceScore":number,"educationScore":number,"relevanceScore":number,"strengths":string[],"gapsOrRisks":string[],"finalRecommendation":"Strong Reject|Reject|Consider|Shortlist|Strong Shortlist","summaryExplanation":string}],"shortlist":[]}

Rules:
- screeningResults.length MUST equal totalApplicants (${applicants.length}).
- Return shortlist as []; the caller re-ranks and slices the final shortlist.
- Token-lean output per applicant: strengths/gapsOrRisks max 3 items of ≤8 words each; summaryExplanation one sentence ≤25 words. No markdown, no newlines or nested quotes inside strings.
- Score 0–100 integers. Apply the weighted model and rules from the system instruction.
- Never invent qualifications; call out missing evidence briefly in gapsOrRisks and lower confidenceScore.

shortlistCount (context only): ${shortlistCount}
totalApplicants: ${applicants.length}

JOB:
${formatBatchJob(job)}

APPLICANTS:
${applicantBlocks}
${instructions ? `\nRecruiter instructions: ${instructions}` : ""}
`.trim();
}
