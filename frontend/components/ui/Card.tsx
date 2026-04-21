import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...rest}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  const titleIsText = typeof title === "string" || typeof title === "number";
  const descriptionIsText = typeof description === "string" || typeof description === "number";

  return (
    <div className={cn("flex items-start justify-between gap-4 px-6 py-5 border-b border-line", className)}>
      <div>
        {titleIsText ? (
          <h3 className="text-[18px] font-semibold text-ink leading-7 tracking-tight">{title}</h3>
        ) : (
          <div className="text-[18px] font-semibold text-ink leading-7 tracking-tight">{title}</div>
        )}
        {description &&
          (descriptionIsText ? (
            <p className="mt-1 text-sm text-ink-muted">{description}</p>
          ) : (
            <div className="mt-1 text-sm text-ink-muted">{description}</div>
          ))}
      </div>
      {action}
    </div>
  );
}
