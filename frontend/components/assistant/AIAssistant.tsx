"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Expand,
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  RefreshCw,
  Send,
  Shrink,
  Sparkles,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";
import {
  AssistantAskResponse,
  AssistantContextSummary,
  AssistantHealthResponse,
  AssistantMessage,
  askAssistant,
  getAssistantHealth,
} from "@/lib/assistant";
import { getStoredAuth } from "@/lib/auth";
import { listJobSelectors, type JobSelectorItem } from "@/lib/jobs";
import { listShortlistSelectors, type ShortlistSelectorItem } from "@/lib/shortlists";

type PanelState = "closed" | "open" | "minimized";
type DeliveryState = "sent" | "loading" | "error";

interface ChatMessage extends AssistantMessage {
  id: string;
  createdAt: number;
  deliveryState: DeliveryState;
  contextUsed?: AssistantContextSummary;
}

interface ScopeState {
  jobId: string;
  shortlistId: string;
  includeApplicants: boolean;
}

const DEFAULT_SCOPE: ScopeState = {
  jobId: "",
  shortlistId: "",
  includeApplicants: true,
};

interface AssistantScopeData {
  jobs: JobSelectorItem[];
  shortlists: ShortlistSelectorItem[];
}

const SCOPE_CACHE_TTL_MS = 60_000;

let cachedScopeData: AssistantScopeData | null = null;
let cachedScopeLoadedAt = 0;
let cachedScopePromise: Promise<AssistantScopeData> | null = null;

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function shouldAutoFocusAssistantInput() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return (
    window.innerWidth >= 640 &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

function hasFreshScopeCache() {
  return Boolean(cachedScopeData) && Date.now() - cachedScopeLoadedAt < SCOPE_CACHE_TTL_MS;
}

type IdleCallbackHandle = number;
type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: (deadline: IdleDeadline) => void, options?: { timeout: number }) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

async function fetchAssistantScopeData(forceRefresh = false): Promise<AssistantScopeData> {
  if (!forceRefresh && hasFreshScopeCache() && cachedScopeData) {
    return cachedScopeData;
  }

  if (!cachedScopePromise) {
    cachedScopePromise = Promise.all([
      listJobSelectors({ limit: 200 }).then((response) => response.data).catch(() => [] as JobSelectorItem[]),
      listShortlistSelectors({ limit: 200 }).then((response) => response.data).catch(() => [] as ShortlistSelectorItem[]),
    ]).then(([jobs, shortlists]) => {
      cachedScopeData = { jobs, shortlists };
      cachedScopeLoadedAt = Date.now();
      cachedScopePromise = null;
      return cachedScopeData;
    }).catch((error) => {
      cachedScopePromise = null;
      throw error;
    });
  }

  return cachedScopePromise;
}

function buildPrompts(selectedJob?: JobSelectorItem, selectedShortlist?: ShortlistSelectorItem) {
  if (selectedShortlist) {
    return [
      `Summarise this shortlist for ${selectedShortlist.jobTitle}.`,
      "Why was the top candidate ranked #1?",
      `What interview focus areas should I use for the top 3 candidates?`,
      `Which shortlisted profiles have the biggest risks and why?`,
    ];
  }

  if (selectedJob) {
    return [
      `Summarise the hiring pipeline for ${selectedJob.title}.`,
      `Which applicants best match the must-have requirements?`,
      `What skills gaps should we watch for in this pipeline?`,
      `Give me a short recruiter briefing for the next interview round.`,
    ];
  }

  return [
    "What should I do next in this hiring workflow?",
    "Summarise our latest shortlist results.",
    "What are the strongest and weakest candidate patterns?",
    "Draft interview guidance for top candidates.",
  ];
}

