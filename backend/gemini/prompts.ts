import { deriveRankingCriteria } from "./rubric";
import {
  GeminiBatchApplicant,
  GeminiBatchJob,
  GeminiBatchScreeningRequest,
  GeminiCandidateScreenRequest,
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

Evaluation rules:
A. Relevance-first. Score candidates on fit for this exact job, not general impressiveness.
B. Evidence-based. Every positive match must be supported by evidence from the
   applicant's skills, experience, projects, education, certifications, languages,
   availability, or location.
C. Conservative inference. Limited relevance may be inferred only when strongly
   supported by profile evidence; never overstate certainty.
D. Consistent comparison. Apply the same scoring logic to every applicant in a run.

Weighted scoring model (overall matchScore from 0 to 100):
- Skills Match: 35% (coreHardSkills, preferredSkills, skill-related must-haves)
- Experience Match: 30% (years of relevant experience, seniority fit, role/tech
  relevance, complexity, ownership)
- Education Match: 10% (required education level, field of study relevance;
  do not penalise heavily when educationLevel is "none")
- Overall Relevance: 25% (responsibilities fit, industry/domain, certifications,
  projects, soft skills evidence, location fit, availability fit, language fit)

Skill matching rules:
- Exact skill matches score highest.
- Closely related skills may receive partial credit if genuinely transferable.
- General technical knowledge must not replace a specific required skill.
- Certifications support but do not replace real experience unless the job
  explicitly allows it.

Experience rules:
- Use declared yearsOfExperience when reliable; otherwise estimate conservatively
  from dated entries. Current roles count until present. If dates are incomplete,
  mention this in gapsOrRisks and lower confidenceScore.

Recommendation values (use exactly one, with this suggested mapping):
- 85–100: "Strong Shortlist"
- 70–84: "Shortlist"
- 55–69: "Consider"
- 35–54: "Reject"
- 0–34: "Strong Reject"
Adjust downward when critical requirements are missing, profile data is
incomplete, evidence is weak, or major gaps or risks exist.

Shortlist rules:
- Rank all applicants by matchScore descending.
- Return the top N applicants where N = shortlistCount.
- If total applicants < shortlistCount, return all evaluated applicants.
- An applicant with a critical disqualifying gap may be excluded from the
  shortlist; continue to the next ranked candidate.

Tie-break order when matchScore is equal:
1. Higher skillsScore
2. Higher experienceScore
3. Higher relevanceScore
4. Higher confidenceScore

Output validation:
- Every applicant in the input must appear in screeningResults.
- matchScore, confidenceScore, skillsScore, experienceScore, educationScore,
  relevanceScore are integers between 0 and 100.
- candidateRank is sorted ascending and reflects ranking by matchScore then the
  tie-break order above.
- shortlist contains no more than shortlistCount entries and matches the
  top-ranked eligible candidates from screeningResults.
- Return valid JSON only. No markdown fences or commentary.
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

function formatBatchJob(job: GeminiBatchJob): string {
  const lines: string[] = [
    `Title: ${job.title}`,
    `Department: ${job.department || "Not specified"}`,
    `Hiring Manager: ${job.hiringManager || "Not specified"}`,
    `Location: ${job.location || "Not specified"}`,
    `Location Policy: ${job.locationPolicy || "Not specified"}`,
    `Employment Type: ${job.employmentType || "Not specified"}`,
    `Salary Band: ${job.salaryBand || "Not specified"}`,
    `Seniority Level: ${job.seniorityLevel || "Not specified"}`,
    `Experience Required (years): ${
      typeof job.experienceYears === "number" ? job.experienceYears : "Not specified"
    }`,
    `Education Level: ${job.educationLevel || "Not specified"}`,
    `Status: ${job.status || "Not specified"}`,
    "",
    `Summary:\n${job.summary || "Not provided"}`,
    "",
    `Responsibilities:\n${job.responsibilities || "Not provided"}`,
    "",
    `Must-have Qualifications:\n${job.mustHaveQualifications || "Not provided"}`,
    "",
    `Nice-to-have Qualifications:\n${job.niceToHaveQualifications || "Not provided"}`,
    "",
    formatList("Core Hard Skills", job.coreHardSkills),
    formatList("Preferred Skills", job.preferredSkills),
    formatList("Core Soft Skills", job.coreSoftSkills),
  ];

  if (job.weightCriteria && job.weightCriteria.length > 0) {
    lines.push(
      "",
      "Weight Criteria (informational; the weighted scoring model defined in the",
      "system instruction still applies):"
    );
    for (const criterion of job.weightCriteria) {
      lines.push(`- ${criterion.label} (${criterion.value}%)`);
    }
  }

  return lines.join("\n");
}

function formatApplicantSkills(skills?: GeminiBatchApplicant["skills"]): string {
  if (!skills || skills.length === 0) {
    return "  Skills: None provided";
  }

  return [
    "  Skills:",
    ...skills.map((skill) => {
      const level = skill.level ? ` — ${skill.level}` : "";
      const years =
        typeof skill.yearsOfExperience === "number" ? ` (${skill.yearsOfExperience}y)` : "";

      return `    - ${skill.name}${level}${years}`;
    }),
  ].join("\n");
}

function formatApplicantLanguages(languages?: GeminiBatchApplicant["languages"]): string {
  if (!languages || languages.length === 0) {
    return "  Languages: None provided";
  }

  return [
    "  Languages:",
    ...languages.map((language) => {
      const proficiency = language.proficiency ? ` — ${language.proficiency}` : "";

      return `    - ${language.name}${proficiency}`;
    }),
  ].join("\n");
}

function formatApplicantExperience(experience?: GeminiBatchApplicant["experience"]): string {
  if (!experience || experience.length === 0) {
    return "  Experience: None provided";
  }

  const entries = experience.map((entry) => {
    const header = [entry.role || "Role unknown", entry.company || "Company unknown"]
      .filter(Boolean)
      .join(" @ ");
    const range = [
      entry.startDate || "?",
      entry.isCurrent ? "present" : entry.endDate || "?",
    ].join(" → ");
    const tech =
      entry.technologies && entry.technologies.length > 0
        ? `      Technologies: ${entry.technologies.join(", ")}`
        : null;
    const description = entry.description ? `      Description: ${entry.description}` : null;

    return ["    - " + header + " (" + range + ")", tech, description]
      .filter(Boolean)
      .join("\n");
  });

  return ["  Experience:", ...entries].join("\n");
}

function formatApplicantEducation(education?: GeminiBatchApplicant["education"]): string {
  if (!education || education.length === 0) {
    return "  Education: None provided";
  }

  const entries = education.map((entry) => {
    const degree = [entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ");
    const years = [entry.startYear, entry.endYear].filter(Boolean).join(" → ") || "dates unknown";

    return `    - ${degree || "Degree unknown"} at ${entry.institution || "Institution unknown"} (${years})`;
  });

  return ["  Education:", ...entries].join("\n");
}

function formatApplicantCertifications(
  certifications?: GeminiBatchApplicant["certifications"]
): string {
  if (!certifications || certifications.length === 0) {
    return "  Certifications: None provided";
  }

  return [
    "  Certifications:",
    ...certifications.map((certification) => {
      const issuer = certification.issuer ? ` — ${certification.issuer}` : "";
      const date = certification.issueDate ? ` (${certification.issueDate})` : "";

      return `    - ${certification.name}${issuer}${date}`;
    }),
  ].join("\n");
}

function formatApplicantProjects(projects?: GeminiBatchApplicant["projects"]): string {
  if (!projects || projects.length === 0) {
    return "  Projects: None provided";
  }

  const entries = projects.map((project) => {
    const role = project.role ? ` [${project.role}]` : "";
    const range =
      project.startDate || project.endDate
        ? ` (${project.startDate || "?"} → ${project.endDate || "?"})`
        : "";
    const tech =
      project.technologies && project.technologies.length > 0
        ? `      Technologies: ${project.technologies.join(", ")}`
        : null;
    const description = project.description ? `      Description: ${project.description}` : null;

    return ["    - " + project.name + role + range, tech, description]
      .filter(Boolean)
      .join("\n");
  });

  return ["  Projects:", ...entries].join("\n");
}

function formatApplicantAvailability(
  availability?: GeminiBatchApplicant["availability"]
): string {
  if (!availability) {
    return "  Availability: Not provided";
  }

  const parts = [
    availability.status && `status=${availability.status}`,
    availability.type && `type=${availability.type}`,
    availability.startDate && `startDate=${availability.startDate}`,
  ].filter(Boolean);

  return `  Availability: ${parts.length > 0 ? parts.join(", ") : "Not provided"}`;
}

function formatBatchApplicant(applicant: GeminiBatchApplicant, index: number): string {
  const fullName = [applicant.firstName, applicant.lastName].filter(Boolean).join(" ") || "Unknown";

  return [
    `Applicant #${index + 1}`,
    `  Email: ${applicant.email}`,
    `  Name: ${fullName}`,
    `  Headline: ${applicant.headline || "Not provided"}`,
    `  Location: ${applicant.location || "Not provided"}`,
    applicant.bio ? `  Bio: ${applicant.bio}` : "  Bio: Not provided",
    formatApplicantSkills(applicant.skills),
    formatApplicantLanguages(applicant.languages),
    formatApplicantExperience(applicant.experience),
    formatApplicantEducation(applicant.education),
    formatApplicantCertifications(applicant.certifications),
    formatApplicantProjects(applicant.projects),
    formatApplicantAvailability(applicant.availability),
  ].join("\n");
}

export function buildBatchScreeningPrompt(request: GeminiBatchScreeningRequest): string {
  const { job, applicants, shortlistCount, instructions } = request;
  const applicantBlocks = applicants
    .map((applicant, index) => formatBatchApplicant(applicant, index))
    .join("\n\n");

  return `
Screen all applicants against the job below, apply the weighted scoring model
and rules from the system instruction, and return strict JSON matching this
exact shape (no markdown, no commentary):

{
  "jobTitle": "string",
  "department": "string",
  "shortlistCount": 0,
  "totalApplicants": 0,
  "screeningResults": [
    {
      "candidateRank": 1,
      "applicantEmail": "string",
      "fullName": "string",
      "matchScore": 0,
      "confidenceScore": 0,
      "skillsScore": 0,
      "experienceScore": 0,
      "educationScore": 0,
      "relevanceScore": 0,
      "strengths": ["string"],
      "gapsOrRisks": ["string"],
      "finalRecommendation": "Strong Reject | Reject | Consider | Shortlist | Strong Shortlist",
      "summaryExplanation": "string"
    }
  ],
  "shortlist": [
    {
      "candidateRank": 1,
      "applicantEmail": "string",
      "fullName": "string",
      "matchScore": 0,
      "strengths": ["string"],
      "gapsOrRisks": ["string"],
      "finalRecommendation": "Strong Reject | Reject | Consider | Shortlist | Strong Shortlist",
      "summaryExplanation": "string"
    }
  ]
}

Requested shortlistCount: ${shortlistCount}
Total applicants provided: ${applicants.length}

=== JOB ===
${formatBatchJob(job)}

=== APPLICANTS ===
${applicantBlocks}

=== INSTRUCTIONS ===
- Evaluate every applicant listed above. screeningResults.length must equal
  totalApplicants (${applicants.length}).
- Rank all applicants by matchScore descending; apply the tie-break order
  (skillsScore, experienceScore, relevanceScore, confidenceScore).
- shortlist must contain the top ${Math.min(
    shortlistCount,
    applicants.length
  )} eligible candidates in the same rank order. If an applicant has a critical
  disqualifying gap, you may exclude them and continue to the next ranked
  candidate.
- Keep strengths, gapsOrRisks, and summaryExplanation concise, recruiter-friendly,
  and evidence-based. Cite evidence drawn from the applicant's skills,
  experience, projects, education, certifications, languages, availability, or
  location.
- Never invent qualifications. If a field is missing, call it out in gapsOrRisks
  and lower confidenceScore.
${instructions ? `- Additional recruiter instructions: ${instructions}` : ""}
`.trim();
}
