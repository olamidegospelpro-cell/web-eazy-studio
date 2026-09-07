/**
 * New Project wizard — 4 steps, one dialog.
 *
 * The wizard collects project metadata and creates the in-memory project bundle.
 * The studio can then take over as the shared design surface.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button, Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from "@/components/ds";
import { cn } from "@/lib/utils";
import { ThemeService, useProject, projectSchemaHelpers } from "@/lib/project";
import { StepDetails } from "./StepDetails";
import { StepTheme } from "./StepTheme";
import { StepTypography } from "./StepTypography";
import { StepSummary } from "./StepSummary";
import { WIZARD_STEPS, type WizardDraft } from "./types";

function initialDraft(author: string): WizardDraft {
  return {
    name: "",
    websiteName: "",
    description: "",
    author,
    version: "1.0.0",
    websiteType: "custom",
    templateId: "blank",
    theme: ThemeService.create(),
  };
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

  const reset = () => {
    setStep(1);
    setDraft(initialDraft(preferences.defaultAuthor));
    setErrors({});
  };

  const next = () => {
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(4, s + 1));
  };

  const create = async () => {
    setCreating(true);
    try {
      await createProject({
        name: draft.name,
        websiteName: draft.websiteName,
        description: draft.description,
        author: draft.author,
        version: draft.version,
        websiteType: draft.websiteType,
        templateId: draft.templateId,
        theme: draft.theme,
        autosaveIntervalMs: preferences.autosaveIntervalMs,
      });
      const name = draft.websiteName.trim() || draft.name.trim() || "Untitled project";
      onOpenChange(false);
      reset();
      onCreated?.(name);
    } finally {
      setCreating(false);
    }
  };

  const stepProps = { draft, patch, errors };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) reset();
      }}
    >
      <DialogContent className="webeazy-wizard flex max-h-[calc(100dvh-24px)] h-[min(860px,calc(100dvh-24px))] w-[calc(100vw-24px)] max-w-5xl flex-col gap-0 overflow-hidden border p-0 shadow-2xl">
        <DialogHeader className="webeazy-wizard-header shrink-0 border-b px-5 py-4 pr-12">
          <DialogTitle className="text-base">New project</DialogTitle>
          <DialogDescription className="text-xs">
            Step {step} of 4 · {WIZARD_STEPS[step - 1].hint}
          </DialogDescription>
        </DialogHeader>

        <ol className="webeazy-wizard-steps flex shrink-0 items-center gap-1 border-b px-5 py-3">
          {WIZARD_STEPS.map((s) => {
            const done = s.id < step;
            const active = s.id === step;
            return (
              <li key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => s.id < step && setStep(s.id)}
                  disabled={s.id > step}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "webeazy-wizard-step flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                    active && "webeazy-wizard-step-active",
                    done && "webeazy-wizard-step-done",
                    !active && !done && "webeazy-wizard-step-upcoming",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                </button>
                <span
                  className={cn(
                    "hidden truncate text-[11px] sm:block",
                    active ? "font-semibold" : "text-muted-foreground",
                  )}
                >
                  {s.title}
                </span>
                {s.id < 4 && <span className="h-px min-w-2 flex-1 bg-border" />}
              </li>
            );
          })}
        </ol>

        <div className="webeazy-wizard-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {step === 1 && <StepDetails {...stepProps} />}
          {step === 2 && <StepTheme {...stepProps} />}
          {step === 3 && <StepTypography {...stepProps} />}
          {step === 4 && <StepSummary {...stepProps} goToStep={setStep} />}
        </div>

        <div className="webeazy-wizard-footer flex shrink-0 items-center justify-between gap-2 border-t px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || creating}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          {step < 4 ? (
            <Button size="sm" onClick={next} className="webeazy-wizard-primary">
              Continue
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={create} disabled={creating} className="webeazy-wizard-primary">
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Create project
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
