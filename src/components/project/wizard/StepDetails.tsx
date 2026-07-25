/** Step 1 — identity, website type and template. */
import { FormField, Input, Textarea } from "@/components/ds";
import { Surface } from "@/components/ds/cards";
import { TemplateService, WEBSITE_TYPES, type WebsiteType } from "@/lib/project";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StepProps } from "./types";

export function StepDetails({ draft, patch, errors }: StepProps) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project name" required error={errors.name} hint="Used for the folder name.">
          <Input
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="My website"
            maxLength={60}
            autoFocus
          />
        </FormField>
        <FormField label="Website name" hint="Shown as the site title.">
          <Input
            value={draft.websiteName}
            onChange={(e) => patch({ websiteName: e.target.value })}
            placeholder={draft.name || "My website"}
            maxLength={80}
          />
        </FormField>
      </div>

      <FormField label="Description" hint="A short summary of the site.">
        <Textarea
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={2}
          maxLength={280}
          placeholder="A portfolio site for my design work."
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Author">
          <Input
            value={draft.author}
            onChange={(e) => patch({ author: e.target.value })}
            placeholder="Your name"
            maxLength={80}
          />
        </FormField>
        <FormField label="Version" error={errors.version}>
          <Input
            value={draft.version}
            onChange={(e) => patch({ version: e.target.value })}
            placeholder="1.0.0"
            maxLength={14}
          />
        </FormField>
        <FormField label="Website type">
          <Select
            value={draft.websiteType}
            onValueChange={(value) => patch({ websiteType: value as WebsiteType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEBSITE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div>
        <p className="text-xs font-medium">Template</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TemplateService.list().map((template) => (
            <Surface
              key={template.id}
              selected={draft.templateId === template.id}
              onClick={() =>
                patch({
                  templateId: template.id,
                  websiteType: template.websiteType,
                  theme: {
                    ...draft.theme,
                    colors: { ...TemplateService.themeFor(template.id).colors },
                  },
                })
              }
              className="p-3"
            >
              <span className="text-sm font-medium">{template.name}</span>
              <span className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {template.description}
              </span>
              <span className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                {template.pages.length} page{template.pages.length > 1 ? "s" : ""}
              </span>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}
