"use client";

import type {
  GeminiBatchScreeningResponse,
  GeminiBatchScreeningRunStatusResponse,
} from "@/lib/screening";
import { getScreenBatchRun, startScreenBatchRun } from "@/lib/screening";

export type ScreeningRunStatus = "running" | "completed" | "failed";

export interface ScreeningRunRequest {
  jobId: string;
  runName: string;
  jobTitle: string;
  location?: string;
  model?: string;
  shortlistSize: number;
  totalApplicants: number;
  estimatedMinSeconds: number;
  estimatedMaxSeconds: number;
  instructions: string;
  temperature?: number;
  applicantIds?: string[];
  applicantEmails?: string[];
  filters?: {
    ingestStatus?: "parsed" | "pending" | "failed";
  };
}

export interface ScreeningRunSnapshot {
  status: ScreeningRunStatus;
  request: ScreeningRunRequest;
  startedAt: number;
  runId?: string;
  backendRun?: GeminiBatchScreeningRunStatusResponse;
  completedAt?: number;
  response?: GeminiBatchScreeningResponse;
  savedShortlistId?: string;
  persistWarning?: string;
  error?: string;
}

let currentRun: ScreeningRunSnapshot | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function setCurrentRun(snapshot: ScreeningRunSnapshot | null) {
  currentRun = snapshot;
  notifyListeners();
}

async function executeRun(snapshot: ScreeningRunSnapshot) {
  try {
    const started = await startScreenBatchRun({
      jobId: snapshot.request.jobId,
      runName: snapshot.request.runName,
      shortlistCount: snapshot.request.shortlistSize,
      instructions: snapshot.request.instructions,
      temperature: snapshot.request.temperature,
      applicantIds: snapshot.request.applicantIds,
      applicantEmails: snapshot.request.applicantEmails,
      filters: snapshot.request.filters,
    });

    setCurrentRun({
      ...snapshot,
      runId: started.data.id,
      backendRun: started.data,
    });

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const polled = await getScreenBatchRun(started.data.id);
      const backendRun = polled.data;
      const completedAt = backendRun.screeningCompletedAt
        ? new Date(backendRun.screeningCompletedAt).getTime()
        : undefined;

      const nextSnapshot: ScreeningRunSnapshot = {
        ...snapshot,
        runId: backendRun.id,
        backendRun,
        completedAt,
        response: backendRun.response,
        savedShortlistId: backendRun.savedShortlistId,
      };

      if (backendRun.status === "failed") {
        setCurrentRun({
          ...nextSnapshot,
          status: "failed",
          error: backendRun.error || "Failed to complete the screening run.",
        });
        return;
      }

      if (backendRun.status === "completed" || backendRun.status === "partial") {
        setCurrentRun({
          ...nextSnapshot,
          status: "completed",
          persistWarning:
            backendRun.status === "partial"
              ? "Screening completed with partial failures. Review the batch warnings below."
              : undefined,
          error: undefined,
        });
        return;
      }

      setCurrentRun({
        ...nextSnapshot,
        status: "running",
      });
    }
  } catch (error) {
    setCurrentRun({
      ...snapshot,
      status: "failed",
      completedAt: Date.now(),
      error: error instanceof Error ? error.message : "Failed to complete the screening run.",
    });
  }
}

export function startScreeningRun(request: ScreeningRunRequest) {
  const snapshot: ScreeningRunSnapshot = {
    status: "running",
    request,
    startedAt: Date.now(),
  };

  setCurrentRun(snapshot);
  void executeRun(snapshot);

  return snapshot;
}

export function getScreeningRunSnapshot() {
  return currentRun;
}

export function subscribeToScreeningRun(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function clearScreeningRun() {
  setCurrentRun(null);
}
