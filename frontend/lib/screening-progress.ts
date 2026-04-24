"use client";

import type { GeminiBatchScreeningResponse } from "@/lib/screening";
import { screenBatchApplicants } from "@/lib/screening";
import { buildCreatePayload, createShortlist } from "@/lib/shortlists";

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
      jobId: snapshot.request.jobId,
      shortlistCount: snapshot.request.shortlistSize,
      instructions: snapshot.request.instructions,
      temperature: snapshot.request.temperature,
      applicantIds: snapshot.request.applicantIds,
      applicantEmails: snapshot.request.applicantEmails,
      filters: snapshot.request.filters,
    });

    let savedShortlistId: string | undefined;
    let persistWarning: string | undefined;
    const completedAt = Date.now();

    try {
      const saved = await createShortlist(
        buildCreatePayload(
          snapshot.request.jobId,
          snapshot.request.runName,
          response,
          snapshot.request.instructions,
          {
            startedAt: snapshot.startedAt,
            completedAt,
          }
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
      completedAt,
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
