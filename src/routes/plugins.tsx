import { createFileRoute } from "@tanstack/react-router";
import { Puzzle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";

export const Route = createFileRoute("/plugins")({
  head: () => ({
    meta: [
      { title: "Plugins · WebEazy" },
      { name: "description", content: "Discover and manage WebEazy plugins." },
      { property: "og:title", content: "Plugins · WebEazy" },
      { property: "og:description", content: "Discover and manage WebEazy plugins." },
    ],
  }),
  component: PluginsPage,
});

function PluginsPage() {
  return (
    <div>
      <PageHeader
        title="Plugins"
        description="Extend WebEazy with widgets, sections, exporters, and integrations."
      />
      <div className="px-8 py-8">
        <SectionCard interactive={false} className="items-center text-center">
          <div className="mx-auto mb-3 rounded-md bg-accent p-3">
            <Puzzle className="h-6 w-6 text-brand" />
          </div>
          <h2 className="text-sm font-semibold">Plugin marketplace coming soon</h2>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            The plugin system is designed into the architecture from day one. Discovery,
            installation, and management surfaces land in a later milestone.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
