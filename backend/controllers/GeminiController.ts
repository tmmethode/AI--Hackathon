import { Body, Get, Path, Post, Request, Route, Security, Tags } from "tsoa";
import { GeminiRecruiterAssistantService } from "../gemini/assistant";
import {
  geminiAsyncScreeningRunService,
  type GeminiBatchScreeningRunRequest,
  type GeminiBatchScreeningRunStatusResponse,
} from "../gemini/async-screening-runner";
import { GeminiClient } from "../gemini/client";
import { GeminiFrontendService } from "../gemini/frontend";
import { GeminiBatchScreeningRunnerService } from "../gemini/batch-screening-runner";
import {
  GeminiJobImportService,
  JobImportResponse,
  ParseJobFileRequest,
  ParseJobLinkRequest,
} from "../gemini/job-import";
import { GeminiScreeningService } from "../gemini/screening";
import { HttpError } from "../utils/HttpError";
import {
  GeminiBatchScreeningDbRequest,
  GeminiBatchScreeningResponse,
  GeminiCandidateScreenRequest,
  GeminiCandidateScreenResponse,
  GeminiFrontendConfigResponse,
  GeminiFrontendScreeningRunRequest,
  GeminiFrontendScreeningRunResponse,
  GeminiGenerateRequest,
  GeminiGenerateResponse,
  GeminiRecruiterAssistantRequest,
  GeminiRecruiterAssistantResponse,
} from "../gemini/types";

@Tags("Gemini")
@Route("gemini")
export class GeminiController {
  private readonly client = new GeminiClient();
  private readonly screeningService = new GeminiScreeningService(this.client);
  private readonly frontendService = new GeminiFrontendService(this.client, this.screeningService);
  private readonly batchScreeningRunner = new GeminiBatchScreeningRunnerService(this.screeningService);
  private readonly assistantService = new GeminiRecruiterAssistantService(this.client);
  private readonly jobImportService = new GeminiJobImportService(this.client);

  private toHttpError(error: unknown): HttpError {
    if (error instanceof HttpError) {
      return error;
    }

    const message = error instanceof Error ? error.message : "Gemini request failed";
    const normalized = message.toLowerCase();

    if (normalized.includes("not configured")) {
      return new HttpError(503, message);
    }

    if (
      normalized.includes("required") ||
      normalized.includes("invalid") ||
      normalized.includes("empty") ||
      normalized.includes("non-json")
    ) {
      return new HttpError(400, message);
    }

    return new HttpError(502, message);
  }

  @Get("health")
  public async health(): Promise<{ configured: boolean; model: string }> {
    return {
      configured: this.client.isConfigured(),
      model: this.client.getModel(),
    };
  }

  @Get("frontend-config")
  @Security('jwt', ['recruiter', 'admin'])
  public async frontendConfig(): Promise<GeminiFrontendConfigResponse> {
    return this.frontendService.getFrontendConfig();
  }

  @Post("generate")
  @Security('jwt', ['recruiter', 'admin'])
  public async generate(@Body() requestBody: GeminiGenerateRequest): Promise<GeminiGenerateResponse> {
    try {
      return await this.client.generateText(requestBody);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("screen-candidate")
  @Security('jwt', ['recruiter', 'admin'])
  public async screenCandidate(
    @Body() requestBody: GeminiCandidateScreenRequest
  ): Promise<GeminiCandidateScreenResponse> {
    try {
      return await this.screeningService.screenCandidate(requestBody);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("screen-run")
  @Security('jwt', ['recruiter', 'admin'])
  public async screenRun(
    @Body() requestBody: GeminiFrontendScreeningRunRequest
  ): Promise<GeminiFrontendScreeningRunResponse> {
    try {
      return await this.frontendService.screenRun(requestBody);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("screen-batch")
  @Security('jwt', ['recruiter', 'admin'])
  public async screenBatch(
    @Body() requestBody: GeminiBatchScreeningDbRequest
  ): Promise<GeminiBatchScreeningResponse> {
    try {
      return await this.batchScreeningRunner.screenBatchFromDatabase(requestBody);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("screen-batch-runs")
  @Security('jwt', ['recruiter', 'admin'])
  public async startScreenBatchRun(
    @Request() req: any,
    @Body() requestBody: GeminiBatchScreeningRunRequest
  ): Promise<{ data: GeminiBatchScreeningRunStatusResponse; message: string }> {
    try {
      const actingUserId = req?.user?._id?.toString?.();

      if (!actingUserId) {
        throw new HttpError(401, "User not authenticated");
      }

      const data = await geminiAsyncScreeningRunService.createRun(requestBody, actingUserId);
      return {
        data,
        message: "Screening run started.",
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Get("screen-batch-runs/{runId}")
  @Security('jwt', ['recruiter', 'admin'])
  public async getScreenBatchRun(
    @Request() req: any,
    @Path() runId: string
  ): Promise<{ data: GeminiBatchScreeningRunStatusResponse; message: string }> {
    try {
      const actingUserId = req?.user?._id?.toString?.();

      if (!actingUserId) {
        throw new HttpError(401, "User not authenticated");
      }

      const data = await geminiAsyncScreeningRunService.getRunStatus(runId, actingUserId);
      return {
        data,
        message: "Screening run loaded.",
      };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("assistant")
  @Security('jwt', ['recruiter', 'admin'])
  public async assistant(
    @Body() requestBody: GeminiRecruiterAssistantRequest
  ): Promise<GeminiRecruiterAssistantResponse> {
    try {
      return await this.assistantService.ask(requestBody);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("parse-job-link")
  @Security('jwt', ['recruiter', 'admin'])
  public async parseJobLink(@Body() requestBody: ParseJobLinkRequest): Promise<JobImportResponse> {
    try {
      return await this.jobImportService.parseFromLink(requestBody);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("parse-job-file")
  @Security('jwt', ['recruiter', 'admin'])
  public async parseJobFile(@Body() requestBody: ParseJobFileRequest): Promise<JobImportResponse> {
    try {
      return await this.jobImportService.parseFromFile(requestBody);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }
}
