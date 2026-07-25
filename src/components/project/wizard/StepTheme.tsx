/** Step 2 — global theme colors with a live preview. */
import { ThemeService } from "@/lib/project";
import { ColorField } from "./ColorField";
import { ThemePreview } from "./ThemePreview";
import type { StepProps } from "./types";

const COLOR_FIELDS: { key: keyof ReturnType<typeof keysHelper>; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "success", label: "Success" },
  { key: "warning", label: "Warning" },
  { key: "danger", label: "Danger" },
];

// Type helper so COLOR_FIELDS keys stay in sync with ThemeColors.
function keysHelper() {
  return ThemeService.create().colors;
}

export function StepTheme({ draft, patch }: StepProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="grid gap-3 sm:grid-cols-2">
        {COLOR_FIELDS.map((field) => (
          <ColorField
            key={field.key}
            label={field.label}
            value={draft.theme.colors[field.key]}
            onChange={(value) => patch({ theme: ThemeService.setColor(draft.theme, field.key, value) })}
          />
        ))}
      </div>
      <div className="lg:sticky lg:top-0 lg:self-start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Live preview</p>
        <ThemePreview theme={draft.theme} />
      </div>
    </div>
  );
}
