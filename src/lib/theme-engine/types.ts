/**
 * Theme Engine — data model.
 *
 * A `ThemeDocument` is the *only* source of appearance for websites built with
 * WebEazy. Every page, section and widget resolves its colors, fonts, spacing,
 * radii, shadows and motion from tokens defined here — nothing is hardcoded.
 *
 * Shape rules
 * -----------
 * - Plain JSON, human-readable and diff-friendly (it is persisted inside
 *   `theme.json` under the `engine` key).
 * - Two complete palettes (`light` / `dark`) share one structural token set, so
 *   switching modes never changes layout — only colors.
 * - Token values may reference another color token with `{colors.primary}`;
 *   `TokenService.resolve` expands references (see token-service.ts).
 * - `extensions` buckets exist at every level so plugins and future versions can
 *   add tokens without a migration.
 */

export const THEME_ENGINE_VERSION = 1;

export type ThemeMode = "light" | "dark";

/** Semantic color tokens. Values are hex (`#RRGGBB[AA]`) or `{colors.x}` refs. */
export interface ColorTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  canvas: string;
  border: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
  information: string;
}

export const COLOR_TOKEN_KEYS = [
  "primary",
  "secondary",
  "accent",
  "background",
  "surface",
  "canvas",
  "border",
  "divider",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "success",
  "warning",
  "danger",
  "information",
] as const satisfies readonly (keyof ColorTokens)[];

export interface TypographyTokens {
  headingFont: string;
  bodyFont: string;
  buttonFont: string;
  codeFont: string;
  fallback: string;
  /** px */
  baseFontSize: number;
  /** Multiplier between heading steps (1.125 – 1.5 typical). */
  headingScale: number;
  lineHeight: number;
  /** em */
  letterSpacing: number;
  weightBody: number;
  weightHeading: number;
  weightButton: number;
}

export interface SpacingTokens {
  /** px unit the scale is built from. */
  base: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  componentPadding: number;
  sectionPadding: number;
  containerWidth: number;
  pageMargin: number;
}

export interface RadiusTokens {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  circular: number;
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  panel: string;
  dialog: string;
  focus: string;
}

export interface BorderTokens {
  width: number;
  style: "solid" | "dashed" | "dotted" | "none";
  color: string;
  hoverColor: string;
  focusColor: string;
}

export interface AnimationTokens {
  /** ms */
  duration: number;
  durationFast: number;
  durationSlow: number;
  easing: string;
  enabled: boolean;
}

export interface ThemeMeta {
  name: string;
  author: string;
  description: string;
  /** Theme document version — semver, independent of `engineVersion`. */
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeDocument {
  engineVersion: number;
  meta: ThemeMeta;
  /** Default mode a website renders in. */
  defaultMode: ThemeMode;
  colors: Record<ThemeMode, ColorTokens>;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadow: ShadowTokens;
  border: BorderTokens;
  animation: AnimationTokens;
  extensions: Record<string, unknown>;
}

/** Flat token record used by the style generator and inspectors. */
export type TokenMap = Record<string, string>;

export type TokenGroup =
  "colors" | "typography" | "spacing" | "radius" | "shadow" | "border" | "animation";

export interface ThemeIssue {
  level: "error" | "warning";
  code: string;
  path: string;
  message: string;
  suggestion?: string;
}

export interface ThemeReport {
  ok: boolean;
  issues: ThemeIssue[];
}
