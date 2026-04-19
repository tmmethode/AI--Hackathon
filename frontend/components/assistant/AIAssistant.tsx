"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bot,
  ChevronDown,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  AssistantAskResponse,
  AssistantHealthResponse,
  AssistantContextSummary,
  AssistantMessage,
  askAssistant,
  getAssistantHealth,
} from "@/lib/assistant";
import { getStoredAuth } from "@/lib/auth";
import { listAllJobs, type JobRecord } from "@/lib/jobs";
import { listAllShortlists, type ShortlistSummary } from "@/lib/shortlists";

interface ChatMessage extends AssistantMessage {
  id: string;
  at: number;
  contextUsed?: AssistantContextSummary;
  model?: string;
}

const STARTER_PROMPTS = [
  "Summarise the top 3 candidates.",
  "Why was the #1 candidate ranked first?",
  "Which candidates meet all mandatory requirements?",
  "Compare the top 2 shortlisted candidates.",
  "Generate interview notes for the top candidate.",
];

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function contextSummaryLabel(summary: AssistantContextSummary): string {
  const parts: string[] = [];
  if (summary.jobTitle) parts.push(summary.jobTitle);
  if (summary.shortlistCount > 0) parts.push(`${summary.shortlistCount} shortlisted`);
  if (summary.screeningResultCount > 0) parts.push(`${summary.screeningResultCount} scored`);
  if (summary.applicantCount > 0) parts.push(`${summary.applicantCount} applicants`);
  if (summary.truncatedApplicants) parts.push("truncated");
  if (parts.length === 0) {
    if (summary.source === "database") return "Workspace overview";
    if (summary.source === "mixed") return "Mixed live context";
    if (summary.source === "inline") return "Provided inline context";
    return "No live data grounding";
  }
  return parts.join(" • ");
}

function buildStarterPrompts(selectedJob?: JobRecord, selectedShortlist?: ShortlistSummary): string[] {
  if (selectedShortlist) {
    const candidateLabel = selectedShortlist.topCandidateName || "the top shortlisted candidate";
    return [
      `Summarise the shortlist for ${selectedShortlist.jobTitle}.`,
      `Why was ${candidateLabel} ranked first in ${selectedShortlist.runName}?`,
      `Compare the top 2 shortlisted candidates for ${selectedShortlist.jobTitle}.`,
      `Which shortlisted candidates have the biggest risks for ${selectedShortlist.jobTitle}?`,
      `Generate interview notes for ${candidateLabel}.`,
    ];
  }

  if (selectedJob) {
    return [
      `Summarise the current applicant pool for ${selectedJob.title}.`,
      `Which candidates best meet the must-have requirements for ${selectedJob.title}?`,
      `What are the biggest skill gaps in the ${selectedJob.title} pipeline?`,
      `Which applicants look strongest for ${selectedJob.title}?`,
      `Draft recruiter interview focus areas for the strongest ${selectedJob.title} candidates.`,
    ];
  }

  return STARTER_PROMPTS;
}

