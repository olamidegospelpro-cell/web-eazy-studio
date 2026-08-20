/**
 * Domain types for the WebEazy project management system.
 *
 * These types describe data on disk (project.json, theme.json, pages/*.json)
 * and deliberately avoid UI concerns. The page document now references the
 * versioned editor document so project storage and the editor share one schema.
 */

import type { EditorDocument } from "@/lib/editor";

export const APP_NAME = "WebEazy";
export const APP_VERSION = "0.3.0";
export const PROJECT_SCHEMA_VERSION = 1;

export type WebsiteType = "landing" | "portfolio" | "business" | "blog" | "docs" | "store" | "custom";

export const WEBSITE_TYPES: { value: WebsiteType; label: string; hint: string }[] = [
  { value: "landing", label: "Landing page", hint: "Single-page marketing site" },
  { value: "portfolio", label: "Portfolio", hint: "Personal or studio showcase" },
  { value: "business", label: "Business site", hint: "Multi-page company website" },
  { value: "blog", label: "Blog", hint: "Article-driven site" },
  { value: "docs", label: "Documentation", hint: "Sidebar + article layout" },
  { value: "store", label: "Store", hint: "Product-oriented site" },
  { value: "custom", label: "Custom", hint: "Start from scratch" },
];

export type LocationKind = "native" | "virtual";

export interface ProjectLocation {
  kind: LocationKind;
  path: string;
  handleId?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  success: string;
  warning: string;
  danger: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  button: string;
  fallback: string;
}

export interface ProjectTheme {
  schemaVersion: number;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: { base: number; scale: number[] };
  radius: { sm: number; md: number; lg: number; pill: number };
  shadow: { sm: string; md: string; lg: string };
  animation: { duration: number; easing: string };
  extensions: Record<string, unknown>;
}

export interface PageRef {
  id: string;
  name: string;
  slug: string;
  file: string;
  isHome: boolean;
}

export interface AssetRef {
  id: string;
  name: string;
  file: string;
  type: "image" | "video" | "font" | "icon" | "other";
}

export interface PluginRef {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
}

export interface ProjectSettingsBlock {
  location?: ProjectLocation;
  autosave: { enabled: boolean; intervalMs: number };
  backups: { enabled: boolean; frequency: "onSave" | "hourly" | "daily" | "never" };
  sync?: { provider: "none"; lastSyncedAt?: string };
}

export interface ProjectManifest {
  schemaVersion: number;
  id: string;
  name: string;
  websiteName: string;
  description: string;
  author: string;
  version: string;
  websiteType: WebsiteType;
  templateId: string;
  createdAt: string;
  lastModified: string;
  theme: string;
  pages: PageRef[];
  assets: AssetRef[];
  plugins: PluginRef[];
  settings: ProjectSettingsBlock;
  app: { name: string; version: string };
  extensions: Record<string, unknown>;
}

export interface PageDocument {
  schemaVersion: number;
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  document: EditorDocument;
  createdAt: string;
  lastModified: string;
}

export interface ProjectBundle {
  manifest: ProjectManifest;
  theme: ProjectTheme;
  pages: PageDocument[];
  location?: ProjectLocation;
}

export interface RecentProject {
  id: string;
  name: string;
  websiteName: string;
  websiteType: WebsiteType;
  location: ProjectLocation;
  createdAt: string;
  lastOpened: string;
  thumbnail?: string;
}

export interface AppPreferences {
  defaultSaveFolder?: ProjectLocation;
  autosaveEnabled: boolean;
  autosaveIntervalMs: number;
  recentLimit: number;
  backupFrequency: ProjectSettingsBlock["backups"]["frequency"];
  language: string;
  defaultAuthor: string;
}

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export interface ValidationIssue {
  level: "error" | "warning";
  code: string;
  message: string;
  suggestion?: string;
}

export interface ValidationReport {
  ok: boolean;
  issues: ValidationIssue[];
}
