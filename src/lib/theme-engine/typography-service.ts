/**
 * TypographyService — global type settings and the derived heading scale.
 *
 * Fonts come from the user's machine (see `FontService`); WebEazy bundles no
 * font libraries. Heading sizes are always *derived* from `baseFontSize` and
 * `headingScale`, never stored, so changing one value restyles the whole site.
 */
import { FontService, type FontOption } from "@/lib/project";
import type { ThemeDocument, TypographyTokens } from "./types";

export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
export type HeadingLevel = (typeof HEADING_LEVELS)[number];

export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800] as const;

export const TypographyService = {
  /** Font family string including the fallback stack. */
  stack(typography: TypographyTokens, role: "heading" | "body" | "button" | "code"): string {
    const family =
      role === "heading"
        ? typography.headingFont
        : role === "button"
          ? typography.buttonFont
          : role === "code"
            ? typography.codeFont
            : typography.bodyFont;
    const fallback = role === "code" ? `${typography.fallback}, monospace` : typography.fallback;
    return `"${family}", ${fallback}`;
  },

  /** h1 is the largest: base * scale^(7 - level). */
  headingSize(typography: TypographyTokens, level: HeadingLevel): number {
    const steps = 7 - level;
    return Number((typography.baseFontSize * typography.headingScale ** steps).toFixed(2));
  },

  scale(typography: TypographyTokens): Record<`h${HeadingLevel}`, number> {
    return HEADING_LEVELS.reduce(
      (acc, level) => {
        acc[`h${level}`] = TypographyService.headingSize(typography, level);
        return acc;
      },
      {} as Record<`h${HeadingLevel}`, number>,
    );
  },

  update(theme: ThemeDocument, patch: Partial<TypographyTokens>): ThemeDocument {
    return { ...theme, typography: { ...theme.typography, ...patch } };
  },

  /** Fonts available without a permission prompt. */
  listSystemFonts(): FontOption[] {
    return FontService.probeSystemFonts();
  },

  /** Full installed-font list — requires a user gesture. */
  requestInstalledFonts(): Promise<FontOption[]> {
    return FontService.requestLocalFonts();
  },

  get supportsInstalledFonts() {
    return FontService.supportsLocalFonts;
  },

  /** A font is "valid" when the browser can actually render it. */
  isFontAvailable(family: string): boolean {
    if (typeof document === "undefined" || !("fonts" in document)) return true;
    try {
      return document.fonts.check(`12px "${family}"`);
    } catch {
      return true;
    }
  },
};
