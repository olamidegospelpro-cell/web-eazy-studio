/**
 * Toast helpers — thin wrapper around sonner so status semantics
 * (success/warning/danger/info) look identical everywhere.
 *
 * Usage: `notify.success("Project saved")` — no need to import sonner directly.
 */
import { toast as sonner, Toaster as SonnerToaster } from "sonner";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from "lucide-react";

export const notify = {
  success: (msg: string, description?: string) =>
    sonner(msg, { description, icon: <CheckCircle2 className="h-4 w-4 text-success" /> }),
  warning: (msg: string, description?: string) =>
    sonner(msg, { description, icon: <AlertTriangle className="h-4 w-4 text-warning" /> }),
  error: (msg: string, description?: string) =>
    sonner(msg, { description, icon: <AlertOctagon className="h-4 w-4 text-danger" /> }),
  info: (msg: string, description?: string) =>
    sonner(msg, { description, icon: <Info className="h-4 w-4 text-info" /> }),
  loading: (msg: string) => sonner.loading(msg),
  dismiss: sonner.dismiss,
};

export function AppToaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-md",
          description: "group-[.toast]:text-muted-foreground",
        },
      }}
    />
  );
}
