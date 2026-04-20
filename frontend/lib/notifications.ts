import { getApiBaseUrl, getStoredAuth } from "@/lib/auth";

export type NotificationType = "screening" | "job" | "export" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  detail: string;
  read: boolean;
  createdAt: string;
}

interface NotificationListResponse {
  data: Notification[];
  total: number;
  message: string;
}

interface NotificationResponse {
  data: Notification;
  message: string;
}

function getAuthHeader() {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return { Authorization: `Bearer ${session.token}` };
}

async function parseJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

async function handleApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = await parseJson<{ message?: string; error?: string } & T>(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || fallbackMessage);
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload as T;
}

export async function listNotifications(limit = 100) {
  const response = await fetch(`${getApiBaseUrl()}/notifications?limit=${limit}`, {
    headers: {
      ...getAuthHeader(),
    },
    cache: "no-store",
  });

  return handleApiResponse<NotificationListResponse>(response, "Failed to load notifications.");
}

export async function getNotification(id: string) {
  const response = await fetch(`${getApiBaseUrl()}/notifications/${id}`, {
    headers: {
      ...getAuthHeader(),
    },
    cache: "no-store",
  });

  return handleApiResponse<NotificationResponse>(response, "Failed to load notification details.");
}

export function toRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const diffMs = date.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, unitMs] of units) {
    const valueForUnit = Math.round(diffMs / unitMs);

    if (Math.abs(valueForUnit) >= 1) {
      return formatter.format(valueForUnit, unit);
    }
  }

  return "just now";
}

export function toDateTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
