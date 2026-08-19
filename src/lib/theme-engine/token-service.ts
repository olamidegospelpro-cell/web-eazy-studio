/**
 * TokenService — flattening, lookup and reference resolution.
 *
 * Tokens may point at other color tokens using `{colors.primary}`. Resolution
 * happens once per theme+mode here, so the style generator and any inspector
 * always see literal values. References are single-level by design (a chain
 * longer than `MAX_DEPTH` is reported by ThemeValidator as a broken reference).
 */
import { ColorService } from "./color-service";
import type { ColorTokens, ThemeDocument, ThemeMode, TokenMap } from "./types";

const REF = /^\{colors\.([a-zA-Z]+)\}$/;
const MAX_DEPTH = 8;

export const TokenService = {
  isReference: (value: string) => REF.test(value?.trim() ?? ""),

  referenceTarget(value: string): string | null {
    const match = REF.exec(value?.trim() ?? "");
    return match ? match[1]! : null;
  },

  /** Resolves `{colors.x}` chains against a mode's palette. */
  resolveColor(value: string, palette: ColorTokens): string {
    let current = value;
    for (let depth = 0; depth < MAX_DEPTH; depth += 1) {
      const target = TokenService.referenceTarget(current);
      if (!target) return current;
      const next = (palette as Record<string, string | undefined>)[target];
      if (next === undefined) return current;
      current = next;
    }
    return current;
  },

  /** Palette with every reference expanded to a literal color. */
  resolvePalette(theme: ThemeDocument, mode: ThemeMode): ColorTokens {
    const palette = theme.colors[mode];
    const out = {} as ColorTokens;
    for (const [key, value] of Object.entries(palette) as [keyof ColorTokens, string][]) {
      out[key] = TokenService.resolveColor(value, palette);
    }
    return out;
  },

  /** Flat `name -> value` map, handy for token browsers and debugging. */
  flatten(theme: ThemeDocument, mode: ThemeMode): TokenMap {
    const palette = TokenService.resolvePalette(theme, mode);
    const map: TokenMap = {};
    for (const [key, value] of Object.entries(palette)) map[`colors.${key}`] = value;
    for (const [key, value] of Object.entries(theme.typography)) map[`typography.${key}`] = String(value);
    for (const [key, value] of Object.entries(theme.spacing)) map[`spacing.${key}`] = String(value);
    for (const [key, value] of Object.entries(theme.radius)) map[`radius.${key}`] = String(value);
    for (const [key, value] of Object.entries(theme.shadow)) map[`shadow.${key}`] = value;
    for (const [key, value] of Object.entries(theme.border))
      map[`border.${key}`] = TokenService.resolveColor(String(value), palette);
    for (const [key, value] of Object.entries(theme.animation)) map[`animation.${key}`] = String(value);
    return map;
  },

  get(theme: ThemeDocument, mode: ThemeMode, path: string): string | undefined {
    return TokenService.flatten(theme, mode)[path];
  },

  /** Derived helpers every component theme reuses (hover/active/subtle states). */
  derive(palette: ColorTokens, mode: ThemeMode) {
    const shift = (value: string, amount: number) =>
      mode === "dark" ? ColorService.lighten(value, amount) : ColorService.darken(value, amount);
    return {
      primaryHover: shift(palette.primary, 0.08),
      primaryActive: shift(palette.primary, 0.16),
      primaryFg: ColorService.readableOn(palette.primary),
      secondaryHover: shift(palette.secondary, 0.08),
      secondaryFg: ColorService.readableOn(palette.secondary),
      dangerHover: shift(palette.danger, 0.08),
      dangerFg: ColorService.readableOn(palette.danger),
      successHover: shift(palette.success, 0.08),
      successFg: ColorService.readableOn(palette.success),
      subtle: ColorService.withOpacity(palette.primary, 0.12),
      overlay: ColorService.withOpacity(mode === "dark" ? "#000000" : "#14161F", 0.5),
    };
  },
};
