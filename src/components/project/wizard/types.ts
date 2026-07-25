/**
 * Shared shape of the New Project wizard draft.
 * Steps receive `draft` + `patch` and never touch services — the wizard's
 * parent converts the draft into a CreateProjectInput at the end.
 */
import type { ProjectTheme, WebsiteType } from "@/lib/project";

export interface WizardDraft {
  name: string;
  websiteName: string;
  description: string;
  author: string;
  version: string;
  websiteType: WebsiteType;
  templateId: string;
  theme: ProjectTheme;
}

export interface StepProps {
  draft: WizardDraft;
  patch: (patch: Partial<WizardDraft>) => void;
  errors: Partial<Record<keyof WizardDraft, string>>;
}

export const WIZARD_STEPS = [
  { id: 1, title: "Project details", hint: "Name, type and template" },
  { id: 2, title: "Theme", hint: "Global colors" },
  { id: 3, title: "Typography", hint: "Fonts from your system" },
  { id: 4, title: "Summary", hint: "Review and create" },
] as const;
