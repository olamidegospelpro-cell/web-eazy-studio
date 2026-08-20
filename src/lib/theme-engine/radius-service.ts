/** RadiusService — corner radius tokens. */
import type { RadiusTokens, ThemeDocument } from "./types";

export const RADIUS_TOKEN_KEYS = [
  "sm",
  "md",
  "lg",
  "xl",
  "circular",
] as const satisfies readonly (keyof RadiusTokens)[];

export const RadiusService = {
  px(radius: RadiusTokens, key: keyof RadiusTokens): string {
    return `${radius[key]}px`;
  },

  update(theme: ThemeDocument, patch: Partial<RadiusTokens>): ThemeDocument {
    return { ...theme, radius: { ...theme.radius, ...patch } };
  },

  /** Scales every radius at once — used by "sharp / rounded / pill" presets. */
  scaleAll(radius: RadiusTokens, factor: number): RadiusTokens {
    return {
      sm: Math.round(radius.sm * factor),
      md: Math.round(radius.md * factor),
      lg: Math.round(radius.lg * factor),
      xl: Math.round(radius.xl * factor),
      circular: radius.circular,
    };
  },
};
