"use client";

import type {
  GeminiBatchApplicant,
  GeminiBatchJob,
  GeminiBatchScreeningResponse,
} from "@/lib/screening";
import { screenBatchApplicants } from "@/lib/screening";
import { buildCreatePayload, createShortlist } from "@/lib/shortlists";

export type ScreeningRunStatus = "running" | "completed" | "failed";

export interface ScreeningRunRequest {
  jobId: string;
  runName: string;
  jobTitle: string;
  department?: string;
  location?: string;
  model?: string;
  shortlistSize: number;
  totalApplicants: number;
  estimatedMinSeconds: number;
  estimatedMaxSeconds: number;
  instructions: string;
  temperature?: number;
  job: GeminiBatchJob;
  applicants: GeminiBatchApplicant[];
}

export interface ScreeningRunSnapshot {
  status: ScreeningRunStatus;
  request: ScreeningRunRequest;
  startedAt: number;
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
    const response = await screenBatchApplicants({
      job: snapshot.request.job,
      applicants: snapshot.request.applicants,
      shortlistCount: snapshot.request.shortlistSize,
      instructions: snapshot.request.instructions,
      temperature: snapshot.request.temperature,
    });

    let savedShortlistId: string | undefined;
    let persistWarning: string | undefined;

    try {
      const saved = await createShortlist(
        buildCreatePayload(
          snapshot.request.jobId,
          snapshot.request.runName,
          response,
          snapshot.request.instructions
        )
      );
      savedShortlistId = saved.data._id;
    } catch (persistError) {
      persistWarning =
        persistError instanceof Error
          ? persistError.message
          : "Screening succeeded, but saving the shortlist failed.";
    }

    setCurrentRun({
      ...snapshot,
      status: "completed",
      completedAt: Date.now(),
      response,
      savedShortlistId,
      persistWarning,
      error: undefined,
    });
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
