export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringified = typeof value === "string" ? value : String(value);
  const needsQuoting = /[",\r\n]/.test(stringified);
  const escaped = stringified.replace(/"/g, '""');

  return needsQuoting ? `"${escaped}"` : escaped;
}

export function rowsToCsv(rows: readonly (readonly unknown[])[]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function sanitizeFilename(base: string, fallback = "export"): string {
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^\w\-.]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "")
    .slice(0, 120);

  return cleaned || fallback;
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("downloadBlob can only be called from the browser.");
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Give the browser a tick to begin streaming the download before
  // revoking the object URL. Some browsers (notably Safari) can race
  // when the URL is revoked synchronously.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadText(content: string, mime: string, filename: string): void {
  downloadBlob(new Blob([content], { type: `${mime};charset=utf-8;` }), filename);
}

export function downloadJson(data: unknown, filename: string): void {
  downloadText(JSON.stringify(data, null, 2), "application/json", filename);
}

export function downloadCsv(rows: readonly (readonly unknown[])[], filename: string): void {
  // Prefix BOM so Excel opens UTF-8 correctly.
  const content = `﻿${rowsToCsv(rows)}`;
  downloadText(content, "text/csv", filename);
}
