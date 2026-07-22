/**
 * StatusBadge — pill for status semantics (success/warning/danger/info/neutral).
 * Kept separate from shadcn `Badge` because Badge is a lower-level primitive;
 * StatusBadge locks the meaning to our status color tokens.
 */
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        brand: "border-transparent bg-accent text-accent-foreground",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/20 text-warning-foreground",
        danger: "border-transparent bg-danger/15 text-danger",
        info: "border-transparent bg-info/15 text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function StatusBadge({
  tone,
  className,
  children,
}: VariantProps<typeof badgeVariants> & { className?: string; children: ReactNode }) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}
