/**
 * Bottom developer panel — Console, Build, Errors, Accessibility, Performance.
 *
 * The Console and Errors tabs are now live: they stream from the core logger
 * (`@/lib/core/logger`). Remaining tabs stay placeholders until their owning
 * milestone lands. Open/closed state and the active tab persist via the
 * window manager.
 */
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Terminal,
  Hammer,
  AlertCircle,
  Accessibility,
  Gauge,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { log, useUi, type LogEntry } from "@/lib/core";

const tabs = [
  { id: "console", label: "Console", icon: Terminal, empty: "No log output yet." },
  { id: "build", label: "Build", icon: Hammer, empty: "No build has run." },
  { id: "errors", label: "Errors", icon: AlertCircle, empty: "No errors." },
  {
    id: "a11y",
    label: "Accessibility",
    icon: Accessibility,
    empty: "Accessibility checks not run.",
  },
  { id: "perf", label: "Performance", icon: Gauge, empty: "No performance data." },
] as const;

const LEVEL_CLASS: Record<LogEntry["level"], string> = {
  debug: "text-muted-foreground",
  info: "text-info",
  warn: "text-warning",
  error: "text-danger",
};

function LogList({ entries, empty }: { entries: LogEntry[]; empty: string }) {
  if (entries.length === 0)
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        {empty}
      </div>
    );
  return (
    <ul className="flex flex-col gap-0.5 p-2 font-mono text-[11px]">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-2">
          <span className="shrink-0 text-muted-foreground/60">
            {new Date(entry.at).toLocaleTimeString()}
          </span>
          <span className={cn("w-11 shrink-0 uppercase", LEVEL_CLASS[entry.level])}>
            {entry.level}
          </span>
          <span className="shrink-0 text-muted-foreground/80">[{entry.scope}]</span>
          <span className="min-w-0 break-all text-foreground/90">{entry.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function BottomPanel() {
  const { layout, setLayout, toggleBottomPanel } = useUi();
  const open = layout.bottomPanelOpen;
  const [entries, setEntries] = useState<LogEntry[]>(() => log.entries());

  useEffect(() => log.subscribe((next) => setEntries([...next])), []);

  const errors = entries.filter((entry) => entry.level === "error" || entry.level === "warn");

  return (
    <div className={cn("shrink-0 border-t border-border bg-panel text-panel-foreground")}>
      <Tabs
        value={layout.bottomPanelTab}
        onValueChange={(value) => setLayout({ bottomPanelTab: value })}
        className="flex flex-col"
      >
        <div className="flex h-9 items-center gap-2 px-2">
          <TabsList className="h-7 bg-transparent p-0 gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  onClick={() => toggleBottomPanel(true)}
                  className="h-7 gap-1.5 px-2 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="flex-1" />
          {open && (
            <button
              type="button"
              onClick={() => log.clear()}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Clear logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleBottomPanel()}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label={open ? "Collapse panel" : "Expand panel"}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>

        {open && (
          <div className="h-40 overflow-auto border-t border-border">
            <TabsContent value="console" className="m-0 h-full">
              <LogList entries={entries} empty="No log output yet." />
            </TabsContent>
            <TabsContent value="errors" className="m-0 h-full">
              <LogList entries={errors} empty="No errors." />
            </TabsContent>
            {tabs
              .filter((t) => t.id !== "console" && t.id !== "errors")
              .map((t) => (
                <TabsContent
                  key={t.id}
                  value={t.id}
                  className="m-0 flex h-full items-center justify-center px-4 text-xs text-muted-foreground"
                >
                  {t.empty}
                </TabsContent>
              ))}
          </div>
        )}
      </Tabs>
    </div>
  );
}
