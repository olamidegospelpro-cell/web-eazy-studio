/**
 * SpacingService — spacing tokens and the derived step scale.
 * Layout code should ask for a *token* (`md`, `sectionPadding`) or a step,
 * never a raw pixel number.
 */
import type { SpacingTokens, ThemeDocument } from "./types";

export const SPACING_TOKEN_KEYS = [
  "sm",
  "md",
  "lg",
  "xl",
  "componentPadding",
  "sectionPadding",
  "containerWidth",
  "pageMargin",
] as const satisfies readonly (keyof SpacingTokens)[];

export const SpacingService = {
  /** step(3) with base 4 → 12px. */
  step(spacing: SpacingTokens, step: number): number {
    return Math.round(spacing.base * step);
  },

  scale(spacing: SpacingTokens, steps = 10): number[] {
    return Array.from({ length: steps }, (_, i) => SpacingService.step(spacing, i));
  },

  px(spacing: SpacingTokens, key: keyof SpacingTokens): string {
    return `${spacing[key]}px`;
  },

  update(theme: ThemeDocument, patch: Partial<SpacingTokens>): ThemeDocument {
    return { ...theme, spacing: { ...theme.spacing, ...patch } };
  },
};
