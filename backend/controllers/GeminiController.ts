import { Body, Get, Post, Route, Tags } from "tsoa";
import { GeminiClient } from "../gemini/client";
import { GeminiFrontendService } from "../gemini/frontend";
import { GeminiScreeningService } from "../gemini/screening";
import { HttpError } from "../utils/HttpError";
import {
  GeminiBatchScreeningRequest,
  GeminiBatchScreeningResponse,
  GeminiCandidateScreenRequest,
  GeminiCandidateScreenResponse,
  GeminiFrontendConfigResponse,
  GeminiFrontendScreeningRunRequest,
  GeminiFrontendScreeningRunResponse,
  GeminiGenerateRequest,
  GeminiGenerateResponse,
} from "../gemini/types";

@Tags("Gemini")
@Route("gemini")
export class GeminiController {
  private readonly client = new GeminiClient();
  private readonly screeningService = new GeminiScreeningService(this.client);
  private readonly frontendService = new GeminiFrontendService(this.client, this.screeningService);

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
  public async frontendConfig(): Promise<GeminiFrontendConfigResponse> {
    return this.frontendService.getFrontendConfig();
  }

  @Post("generate")
  public async generate(@Body() requestBody: GeminiGenerateRequest): Promise<GeminiGenerateResponse> {
    try {
      return await this.client.generateText(requestBody);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("screen-candidate")
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
  public async screenBatch(
    @Body() requestBody: GeminiBatchScreeningRequest
  ): Promise<GeminiBatchScreeningResponse> {
    try {
      return await this.screeningService.screenBatch(requestBody);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }
}
