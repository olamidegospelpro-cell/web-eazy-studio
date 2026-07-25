/**
 * Domain types for the WebEazy project management system.
 *
 * Architecture note
 * -----------------
 * These types describe *data on disk* (project.json, theme.json, pages/*.json)
 * and nothing about the editor UI. Everything is plain JSON so a project folder
 * stays human-readable and diff-friendly, and so a future cloud-sync layer
 * (V2) can transport the exact same documents without a translation step.
 *
 * `schemaVersion` fields exist on every document so ValidationService can
 * migrate or reject incompatible projects.
 */

export const APP_NAME = "WebEazy";
export const APP_VERSION = "0.2.0";
export const PROJECT_SCHEMA_VERSION = 1;

export type WebsiteType =
  | "landing"
  | "portfolio"
  | "business"
  | "blog"
  | "docs"
  | "store"
  | "custom";

export const WEBSITE_TYPES: { value: WebsiteType; label: string; hint: string }[] = [
  { value: "landing", label: "Landing page", hint: "Single-page marketing site" },
  { value: "portfolio", label: "Portfolio", hint: "Personal or studio showcase" },
  { value: "business", label: "Business site", hint: "Multi-page company website" },
  { value: "blog", label: "Blog", hint: "Article-driven site" },
  { value: "docs", label: "Documentation", hint: "Sidebar + article layout" },
  { value: "store", label: "Store", hint: "Product-oriented site" },
  { value: "custom", label: "Custom", hint: "Start from scratch" },
];

/* ------------------------------------------------------------------ *
 * Storage location
 * ------------------------------------------------------------------ */

/**
 * Where a project lives.
 *
 * `native` — a real folder chosen through the OS folder picker
 *            (File System Access API today, Tauri dialog later).
 * `virtual` — the built-in browser workspace (IndexedDB), used when the
 *            runtime has no folder picker. Same paths, same file layout.
 */
export type LocationKind = "native" | "virtual";

export interface ProjectLocation {
  kind: LocationKind;
  /** Human-readable folder path/name shown in the UI. */
  path: string;
  /** Key used to re-resolve a persisted directory handle (native only). */
  handleId?: string;
}

/* ------------------------------------------------------------------ *
 * Theme (theme.json)
 * ------------------------------------------------------------------ */

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
  /** Reserved for plugin-contributed theme tokens. */
  extensions: Record<string, unknown>;
}

/* ------------------------------------------------------------------ *
 * References stored in project.json
 * ------------------------------------------------------------------ */

export interface PageRef {
  id: string;
  name: string;
  slug: string;
  /** Relative path inside the project folder, e.g. "pages/home.json". */
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
  /** Reserved for V2 cloud sync — never populated in V1. */
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
  /** Relative reference — theme data itself lives in theme.json. */
  theme: string;
  pages: PageRef[];
  assets: AssetRef[];
  plugins: PluginRef[];
  settings: ProjectSettingsBlock;
  app: { name: string; version: string };
  /** Forward-compatibility bucket: unknown future fields survive round-trips. */
  extensions: Record<string, unknown>;
}

/* ------------------------------------------------------------------ *
 * Pages (pages/*.json)
 * ------------------------------------------------------------------ */

export interface PageDocument {
  schemaVersion: number;
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  /** Editor node tree — intentionally untyped until the editor milestone. */
  nodes: unknown[];
  createdAt: string;
  lastModified: string;
}

/** Everything needed to render/edit a project in memory. */
export interface ProjectBundle {
  manifest: ProjectManifest;
  theme: ProjectTheme;
  pages: PageDocument[];
  location?: ProjectLocation;
}

/* ------------------------------------------------------------------ *
 * Recents + app preferences (browser storage, not project files)
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * Save lifecycle
 * ------------------------------------------------------------------ */

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
