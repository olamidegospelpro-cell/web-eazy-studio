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

  resolveColor(value: string, palette: ColorTokens): string {
    let current = value;
    for (let depth = 0; depth < MAX_DEPTH; depth += 1) {
      const target = TokenService.referenceTarget(current);
      if (!target) return current;
      const next = (palette as unknown as Record<string, string | undefined>)[target];
      if (next === undefined) return current;
      current = next;
    }
    return current;
  },

  resolvePalette(theme: ThemeDocument, mode: ThemeMode): ColorTokens {
    const palette = theme.colors[mode];
    const out = {} as ColorTokens;
    for (const [key, value] of Object.entries(palette) as [keyof ColorTokens, string][]) {
      out[key] = TokenService.resolveColor(value, palette);
    }
    return out;
  },

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
