/**
 * Step 3 — typography.
 *
 * Fonts come from the user's machine (FontService): the Local Font Access API
 * when available, otherwise a permission-free probe of common system faces.
 * No font library is bundled, per project requirements.
 */
import { useEffect, useState } from "react";
import { Loader2, ScanSearch } from "lucide-react";
import { Button, FormField, Input } from "@/components/ds";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontService, ThemeService, type FontOption, type ThemeFonts } from "@/lib/project";
import { notify } from "@/components/ds/toast";
import { ThemePreview } from "./ThemePreview";
import type { StepProps } from "./types";

const FONT_ROLES: { key: keyof ThemeFonts; label: string; hint: string }[] = [
  { key: "heading", label: "Heading font", hint: "Titles and section headers." },
  { key: "body", label: "Body font", hint: "Paragraphs and long text." },
  { key: "button", label: "Button font", hint: "Buttons and small UI labels." },
];

export function StepTypography({ draft, patch }: StepProps) {
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    setFonts(FontService.probeSystemFonts());
  }, []);

  const scanInstalled = async () => {
    setScanning(true);
    try {
      setFonts(await FontService.requestLocalFonts());
      setScanned(true);
      notify.success("Installed fonts detected");
    } catch {
      notify.info(
        "Full font detection isn't available here",
        "WebEazy is using the fonts it could detect on your system instead.",
      );
    } finally {
      setScanning(false);
    }
  };

  const options = (current: string) =>
    fonts.some((f) => f.family === current) ? fonts : [{ family: current, source: "generic" as const }, ...fonts];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            {scanned
              ? `${fonts.length} fonts available from your system.`
              : `Detected ${fonts.length} fonts. Scan for the complete installed list.`}
          </p>
          <Button size="sm" variant="outline" onClick={scanInstalled} disabled={scanning}>
            {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
            Detect installed fonts
          </Button>
        </div>

        {FONT_ROLES.map((role) => (
          <FormField key={role.key} label={role.label} hint={role.hint}>
            <Select
              value={draft.theme.fonts[role.key]}
              onValueChange={(value) => patch({ theme: ThemeService.setFont(draft.theme, role.key, value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {options(draft.theme.fonts[role.key]).map((font) => (
                  <SelectItem key={`${role.key}-${font.family}`} value={font.family}>
                    <span style={{ fontFamily: `"${font.family}", sans-serif` }}>{font.family}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ))}

        <FormField
          label="Fallback stack"
          hint="Used when a font is unavailable on a visitor's device."
        >
          <Input
            value={draft.theme.fonts.fallback}
            onChange={(e) => patch({ theme: ThemeService.setFont(draft.theme, "fallback", e.target.value) })}
            className="font-mono text-[11px]"
            spellCheck={false}
          />
        </FormField>
      </div>

      <div className="lg:sticky lg:top-0 lg:self-start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Live preview</p>
        <ThemePreview theme={draft.theme} />
      </div>
    </div>
  );
}
