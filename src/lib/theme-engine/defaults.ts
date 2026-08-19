/**
 * Factory for a complete default ThemeDocument (light + dark).
 *
 * These values are the WebEazy house style: brand purple/blue, soft neutral
 * surfaces, flat modern shadows. Templates and imported themes override the
 * same structure, never a different one.
 */
import {
  THEME_ENGINE_VERSION,
  type ColorTokens,
  type ThemeDocument,
} from "./types";

export const LIGHT_COLORS: ColorTokens = {
  primary: "#6C4CF1",
  secondary: "#2563EB",
  accent: "#C026D3",
  background: "#FFFFFF",
  surface: "#F8F9FC",
  canvas: "#EEF0F7",
  border: "#E3E6F0",
  divider: "#EDEFF6",
  textPrimary: "#14161F",
  textSecondary: "#4A4F62",
  textMuted: "#8A90A6",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  information: "#0284C7",
};

export const DARK_COLORS: ColorTokens = {
  primary: "#8B75F5",
  secondary: "#60A5FA",
  accent: "#E879F9",
  background: "#0F1117",
  surface: "#171A22",
  canvas: "#0B0D12",
  border: "#282C38",
  divider: "#22262F",
  textPrimary: "#F5F6FA",
  textSecondary: "#BFC4D4",
  textMuted: "#7E869B",
  success: "#4ADE80",
  warning: "#FBBF24",
  danger: "#F87171",
  information: "#38BDF8",
};

export const DEFAULT_FALLBACK_STACK =
  "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

export function createDefaultThemeDocument(overrides?: Partial<ThemeDocument>): ThemeDocument {
  const now = new Date().toISOString();
  return {
    engineVersion: THEME_ENGINE_VERSION,
    meta: {
      name: "WebEazy Default",
      author: "",
      description: "Default WebEazy theme — modern, minimal, flat.",
      version: "1.0.0",
      createdAt: now,
      updatedAt: now,
    },
    defaultMode: "light",
    colors: { light: { ...LIGHT_COLORS }, dark: { ...DARK_COLORS } },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      buttonFont: "Inter",
      codeFont: "JetBrains Mono",
      fallback: DEFAULT_FALLBACK_STACK,
      baseFontSize: 16,
      headingScale: 1.25,
      lineHeight: 1.6,
      letterSpacing: 0,
      weightBody: 400,
      weightHeading: 600,
      weightButton: 500,
    },
    spacing: {
      base: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 40,
      componentPadding: 16,
      sectionPadding: 64,
      containerWidth: 1200,
      pageMargin: 24,
    },
    radius: { sm: 4, md: 8, lg: 16, xl: 24, circular: 999 },
    shadow: {
      sm: "0 1px 2px rgba(16,18,27,0.06)",
      md: "0 4px 12px rgba(16,18,27,0.08)",
      lg: "0 16px 40px rgba(16,18,27,0.12)",
      panel: "0 8px 24px rgba(16,18,27,0.10)",
      dialog: "0 24px 64px rgba(16,18,27,0.22)",
      focus: "0 0 0 3px rgba(108,76,241,0.35)",
    },
    border: {
      width: 1,
      style: "solid",
      color: "{colors.border}",
      hoverColor: "{colors.textMuted}",
      focusColor: "{colors.primary}",
    },
    animation: {
      duration: 200,
      durationFast: 120,
      durationSlow: 360,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      enabled: true,
    },
    extensions: {},
    ...overrides,
  };
}
