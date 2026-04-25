"use client";

import {
  ClipboardEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
  ariaLabel?: string;
  required?: boolean;
  id?: string;
}

interface Tool {
  key: string;
  label: string;
  icon: typeof Bold;
  shortcut?: string;
  run: () => void;
}

function exec(command: string, valueArg?: string) {
  // execCommand is deprecated but is still the most reliable way to apply
  // inline formatting inside a contentEditable region without pulling in a
  // full editor framework. All major browsers still implement it.
  document.execCommand(command, false, valueArg);
}

// Heuristic: treat plain text (no HTML tags) as authored prose and
// preserve newlines by converting them into <p> / <br> so the WYSIWYG view
// renders the same shape the user typed. An empty value still seeds an empty
// <p> so the cursor lives inside a paragraph from the very first keystroke
// (instead of inheriting whatever block/format state the browser was last in).
function normalizeInitialContent(input: string): string {
  if (!input) {
    return "<p><br></p>";
  }
  if (/<[a-z][\s\S]*>/i.test(input)) {
    return input;
  }
  return input
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function RichTextEditor({
  value,
  onChange,
  minHeight = 160,
  placeholder,
  ariaLabel,
  required,
  id,
}: RichTextEditorProps) {
  const generatedId = useId();
  const editorId = id || generatedId;
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastEmittedRef = useRef<string>("");
  const [hasFocus, setHasFocus] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Force "p" as the block element used when Enter is pressed so we don't end
  // up with bare <div> wrappers that can carry stale inline styles.
  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // Older Safari versions throw if the command isn't supported — safe to ignore.
    }
  }, []);

  // Initial mount: paint the incoming value once. Subsequent updates from the
  // outside (e.g. AI import auto-filling the field) are synced only when the
  // editor isn't focused — otherwise we'd nuke the user's caret position on
  // every keystroke.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    const next = normalizeInitialContent(value);
    if (editor.innerHTML !== next && document.activeElement !== editor) {
      editor.innerHTML = next;
      lastEmittedRef.current = value;
      setIsEmpty(editor.textContent?.trim().length === 0);
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    const isEffectivelyEmpty = editor.textContent?.trim().length === 0;
    setIsEmpty(isEffectivelyEmpty);

    // Treat the seeded "<p><br></p>" placeholder structure as an empty value
    // so consumers (and `required` validation) still see an empty string.
    const html = isEffectivelyEmpty ? "" : editor.innerHTML;
    if (html === lastEmittedRef.current) {
      return;
    }
    lastEmittedRef.current = html;
    onChange(html);
  }, [onChange]);

  const runCommand = useCallback(
    (command: string, valueArg?: string) => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }
      editor.focus();
      exec(command, valueArg);
      emitChange();
    },
    [emitChange]
  );

  const insertLink = useCallback(() => {
    const url = window.prompt("Link URL", "https://");
    if (!url) {
      return;
    }
    runCommand("createLink", url);
    // Make link safe / open in a new tab.
    const editor = editorRef.current;
    if (editor) {
      editor.querySelectorAll("a").forEach((anchor) => {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noreferrer");
      });
      emitChange();
    }
  }, [emitChange, runCommand]);

  const TOOLS: Tool[] = [
    { key: "bold", label: "Bold", icon: Bold, shortcut: "Ctrl+B", run: () => runCommand("bold") },
    { key: "italic", label: "Italic", icon: Italic, shortcut: "Ctrl+I", run: () => runCommand("italic") },
    { key: "underline", label: "Underline", icon: Underline, shortcut: "Ctrl+U", run: () => runCommand("underline") },
    { key: "strike", label: "Strikethrough", icon: Strikethrough, run: () => runCommand("strikeThrough") },
    { key: "h2", label: "Heading", icon: Heading2, run: () => runCommand("formatBlock", "H2") },
    { key: "h3", label: "Subheading", icon: Heading3, run: () => runCommand("formatBlock", "H3") },
    { key: "ul", label: "Bulleted list", icon: List, run: () => runCommand("insertUnorderedList") },
    { key: "ol", label: "Numbered list", icon: ListOrdered, run: () => runCommand("insertOrderedList") },
    { key: "quote", label: "Quote", icon: Quote, run: () => runCommand("formatBlock", "BLOCKQUOTE") },
    { key: "link", label: "Insert link", icon: LinkIcon, run: insertLink },
    { key: "undo", label: "Undo", icon: Undo2, shortcut: "Ctrl+Z", run: () => runCommand("undo") },
    { key: "redo", label: "Redo", icon: Redo2, shortcut: "Ctrl+Shift+Z", run: () => runCommand("redo") },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        runCommand("bold");
      } else if (key === "i") {
        event.preventDefault();
        runCommand("italic");
      } else if (key === "u") {
        event.preventDefault();
        runCommand("underline");
      }
    },
    [runCommand]
  );

  // Strip rich formatting from clipboard content so pasted text inherits the
  // editor's existing styles instead of dragging in inline color/font CSS.
  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      if (text) {
        exec("insertText", text);
        emitChange();
      }
    },
    [emitChange]
  );

  return (
    <div
      className={cn(
        "rounded-md border border-line bg-surface transition-colors",
        hasFocus ? "border-brand ring-2 ring-brand/40" : "hover:border-line-strong"
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface-soft px-2 py-1.5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.key}
              type="button"
              // Prevent the editor from losing focus when the toolbar is clicked,
              // otherwise execCommand has no selection to operate on.
              onMouseDown={(event) => event.preventDefault()}
              onClick={tool.run}
              title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
              aria-label={tool.label}
              className="flex h-7 w-7 items-center justify-center rounded text-ink-muted transition-colors hover:bg-brand/10 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          id={editorId}
          role="textbox"
          aria-multiline="true"
          aria-required={required || undefined}
          aria-label={ariaLabel}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onInput={emitChange}
          onBlur={() => {
            setHasFocus(false);
            emitChange();
          }}
          onFocus={() => {
            setHasFocus(true);
            // Clear any lingering toggle state (bold/italic/underline) carried
            // over from previous interactions on the page.
            try {
              ["bold", "italic", "underline", "strikeThrough"].forEach((command) => {
                if (document.queryCommandState(command)) {
                  document.execCommand(command);
                }
              });
            } catch {
              // queryCommandState can throw in some browsers — non-fatal.
            }
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          style={{ minHeight, resize: "vertical" }}
          className={cn(
            "block w-full overflow-auto bg-transparent px-3 py-2.5 text-sm font-normal leading-relaxed text-ink focus:outline-none",
            // contentEditable doesn't respect ::placeholder; we render a
            // sibling overlay below when the editor is empty.
            "[&_p]:font-normal [&_li]:font-normal",
            "[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink",
            "[&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink",
            "[&_p]:mb-2 [&_p:last-child]:mb-0",
            "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:space-y-0.5 [&_ul]:pl-5",
            "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-0.5 [&_ol]:pl-5",
            "[&_li]:leading-snug",
            "[&_blockquote]:mb-2 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_blockquote]:text-ink-muted",
            "[&_a]:text-brand [&_a]:underline-offset-2 hover:[&_a]:underline",
            "[&_strong]:font-semibold",
            "[&_em]:italic"
          )}
        />
        {isEmpty && placeholder && (
          <div className="pointer-events-none absolute left-3 top-2.5 select-none text-sm leading-relaxed text-ink-muted">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
