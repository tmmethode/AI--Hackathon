"use client";

import { useEffect, useCallback, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, children, size = "md", className }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "flex max-h-[calc(100vh-1rem)] w-full flex-col overflow-hidden rounded-t-xl border border-line bg-white shadow-xl animate-in zoom-in-95 duration-200 sm:max-h-[calc(100vh-2rem)] sm:rounded-xl",
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children?: ReactNode;
}

export function ModalHeader({ title, subtitle, onClose, children }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
      <div className="min-w-0">
        {children}
        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink"
        aria-label="Close dialog"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5", className)}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3 sm:px-6 sm:py-4", className)}>
      {children}
    </div>
  );
}
