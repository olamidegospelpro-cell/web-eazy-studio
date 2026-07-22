/**
 * Home screen — landing surface when no project is open.
 *
 * Actions here are visual only in milestone 1 (New Project, Open, etc.);
 * they'll be wired to the persistence service in milestone 2.
 */
import { FilePlus2, FolderOpen, Sparkles, Layout, Puzzle, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";

// Placeholder data. Later milestones read from IndexedDB / the recents service.
const recents: { name: string; path: string; updatedAt: string }[] = [];
const templates = [
  { id: "blank", name: "Blank", description: "Start from an empty canvas." },
  { id: "landing", name: "Landing page", description: "Hero, features, CTA." },
  { id: "portfolio", name: "Portfolio", description: "Personal showcase." },
  { id: "docs", name: "Docs site", description: "Sidebar + article layout." },
];

export function HomeScreen() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Welcome to WebEazy"
        description="Design beautiful websites faster — pick up where you left off or start fresh."
      />

      <div className="grid gap-8 px-8 py-8">
        {/* Primary actions */}
        <section className="grid gap-4 sm:grid-cols-2">
          <SectionCard>
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-brand/10 p-2 text-brand">
                <FilePlus2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">New project</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start a fresh WebEazy project from a blank canvas or template.
                </p>
                <Button size="sm" className="mt-3" disabled>
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
                  Import an existing <code className="text-[11px]">project.json</code> from disk.
                </p>
                <Button size="sm" variant="outline" className="mt-3" disabled>
                  Open from disk
                </Button>
              </div>
            </div>
          </SectionCard>
        </section>

        {/* Recents */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent projects</h2>
          </div>
          {recents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">No recent projects yet.</p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                Projects you create or open will show up here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recents.map((r) => (
                <SectionCard key={r.path}>
                  <h3 className="text-sm font-medium">{r.name}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{r.path}</p>
                  <p className="mt-2 text-xs text-muted-foreground/80">Updated {r.updatedAt}</p>
                </SectionCard>
              ))}
            </div>
          )}
        </section>

        {/* Templates */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Layout className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Templates</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t) => (
              <SectionCard key={t.id}>
                <div className="mb-3 flex aspect-video items-center justify-center rounded-md bg-gradient-to-br from-brand/10 to-brand-accent/10">
                  <Sparkles className="h-5 w-5 text-brand" />
                </div>
                <h3 className="text-sm font-medium">{t.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              </SectionCard>
            ))}
          </div>
        </section>

        {/* Shortcuts */}
        <section className="grid gap-3 sm:grid-cols-3">
          <Link to="/plugins" className="contents">
            <SectionCard>
              <div className="flex items-center gap-3">
                <Puzzle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">Plugins</h3>
                  <p className="text-xs text-muted-foreground">Extend WebEazy.</p>
                </div>
              </div>
            </SectionCard>
          </Link>
          <Link to="/settings" className="contents">
            <SectionCard>
              <div className="flex items-center gap-3">
                <Layout className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">Settings</h3>
                  <p className="text-xs text-muted-foreground">Theme, editor, general.</p>
                </div>
              </div>
            </SectionCard>
          </Link>
          <Link to="/about" className="contents">
            <SectionCard>
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">About</h3>
                  <p className="text-xs text-muted-foreground">Version and philosophy.</p>
                </div>
              </div>
            </SectionCard>
          </Link>
        </section>
      </div>
    </div>
  );
}
