import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Logo } from "@/components/branding/Logo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · WebEazy" },
      {
        name: "description",
        content:
          "WebEazy is a local-first visual website builder focused on simplicity and export freedom.",
      },
      { property: "og:title", content: "About · WebEazy" },
      {
        property: "og:description",
        content: "Local-first visual website builder — simplicity, speed, and export freedom.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <PageHeader title="About WebEazy" description="Design beautiful websites faster." />
      <div className="grid max-w-3xl gap-4 px-8 py-8">
        <SectionCard interactive={false}>
          <div className="flex items-center gap-3">
            <Logo size={40} showWordmark={false} />
            <div>
              <h2 className="text-sm font-semibold">WebEazy</h2>
              <p className="text-xs text-muted-foreground">Version 0.1.0 · Milestone 1 (Shell)</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard interactive={false}>
          <h2 className="text-sm font-semibold">Philosophy</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Local ownership — your projects live on your machine.</li>
            <li>Export freedom — plain HTML/CSS and portable JSON.</li>
            <li>Simple, focused UI — no clutter, no bloat.</li>
            <li>Extensible — plugin-ready from day one.</li>
          </ul>
        </SectionCard>

        <SectionCard interactive={false}>
          <h2 className="text-sm font-semibold">Stack</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            React · TypeScript · Vite · Tailwind CSS · Zustand · IndexedDB · Monaco · Tauri.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
