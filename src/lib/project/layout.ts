/**
 * The canonical on-disk layout of a WebEazy project.
 *
 * Kept in one module so ProjectService (writer) and ValidationService
 * (reader/checker) can never drift apart.
 *
 * Project/
 *   project.json          metadata only — never page content
 *   theme.json            global design tokens
 *   pages/                one JSON file per page
 *   assets/{images,videos,fonts,icons}
 *   plugins/
 *   custom/{css,js}
 *   backups/              timestamped snapshots
 *   exports/              generated HTML/ZIP output
 *   settings/{editor.json,preferences.json}
 */
export const REQUIRED_FOLDERS = [
  "pages",
  "assets",
  "assets/images",
  "assets/videos",
  "assets/fonts",
  "assets/icons",
  "plugins",
  "custom",
  "custom/css",
  "custom/js",
  "backups",
  "exports",
  "settings",
] as const;

export const FILE_MANIFEST = "project.json";
export const FILE_THEME = "theme.json";
export const FILE_EDITOR_SETTINGS = "settings/editor.json";
export const FILE_PREFERENCES = "settings/preferences.json";

export function pageFile(slug: string) {
  return `pages/${slug}.json`;
}

export function backupFile(stamp: string) {
  return `backups/project-${stamp}.json`;
}

/** Default contents of settings/editor.json — editor reads this in a later milestone. */
export function defaultEditorSettings() {
  return {
    schemaVersion: 1,
    canvas: { defaultViewport: "desktop", showGrid: true, snapToGrid: true, gridSize: 8 },
    panels: { leftWidth: 260, rightWidth: 300, bottomHeight: 200 },
    code: { fontSize: 13, tabSize: 2, wordWrap: true },
  };
}

/** Default contents of settings/preferences.json — per-project preferences. */
export function defaultProjectPreferences() {
  return {
    schemaVersion: 1,
    autosave: { enabled: true, intervalMs: 30_000 },
    backups: { enabled: true, frequency: "onSave" as const, keep: 10 },
    export: { minify: false, inlineAssets: false },
  };
}
