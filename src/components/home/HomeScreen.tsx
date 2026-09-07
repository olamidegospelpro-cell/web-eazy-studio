import { useEffect, useState } from "react";
import { ArrowRight, FolderOpen, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewProjectWizard } from "@/components/project/wizard/NewProjectWizard";
import { RecentProjectsPanel } from "@/components/project/RecentProjectsPanel";
import { HackathonStudio } from "@/components/hackathon/HackathonStudio";
import { useProject } from "@/lib/project";

export function HomeScreen() {
  const store = useProject();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioProjectName, setStudioProjectName] = useState("Untitled project");

  useEffect(() => {
    const open = () => setWizardOpen(true);
    window.addEventListener("webeazy:new-project", open);
    return () => window.removeEventListener("webeazy:new-project", open);
  }, []);

  const openStudio = (name = store.bundle?.manifest.name || "Untitled project") => {
    setStudioProjectName(name);
    setStudioOpen(true);
  };

  return (
    <div className="flex min-h-full flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-5 py-14 sm:px-8">
        <div className="w-full max-w-2xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-foreground text-background">
              <span className="text-lg font-black">W.</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Create with WebEazy</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Start from a blank project or let AI build the first draft. You can edit everything yourself afterward.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="group rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md"
            >
              <div className="mb-8 flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <Plus className="size-5" />
              </div>
              <h2 className="text-base font-semibold">Create project</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Set up your project, then design it freely in the studio.</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                Start blank <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => openStudio()}
              className="group rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-md"
            >
              <div className="mb-8 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <Sparkles className="size-5" />
              </div>
              <h2 className="text-base font-semibold">Create with AI</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Describe your business and let WebEazy create an editable starting point.</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-300">
                Open AI Studio <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FolderOpen className="size-4" />
              <span>{store.bundle ? <>Open: <strong className="text-foreground">{store.bundle.manifest.name}</strong></> : "No project open"}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => void store.openFromPicker()}>
                {store.capabilities.nativePicker ? "Open project" : "Open workspace"}
              </Button>
              {store.bundle && <Button size="sm" variant="outline" onClick={() => openStudio(store.bundle?.manifest.name)}>Open in Studio</Button>}
            </div>
          </div>

          {store.recents.length > 0 && (
            <div className="mt-8">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recent projects</div>
              <RecentProjectsPanel onNewProject={() => setWizardOpen(true)} />
            </div>
          )}
        </div>
      </main>

      <NewProjectWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={(name) => openStudio(name)}
      />
      {studioOpen && <HackathonStudio initialBusinessName={studioProjectName} onClose={() => setStudioOpen(false)} />}
    </div>
  );
}
