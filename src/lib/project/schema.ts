/**
 * Zod schemas — the single source of truth for what a valid WebEazy
 * document looks like. ValidationService and the open-project flow both
 * run these, so a project written by any version can be checked identically.
 *
 * Unknown keys are preserved via `extensions` (forward compatibility);
 * anything else unknown is stripped rather than rejected so newer files
 * degrade gracefully instead of failing to open.
 */
import { z } from "zod";
import { PROJECT_SCHEMA_VERSION } from "./types";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Must be a hex color");

export const themeSchema = z.object({
  schemaVersion: z.number().int().positive(),
  name: z.string().min(1),
  colors: z.object({
    primary: hexColor,
    secondary: hexColor,
    accent: hexColor,
    background: hexColor,
    surface: hexColor,
    text: hexColor,
    success: hexColor,
    warning: hexColor,
    danger: hexColor,
  }),
  fonts: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
    button: z.string().min(1),
    fallback: z.string().min(1),
  }),
  spacing: z.object({ base: z.number().positive(), scale: z.array(z.number()) }),
  radius: z.object({
    sm: z.number(),
    md: z.number(),
    lg: z.number(),
    pill: z.number(),
  }),
  shadow: z.object({ sm: z.string(), md: z.string(), lg: z.string() }),
  animation: z.object({ duration: z.number(), easing: z.string() }),
  extensions: z.record(z.unknown()).default({}),
});

export const pageRefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  file: z.string().min(1),
  isHome: z.boolean(),
});

export const assetRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  file: z.string(),
  type: z.enum(["image", "video", "font", "icon", "other"]),
});

export const pluginRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  enabled: z.boolean(),
});

export const locationSchema = z.object({
  kind: z.enum(["native", "virtual"]),
  path: z.string(),
  handleId: z.string().optional(),
});

export const manifestSchema = z.object({
  schemaVersion: z.number().int().positive(),
  id: z.string().min(1),
  name: z.string().min(1),
  websiteName: z.string().default(""),
  description: z.string().default(""),
  author: z.string().default(""),
  version: z.string().default("1.0.0"),
  websiteType: z
    .enum(["landing", "portfolio", "business", "blog", "docs", "store", "custom"])
    .default("custom"),
  templateId: z.string().default("blank"),
  createdAt: z.string(),
  lastModified: z.string(),
  theme: z.string().default("theme.json"),
  pages: z.array(pageRefSchema).min(1, "A project needs at least one page"),
  assets: z.array(assetRefSchema).default([]),
  plugins: z.array(pluginRefSchema).default([]),
  settings: z.object({
    location: locationSchema.optional(),
    autosave: z.object({ enabled: z.boolean(), intervalMs: z.number().int().positive() }),
    backups: z.object({
      enabled: z.boolean(),
      frequency: z.enum(["onSave", "hourly", "daily", "never"]),
    }),
    sync: z.object({ provider: z.literal("none"), lastSyncedAt: z.string().optional() }).optional(),
  }),
  app: z.object({ name: z.string(), version: z.string() }),
  extensions: z.record(z.unknown()).default({}),
});

/**
 * Page files store the editor document under `document`.
 * Keep the document payload opaque here; the editor owns its detailed
 * document schema, while this project layer validates the page envelope.
 */
export const pageSchema = z.object({
  schemaVersion: z.number().int().positive(),
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().default(""),
  description: z.string().default(""),
  document: z.unknown(),
  createdAt: z.string(),
  lastModified: z.string(),
});

/** Newer major schema versions cannot be opened safely. */
export function isVersionSupported(version: number): boolean {
  return version <= PROJECT_SCHEMA_VERSION;
}

export const projectNameSchema = z
  .string()
  .trim()
  .min(2, "Project name must be at least 2 characters")
  .max(60, "Keep the project name under 60 characters")
  .regex(/^[^<>:\"/\\|?*]+$/, 'Avoid the characters < > : " / \\ | ? *');

export const semverSchema = z
  .string()
  .trim()
  .regex(/^\d+\.\d+\.\d+$/, "Use a semver value like 1.0.0");
