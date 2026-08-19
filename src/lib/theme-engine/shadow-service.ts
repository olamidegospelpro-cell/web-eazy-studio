/**
 * ShadowService — elevation tokens.
 * Shadows are stored as raw CSS box-shadow strings so any effect is possible;
 * `build` exists so UI can offer simple numeric controls instead.
 */
import { ColorService } from "./color-service";
import type { ShadowTokens, ThemeDocument } from "./types";

export const SHADOW_TOKEN_KEYS = [
  "sm",
  "md",
  "lg",
  "panel",
  "dialog",
  "focus",
] as const satisfies readonly (keyof ShadowTokens)[];

export const ShadowService = {
  update(theme: ThemeDocument, patch: Partial<ShadowTokens>): ThemeDocument {
    return { ...theme, shadow: { ...theme.shadow, ...patch } };
  },

  build(opts: { y: number; blur: number; spread?: number; color: string; opacity: number }): string {
    const color = ColorService.withOpacity(opts.color, opts.opacity);
    return `0 ${opts.y}px ${opts.blur}px ${opts.spread ?? 0}px ${color}`;
  },

  focusRing(color: string, width = 3, opacity = 0.35): string {
    return `0 0 0 ${width}px ${ColorService.withOpacity(color, opacity)}`;
  },

  isValid(value: string): boolean {
    return value.trim() === "none" || /\d/.test(value);
  },
};
