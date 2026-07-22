import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · WebEazy" },
      { name: "description", content: "Configure appearance and preferences for WebEazy." },
      { property: "og:title", content: "Settings · WebEazy" },
      { property: "og:description", content: "Configure appearance and preferences for WebEazy." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <div>
      <PageHeader title="Settings" description="Personalize how WebEazy looks and behaves." />
      <div className="grid max-w-3xl gap-4 px-8 py-8">
        <SectionCard interactive={false}>
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a theme. System follows your OS preference.
          </p>
          <div className="mt-4 flex gap-2">
            {options.map((o) => (
              <Button
                key={o.value}
                size="sm"
                variant={theme === o.value ? "default" : "outline"}
                onClick={() => setTheme(o.value)}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </SectionCard>

        <SectionCard interactive={false}>
          <h2 className="text-sm font-semibold">Editor</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Editor preferences will appear here in the next milestone.
          </p>
        </SectionCard>

        <SectionCard interactive={false}>
          <h2 className="text-sm font-semibold">Storage</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Projects are stored locally. Cloud sync is intentionally out of scope.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
