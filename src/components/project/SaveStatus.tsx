/** Save status + save actions for the toolbar, and the crash-recovery prompt. */
import { Check, CircleDot, Loader2, AlertTriangle, Save } from "lucide-react";
import { Button, ConfirmDialog } from "@/components/ds";
import { useProject } from "@/lib/project";

export function SaveStatus() {
  const { bundle, saveState, dirty, location, save, saveAs, lastError } = useProject();
  if (!bundle) return null;

  const label =
    saveState === "saving"
      ? "Saving…"
      : saveState === "error"
        ? "Save failed"
        : dirty
          ? "Unsaved changes"
          : location
            ? "All changes saved"
            : "Not saved yet";

  const Icon =
    saveState === "saving"
      ? Loader2
      : saveState === "error"
        ? AlertTriangle
        : dirty || !location
          ? CircleDot
          : Check;

  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
        title={lastError?.suggestion ?? location?.path ?? undefined}
      >
        <Icon className={`h-3.5 w-3.5 ${saveState === "saving" ? "animate-spin" : ""}`} />
        {label}
      </span>
      <Button size="sm" variant="outline" className="h-7" onClick={() => void save()}>
        <Save className="h-3.5 w-3.5" />
        Save
      </Button>
      <Button size="sm" variant="ghost" className="h-7" onClick={() => void saveAs()}>
        Save as
      </Button>
    </div>
  );
}

export function SessionRecoveryDialog() {
  const { pendingRecovery, recoverSession, discardSession } = useProject();
  return (
    <ConfirmDialog
      open={Boolean(pendingRecovery)}
      onOpenChange={(open) => !open && void discardSession()}
      title="Recover previous session?"
      description={
        pendingRecovery
          ? `WebEazy closed with unsaved changes in "${pendingRecovery.bundle.manifest.name}". Restore that work?`
          : undefined
      }
      confirmLabel="Recover"
      cancelLabel="Discard"
      onConfirm={() => void recoverSession()}
    />
  );
}
