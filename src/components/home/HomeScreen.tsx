/**
 * Home screen — the project management surface.
 * All actions are wired to the project store; no editor functionality here.
 */
import { useEffect, useState } from "react";
import {
  FilePlus2,
  FolderOpen,
  Layout,
  Puzzle,
  Clock,
  Settings,
  Info,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { NewProjectWizard } from "@/components/project/wizard/NewProjectWizard";
import { RecentProjectsPanel } from "@/components/project/RecentProjectsPanel";
import { Surface } from "@/components/ds/cards";
import { TemplateService, useProject } from "@/lib/project";

export function HomeScreen() {
  const store = useProject();
  const [wizardOpen, setWizardOpen] = useState(false);

  // The "New Project" command (palette / Ctrl+N) opens the wizard through the
  // shared window event so no global state is needed for a one-shot action.
  useEffect(() => {
    const open = () => setWizardOpen(true);
    window.addEventListener("webeazy:new-project", open);
    return () => window.removeEventListener("webeazy:new-project", open);
  }, []);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Welcome to WebEazy"
        description="Design beautiful websites faster — pick up where you left off or start fresh."
        actions={
          store.bundle ? (
            <span className="text-xs text-muted-foreground">
              Open:{" "}
              <span className="font-medium text-foreground">{store.bundle.manifest.name}</span>
            </span>
          ) : undefined
        }
      />

      <div className="grid gap-8 px-8 py-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <SectionCard>
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-brand/10 p-2 text-brand">
                <FilePlus2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">New project</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Name it, choose a theme and fonts, then create.
                </p>
                <Button size="sm" className="mt-3" onClick={() => setWizardOpen(true)}>
                  Create project
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-brand-accent/10 p-2 text-brand-accent">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">Open project</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Browse to a folder containing <code className="text-[11px]">project.json</code>.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => void store.openFromPicker()}
                >
                  {store.capabilities.nativePicker ? "Open from disk" : "Open from workspace"}
                </Button>
              </div>
            </div>
          </SectionCard>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent projects</h2>
          </div>
          <RecentProjectsPanel onNewProject={() => setWizardOpen(true)} />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Layout className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Templates</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TemplateService.list().map((t) => (
              <Surface key={t.id} onClick={() => setWizardOpen(true)} className="p-4">
                <div className="mb-3 flex aspect-video items-center justify-center rounded-md bg-gradient-to-br from-brand/10 to-brand-accent/10">
                  <Sparkles className="h-5 w-5 text-brand" />
                </div>
                <h3 className="text-sm font-medium">{t.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { to: "/plugins", label: "Plugins", hint: "Extend WebEazy.", icon: Puzzle },
            {
              to: "/settings",
              label: "Settings",
              hint: "Saving, autosave, theme.",
              icon: Settings,
            },
            { to: "/about", label: "About", hint: "Version and philosophy.", icon: Info },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="contents">
              <SectionCard>
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="text-sm font-medium">{item.label}</h3>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                </div>
              </SectionCard>
            </Link>
          ))}
        </section>
      </div>

      <NewProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