function contextLabel(summary?: AssistantContextSummary) {
  if (!summary) return "No context metadata";

  const parts: string[] = [];
  if (summary.jobTitle) parts.push(summary.jobTitle);
  if (summary.shortlistCount > 0) parts.push(`${summary.shortlistCount} shortlisted`);
  if (summary.applicantCount > 0) parts.push(`${summary.applicantCount} applicants`);
  if (summary.screeningResultCount > 0) parts.push(`${summary.screeningResultCount} scored`);
  if (summary.truncatedApplicants) parts.push("trimmed");
  if (summary.truncatedHistory) parts.push("history trimmed");

  if (parts.length > 0) return parts.join(" • ");
  return summary.source === "database" ? "Workspace overview" : "Live context";
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
      <span className="line-clamp-2">{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-danger/30 px-2 py-1 text-[11px] font-medium hover:bg-danger/10"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      ) : null}
    </div>
  );
}

function normalizeAssistantContent(content: string) {
  let normalized = content.trim();

  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    try {
      const parsed = JSON.parse(normalized);
      if (typeof parsed === "string") {
        normalized = parsed;
      }
    } catch {
      // Keep the original string when it is not valid JSON text.
    }
  }

  const fencedMatch = normalized.match(/^```(?:markdown|md|text)?\n([\s\S]*?)\n```$/i);
  if (fencedMatch) {
    normalized = fencedMatch[1] || "";
  }

  return normalized
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .replace(/\\"/g, '"')
    .replace(/\\([*_`#[\]()!>~-])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function AssistantMarkdownMessage({ content }: { content: string }) {
  const normalizedContent = normalizeAssistantContent(content);

  return (
    <div className="break-words text-[13px] leading-5 sm:text-sm sm:leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ children }) => <p className="mb-1.5 whitespace-pre-wrap sm:mb-2">{children}</p>,
          ul: ({ children }) => <ul className="mb-1.5 list-disc space-y-1 pl-5 sm:mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="mb-1.5 list-decimal space-y-1 pl-5 sm:mb-2">{children}</ol>,
          li: ({ children }) => <li className="whitespace-pre-wrap">{children}</li>,
          h1: ({ children }) => <h1 className="mb-1.5 text-base font-semibold sm:mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-1.5 text-sm font-semibold sm:mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold sm:mb-1.5">{children}</h3>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="mb-1.5 border-l-2 border-line pl-3 text-ink-muted sm:mb-2">{children}</blockquote>
          ),
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto rounded-lg border border-line bg-surface px-3 py-2 text-xs sm:text-sm">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const isCodeBlock = Boolean(className);
            if (isCodeBlock) {
              return (
                <code className={cn("font-mono", className)}>
                  {children}
                </code>
              );
            }
            return <code className="rounded bg-surface px-1 py-0.5 font-mono text-[0.92em]">{children}</code>;
          },
          table: ({ children }) => (
            <div className="mb-2 max-w-full overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[440px] border-collapse text-left text-xs sm:text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-soft">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-line px-3 py-2 font-semibold text-ink">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-line/70 px-3 py-2 align-top">{children}</td>,
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}

export function AIAssistant() {
  const [isVisible, setIsVisible] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [health, setHealth] = useState<AssistantHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobSelectorItem[]>([]);
  const [shortlists, setShortlists] = useState<ShortlistSelectorItem[]>([]);
  const [scope, setScope] = useState<ScopeState>(DEFAULT_SCOPE);
  const [scopeLoading, setScopeLoading] = useState(false);
  const scopeLoadInFlightRef = useRef(false);
  const healthLoadInFlightRef = useRef(false);
  const chatSessionRef = useRef(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const panelOpen = panelState === "open";

  useEffect(() => {
    const auth = getStoredAuth();
    const role = auth?.user?.role;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsVisible(Boolean(auth?.token) && (role === "admin" || role === "recruiter"));
  }, []);

  const loadScope = useCallback(async (forceRefresh = false) => {
    if (scopeLoadInFlightRef.current) return;

    scopeLoadInFlightRef.current = true;
    const canUseCache = !forceRefresh && hasFreshScopeCache() && cachedScopeData;

    if (canUseCache && cachedScopeData) {
      setJobs(cachedScopeData.jobs);
      setShortlists(cachedScopeData.shortlists);
    } else {
      setScopeLoading(true);
    }

    try {
      const { jobs: jobRows, shortlists: shortlistRows } = await fetchAssistantScopeData(forceRefresh);
      setJobs(jobRows);
      setShortlists(shortlistRows);

      setScope((prev) => {
        if (prev.jobId || prev.shortlistId) return prev;

        const latestShortlist = shortlistRows[0];
        if (latestShortlist) {
          return {
            ...prev,
            jobId: latestShortlist.job,
            shortlistId: latestShortlist._id,
          };
        }

        return {
          ...prev,
          jobId: jobRows[0]?._id || "",
        };
      });
    } finally {
      scopeLoadInFlightRef.current = false;
      setScopeLoading(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    if (healthLoadInFlightRef.current) return;
    healthLoadInFlightRef.current = true;
    setHealthLoading(true);
    setHealthError(null);

    try {
      const value = await getAssistantHealth();
      setHealth(value);
    } catch (error) {
      setHealth(null);
      setHealthError(error instanceof Error ? error.message : "Unable to reach assistant health endpoint.");
    } finally {
      healthLoadInFlightRef.current = false;
      setHealthLoading(false);
    }
  }, []);

  const warmScopeData = useCallback(() => {
    if (hasFreshScopeCache() || scopeLoadInFlightRef.current) return;
    void loadScope();
  }, [loadScope]);

  useEffect(() => {
    if (!isVisible || hasFreshScopeCache()) return;

    const nextWindow = window as WindowWithIdleCallback;

    if (typeof nextWindow.requestIdleCallback === "function") {
      const idleHandle = nextWindow.requestIdleCallback(() => {
        warmScopeData();
      }, { timeout: 2500 });

      return () => {
        if (typeof nextWindow.cancelIdleCallback === "function") {
          nextWindow.cancelIdleCallback(idleHandle);
        }
      };
    }

    const timer = window.setTimeout(() => {
      warmScopeData();
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isVisible, warmScopeData]);

  useEffect(() => {
    if (!panelOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadScope(true);
  }, [loadScope, panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    if (!health) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadHealth();
    }
  }, [health, loadHealth, panelOpen]);

  useEffect(() => {
    if (!panelOpen || !shouldAutoFocusAssistantInput()) return;

    const timer = window.setTimeout(() => textareaRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, panelOpen, isSending]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanelState("minimized");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

  const filteredShortlists = useMemo(() => {
    if (!scope.jobId) return shortlists;
    return shortlists.filter((item) => item.job === scope.jobId);
  }, [scope.jobId, shortlists]);

  useEffect(() => {
    if (!scope.shortlistId) return;
    if (filteredShortlists.some((entry) => entry._id === scope.shortlistId)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScope((prev) => ({ ...prev, shortlistId: "" }));
  }, [filteredShortlists, scope.shortlistId]);

  const selectedShortlist = useMemo(
    () => shortlists.find((entry) => entry._id === scope.shortlistId),
    [scope.shortlistId, shortlists]
  );

  const selectedJob = useMemo(() => {
    const fromShortlist = shortlists.find((item) => item._id === scope.shortlistId)?.job;
    const effectiveJobId = fromShortlist || scope.jobId;
    return jobs.find((job) => job._id === effectiveJobId);
  }, [jobs, scope.jobId, scope.shortlistId, shortlists]);

  const prompts = useMemo(
    () => buildPrompts(selectedJob, selectedShortlist),
    [selectedJob, selectedShortlist]
  );

  const assistantUnavailable = health?.configured === false;

  const startNewChatSession = useCallback(() => {
    chatSessionRef.current += 1;
    setMessages([]);
    setDraft("");
    setIsSending(false);
    setLastFailedPrompt(null);
    setRequestError(null);
  }, []);

  const handleJobScopeChange = useCallback(
    (jobId: string) => {
      startNewChatSession();
      setScope((prev) => ({
        ...prev,
        jobId,
        shortlistId: "",
      }));
    },
    [startNewChatSession]
  );

  const handleShortlistScopeChange = useCallback(
    (shortlistId: string) => {
      startNewChatSession();
      const selectedRun = shortlists.find((entry) => entry._id === shortlistId);

      setScope((prev) => ({
        ...prev,
        jobId: selectedRun?.job ?? prev.jobId,
        shortlistId,
      }));
    },
    [shortlists, startNewChatSession]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const messageText = text.trim();
      if (!messageText || isSending || assistantUnavailable) return;
      const requestSession = chatSessionRef.current;

      setRequestError(null);
      setLastFailedPrompt(null);
      const history: AssistantMessage[] = messages
        .filter((entry) => entry.deliveryState !== "loading")
        .map((entry) => ({ role: entry.role, content: entry.content }));

      const userMessage: ChatMessage = {
        id: newId(),
        role: "user",
        content: messageText,
        createdAt: Date.now(),
        deliveryState: "sent",
      };

      const loadingAssistantMessage: ChatMessage = {
        id: newId(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        deliveryState: "loading",
      };

      setMessages((prev) => [...prev, userMessage, loadingAssistantMessage]);
      setDraft("");
      setIsSending(true);

      try {
        const response: AssistantAskResponse = await askAssistant({
          message: messageText,
          history,
          jobId: selectedJob?._id,
          shortlistId: selectedShortlist?._id,
          includeApplicants: scope.includeApplicants,
          temperature: 0.1,
          maxOutputTokens: 4096,
        });

        if (chatSessionRef.current !== requestSession) return;

        setMessages((prev) => {
          const withoutLoader = prev.filter((entry) => entry.id !== loadingAssistantMessage.id);
          return [
            ...withoutLoader,
            {
              id: newId(),
              role: "assistant",
              content: response.reply,
              createdAt: Date.now(),
              deliveryState: "sent",
              contextUsed: response.contextUsed,
            },
          ];
        });
      } catch (error) {
        if (chatSessionRef.current !== requestSession) return;

        const message = error instanceof Error ? error.message : "Something went wrong while asking Gemini.";
        setLastFailedPrompt(messageText);
        setRequestError(message);
        setMessages((prev) => {
          const withoutLoader = prev.filter((entry) => entry.id !== loadingAssistantMessage.id);
          return [
            ...withoutLoader,
            {
              id: newId(),
              role: "assistant",
              content: `I couldn't complete that request. ${message}`,
              createdAt: Date.now(),
              deliveryState: "error",
            },
          ];
        });
      } finally {
        if (chatSessionRef.current !== requestSession) return;
        setIsSending(false);
      }
    },
    [assistantUnavailable, isSending, messages, scope.includeApplicants, selectedJob, selectedShortlist]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(draft);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelState("open")}
        onMouseEnter={warmScopeData}
        onFocus={warmScopeData}
        onTouchStart={warmScopeData}
        aria-label="Open AI recruiter assistant"
        className={cn(
          "fixed bottom-6 right-6 z-[60] inline-flex items-center gap-2 rounded-full bg-brand px-3 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:px-4",
          panelOpen && "opacity-0 pointer-events-none"
        )}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Ask AI</span>
      </button>

      {panelState !== "closed" && (
        <section
          role="dialog"
          aria-label="AI recruiter assistant"
          aria-modal="false"
          className={cn(
            "fixed z-[60] flex flex-col overflow-hidden border border-line bg-surface shadow-soft",
            isFullscreen && panelOpen
              ? "inset-0 h-full w-full sm:inset-0 sm:rounded-none"
              : cn(
                  "bottom-0 right-0 w-full",
                  "sm:bottom-6 sm:right-6 sm:w-[430px] sm:rounded-2xl",
                  panelState === "open" ? "h-[min(90vh,680px)] sm:h-[660px]" : "h-[70px] sm:h-[72px]"
                )
          )}
        >
          <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-soft px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">Recruiter Assistant</p>
                <p className="truncate text-[11px] text-ink-muted">
                  {healthLoading
                    ? "Checking Gemini connection..."
                    : assistantUnavailable
                      ? "Gemini not configured"
                      : healthError
                        ? "Gemini health check unavailable"
                        : `Gemini connected${health?.model ? ` • ${health.model}` : ""}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {panelState === "open" && (
                <button
                  type="button"
                  onClick={() => setIsFullscreen((v) => !v)}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-surface"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                </button>
              )}
              {panelState === "open" ? (
                <button
                  type="button"
                  onClick={() => { setIsFullscreen(false); setPanelState("minimized"); }}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-surface"
                  aria-label="Minimize assistant"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPanelState("open")}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-surface"
                  aria-label="Maximize assistant"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setIsFullscreen(false); setPanelState("closed"); }}
                className="rounded-md p-1.5 text-ink-muted hover:bg-surface"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {panelState === "open" ? (
            <>
              <div className="border-b border-line bg-surface-soft/50 px-4 py-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    aria-label="Assistant job scope"
                    className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink"
                    value={scope.jobId}
                    onChange={(event) => handleJobScopeChange(event.target.value)}
                    disabled={scopeLoading}
                  >
                    <option value="">Any job</option>
                    {jobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Assistant shortlist scope"
                    className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink"
                    value={scope.shortlistId}
                    onChange={(event) => handleShortlistScopeChange(event.target.value)}
                    disabled={scopeLoading}
                  >
                    <option value="">No shortlist run</option>
                    {filteredShortlists.map((run) => (
                      <option key={run._id} value={run._id}>
                        {run.runName}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="mt-2 flex items-center gap-2 text-[11px] text-ink-muted">
                  <input
                    type="checkbox"
                    checked={scope.includeApplicants}
                    onChange={(event) =>
                      setScope((prev) => ({ ...prev, includeApplicants: event.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-line text-brand"
                  />
                  Include applicant profiles in grounding context
                </label>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {healthError && <ErrorBanner message={healthError} onRetry={() => void loadHealth()} />}
                {requestError && (
                  <ErrorBanner
                    message={requestError}
                    onRetry={lastFailedPrompt ? () => void sendMessage(lastFailedPrompt) : undefined}
                  />
                )}

                {messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line bg-surface-soft p-4">
                    <p className="text-sm font-semibold text-ink">Get quick recruiting help</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Ask for shortlist reasoning, interview prep, candidate comparisons, and hiring summaries grounded in your existing jobs and shortlist data.
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {prompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          disabled={assistantUnavailable || isSending}
                          className="flex w-full items-start gap-2 rounded-md border border-line bg-surface px-3 py-2 text-left text-xs text-ink hover:border-brand hover:bg-brand-softer disabled:opacity-60"
                          onClick={() => void sendMessage(prompt)}
                        >
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                          <span>{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <article
                        key={message.id}
                        className={cn("flex", isUser ? "justify-end" : "justify-start")}
                        aria-live={isUser ? "off" : "polite"}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm",
                            isUser
                              ? "rounded-br-sm bg-brand text-white"
                              : message.deliveryState === "error"
                                ? "rounded-bl-sm border border-danger/30 bg-danger/5 text-danger"
                                : "rounded-bl-sm bg-surface-soft text-ink"
                          )}
                        >
                          {message.deliveryState === "loading" ? (
                            <div className="flex items-center gap-2 text-ink-muted">
                              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                            </div>
                          ) : (
                            <>
                              {isUser ? (
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              ) : (
                                <AssistantMarkdownMessage content={message.content} />
                              )}
                            </>
                          )}
                          {!isUser && message.contextUsed && message.deliveryState !== "loading" && (
                            <p className="mt-1.5 border-t border-line/60 pt-1.5 text-[10px] uppercase tracking-wide text-ink-muted">
                              {contextLabel(message.contextUsed)}
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="border-t border-line bg-surface px-3 py-3" onSubmit={handleSubmit}>
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Ask about shortlists, candidate fit, or interview prep…"
                    rows={2}
                    disabled={assistantUnavailable || isSending || healthLoading}
                    className="min-h-[44px] max-h-40 flex-1 resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  />
                  <button
                    type="submit"
                    disabled={assistantUnavailable || isSending || draft.trim().length === 0 || healthLoading}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send assistant message"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[10.5px] text-ink-subtle">
                  Enter to send • Shift+Enter for newline • Esc to minimize.
                </p>
              </form>
            </>
          ) : (
            <button
              type="button"
              className="flex h-full w-full items-center justify-center px-4 text-xs text-ink-muted hover:bg-surface-soft"
              onClick={() => setPanelState("open")}
            >
              Assistant minimized. Tap to reopen.
            </button>
          )}
        </section>
      )}
    </>
  );
}
