/**
 * Spinner — indeterminate loading indicator.
 * Sizes tie back to icon tokens (14/16/20).
 */
import { cn } from "@/lib/utils";

export function Spinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const px = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-brand", className)}
      style={{ width: px, height: px }}
    />
  );
}
