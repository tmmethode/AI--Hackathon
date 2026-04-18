import { getGeminiConfig } from "./config";
import { GeminiClient } from "./client";
import { GeminiScreeningService } from "./screening";
import {
  GeminiFrontendConfigResponse,
  GeminiFrontendScreeningResult,
  GeminiFrontendScreeningRunRequest,
  GeminiFrontendScreeningRunResponse,
} from "./types";

export class GeminiFrontendService {
  constructor(
    private readonly client = new GeminiClient(),
    private readonly screeningService = new GeminiScreeningService(client)
  ) {}

  public getFrontendConfig(): GeminiFrontendConfigResponse {
    const config = getGeminiConfig();

    return {
      configured: this.client.isConfigured(),
      model: this.client.getModel(),
      defaults: {
        shortlistSize: config.frontend.defaultShortlistSize,
        minShortlistSize: config.frontend.minShortlistSize,
        maxShortlistSize: config.frontend.maxShortlistSize,
        temperature: config.defaultTemperature,
        maxOutputTokens: config.maxOutputTokens,
      },
      contracts: {
        jobFields: [
          "title",
          "summary",
          "responsibilities",
          "mustHaveQualifications",
          "niceToHaveQualifications",
          "coreHardSkills",
          "preferredBonusSkills",
          "coreSoftSkills",
          "experience",
          "seniorityLevel",
          "educationLevel",
          "rankingCriteria",
        ],
        candidateFields: [
          "fullName",
          "summary",
          "resumeText",
          "importedData.source",
          "importedData.extractedSkills",
          "importedData.experience",
          "importedData.educationLevel",
          "importedData.tags",
          "importedData.certifications",
          "importedData.notes",
        ],
      },
      endpoints: {
        health: "/gemini/health",
        generate: "/gemini/generate",
        screenCandidate: "/gemini/screen-candidate",
        screenRun: "/gemini/screen-run",
        screenBatch: "/gemini/screen-batch",
        frontendConfig: "/gemini/frontend-config",
      },
    };
  }

  public async screenRun(request: GeminiFrontendScreeningRunRequest): Promise<GeminiFrontendScreeningRunResponse> {
    if (!request.candidates || request.candidates.length === 0) {
      throw new Error("At least one candidate is required to run Gemini screening");
    }

    const config = getGeminiConfig();
    const normalizedShortlistSize = Math.max(
      1,
      Math.min(
        request.shortlistSize ?? config.frontend.defaultShortlistSize,
        config.frontend.maxShortlistSize,
        request.candidates.length
      )
    );

    const results: GeminiFrontendScreeningResult[] = [];

    for (const candidate of request.candidates) {
      const screening = await this.screeningService.screenCandidate({
        job: request.job,
        candidate,
        instructions: request.instructions,
        temperature: request.temperature,
      });

      results.push({
        ...screening,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        shortlisted: false,
        rank: 0,
      });
    }

    results.sort((left, right) => right.score - left.score);
    results.sort((left, right) => right.score - left.score || right.mustHaveMatchScore - left.mustHaveMatchScore);

    results.forEach((result, index) => {
      result.rank = index + 1;
      result.shortlisted = index < normalizedShortlistSize;
    });

    const shortlisted = results.filter((result) => result.shortlisted);
    const strongMatches = results.filter((result) => result.recommendation === "strong_yes" || result.recommendation === "yes").length;

    return {
      runName: request.runName,
      jobTitle: request.job.title,
      totalCandidates: results.length,
      shortlistSize: normalizedShortlistSize,
      shortlistedCount: shortlisted.length,
      model: results[0]?.model || this.client.getModel(),
      rankingCriteria: request.job.rankingCriteria,
      summary: `Processed ${results.length} candidates for ${request.job.title}. ${strongMatches} candidates received a yes or strong_yes recommendation.`,
      results,
    };
  }
}
