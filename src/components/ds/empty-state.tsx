/**
 * EmptyState — used for "no projects", "no assets", "no results", etc.
 * Consistent proportions so every empty screen feels the same.
 */
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pad = size === "sm" ? "py-8" : size === "lg" ? "py-20" : "py-14";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6",
        pad,
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-brand">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
