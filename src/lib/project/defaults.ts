/**
 * Factory helpers for fresh project documents.
 * Kept separate from ProjectService so templates and tests can reuse them.
 */
import {
  APP_NAME,
  APP_VERSION,
  PROJECT_SCHEMA_VERSION,
  type AppPreferences,
  type PageDocument,
  type ProjectTheme,
} from "./types";

export const DEFAULT_AUTOSAVE_INTERVAL_MS = 30_000;

export function newId(prefix = "wz"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "page"
  );
}

export const DEFAULT_FONT_STACK = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

export function createDefaultTheme(overrides?: Partial<ProjectTheme>): ProjectTheme {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name: "Default",
    colors: {
      primary: "#6C4CF1",
      secondary: "#8B5CF6",
      accent: "#C026D3",
      background: "#FFFFFF",
      surface: "#F8F9FC",
      text: "#14161F",
      success: "#16A34A",
      warning: "#D97706",
      danger: "#DC2626",
    },
    fonts: {
      heading: "Inter",
      body: "Inter",
      button: "Inter",
      fallback: DEFAULT_FONT_STACK,
    },
    spacing: { base: 4, scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] },
    radius: { sm: 4, md: 8, lg: 16, pill: 999 },
    shadow: {
      sm: "0 1px 2px rgba(16,18,27,0.06)",
      md: "0 4px 12px rgba(16,18,27,0.08)",
      lg: "0 16px 40px rgba(16,18,27,0.12)",
    },
    animation: { duration: 200, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    extensions: {},
    ...overrides,
  };
}

export function createPage(name: string, opts?: { isHome?: boolean }): PageDocument {
  const slug = opts?.isHome ? "index" : slugify(name);
  const ts = nowIso();
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: newId("page"),
    name,
    slug,
    title: name,
    description: "",
    nodes: [],
    createdAt: ts,
    lastModified: ts,
  };
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  autosaveEnabled: true,
  autosaveIntervalMs: DEFAULT_AUTOSAVE_INTERVAL_MS,
  recentLimit: 12,
  backupFrequency: "onSave",
  language: "en",
  defaultAuthor: "",
};

export const APP_META = { name: APP_NAME, version: APP_VERSION };
