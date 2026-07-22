/**
 * Bottom developer panel — Console, Build, Errors, Accessibility, Performance.
 *
 * Milestone 1 renders empty tabs. Later milestones will wire each tab to its
 * dedicated service (log stream, build pipeline, a11y checker, perf profiler).
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Terminal, Hammer, AlertCircle, Accessibility, Gauge } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "console", label: "Console", icon: Terminal, empty: "No log output yet." },
  { id: "build", label: "Build", icon: Hammer, empty: "No build has run." },
  { id: "errors", label: "Errors", icon: AlertCircle, empty: "No errors." },
  { id: "a11y", label: "Accessibility", icon: Accessibility, empty: "Accessibility checks not run." },
  { id: "perf", label: "Performance", icon: Gauge, empty: "No performance data." },
] as const;

export function BottomPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("shrink-0 border-t border-border bg-panel text-panel-foreground")}>
      <Tabs defaultValue="console" className="flex flex-col">
        <div className="flex h-9 items-center gap-2 px-2">
          <TabsList className="h-7 bg-transparent p-0 gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  onClick={() => setOpen(true)}
                  className="h-7 gap-1.5 px-2 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label={open ? "Collapse panel" : "Expand panel"}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>

        {open && (
          <div className="h-40 overflow-auto border-t border-border">
            {tabs.map((t) => (
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
