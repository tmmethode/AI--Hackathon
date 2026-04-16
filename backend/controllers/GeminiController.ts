import { Body, Get, Post, Route, Tags } from "tsoa";
import { GeminiClient } from "../gemini/client";
import { GeminiFrontendService } from "../gemini/frontend";
import { GeminiScreeningService } from "../gemini/screening";
import {
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
    return this.client.generateText(requestBody);
  }

  @Post("screen-candidate")
  public async screenCandidate(
    @Body() requestBody: GeminiCandidateScreenRequest
  ): Promise<GeminiCandidateScreenResponse> {
    return this.screeningService.screenCandidate(requestBody);
  }

  @Post("screen-run")
  public async screenRun(
    @Body() requestBody: GeminiFrontendScreeningRunRequest
  ): Promise<GeminiFrontendScreeningRunResponse> {
    return this.frontendService.screenRun(requestBody);
  }
}
