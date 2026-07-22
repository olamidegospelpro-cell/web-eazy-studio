/**
 * LoadingOverlay — blocks a container while an async op runs.
 */
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

export function LoadingOverlay({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm",
        className,
      )}
    >
      <Spinner size="lg" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
