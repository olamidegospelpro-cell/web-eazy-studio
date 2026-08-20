import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme, type Theme } from "@/lib/theme";
import {
  ShortcutService,
  PreferencesService,
  formatAccelerator,
  log,
  useUi,
  NotificationService,
  type LogLevel,
} from "@/lib/core";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · WebEazy" },
      {
        name: "description",
        content: "Configure appearance, panels, shortcuts and logging in WebEazy.",
      },
      { property: "og:title", content: "Settings · WebEazy" },
      {
        property: "og:description",
        content: "Configure appearance, panels, shortcuts and logging in WebEazy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error", "silent"];

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const ui = useUi();
  const [shortcuts, setShortcuts] = useState<ReturnType<typeof ShortcutService.list>>([]);

  // Shortcuts register after mount, so read them on the client.
  useEffect(() => setShortcuts(ShortcutService.list()), []);

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
                onClick={() => {
                  setTheme(o.value);
                  ui.setPreferences({ theme: o.value });
                }}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </SectionCard>

        <SectionCard interactive={false}>
          <h2 className="text-sm font-semibold">Workspace layout</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Panel sizes and visibility are remembered between sessions.
          </p>
          <div className="mt-4 grid gap-3">
            {[
              {
                key: "leftSidebarCollapsed" as const,
                label: "Collapse left sidebar",
                value: ui.layout.leftSidebarCollapsed,
              },
              {
                key: "rightPanelVisible" as const,
                label: "Show properties panel",
                value: ui.layout.rightPanelVisible,
              },
              {
                key: "bottomPanelOpen" as const,
                label: "Show bottom panel",
                value: ui.layout.bottomPanelOpen,
              },
              {
                key: "statusBarVisible" as const,
                label: "Show status bar",
                value: ui.layout.statusBarVisible,
              },
            ].map((row) => (
              <label key={row.key} className="flex items-center justify-between text-sm">
                <span>{row.label}</span>
                <Switch
                  checked={row.value}
                  onCheckedChange={(checked) => ui.setLayout({ [row.key]: checked })}
                />
              </label>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              PreferencesService.reset();
              NotificationService.success("Preferences reset to defaults");
            }}
          >
            Reset all preferences
          </Button>
        </SectionCard>

        <SectionCard interactive={false}>
          <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Registered globally. Custom bindings become editable in a later milestone.
          </p>
          <ul className="mt-4 divide-y divide-border text-sm">
            {shortcuts.map((shortcut) => (
              <li
                key={`${shortcut.id}-${shortcut.accelerator}`}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-muted-foreground">{shortcut.description}</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  {formatAccelerator(shortcut.accelerator)}
                </kbd>
              </li>
            ))}
            {shortcuts.length === 0 && (
              <li className="py-1.5 text-xs text-muted-foreground">Loading…</li>
            )}
          </ul>
        </SectionCard>

        <SectionCard interactive={false}>
          <h2 className="text-sm font-semibold">Diagnostics</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Log level for the Console tab. Production builds default to warnings only.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {LOG_LEVELS.map((level) => (
              <Button
                key={level}
                size="sm"
                variant={ui.preferences.logging.level === level ? "default" : "outline"}
                onClick={() => {
                  ui.setPreferences({ logging: { level } });
                  log.setLevel(level);
                }}
              >
                {level}
              </Button>
            ))}
          </div>
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
