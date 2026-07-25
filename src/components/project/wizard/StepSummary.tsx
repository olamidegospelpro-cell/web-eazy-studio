/** Step 4 — summary with jump-back-to-edit links. */
import { Pencil } from "lucide-react";
import { Button } from "@/components/ds";
import { TemplateService, WEBSITE_TYPES } from "@/lib/project";
import { ThemePreview } from "./ThemePreview";
import type { StepProps } from "./types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="max-w-[60%] break-words text-right text-xs font-medium">{value || "—"}</span>
    </div>
  );
}

function Block({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xs font-semibold">{title}</h3>
        <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 px-2 text-[11px]">
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      </div>
      {children}
    </section>
  );
}

export function StepSummary({
  draft,
  goToStep,
}: StepProps & { goToStep: (step: number) => void }) {
  const template = TemplateService.get(draft.templateId);
  const websiteType = WEBSITE_TYPES.find((t) => t.value === draft.websiteType)?.label ?? draft.websiteType;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="grid gap-3">
        <Block title="Project details" onEdit={() => goToStep(1)}>
          <Row label="Project name" value={draft.name} />
          <Row label="Website name" value={draft.websiteName || draft.name} />
          <Row label="Description" value={draft.description} />
          <Row label="Author" value={draft.author} />
          <Row label="Version" value={draft.version} />
          <Row label="Website type" value={websiteType} />
          <Row label="Template" value={template.name} />
          <Row label="Pages" value={template.pages.join(", ")} />
        </Block>

        <Block title="Theme colors" onEdit={() => goToStep(2)}>
          <div className="mt-1 flex flex-wrap gap-2">
            {Object.entries(draft.theme.colors).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
                <span className="h-3 w-3 rounded-sm border border-border" style={{ background: value }} />
                <span className="text-[10px] capitalize text-muted-foreground">{key}</span>
                <span className="font-mono text-[10px]">{value}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Typography" onEdit={() => goToStep(3)}>
          <Row label="Heading" value={draft.theme.fonts.heading} />
          <Row label="Body" value={draft.theme.fonts.body} />
          <Row label="Button" value={draft.theme.fonts.button} />
          <Row label="Fallback" value={draft.theme.fonts.fallback} />
        </Block>

        <p className="text-[11px] text-muted-foreground">
          WebEazy will ask where to store the project the first time you save it.
        </p>
      </div>

      <div className="lg:sticky lg:top-0 lg:self-start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Live preview</p>
        <ThemePreview theme={draft.theme} />
      </div>
    </div>
  );
}
