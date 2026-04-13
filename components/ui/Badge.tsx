import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "info" | "warning" | "danger" | "brand";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  pill?: boolean;
}

const tones: Record<Tone, string> = {
  neutral: "bg-surface-soft text-ink-subtle",
  success: "bg-success/10 text-success",
  info: "bg-brand/10 text-brand",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-danger/10 text-danger",
  brand: "bg-brand-soft text-brand",
};

export function Badge({ tone = "neutral", pill, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold leading-none",
        pill ? "rounded-full" : "rounded-md",
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