export function AIAssistant() {
  const [authReady, setAuthReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantHealth, setAssistantHealth] = useState<AssistantHealthResponse | null>(null);
  const [assistantHealthLoading, setAssistantHealthLoading] = useState(false);
  const [assistantHealthError, setAssistantHealthError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [shortlists, setShortlists] = useState<ShortlistSummary[]>([]);
  const [scopeLoaded, setScopeLoaded] = useState(false);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [scopeInitialized, setScopeInitialized] = useState(false);
  const [jobId, setJobId] = useState<string>("");
  const [shortlistId, setShortlistId] = useState<string>("");
  const [includeApplicants, setIncludeApplicants] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Only expose to recruiters and admins
  useEffect(() => {
    const session = getStoredAuth();
    const role = session?.user?.role;
    setVisible(Boolean(session?.token) && (role === "recruiter" || role === "admin"));
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open, isSending]);

  const loadScopeOptions = useCallback(async (force = false) => {
    if ((scopeLoaded && !force) || scopeLoading) return;
    setScopeLoading(true);
    setScopeError(null);
    try {
      const [jobList, shortlistList] = await Promise.all([
        listAllJobs({ pageSize: 100 }).catch(() => [] as JobRecord[]),
        listAllShortlists({ pageSize: 100 }).catch(() => [] as ShortlistSummary[]),
      ]);
      setJobs(jobList);
      setShortlists(shortlistList);
      setScopeLoaded(true);
      if (force) {
        setScopeInitialized(false);
      }
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : "Failed to load scope options.");
    } finally {
      setScopeLoading(false);
    }
  }, [scopeLoaded, scopeLoading]);

  useEffect(() => {
    if (open && visible) {
      void loadScopeOptions();
    }
  }, [open, visible, loadScopeOptions]);

  useEffect(() => {
    if (!open || !visible || assistantHealth || assistantHealthLoading) {
      return;
    }

    let isMounted = true;
    setAssistantHealthLoading(true);
    setAssistantHealthError(null);

    void getAssistantHealth()
      .then((result) => {
        if (isMounted) {
          setAssistantHealth(result);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setAssistantHealth(null);
          setAssistantHealthError(
            err instanceof Error ? err.message : "Unable to confirm the Gemini connection."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setAssistantHealthLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [assistantHealth, assistantHealthLoading, open, visible]);

  useEffect(() => {
    if (!scopeLoaded || scopeInitialized || jobId || shortlistId) {
      return;
    }

    const latestShortlist = shortlists[0];
    if (latestShortlist) {
      setShortlistId(latestShortlist._id);
      setJobId(latestShortlist.job);
      setScopeInitialized(true);
      return;
    }

    const defaultJob = jobs.find((job) => job.status === "Active") ?? jobs[0];
    if (defaultJob) {
      setJobId(defaultJob._id);
    }
    setScopeInitialized(true);
  }, [jobs, jobId, scopeInitialized, scopeLoaded, shortlistId, shortlists]);

  const filteredShortlists = useMemo(() => {
    if (!jobId) return shortlists;
    return shortlists.filter((entry) => entry.job === jobId);
  }, [jobId, shortlists]);

  // Keep shortlist selection consistent with job filter
  useEffect(() => {
    if (!shortlistId) return;
    const stillValid = filteredShortlists.some((entry) => entry._id === shortlistId);
    if (!stillValid) {
      setShortlistId("");
    }
  }, [filteredShortlists, shortlistId]);

  const effectiveJobId = useMemo(() => {
    if (jobId) return jobId;
    const fromShortlist = shortlists.find((entry) => entry._id === shortlistId)?.job;
    return fromShortlist || "";
  }, [jobId, shortlistId, shortlists]);

  const selectedShortlist = useMemo(
    () => shortlists.find((entry) => entry._id === shortlistId),
    [shortlistId, shortlists]
  );

  const selectedJob = useMemo(
    () => jobs.find((entry) => entry._id === effectiveJobId),
    [effectiveJobId, jobs]
  );

  const starterPrompts = useMemo(
    () => buildStarterPrompts(selectedJob, selectedShortlist),
    [selectedJob, selectedShortlist]
  );
  const assistantReady = assistantHealth?.configured === true;

  const resetConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput("");
  }, []);

  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed || isSending) return;

      const history: AssistantMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const userTurn: ChatMessage = {
        id: makeId(),
        role: "user",
        content: trimmed,
        at: Date.now(),
      };
      setMessages((prev) => [...prev, userTurn]);
      setInput("");
      setError(null);
      setIsSending(true);

      try {
        const response: AssistantAskResponse = await askAssistant({
          message: trimmed,
          history,
          jobId: effectiveJobId || undefined,
          shortlistId: shortlistId || undefined,
          includeApplicants,
          temperature: 0.1,
        });

        const assistantTurn: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: response.reply,
          at: Date.now(),
          contextUsed: response.contextUsed,
          model: response.model,
        };
        setMessages((prev) => [...prev, assistantTurn]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            content: `I couldn't answer that: ${message}`,
            at: Date.now(),
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [effectiveJobId, includeApplicants, isSending, messages, shortlistId]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  if (!authReady || !visible) {
    return null;
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AI recruiter assistant"
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-medium text-white shadow-soft transition-all hover:bg-brand-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-end px-0 pb-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:px-0"
          role="dialog"
          aria-modal="false"
          aria-label="AI recruiter assistant"
        >
          <div className="flex h-[min(640px,92vh)] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-soft sm:h-[640px] sm:w-[420px] sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-line bg-surface-soft px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Bot className="h-4 w-4" />
                </div>
                  <div>
                    <div className="text-sm font-semibold text-ink leading-5">Recruiter Assistant</div>
                    <div className="text-[11px] text-ink-muted leading-4">
                      {assistantHealthLoading
                        ? "Checking Gemini connection..."
                        : assistantReady
                          ? `Gemini connected • ${assistantHealth?.model}`
                          : assistantHealthError
                            ? "Gemini connection unavailable"
                            : "Gemini is not configured"}
                    </div>
                  </div>
                </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetConversation}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
                  title="Close"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scope selectors */}
            <ScopeSelector
              jobs={jobs}
              shortlists={filteredShortlists}
              jobId={jobId}
              shortlistId={shortlistId}
              includeApplicants={includeApplicants}
              scopeLabel={
                selectedShortlist
                  ? `${selectedShortlist.runName} • ${selectedShortlist.jobTitle}`
                  : selectedJob
                    ? selectedJob.title
                    : "No scope selected"
              }
              loading={scopeLoading}
              error={scopeError}
              onJobChange={setJobId}
              onShortlistChange={setShortlistId}
              onIncludeApplicantsChange={setIncludeApplicants}
              onRefresh={() => void loadScopeOptions(true)}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <EmptyState
                  selectedJob={selectedJob}
                  selectedShortlist={selectedShortlist}
                  prompts={starterPrompts}
                  onSelectPrompt={(prompt) => void sendMessage(prompt)}
                  disabled={isSending || assistantHealthLoading || !assistantReady}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isSending && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="border-t border-danger/20 bg-danger/5 px-4 py-2 text-xs text-danger">
                {error}
              </div>
            )}
            {assistantHealthError && (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                {assistantHealthError}
              </div>
            )}
            {assistantHealth && !assistantHealth.configured && (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                Gemini is not configured on the backend. Add `GEMINI_API_KEY` to enable assistant replies.
              </div>
            )}

            {/* Composer */}
            <form onSubmit={handleSubmit} className="border-t border-line bg-surface px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Ask about candidates, scores, or shortlists…"
                  className="min-h-[44px] max-h-36 flex-1 resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  disabled={isSending || assistantHealthLoading || !assistantReady}
                />
                <button
                  type="submit"
                  disabled={isSending || input.trim().length === 0 || assistantHealthLoading || !assistantReady}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[10.5px] leading-4 text-ink-subtle">
                Enter to send • Shift+Enter for a new line.{" "}
                {!assistantReady
                  ? "Replies are disabled until the Gemini connection is confirmed."
                  : selectedShortlist
                    ? `Grounded in live data from ${selectedShortlist.runName} for ${selectedShortlist.jobTitle}.`
                    : selectedJob
                      ? `Grounded in live job and applicant data for ${selectedJob.title}.`
                      : "Grounded in the live workspace overview until you choose a job or shortlist."}
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

interface ScopeSelectorProps {
  jobs: JobRecord[];
  shortlists: ShortlistSummary[];
  jobId: string;
  shortlistId: string;
  includeApplicants: boolean;
  scopeLabel: string;
  loading: boolean;
  error: string | null;
  onJobChange: (value: string) => void;
  onShortlistChange: (value: string) => void;
  onIncludeApplicantsChange: (value: boolean) => void;
  onRefresh: () => void;
}

function ScopeSelector({
  jobs,
  shortlists,
  jobId,
  shortlistId,
  includeApplicants,
  scopeLabel,
  loading,
  error,
  onJobChange,
  onShortlistChange,
  onIncludeApplicantsChange,
  onRefresh,
}: ScopeSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-line bg-surface-soft px-4 py-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left text-[11px] font-medium uppercase tracking-wide text-ink-muted hover:text-ink"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Context scope: <span className="font-semibold text-ink normal-case tracking-normal">{scopeLabel}</span>
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface px-2.5 py-2 text-[11px] text-ink-muted">
            <span>{scopeLabel}</span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-ink hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              Refresh
            </button>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink-muted">Job</label>
            <select
              value={jobId}
              onChange={(event) => onJobChange(event.target.value)}
              disabled={loading}
              className="w-full appearance-none rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <option value="">Any job (no job scope)</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                  {job.department ? ` — ${job.department}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink-muted">
              Shortlist run
            </label>
            <select
              value={shortlistId}
              onChange={(event) => onShortlistChange(event.target.value)}
              disabled={loading}
              className="w-full appearance-none rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <option value="">No shortlist run</option>
              {shortlists.map((entry) => (
                <option key={entry._id} value={entry._id}>
                  {entry.runName} — {entry.jobTitle}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-ink">
            <input
              type="checkbox"
              checked={includeApplicants}
              onChange={(event) => onIncludeApplicantsChange(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-line text-brand focus:ring-brand/40"
            />
            Include applicant profiles for the selected job
          </label>

          {loading && <p className="text-[11px] text-ink-muted">Loading scope options…</p>}
          {error && <p className="text-[11px] text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  selectedJob,
  selectedShortlist,
  prompts,
  onSelectPrompt,
  disabled,
}: {
  selectedJob?: JobRecord;
  selectedShortlist?: ShortlistSummary;
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Sparkles className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">How can I help with your candidates?</p>
        <p className="mt-1 text-xs text-ink-muted">
          I explain rankings, compare candidates, draft interview notes, and answer questions
          grounded only in your data.
        </p>
        <p className="mt-2 text-[11px] text-ink-subtle">
          {selectedShortlist
            ? `Current live scope: ${selectedShortlist.runName} for ${selectedShortlist.jobTitle}.`
            : selectedJob
              ? `Current live scope: ${selectedJob.title}.`
              : "No specific job selected yet, so I will use the live workspace overview."}
        </p>
      </div>
      <div className="flex w-full flex-col gap-1.5">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            disabled={disabled}
            className="rounded-md border border-line bg-surface px-3 py-2 text-left text-xs text-ink transition-colors hover:border-brand hover:bg-brand-softer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-card",
          isUser
            ? "rounded-br-sm bg-brand text-white"
            : "rounded-bl-sm bg-surface-soft text-ink"
        )}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {!isUser && message.contextUsed && (
          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-line/50 pt-1.5 text-[10px] text-ink-muted">
            <span className="rounded bg-surface px-1.5 py-0.5 font-medium uppercase tracking-wide">
              {message.contextUsed.source}
            </span>
            <span>{contextSummaryLabel(message.contextUsed)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-soft px-3.5 py-2.5 text-sm text-ink-muted shadow-card">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted" />
      </div>
    </div>
  );
}
