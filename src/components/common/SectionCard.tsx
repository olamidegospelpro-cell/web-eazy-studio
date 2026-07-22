/**
 * Small reusable card used by Home tiles (New Project, templates, recents).
 * Encapsulates the hover/active affordance in one place.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
};

export function SectionCard({ children, onClick, className, interactive = true }: Props) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card p-4 text-left text-card-foreground shadow-sm",
        interactive && "transition-colors hover:border-brand/40 hover:bg-accent/50",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
