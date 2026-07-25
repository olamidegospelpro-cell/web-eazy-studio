/**
 * ThemeService — owns theme.json.
 *
 * Only reads/writes and derives CSS variables. It deliberately does NOT ship a
 * theme *editor*; that is the Theme Manager milestone. The wizard's live
 * preview uses `toCssVars` so previewing and exporting can never diverge.
 */
import { FileSystemService } from "./fs";
import { FILE_THEME } from "./layout";
import { createDefaultTheme } from "./defaults";
import { themeSchema } from "./schema";
import type { ProjectLocation, ProjectTheme } from "./types";

export const ThemeService = {
  create: createDefaultTheme,

  async read(location: ProjectLocation): Promise<ProjectTheme> {
    const parsed = themeSchema.safeParse(await FileSystemService.readJson(location, FILE_THEME));
    return parsed.success ? (parsed.data as ProjectTheme) : createDefaultTheme();
  },

  write(location: ProjectLocation, theme: ProjectTheme) {
    return FileSystemService.writeJson(location, FILE_THEME, theme);
  },

  update(theme: ProjectTheme, patch: Partial<ProjectTheme>): ProjectTheme {
    return { ...theme, ...patch };
  },

  setColor(theme: ProjectTheme, key: keyof ProjectTheme["colors"], value: string): ProjectTheme {
    return { ...theme, colors: { ...theme.colors, [key]: value } };
  },

  setFont(theme: ProjectTheme, key: keyof ProjectTheme["fonts"], value: string): ProjectTheme {
    return { ...theme, fonts: { ...theme.fonts, [key]: value } };
  },

  /** Maps a project theme to CSS custom properties for preview surfaces. */
  toCssVars(theme: ProjectTheme): Record<string, string> {
    return {
      "--wz-primary": theme.colors.primary,
      "--wz-secondary": theme.colors.secondary,
      "--wz-accent": theme.colors.accent,
      "--wz-background": theme.colors.background,
      "--wz-surface": theme.colors.surface,
      "--wz-text": theme.colors.text,
      "--wz-success": theme.colors.success,
      "--wz-warning": theme.colors.warning,
      "--wz-danger": theme.colors.danger,
      "--wz-font-heading": `${theme.fonts.heading}, ${theme.fonts.fallback}`,
      "--wz-font-body": `${theme.fonts.body}, ${theme.fonts.fallback}`,
      "--wz-font-button": `${theme.fonts.button}, ${theme.fonts.fallback}`,
      "--wz-radius-md": `${theme.radius.md}px`,
      "--wz-radius-lg": `${theme.radius.lg}px`,
      "--wz-shadow-md": theme.shadow.md,
    };
  },
};
