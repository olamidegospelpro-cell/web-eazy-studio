/**
 * AnimationService — global motion tokens.
 * `enabled: false` zeroes every duration so the whole product (and exported
 * sites) can honour reduced-motion without touching component code.
 */
import type { AnimationTokens, ThemeDocument } from "./types";

export const EASING_PRESETS: { label: string; value: string }[] = [
  { label: "Standard", value: "cubic-bezier(0.4, 0, 0.2, 1)" },
  { label: "Ease out", value: "cubic-bezier(0, 0, 0.2, 1)" },
  { label: "Ease in", value: "cubic-bezier(0.4, 0, 1, 1)" },
  { label: "Snappy", value: "cubic-bezier(0.2, 0.9, 0.2, 1)" },
  { label: "Linear", value: "linear" },
];

export const AnimationService = {
  update(theme: ThemeDocument, patch: Partial<AnimationTokens>): ThemeDocument {
    return { ...theme, animation: { ...theme.animation, ...patch } };
  },

  duration(animation: AnimationTokens, speed: "fast" | "base" | "slow" = "base"): number {
    if (!animation.enabled) return 0;
    return speed === "fast"
      ? animation.durationFast
      : speed === "slow"
        ? animation.durationSlow
        : animation.duration;
  },

  transition(
    animation: AnimationTokens,
    properties = "all",
    speed: "fast" | "base" | "slow" = "base",
  ): string {
    return `${properties} ${AnimationService.duration(animation, speed)}ms ${animation.easing}`;
  },
};
