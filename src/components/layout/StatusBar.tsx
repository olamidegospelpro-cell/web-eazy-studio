/**
 * StatusBar — the always-visible strip at the bottom of the window.
 *
 * Reads from core services (theme, project store, logger, history) so later
 * milestones only need to add a segment, never re-plumb state.
 */
import { useEffect, useState } from "react";
import {
  Check,
  CircleDot,
  Hammer,
  Loader2,
  Moon,
  Sun,
  Terminal,
  Timer,
  Zap,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useProject } from "@/lib/project";
import { bus, log, useUi, formatAccelerator, type LogEntry } from "@/lib/core";
import { cn } from "@/lib/utils";

function Segment({
  icon: Icon,
  children,
  onClick,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  const content = (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded px-1.5 py-0.5 hover:bg-accent hover:text-accent-foreground"
    >
      {content}
    </button>
  ) : (
    <span className="px-1.5 py-0.5" title={title}>
      {content}
    </span>
  );
}

export function StatusBar() {
  const { resolvedTheme } = useTheme();
  const { bundle, dirty, saveState, preferences } = useProject();
  const ui = useUi();
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => log.entries());

  useEffect(() => bus.on("app:ready", () => setReady(true)), []);
  useEffect(() => log.subscribe(setLogs), []);

  const errors = logs.filter((entry) => entry.level === "error").length;
  const autosave = preferences.autosaveEnabled
    ? `Autosave ${Math.round(preferences.autosaveIntervalMs / 1000)}s`
    : "Autosave off";

  return (
    <footer className="flex h-6 shrink-0 items-center gap-1 border-t border-border bg-toolbar px-2 text-[11px] text-muted-foreground">
      <Segment icon={Zap}>{ready ? "Application ready" : "Starting…"}</Segment>
      <span className="opacity-30">|</span>
      <Segment icon={bundle ? (dirty ? CircleDot : Check) : CircleDot}>
        {bundle ? `${bundle.manifest.name}${dirty ? " •" : ""}` : "No project open"}
      </Segment>
      <span className="opacity-30">|</span>
      <Segment icon={saveState === "saving" ? Loader2 : Timer} title="Autosave settings live in Settings">
        {saveState === "saving" ? "Saving…" : autosave}
      </Segment>

      <div className="flex-1" />

      <Segment icon={Hammer} title="Build status arrives with the export milestone">
        Build: idle
      </Segment>
      <Segment
        icon={Terminal}
        onClick={() => ui.toggleBottomPanel()}
        title={`Console (${logs.length} entries)`}
      >
        <span className={cn(errors > 0 && "text-danger")}>
          {errors > 0 ? `${errors} errors` : `${logs.length} logs`}
        </span>
      </Segment>
      <Segment
        icon={resolvedTheme === "dark" ? Moon : Sun}
        title={`Command palette: ${formatAccelerator("mod+shift+p")}`}
      >
        {resolvedTheme === "dark" ? "Dark" : "Light"}
      </Segment>
    </footer>
  );
}
