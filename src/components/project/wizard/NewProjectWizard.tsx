/**
 * New Project wizard — 4 steps, one dialog.
 *
 * The wizard collects project metadata and creates the in-memory project bundle.
 * The studio can then take over as the shared design surface.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ds";
import { cn } from "@/lib/utils";
import { ThemeService, useProject, projectSchemaHelpers } from "@/lib/project";
import { StepDetails } from "./StepDetails";
import { StepTheme } from "./StepTheme";
import { StepTypography } from "./StepTypography";
import { StepSummary } from "./StepSummary";
import { WIZARD_STEPS, type WizardDraft } from "./types";

function initialDraft(author: string): WizardDraft {
  return { name: "", websiteName: "", description: "", author, version: "1.0.0", websiteType: "custom", templateId: "blank", theme: ThemeService.create() };
}

export function NewProjectWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectName: string) => void;
}) {
  const { createProject, preferences } = useProject();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<WizardDraft>(() => initialDraft(preferences.defaultAuthor));
  const [errors, setErrors] = useState<Partial<Record<keyof WizardDraft, string>>>({});
  const [creating, setCreating] = useState(false);
  const patch = (next: Partial<WizardDraft>) => setDraft((prev) => ({ ...prev, ...next }));
  const stepErrors = useMemo(() => {
    if (step !== 1) return {};
    const found: Partial<Record<keyof WizardDraft, string>> = {};
    const name = projectSchemaHelpers.projectName.safeParse(draft.name);
    const version = projectSchemaHelpers.semver.safeParse(draft.version);
    if (!name.success) found.name = name.error.issues[0]?.message;
    if (!version.success) found.version = version.error.issues[0]?.message;
    return found;
  }, [draft.name, draft.version, step]);
  const reset = () => { setStep(1); setDraft(initialDraft(preferences.defaultAuthor)); setErrors({}); };
  const next = () => { if (Object.keys(stepErrors).length) { setErrors(stepErrors); return; } setErrors({}); setStep((s) => Math.min(4, s + 1)); };
  const create = async () => {
    setCreating(true);
    try {
      await createProject({ name: draft.name, websiteName: draft.websiteName, description: draft.description, author: draft.author, version: draft.version, websiteType: draft.websiteType, templateId: draft.templateId, theme: draft.theme, autosaveIntervalMs: preferences.autosaveIntervalMs });
      const name = draft.websiteName.trim() || draft.name.trim() || "Untitled project";
      onOpenChange(false);
      reset();
      onCreated?.(name);
    } finally { setCreating(false); }
  };
  const stepProps = { draft, patch, errors };
  return (
    <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); if (!value) reset(); }}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-5 py-4"><DialogTitle className="text-base">New project</DialogTitle><DialogDescription className="text-xs">Step {step} of 4 · {WIZARD_STEPS[step - 1].hint}</DialogDescription></DialogHeader>
        <ol className="flex shrink-0 items-center gap-1 border-b border-border bg-muted/30 px-5 py-2.5">
          {WIZARD_STEPS.map((s) => { const done = s.id < step, active = s.id === step; return <li key={s.id} className="flex flex-1 items-center gap-2"><button type="button" onClick={() => s.id < step && setStep(s.id)} disabled={s.id > step} className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-colors", active && "border-brand bg-brand text-brand-foreground", done && "border-brand/40 bg-brand/10 text-brand", !active && !done && "border-border text-muted-foreground")}>{done ? <Check className="h-3 w-3" /> : s.id}</button><span className={cn("hidden truncate text-[11px] sm:block", active ? "font-medium text-foreground" : "text-muted-foreground")}>{s.title}</span>{s.id < 4 && <span className="h-px flex-1 bg-border" />}</li>; })}
        </ol>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {step === 1 && <StepDetails {...stepProps} />}{step === 2 && <StepTheme {...stepProps} />}{step === 3 && <StepTypography {...stepProps} />}{step === 4 && <StepSummary {...stepProps} goToStep={setStep} />}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || creating}><ArrowLeft className="h-3.5 w-3.5" />Back</Button>
          {step < 4 ? <Button size="sm" onClick={next}>Continue<ArrowRight className="h-3.5 w-3.5" /></Button> : <Button size="sm" onClick={create} disabled={creating}>{creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Create project</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
